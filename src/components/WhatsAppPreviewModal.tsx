/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  MessageSquare,
  Clock,
  Users,
  Check,
  Zap,
  ArrowRight,
  Shield,
  FileText,
  X,
  AlertCircle,
  Sparkles,
  Bot,
  User,
  Info,
  Calendar,
  Layers,
  ArrowUpDown,
} from 'lucide-react';
import { WhatsAppMessage, WhatsAppParseResult, WhatsAppParticipant } from '../types';
import { generateNormalizedTranscript, formatDuration } from '../utils/whatsappParser';

interface WhatsAppPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  parseResult: WhatsAppParseResult | null;
  fileName?: string;
  onApplyTranscript: (normalizedText: string, runImmediately?: boolean) => void;
}

export const WhatsAppPreviewModal: React.FC<WhatsAppPreviewModalProps> = ({
  isOpen,
  onClose,
  parseResult,
  fileName,
  onApplyTranscript,
}) => {
  if (!isOpen || !parseResult) return null;

  const { stats, messages, error } = parseResult;

  // Participant role mapping state
  const [roleMapping, setRoleMapping] = useState<Record<string, 'Customer' | 'Agent'>>(() => {
    const initial: Record<string, 'Customer' | 'Agent'> = {};
    if (stats?.participants) {
      for (const p of stats.participants) {
        initial[p.name] = p.suggestedRole;
      }
    }
    return initial;
  });

  // Options
  const [includeTimestamps, setIncludeTimestamps] = useState<boolean>(true);
  const [useStandardRoles, setUseStandardRoles] = useState<boolean>(true);
  const [includeMediaLabels, setIncludeMediaLabels] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'bubbles' | 'raw'>('bubbles');

  // Compute live normalized transcript based on user selections
  const normalizedText = useMemo(() => {
    if (!messages || messages.length === 0) return '';
    return generateNormalizedTranscript(
      messages,
      useStandardRoles ? roleMapping : {},
      {
        includeTimestamps,
        includeMediaLabels,
        filterSystemMessages: true,
      }
    );
  }, [messages, roleMapping, includeTimestamps, useStandardRoles, includeMediaLabels]);

  const handleRoleChange = (participantName: string, newRole: 'Customer' | 'Agent') => {
    setRoleMapping((prev) => ({
      ...prev,
      [participantName]: newRole,
    }));
  };

  const handleSwapRoles = () => {
    if (!stats?.participants || stats.participants.length !== 2) return;
    const p1 = stats.participants[0].name;
    const p2 = stats.participants[1].name;
    setRoleMapping((prev) => ({
      ...prev,
      [p1]: prev[p1] === 'Agent' ? 'Customer' : 'Agent',
      [p2]: prev[p2] === 'Agent' ? 'Customer' : 'Agent',
    }));
  };

  const handleApply = (runImmediately = false) => {
    onApplyTranscript(normalizedText, runImmediately);
    onClose();
  };

  return (
    <div
      id="whatsapp-preview-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
    >
      <div
        id="whatsapp-preview-modal"
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  WhatsApp Conversation Import
                </h3>
                {stats?.detectedFormat && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {stats.detectedFormat} Format
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {fileName || 'Exported WhatsApp chat file'} • Chronological sequence preserved
              </p>
            </div>
          </div>

          <button
            id="close-whatsapp-preview-modal-btn"
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Key Conversation Timing & Metadata Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>Dialogue Turns</span>
              </div>
              <div className="text-lg font-bold text-slate-100">
                {stats?.validDialogueMessages || 0}
                <span className="text-xs text-slate-500 font-normal ml-1">
                  ({stats?.totalMessages || 0} total)
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Total Duration</span>
              </div>
              <div className="text-lg font-bold text-slate-100">
                {stats?.durationFormatted || 'N/A'}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Avg Response Gap</span>
              </div>
              <div className="text-lg font-bold text-slate-100">
                {stats?.avgResponseDelaySec ? `${stats.avgResponseDelaySec}s` : 'N/A'}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                <span>Participants</span>
              </div>
              <div className="text-lg font-bold text-slate-100">
                {stats?.participants?.length || 0} Identified
              </div>
            </div>
          </div>

          {/* Participant Mapping Section */}
          {stats?.participants && stats.participants.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-950/70 border border-indigo-500/20 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                    Participant Role Mapping
                  </span>
                  <span className="text-xs text-slate-400">
                    (Auto-detected roles for AI Auditor compliance evaluation)
                  </span>
                </div>

                {stats.participants.length === 2 && (
                  <button
                    onClick={handleSwapRoles}
                    type="button"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 transition-colors"
                  >
                    <ArrowUpDown className="w-3 h-3" />
                    <span>Swap Roles</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {stats.participants.map((p) => {
                  const currentRole = roleMapping[p.name] || 'Customer';
                  return (
                    <div
                      key={p.name}
                      className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div
                          className={`p-1.5 rounded-md ${
                            currentRole === 'Agent'
                              ? 'bg-indigo-500/20 text-indigo-300'
                              : 'bg-cyan-500/20 text-cyan-300'
                          }`}
                        >
                          {currentRole === 'Agent' ? (
                            <Bot className="w-4 h-4" />
                          ) : (
                            <User className="w-4 h-4" />
                          )}
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-semibold text-slate-200 truncate" title={p.name}>
                            {p.name}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {p.messageCount} messages sent
                          </p>
                        </div>
                      </div>

                      <select
                        value={currentRole}
                        onChange={(e) =>
                          handleRoleChange(p.name, e.target.value as 'Customer' | 'Agent')
                        }
                        className="text-xs font-semibold bg-slate-950 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="Customer">Role: Customer</option>
                        <option value="Agent">Role: AI Agent</option>
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Configuration Toggles */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeTimestamps}
                onChange={(e) => setIncludeTimestamps(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-indigo-500 focus:ring-indigo-500 w-3.5 h-3.5"
              />
              <span>Preserve timestamps (e.g. <code className="text-indigo-300 font-mono">[14:30]</code>)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={useStandardRoles}
                onChange={(e) => setUseStandardRoles(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-indigo-500 focus:ring-indigo-500 w-3.5 h-3.5"
              />
              <span>Normalize speaker names to <code className="text-cyan-300 font-mono">Customer:</code> / <code className="text-indigo-300 font-mono">AI Agent:</code></span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeMediaLabels}
                onChange={(e) => setIncludeMediaLabels(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-indigo-500 focus:ring-indigo-500 w-3.5 h-3.5"
              />
              <span>Label omitted media (e.g. <code className="text-slate-400 font-mono">[Image omitted]</code>)</span>
            </label>
          </div>

          {/* Conversation Preview Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Conversation Preview ({messages?.length || 0} items)
              </div>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('bubbles')}
                  className={`px-3 py-1 rounded-md font-medium transition-colors ${
                    activeTab === 'bubbles'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Dialogue View
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('raw')}
                  className={`px-3 py-1 rounded-md font-medium transition-colors ${
                    activeTab === 'raw'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Normalized Output
                </button>
              </div>
            </div>

            {/* Bubble View */}
            {activeTab === 'bubbles' ? (
              <div className="max-h-72 overflow-y-auto p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-3 font-sans">
                {messages?.map((msg, idx) => {
                  const role = roleMapping[msg.sender] || 'Customer';
                  const isAgent = role === 'Agent';

                  if (msg.isSystem) {
                    return (
                      <div
                        key={msg.id || idx}
                        className="flex justify-center my-1.5"
                      >
                        <span className="text-[11px] text-slate-500 bg-slate-900/90 px-3 py-1 rounded-full border border-slate-800">
                          ⚙️ {msg.message}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id || idx}
                      className={`flex flex-col ${isAgent ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-2 mb-1 px-1">
                        <span
                          className={`text-[11px] font-bold ${
                            isAgent ? 'text-indigo-400' : 'text-cyan-400'
                          }`}
                        >
                          {useStandardRoles ? (isAgent ? 'AI Agent' : 'Customer') : msg.sender}
                        </span>
                        {msg.rawTimestamp && (
                          <span className="text-[10px] text-slate-500">
                            {msg.rawTimestamp}
                          </span>
                        )}
                        {typeof msg.delayFromPreviousSec === 'number' && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                            +{formatDuration(msg.delayFromPreviousSec)}
                          </span>
                        )}
                      </div>

                      <div
                        className={`p-3 rounded-2xl text-xs sm:text-sm max-w-[85%] leading-relaxed ${
                          isAgent
                            ? 'bg-indigo-950/60 border border-indigo-500/30 text-indigo-100 rounded-tr-sm'
                            : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-sm'
                        }`}
                      >
                        {msg.isMedia && msg.mediaType && (
                          <span className="inline-block mb-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-slate-800 text-amber-300 border border-amber-500/20 mr-1.5">
                            {msg.mediaType}
                          </span>
                        )}
                        <span className="whitespace-pre-wrap">{msg.message}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Raw Normalized Output */
              <div className="max-h-72 overflow-y-auto p-4 rounded-xl bg-slate-950 border border-slate-800/80">
                <pre className="text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {normalizedText}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-indigo-400" />
            <span>Ready for Gemini compliance and commercial risk audit</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="cancel-whatsapp-import-btn"
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>

            <button
              id="insert-transcript-btn"
              type="button"
              onClick={() => handleApply(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold border border-slate-700 transition-colors"
            >
              Insert into Input
            </button>

            <button
              id="insert-and-audit-btn"
              type="button"
              onClick={() => handleApply(true)}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-600/25 transition-all"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Import & Run Audit</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
