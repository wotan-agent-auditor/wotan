/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Firestore } from '@google-cloud/firestore';
import { AuditReport } from '../src/types';

export const FIRESTORE_PROJECT_ID =
  process.env.GOOGLE_CLOUD_PROJECT ||
  process.env.GCLOUD_PROJECT ||
  'gen-lang-client-0077570384';

export const FIRESTORE_DATABASE_ID = '(default)';
export const AUDITS_COLLECTION = 'audits';

// Initialize Firestore using Application Default Credentials (ADC) without hardcoded secrets
export const db = new Firestore({
  projectId: FIRESTORE_PROJECT_ID,
  databaseId: FIRESTORE_DATABASE_ID,
});

/**
 * Persists an audit report to Firestore at audits/{auditId}
 */
export async function saveAuditToFirestore(report: AuditReport): Promise<void> {
  const docRef = db.collection(AUDITS_COLLECTION).doc(report.id);
  await docRef.set(report);
}

/**
 * Retrieves an audit report by ID from audits/{auditId}
 */
export async function getAuditFromFirestore(auditId: string): Promise<AuditReport | null> {
  const docRef = db.collection(AUDITS_COLLECTION).doc(auditId);
  const snap = await docRef.get();
  if (!snap.exists) {
    return null;
  }
  return snap.data() as AuditReport;
}

/**
 * Lists all audit reports from audits collection
 */
export async function listAuditsFromFirestore(): Promise<AuditReport[]> {
  const snapshot = await db.collection(AUDITS_COLLECTION).get();
  const audits: AuditReport[] = [];
  snapshot.forEach((doc) => {
    audits.push(doc.data() as AuditReport);
  });
  return audits.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Deletes an audit report by ID from audits/{auditId}
 */
export async function deleteAuditFromFirestore(auditId: string): Promise<boolean> {
  const docRef = db.collection(AUDITS_COLLECTION).doc(auditId);
  const snap = await docRef.get();
  if (!snap.exists) {
    return false;
  }
  await docRef.delete();
  return true;
}
