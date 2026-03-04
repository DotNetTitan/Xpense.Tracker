/**
 * Gmail service: Gmail REST API fetching and Uber email parsing.
 *
 * Auth (sign-in, token storage, refresh) is handled entirely by the
 * @react-native-google-signin/google-signin native SDK. This module
 * receives a valid accessToken from the hook and uses it to call the API.
 */

import { Transaction } from '../types';
import { decodeBase64Url, isUberReceiptSender, parseUberEmail } from '../utils/emailPatterns';

// ─── Gmail API helpers ──────────────────────────────────────────────────────

const GMAIL_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';

async function gmailGet<T>(path: string, accessToken: string): Promise<T> {
  const res = await fetch(`${GMAIL_BASE}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gmail API error (${res.status}): ${body}`);
  }
  return res.json() as Promise<T>;
}

interface GmailMessageRef { id: string }
interface GmailMessageListResponse {
  messages?: GmailMessageRef[];
  nextPageToken?: string;
}

interface GmailMessagePart {
  mimeType: string;
  body?: { data?: string; size?: number };
  parts?: GmailMessagePart[];
  headers?: { name: string; value: string }[];
}

interface GmailMessage {
  id: string;
  internalDate: string; // Unix ms as string
  payload?: GmailMessagePart;
}

/** Recursively find the best text part for parsing (prefers text/plain). */
function extractBody(part: GmailMessagePart): string {
  if (part.body?.data) {
    return decodeBase64Url(part.body.data);
  }
  if (part.parts) {
    const plain = part.parts.find((p) => p.mimeType === 'text/plain');
    const html  = part.parts.find((p) => p.mimeType === 'text/html');
    const target = plain ?? html;
    if (target) return extractBody(target);
    for (const child of part.parts) {
      const text = extractBody(child);
      if (text) return text;
    }
  }
  return '';
}

function getHeader(part: GmailMessagePart, name: string): string {
  return part.headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? '';
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Fetch and parse all Uber receipt emails from the last `daysBack` days.
 * Returns an array of Transaction objects ready for `replaceWithEmailBatch`.
 */
export async function fetchAndParseUberEmails(
  accessToken: string,
  daysBack = 90,
): Promise<Transaction[]> {
  const afterDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
  const afterStr = `${afterDate.getFullYear()}/${String(afterDate.getMonth() + 1).padStart(2, '0')}/${String(afterDate.getDate()).padStart(2, '0')}`;
  const query = encodeURIComponent(`from:noreply@uber.com after:${afterStr}`);

  const allIds: string[] = [];
  let pageToken: string | undefined;
  do {
    const url = `/messages?q=${query}&maxResults=100${pageToken ? `&pageToken=${pageToken}` : ''}`;
    const list = await gmailGet<GmailMessageListResponse>(url, accessToken);
    if (list.messages) {
      allIds.push(...list.messages.map((m) => m.id));
    }
    pageToken = list.nextPageToken;
  } while (pageToken && allIds.length < 500);

  const transactions: Transaction[] = [];

  for (const id of allIds) {
    try {
      const msg = await gmailGet<GmailMessage>(`/messages/${id}?format=full`, accessToken);
      if (!msg.payload) continue;

      const from = getHeader(msg.payload, 'from');
      if (!isUberReceiptSender(from)) continue;

      const internalDateMs = parseInt(msg.internalDate, 10);
      const body = extractBody(msg.payload);

      const parsed = parseUberEmail(body, internalDateMs);
      if (!parsed) continue;

      transactions.push({
        id: `email_${msg.id}`,
        smsId: `email_${msg.id}`,
        amount: parsed.amount,
        type: parsed.type,
        merchant: parsed.merchant,
        bank: parsed.bank,
        account: parsed.account,
        category: parsed.category,
        date: internalDateMs,
        rawSms: body.slice(0, 1000),
        source: 'email',
      });
    } catch (err) {
      console.warn(`[gmail] Failed to parse message ${id}:`, err);
    }
  }

  return transactions;
}
