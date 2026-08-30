/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  History,
  Trash2,
  Calendar,
  Layers,
  ChevronRight,
  ShieldAlert,
  Search,
  ExternalLink,
} from 'lucide-react';
import { AuditReport } from '../types';
import { getRiskScoreColor } from '../utils/auditHelpers';

interface AuditHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: AuditReport[];
  onSelectAudit: (report: AuditReport) => void;
  onDeleteAudit: (id: string) => void;
  onClearHistory: () => void;
  activeAuditId?: string;
}

export const AuditHistoryDrawer: React.FC<AuditHistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelectAudit,
  onDeleteAudit,
  onClearHistory,
  activeAuditId,
}) => {
  const [search, setSearch] = useState<string>('');

  if (!isOpen) return null;

  const filteredHistory = history.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.riskLevel.toLowerCase().includes(q) ||
      item.executiveSummary.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md bg-slate-900 border-l border-slate-800 h-full shadow-2xl flex flex-col z-10">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <History className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">Audit History</h3>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                  Auditor Infra
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Agent Auditor internal storage • {history.length} saved QA record{history.length === 1 ? '' : 's'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/40">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search previous audits..."
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredHistory.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              <History className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
              <p>No audit sessions found.</p>
            </div>
          ) : (
            filteredHistory.map((item) => {
              const colorInfo = getRiskScoreColor(item.overallRiskScore);
              const isActive = item.id === activeAuditId;
              const dateStr = new Date(item.createdAt).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all relative group cursor-pointer ${
                    isActive
                      ? 'bg-indigo-950/40 border-indigo-500/60 ring-1 ring-indigo-500/30'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                  }`}
                  onClick={() => {
                    onSelectAudit(item);
                    onClose();
                  }}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold text-white truncate group-hover:text-indigo-300 transition-colors">
                        {item.title}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>{dateStr}</span>
                      </div>
                    </div>

                    {/* Risk Score Pill */}
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold border shrink-0 ${
                        item.overallRiskScore >= 75
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          : item.overallRiskScore >= 50
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : item.overallRiskScore >= 25
                          ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      }`}
                    >
                      {item.overallRiskScore} Score
                    </span>
                  </div>

                  {/* Findings breakdown */}
                  <div className="flex items-center justify-between text-xs text-slate-400 mt-3 pt-2.5 border-t border-slate-800/80">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-slate-300">
                        {item.findings.length} findings
                      </span>
                      {item.severityCounts.critical > 0 && (
                        <span className="text-rose-400 font-bold font-mono">
                          {item.severityCounts.critical} Critical
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteAudit(item.id);
                      }}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete this record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer */}
        {history.length > 0 && (
          <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between">
            <button
              type="button"
              onClick={onClearHistory}
              className="text-xs text-rose-400 hover:text-rose-300 font-medium transition-colors"
            >
              Clear All History
            </button>
            <span className="text-[11px] text-slate-500">Auto-saved locally</span>
          </div>
        )}
      </div>
    </div>
  );
};
