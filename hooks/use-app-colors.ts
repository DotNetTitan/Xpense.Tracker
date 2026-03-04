import { AppColors, Colors } from '../constants/theme';
import { useThemeStore } from '../src/store/themeStore';
import { useColorScheme } from './use-color-scheme';

/**
 * Returns the full resolved color palette based on the user's theme preference.
 * If mode is 'system', falls back to the OS dark/light setting.
 */
export function useAppColors(): AppColors {
  const systemScheme = useColorScheme();
  const mode = useThemeStore((s) => s.mode);

  const resolved =
    mode === 'system' ? (systemScheme ?? 'light') : mode;

  return Colors[resolved];
}

/**
 * Returns the effective color scheme string ('light' | 'dark').
 * Useful for wiring up navigation/paper themes in the root layout.
 */
export function useEffectiveColorScheme(): 'light' | 'dark' {
  const systemScheme = useColorScheme();
  const mode = useThemeStore((s) => s.mode);
  return mode === 'system' ? (systemScheme ?? 'light') : mode;
}
