import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const SYNC_DAYS_OPTIONS = [7, 14, 30, 90, 180, 365] as const;
export type SyncDaysOption = (typeof SYNC_DAYS_OPTIONS)[number];

interface SettingsState {
  syncDaysBack: SyncDaysOption;
  setSyncDaysBack: (days: SyncDaysOption) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      syncDaysBack: 365,
      setSyncDaysBack: (days) => set({ syncDaysBack: days }),
    }),
    {
      name: 'app-settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
