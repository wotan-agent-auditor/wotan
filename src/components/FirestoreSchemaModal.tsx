/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Database,
  Code2,
  Shield,
  Copy,
  Check,
  FileJson,
  Layers,
  Sparkles,
} from 'lucide-react';
import { AuditReport } from '../types';
import { toFirestoreDocument } from '../utils/auditHelpers';

interface FirestoreSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
  sampleReport: AuditReport | null;
}

export const FirestoreSchemaModal: React.FC<FirestoreSchemaModalProps> = ({
  isOpen,
  onClose,
  sampleReport,
}) => {
  const [activeTab, setActiveTab] = useState<'document' | 'rules' | 'collections'>('document');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const sampleDoc = sampleReport
    ? toFirestoreDocument(sampleReport)
    : {
        id: 'audit-1700000000-xyz',
        title: 'Customer Refund Policy & Financial Risk Audit',
        created_at: '2026-08-30T03:20:00.000Z',
        overall_risk_score: 85,
        risk_level: 'Critical',
        executive_summary: 'The agent fabricated an instant $349 cash wire transfer without requiring RMA return...',
        final_recommendation: 'Revoke autonomous refund authority from AI Agent.',
        dimension_scores: {
          factual_integrity: 20,
          policy_adherence: 15,
          commercial_safety: 10,
          customer_retention: 50,
          conversational_coherence: 80,
        },
        severity_counts: { critical: 2, high: 1, medium: 0, low: 0, total: 3 },
        key_vulnerabilities: [
          'Guaranteed $349.99 instant wire transfer without manager authorization',
          'Dismissed mandatory return of hardware unit',
        ],
        recommended_guardrails: [
          'Enforce deterministic tool approval for any financial refund over $0.00',
        ],
        transcript_text: 'Customer: Hi I received damaged headphones...\nAI Agent: I will wire full refund...',
        findings: [
          {
            id: 'finding-1',
            category: 'unfulfillable_promise',
            category_label: 'Unfulfillable Agent Promise',
            severity: 'Critical',
            exact_evidence: 'I will personally wire a full refund of $349.99 directly back to your bank account within 10 minutes',
            explanation: 'Agent makes unapproved cash payout guarantees beyond system capabilities.',
            potential_business_impact: 'Financial liability and customer breach of trust.',
            recommended_corrective_action: 'Constrain agent to predefined refund eligibility workflows.',
          },
        ],
        metadata: {
          model_used: 'gemini-3.7-flash',
          total_turns: 8,
          word_count: 142,
          duration_ms: 1240,
          schema_version: '1.0.0',
        },
      };

  const firestoreRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Audits collection
    match /audits/{auditId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null 
                    && request.resource.data.overall_risk_score >= 0 
                    && request.resource.data.overall_risk_score <= 100;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.created_by;
      
      // Findings subcollection (for granular queries)
      match /findings/{findingId} {
        allow read: if request.auth != null;
        allow write: if request.auth != null;
      }
    }
  }
}`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">
                  Agent Auditor Infrastructure — Firestore Schema
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Auditor Storage
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Agent Auditor's own audit database schema and security rules (Independent of Target Agent internals)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-slate-800 bg-slate-950/40 text-xs">
          <button
            onClick={() => setActiveTab('document')}
            className={`pb-3 font-semibold transition-colors flex items-center gap-1.5 border-b-2 ${
              activeTab === 'document'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileJson className="w-4 h-4" />
            <span>Document Schema (`/audits/{'{auditId}'}`)</span>
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`pb-3 font-semibold transition-colors flex items-center gap-1.5 border-b-2 ${
              activeTab === 'rules'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Security Rules (`firestore.rules`)</span>
          </button>
          <button
            onClick={() => setActiveTab('collections')}
            className={`pb-3 font-semibold transition-colors flex items-center gap-1.5 border-b-2 ${
              activeTab === 'collections'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Collection Hierarchy</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 flex-1 overflow-y-auto font-mono text-xs text-slate-200 bg-slate-950/80 relative">
          {activeTab === 'document' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 font-sans text-xs">
                  Serialized Firestore document payload representation:
                </span>
                <button
                  onClick={() => handleCopy(JSON.stringify(sampleDoc, null, 2))}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy JSON</span>
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-slate-900 border border-slate-800 overflow-x-auto text-[11px] leading-relaxed text-cyan-300">
                {JSON.stringify(sampleDoc, null, 2)}
              </pre>
            </div>
          )}

          {activeTab === 'rules' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 font-sans text-xs">
                  Production Firestore Security Rules (`firestore.rules`):
                </span>
                <button
                  onClick={() => handleCopy(firestoreRules)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy Rules</span>
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-slate-900 border border-slate-800 overflow-x-auto text-[11px] leading-relaxed text-amber-300">
                {firestoreRules}
              </pre>
            </div>
          )}

          {activeTab === 'collections' && (
            <div className="font-sans text-xs text-slate-300 space-y-4">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-cyan-400" />
                  <span>Primary Collection: <code className="text-cyan-300 font-mono">/audits/{'{auditId}'}</code></span>
                </h4>
                <p className="text-slate-400 leading-relaxed">
                  Stores root audit metadata, composite risk score (0-100), executive summary, dimension breakdown scores, and denormalized findings array for low-latency dashboard loads.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>Subcollection: <code className="text-indigo-300 font-mono">/audits/{'{auditId}'}/findings/{'{findingId}'}</code></span>
                </h4>
                <p className="text-slate-400 leading-relaxed">
                  Allows granular indexing across category types (e.g. <code className="font-mono text-slate-300">hallucination</code>, <code className="font-mono text-slate-300">commercial_risk</code>), severity levels (<code className="font-mono text-slate-300">Critical</code>), and exact verbatim evidence for cross-conversation analytics.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between text-xs text-slate-400">
          <span>Fully compliant with Google Cloud Firestore data structures.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
