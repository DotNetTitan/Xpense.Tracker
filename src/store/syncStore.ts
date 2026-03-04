import { create } from 'zustand';

/**
 * Shared sync lock.
 *
 * Prevents SMS and email syncs from running concurrently, which would risk
 * SQLite "database is locked" errors and dedup race conditions.
 */
interface SyncLockState {
  /** Which sync is currently running, or null if idle. */
  activeSyncer: 'sms' | 'email' | null;
  acquire: (syncer: 'sms' | 'email') => boolean; // returns false if already locked
  release: () => void;
}

export const useSyncStore = create<SyncLockState>((set, get) => ({
  activeSyncer: null,
  acquire: (syncer) => {
    if (get().activeSyncer !== null) return false;
    set({ activeSyncer: syncer });
    return true;
  },
  release: () => set({ activeSyncer: null }),
}));
