/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Copy,
  Check,
  FileText,
  Bot,
  Zap,
  TrendingDown,
  AlertOctagon,
  ArrowRightCircle,
  ExternalLink,
} from 'lucide-react';
import { AuditReport } from '../types';
import { formatConclusionForClipboard, formatFullReportText } from '../utils/auditStorage';

interface FinalAuditConclusionCardProps {
  report: AuditReport;
}

export const FinalAuditConclusionCard: React.FC<FinalAuditConclusionCardProps> = ({ report }) => {
  const [copiedConclusion, setCopiedConclusion] = useState<boolean>(false);
  const [copiedFullReport, setCopiedFullReport] = useState<boolean>(false);

  const conclusionText = report.finalConclusion || report.executiveSummary;
  const wordCount = conclusionText.trim().split(/\s+/).filter(Boolean).length;

  const autoStatus =
    report.autonomousOperationStatus ||
    (report.overallRiskScore >= 50 ? 'REVOKED' : report.overallRiskScore >= 25 ? 'CONDITIONAL' : 'APPROVED');

  const handleCopyConclusion = async () => {
    try {
      const textToCopy = formatConclusionForClipboard(report);
      await navigator.clipboard.writeText(textToCopy);
      setCopiedConclusion(true);
      setTimeout(() => setCopiedConclusion(false), 2500);
    } catch (err) {
      console.error('Failed to copy conclusion to clipboard:', err);
    }
  };

  const handleCopyFullReport = async () => {
    try {
      const fullText = formatFullReportText(report);
      await navigator.clipboard.writeText(fullText);
      setCopiedFullReport(true);
      setTimeout(() => setCopiedFullReport(false), 2500);
    } catch (err) {
      console.error('Failed to copy full report to clipboard:', err);
    }
  };

  // Status visual configurations
  const statusConfig = {
    APPROVED: {
      badgeBg: 'bg-[#31C48D]/15 border-[#31C48D]/40 text-[#31C48D]',
      icon: ShieldCheck,
      iconColor: 'text-[#31C48D]',
      title: 'Approved for Autonomous Operation',
      description: 'Target agent operates within standard policy parameters with acceptable risk thresholds.',
    },
    CONDITIONAL: {
      badgeBg: 'bg-[#E5B33D]/15 border-[#E5B33D]/40 text-[#E5B33D]',
      icon: AlertTriangle,
      iconColor: 'text-[#E5B33D]',
      title: 'Conditional Operation — Guardrails Mandatory',
      description: 'Autonomous deployment permitted only with strict prompt guardrails and escalation constraints.',
    },
    REVOKED: {
      badgeBg: 'bg-[#F04452]/15 border-[#F04452]/40 text-[#F04452]',
      icon: ShieldAlert,
      iconColor: 'text-[#F04452]',
      title: 'Autonomous Operation Revoked / Suspended',
      description: 'Critical business liability or severe defect detected. Immediate human intervention required.',
    },
  }[autoStatus] || {
    badgeBg: 'bg-[#20C9D8]/15 border-[#20C9D8]/40 text-[#20C9D8]',
    icon: Bot,
    iconColor: 'text-[#20C9D8]',
    title: 'Audit Decision Recorded',
    description: 'Review operational guidance below.',
  };

  const StatusIcon = statusConfig.icon;

  // Primary defect summary
  const topFailure =
    report.findings.find((f) => f.severity === 'Critical') ||
    report.findings.find((f) => f.severity === 'High') ||
    report.findings[0];

  const primaryImpact = topFailure?.potentialBusinessImpact || 'Operational friction and policy misalignment.';
  const immediateAction = report.finalRecommendation || 'Deploy prompt guardrails and review agent parameters.';

  return (
    <div
      id="final-audit-conclusion-section"
      className="rounded-2xl bg-[#111821] border border-[#253244] p-6 sm:p-8 shadow-xl relative overflow-hidden"
    >
      {/* Subtle Background Accent */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-[#20C9D8]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#253244]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-[#20C9D8]/15 text-[#20C9D8] border border-[#20C9D8]/30 rounded-md">
              Black-Box QA Verdict
            </span>
            <span className="text-xs text-[#9CA9B8]">
              {wordCount} words • Decision-Ready Format
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-[#F2F5F8] flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-[#20C9D8]" />
            <span>Black-Box Behavioral Risk Verdict</span>
          </h3>
          <p className="text-xs sm:text-sm text-[#9CA9B8]">
            Concise operational verdict formatted for immediate dissemination into tickets, executive emails, or compliance records.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Copy Conclusion Button */}
          <button
            id="btn-copy-conclusion"
            onClick={handleCopyConclusion}
            type="button"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#20C9D8] hover:bg-[#20C9D8]/90 active:scale-[0.98] text-[#080B10] text-xs sm:text-sm font-bold shadow-lg shadow-[#20C9D8]/10 transition-all border border-[#20C9D8]/30 cursor-pointer"
          >
            {copiedConclusion ? (
              <>
                <Check className="w-4 h-4 text-[#080B10]" />
                <span>Conclusion Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Conclusion</span>
              </>
            )}
          </button>

          {/* Copy Full Report Button */}
          <button
            id="btn-copy-full-report"
            onClick={handleCopyFullReport}
            type="button"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#151E29] hover:bg-[#253244] active:scale-[0.98] text-[#F2F5F8] text-xs sm:text-sm font-semibold border border-[#253244] transition-all cursor-pointer"
          >
            {copiedFullReport ? (
              <>
                <Check className="w-4 h-4 text-[#31C48D]" />
                <span>Full Report Copied!</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 text-[#9CA9B8]" />
                <span>Copy Full Report</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Autonomous Suitability & Risk Classification Status Banner */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Autonomous Status */}
        <div
          className={`md:col-span-8 p-4 rounded-xl border flex items-start sm:items-center gap-3.5 ${statusConfig.badgeBg}`}
        >
          <div className="p-2 rounded-lg bg-[#080B10]/80 border border-white/5 flex-shrink-0">
            <StatusIcon className={`w-5 h-5 ${statusConfig.iconColor}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#9CA9B8]">
                Autonomous Operation Status:
              </span>
              <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-[#080B10] text-[#F2F5F8] border border-white/10">
                {autoStatus}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-medium mt-0.5 text-[#F2F5F8]">
              {statusConfig.title}
            </p>
          </div>
        </div>

        {/* Risk Classification Tier */}
        <div className="md:col-span-4 p-4 rounded-xl bg-[#080B10]/80 border border-[#253244] flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#687686]">
              Overall Risk Tier
            </div>
            <div className="text-base font-bold text-[#F2F5F8] mt-0.5">
              {report.riskLevel} Risk
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-[#20C9D8] font-mono">
              {report.overallRiskScore}
              <span className="text-xs text-[#687686] font-normal font-sans">/100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Structured Verdict Grid */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* 1. Overall Risk Classification */}
        <div className="p-3.5 rounded-xl bg-[#080B10]/60 border border-[#253244] space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#9CA9B8]">
            <AlertOctagon className="w-3.5 h-3.5 text-[#F04452]" />
            <span>Risk Classification</span>
          </div>
          <p className="text-xs font-medium text-[#F2F5F8]">
            {report.riskLevel} Risk ({report.severityCounts.critical} Critical, {report.severityCounts.high} High)
          </p>
        </div>

        {/* 2. Most Important Failure */}
        <div className="p-3.5 rounded-xl bg-[#080B10]/60 border border-[#253244] space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#9CA9B8]">
            <AlertTriangle className="w-3.5 h-3.5 text-[#E5B33D]" />
            <span>Primary Defect Detected</span>
          </div>
          <p className="text-xs font-medium text-[#F2F5F8] line-clamp-2" title={topFailure?.categoryLabel || 'Defect summary'}>
            {topFailure?.categoryLabel || 'No severe defects detected'}
          </p>
        </div>

        {/* 3. Potential Business Impact */}
        <div className="p-3.5 rounded-xl bg-[#080B10]/60 border border-[#253244] space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#9CA9B8]">
            <TrendingDown className="w-3.5 h-3.5 text-[#F07836]" />
            <span>Potential Business Impact</span>
          </div>
          <p className="text-xs font-medium text-[#F2F5F8] line-clamp-2" title={primaryImpact}>
            {primaryImpact}
          </p>
        </div>

        {/* 4. Immediate Recommended Action */}
        <div className="p-3.5 rounded-xl bg-[#080B10]/60 border border-[#253244] space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#9CA9B8]">
            <ArrowRightCircle className="w-3.5 h-3.5 text-[#20C9D8]" />
            <span>Immediate Action</span>
          </div>
          <p className="text-xs font-medium text-[#F2F5F8] line-clamp-2" title={immediateAction}>
            {immediateAction}
          </p>
        </div>
      </div>

      {/* Main Copyable Decision-Ready Conclusion Text Box */}
      <div className="mt-5 p-4 sm:p-5 rounded-xl bg-[#080B10] border border-[#253244] relative group">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#253244]">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#20C9D8] flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-[#20C9D8]" />
            <span>Decision-Ready Executive Verdict (Ready for Copy)</span>
          </div>
          <button
            onClick={handleCopyConclusion}
            type="button"
            className="text-xs text-[#9CA9B8] hover:text-[#20C9D8] flex items-center gap-1 transition-colors cursor-pointer"
          >
            {copiedConclusion ? (
              <>
                <Check className="w-3 h-3 text-[#31C48D]" />
                <span className="text-[#31C48D] font-medium">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        <p className="text-sm sm:text-base leading-relaxed text-[#F2F5F8] font-normal whitespace-pre-wrap font-sans">
          {conclusionText}
        </p>
      </div>
    </div>
  );
};
