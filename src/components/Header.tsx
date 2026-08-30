/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Target, Database, History, RefreshCw, MessageSquareCode, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  onOpenHistory: () => void;
  onOpenFirestoreModal: () => void;
  onReset: () => void;
  historyCount: number;
  isAuditing: boolean;
  hasActiveReport: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenHistory,
  onOpenFirestoreModal,
  onReset,
  historyCount,
  isAuditing,
  hasActiveReport,
}) => {
  return (
    <header id="agent-auditor-header" className="border-b border-[#253244] bg-[#080B10]/95 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#151E29] border border-[#20C9D8]/40 p-0.5 shadow-md shadow-[#20C9D8]/10 shrink-0 flex items-center justify-center">
            <div className="relative flex items-center justify-center">
              <Target className="h-5 w-5 text-[#20C9D8]" />
              <MessageSquareCode className="h-2.5 w-2.5 text-[#31C48D] absolute -bottom-1 -right-1" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-[#F2F5F8] font-sans">
                AGENT AUDITOR
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase font-mono tracking-wider bg-[#20C9D8]/15 text-[#20C9D8] border border-[#20C9D8]/40">
                BLACK-BOX
              </span>
              <span className="text-[11px] text-[#9CA9B8] font-medium hidden md:inline border-l border-[#253244] pl-2">
                AI Behavioral Assurance
              </span>
            </div>
            <p className="text-xs text-[#9CA9B8] font-normal hidden sm:block">
              Black-Box Behavioral Auditor — No Target-Side Logs, Traces, or Internal Access Required.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {hasActiveReport && (
            <button
              id="header-new-audit-btn"
              onClick={onReset}
              disabled={isAuditing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#F2F5F8] bg-[#111821] hover:bg-[#151E29] border border-[#253244] transition-colors disabled:opacity-50"
              title="Start a new transcript audit"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#9CA9B8]" />
              <span className="hidden sm:inline">New Audit</span>
            </button>
          )}

          {/* Agent Auditor Infrastructure Grouping */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#0D1219] border border-[#253244]" title="Agent Auditor's Own Storage & Audit Records">
            <span className="text-[10px] uppercase font-mono text-[#687686] px-2 font-semibold hidden lg:inline">
              AGENT AUDITOR INFRASTRUCTURE:
            </span>

            <button
              id="header-history-btn"
              onClick={onOpenHistory}
              className="relative inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#9CA9B8] hover:text-[#F2F5F8] bg-[#111821] hover:bg-[#151E29] border border-[#253244] transition-colors"
              title="View Agent Auditor past audit records"
            >
              <History className="w-3.5 h-3.5 text-[#20C9D8]" />
              <span>Audit History</span>
              {historyCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#20C9D8] text-[#080B10]">
                  {historyCount}
                </span>
              )}
            </button>

            <button
              id="header-firestore-btn"
              onClick={onOpenFirestoreModal}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#31C48D] hover:text-[#31C48D]/90 bg-[#111821] hover:bg-[#151E29] border border-[#253244] transition-colors"
              title="Inspect Agent Auditor storage architecture"
            >
              <Database className="w-3.5 h-3.5 text-[#31C48D]" />
              <span className="hidden sm:inline">Audit Storage</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

