export interface Transaction {
  id: string;
  amount: number;
  type: 'debit' | 'credit';
  merchant?: string;
  bank: string;
  account?: string; // last 4 digits
  category: string;
  date: number; // Unix timestamp (ms)
  rawSms: string;
  smsId: string; // unique per SMS/email, prevents duplicate imports
  source?: 'sms' | 'email'; // origin of the transaction
}

export interface Category {
  name: string;
  color: string;
  icon: string;
}

export interface MonthlyTotal {
  month: string; // e.g. "2026-01"
  total: number;
}

export interface CategoryTotal {
  category: string;
  total: number;
  color: string;
}
