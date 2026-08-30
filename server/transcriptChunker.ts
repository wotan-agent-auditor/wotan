/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ConversationTurn {
  id: string;
  turnNumber: number;
  speaker: string;
  rawSpeaker: string;
  text: string;
  timestamp?: string;
  rawLine: string;
}

export interface TranscriptSegment {
  segmentIndex: number;
  totalSegments: number;
  startTurn: number;
  endTurn: number;
  turnCount: number;
  charCount: number;
  formattedText: string;
  turns: ConversationTurn[];
}

// Regexes for common dialogue and WhatsApp formats
const WHATSAPP_IOS_REGEX = /^\[(\d{1,4}[-./]\d{1,2}[-./]\d{1,4}[,\s]+\d{1,2}:\d{2}(?::\d{2})?(?:\s*[APap][Mm])?)\]\s*([^:]+?):\s*([\s\S]*)$/;
const WHATSAPP_ANDROID_REGEX = /^(\d{1,4}[-./]\d{1,2}[-./]\d{1,4}[,\s]+\d{1,2}:\d{2}(?::\d{2})?(?:\s*[APap][Mm])?)\s*-\s*([^:]+?):\s*([\s\S]*)$/;
const STANDARD_SPEAKER_REGEX = /^([A-Za-z0-9_\s\-\.]{1,40})\s*:\s*([\s\S]*)$/;

/**
 * Parses any transcript (standard dialogue or WhatsApp export) into an array of complete conversation turns
 * with preserved sender identities, turn indices, timestamps, and continuous multi-line messages.
 */
export function parseTranscriptIntoTurns(transcript: string): ConversationTurn[] {
  if (!transcript || !transcript.trim()) {
    return [];
  }

  const rawLines = transcript.split(/\r?\n/);
  const turns: ConversationTurn[] = [];
  let currentTurn: ConversationTurn | null = null;

  for (let i = 0; i < rawLines.length; i++) {
    const rawLine = rawLines[i];
    const cleanedLine = rawLine.trim();

    if (!cleanedLine) {
      continue;
    }

    // 1. Check iOS WhatsApp Bracket Format
    const iosMatch = cleanedLine.match(WHATSAPP_IOS_REGEX);
    if (iosMatch) {
      if (currentTurn) {
        turns.push(currentTurn);
      }
      const rawTimestamp = iosMatch[1];
      const rawSpeaker = iosMatch[2].trim();
      const text = iosMatch[3].trim();

      currentTurn = {
        id: `turn-${turns.length + 1}`,
        turnNumber: turns.length + 1,
        speaker: normalizeSpeaker(rawSpeaker),
        rawSpeaker,
        text,
        timestamp: rawTimestamp,
        rawLine: cleanedLine,
      };
      continue;
    }

    // 2. Check Android WhatsApp Dash Format
    const androidMatch = cleanedLine.match(WHATSAPP_ANDROID_REGEX);
    if (androidMatch) {
      if (currentTurn) {
        turns.push(currentTurn);
      }
      const rawTimestamp = androidMatch[1];
      const rawSpeaker = androidMatch[2].trim();
      const text = androidMatch[3].trim();

      currentTurn = {
        id: `turn-${turns.length + 1}`,
        turnNumber: turns.length + 1,
        speaker: normalizeSpeaker(rawSpeaker),
        rawSpeaker,
        text,
        timestamp: rawTimestamp,
        rawLine: cleanedLine,
      };
      continue;
    }

    // 3. Check Standard Colon Format (e.g. "Customer: Hello", "AI Agent: Hi")
    const standardMatch = cleanedLine.match(STANDARD_SPEAKER_REGEX);
    if (standardMatch && !cleanedLine.startsWith('http://') && !cleanedLine.startsWith('https://')) {
      const rawSpeaker = standardMatch[1].trim();
      const text = standardMatch[2].trim();

      // Avoid false matches on generic time or URL patterns
      if (rawSpeaker.length <= 35 && !/^\d+$/.test(rawSpeaker)) {
        if (currentTurn) {
          turns.push(currentTurn);
        }

        currentTurn = {
          id: `turn-${turns.length + 1}`,
          turnNumber: turns.length + 1,
          speaker: normalizeSpeaker(rawSpeaker),
          rawSpeaker,
          text,
          rawLine: cleanedLine,
        };
        continue;
      }
    }

    // 4. Continuation line of current turn or initial line
    if (currentTurn) {
      currentTurn.text += '\n' + cleanedLine;
      currentTurn.rawLine += '\n' + cleanedLine;
    } else {
      // First line without speaker header
      currentTurn = {
        id: `turn-1`,
        turnNumber: 1,
        speaker: 'Participant',
        rawSpeaker: 'Participant',
        text: cleanedLine,
        rawLine: cleanedLine,
      };
    }
  }

  if (currentTurn) {
    turns.push(currentTurn);
  }

  return turns;
}

