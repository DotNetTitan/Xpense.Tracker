export interface ParsedTransaction {
  amount: number;
  type: 'debit' | 'credit';
  merchant?: string;
  account?: string;
}

interface SmsPattern {
  regex: RegExp;
  type: 'debit' | 'credit';
  amountGroup: number;
  merchantGroup?: number;
  accountGroup?: number;
}

const PATTERNS: SmsPattern[] = [
  // ICICI: "INR 2,000.00 spent on ICICI Bank Card XX1234 at AMAZON on 01-Mar-26"
  {
    regex: /INR\s+([\d,]+(?:\.\d{1,2})?)\s+spent\s+on\s+.+?Card\s+[Xx*]+(\d{4})(?:\s+at\s+([A-Z0-9 &/._-]+?))?(?:\s+on\s|\s*\.|\s*$)/i,
    type: 'debit',
    amountGroup: 1,
    accountGroup: 2,
    merchantGroup: 3,
  },
  // ICICI UPI: "INR 500.00 debited from A/c XX1234 on 01-Mar-26; UPI:ZOMATO"
  {
    regex: /INR\s+([\d,]+(?:\.\d{1,2})?)\s+debited\s+from\s+(?:A\/c\s*[Xx*]+(\d{4}))?(?:.*?UPI:([A-Z0-9@._-]+))?/i,
    type: 'debit',
    amountGroup: 1,
    accountGroup: 2,
    merchantGroup: 3,
  },
  // ICICI credit: "INR 500.00 credited to A/c XX1234"
  {
    regex: /INR\s+([\d,]+(?:\.\d{1,2})?)\s+credited\s+to\s+(?:A\/c\s*[Xx*]+(\d{4}))?/i,
    type: 'credit',
    amountGroup: 1,
    accountGroup: 2,
  },
  // HDFC: "Rs.1,500.00 debited from A/c **1234 at SWIGGY on 01-Mar-26"
  {
    regex: /Rs\.?\s*([\d,]+(?:\.\d{1,2})?)\s+debited\s+from\s+(?:A\/c\s*[*x]+(\d{4}))?\s*(?:at\s+([A-Z0-9 &/._-]+?))?(?:\s+on|\s*\.|VPA|$)/i,
    type: 'debit',
    amountGroup: 1,
    accountGroup: 2,
    merchantGroup: 3,
  },
  // SBI: "Your A/c XXXX1234 debited by Rs.500 on 01-03-26 towards UPI/ZOMATO"
  {
    regex: /A\/c\s*[Xx*]+(\d{4})\s+debited\s+by\s+Rs\.?\s*([\d,]+(?:\.\d{1,2})?)(?:.*?(?:UPI\/|towards\s+)([A-Z0-9@._-]+))?/i,
    type: 'debit',
    amountGroup: 2,
    accountGroup: 1,
    merchantGroup: 3,
  },
  // Axis: "Rs.750 debited from Axis Bank a/c XX6789 for UPI/ZOMATO on 01-Mar-26"
  {
    regex: /Rs\.?\s*([\d,]+(?:\.\d{1,2})?)\s+debited\s+from\s+.+?a\/c\s+[Xx*]+(\d{4})(?:.*?(?:UPI\/)?([A-Z0-9@._-]+?))?(?:\s+on|\s*\.|$)/i,
    type: 'debit',
    amountGroup: 1,
    accountGroup: 2,
    merchantGroup: 3,
  },
  // Kotak: "Spent INR 3500 On Kotak Debit Card ending 4321. Merchant: BIGBASKET"
  {
    regex: /Spent\s+INR\s+([\d,]+(?:\.\d{1,2})?)\s+On\s+.+?ending\s+(\d{4})(?:.*?Merchant:\s*([A-Z0-9 &/._-]+?))?(?:\.|Available|$)/i,
    type: 'debit',
    amountGroup: 1,
    accountGroup: 2,
    merchantGroup: 3,
  },
  // Generic credit: "Rs.200 credited to A/c **1234" or "INR 200 credited"
  {
    regex: /(?:Rs\.?|INR)\s*([\d,]+(?:\.\d{1,2})?)\s+credited/i,
    type: 'credit',
    amountGroup: 1,
  },
  // Generic debit fallback: "debited Rs 500" or "debit of INR 500"
  {
    regex: /debit(?:ed)?\s+(?:of\s+)?(?:Rs\.?|INR)\s*([\d,]+(?:\.\d{1,2})?)/i,
    type: 'debit',
    amountGroup: 1,
  },
  // Generic credit fallback
  {
    regex: /credit(?:ed)?\s+(?:of\s+)?(?:Rs\.?|INR)\s*([\d,]+(?:\.\d{1,2})?)/i,
    type: 'credit',
    amountGroup: 1,
  },
];

/** Known sender addresses that send bank transaction alerts (filter noise) */
export const BANK_SENDER_PREFIXES = [
  'ICICIB', 'ICICIT', 'HDFCBK', 'SBIINB', 'SBISMS', 'AXISBK',
  'KOTAKB', 'INDBNK', 'YESBNK', 'PNBSMS', 'BOIIND', 'CENTBK',
  'CANBNK', 'UNIONB', 'IDBIBK',
];

/** Return true if the sender address looks like a bank transaction alert */
export function isBankSender(address: string): boolean {
  const upper = address.toUpperCase();
  return BANK_SENDER_PREFIXES.some((prefix) => upper.includes(prefix));
}

/**
 * Parse a bank SMS body and extract transaction details.
 * Returns null if the SMS does not match any known pattern.
 */
export function parseBankSMS(body: string): ParsedTransaction | null {
  for (const p of PATTERNS) {
    const match = body.match(p.regex);
    if (!match) continue;

    const rawAmount = match[p.amountGroup]?.replace(/,/g, '');
    const amount = parseFloat(rawAmount ?? '0');
    if (!amount || isNaN(amount)) continue;

    return {
      amount,
      type: p.type,
      merchant: p.merchantGroup ? match[p.merchantGroup]?.trim() || undefined : undefined,
      account: p.accountGroup ? match[p.accountGroup] || undefined : undefined,
    };
  }
  return null;
}
