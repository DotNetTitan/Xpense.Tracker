import * as SQLite from 'expo-sqlite';
import { Transaction } from '../types';

let db: SQLite.SQLiteDatabase | null = null;

export function getDb(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync('xpensetracker.db');
  }
  return db;
}

/** Create tables if they don't exist yet. Call once on app startup. */
export function initDb(): void {
  const database = getDb();
  database.execSync(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      merchant TEXT,
      bank TEXT,
      account TEXT,
      category TEXT DEFAULT 'Uncategorized',
      date INTEGER NOT NULL,
      raw_sms TEXT,
      sms_id TEXT UNIQUE
    );
    CREATE INDEX IF NOT EXISTS idx_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_category ON transactions(category);
    CREATE INDEX IF NOT EXISTS idx_type ON transactions(type);
  `);
}

/** Insert a transaction, silently ignoring duplicates (based on sms_id). */
export function insertTransaction(tx: Transaction): void {
  const database = getDb();
  database.runSync(
    `INSERT OR IGNORE INTO transactions
       (id, amount, type, merchant, bank, account, category, date, raw_sms, sms_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      tx.id,
      tx.amount,
      tx.type,
      tx.merchant ?? null,
      tx.bank,
      tx.account ?? null,
      tx.category,
      tx.date,
      tx.rawSms,
      tx.smsId,
    ]
  );
}

/** Bulk-insert an array of transactions (dedup via sms_id). Returns the number of rows actually inserted. */
export function bulkInsertTransactions(txs: Transaction[]): number {
  const database = getDb();
  let inserted = 0;
  database.withTransactionSync(() => {
    for (const tx of txs) {
      const result = database.runSync(
        `INSERT OR IGNORE INTO transactions
           (id, amount, type, merchant, bank, account, category, date, raw_sms, sms_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tx.id,
          tx.amount,
          tx.type,
          tx.merchant ?? null,
          tx.bank,
          tx.account ?? null,
          tx.category,
          tx.date,
          tx.rawSms,
          tx.smsId,
        ]
      );
      inserted += result.changes;
    }
  });
  return inserted;
}

/** Fetch transactions filtered by month (YYYY-MM) and optionally category. */
export function getTransactions(monthKey: string, category?: string): Transaction[] {
  const database = getDb();
  const [year, month] = monthKey.split('-').map(Number);
  const start = new Date(year, month - 1, 1).getTime();
  const end = new Date(year, month, 1).getTime();

  let query = `SELECT * FROM transactions WHERE date >= ? AND date < ?`;
  const params: (string | number)[] = [start, end];

  if (category && category !== 'All') {
    query += ` AND category = ?`;
    params.push(category);
  }

  query += ` ORDER BY date DESC`;

  const rows = database.getAllSync<any>(query, params);
  return rows.map(rowToTransaction);
}

/** Fetch all transactions ordered by date descending. */
export function getAllTransactions(): Transaction[] {
  const database = getDb();
  const rows = database.getAllSync<any>(
    `SELECT * FROM transactions ORDER BY date DESC`
  );
  return rows.map(rowToTransaction);
}

/** Get total spent (debit) per month for the last N months. */
export function getMonthlyTotals(monthsBack = 6): { month: string; total: number }[] {
  const database = getDb();
  const now = new Date();
  const results: { month: string; total: number }[] = [];

  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = d.getTime();
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const key = `${year}-${month}`;

    const row = database.getFirstSync<{ total: number }>(
      `SELECT COALESCE(SUM(amount), 0) as total FROM transactions
       WHERE type = 'debit' AND date >= ? AND date < ?`,
      [start, end]
    );
    results.push({ month: key, total: row?.total ?? 0 });
  }

  return results;
}

/** Get total spent per category for a month. */
export function getCategoryTotals(monthKey: string): { category: string; total: number }[] {
  const database = getDb();
  const [year, month] = monthKey.split('-').map(Number);
  const start = new Date(year, month - 1, 1).getTime();
  const end = new Date(year, month, 1).getTime();

  return database.getAllSync<{ category: string; total: number }>(
    `SELECT category, SUM(amount) as total FROM transactions
     WHERE type = 'debit' AND date >= ? AND date < ?
     GROUP BY category
     ORDER BY total DESC`,
    [start, end]
  );
}

/** Delete a transaction by id. */
export function deleteTransaction(id: string): void {
  const database = getDb();
  database.runSync(`DELETE FROM transactions WHERE id = ?`, [id]);
}

/** Update the category of a transaction. */
export function updateTransactionCategory(id: string, category: string): void {
  const database = getDb();
  database.runSync(`UPDATE transactions SET category = ? WHERE id = ?`, [category, id]);
}

/** Count total rows in the transactions table. */
export function getTransactionCount(): number {
  const database = getDb();
  const row = database.getFirstSync<{ count: number }>(
    `SELECT COUNT(*) as count FROM transactions`
  );
  return row?.count ?? 0;
}

function rowToTransaction(row: any): Transaction {
  return {
    id: row.id,
    amount: row.amount,
    type: row.type as 'debit' | 'credit',
    merchant: row.merchant ?? undefined,
    bank: row.bank,
    account: row.account ?? undefined,
    category: row.category,
    date: row.date,
    rawSms: row.raw_sms ?? '',
    smsId: row.sms_id,
  };
}
