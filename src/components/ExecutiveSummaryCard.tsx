/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  FileText,
  AlertTriangle,
  Lightbulb,
  ShieldCheck,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { AuditReport } from '../types';

interface ExecutiveSummaryCardProps {
  report: AuditReport;
}

export const ExecutiveSummaryCard: React.FC<ExecutiveSummaryCardProps> = ({ report }) => {
  const [copiedGuardrailIdx, setCopiedGuardrailIdx] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);

  const handleCopyGuardrail = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedGuardrailIdx(idx);
    setTimeout(() => setCopiedGuardrailIdx(null), 2000);
  };

  const handleCopyAllGuardrails = () => {
    const combined = report.recommendedGuardrails.map((g, i) => `${i + 1}. ${g}`).join('\n');
    navigator.clipboard.writeText(combined);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <div
      id="executive-summary-card"
      className="p-6 rounded-2xl bg-[#111821] border border-[#253244] shadow-xl space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#253244] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[#20C9D8]/15 text-[#20C9D8] border border-[#20C9D8]/30">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#F2F5F8] tracking-wide">
              Executive QA & Risk Summary
            </h3>
            <p className="text-xs text-[#9CA9B8]">High-level strategic findings for AI product and operations leadership</p>
          </div>
        </div>
      </div>

      {/* Executive Summary Body */}
      <div className="space-y-3 text-[#F2F5F8] text-sm leading-relaxed bg-[#080B10] p-4 sm:p-5 rounded-xl border border-[#253244]">
        {report.executiveSummary.split('\n\n').map((para, i) => (
          <p key={i} className="text-[#9CA9B8] leading-relaxed font-sans">
            {para}
          </p>
        ))}
      </div>

      {/* Key Vulnerabilities & Strategic Recommendation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Key Vulnerabilities */}
        <div className="p-4 rounded-xl bg-[#F04452]/10 border border-[#F04452]/40 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-[#F04452] shrink-0" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#F04452]">
                Primary Vulnerabilities Detected
              </h4>
            </div>
            <ul className="space-y-2 text-xs text-[#F2F5F8]">
              {report.keyVulnerabilities.map((vuln, idx) => (
                <li key={idx} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-[#F04452] font-bold mt-0.5">•</span>
                  <span>{vuln}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Final Recommendation Box */}
        <div className="p-4 rounded-xl bg-[#20C9D8]/10 border border-[#20C9D8]/40 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-[#20C9D8] shrink-0" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#20C9D8]">
                Strategic Final Recommendation
              </h4>
            </div>
            <div className="p-3 rounded-lg bg-[#080B10] border border-[#253244] mb-2">
              <p className="text-xs text-[#F2F5F8] font-medium leading-relaxed">
                {report.finalRecommendation}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recommended System Prompt Guardrails */}
      {report.recommendedGuardrails && report.recommendedGuardrails.length > 0 && (
        <div className="pt-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#31C48D]" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#F2F5F8]">
                Recommended Prompt Guardrails & Safety Directives
              </h4>
            </div>
            <button
              onClick={handleCopyAllGuardrails}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-[#9CA9B8] hover:text-[#F2F5F8] transition-colors cursor-pointer"
            >
              {copiedAll ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#31C48D]" />
                  <span className="text-[#31C48D]">Copied All</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy All Directives</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-2">
            {report.recommendedGuardrails.map((guardrail, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-[#080B10] border border-[#253244] flex items-start justify-between gap-3 group hover:border-[#20C9D8]/50 transition-colors"
              >
                <div className="flex items-start gap-2.5 text-xs text-[#9CA9B8] leading-relaxed forensic-mono">
                  <span className="text-[#20C9D8] font-bold shrink-0">{idx + 1}.</span>
                  <span>{guardrail}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyGuardrail(guardrail, idx)}
                  className="p-1 rounded text-[#687686] hover:text-[#F2F5F8] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 cursor-pointer"
                  title="Copy guardrail"
                >
                  {copiedGuardrailIdx === idx ? (
                    <Check className="w-3.5 h-3.5 text-[#31C48D]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
