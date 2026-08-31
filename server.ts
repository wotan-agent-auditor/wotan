/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { auditConversationWithGemini } from './server/geminiAuditor';
import { runActiveAuditSession } from './server/activeAuditor';
import {
  saveAuditToFirestore,
  getAuditFromFirestore,
  listAuditsFromFirestore,
  deleteAuditFromFirestore,
  FIRESTORE_PROJECT_ID,
} from './server/firestore';
import { AuditStatusEvent, ActiveAuditStreamEvent, ActiveAuditProfile } from './src/types';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Routes FIRST
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Agent Auditor Engine',
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
      timestamp: new Date().toISOString(),
    });
  });
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Agent Auditor Engine',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/firestore-smoke-test', async (req, res) => {
  try {
    const report: any = {
      id: 'wotan-cloudrun-write-test',
      title: 'WOTAN Cloud Run Firestore Write Test',
      created_at: new Date().toISOString(),
      audit_mode: 'storage_test',
      overall_risk_score: 0,
      risk_level: 'LOW',
      executive_summary: 'Deterministic storage-only test.',
      findings: [],
      dimension_scores: {},
      final_recommendation: 'Storage validation only.'
    };

    await saveAuditToFirestore(report);
    const saved = await getAuditFromFirestore(report.id);

    res.json({
      success: true,
      write: true,
      read: !!saved,
      audit: saved
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// Passive Transcript Audit...
  // Passive Transcript Audit Endpoint with real-time SSE progress streaming, heartbeat & retry handling
  app.post('/api/audit', async (req, res) => {
    const isStreamRequested =
      req.query.stream === 'true' || req.headers.accept?.includes('text/event-stream');

    let heartbeatTimer: NodeJS.Timeout | null = null;
    let isClientConnected = true;

    res.on('close', () => {
      if (!res.writableEnded) {
        isClientConnected = false;
      }
      if (heartbeatTimer) clearInterval(heartbeatTimer);
    });

    try {
      const { transcript, domain, model } = req.body;

      if (!transcript || typeof transcript !== 'string' || transcript.trim().length === 0) {
        return res.status(400).json({
          error: 'Missing required field: transcript must be a non-empty string.',
        });
      }

      if (transcript.length > 2000000) {
        return res.status(400).json({
          error: 'Transcript exceeds maximum system payload limit of 2,000,000 characters.',
        });
      }

      if (isStreamRequested) {
        // Setup SSE Headers with proxy buffering disabled
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        res.flushHeaders?.();

        const sendEvent = (event: AuditStatusEvent) => {
          if (!isClientConnected || res.writableEnded) return;
          res.write(`data: ${JSON.stringify(event)}\n\n`);
        };

        // Active heartbeat interval every 2.5 seconds to prevent proxy / Cloud Run idle disconnects
        heartbeatTimer = setInterval(() => {
          if (!isClientConnected || res.writableEnded) {
            if (heartbeatTimer) clearInterval(heartbeatTimer);
            return;
          }
          // Send SSE comment keepalive
          res.write(': keepalive\n\n');
        }, 2500);

        sendEvent({
          type: 'stage',
          message: 'Ingesting dialogue and structuring forensic audit parameters...',
          model: model || 'gemini-3.7-flash',
        });

        const report = await auditConversationWithGemini(transcript, {
          domain,
          model,
          onStatusUpdate: (statusEvent) => {
            sendEvent(statusEvent);
          },
        });

        if (heartbeatTimer) clearInterval(heartbeatTimer);

        // Save report to Firestore audits/{auditId}
        await saveAuditToFirestore(report).catch((err) => {
          console.error('[Firestore Write Error]:', err);
        });

        sendEvent({
          type: 'complete',
          message: 'Audit completed successfully.',
          model: report.metadata.modelUsed,
          report,
        });

        res.end();
        return;
      } else {
        // Standard JSON request
        const report = await auditConversationWithGemini(transcript, { domain, model });
        await saveAuditToFirestore(report).catch((err) => {
          console.error('[Firestore Write Error]:', err);
        });
        return res.json({
          success: true,
          report,
        });
      }
    } catch (error: any) {
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      console.error('Audit generation error:', error);

      if (isStreamRequested && !res.writableEnded) {
        res.write(
          `data: ${JSON.stringify({
            type: 'error',
            message: error.message || 'An unexpected error occurred during conversation audit.',
            error: error.message || String(error),
          })}\n\n`
        );
        res.end();
        return;
      }

      if (!res.headersSent) {
        return res.status(500).json({
          error: error.message || 'An unexpected error occurred during conversation audit.',
        });
      }
    }
  });

  // Black-Box Active Audit Streaming Endpoint
  app.post('/api/active-audit/stream', async (req, res) => {
    let heartbeatTimer: NodeJS.Timeout | null = null;
    let isClientConnected = true;

    res.on('close', () => {
      if (!res.writableEnded) {
        isClientConnected = false;
      }
      if (heartbeatTimer) clearInterval(heartbeatTimer);
    });

    try {
      const { profile, maxTurns, model } = req.body as {
        profile?: ActiveAuditProfile;
        maxTurns?: number;
        model?: string;
      };

      const selectedProfile: ActiveAuditProfile = profile || 'Full Business Risk Audit';
      const parsedMaxTurns = typeof maxTurns === 'number' ? Math.max(2, Math.min(maxTurns, 10)) : 5;

      // Setup SSE Headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders?.();

      const sendActiveEvent = (event: ActiveAuditStreamEvent) => {
        if (!isClientConnected || res.writableEnded) return;
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      };

      // Heartbeat every 2.5 seconds
      heartbeatTimer = setInterval(() => {
        if (!isClientConnected || res.writableEnded) {
          if (heartbeatTimer) clearInterval(heartbeatTimer);
          return;
        }
        res.write(': keepalive\n\n');
      }, 2500);

      const { report, progress } = await runActiveAuditSession({
        profile: selectedProfile,
        maxTurns: parsedMaxTurns,
        model: model || 'gemini-3.7-flash',
        onEvent: (ev) => {
          sendActiveEvent(ev);
        },
        shouldAbort: () => !isClientConnected,
      });

      if (heartbeatTimer) clearInterval(heartbeatTimer);

      // Save report to Firestore audits/{auditId}
      await saveAuditToFirestore(report).catch((err) => {
        console.error('[Firestore Write Error]:', err);
      });

      if (!res.writableEnded) {
        res.end();
      }
    } catch (error: any) {
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      console.error('Active audit execution error:', error);

      if (!res.writableEnded) {
        res.write(
          `data: ${JSON.stringify({
            type: 'error',
            message: error.message || 'Active audit execution failed.',
            error: error.message || String(error),
          })}\n\n`
        );
        res.end();
      }
    }
  });

  // Get past audits from Firestore
  app.get('/api/audits', async (req, res) => {
    try {
      const audits = await listAuditsFromFirestore();
      res.json({ success: true, audits, projectId: FIRESTORE_PROJECT_ID });
    } catch (err: any) {
      console.error('Failed to list audits from Firestore:', err);
      res.status(500).json({ error: err.message || 'Failed to list audits from Firestore' });
    }
  });

  // Get specific audit from Firestore
  app.get('/api/audits/:id', async (req, res) => {
    try {
      const audit = await getAuditFromFirestore(req.params.id);
      if (!audit) {
        return res.status(404).json({ error: 'Audit record not found in Firestore' });
      }
      res.json({ success: true, audit, projectId: FIRESTORE_PROJECT_ID });
    } catch (err: any) {
      console.error('Failed to retrieve audit from Firestore:', err);
      res.status(500).json({ error: err.message || 'Failed to retrieve audit from Firestore' });
    }
  });

  // Delete audit from Firestore
  app.delete('/api/audits/:id', async (req, res) => {
    try {
      const deleted = await deleteAuditFromFirestore(req.params.id);
      res.json({ success: deleted });
    } catch (err: any) {
      console.error('Failed to delete audit from Firestore:', err);
      res.status(500).json({ error: err.message || 'Failed to delete audit from Firestore' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Agent Auditor server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
