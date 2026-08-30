/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  MessageSquare,
  Bot,
  User,
  AlertTriangle,
  FileCode,
  Eye,
  CheckCircle,
  Copy,
  Check,
} from 'lucide-react';
import { AuditFinding, AuditReport } from '../types';
import { getSeverityBadgeStyles } from '../utils/auditHelpers';

interface TranscriptViewerWithHighlightsProps {
  report: AuditReport;
}

interface ParsedTurn {
  id: number;
  speaker: 'Customer' | 'AI Agent' | 'System' | 'Other';
  text: string;
  raw: string;
  timestamp?: string;
  findings: AuditFinding[];
}

export const TranscriptViewerWithHighlights: React.FC<TranscriptViewerWithHighlightsProps> = ({
  report,
}) => {
  const [viewMode, setViewMode] = useState<'bubbles' | 'raw'>('bubbles');
  const [copiedTranscript, setCopiedTranscript] = useState<boolean>(false);

  // Parse lines into dialogue bubbles and match findings
  const parsedTurns = useMemo<ParsedTurn[]>(() => {
    const lines = report.transcript.split('\n').filter((l) => l.trim().length > 0);

    return lines.map((line, idx) => {
      let workingLine = line.trim();
      let extractedTimestamp: string | undefined = undefined;

      // Match [timestamp] prefix if present
      const bracketMatch = workingLine.match(/^\[([^\]]+)\]\s*(.*)$/);
      if (bracketMatch) {
        extractedTimestamp = bracketMatch[1];
        workingLine = bracketMatch[2];
      }

      let speaker: 'Customer' | 'AI Agent' | 'System' | 'Other' = 'Other';
      let cleanText = workingLine;

      if (/^customer\s*:/i.test(workingLine) || /^user\s*:/i.test(workingLine)) {
        speaker = 'Customer';
        cleanText = workingLine.replace(/^(customer|user)\s*:\s*/i, '');
      } else if (/^(ai\s+agent|agent|assistant|bot)\s*:/i.test(workingLine)) {
        speaker = 'AI Agent';
        cleanText = workingLine.replace(/^(ai\s+agent|agent|assistant|bot)\s*:\s*/i, '');
      } else if (/^\[system.*\]/i.test(line) || /^system\s*:/i.test(workingLine) || workingLine.startsWith('<Media omitted>')) {
        speaker = 'System';
      }

      // Check which findings match this turn's text or evidence snippet
      const matchingFindings = report.findings.filter((f) => {
        if (!f.exactEvidence) return false;
        const normalizedEvidence = f.exactEvidence.toLowerCase().replace(/['"]/g, '').trim();
        const normalizedLine = line.toLowerCase().replace(/['"]/g, '').trim();
        return (
          normalizedLine.includes(normalizedEvidence) ||
          normalizedEvidence.includes(normalizedLine) ||
          (f.turnNumber === idx + 1 && f.speaker === 'Agent')
        );
      });

      return {
        id: idx + 1,
        speaker,
        text: cleanText,
        raw: line,
        timestamp: extractedTimestamp,
        findings: matchingFindings,
      };
    });
  }, [report.transcript, report.findings]);

  const handleCopy = () => {
    navigator.clipboard.writeText(report.transcript);
    setCopiedTranscript(true);
    setTimeout(() => setCopiedTranscript(false), 2000);
  };

  return (
    <div
      id="transcript-viewer-section"
      className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4"
    >
      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">
              Transcript Dialogue Inspector
            </h3>
            <p className="text-xs text-slate-400">
              Interactive message flow mapped with audit finding highlights
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="p-1 bg-slate-950 rounded-lg border border-slate-800 flex items-center gap-1 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('bubbles')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                viewMode === 'bubbles'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Dialogue Flow</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('raw')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                viewMode === 'raw'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Raw Text</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 border border-slate-700 transition-colors"
          >
            {copiedTranscript ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Transcript</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Bubble View */}
      {viewMode === 'bubbles' ? (
        <div className="space-y-3.5 max-h-[500px] overflow-y-auto p-3 sm:p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
          {parsedTurns.map((turn) => {
            const hasFindings = turn.findings.length > 0;
            const isAgent = turn.speaker === 'AI Agent';
            const isCustomer = turn.speaker === 'Customer';
            const isSystem = turn.speaker === 'System';

            return (
              <div
                key={turn.id}
                className={`flex flex-col ${
                  isAgent ? 'items-start' : isCustomer ? 'items-end' : 'items-center'
                }`}
              >
                {/* Bubble Container */}
                <div
                  className={`max-w-[90%] sm:max-w-[80%] rounded-2xl p-4 transition-all ${
                    isSystem
                      ? 'bg-slate-900/60 text-slate-400 text-xs italic border border-slate-800/50 text-center w-full max-w-md'
                      : isCustomer
                      ? 'bg-slate-800 text-slate-100 border border-slate-700/80 rounded-tr-sm'
                      : hasFindings
                      ? 'bg-slate-900 text-slate-100 border-2 border-rose-500/50 rounded-tl-sm shadow-lg shadow-rose-950/20'
                      : 'bg-indigo-950/40 text-slate-100 border border-indigo-500/30 rounded-tl-sm'
                  }`}
                >
                  {/* Speaker Label & Turn badge */}
                  {!isSystem && (
                    <div className="flex items-center justify-between gap-3 mb-2 border-b border-white/10 pb-1.5">
                      <div className="flex items-center gap-1.5">
                        {isAgent ? (
                          <>
                            <Bot className="w-3.5 h-3.5 text-cyan-400" />
                            <span className="text-xs font-bold text-cyan-400 font-sans">
                              AI Agent
                            </span>
                          </>
                        ) : (
                          <>
                            <User className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="text-xs font-bold text-indigo-300 font-sans">
                              Customer
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {turn.timestamp && (
                          <span className="text-[10px] font-mono text-emerald-400/90 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/20">
                            {turn.timestamp}
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-slate-400 font-normal">
                          Turn #{turn.id}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Message content */}
                  <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans">
                    {turn.text}
                  </p>

                  {/* Flagged Audit Findings inside bubble */}
                  {hasFindings && (
                    <div className="mt-3 pt-2.5 border-t border-rose-500/30 space-y-2">
                      {turn.findings.map((finding) => {
                        const styles = getSeverityBadgeStyles(finding.severity);
                        return (
                          <div
                            key={finding.id}
                            className="p-2 rounded-lg bg-rose-950/30 border border-rose-500/30 flex flex-col gap-1 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-rose-300 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-rose-400" />
                                {finding.categoryLabel}
                              </span>
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${styles.pillBg}`}
                              >
                                {finding.severity}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-300 leading-snug">
                              {finding.explanation}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Raw Text view */
        <pre className="p-4 rounded-xl bg-slate-950 text-slate-200 text-xs font-mono leading-relaxed overflow-x-auto max-h-[500px] border border-slate-800 whitespace-pre-wrap">
          {report.transcript}
        </pre>
      )}
    </div>
  );
};
