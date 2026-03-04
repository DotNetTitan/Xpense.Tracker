import { MaterialIcons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { AppColors } from '../../constants/theme';
import { useAppColors } from '../../hooks/use-app-colors';

interface Props {
  title?: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: string;
}

export function EmptyState({
  title = 'No transactions yet',
  subtitle = 'Tap "Sync SMS" to import your bank transactions automatically.',
  actionLabel,
  onAction,
  icon = 'receipt-long',
}: Props) {
  const colors = useAppColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <MaterialIcons name={icon as any} size={64} color={colors.disabledIcon} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {actionLabel && onAction && (
        <Button mode="contained" onPress={onAction} style={styles.button}>
          {actionLabel}
        </Button>
      )}
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 40,
      gap: 12,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.textPrimary,
      textAlign: 'center',
      marginTop: 8,
    },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    button: {
      marginTop: 8,
      borderRadius: 10,
    },
  });
}
