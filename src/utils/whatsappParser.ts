/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  WhatsAppConversationStats,
  WhatsAppMessage,
  WhatsAppParseResult,
  WhatsAppParticipant,
} from '../types';

// Regex patterns for various WhatsApp export styles

// 1. iOS Bracket format: [DD/MM/YY, HH:MM:SS] Sender: Message or [M/D/YY, H:MM:SS AM/PM] Sender: Message
const IOS_BRACKET_REGEX =
  /^\[(\d{1,4}[-./]\d{1,2}[-./]\d{1,4}[,\s]+\d{1,2}:\d{2}(?::\d{2})?(?:\s*[APap][Mm])?)\]\s*([^:]+?):\s*([\s\S]*)$/;

// 2. iOS Bracket System message: [DD/MM/YY, HH:MM:SS] System text without sender colon
const IOS_SYSTEM_REGEX =
  /^\[(\d{1,4}[-./]\d{1,2}[-./]\d{1,4}[,\s]+\d{1,2}:\d{2}(?::\d{2})?(?:\s*[APap][Mm])?)\]\s*([^:]+)$/;

// 3. Android Dash format: DD/MM/YYYY, HH:MM - Sender: Message or M/D/YY, H:MM AM - Sender: Message
const ANDROID_DASH_REGEX =
  /^(\d{1,4}[-./]\d{1,2}[-./]\d{1,4}[,\s]+\d{1,2}:\d{2}(?::\d{2})?(?:\s*[APap][Mm])?)\s*-\s*([^:]+?):\s*([\s\S]*)$/;

// 4. Android System message: DD/MM/YYYY, HH:MM - System text without colon
const ANDROID_SYSTEM_REGEX =
  /^(\d{1,4}[-./]\d{1,2}[-./]\d{1,4}[,\s]+\d{1,2}:\d{2}(?::\d{2})?(?:\s*[APap][Mm])?)\s*-\s*([^:]+)$/;

// Common system phrases
const SYSTEM_PHRASES = [
  'end-to-end encrypted',
  'messages and calls are end-to-end',
  'changed the subject to',
  'changed the group description',
  'changed this group icon',
  'created group',
  'security code changed',
  'you were added',
  'joined using this group',
  'left the group',
  'removed',
  'this message was deleted',
  'you deleted this message',
  'missed voice call',
  'missed video call',
  'waiting for this message',
  'disappearing messages',
];

