/**
 * App color tokens for light and dark mode.
 * All colors used in screens and components should come from here via useAppColors().
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
    // Backgrounds
    pageBg: '#F4F7FB',
    cardBg: '#FFFFFF',
    surfaceVariant: '#E8EEF7',
    modalBg: '#F4F7FB',
    // Text
    textPrimary: '#1a1a2e',
    textSecondary: '#7B8B9A',
    textMuted: '#444444',
    textOnPrimary: '#FFFFFF',
    // Accent
    primary: '#1565C0',
    secondary: '#1E88E5',
    // Semantic
    debit: '#E53935',
    credit: '#43A047',
    gmailFab: '#DB4437',
    successBg: '#2E7D32',
    errorBg: '#C62828',
    deleteBg: '#FFF5F5',
    deleteBorder: '#FFCDD2',
    // Tab bar
    tabBarBg: '#FFFFFF',
    tabBarBorder: '#E0E7EF',
    tabBarActive: '#1565C0',
    tabBarInactive: '#90A4AE',
    // Chips / filters
    filterChipBg: '#E8EEF7',
    // Charts
    barInactive: '#90CAF9',
    progressBg: '#F0F4F8',
    // Misc
    divider: '#E8EEF7',
    dragHandle: '#D0D7E2',
    disabledIcon: '#CBD5E1',
    rawSmsBg: '#E8EEF7',
    rawSmsText: '#555555',
  },
  dark: {
    // Backgrounds
    pageBg: '#121212',
    cardBg: '#1E1E1E',
    surfaceVariant: '#2C2C2C',
    modalBg: '#121212',
    // Text
    textPrimary: '#E4E4E4',
    textSecondary: '#9E9E9E',
    textMuted: '#BDBDBD',
    textOnPrimary: '#FFFFFF',
    // Accent
    primary: '#5C9CE6',
    secondary: '#64B5F6',
    // Semantic
    debit: '#EF5350',
    credit: '#66BB6A',
    gmailFab: '#DB4437',
    successBg: '#1B5E20',
    errorBg: '#B71C1C',
    deleteBg: '#2C1212',
    deleteBorder: '#7B2020',
    // Tab bar
    tabBarBg: '#1E1E1E',
    tabBarBorder: '#333333',
    tabBarActive: '#5C9CE6',
    tabBarInactive: '#757575',
    // Chips / filters
    filterChipBg: '#2C2C2C',
    // Charts
    barInactive: '#3D5A80',
    progressBg: '#2C2C2C',
    // Misc
    divider: '#2C2C2C',
    dragHandle: '#444444',
    disabledIcon: '#444444',
    rawSmsBg: '#2C2C2C',
    rawSmsText: '#BDBDBD',
  },
};

/** Type of all resolved app color tokens */
export type AppColors = typeof Colors.light;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
