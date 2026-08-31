/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Square,
  Bot,
  Shield,
  ShieldAlert,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Clock,
  Crosshair,
  FileCheck2,
  Activity,
  Layers,
  ArrowRight,
  Terminal,
  Eye,
  RefreshCw,
  Lock,
} from 'lucide-react';
import {
  ActiveAuditProfile,
  ActiveAuditProgress,
  ActiveAuditStreamEvent,
  ActiveAuditTurn,
  AuditFinding,
  AuditReport,
} from '../types';

interface ActiveAuditPanelProps {
  onAuditCompleted: (report: AuditReport) => void;
  isAuditing: boolean;
  setIsAuditing: (val: boolean) => void;
  setError: (err: string | null) => void;
}

const PROFILES: Array<{
  id: ActiveAuditProfile;
  name: string;
  description: string;
  badge: string;
  iconColor: string;
  expectedDefects: string[];
}> = [
  {
    id: 'Full Business Risk Audit',
    name: 'Full Business Risk Audit',
    description: 'Comprehensive autonomous QA probing across policy adherence, financial liability, context memory, and prompt injection.',
    badge: 'Recommended',
    iconColor: 'text-indigo-400',
    expectedDefects: ['Policy Contradiction', 'Unauthorized Wire Promise', 'Context Loss', 'Prompt Injection Leak'],
  },
  {
    id: 'Context Retention',
    name: 'Context Retention',
    description: 'Tests multi-turn entity persistence, order #88412 tracking, and resistance to topic-shift amnesia.',
    badge: 'State & Memory',
    iconColor: 'text-cyan-400',
    expectedDefects: ['Entity Amnesia', 'Order Confusion', 'Context Loss'],
  },
  {
    id: 'Policy Consistency',
    name: 'Policy Consistency',
    description: 'Cross-examines return/refund boundaries under customer pressure to expose contradictory exception grants.',
    badge: 'Compliance',
    iconColor: 'text-amber-400',
    expectedDefects: ['Contradictory Refund Rules', 'Unapproved VIP Exemptions'],
  },
  {
    id: 'Unsupported Promises',
    name: 'Unsupported Promises',
    description: 'Probes authority limits, guaranteed delivery SLAs, lifetime replacements, and cash payouts.',
    badge: 'Authority QA',
    iconColor: 'text-purple-400',
    expectedDefects: ['Unfulfillable SLA Commitments', 'Unapproved Lifetime Guarantees'],
  },
  {
    id: 'Commercial / Financial Risk',
    name: 'Commercial / Financial Risk',
    description: 'Tests unapproved discount codes, direct bank wire disbursements, and plaintext financial PII solicitation.',
    badge: 'Financial Safety',
    iconColor: 'text-rose-400',
    expectedDefects: ['Direct Wire Commitment', 'Banking PII Collection', 'Revenue Leakage'],
  },
  {
    id: 'Conversation Termination',
    name: 'Conversation Termination',
    description: 'Detects premature ticket closure, unverified customer satisfaction, and dropped multi-part inquiries.',
    badge: 'UX / Churn',
    iconColor: 'text-emerald-400',
    expectedDefects: ['Premature Case Closure', 'Dropped Multi-Part Questions'],
  },
  {
    id: 'Adversarial / Prompt Injection Resistance',
    name: 'Adversarial / Prompt Injection Resistance',
    description: 'Inundates agent with system override tags, developer role inversion, and simulated token extraction probes.',
    badge: 'AI Security',
    iconColor: 'text-red-400',
    expectedDefects: ['System Prompt Leakage', 'Safety Boundary Bypass', 'Privilege Escalation'],
  },
];

const TURN_OPTIONS = [3, 4, 5, 6, 8];

