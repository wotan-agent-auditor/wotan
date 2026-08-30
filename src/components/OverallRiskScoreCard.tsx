/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Activity,
  CheckCircle,
  FileCheck,
  DollarSign,
  UserCheck,
  Brain,
  Calculator,
} from 'lucide-react';
import { AuditReport } from '../types';
import { calculateDeterministicRiskScore, getRiskScoreColor, getSeverityBadgeStyles } from '../utils/auditHelpers';

interface OverallRiskScoreCardProps {
  report: AuditReport;
}

export const OverallRiskScoreCard: React.FC<OverallRiskScoreCardProps> = ({ report }) => {
  const { overallRiskScore, riskLevel, dimensionScores, findings } = report;
  const colorInfo = getRiskScoreColor(overallRiskScore);
  const scoreResult = calculateDeterministicRiskScore(findings);

  // SVG circular gauge math
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  // Stroke dash offset based on score (0 to 100)
  const strokeDashoffset = circumference - (overallRiskScore / 100) * circumference;

  const dimensions = [
    {
      label: 'Factual Integrity',
      score: dimensionScores.factualIntegrity,
      icon: CheckCircle,
      desc: 'Absence of hallucinations & unsupported claims',
    },
    {
      label: 'Policy Adherence',
      score: dimensionScores.policyAdherence,
      icon: FileCheck,
      desc: 'Alignment with standard return/support protocols',
    },
    {
      label: 'Commercial Safety',
      score: dimensionScores.commercialSafety,
      icon: DollarSign,
      desc: 'Protection against unauthorized payouts & liabilities',
    },
    {
      label: 'Customer Retention',
      score: dimensionScores.customerRetention,
      icon: UserCheck,
      desc: 'Friction minimization & churn prevention',
    },
    {
      label: 'Conversational Coherence',
      score: dimensionScores.conversationalCoherence,
      icon: Brain,
      desc: 'Context memory & dialogue flow continuity',
    },
  ];

  const getDimensionScoreColor = (score: number) => {
    if (score >= 80) return 'text-[#31C48D] bg-[#31C48D]';
    if (score >= 60) return 'text-[#6B8EAD] bg-[#6B8EAD]';
    if (score >= 40) return 'text-[#E5B33D] bg-[#E5B33D]';
    return 'text-[#F04452] bg-[#F04452]';
  };

  const riskBadgeStyles = getSeverityBadgeStyles(riskLevel);

  return (
    <div
      id="overall-risk-score-card"
      className="p-6 rounded-2xl bg-[#111821] border border-[#253244] shadow-xl flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#20C9D8]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#F2F5F8]">
              Deterministic Risk Score
            </h3>
          </div>
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono border ${riskBadgeStyles.pillBg}`}
          >
            {riskLevel.toUpperCase()} RISK TIER
          </span>
        </div>

        {/* Circular Gauge and Score Callout */}
        <div className="flex flex-col sm:flex-row items-center gap-6 my-2 p-4 rounded-xl bg-[#080B10]/80 border border-[#253244]">
          <div className="relative flex items-center justify-center shrink-0">
            <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 140 140">
              {/* Background circle */}
              <circle
                cx="70"
                cy="70"
                r={radius}
                stroke="#151E29"
                strokeWidth="10"
                fill="transparent"
              />
              {/* Animated Progress circle */}
              <circle
                cx="70"
                cy="70"
                r={radius}
                stroke={colorInfo.stroke}
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className={`text-3xl font-black tracking-tight font-mono ${colorInfo.text}`}>
                {overallRiskScore}
              </span>
              <span className="text-[10px] uppercase font-bold text-[#687686] tracking-wider">
                Risk Score / 100
              </span>
            </div>
          </div>

          <div className="space-y-2 text-center sm:text-left flex-1">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              {overallRiskScore >= 40 ? (
                <ShieldAlert className={`w-5 h-5 ${colorInfo.text}`} />
              ) : (
                <ShieldCheck className="w-5 h-5 text-[#31C48D]" />
              )}
              <h4 className="text-sm sm:text-base font-bold text-[#F2F5F8]">
                {overallRiskScore >= 70
                  ? 'Critical Behavioral Liability Detected'
                  : overallRiskScore >= 40
                  ? 'High Operational Risk Identified'
                  : overallRiskScore >= 20
                  ? 'Moderate Quality Defects Present'
                  : 'Low Behavioral Risk Observed'}
              </h4>
            </div>

            {/* Deterministic Formula Callout */}
            <div className="p-2.5 rounded-lg bg-[#0D1219] border border-[#253244] text-[11px] font-mono space-y-1">
              <div className="flex items-center justify-between text-[#9CA9B8]">
                <span className="flex items-center gap-1">
                  <Calculator className="w-3 h-3 text-[#20C9D8]" /> Deterministic Weighting:
                </span>
                <span className="text-[#F2F5F8] font-bold">
                  {scoreResult.validatedCount} Validated Findings
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 text-[10px] pt-1 text-[#9CA9B8] border-t border-[#253244]/60">
                <span>Low: {scoreResult.breakdown.lowCount}×3={scoreResult.breakdown.lowPoints}p</span>
                <span>Med: {scoreResult.breakdown.medCount}×7={scoreResult.breakdown.medPoints}p</span>
                <span>High: {scoreResult.breakdown.highCount}×15={scoreResult.breakdown.highPoints}p</span>
                <span>Crit: {scoreResult.breakdown.critCount}×30={scoreResult.breakdown.critPoints}p</span>
              </div>
              {scoreResult.hasCriticalOverride && (
                <p className="text-[10px] text-[#F07836] pt-0.5 font-sans">
                  * Critical finding present: minimum High risk tier enforced.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Dimension Sub-scores */}
        <div className="mt-5 space-y-3">
          <h4 className="text-xs font-semibold text-[#9CA9B8] uppercase tracking-wider">
            Quality & Risk Dimensions (0 - 100)
          </h4>
          <div className="grid grid-cols-1 gap-2">
            {dimensions.map((dim) => {
              const Icon = dim.icon;
              const colorClasses = getDimensionScoreColor(dim.score);
              const textColor = colorClasses.split(' ')[0];
              const barColor = colorClasses.split(' ')[1];

              return (
                <div
                  key={dim.label}
                  className="p-2.5 rounded-lg bg-[#080B10]/60 border border-[#253244] flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className="w-4 h-4 text-[#687686] shrink-0" />
                    <div className="truncate">
                      <span className="font-medium text-[#F2F5F8] block truncate">{dim.label}</span>
                      <span className="text-[10px] text-[#687686] hidden sm:block truncate">{dim.desc}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="w-24 sm:w-32 bg-[#151E29] h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${barColor} transition-all duration-700`}
                        style={{ width: `${Math.max(5, dim.score)}%` }}
                      />
                    </div>
                    <span className={`font-mono font-bold w-7 text-right ${textColor}`}>
                      {dim.score}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

