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
  // ICICI UPI debit: "ICICI Bank Acct XX747 debited for Rs 46.00 on 28-Feb-26; SWIGGY credited. UPI:..."
  {
    regex: /ICICI Bank\s+(?:SAVINGS\s+)?Acc(?:t|ount)?\s+[Xx]+(\d+)\s+debited\s+for\s+Rs\.?\s*([\d,]+(?:\.\d{1,2})?)\s+on\s+[\d\w-]+;\s*(.+?)\s+credited/i,
    type: 'debit',
    amountGroup: 2,
    accountGroup: 1,
    merchantGroup: 3,
  },
  // ICICI upcoming/scheduled debit: "ICICI Bank SAVINGS Account XX747 will be debited for Rs 990.00 on 03-Mar-26"
  {
    regex: /ICICI Bank\s+.+?Acc(?:t|ount)?\s+[Xx]+(\d+)\s+will\s+be\s+debited\s+for\s+Rs\.?\s*([\d,]+(?:\.\d{1,2})?)/i,
    type: 'debit',
    amountGroup: 2,
    accountGroup: 1,
  },
  // ICICI credit with label: "ICICI Bank Acc XX747 is credited with salary of Rs. 1,00,000.00 on 02-Mar-26"
  {
    regex: /ICICI Bank\s+Acc(?:t|ount)?\s+[Xx]+(\d+)\s+is\s+credited\s+with\s+(.+?)\s+of\s+Rs\.?\s*([\d,]+(?:\.\d{1,2})?)/i,
    type: 'credit',
    amountGroup: 3,
    accountGroup: 1,
    merchantGroup: 2,
  },
  // Federal Bank credit: "Dear Customer, Rs.4500 credited to your A/c XX7806 on 02MAR2026"
  {
    regex: /Rs\.?\s*([\d,]+(?:\.\d{1,2})?)\s+credited\s+to\s+your\s+A\/c\s+[Xx]+(\d+)/i,
    type: 'credit',
    amountGroup: 1,
    accountGroup: 2,
  },
  // Federal Bank debit: "Rs.4500 debited from your A/c XX7806"
  {
    regex: /Rs\.?\s*([\d,]+(?:\.\d{1,2})?)\s+debited\s+from\s+your\s+A\/c\s+[Xx]+(\d+)/i,
    type: 'debit',
    amountGroup: 1,
    accountGroup: 2,
  },
  // HDFC: "Rs.1,500.00 debited from A/c **1234 at SWIGGY"
  {
    regex: /Rs\.?\s*([\d,]+(?:\.\d{1,2})?)\s+debited\s+from\s+(?:A\/c\s*[*x]+(\d{4}))?\s*(?:at\s+([A-Z0-9 &/._-]+?))?(?:\s+on|\s*\.|VPA|$)/i,
    type: 'debit',
    amountGroup: 1,
    accountGroup: 2,
    merchantGroup: 3,
  },
  // SBI: "Your A/c XXXX1234 debited by Rs.500"
  {
    regex: /A\/c\s*[Xx*]+(\d{4})\s+debited\s+by\s+Rs\.?\s*([\d,]+(?:\.\d{1,2})?)(?:.*?(?:UPI\/|towards\s+)([A-Z0-9@._-]+))?/i,
    type: 'debit',
    amountGroup: 2,
    accountGroup: 1,
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
  // Generic debit fallback
  {
    regex: /debit(?:ed)?\s+(?:for\s+)?(?:of\s+)?(?:Rs\.?|INR)\s*([\d,]+(?:\.\d{1,2})?)/i,
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
  'CANBNK', 'UNIONB', 'IDBIBK', 'FEDBNK', 'FEDBK',
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