function normalizeSpeaker(raw: string): string {
  const lower = raw.toLowerCase();
  if (
    lower.includes('agent') ||
    lower.includes('bot') ||
    lower.includes('assistant') ||
    lower.includes('support') ||
    lower.includes('rep') ||
    lower.includes('service')
  ) {
    return 'Agent';
  }
  if (
    lower.includes('customer') ||
    lower.includes('client') ||
    lower.includes('user') ||
    lower.includes('buyer') ||
    lower.includes('caller') ||
    lower.includes('guest')
  ) {
    return 'Customer';
  }
  return raw;
}

/**
 * Creates message-aware segments from conversation turns.
 * Guarantees that no individual message is ever split in the middle.
 */
export function createTranscriptSegments(
  turns: ConversationTurn[],
  targetCharBudget = 18000,
  maxTurnsPerSegment = 45
): TranscriptSegment[] {
  if (turns.length === 0) {
    return [];
  }

  const segments: TranscriptSegment[] = [];
  let currentSegmentTurns: ConversationTurn[] = [];
  let currentSegmentChars = 0;

  for (let i = 0; i < turns.length; i++) {
    const turn = turns[i];
    const turnFormatted = formatTurnForModel(turn);
    const turnCharLength = turnFormatted.length;

    // Check if adding this turn exceeds budget (unless current segment is empty)
    if (
      currentSegmentTurns.length > 0 &&
      (currentSegmentChars + turnCharLength > targetCharBudget ||
        currentSegmentTurns.length >= maxTurnsPerSegment)
    ) {
      // Finalize current segment
      segments.push(buildSegment(segments.length + 1, currentSegmentTurns));
      currentSegmentTurns = [];
      currentSegmentChars = 0;
    }

    currentSegmentTurns.push(turn);
    currentSegmentChars += turnCharLength;
  }

  if (currentSegmentTurns.length > 0) {
    segments.push(buildSegment(segments.length + 1, currentSegmentTurns));
  }

  // Set accurate totalSegments count on all segments
  const total = segments.length;
  for (const s of segments) {
    s.totalSegments = total;
  }

  return segments;
}

function buildSegment(segmentNumber: number, turns: ConversationTurn[]): TranscriptSegment {
  const formattedLines = turns.map((t) => formatTurnForModel(t));
  const formattedText = formattedLines.join('\n');
  return {
    segmentIndex: segmentNumber,
    totalSegments: 1, // updated after loop
    startTurn: turns[0]?.turnNumber || 1,
    endTurn: turns[turns.length - 1]?.turnNumber || 1,
    turnCount: turns.length,
    charCount: formattedText.length,
    formattedText,
    turns,
  };
}

function formatTurnForModel(turn: ConversationTurn): string {
  const timePrefix = turn.timestamp ? `[${turn.timestamp}] ` : '';
  return `[Turn ${turn.turnNumber}] ${timePrefix}${turn.speaker}: ${turn.text}`;
}

/**
 * Validates that an exact evidence string from Gemini exists in the original transcript.
 * Returns verified location or null if unsupported.
 */
export function validateEvidenceInTranscript(
  exactEvidence: string,
  fullTranscript: string,
  turns: ConversationTurn[]
): { verified: boolean; matchedTurn?: ConversationTurn; matchSnippet?: string } {
  if (!exactEvidence || exactEvidence.trim().length === 0 || exactEvidence === 'N/A') {
    return { verified: true };
  }

  const cleanedEvidence = exactEvidence.trim();

  // 1. Direct substring search in full transcript
  if (fullTranscript.includes(cleanedEvidence)) {
    // Find corresponding turn
    const turn = turns.find((t) => t.text.includes(cleanedEvidence) || t.rawLine.includes(cleanedEvidence));
    return { verified: true, matchedTurn: turn, matchSnippet: cleanedEvidence };
  }

  // 2. Normalized whitespace check (case-insensitive substring)
  const normEvidence = cleanedEvidence.replace(/\s+/g, ' ').toLowerCase();
  const normTranscript = fullTranscript.replace(/\s+/g, ' ').toLowerCase();

  if (normTranscript.includes(normEvidence)) {
    const turn = turns.find((t) =>
      t.text.replace(/\s+/g, ' ').toLowerCase().includes(normEvidence) ||
      t.rawLine.replace(/\s+/g, ' ').toLowerCase().includes(normEvidence)
    );
    return { verified: true, matchedTurn: turn, matchSnippet: cleanedEvidence };
  }

  // 3. Sentence or core clause match (first 30 chars or key phrase)
  const words = cleanedEvidence.split(/\s+/).filter((w) => w.length > 3);
  if (words.length >= 3) {
    const keyPhrase = words.slice(0, 4).join(' ').toLowerCase();
    const turn = turns.find((t) => t.text.toLowerCase().includes(keyPhrase));
    if (turn) {
      return { verified: true, matchedTurn: turn, matchSnippet: turn.text };
    }
  }

  // If evidence cannot be found anywhere in the original text
  return { verified: false };
}
