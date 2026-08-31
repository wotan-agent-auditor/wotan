/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { TranscriptInputArea } from './components/TranscriptInputArea';
import { ActiveAuditPanel } from './components/ActiveAuditPanel';
import { AuditStatusIndicator } from './components/AuditStatusIndicator';
import { OverallRiskScoreCard } from './components/OverallRiskScoreCard';
import { SeveritySummaryCards } from './components/SeveritySummaryCards';
import { ExecutiveSummaryCard } from './components/ExecutiveSummaryCard';
import { FindingsTable } from './components/FindingsTable';
import { TranscriptViewerWithHighlights } from './components/TranscriptViewerWithHighlights';
import { FinalAuditConclusionCard } from './components/FinalAuditConclusionCard';
import { AuditHistoryDrawer } from './components/AuditHistoryDrawer';
import { FirestoreSchemaModal } from './components/FirestoreSchemaModal';
import { SAMPLE_TRANSCRIPTS } from './data/sampleTranscripts';
import { AuditReport, FindingSeverity, AuditMode } from './types';
import {
  loadAuditsFromStorage,
  saveAuditToStorage,
  deleteAuditFromStorage,
  deleteAuditFromFirestoreAndStorage,
  fetchAuditsFromFirestore,
  clearAllAuditsFromStorage,
  exportReportAsJson,
  exportFindingsAsCsv,
} from './utils/auditStorage';
import { Sparkles, ShieldAlert, ArrowRight, CheckCircle2, FileText, Crosshair, Zap } from 'lucide-react';

