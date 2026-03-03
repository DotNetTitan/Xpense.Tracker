/**
 * Format a number as Indian currency string.
 * e.g. 1234567.89 → "₹12,34,567.89"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a Unix timestamp (ms) to a human-readable date string.
 * e.g. 1677600000000 → "03 Mar 2026"
 */
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** Map raw SMS sender codes to human-readable bank names. */
const BANK_NAME_MAP: Record<string, string> = {
  ICICIB: 'ICICI Bank',
  ICICIT: 'ICICI Bank',
  HDFCBK: 'HDFC Bank',
  RMHDFB: 'HDFC Bank',
  SBINBK: 'SBI',
  SBIINB: 'SBI',
  SBISMS: 'SBI',
  AXISBK: 'Axis Bank',
  KOTAKB: 'Kotak Bank',
  YESBNK: 'Yes Bank',
  INDBNK: 'Indian Bank',
  CANBNK: 'Canara Bank',
  PNBSMS: 'Punjab National Bank',
  BOIIND: 'Bank of India',
  CENTBK: 'Central Bank',
  UNIONB: 'Union Bank',
  IDBIBK: 'IDBI Bank',
  BOBACC: 'Bank of Baroda',
  SCBANK: 'Standard Chartered',
  CITIBK: 'Citibank',
  FEDBNK: 'Federal Bank',
  FEDBK: 'Federal Bank',
};

/**
 * Convert a raw SMS sender address (e.g. "AX-ICICIT-T" or "ICICIB") to a
 * human-readable bank name. Falls back to the original string if unknown.
 */
export function normalizeBankName(raw: string): string {
  // Strip common carrier prefixes like "AD-", "AX-", "BZ-", "VM-" and suffixes like "-T"
  const cleaned = raw.toUpperCase().replace(/^[A-Z]{2}-/, '').replace(/-[A-Z]$/, '');
  return BANK_NAME_MAP[cleaned] ?? raw;
}

/**
 * Return a "YYYY-MM" string from a Date or timestamp.
 */
export function toMonthKey(dateOrTs: Date | number): string {
  const d = typeof dateOrTs === 'number' ? new Date(dateOrTs) : dateOrTs;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Return a short month label from a "YYYY-MM" key.
 * e.g. "2026-03" → "Mar"
 */
export function monthLabel(key: string): string {
  const [year, month] = key.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('en-IN', { month: 'short' });
}
