import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  /** Cycle: system → light → dark → system */
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'system',
      setMode: (mode) => set({ mode }),
      toggle: () => {
        const next: Record<ThemeMode, ThemeMode> = {
          system: 'light',
          light: 'dark',
          dark: 'system',
        };
        set({ mode: next[get().mode] });
      },
    }),
    {
      name: 'theme-preference',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
