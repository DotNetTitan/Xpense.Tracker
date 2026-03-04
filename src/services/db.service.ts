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
      sms_id TEXT UNIQUE,
      source TEXT DEFAULT 'sms'
    );
    CREATE INDEX IF NOT EXISTS idx_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_category ON transactions(category);
    CREATE INDEX IF NOT EXISTS idx_type ON transactions(type);
  `);
  // Run migrations for existing databases (add columns added after initial release)
  migrateDb(database);
}

function migrateDb(database: SQLite.SQLiteDatabase): void {
  try {
    database.execSync(`ALTER TABLE transactions ADD COLUMN source TEXT DEFAULT 'sms'`);
  } catch {
    // Column already exists — no-op
  }
}

/** Insert a transaction, silently ignoring duplicates (based on sms_id). */
export function insertTransaction(tx: Transaction): void {
  const database = getDb();
  database.runSync(
    `INSERT OR IGNORE INTO transactions
       (id, amount, type, merchant, bank, account, category, date, raw_sms, sms_id, source)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      tx.source ?? 'sms',
    ]
  );
}

/** Bulk-insert an array of transactions (dedup via sms_id). Returns the number of rows actually inserted.
 *
 * For SMS debit rows, checks whether a matching email transaction already exists
 * (within ±10 minutes, SMS amount within [email amount, email amount + ₹100]).
 * If found: updates the email row's amount to the SMS amount (what was actually paid),
 * and sets the email's merchant/category on that row, then skips inserting again.
 * This means the SMS amount (actual debit) is always the recorded figure.
 */
export function bulkInsertTransactions(txs: Transaction[]): number {
  const database = getDb();
  const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
  const TOLERANCE = 100;             // max ₹ the SMS can exceed the email amount
  let inserted = 0;
  database.withTransactionSync(() => {
    for (const tx of txs) {
      // For SMS debit rows, check if a richer email row already covers this payment.
      if ((tx.source ?? 'sms') === 'sms' && tx.type === 'debit') {
        const existing = database.getFirstSync<{ id: string }>(
          `SELECT id FROM transactions
           WHERE ABS(date - ?) < ?
             AND amount <= ?
             AND amount >= ? - ?
             AND type = 'debit'
             AND source = 'email'
           LIMIT 1`,
          [tx.date, WINDOW_MS, tx.amount, tx.amount, TOLERANCE]
        );
        if (existing) {
          // Update the email row to reflect the real paid amount from the SMS.
          // Merchant/category from the email are already correct — keep them.
          database.runSync(
            `UPDATE transactions SET amount = ? WHERE id = ?`,
            [tx.amount, existing.id]
          );
          continue; // don't insert a redundant SMS row
        }
      }

      const result = database.runSync(
        `INSERT OR IGNORE INTO transactions
           (id, amount, type, merchant, bank, account, category, date, raw_sms, sms_id, source)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
          tx.source ?? 'sms',
        ]
      );
      inserted += result.changes;
    }
  });
  return inserted;
}

/**
 * For each email-sourced transaction, check if a matching SMS row already exists.
 * If yes: enrich the SMS row with the email's merchant name and category (the SMS
 * amount — what was actually paid — is preserved), then skip inserting the email row.
 * If no: insert the email row normally so the ride is still recorded.
 *
 * Matching criteria (tuned for Uber UPI payments):
 *   - Within ±10 minutes of the email timestamp
 *   - SMS debit amount is between the email amount and email amount + ₹100
 *     (covers GPay rounding, small tips, or surge differences paid via UPI)
 *   - Both are debit transactions
 */
export function replaceWithEmailBatch(txs: Transaction[]): number {
  const database = getDb();
  const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
  const TOLERANCE = 100;             // max ₹ the SMS can exceed the email amount
  let inserted = 0;
  database.withTransactionSync(() => {
    for (const tx of txs) {
      // Look for a matching SMS row that represents the same real payment.
      const matchingSms = database.getFirstSync<{ id: string }>(
        `SELECT id FROM transactions
         WHERE ABS(date - ?) < ?
           AND amount >= ?
           AND amount <= ? + ?
           AND type = 'debit'
           AND (source = 'sms' OR source IS NULL)
         LIMIT 1`,
        [tx.date, WINDOW_MS, tx.amount, tx.amount, TOLERANCE]
      );

      if (matchingSms) {
        // SMS row exists: patch it with the meaningful merchant name and category
        // from the email receipt, but keep the SMS amount (actual debit).
        database.runSync(
          `UPDATE transactions SET merchant = ?, category = ?, bank = ? WHERE id = ?`,
          [tx.merchant ?? null, tx.category, tx.bank, matchingSms.id]
        );
        continue; // don't insert a redundant email row
      }
      const result = database.runSync(
        `INSERT OR IGNORE INTO transactions
           (id, amount, type, merchant, bank, account, category, date, raw_sms, sms_id, source)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
          'email',
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

/**
 * One-time reconciliation run on app startup.
 *
 * For each existing email debit row, finds the matching SMS row (same ±10 min window,
 * SMS amount within [email amount, email amount + ₹100]).
 * If found:
 *   - Updates the SMS row with the email's merchant name and category.
 *   - Deletes the email row (the SMS amount — actual debit — is what we keep).
 * If not found: leaves the email row untouched.
 *
 * Safe to call every startup — it is idempotent once email rows are cleaned up.
 */
export function deduplicateExistingTransactions(): void {
  const database = getDb();
  const WINDOW_MS = 10 * 60 * 1000;
  const TOLERANCE = 100;

  const emailRows = database.getAllSync<{
    id: string;
    date: number;
    amount: number;
    merchant: string | null;
    category: string;
    bank: string;
  }>(
    `SELECT id, date, amount, merchant, category, bank
     FROM transactions WHERE type = 'debit' AND source = 'email'`
  );

  if (emailRows.length === 0) return;

  database.withTransactionSync(() => {
    for (const emailRow of emailRows) {
      const smsRow = database.getFirstSync<{ id: string }>(
        `SELECT id FROM transactions
         WHERE ABS(date - ?) < ?
           AND amount >= ?
           AND amount <= ? + ?
           AND type = 'debit'
           AND (source = 'sms' OR source IS NULL)
         LIMIT 1`,
        [emailRow.date, WINDOW_MS, emailRow.amount, emailRow.amount, TOLERANCE]
      );

      if (smsRow) {
        // Enrich the SMS row with the meaningful merchant/category from the email.
        database.runSync(
          `UPDATE transactions SET merchant = ?, category = ?, bank = ? WHERE id = ?`,
          [emailRow.merchant ?? null, emailRow.category, emailRow.bank, smsRow.id]
        );
        // Remove the email row — the SMS row now has the correct amount + metadata.
        database.runSync(`DELETE FROM transactions WHERE id = ?`, [emailRow.id]);
      }
      // No SMS match → leave the email row as the sole record of this trip.
    }
  });
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
    source: (row.source as 'sms' | 'email') ?? 'sms',
  };
}
