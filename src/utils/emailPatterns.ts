/**
 * Parsers for transaction-bearing receipt emails.
 * Currently handles: Uber trip receipts.
 */

export interface ParsedEmailTransaction {
  amount: number;
  type: 'debit' | 'credit';
  merchant: string;
  bank: string;      // service name used as "bank" label
  account?: string;
  category: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Decode base64url strings (as returned by the Gmail API). */
export function decodeBase64Url(encoded: string): string {
  // Gmail uses base64url encoding: replace - → + and _ → /
  const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  try {
    // atob is available in React Native's Hermes runtime
    return decodeURIComponent(
      Array.from(atob(base64))
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    );
  } catch {
    return '';
  }
}

/** Strip HTML tags and decode common entities to get plain text. */
function htmlToText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#8377;/gi, '₹')   // HTML entity for Indian Rupee
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** Parse a rupee amount string (may contain commas) into a number. */
function parseAmount(raw: string): number {
  return parseFloat(raw.replace(/,/g, ''));
}

// ─── Uber ────────────────────────────────────────────────────────────────────

/**
 * Detects whether an email (by sender address) is an Uber receipt.
 * Used as a fast pre-filter before full body parsing.
 */
export function isUberReceiptSender(from: string): boolean {
  return /noreply@uber\.com/i.test(from) || /receipts@uber\.com/i.test(from);
}

/**
 * Parse an Uber trip receipt email body.
 *
 * Looks for the "Total ₹X" line that appears at the top of every Uber receipt.
 * The `internalDate` from the Gmail API (Unix ms) is used directly as the
 * transaction date.
 *
 * Returns null if the email does not look like a trip receipt or if no
 * parseable amount is found.
 */
export function parseUberEmail(
  rawBody: string,
  _internalDateMs: number
): ParsedEmailTransaction | null {
  const text = htmlToText(rawBody);

  // Must contain "Uber" and look like a receipt (has a fare/total line)
  if (!/uber/i.test(text)) return null;

  // Reject non-trip emails: promotions, cancellations without charge, etc.
  // These won't have a "Total ₹" line.
  const totalMatch =
    // Pattern 1: "Total ₹257.49"
    text.match(/Total\s+₹\s*([\d,]+(?:\.\d{1,2})?)/i) ??
    // Pattern 2: "Total\nINR 257.49" or "Total INR 257.49"
    text.match(/Total\s+INR\s+([\d,]+(?:\.\d{1,2})?)/i) ??
    // Pattern 3: fallback — any ₹ amount in the first 800 chars (subject area)
    text.slice(0, 800).match(/₹\s*([\d,]+(?:\.\d{1,2})?)/);

  if (!totalMatch) return null;

  const amount = parseAmount(totalMatch[1]);
  if (!amount || amount <= 0 || isNaN(amount)) return null;

  return {
    amount,
    type: 'debit',
    merchant: 'Uber',
    bank: 'Uber',
    category: 'Uber',
  };
}
