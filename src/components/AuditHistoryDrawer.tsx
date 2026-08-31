/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, History, Trash2, Calendar, Search } from 'lucide-react';
import { AuditReport } from '../types';

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
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const safeHistory = Array.isArray(history)
    ? history.filter(Boolean)
    : [];

  const q = search.trim().toLowerCase();

  const filteredHistory = safeHistory.filter((item) => {
    if (!q) return true;

    const title = String(item?.title ?? '');
    const riskLevel = String(item?.riskLevel ?? '');
    const summary = String(item?.executiveSummary ?? '');

    return (
      title.toLowerCase().includes(q) ||
      riskLevel.toLowerCase().includes(q) ||
      summary.toLowerCase().includes(q)
    );
  });

  const formatDate = (value: any) => {
    try {
      const date =
        value && typeof value.toDate === 'function'
          ? value.toDate()
          : new Date(value);

      return Number.isNaN(date.getTime())
        ? 'Unknown date'
        : date.toLocaleString();
    } catch {
      return 'Unknown date';
    }
  };

  return (
    <div
      className="fixed inset-0"
      style={{ zIndex: 100 }}
      role="dialog"
      aria-modal="true"
      aria-label="Audit History"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close Audit History"
        onClick={onClose}
        className="absolute inset-0 w-full h-full bg-black/75 backdrop-blur-sm cursor-default"
      />

      {/* Stable right-side panel */}
      <section
        className="absolute top-0 right-0 flex flex-col bg-[#0D131C] border-l border-[#253244] shadow-2xl"
        style={{
          zIndex: 101,
          width: 'min(460px, 100vw)',
          height: '100dvh',
        }}
      >
        {/* Header */}
        <header className="shrink-0 p-5 border-b border-[#253244] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#20C9D8]/10 text-[#20C9D8] border border-[#20C9D8]/30">
              <History className="w-5 h-5" />
            </div>

            <div>
              <h2 className="text-base font-bold text-white">
                Audit History
              </h2>
              <p className="text-xs text-slate-400">
                WOTAN audit records • {safeHistory.length}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Search */}
        <div className="shrink-0 p-4 border-b border-[#253244]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search previous audits..."
              className="w-full pl-9 pr-4 py-2.5 bg-[#080B10] border border-[#253244] rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#20C9D8]"
            />
          </div>
        </div>

        {/* Records */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredHistory.length === 0 ? (
            <div className="py-16 text-center">
              <History className="w-9 h-9 mx-auto mb-3 text-slate-600" />
              <p className="text-sm text-slate-400">
                No audit records found.
              </p>
            </div>
          ) : (
            filteredHistory.map((item, index) => {
              const score = Number.isFinite(Number(item?.overallRiskScore))
                ? Number(item.overallRiskScore)
                : 0;

              const findings = Array.isArray(item?.findings)
                ? item.findings
                : [];

              const critical = Number(
                item?.severityCounts?.critical ?? 0
              );

              const title =
                typeof item?.title === 'string' && item.title.trim()
                  ? item.title
                  : `Audit ${index + 1}`;

              const id = String(item?.id ?? `audit-${index}`);
              const active = id === activeAuditId;

              return (
                <article
                  key={id}
                  onClick={() => {
                    onSelectAudit(item);
                    onClose();
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                    active
                      ? 'border-[#20C9D8] bg-[#20C9D8]/10'
                      : 'border-[#253244] bg-[#080B10] hover:border-[#3B4C61]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-white truncate">
                        {title}
                      </h3>

                      <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500">
                        <Calendar className="w-3 h-3" />
                        {formatDate(item?.createdAt)}
                      </div>
                    </div>

                    <span className="shrink-0 px-2 py-1 rounded-md border border-[#253244] bg-[#111821] text-xs font-mono text-white">
                      {score}/100
                    </span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-[#253244] flex items-center justify-between">
                    <div className="flex gap-3 text-[11px] text-slate-400">
                      <span>{findings.length} findings</span>
                      {critical > 0 && (
                        <span className="text-rose-400 font-semibold">
                          {critical} Critical
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      title="Delete audit"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (item?.id) onDeleteAudit(String(item.id));
                      }}
                      className="p-1.5 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>

        {/* Footer */}
        {safeHistory.length > 0 && (
          <footer className="shrink-0 p-4 border-t border-[#253244] flex justify-between items-center">
            <span className="text-[11px] text-slate-500">
              WOTAN Audit Storage
            </span>

            <button
              type="button"
              onClick={onClearHistory}
              className="text-xs text-rose-400 hover:text-rose-300"
            >
              Clear All History
            </button>
          </footer>
        )}
      </section>
    </div>
  );
};
