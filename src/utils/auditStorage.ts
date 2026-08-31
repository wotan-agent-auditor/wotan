/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuditReport } from '../types';

const STORAGE_KEY = 'agent_auditor_history_v1';

/**
 * Loads audits from Firestore via the server backend /api/audits, falling back to local storage if offline
 */
export async function fetchAuditsFromFirestore(): Promise<AuditReport[]> {
  try {
    const res = await fetch('/api/audits');
    if (!res.ok) {
      throw new Error(`Server returned status ${res.status}`);
    }
    const data = await res.json();
    if (data.success && Array.isArray(data.audits)) {
      // Sync local cache
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data.audits));
      return data.audits;
    }
    return loadAuditsFromStorage();
  } catch (err) {
    console.warn('Failed to fetch audits from Firestore API, using local backup:', err);
    return loadAuditsFromStorage();
  }
}

export function loadAuditsFromStorage(): AuditReport[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch (err) {
    console.error('Failed to load audits from local storage:', err);
    return [];
  }
}

export function saveAuditToStorage(report: AuditReport): AuditReport[] {
  try {
    const current = loadAuditsFromStorage();
    const filtered = current.filter((r) => r.id !== report.id);
    const updated = [report, ...filtered].slice(0, 50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to save audit to storage:', err);
    return [];
  }
}

export async function deleteAuditFromFirestoreAndStorage(id: string): Promise<AuditReport[]> {
  try {
    await fetch(`/api/audits/${id}`, { method: 'DELETE' });
  } catch (err) {
    console.warn('Failed to delete audit from backend Firestore:', err);
  }
  return deleteAuditFromStorage(id);
}

export function deleteAuditFromStorage(id: string): AuditReport[] {
  try {
    const current = loadAuditsFromStorage();
    const updated = current.filter((r) => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to delete audit from storage:', err);
    return [];
  }
}

export function clearAllAuditsFromStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear storage:', err);
  }
}

export function exportReportAsJson(report: AuditReport): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  const filename = `agent-audit-${report.id}-${new Date().toISOString().slice(0, 10)}.json`;
  downloadAnchor.setAttribute('download', filename);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function exportFindingsAsCsv(report: AuditReport): void {
  const headers = [
    'Severity',
    'Category',
    'Exact Evidence',
    'Explanation',
    'Potential Business Impact',
    'Recommended Corrective Action',
    'Turn Number',
  ];

  const escapeCsv = (str: string | undefined | number) => {
    if (str === undefined || str === null) return '""';
    const s = String(str).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = report.findings.map((f) => [
    escapeCsv(f.severity),
    escapeCsv(f.categoryLabel),
    escapeCsv(f.exactEvidence),
    escapeCsv(f.explanation),
    escapeCsv(f.potentialBusinessImpact),
    escapeCsv(f.recommendedCorrectiveAction),
    escapeCsv(f.turnNumber || ''),
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', url);
  const filename = `agent-audit-findings-${report.id}.csv`;
  downloadAnchor.setAttribute('download', filename);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

/**
 * Returns clean formatted text of the Final Audit Conclusion for quick clipboard copy
 */
export function formatConclusionForClipboard(report: AuditReport): string {
  const verdict = report.finalConclusion || report.executiveSummary || 'No conclusion recorded.';
  return `=== FINAL AUDIT CONCLUSION ===
Audit ID: ${report.id}
Date: ${new Date(report.createdAt).toLocaleString()}
Overall Risk: ${report.riskLevel.toUpperCase()} (Score: ${report.overallRiskScore}/100)
Autonomous Operation Status: ${report.autonomousOperationStatus || (report.overallRiskScore >= 50 ? 'REVOKED' : 'APPROVED')}

${verdict}
================================`;
}

/**
 * Generates a clean, comprehensive text version of the entire audit report
 */
export function formatFullReportText(report: AuditReport): string {
  const divider = '═'.repeat(70);
  const subDivider = '─'.repeat(70);

  const findingsText = report.findings.length > 0
    ? report.findings
        .map((f, i) => {
          return `[Finding #${i + 1}] [${f.severity.toUpperCase()}] ${f.categoryLabel}
• Turn #${f.turnNumber || 'N/A'} | Speaker: ${f.speaker || 'Agent'}
• Exact Evidence: "${f.exactEvidence}"
• Analysis: ${f.explanation}
• Potential Business Impact: ${f.potentialBusinessImpact}
• Corrective Action: ${f.recommendedCorrectiveAction}`;
        })
        .join('\n\n')
    : 'No critical violations or defects identified in this dialogue.';

  const guardrailsText = report.recommendedGuardrails.length > 0
    ? report.recommendedGuardrails.map((g, i) => `  ${i + 1}. ${g}`).join('\n')
    : '  • None specified.';

  const vulnerabilitiesText = report.keyVulnerabilities.length > 0
    ? report.keyVulnerabilities.map((v, i) => `  • ${v}`).join('\n')
    : '  • No critical vulnerabilities flagged.';

  return `${divider}
AGENT AUDITOR — ENTERPRISE CONVERSATION QA & RISK REPORT
${divider}
Title: ${report.title}
Audit ID: ${report.id}
Timestamp: ${new Date(report.createdAt).toLocaleString()}
Audited By: ${report.metadata.auditedBy || 'Agent Auditor AI'} (${report.metadata.modelUsed})
Total Dialogue Turns: ${report.metadata.totalTurns} | Word Count: ${report.metadata.wordCount}

${subDivider}
EXECUTIVE RISK SUMMARY
${subDivider}
Overall Risk Score: ${report.overallRiskScore} / 100 (${report.riskLevel.toUpperCase()} RISK)
Autonomous Operation Suitability: ${report.autonomousOperationStatus || (report.overallRiskScore >= 50 ? 'REVOKED' : 'APPROVED')}
Severity Breakdown: Critical: ${report.severityCounts.critical} | High: ${report.severityCounts.high} | Medium: ${report.severityCounts.medium} | Low: ${report.severityCounts.low}

Dimension Evaluation (0-100):
• Factual Integrity:       ${report.dimensionScores.factualIntegrity}/100
• Policy Adherence:        ${report.dimensionScores.policyAdherence}/100
• Commercial Safety:       ${report.dimensionScores.commercialSafety}/100
• Customer Retention:      ${report.dimensionScores.customerRetention}/100
• Conversational Coherence:${report.dimensionScores.conversationalCoherence}/100

Executive Summary:
${report.executiveSummary}

Key Vulnerabilities:
${vulnerabilitiesText}

${subDivider}
DETECTED FINDINGS & FORENSIC EVIDENCE (${report.findings.length})
${subDivider}
${findingsText}

${subDivider}
RECOMMENDED OPERATIONAL GUARDRAILS & ACTION PLAN
${subDivider}
Operational Verdict: ${report.finalRecommendation}

System Prompt & Architectural Guardrails:
${guardrailsText}

${subDivider}
FINAL AUDIT CONCLUSION (DECISION-READY VERDICT)
${subDivider}
${report.finalConclusion || report.executiveSummary}

${divider}
Generated by Agent Auditor Enterprise AI Compliance Engine
${divider}`;
}