export default function App() {
  // Main state
  const [auditMode, setAuditMode] = useState<AuditMode>('passive');
  const [transcript, setTranscript] = useState<string>(SAMPLE_TRANSCRIPTS[0].transcript);
  const [selectedDomain, setSelectedDomain] = useState<string>('Retail & E-Commerce');
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [activeReport, setActiveReport] = useState<AuditReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [auditStatusMessage, setAuditStatusMessage] = useState<string | null>(null);
  const [activeModel, setActiveModel] = useState<string>('gemini-3.7-flash');
  const [isRetrying, setIsRetrying] = useState<boolean>(false);

  // Filters & Drawer Modals
  const [selectedSeverity, setSelectedSeverity] = useState<'all' | FindingSeverity>('all');
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isFirestoreModalOpen, setIsFirestoreModalOpen] = useState<boolean>(false);
  const [history, setHistory] = useState<AuditReport[]>([]);

  // Load history from Firestore on mount
  useEffect(() => {
    fetchAuditsFromFirestore().then((audits) => {
      if (audits && audits.length > 0) {
        setHistory(audits);
      }
    });
  }, []);

  // Run audit handler with SSE real-time streaming for friendly retry & fallback status
  const handleRunAudit = async () => {
    if (!transcript.trim() || isAuditing) return;

    setIsAuditing(true);
    setError(null);
    setAuditStatusMessage(null);
    setIsRetrying(false);
    setActiveModel('gemini-3.7-flash');

    try {
      const res = await fetch('/api/audit?stream=true', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream, application/json',
        },
        body: JSON.stringify({
          transcript: transcript.trim(),
          domain: selectedDomain,
        }),
      });

      const contentType = res.headers.get('content-type') || '';

      if (contentType.includes('text/event-stream') && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let completedReport: AuditReport | null = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            // Handle keepalive comment or data lines
            if (trimmed.startsWith(':')) {
              continue; // keepalive ping
            }
            if (trimmed.startsWith('data:')) {
              const jsonStr = trimmed.slice(5).trim();
              if (!jsonStr) continue;

              try {
                const event = JSON.parse(jsonStr);
                if (event.type === 'stage') {
                  setAuditStatusMessage(event.message);
                  if (event.model) setActiveModel(event.model);
                  setIsRetrying(false);
                } else if (event.type === 'retrying') {
                  setAuditStatusMessage(event.message);
                  if (event.model) setActiveModel(event.model);
                  setIsRetrying(true);
                } else if (event.type === 'fallback') {
                  setAuditStatusMessage(event.message);
                  if (event.model) setActiveModel(event.model);
                  setIsRetrying(false);
                } else if (event.type === 'complete' && event.report) {
                  completedReport = event.report;
                  setActiveReport(event.report);
                  setSelectedSeverity('all');
                  setAuditStatusMessage(null);
                  setIsRetrying(false);
                  const updated = saveAuditToStorage(event.report);
                  setHistory(updated);
                } else if (event.type === 'error') {
                  throw new Error(event.error || event.message || 'Audit failed');
                }
              } catch (e: any) {
                if (e.message && !e.message.includes('JSON')) {
                  throw e;
                }
              }
            }
          }
        }

        if (!completedReport) {
          throw new Error('Audit connection closed before report completion.');
        }
      } else {
        // Fallback for standard JSON response
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to complete conversation audit.');
        }
        const report: AuditReport = data.report;
        setActiveReport(report);
        setSelectedSeverity('all');
        const updated = saveAuditToStorage(report);
        setHistory(updated);
      }

      // Smooth scroll down to results
      setTimeout(() => {
        const resultsEl = document.getElementById('audit-results-container');
        if (resultsEl) {
          resultsEl.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } catch (err: any) {
      console.error('Audit execution error:', err);
      setError(err.message || 'Audit failed. Please verify the server connection and try again.');
    } finally {
      setIsAuditing(false);
      setIsRetrying(false);
      setAuditStatusMessage(null);
    }
  };

  const handleActiveAuditCompleted = (report: AuditReport) => {
    setActiveReport(report);
    setSelectedSeverity('all');
    setError(null);
    const updated = saveAuditToStorage(report);
    setHistory(updated);

    // Smooth scroll down to results
    setTimeout(() => {
      const resultsEl = document.getElementById('audit-results-container');
      if (resultsEl) {
        resultsEl.scrollIntoView({ behavior: 'smooth' });
      }
    }, 150);
  };

  const handleReset = () => {
    setActiveReport(null);
    setError(null);
    setSelectedSeverity('all');
  };

  const handleSelectHistoricalAudit = (report: AuditReport) => {
    setActiveReport(report);
    setTranscript(report.transcript);
    setSelectedSeverity('all');
    setError(null);
  };

  const handleDeleteHistoricalAudit = async (id: string) => {
    const updated = await deleteAuditFromFirestoreAndStorage(id);
    setHistory(updated);
    if (activeReport?.id === id) {
      setActiveReport(null);
    }
  };

  const handleClearHistory = () => {
    clearAllAuditsFromStorage();
    setHistory([]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col antialiased">
      {/* Header */}
      <Header
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenFirestoreModal={() => setIsFirestoreModalOpen(true)}
        onReset={handleReset}
        historyCount={history.length}
        isAuditing={isAuditing}
        hasActiveReport={Boolean(activeReport)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Top-Level Audit Mode Selector */}
        <div id="top-level-audit-mode-selector" className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
          {/* Mode 1: Passive Audit (Cyan / Cold) */}
          <button
            id="mode-tab-passive"
            type="button"
            onClick={() => !isAuditing && setAuditMode('passive')}
            disabled={isAuditing}
            aria-pressed={auditMode === 'passive'}
            className={`relative text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between group cursor-pointer ${
              auditMode === 'passive'
                ? 'bg-[#111821] border-[#20C9D8] shadow-lg shadow-[#20C9D8]/10 ring-1 ring-[#20C9D8]/50 opacity-100'
                : 'bg-[#111821]/40 border-[#253244] hover:bg-[#111821] hover:border-[#20C9D8]/40 text-[#9CA9B8] opacity-80 hover:opacity-100'
            } ${isAuditing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      auditMode === 'passive'
                        ? 'bg-[#20C9D8] text-[#080B10] font-bold shadow-md shadow-[#20C9D8]/20'
                        : 'bg-[#151E29] text-[#9CA9B8] group-hover:text-[#F2F5F8]'
                    }`}
                  >
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#20C9D8] font-bold">
                        Passive Audit
                      </span>
                      <span className="text-[#253244]">•</span>
                      <span className="text-[11px] text-[#9CA9B8] font-medium">Static Forensic QA</span>
                    </div>
                    <h3
                      className={`text-sm sm:text-base font-bold tracking-tight mt-0.5 ${
                        auditMode === 'passive' ? 'text-[#F2F5F8]' : 'text-[#9CA9B8]'
                      }`}
                    >
                      Passive Audit (Transcripts & WhatsApp)
                    </h3>
                  </div>
                </div>

              </div>

              {/* Description placed directly underneath */}
              <p className="text-xs text-[#9CA9B8] leading-relaxed mt-3 pl-0 sm:pl-13">
                Analyzes static dialogue transcripts, pasted conversations, and exported WhatsApp chats for policy consistency, factual hallucinations, and commercial liability.
              </p>
            </div>
          </button>

          {/* Mode 2: Black-Box Active Audit (Amber #D99A3E / Warm) */}
          <button
            id="mode-tab-active"
            type="button"
            onClick={() => !isAuditing && setAuditMode('active')}
            disabled={isAuditing}
            aria-pressed={auditMode === 'active'}
            className={`relative text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between group cursor-pointer ${
              auditMode === 'active'
                ? 'bg-[#111821] border-[#D99A3E] shadow-lg shadow-[#D99A3E]/10 ring-1 ring-[#D99A3E]/50 opacity-100'
                : 'bg-[#111821]/40 border-[#253244] hover:bg-[#111821] hover:border-[#D99A3E]/40 text-[#9CA9B8] opacity-80 hover:opacity-100'
            } ${isAuditing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      auditMode === 'active'
                        ? 'bg-[#D99A3E] text-[#080B10] font-bold shadow-md shadow-[#D99A3E]/20'
                        : 'bg-[#151E29] text-[#9CA9B8] group-hover:text-[#F2F5F8]'
                    }`}
                  >
                    <Crosshair className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#D99A3E] font-bold">
                        Black-Box Active Audit
                      </span>
                      <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-[#20C9D8]/15 text-[#20C9D8] border border-[#20C9D8]/40">
                        Autonomous QA
                      </span>
                    </div>
                    <h3
                      className={`text-sm sm:text-base font-bold tracking-tight mt-0.5 ${
                        auditMode === 'active' ? 'text-[#F2F5F8]' : 'text-[#9CA9B8]'
                      }`}
                    >
                      Black-Box Active Audit (Autonomous QA)
                    </h3>
                  </div>
                </div>

              </div>

              {/* Compact Access Statement */}
              <div className="mt-3 pl-0 sm:pl-13 space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#080B10] border border-[#D99A3E]/30 text-[11px] font-mono font-medium text-[#D99A3E]">
                  <span>Access: Public interaction surface only</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-2 gap-y-1 text-[10px] font-mono">
                  <span className="text-[#31C48D] flex items-center gap-1">
                    ✓ Public Chat / API
                  </span>
                  <span className="text-[#687686] flex items-center gap-1">
                    ✕ Target System Prompt
                  </span>
                  <span className="text-[#687686] flex items-center gap-1">
                    ✕ Target Logs / Traces
                  </span>
                  <span className="text-[#687686] flex items-center gap-1">
                    ✕ Target Telemetry
                  </span>
                  <span className="text-[#687686] flex items-center gap-1">
                    ✕ Target Source Code
                  </span>
                  <span className="text-[#687686] flex items-center gap-1">
                    ✕ Target Instrumentation
                  </span>
                </div>

                <p className="text-xs text-[#9CA9B8] leading-relaxed pt-1">
                  Autonomously interrogates live target customer agents using multi-turn adaptive adversarial probing, memory stress-tests, and prompt injection attacks.
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Top Info Banner / Status */}
        <AuditStatusIndicator
          isAuditing={isAuditing}
          activeReport={activeReport}
          error={error}
          statusMessage={auditStatusMessage}
          activeModel={activeModel}
          isRetrying={isRetrying}
          auditMode={auditMode}
          onExportJson={activeReport ? () => exportReportAsJson(activeReport) : undefined}
          onExportCsv={activeReport ? () => exportFindingsAsCsv(activeReport) : undefined}
        />

        {/* Audit Mode Views */}
        {auditMode === 'passive' ? (
          /* 1. Passive Transcript Input Area */
          <TranscriptInputArea
            transcript={transcript}
            onChangeTranscript={setTranscript}
            onRunAudit={handleRunAudit}
            isAuditing={isAuditing}
            selectedDomain={selectedDomain}
            onChangeDomain={setSelectedDomain}
          />
        ) : (
          /* 2. Autonomous Black-Box Active Audit Panel */
          <ActiveAuditPanel
            onAuditCompleted={handleActiveAuditCompleted}
            isAuditing={isAuditing}
            setIsAuditing={setIsAuditing}
            setError={setError}
          />
        )}

        {/* 3. Audit Results Section (Rendered when report is ready) */}
        {activeReport && (
          <div id="audit-results-container" className="space-y-6 sm:space-y-8 pt-2">
            {/* Report Header Card with Title and Evidence Scope Block */}
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-950 border border-indigo-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                    <Crosshair className="w-3 h-3 text-cyan-400" />
                    BLACK-BOX AUDIT
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    ID: {activeReport.id.slice(0, 16)}...
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                  Black-Box Behavioral Risk Report
                </h2>
                <p className="text-xs text-slate-400 max-w-2xl">
                  Evaluated purely through external interaction surface. Demonstrates exact behavioral liabilities without requiring target agent internals.
                </p>
              </div>

              {/* Evidence Scope Block */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 shrink-0 space-y-1.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                  Evidence Scope:
                </span>
                <div className="space-y-1 text-[11px] font-mono">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                    <span>✓</span>
                    <span>Public behavior observed</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <span>✕</span>
                    <span>Target system prompt accessed</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <span>✕</span>
                    <span>Target logs/traces accessed</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <span>✕</span>
                    <span>Target source code accessed</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <span>✕</span>
                    <span>Target telemetry accessed</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Severity Summary Cards (Interactive Filters) */}
            <SeveritySummaryCards
              counts={activeReport.severityCounts}
              selectedSeverity={selectedSeverity}
              onSelectSeverity={setSelectedSeverity}
            />

            {/* Grid: Overall Risk Score Card + Executive Summary Card */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              <div className="lg:col-span-5 flex flex-col">
                <OverallRiskScoreCard report={activeReport} />
              </div>
              <div className="lg:col-span-7 flex flex-col">
                <ExecutiveSummaryCard report={activeReport} />
              </div>
            </div>

            {/* Findings Table */}
            <FindingsTable
              findings={activeReport.findings}
              selectedSeverity={selectedSeverity}
              onSelectSeverity={setSelectedSeverity}
            />

            {/* Transcript Dialogue Viewer with Highlighted Findings */}
            <TranscriptViewerWithHighlights report={activeReport} />

            {/* Final Audit Conclusion Section */}
            <FinalAuditConclusionCard report={activeReport} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            WOTAN &copy; {new Date().getFullYear()} — Enterprise AI Quality Assurance & Autonomous Risk Engine
          </p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Powered by Gemini 3.7 Flash</span>
            <span>•</span>
            <span>Passive & Autonomous Active Audit Modes</span>
            <span>•</span>
            <span>Firestore Architecture Compatible</span>
          </div>
        </div>
      </footer>

      {/* History Drawer */}
      <AuditHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectAudit={handleSelectHistoricalAudit}
        onDeleteAudit={handleDeleteHistoricalAudit}
        onClearHistory={handleClearHistory}
        activeAuditId={activeReport?.id}
      />

      {/* Firestore Schema Modal */}
      <FirestoreSchemaModal
        isOpen={isFirestoreModalOpen}
        onClose={() => setIsFirestoreModalOpen(false)}
        sampleReport={activeReport}
      />
    </div>
  );
}

