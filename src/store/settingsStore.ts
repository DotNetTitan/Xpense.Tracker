import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const SYNC_DAYS_OPTIONS = [7, 14, 30, 90, 180, 365] as const;
export type SyncDaysOption = (typeof SYNC_DAYS_OPTIONS)[number];

export const DEFAULT_SYNC_DAYS: SyncDaysOption = 365;

/** Clamp an unknown persisted value to a valid SyncDaysOption, falling back to the default. */
function normalizeSyncDays(value: unknown): SyncDaysOption {
  if ((SYNC_DAYS_OPTIONS as readonly unknown[]).includes(value)) {
    return value as SyncDaysOption;
  }
  return DEFAULT_SYNC_DAYS;
}

interface SettingsState {
  syncDaysBack: SyncDaysOption;
  setSyncDaysBack: (days: SyncDaysOption) => void;
  /** True once the persisted state has been loaded from AsyncStorage. */
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      syncDaysBack: DEFAULT_SYNC_DAYS,
      setSyncDaysBack: (days) => set({ syncDaysBack: days }),
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: 'app-settings',
      storage: createJSONStorage(() => AsyncStorage),
      /** Only persist syncDaysBack — hasHydrated is runtime-only state. */
      partialize: (state) => ({ syncDaysBack: state.syncDaysBack }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const normalized = normalizeSyncDays(state.syncDaysBack);
          if (normalized !== state.syncDaysBack) {
            state.setSyncDaysBack(normalized);
          }
          state.setHasHydrated(true);
        }
      },
    },
  ),
);