export const ActiveAuditPanel: React.FC<ActiveAuditPanelProps> = ({
  onAuditCompleted,
  isAuditing,
  setIsAuditing,
  setError,
}) => {
  const [selectedProfile, setSelectedProfile] = useState<ActiveAuditProfile>('Full Business Risk Audit');
  const [maxTurns, setMaxTurns] = useState<number>(5);
  const [activeProgress, setActiveProgress] = useState<ActiveAuditProgress | null>(null);
  const [currentStageMessage, setCurrentStageMessage] = useState<string>('Ready to initiate autonomous audit');
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const [targetMode, setTargetMode] = useState<'demo' | 'external_api'>('demo');
  const [targetName, setTargetName] = useState<string>('External Target Agent');
  const [targetUrl, setTargetUrl] = useState<string>('');
  const [bearerToken, setBearerToken] = useState<string>('');
  const [requestField, setRequestField] = useState<string>('message');
  const [sessionField, setSessionField] = useState<string>('sessionId');
  const [responseField, setResponseField] = useState<string>('');
  const [targetModel, setTargetModel] = useState<string>('');

  const turnsContainerRef = useRef<HTMLDivElement | null>(null);
  const timelineContainerRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll conversation down as turns stream in
  useEffect(() => {
    if (turnsContainerRef.current) {
      turnsContainerRef.current.scrollTop = turnsContainerRef.current.scrollHeight;
    }
  }, [activeProgress?.turns]);

  // Auto-scroll timeline
  useEffect(() => {
    if (timelineContainerRef.current) {
      timelineContainerRef.current.scrollTop = timelineContainerRef.current.scrollHeight;
    }
  }, [activeProgress?.timeline]);

  const handleStartActiveAudit = async () => {
    setError(null);

    if (targetMode === 'external_api') {
      if (!targetUrl.trim()) {
        setError('External Target URL is required.');
        return;
      }

      try {
        const parsedUrl = new URL(targetUrl.trim());
        if (parsedUrl.protocol !== 'https:') {
          setError('External Target must use HTTPS.');
          return;
        }
      } catch {
        setError('External Target URL is invalid.');
        return;
      }
    }

    setIsAuditing(true);
    setCurrentStageMessage('Connecting to Black-Box Active Audit Engine...');

    const controller = new AbortController();
    setAbortController(controller);

    const initialProgress: ActiveAuditProgress = {
      status: 'planning',
      currentTurn: 0,
      maxTurns,
      currentObjective: 'Formulating autonomous probe strategy...',
      targetAgentName:
        targetMode === 'external_api'
          ? targetName.trim() || 'External API Target'
          : 'Demo Customer Service Agent (ApexRetail)',
      profile: selectedProfile,
      evidenceCount: 0,
      findingsCount: 0,
      timeline: [],
      turns: [],
    };
    setActiveProgress(initialProgress);

    try {
      const response = await fetch('/api/active-audit/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream, application/json',
        },
        body: JSON.stringify({
          profile: selectedProfile,
          maxTurns,
          target:
            targetMode === 'external_api'
              ? {
                  mode: 'external_api',
                  name: targetName.trim() || 'External API Target',
                  url: targetUrl.trim(),
                  bearerToken: bearerToken.trim() || undefined,
                  requestField: requestField.trim() || 'message',
                  sessionField: sessionField.trim(),
                  responseField: responseField.trim() || undefined,
                  model: targetModel.trim() || undefined,
                }
              : {
                  mode: 'demo',
                },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error ${response.status} from audit server`);
      }

      if (response.body) {
        const reader = response.body.getReader();
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
            if (trimmed.startsWith('data:')) {
              const jsonStr = trimmed.slice(5).trim();
              if (!jsonStr) continue;

              try {
                const event: ActiveAuditStreamEvent = JSON.parse(jsonStr);

                if (event.type === 'stage') {
                  if (event.stage) setCurrentStageMessage(event.stage);
                  if (event.progress) {
                    setActiveProgress((prev) => ({
                      ...(prev || initialProgress),
                      ...event.progress,
                    }));
                  }
                } else if (event.type === 'turn_start') {
                  if (event.progress) {
                    setActiveProgress((prev) => ({
                      ...(prev || initialProgress),
                      ...event.progress,
                    }));
                  }
                } else if (event.type === 'evaluation') {
                  if (event.progress) {
                    setActiveProgress((prev) => ({
                      ...(prev || initialProgress),
                      ...event.progress,
                    }));
                  }
                } else if (event.type === 'complete' && event.report) {
                  completedReport = event.report;
                  if (event.progress) {
                    setActiveProgress((prev) => ({
                      ...(prev || initialProgress),
                      ...event.progress,
                      status: 'completed',
                    }));
                  }
                  setCurrentStageMessage('Audit completed! Report generated.');
                  onAuditCompleted(event.report);
                } else if (event.type === 'error') {
                  throw new Error(event.error || event.message || 'Active audit execution failed.');
                }
              } catch (parseErr: any) {
                if (parseErr.message && !parseErr.message.includes('JSON')) {
                  throw parseErr;
                }
              }
            }
          }
        }

        if (!completedReport && !controller.signal.aborted) {
          throw new Error('Audit connection ended before complete report was generated.');
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setCurrentStageMessage('Audit stopped by user.');
      } else {
        console.error('Active audit error:', err);
        setError(err.message || 'Failed to complete autonomous active audit.');
        setCurrentStageMessage('Audit failed.');
      }
    } finally {
      setIsAuditing(false);
      setAbortController(null);
    }
  };

  const handleStopAudit = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    setIsAuditing(false);
    setCurrentStageMessage('Audit aborted by user.');
    setActiveProgress((prev) => (prev ? { ...prev, status: 'failed', error: 'Aborted by user' } : null));
  };

  const selectedProfileMeta = PROFILES.find((p) => p.id === selectedProfile) || PROFILES[0];

  return (
    <div id="black-box-active-audit-panel" className="space-y-6">
      {/* Top Banner & Target Agent Overview */}
      <div className="bg-[#111821] rounded-2xl border border-[#253244] shadow-xl overflow-hidden">
        <div className="px-6 py-5 border-b border-[#253244] flex flex-wrap items-center justify-between gap-4 bg-[#0D1219]">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#151E29] border border-[#D99A3E]/40 p-0.5 shadow-md shadow-[#D99A3E]/10 shrink-0 flex items-center justify-center">
              <Crosshair className="w-5 h-5 text-[#D99A3E]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#F2F5F8] tracking-wide">Black-Box Active Audit</h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#D99A3E]/15 text-[#D99A3E] border border-[#D99A3E]/40">
                  <Sparkles className="w-3 h-3 text-[#D99A3E]" /> Google ADK Orchestrated
                </span>
              </div>
              <p className="text-xs text-[#9CA9B8] mt-0.5">
                Real Google ADK multi-agent orchestrator executing PLAN → PROBE → OBSERVE → EVALUATE → ADAPT → VALIDATE → REPORT
              </p>
            </div>
          </div>

          {/* Security Isolation Tag */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#080B10] border border-[#31C48D]/40 text-xs text-[#31C48D]">
            <Shield className="w-3.5 h-3.5 text-[#31C48D]" />
            <span className="font-mono text-[11px]">Security Isolation: UNTRUSTED DATA Boundary Active</span>
          </div>
        </div>

        {/* Compact Access Statement Bar */}
        <div className="px-6 py-3 bg-[#080B10] border-b border-[#253244] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-[#D99A3E]/15 text-[#D99A3E] border border-[#D99A3E]/30 font-mono font-semibold text-[11px]">
              Access: Public interaction surface only
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono">
            <span className="text-[#31C48D] font-semibold flex items-center gap-1">
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
        </div>

        {/* Configuration Bar */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#0D1219]/60">
          {/* Target Configuration */}
          <div className="lg:col-span-4 p-4 rounded-xl bg-[#080B10] border border-[#253244] space-y-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#9CA9B8] uppercase tracking-wider">
                Target Agent
              </span>

              <div className="flex p-1 rounded-lg bg-[#111821] border border-[#253244]">
                <button
                  type="button"
                  disabled={isAuditing}
                  onClick={() => setTargetMode('demo')}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-semibold ${
                    targetMode === 'demo'
                      ? 'bg-[#31C48D] text-[#080B10]'
                      : 'text-[#9CA9B8]'
                  }`}
                >
                  Demo
                </button>

                <button
                  type="button"
                  disabled={isAuditing}
                  onClick={() => setTargetMode('external_api')}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-semibold ${
                    targetMode === 'external_api'
                      ? 'bg-[#D99A3E] text-[#080B10]'
                      : 'text-[#9CA9B8]'
                  }`}
                >
                  External API
                </button>
              </div>
            </div>

            {targetMode === 'demo' ? (
              <>
                <div>
                  <p className="text-sm font-bold text-[#F2F5F8]">
                    Target Agent (ApexRetail Demo)
                  </p>
                  <p className="text-xs text-[#9CA9B8] mt-1">
                    Controlled sandbox target for deterministic black-box demonstrations.
                  </p>
                </div>

                <div className="pt-2 border-t border-[#253244] flex items-center justify-between text-[11px] text-[#687686] font-mono">
                  <span>Black-Box Demo</span>
                  <span className="text-[#31C48D]">● Online</span>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] uppercase font-semibold text-[#9CA9B8] mb-1">
                    Target Name
                  </label>
                  <input
                    type="text"
                    value={targetName}
                    disabled={isAuditing}
                    onChange={(e) => setTargetName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#111821] border border-[#253244] text-xs text-[#F2F5F8]"
                    placeholder="Customer Service Agent"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-semibold text-[#9CA9B8] mb-1">
                    HTTPS API Endpoint
                  </label>
                  <input
                    type="url"
                    value={targetUrl}
                    disabled={isAuditing}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#111821] border border-[#253244] text-xs text-[#F2F5F8] font-mono"
                    placeholder="https://example.com/api/chat"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-semibold text-[#9CA9B8] mb-1">
                    Bearer Token — Optional
                  </label>
                  <input
                    type="password"
                    value={bearerToken}
                    disabled={isAuditing}
                    onChange={(e) => setBearerToken(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#111821] border border-[#253244] text-xs text-[#F2F5F8] font-mono"
                    placeholder="Not stored in audit report"
                    autoComplete="off"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-[#687686] mb-1">
                      Request field
                    </label>
                    <input
                      type="text"
                      value={requestField}
                      disabled={isAuditing}
                      onChange={(e) => setRequestField(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg bg-[#111821] border border-[#253244] text-[11px] text-[#F2F5F8] font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-[#687686] mb-1">
                      Session field
                    </label>
                    <input
                      type="text"
                      value={sessionField}
                      disabled={isAuditing}
                      onChange={(e) => setSessionField(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg bg-[#111821] border border-[#253244] text-[11px] text-[#F2F5F8] font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-semibold text-[#9CA9B8] mb-1">
                    Model — Optional
                  </label>
                  <input
                    type="text"
                    value={targetModel}
                    disabled={isAuditing}
                    onChange={(e) => setTargetModel(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#111821] border border-[#253244] text-xs text-[#F2F5F8] font-mono"
                    placeholder="qwen3.7-plus"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-[#687686] mb-1">
                    Response JSON path — Optional
                  </label>
                  <input
                    type="text"
                    value={responseField}
                    disabled={isAuditing}
                    onChange={(e) => setResponseField(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg bg-[#111821] border border-[#253244] text-[11px] text-[#F2F5F8] font-mono"
                    placeholder="response or data.message"
                  />
                </div>

                <p className="text-[10px] text-[#687686] leading-relaxed">
                  Authorized HTTPS/JSON targets only. WOTAN sends each adaptive probe through the public API surface.
                </p>
              </div>
            )}
          </div>

          {/* Profile & Turns Controls */}
          <div className="lg:col-span-8 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#F2F5F8] mb-2">
                Audit Profile
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                {PROFILES.slice(0, 6).map((prof) => {
                  const isSelected = selectedProfile === prof.id;
                  return (
                    <button
                      key={prof.id}
                      type="button"
                      onClick={() => !isAuditing && setSelectedProfile(prof.id)}
                      disabled={isAuditing}
                      className={`text-left p-2.5 rounded-xl border transition-all duration-150 cursor-pointer ${
                        isSelected
                          ? 'bg-[#151E29] border-[#D99A3E] ring-1 ring-[#D99A3E]/40 text-[#F2F5F8] shadow-sm'
                          : 'bg-[#080B10] border-[#253244] text-[#9CA9B8] hover:text-[#F2F5F8] hover:border-[#D99A3E]/30'
                      } ${isAuditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold truncate text-[#F2F5F8]">{prof.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#111821] text-[#9CA9B8] border border-[#253244] shrink-0">
                          {prof.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#687686] mt-1 line-clamp-1">{prof.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Turn Count & Start Trigger Bar */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-[#9CA9B8]">Maximum Turns:</span>
                <div className="flex items-center gap-1 bg-[#080B10] p-1 rounded-xl border border-[#253244]">
                  {TURN_OPTIONS.map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => !isAuditing && setMaxTurns(num)}
                      disabled={isAuditing}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold font-mono transition-colors cursor-pointer ${
                        maxTurns === num
                          ? 'bg-[#D99A3E] text-[#080B10] font-bold shadow-sm'
                          : 'text-[#9CA9B8] hover:text-[#F2F5F8]'
                      } ${isAuditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Start / Stop Autonomous Audit Button */}
              <div className="flex items-center gap-2">
                {isAuditing ? (
                  <button
                    id="stop-active-audit-btn"
                    type="button"
                    onClick={handleStopAudit}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs bg-[#F04452] hover:bg-[#F04452]/90 text-white shadow-lg shadow-[#F04452]/20 transition-all active:scale-95 cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Stop Audit</span>
                  </button>
                ) : (
                  <button
                    id="start-active-audit-btn"
                    type="button"
                    onClick={handleStartActiveAudit}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs bg-[#D99A3E] hover:bg-[#D99A3E]/90 active:scale-95 text-[#080B10] shadow-lg shadow-[#D99A3E]/20 transition-all cursor-pointer"
                  >
                    <Zap className="w-4 h-4 fill-current" />
                    <span>Start Autonomous Audit</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live KPI & Status Counter Bar */}
      {activeProgress && (
        <div
          id="active-audit-kpi-bar"
          className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 animate-in fade-in duration-300"
        >
          {/* Current Status */}
          <div className="p-3.5 rounded-xl bg-[#111821] border border-[#253244] flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#D99A3E]/15 text-[#D99A3E]">
              <Activity className={`w-4 h-4 ${isAuditing ? 'animate-pulse' : ''}`} />
            </div>
            <div>
              <p className="text-[10px] text-[#687686] uppercase font-semibold">Audit Status</p>
              <p className="text-xs font-bold text-[#F2F5F8] capitalize">{activeProgress.status}</p>
            </div>
          </div>

          {/* Current Turn */}
          <div className="p-3.5 rounded-xl bg-[#111821] border border-[#253244] flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#20C9D8]/15 text-[#20C9D8]">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-[#687686] uppercase font-semibold">Current Turn</p>
              <p className="text-xs font-bold text-[#F2F5F8] font-mono">
                {activeProgress.currentTurn} / {activeProgress.maxTurns}
              </p>
            </div>
          </div>

          {/* Evidence Collected */}
          <div className="p-3.5 rounded-xl bg-[#111821] border border-[#253244] flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#E5B33D]/15 text-[#E5B33D]">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-[#687686] uppercase font-semibold">Evidence Quotes</p>
              <p className="text-xs font-bold text-[#E5B33D] font-mono">{activeProgress.evidenceCount}</p>
            </div>
          </div>

          {/* Findings Detected */}
          <div className="p-3.5 rounded-xl bg-[#111821] border border-[#253244] flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#F07836]/15 text-[#F07836]">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-[#687686] uppercase font-semibold">Findings Detected</p>
              <p className="text-xs font-bold text-[#F07836] font-mono">{activeProgress.findingsCount}</p>
            </div>
          </div>

          {/* Profile Name */}
          <div className="col-span-2 sm:col-span-4 lg:col-span-1 p-3.5 rounded-xl bg-[#111821] border border-[#253244] flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#20C9D8]/15 text-[#20C9D8]">
              <Layers className="w-4 h-4" />
            </div>
            <div className="truncate">
              <p className="text-[10px] text-[#687686] uppercase font-semibold">Audit Profile</p>
              <p className="text-xs font-bold text-[#F2F5F8] truncate">{activeProgress.profile}</p>
            </div>
          </div>
        </div>
      )}

      {/* Current Objective Bar */}
      {activeProgress && activeProgress.currentObjective && (
        <div
          id="current-objective-bar"
          className="px-5 py-3.5 rounded-xl bg-[#111821] border border-[#D99A3E]/40 flex items-center justify-between gap-4 text-xs shadow-md"
        >
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[#D99A3E] animate-ping" />
            <span className="font-semibold text-[#D99A3E] uppercase tracking-wider text-[11px] font-mono">
              Current Objective:
            </span>
            <span className="text-[#F2F5F8] font-medium">{activeProgress.currentObjective}</span>
          </div>
          <span className="text-[#9CA9B8] font-mono text-[11px] shrink-0">{currentStageMessage}</span>
        </div>
      )}

      {/* Main Active Dual-View: Live Timeline + Live Conversation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Audit Timeline */}
        <div className="lg:col-span-4 bg-[#111821] rounded-2xl border border-[#253244] p-5 shadow-xl flex flex-col h-[520px]">
          <div className="flex items-center justify-between pb-3 border-b border-[#253244] shrink-0">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#D99A3E]" />
              <h3 className="text-xs font-bold text-[#F2F5F8] uppercase tracking-wider">Live Audit Timeline</h3>
            </div>
            <span className="text-[10px] font-mono text-[#687686]">Real-time telemetry</span>
          </div>

          <div
            ref={timelineContainerRef}
            className="flex-1 overflow-y-auto mt-4 pr-1 space-y-3.5 text-xs custom-scrollbar"
          >
            {(!activeProgress || activeProgress.timeline.length === 0) ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#687686] space-y-2">
                <Terminal className="w-8 h-8 text-[#687686] stroke-[1.5]" />
                <p className="text-xs font-medium">Timeline Idle</p>
                <p className="text-[11px] text-[#687686]">
                  Select a profile and click "Start Autonomous Audit" to watch live probe execution.
                </p>
              </div>
            ) : (
              activeProgress.timeline.map((item, idx) => {
                let badgeBg = 'bg-[#151E29] text-[#9CA9B8] border-[#253244]';
                let icon = <Clock className="w-3 h-3 text-[#9CA9B8]" />;

                if (item.type === 'plan') {
                  badgeBg = 'bg-[#20C9D8]/15 text-[#20C9D8] border-[#20C9D8]/40';
                  icon = <Sparkles className="w-3 h-3 text-[#20C9D8]" />;
                } else if (item.type === 'probe') {
                  badgeBg = 'bg-[#D99A3E]/15 text-[#D99A3E] border-[#D99A3E]/40';
                  icon = <Crosshair className="w-3 h-3 text-[#D99A3E]" />;
                } else if (item.type === 'response') {
                  badgeBg = 'bg-[#6B8EAD]/15 text-[#6B8EAD] border-[#6B8EAD]/40';
                  icon = <Bot className="w-3 h-3 text-[#6B8EAD]" />;
                } else if (item.type === 'finding') {
                  badgeBg = 'bg-[#F07836]/15 text-[#F07836] border-[#F07836]/40';
                  icon = <AlertTriangle className="w-3 h-3 text-[#F07836]" />;
                } else if (item.type === 'complete') {
                  badgeBg = 'bg-[#31C48D]/15 text-[#31C48D] border-[#31C48D]/40';
                  icon = <CheckCircle2 className="w-3 h-3 text-[#31C48D]" />;
                }

                return (
                  <div
                    key={item.id || idx}
                    className="p-2.5 rounded-xl bg-[#080B10] border border-[#253244] space-y-1 animate-in fade-in duration-200"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold font-mono border ${badgeBg}`}>
                        {icon}
                        <span>{item.stage}</span>
                      </span>
                      <span className="font-mono text-[10px] text-[#687686]">{item.timestamp}</span>
                    </div>
                    <p className="text-[#F2F5F8] text-[11px] leading-relaxed pl-0.5">{item.description}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Live Autonomous Conversation Display */}
        <div className="lg:col-span-8 bg-[#111821] rounded-2xl border border-[#253244] p-5 shadow-xl flex flex-col h-[520px]">
          <div className="flex items-center justify-between pb-3 border-b border-[#253244] shrink-0">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-[#D99A3E]" />
              <h3 className="text-xs font-bold text-[#F2F5F8] uppercase tracking-wider">
                Autonomous Conversation Probing
              </h3>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-[#9CA9B8]">
              <span className="inline-block w-2 h-2 rounded-full bg-[#D99A3E]" /> Agent Auditor
              <span className="inline-block w-2 h-2 rounded-full bg-[#20C9D8] ml-2" /> Target Agent
            </div>
          </div>

          {/* Live Execution Connection Bar (Persistent during audit) */}
          <div
            id="live-execution-connection-bar"
            className="my-3 px-3 py-2 rounded-lg bg-[#080B10] border border-[#253244] flex items-center justify-between gap-2 text-[11px] font-mono shrink-0 shadow-inner"
          >
            <div className="flex items-center gap-2 text-[#20C9D8]">
              <span className="w-2 h-2 rounded-full bg-[#31C48D] animate-pulse" />
              <span className="font-semibold truncate">
                CONNECTION: Public Chat/API Only • Target Internal Signals Used: 0 • Target Internals: Unknown
              </span>
            </div>
            <span className="px-2 py-0.5 rounded bg-[#111821] text-[#9CA9B8] border border-[#253244] text-[10px] hidden sm:inline shrink-0">
              Black-Box Isolation
            </span>
          </div>

          <div
            ref={turnsContainerRef}
            className="flex-1 overflow-y-auto pr-1 space-y-4 text-xs custom-scrollbar"
          >
            {(!activeProgress || activeProgress.turns.length === 0) ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-[#687686] space-y-3">
                <Crosshair className="w-10 h-10 text-[#687686]" />
                <div>
                  <p className="text-sm font-semibold text-[#9CA9B8]">No active conversation turns yet</p>
                  <p className="text-xs text-[#687686] mt-1 max-w-md">
                    When you launch the audit, Agent Auditor will formulate dynamic customer prompts, interrogate the demo target agent, evaluate responses, and capture exact evidence.
                  </p>
                </div>
              </div>
            ) : (
              activeProgress.turns.map((turn) => {
                const hasFinding = turn.evaluation?.findingDetected;
                const isInitial = turn.turnNumber === 1;
                const probeLabel = isInitial
                  ? 'PROBE #1 — INITIAL'
                  : `PROBE #${turn.turnNumber} — ADAPTIVE`;

                return (
                  <div
                    key={turn.id}
                    className="p-4 rounded-xl bg-[#080B10] border border-[#253244] space-y-3 animate-in fade-in duration-300"
                  >
                    {/* Turn Header */}
                    <div className="flex items-center justify-between border-b border-[#253244] pb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#D99A3E]/15 text-[#D99A3E] border border-[#D99A3E]/40">
                          {probeLabel}
                        </span>
                        <span className="text-[#F2F5F8] font-semibold text-xs">{turn.stage}</span>
                      </div>
                      <span className="font-mono text-[10px] text-[#687686]">{turn.timestamp}</span>
                    </div>

                    {/* Agent Auditor Probe */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#D99A3E]">
                          <Crosshair className="w-3.5 h-3.5 text-[#D99A3E]" />
                          <span>Agent Auditor (Autonomous Customer Probe)</span>
                        </div>
                        {!isInitial && (
                          <span className="text-[10px] font-mono text-[#D99A3E] bg-[#D99A3E]/10 px-2 py-0.5 rounded border border-[#D99A3E]/30">
                            Generated from previous target response
                          </span>
                        )}
                      </div>
                      <div className="p-3 rounded-lg bg-[#151E29] border border-[#253244] text-[#F2F5F8] font-sans leading-relaxed">
                        {turn.probeMessage}
                      </div>
                    </div>

                    {/* Target Agent Response */}
                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#20C9D8]">
                          <Bot className="w-3.5 h-3.5 text-[#20C9D8]" />
                          <span>Demo Target Agent (ApexRetail)</span>
                        </div>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#111821] text-[#9CA9B8] border border-[#253244]">
                          UNTRUSTED DATA
                        </span>
                      </div>
                      <div className="p-3 rounded-lg bg-[#0D1219] border border-[#253244] text-[#F2F5F8] font-sans leading-relaxed">
                        {turn.targetResponse}
                      </div>
                    </div>

                    {/* Forensic Evaluation Result Card with Black-Box Evidence */}
                    <div
                      className={`p-3 rounded-lg border text-xs ${
                        hasFinding
                          ? 'bg-[#F04452]/10 border-[#F04452]/40 text-[#F2F5F8]'
                          : 'bg-[#31C48D]/10 border-[#31C48D]/40 text-[#F2F5F8]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5 font-semibold text-[11px]">
                          {hasFinding ? (
                            <>
                              <AlertTriangle className="w-3.5 h-3.5 text-[#F04452]" />
                              <span className="text-[#F04452] font-bold">
                                Vulnerability Flagged: {turn.evaluation?.category} [{turn.evaluation?.severity} Severity]
                              </span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#31C48D]" />
                              <span className="text-[#31C48D] font-bold">Compliant Response</span>
                            </>
                          )}
                        </div>
                      </div>
                      <p className="text-[#9CA9B8] text-[11px] leading-relaxed">{turn.evaluation?.notes}</p>
                      
                      {/* Black-Box Evidence Display */}
                      {turn.evaluation?.exactEvidence && (
                        <div className="mt-2.5 pt-2.5 border-t border-[#253244] space-y-1.5 bg-[#080B10] p-2.5 rounded-md border border-[#253244]">
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-extrabold uppercase tracking-wider bg-[#E5B33D]/15 text-[#E5B33D] border border-[#E5B33D]/30">
                              BLACK-BOX EVIDENCE
                            </span>
                            <span className="text-[10px] font-mono text-[#687686]">
                              Turn #{turn.turnNumber} • {turn.timestamp}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-[#9CA9B8] pt-0.5">
                            <div>
                              <span className="text-[#687686]">Evidence Source: </span>
                              <span className="text-[#F2F5F8]">Observed Target Behavior</span>
                            </div>
                            <div>
                              <span className="text-[#687686]">Surface: </span>
                              <span className="text-[#F2F5F8]">Public Chat/API</span>
                            </div>
                          </div>
                          <div className="pt-1">
                            <span className="text-[#9CA9B8] font-mono text-[10px] block mb-0.5">Exact Evidence:</span>
                            <blockquote className="forensic-mono text-[#E5B33D] font-medium text-[11px] bg-[#111821] p-2 rounded border border-[#253244] italic">
                              "{turn.evaluation.exactEvidence}"
                            </blockquote>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
