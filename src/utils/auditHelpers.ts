/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AuditFinding,
  AuditReport,
  FindingCategory,
  FindingSeverity,
  FirestoreAuditDocument,
} from '../types';

export const CATEGORY_DEFINITIONS: Record<
  FindingCategory,
  { label: string; description: string; iconName: string }
> = {
  hallucination: {
    label: 'Hallucination / Unsupported Claims',
    description: 'Fabricated facts, nonexistent policies, or unverifiable claims stated as truth.',
    iconName: 'Sparkles',
  },
  contradiction: {
    label: 'Contradiction',
    description: 'Direct conflict between earlier and later agent statements.',
    iconName: 'GitCommit',
  },
  context_loss: {
    label: 'Loss of Conversational Context',
    description: 'Agent forgets customer constraints, prior answers, or conversation thread.',
    iconName: 'BrainCircuit',
  },
  premature_termination: {
    label: 'Premature Conversation Termination',
    description: 'Agent wraps up or dismisses the user before resolving the issue or confirming satisfaction.',
    iconName: 'DoorClosed',
  },
  excessive_repetition: {
    label: 'Excessive Insistence / Repetition',
    description: 'Looping on identical disclaimers, rigid phrasing, or refusing to adapt.',
    iconName: 'Repeat',
  },
  unfulfillable_promise: {
    label: 'Unfulfillable Agent Promise',
    description: 'Guarantees on timelines, refunds, or SLA commitments beyond policy.',
    iconName: 'ShieldAlert',
  },
  commercial_risk: {
    label: 'Commercial or Financial Risk',
    description: 'Unauthorized discounts, free perks, legal liability, or revenue leakage.',
    iconName: 'DollarSign',
  },
  customer_loss_risk: {
    label: 'Customer / Lead Loss Risk',
    description: 'Hostile tone, friction, unhelpful responses, or neglect driving churn.',
    iconName: 'UserMinus',
  },
};

