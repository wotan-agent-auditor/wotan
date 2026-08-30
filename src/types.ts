/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type FindingSeverity = 'Low' | 'Medium' | 'High' | 'Critical';

export type FindingCategory =
  | 'hallucination'
  | 'contradiction'
  | 'context_loss'
  | 'premature_termination'
  | 'excessive_repetition'
  | 'unfulfillable_promise'
  | 'commercial_risk'
  | 'customer_loss_risk';

export interface AuditFinding {
  id: string;
  category: FindingCategory;
  categoryLabel: string;
  severity: FindingSeverity;
  exactEvidence: string;
  explanation: string;
  potentialBusinessImpact: string;
  recommendedCorrectiveAction: string;
  speaker?: 'Agent' | 'Customer' | 'System';
  turnNumber?: number;
  validationStatus?: 'VALIDATED' | 'REJECTED';
  rejectionReason?: string;
  evidenceSource?: 'Observed Target Behavior' | 'Provided Transcript / WhatsApp Export' | string;
  surface?: string;
  timestamp?: string;
}

export interface SeverityCounts {
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
}

export interface DimensionScores {
  factualIntegrity: number; // 0 - 100 (100 is best)
  policyAdherence: number; // 0 - 100
  commercialSafety: number; // 0 - 100
  customerRetention: number; // 0 - 100
  conversationalCoherence: number; // 0 - 100
}

export interface AuditMetadata {
  modelUsed: string;
  totalTurns: number;
  wordCount: number;
  durationMs: number;
  firestoreSchemaVersion: string;
  auditedBy?: string;
  fallbackUsed?: boolean;
  retryCount?: number;
}

export type AuditStatusEventType = 'stage' | 'retrying' | 'fallback' | 'complete' | 'error';

export interface AuditStatusEvent {
  type: AuditStatusEventType;
  message: string;
  model?: string;
  previousModel?: string;
  attempt?: number;
  maxRetries?: number;
  delayMs?: number;
  report?: AuditReport;
  error?: string;
}

export type AutonomousOperationStatus = 'APPROVED' | 'CONDITIONAL' | 'REVOKED';

export type AuditMode = 'passive' | 'active';

export type ActiveAuditProfile =
  | 'Full Business Risk Audit'
  | 'Context Retention'
  | 'Policy Consistency'
  | 'Unsupported Promises'
  | 'Commercial / Financial Risk'
  | 'Conversation Termination'
  | 'Adversarial / Prompt Injection Resistance';

export interface ActiveAuditEvaluation {
  passed: boolean;
  notes: string;
  findingDetected?: boolean;
  category?: FindingCategory;
  severity?: FindingSeverity;
  exactEvidence?: string;
  potentialBusinessImpact?: string;
  recommendedCorrectiveAction?: string;
}

export interface ActiveAuditTurn {
  id: string;
  turnNumber: number;
  stage: string;
  objective: string;
  probeMessage: string;
  probeRationale: string;
  targetResponse: string;
  evaluation: ActiveAuditEvaluation;
  timestamp: string;
}

export interface ActiveAuditTimelineStage {
  id: string;
  timestamp: string;
  stage: string;
  description: string;
  type: 'plan' | 'probe' | 'response' | 'eval' | 'finding' | 'complete' | 'error';
  turnNumber?: number;
}

export interface ActiveAuditProgress {
  status: 'idle' | 'planning' | 'probing' | 'evaluating' | 'synthesizing' | 'completed' | 'failed';
  currentTurn: number;
  maxTurns: number;
  currentObjective: string;
  targetAgentName: string;
  profile: ActiveAuditProfile;
  evidenceCount: number;
  findingsCount: number;
  timeline: ActiveAuditTimelineStage[];
  turns: ActiveAuditTurn[];
  error?: string;
}

export interface ActiveAuditStreamEvent {
  type: 'stage' | 'turn_start' | 'target_response' | 'evaluation' | 'finding' | 'complete' | 'error' | 'ping';
  stage?: string;
  message?: string;
  progress?: Partial<ActiveAuditProgress>;
  turn?: ActiveAuditTurn;
  finding?: AuditFinding;
  report?: AuditReport;
  error?: string;
}

export interface WhatsAppMessage {
  id: string;
  rawTimestamp: string;
  parsedDate?: Date | null;
  sender: string;
  message: string;
  isSystem: boolean;
  isMedia: boolean;
  mediaType?: string;
  delayFromPreviousSec?: number;
}

export interface WhatsAppParticipant {
  name: string;
  messageCount: number;
  suggestedRole: 'Agent' | 'Customer';
}

export interface WhatsAppConversationStats {
  totalMessages: number;
  validDialogueMessages: number;
  systemMessagesCount: number;
  mediaMessagesCount: number;
  participants: WhatsAppParticipant[];
  startTime?: Date | null;
  endTime?: Date | null;
  durationFormatted?: string;
  avgResponseDelaySec?: number;
  detectedFormat: 'iOS' | 'Android' | 'Standard' | 'Custom';
}

export interface WhatsAppParseResult {
  success: boolean;
  messages: WhatsAppMessage[];
  stats: WhatsAppConversationStats;
  normalizedTranscript: string;
  error?: string;
}

export interface AuditReport {
  id: string;
  title: string;
  createdAt: string; // ISO 8601 string
  transcript: string;
  agentName?: string;
  customerName?: string;
  domain?: string;
  overallRiskScore: number; // 0 - 100 (0 = Safe, 100 = Extreme Risk)
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  severityCounts: SeverityCounts;
  executiveSummary: string;
  finalConclusion: string;
  autonomousOperationStatus?: AutonomousOperationStatus;
  keyVulnerabilities: string[];
  dimensionScores: DimensionScores;
  finalRecommendation: string;
  recommendedGuardrails: string[];
  findings: AuditFinding[];
  metadata: AuditMetadata;
}

export interface AuditFilterState {
  search: string;
  severity: 'all' | FindingSeverity;
  category: 'all' | FindingCategory;
}

/**
 * Interface mapping for future Google Cloud Firestore persistence
 * Collection: `audits/{auditId}`
 */
export interface FirestoreAuditDocument {
  id: string;
  title: string;
  created_at: string; // Firestore Timestamp / ISO
  overall_risk_score: number;
  risk_level: string;
  executive_summary: string;
  final_conclusion?: string;
  autonomous_operation_status?: string;
  final_recommendation: string;
  dimension_scores: {
    factual_integrity: number;
    policy_adherence: number;
    commercial_safety: number;
    customer_retention: number;
    conversational_coherence: number;
  };
  severity_counts: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
  };
  key_vulnerabilities: string[];
  recommended_guardrails: string[];
  transcript_text: string;
  findings: Array<{
    id: string;
    category: string;
    category_label: string;
    severity: string;
    exact_evidence: string;
    explanation: string;
    potential_business_impact: string;
    recommended_corrective_action: string;
    speaker?: string;
    turn_number?: number;
  }>;
  metadata: {
    model_used: string;
    total_turns: number;
    word_count: number;
    duration_ms: number;
    schema_version: string;
  };
}
