/**
 * useEmailSync — Gmail / Uber email sync hook.
 *
 * Uses @react-native-google-signin/google-signin (native SDK) for auth.
 * The native SDK handles token storage, refresh, and persistence automatically —
 * no SecureStore or manual refresh logic needed here.
 *
 * Flow:
 *  1. connect()  → GoogleSignin.signIn() shows the account picker once.
 *  2. doSync()   → getTokens() returns a fresh accessToken (auto-refreshed by
 *                  the SDK if expired), then calls the Gmail REST API directly.
 *  3. sync()     → called on mount if already signed in (silent restore), or
 *                  manually via the "Sync Gmail" button.
 *  4. disconnect() → revokeAccess() + signOut() clears everything.
 */

import {
  GoogleSignin,
  isCancelledResponse,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { useCallback, useEffect, useState } from 'react';
import { GMAIL_CONFIG } from '../config/gmail';
import { replaceWithEmailBatch } from '../services/db.service';
import { fetchAndParseUberEmails } from '../services/gmail.service';
import { useSettingsStore } from '../store/settingsStore';
import { useSyncStore } from '../store/syncStore';
import { useInvalidateTransactions } from './useTransactions';

// ─── Types ───────────────────────────────────────────────────────────────────

export type EmailSyncStatus =
  | 'idle'
  | 'requesting_auth'
  | 'fetching'
  | 'done'
  | 'error';

export interface EmailSyncResult {
  imported: number;
  total: number;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useEmailSync() {
  const [status, setStatus] = useState<EmailSyncStatus>('idle');
  const [result, setResult] = useState<EmailSyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const invalidate = useInvalidateTransactions();
  const { acquire, release } = useSyncStore();
  const syncDaysBack = useSettingsStore((s) => s.syncDaysBack);
  const hasHydrated = useSettingsStore((s) => s.hasHydrated);

  // Configure the native Google Sign-In SDK and check existing session on mount.
  useEffect(() => {
    GoogleSignin.configure({
      scopes: [...GMAIL_CONFIG.scopes],
      // No webClientId needed — we only want an accessToken for direct
      // Gmail API calls, not an idToken for server-side verification.
    });
    // hasPreviousSignIn() is synchronous and makes no network call.
    setIsConnected(GoogleSignin.hasPreviousSignIn());
  }, []);

  // ── Core sync logic ────────────────────────────────────────────────────────

  const doSync = useCallback(
    async (daysBack: number) => {
      if (!acquire('email')) {
        setError('SMS sync is already running. Please wait for it to finish.');
        setStatus('error');
        return;
      }
      try {
        setStatus('fetching');
        // getTokens() returns a valid access token; the SDK auto-refreshes
        // it if it has expired, so we never need to manage refresh tokens.
        const { accessToken } = await GoogleSignin.getTokens();
        const emails = await fetchAndParseUberEmails(accessToken, daysBack);
        const inserted = replaceWithEmailBatch(emails);
        await invalidate();
        setResult({ imported: inserted, total: emails.length });
        setStatus('done');
      } catch (err: any) {
        setError(err?.message ?? 'Email sync failed');
        setStatus('error');
      } finally {
        release();
      }
    },
    [invalidate, acquire, release],
  );

  // ── Public API ────────────────────────────────────────────────────────────

  /** Open the Google account picker, then immediately sync using configured days back. */
  const connect = useCallback(async () => {
    setError(null);
    setResult(null);
    setStatus('requesting_auth');

    // ── Auth phase ───────────────────────────────────────────────────────────
    let signedIn = false;
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();

      if (isCancelledResponse(response)) {
        setStatus('idle');
        return;
      }

      if (isSuccessResponse(response)) {
        setIsConnected(true);
        signedIn = true;
      }
    } catch (err: any) {
      if (isErrorWithCode(err) && err.code === statusCodes.IN_PROGRESS) {
        setStatus('idle'); // dialog already open — ignore
      } else {
        setError(err?.message ?? 'Google sign-in failed');
        setStatus('error');
      }
      return;
    }

    // ── Sync phase (errors reported separately from auth errors) ─────────────
    if (signedIn) {
      await doSync(syncDaysBack);
    }
  }, [doSync, syncDaysBack]);

  /**
   * Sync Uber emails silently (no UI). Safe to call on app open.
   * No-op if the user has never signed in or settings haven't hydrated yet.
   */
  const sync = useCallback(
    async () => {
      if (!isConnected) return;
      // Wait until the persisted settings have been loaded from AsyncStorage
      // so the correct look-back window is used (not just the default).
      if (!hasHydrated) return;
      setError(null);
      setResult(null);
      try {
        // signInSilently restores the persisted session without any UI.
        // If tokens were revoked on Google's side we mark as disconnected.
        const silentResponse = await GoogleSignin.signInSilently();
        if (silentResponse.type === 'noSavedCredentialFound') {
          setIsConnected(false);
          return;
        }
        await doSync(syncDaysBack);
      } catch (err: any) {
        setError(err?.message ?? 'Email sync failed');
        setStatus('error');
      }
    },
    [isConnected, hasHydrated, doSync, syncDaysBack],
  );

  /** Revoke Google access and sign out completely. */
  const disconnect = useCallback(async () => {
    try {
      await GoogleSignin.revokeAccess();
      await GoogleSignin.signOut();
    } catch {
      // best-effort
    }
    setIsConnected(false);
    setStatus('idle');
    setResult(null);
    setError(null);
  }, []);

  /** Dismiss snackbar / reset status without signing out. */
  const reset = useCallback(() => {
    setStatus('idle');
    setResult(null);
    setError(null);
  }, []);

  return {
    connect,
    sync,
    disconnect,
    reset,
    status,
    result,
    error,
    isConnected,
  };
}