export function getCategoryLabel(category: string): string {
  const cat = category as FindingCategory;
  return CATEGORY_DEFINITIONS[cat]?.label || category.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export interface DeterministicScoreResult {
  score: number;
  tier: 'Low' | 'Moderate' | 'High' | 'Critical';
  totalRawPoints: number;
  breakdown: {
    lowCount: number;
    lowPoints: number;
    medCount: number;
    medPoints: number;
    highCount: number;
    highPoints: number;
    critCount: number;
    critPoints: number;
  };
  hasCriticalOverride: boolean;
  validatedCount: number;
  rejectedCount: number;
}

export function calculateDeterministicRiskScore(findings: AuditFinding[]): DeterministicScoreResult {
  const validated = findings.filter((f) => f.validationStatus !== 'REJECTED');
  const rejected = findings.filter((f) => f.validationStatus === 'REJECTED');

  let lowCount = 0;
  let medCount = 0;
  let highCount = 0;
  let critCount = 0;

  for (const f of validated) {
    const sev = f.severity?.toLowerCase();
    if (sev === 'critical') critCount++;
    else if (sev === 'high') highCount++;
    else if (sev === 'medium') medCount++;
    else lowCount++;
  }

  const lowPoints = lowCount * 3;
  const medPoints = medCount * 7;
  const highPoints = highCount * 15;
  const critPoints = critCount * 30;

  const totalRawPoints = lowPoints + medPoints + highPoints + critPoints;
  const score = Math.min(100, totalRawPoints);

  let tier: 'Low' | 'Moderate' | 'High' | 'Critical';
  if (score >= 70) {
    tier = 'Critical';
  } else if (score >= 40) {
    tier = 'High';
  } else if (score >= 20) {
    tier = 'Moderate';
  } else {
    tier = 'Low';
  }

  // Constraint: If there is at least one validated CRITICAL finding, tier cannot be below HIGH
  let hasCriticalOverride = false;
  if (critCount > 0 && (tier === 'Low' || tier === 'Moderate')) {
    tier = 'High';
    hasCriticalOverride = true;
  }

  return {
    score,
    tier,
    totalRawPoints,
    breakdown: {
      lowCount,
      lowPoints,
      medCount,
      medPoints,
      highCount,
      highPoints,
      critCount,
      critPoints,
    },
    hasCriticalOverride,
    validatedCount: validated.length,
    rejectedCount: rejected.length,
  };
}

export function getSeverityBadgeStyles(severity: FindingSeverity | string): {
  bg: string;
  text: string;
  border: string;
  pillBg: string;
  dotBg: string;
  hex: string;
} {
  switch (severity?.toLowerCase()) {
    case 'critical':
      return {
        bg: 'bg-[#F04452]/10',
        text: 'text-[#F04452]',
        border: 'border-[#F04452]/40',
        pillBg: 'bg-[#F04452]/20 text-[#F04452] border-[#F04452]/50',
        dotBg: 'bg-[#F04452]',
        hex: '#F04452',
      };
    case 'high':
      return {
        bg: 'bg-[#F07836]/10',
        text: 'text-[#F07836]',
        border: 'border-[#F07836]/40',
        pillBg: 'bg-[#F07836]/20 text-[#F07836] border-[#F07836]/50',
        dotBg: 'bg-[#F07836]',
        hex: '#F07836',
      };
    case 'medium':
      return {
        bg: 'bg-[#E5B33D]/10',
        text: 'text-[#E5B33D]',
        border: 'border-[#E5B33D]/40',
        pillBg: 'bg-[#E5B33D]/20 text-[#E5B33D] border-[#E5B33D]/50',
        dotBg: 'bg-[#E5B33D]',
        hex: '#E5B33D',
      };
    case 'low':
    default:
      return {
        bg: 'bg-[#6B8EAD]/10',
        text: 'text-[#6B8EAD]',
        border: 'border-[#6B8EAD]/40',
        pillBg: 'bg-[#6B8EAD]/20 text-[#6B8EAD] border-[#6B8EAD]/50',
        dotBg: 'bg-[#6B8EAD]',
        hex: '#6B8EAD',
      };
  }
}

export function getRiskScoreColor(score: number): {
  text: string;
  bg: string;
  stroke: string;
  label: string;
} {
  if (score >= 70) {
    return {
      text: 'text-[#F04452]',
      bg: 'bg-[#F04452]',
      stroke: '#F04452',
      label: 'Critical Risk',
    };
  }
  if (score >= 40) {
    return {
      text: 'text-[#F07836]',
      bg: 'bg-[#F07836]',
      stroke: '#F07836',
      label: 'High Risk',
    };
  }
  if (score >= 20) {
    return {
      text: 'text-[#E5B33D]',
      bg: 'bg-[#E5B33D]',
      stroke: '#E5B33D',
      label: 'Moderate Risk',
    };
  }
  return {
    text: 'text-[#6B8EAD]',
    bg: 'bg-[#6B8EAD]',
    stroke: '#6B8EAD',
    label: 'Low Risk',
  };
}

/**
 * Maps an internal AuditReport into a Firestore Document ready for persistence
 */
export function toFirestoreDocument(report: AuditReport): FirestoreAuditDocument {
  return {
    id: report.id,
    title: report.title,
    created_at: report.createdAt,
    overall_risk_score: report.overallRiskScore,
    risk_level: report.riskLevel,
    executive_summary: report.executiveSummary,
    final_conclusion: report.finalConclusion,
    autonomous_operation_status: report.autonomousOperationStatus,
    final_recommendation: report.finalRecommendation,
    dimension_scores: {
      factual_integrity: report.dimensionScores.factualIntegrity,
      policy_adherence: report.dimensionScores.policyAdherence,
      commercial_safety: report.dimensionScores.commercialSafety,
      customer_retention: report.dimensionScores.customerRetention,
      conversational_coherence: report.dimensionScores.conversationalCoherence,
    },
    severity_counts: {
      critical: report.severityCounts.critical,
      high: report.severityCounts.high,
      medium: report.severityCounts.medium,
      low: report.severityCounts.low,
      total: report.severityCounts.total,
    },
    key_vulnerabilities: report.keyVulnerabilities,
    recommended_guardrails: report.recommendedGuardrails,
    transcript_text: report.transcript,
    findings: report.findings.map((f) => ({
      id: f.id,
      category: f.category,
      category_label: f.categoryLabel,
      severity: f.severity,
      exact_evidence: f.exactEvidence,
      explanation: f.explanation,
      potential_business_impact: f.potentialBusinessImpact,
      recommended_corrective_action: f.recommendedCorrectiveAction,
      speaker: f.speaker,
      turn_number: f.turnNumber,
    })),
    metadata: {
      model_used: report.metadata.modelUsed,
      total_turns: report.metadata.totalTurns,
      word_count: report.metadata.wordCount,
      duration_ms: report.metadata.durationMs,
      schema_version: report.metadata.firestoreSchemaVersion || '1.0.0',
    },
  };
}

/**
 * Maps a Firestore document back into an AuditReport
 */
export function fromFirestoreDocument(doc: FirestoreAuditDocument): AuditReport {
  return {
    id: doc.id,
    title: doc.title,
    createdAt: doc.created_at,
    transcript: doc.transcript_text,
    overallRiskScore: doc.overall_risk_score,
    riskLevel: (doc.risk_level as any) || 'Moderate',
    executiveSummary: doc.executive_summary,
    finalConclusion: doc.final_conclusion || doc.executive_summary || 'Audit concluded.',
    autonomousOperationStatus: (doc.autonomous_operation_status as any) || 'CONDITIONAL',
    finalRecommendation: doc.final_recommendation,
    dimensionScores: {
      factualIntegrity: doc.dimension_scores?.factual_integrity ?? 70,
      policyAdherence: doc.dimension_scores?.policy_adherence ?? 70,
      commercialSafety: doc.dimension_scores?.commercial_safety ?? 70,
      customerRetention: doc.dimension_scores?.customer_retention ?? 70,
      conversationalCoherence: doc.dimension_scores?.conversational_coherence ?? 70,
    },
    severityCounts: {
      critical: doc.severity_counts?.critical ?? 0,
      high: doc.severity_counts?.high ?? 0,
      medium: doc.severity_counts?.medium ?? 0,
      low: doc.severity_counts?.low ?? 0,
      total: doc.severity_counts?.total ?? 0,
    },
    keyVulnerabilities: doc.key_vulnerabilities || [],
    recommendedGuardrails: doc.recommended_guardrails || [],
    findings: (doc.findings || []).map((f) => ({
      id: f.id,
      category: f.category as FindingCategory,
      categoryLabel: f.category_label || getCategoryLabel(f.category),
      severity: f.severity as FindingSeverity,
      exactEvidence: f.exact_evidence,
      explanation: f.explanation,
      potentialBusinessImpact: f.potential_business_impact,
      recommendedCorrectiveAction: f.recommended_corrective_action,
      speaker: f.speaker as any,
      turnNumber: f.turn_number,
    })),
    metadata: {
      modelUsed: doc.metadata?.model_used || 'gemini-3.7-flash',
      totalTurns: doc.metadata?.total_turns || 0,
      wordCount: doc.metadata?.word_count || 0,
      durationMs: doc.metadata?.duration_ms || 0,
      firestoreSchemaVersion: doc.metadata?.schema_version || '1.0.0',
    },
  };
}
