import { useCallback, useState } from 'react';
import { bulkInsertTransactions } from '../services/db.service';
import { useSyncStore } from '../store/syncStore';
import {
    fetchAndParseBankSMS,
    hasSmsPermission,
    requestSmsPermission,
} from '../services/sms.service';
import { useInvalidateTransactions } from './useTransactions';

export type SyncStatus = 'idle' | 'requesting_permission' | 'fetching' | 'done' | 'error';

export interface SyncResult {
  imported: number;
  total: number;
}

export function useSmsSync() {
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const invalidate = useInvalidateTransactions();
  const { acquire, release } = useSyncStore();

  const sync = useCallback(async (daysBack = 365) => {
    setError(null);
    setResult(null);

    if (!acquire('sms')) {
      setError('Email sync is already running. Please wait for it to finish.');
      setStatus('error');
      return;
    }

    try {
      // Check / request SMS permission
      setStatus('requesting_permission');
      let permitted = await hasSmsPermission();
      if (!permitted) {
        permitted = await requestSmsPermission();
      }
      if (!permitted) {
        setError('SMS permission was denied. Please grant it in Settings.');
        setStatus('error');
        return;
      }

      // Fetch and parse SMS
      setStatus('fetching');
      const parsed = await fetchAndParseBankSMS(daysBack);

      // Bulk insert (dedup via sms_id UNIQUE constraint)
      const inserted = bulkInsertTransactions(parsed);

      // Refresh queries
      await invalidate();

      setResult({ imported: inserted, total: parsed.length });
      setStatus('done');
    } catch (err: any) {
      setError(err?.message ?? 'An unknown error occurred.');
      setStatus('error');
    } finally {
      release();
    }
  }, [invalidate, acquire, release]);

  const reset = useCallback(() => {
    setStatus('idle');
    setResult(null);
    setError(null);
  }, []);

  return { sync, status, result, error, reset };
}