// Common media omission patterns
const MEDIA_PATTERNS = [
  { regex: /<media omitted>/i, label: '[Media omitted]' },
  { regex: /image omitted/i, label: '[Image omitted]' },
  { regex: /video omitted/i, label: '[Video omitted]' },
  { regex: /audio omitted/i, label: '[Voice Note / Audio omitted]' },
  { regex: /document omitted/i, label: '[Document / PDF omitted]' },
  { regex: /sticker omitted/i, label: '[Sticker omitted]' },
  { regex: /contact card omitted/i, label: '[Contact Card omitted]' },
  { regex: /gif omitted/i, label: '[GIF omitted]' },
  { regex: /<attached:\s*[^>]+>/i, label: '[Attachment omitted]' },
  { regex: /location:\s*https?:\/\//i, label: '[Location shared]' },
];

/**
 * Normalizes invisible unicode characters from WhatsApp TXT exports
 */
export function sanitizeWhatsAppLine(line: string): string {
  return line
    .replace(/[\u200E\u200F\uFEFF]/g, '') // LTR/RTL marks, BOM
    .replace(/[\u202F\u00A0]/g, ' ') // Narrow non-breaking space, NBSP
    .trim();
}

/**
 * Attempts to parse diverse date/time strings from WhatsApp
 */
export function parseWhatsAppDate(rawDateStr: string): Date | null {
  try {
    const cleaned = sanitizeWhatsAppLine(rawDateStr);
    // Replace comma with space if present
    const standardStr = cleaned.replace(',', '');
    const dateObj = new Date(standardStr);
    if (!isNaN(dateObj.getTime())) {
      return dateObj;
    }

    // Try parsing DD/MM/YYYY or DD.MM.YYYY
    const match = cleaned.match(
      /^(\d{1,4})[-./](\d{1,2})[-./](\d{1,4})[,\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*([APap][Mm]))?/
    );
    if (match) {
      let p1 = parseInt(match[1], 10);
      let p2 = parseInt(match[2], 10);
      let p3 = parseInt(match[3], 10);
      let hours = parseInt(match[4], 10);
      const minutes = parseInt(match[5], 10);
      const seconds = match[6] ? parseInt(match[6], 10) : 0;
      const ampm = match[7]?.toUpperCase();

      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;

      let year = p3;
      let month = p2;
      let day = p1;

      // Handle 2-digit year (e.g. 24 -> 2024)
      if (year < 100) year += 2000;
      if (p1 > 1000) {
        // YYYY-MM-DD format
        year = p1;
        month = p2;
        day = p3;
      } else if (p1 > 12 && p2 <= 12) {
        // Definitely DD/MM/YYYY
        day = p1;
        month = p2;
      } else if (p2 > 12 && p1 <= 12) {
        // Definitely MM/DD/YYYY
        month = p1;
        day = p2;
      }

      const constructed = new Date(year, month - 1, day, hours, minutes, seconds);
      if (!isNaN(constructed.getTime())) {
        return constructed;
      }
    }
  } catch (e) {
    // Ignore date parsing failure
  }
  return null;
}

/**
 * Format duration in human readable seconds, minutes, or hours
 */
export function formatDuration(totalSeconds: number): string {
  if (totalSeconds < 60) {
    return `${Math.round(totalSeconds)} sec`;
  }
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.round(totalSeconds % 60);
  if (mins < 60) {
    return secs > 0 ? `${mins}m ${secs}s` : `${mins} min`;
  }
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hours}h ${remMins}m`;
}

/**
 * Parses raw text from a WhatsApp .txt export into structured messages
 */
export function parseWhatsAppExport(rawText: string): WhatsAppParseResult {
  if (!rawText || !rawText.trim()) {
    return {
      success: false,
      messages: [],
      stats: {
        totalMessages: 0,
        validDialogueMessages: 0,
        systemMessagesCount: 0,
        mediaMessagesCount: 0,
        participants: [],
        detectedFormat: 'Standard',
      },
      normalizedTranscript: '',
      error: 'The uploaded file is empty.',
    };
  }

  const rawLines = rawText.split(/\r?\n/);
  const parsedMessages: WhatsAppMessage[] = [];
  let detectedFormat: 'iOS' | 'Android' | 'Standard' | 'Custom' = 'Standard';
  let iosMatchesCount = 0;
  let androidMatchesCount = 0;

  let currentMsg: WhatsAppMessage | null = null;

  for (let i = 0; i < rawLines.length; i++) {
    const rawLine = rawLines[i];
    const line = sanitizeWhatsAppLine(rawLine);
    if (!line) continue;

    // Check iOS Bracket Format
    const iosMatch = line.match(IOS_BRACKET_REGEX);
    if (iosMatch) {
      if (currentMsg) parsedMessages.push(currentMsg);
      iosMatchesCount++;
      const rawTimestamp = iosMatch[1];
      const sender = iosMatch[2].trim();
      const text = iosMatch[3].trim();

      currentMsg = {
        id: `msg-${parsedMessages.length + 1}`,
        rawTimestamp,
        parsedDate: parseWhatsAppDate(rawTimestamp),
        sender,
        message: text,
        isSystem: false,
        isMedia: false,
      };
      continue;
    }

    // Check Android Dash Format
    const androidMatch = line.match(ANDROID_DASH_REGEX);
    if (androidMatch) {
      if (currentMsg) parsedMessages.push(currentMsg);
      androidMatchesCount++;
      const rawTimestamp = androidMatch[1];
      const sender = androidMatch[2].trim();
      const text = androidMatch[3].trim();

      currentMsg = {
        id: `msg-${parsedMessages.length + 1}`,
        rawTimestamp,
        parsedDate: parseWhatsAppDate(rawTimestamp),
        sender,
        message: text,
        isSystem: false,
        isMedia: false,
      };
      continue;
    }

    // Check System messages (iOS bracket or Android dash without sender colon)
    const iosSysMatch = line.match(IOS_SYSTEM_REGEX);
    if (iosSysMatch) {
      if (currentMsg) parsedMessages.push(currentMsg);
      iosMatchesCount++;
      currentMsg = {
        id: `sys-${parsedMessages.length + 1}`,
        rawTimestamp: iosSysMatch[1],
        parsedDate: parseWhatsAppDate(iosSysMatch[1]),
        sender: 'System',
        message: iosSysMatch[2].trim(),
        isSystem: true,
        isMedia: false,
      };
      continue;
    }

    const androidSysMatch = line.match(ANDROID_SYSTEM_REGEX);
    if (androidSysMatch) {
      if (currentMsg) parsedMessages.push(currentMsg);
      androidMatchesCount++;
      currentMsg = {
        id: `sys-${parsedMessages.length + 1}`,
        rawTimestamp: androidSysMatch[1],
        parsedDate: parseWhatsAppDate(androidSysMatch[1]),
        sender: 'System',
        message: androidSysMatch[2].trim(),
        isSystem: true,
        isMedia: false,
      };
      continue;
    }

    // Multiline continuation: Append line to current message content
    if (currentMsg) {
      currentMsg.message = currentMsg.message ? `${currentMsg.message}\n${line}` : line;
    }
  }

  // Push last message
  if (currentMsg) {
    parsedMessages.push(currentMsg);
  }

  if (iosMatchesCount > androidMatchesCount && iosMatchesCount > 0) {
    detectedFormat = 'iOS';
  } else if (androidMatchesCount > 0) {
    detectedFormat = 'Android';
  }

  // Post-process messages: detect media and system notifications
  for (const msg of parsedMessages) {
    const lower = msg.message.toLowerCase();

    // Check media
    for (const pattern of MEDIA_PATTERNS) {
      if (pattern.regex.test(msg.message)) {
        msg.isMedia = true;
        msg.mediaType = pattern.label;
        break;
      }
    }

    // Check system phrases
    if (!msg.isSystem) {
      for (const phrase of SYSTEM_PHRASES) {
        if (lower.includes(phrase)) {
          msg.isSystem = true;
          break;
        }
      }
    }
  }

  // Calculate delays and response intervals
  let validDialogueMessages = 0;
  let systemMessagesCount = 0;
  let mediaMessagesCount = 0;
  const participantMap = new Map<string, number>();
  let totalDelaySeconds = 0;
  let delayPairsCount = 0;

  for (let i = 0; i < parsedMessages.length; i++) {
    const msg = parsedMessages[i];
    if (msg.isSystem) {
      systemMessagesCount++;
      continue;
    }
    if (msg.isMedia) {
      mediaMessagesCount++;
    }

    validDialogueMessages++;
    participantMap.set(msg.sender, (participantMap.get(msg.sender) || 0) + 1);

    // Calculate response interval from previous message with valid date
    if (i > 0) {
      const prev = parsedMessages[i - 1];
      if (msg.parsedDate && prev.parsedDate && msg.sender !== prev.sender) {
        const diffMs = msg.parsedDate.getTime() - prev.parsedDate.getTime();
        if (diffMs >= 0 && diffMs < 86400000) {
          // within 24 hours
          const diffSec = diffMs / 1000;
          msg.delayFromPreviousSec = diffSec;
          totalDelaySeconds += diffSec;
          delayPairsCount++;
        }
      }
    }
  }

  // Determine participants and suggested roles
  const participants: WhatsAppParticipant[] = Array.from(participantMap.entries()).map(
    ([name, messageCount]) => {
      const lowerName = name.toLowerCase();
      let suggestedRole: 'Agent' | 'Customer' = 'Customer';

      // Agent keyword clues
      if (
        lowerName.includes('bot') ||
        lowerName.includes('agent') ||
        lowerName.includes('support') ||
        lowerName.includes('assistant') ||
        lowerName.includes('ai') ||
        lowerName.includes('rep') ||
        lowerName.includes('help') ||
        lowerName.includes('service') ||
        lowerName.includes('advisor')
      ) {
        suggestedRole = 'Agent';
      }

      return {
        name,
        messageCount,
        suggestedRole,
      };
    }
  );

  // If we have 2 participants and none or both matched 'Agent', infer based on dialogue keywords
  if (participants.length === 2 && participants.every((p) => p.suggestedRole === 'Customer')) {
    let p0AgentScore = 0;
    let p1AgentScore = 0;

    for (const msg of parsedMessages) {
      if (msg.isSystem) continue;
      const lower = msg.message.toLowerCase();
      const isAgentPhrase =
        lower.includes('how can i help') ||
        lower.includes('welcome to') ||
        lower.includes('thank you for contacting') ||
        lower.includes('our policy') ||
        lower.includes('ticket') ||
        lower.includes('refund policy') ||
        lower.includes('account balance');

      if (isAgentPhrase) {
        if (msg.sender === participants[0].name) p0AgentScore++;
        if (msg.sender === participants[1].name) p1AgentScore++;
      }
    }

    if (p0AgentScore > p1AgentScore) {
      participants[0].suggestedRole = 'Agent';
      participants[1].suggestedRole = 'Customer';
    } else if (p1AgentScore > p0AgentScore) {
      participants[1].suggestedRole = 'Agent';
      participants[0].suggestedRole = 'Customer';
    } else {
      // Default: the second participant or recipient is typically the Agent
      participants[1].suggestedRole = 'Agent';
    }
  }

  // Calculate start, end, and duration
  const validDates = parsedMessages.map((m) => m.parsedDate).filter(Boolean) as Date[];
  let startTime: Date | null = null;
  let endTime: Date | null = null;
  let durationFormatted: string | undefined;

  if (validDates.length > 0) {
    validDates.sort((a, b) => a.getTime() - b.getTime());
    startTime = validDates[0];
    endTime = validDates[validDates.length - 1];
    const durationSec = (endTime.getTime() - startTime.getTime()) / 1000;
    if (durationSec >= 0) {
      durationFormatted = formatDuration(durationSec);
    }
  }

  const avgResponseDelaySec =
    delayPairsCount > 0 ? Math.round(totalDelaySeconds / delayPairsCount) : undefined;

  const stats: WhatsAppConversationStats = {
    totalMessages: parsedMessages.length,
    validDialogueMessages,
    systemMessagesCount,
    mediaMessagesCount,
    participants,
    startTime,
    endTime,
    durationFormatted,
    avgResponseDelaySec,
    detectedFormat,
  };

  // Validation: Check if parsing found valid messages
  if (parsedMessages.length === 0 || validDialogueMessages === 0) {
    return {
      success: false,
      messages: [],
      stats,
      normalizedTranscript: '',
      error:
        'Could not detect standard WhatsApp export timestamps and sender headers in this file. Please ensure this is an exported WhatsApp .txt file (e.g. "[DD/MM/YY, HH:MM:SS] Name: message" or "DD/MM/YYYY, HH:MM - Name: message").',
    };
  }

  // Generate initial normalized transcript
  const roleMap: Record<string, 'Customer' | 'Agent'> = {};
  for (const p of participants) {
    roleMap[p.name] = p.suggestedRole;
  }

  const normalizedTranscript = generateNormalizedTranscript(parsedMessages, roleMap, {
    includeTimestamps: false,
    includeMediaLabels: true,
  });

  return {
    success: true,
    messages: parsedMessages,
    stats,
    normalizedTranscript,
  };
}

/**
 * Transforms parsed WhatsApp messages into clean normalized transcript format for Gemini Auditor
 */
export function generateNormalizedTranscript(
  messages: WhatsAppMessage[],
  roleMapping: Record<string, 'Customer' | 'Agent'>,
  options: {
    includeTimestamps?: boolean;
    includeMediaLabels?: boolean;
    filterSystemMessages?: boolean;
  } = {}
): string {
  const lines: string[] = [];

  for (const msg of messages) {
    if (msg.isSystem && options.filterSystemMessages !== false) {
      // Ignore pure system messages by default
      continue;
    }

    let speakerLabel = msg.sender;
    const mappedRole = roleMapping[msg.sender];
    if (mappedRole === 'Agent') {
      speakerLabel = 'AI Agent';
    } else if (mappedRole === 'Customer') {
      speakerLabel = 'Customer';
    }

    let textContent = msg.message;
    if (msg.isMedia && options.includeMediaLabels !== false && msg.mediaType) {
      textContent = `${msg.mediaType} ${textContent}`.trim();
    }

    // Time prefix if requested
    let prefix = '';
    if (options.includeTimestamps && msg.rawTimestamp) {
      prefix = `[${msg.rawTimestamp}] `;
    }

    lines.push(`${prefix}${speakerLabel}: ${textContent}`);
  }

  return lines.join('\n');
}
