import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { TouchableOpacity } from 'react-native';
import { useAppColors } from '../../hooks/use-app-colors';
import { ThemeMode, useThemeStore } from '../store/themeStore';

const ICONS: Record<ThemeMode, keyof typeof MaterialIcons.glyphMap> = {
  system: 'brightness-auto',
  light: 'light-mode',
  dark: 'dark-mode',
};

interface Props {
  size?: number;
}

export function ThemeToggle({ size = 24 }: Props) {
  const colors = useAppColors();
  const { mode, toggle } = useThemeStore();

  return (
    <TouchableOpacity onPress={toggle} hitSlop={12}>
      <MaterialIcons name={ICONS[mode]} size={size} color={colors.primary} />
    </TouchableOpacity>
  );
}
