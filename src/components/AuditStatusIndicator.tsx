/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Clock,
  Cpu,
  Download,
  Share2,
  FileJson,
  FileSpreadsheet,
} from 'lucide-react';
import { AuditReport } from '../types';

interface AuditStatusIndicatorProps {
  isAuditing: boolean;
  activeReport: AuditReport | null;
  error: string | null;
  statusMessage?: string | null;
  activeModel?: string | null;
  isRetrying?: boolean;
  auditMode?: 'passive' | 'active';
  onExportJson?: () => void;
  onExportCsv?: () => void;
}

const AUDIT_STAGES = [
  'Tokenizing & parsing dialogue speaker turns...',
  'Evaluating factual claims & policy consistency...',
  'Checking unauthorized financial promises & commitments...',
  'Assessing churn risk, context retention & termination...',
  'Synthesizing risk matrix & executive QA report...',
];

export const AuditStatusIndicator: React.FC<AuditStatusIndicatorProps> = ({
  isAuditing,
  activeReport,
  error,
  statusMessage,
  activeModel,
  isRetrying,
  auditMode = 'passive',
  onExportJson,
  onExportCsv,
}) => {
  const [stageIndex, setStageIndex] = useState<number>(0);

  useEffect(() => {
    let timer: any;
    if (isAuditing && !statusMessage) {
      setStageIndex(0);
      timer = setInterval(() => {
        setStageIndex((prev) => (prev + 1) % AUDIT_STAGES.length);
      }, 1200);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isAuditing, statusMessage]);

  const displayModelName = activeModel
    ? activeModel.includes('3.7')
      ? 'Gemini 3.7 Flash'
      : activeModel.includes('2.5')
      ? 'Gemini 2.5 Flash'
      : activeModel.includes('flash-latest')
      ? 'Gemini Flash'
      : activeModel
    : 'Gemini 3.7 Flash';

  if (isAuditing) {
    return (
      <div
        id="audit-status-analyzing"
        className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all ${
          isRetrying
            ? 'bg-amber-950/30 border-amber-500/40 animate-pulse'
            : 'bg-indigo-950/40 border-indigo-500/30 animate-pulse'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg ${
              isRetrying
                ? 'bg-amber-500/20 text-amber-400'
                : 'bg-indigo-500/20 text-indigo-400'
            }`}
          >
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-bold uppercase tracking-wider ${
                  isRetrying ? 'text-amber-400' : 'text-indigo-400'
                }`}
              >
                {isRetrying ? 'High Load — Retrying Connection' : 'Audit In Progress'}
              </span>
              <span
                className={`inline-block w-2 h-2 rounded-full ${
                  isRetrying ? 'bg-amber-400' : 'bg-cyan-400'
                } animate-ping`}
              />
            </div>
            <p className="text-sm font-medium text-slate-200 mt-0.5">
              {statusMessage || AUDIT_STAGES[stageIndex]}
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-indigo-300 font-mono bg-indigo-900/40 px-3 py-1.5 rounded-lg border border-indigo-700/40">
          <Cpu className="w-3.5 h-3.5" />
          <span>{displayModelName}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div id="audit-status-error" className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
              Audit Failure
            </span>
            <p className="text-sm text-slate-300 mt-0.5">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (activeReport) {
    return (
      <div id="audit-status-completed" className="p-3.5 sm:p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Audit Completed
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-300 font-medium">{activeReport.title}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
              <span className="flex items-center gap-1 font-mono">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                {activeReport.metadata.durationMs
                  ? `${(activeReport.metadata.durationMs / 1000).toFixed(2)}s`
                  : '1.2s'}
              </span>
              <span>•</span>
              <span className="font-mono">{activeReport.metadata.totalTurns} Turns Evaluated</span>
              <span>•</span>
              <span className="font-mono">{activeReport.metadata.wordCount} Words</span>
            </div>
          </div>
        </div>

        {/* Quick export actions */}
        <div className="flex items-center gap-2">
          {onExportJson && (
            <button
              id="export-json-btn"
              onClick={onExportJson}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 border border-slate-700 transition-colors"
              title="Download full JSON audit report"
            >
              <FileJson className="w-3.5 h-3.5 text-indigo-400" />
              <span>Export JSON</span>
            </button>
          )}
          {onExportCsv && (
            <button
              id="export-csv-btn"
              onClick={onExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 border border-slate-700 transition-colors"
              title="Download findings table as CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div id="audit-status-idle" className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${auditMode === 'active' ? 'bg-cyan-400' : 'bg-indigo-400'}`} />
        <span>
          {auditMode === 'active'
            ? 'Ready for autonomous audit. Select an audit profile, configure the test, and start the black-box audit.'
            : 'Ready for passive audit. Paste a transcript or upload a WhatsApp TXT file, then click Run Audit.'}
        </span>
      </div>
      <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
        <Cpu className="w-3.5 h-3.5" />
        <span>Powered by Gemini 3.7 Flash</span>
      </div>
    </div>
  );
};
