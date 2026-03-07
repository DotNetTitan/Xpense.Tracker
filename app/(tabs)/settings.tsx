import { MaterialIcons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Surface, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors } from '../../constants/theme';
import { useAppColors } from '../../hooks/use-app-colors';
import { ThemeToggle } from '../../src/components/ThemeToggle';
import {
  SYNC_DAYS_OPTIONS,
  SyncDaysOption,
  useSettingsStore,
} from '../../src/store/settingsStore';

const SYNC_DAYS_LABELS: Record<SyncDaysOption, string> = {
  7: 'Last 7 days',
  14: 'Last 14 days',
  30: 'Last 30 days',
  90: 'Last 3 months',
  180: 'Last 6 months',
  365: 'Last 1 year',
};

export default function SettingsScreen() {
  const colors = useAppColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { syncDaysBack, setSyncDaysBack } = useSettingsStore();
  const [syncPeriodExpanded, setSyncPeriodExpanded] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <ThemeToggle size={24} />
        </View>

        {/* Sync Days */}
        <Surface style={styles.card} elevation={1}>
          <TouchableOpacity
            style={styles.cardHeader}
            onPress={() => setSyncPeriodExpanded((v) => !v)}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeaderLeft}>
              <MaterialIcons name="sync" size={20} color={colors.primary} />
              <Text style={styles.cardTitle}>Sync Period</Text>
            </View>
            <MaterialIcons
              name={syncPeriodExpanded ? 'expand-less' : 'expand-more'}
              size={22}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
          {syncPeriodExpanded && (
            <>
              <Text style={styles.cardSubtitle}>
                How far back to look when syncing SMS and Gmail transactions.
              </Text>
              <View style={styles.optionsList}>
                {SYNC_DAYS_OPTIONS.map((days) => {
                  const selected = syncDaysBack === days;
                  return (
                    <TouchableOpacity
                      key={days}
                      style={[styles.optionRow, selected && styles.optionRowSelected]}
                      onPress={() => setSyncDaysBack(days)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[styles.optionLabel, selected && styles.optionLabelSelected]}
                      >
                        {SYNC_DAYS_LABELS[days]}
                      </Text>
                      {selected && (
                        <MaterialIcons name="check" size={20} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}
        </Surface>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.pageBg },
    scroll: { flex: 1 },
    content: { paddingBottom: 40 },
    header: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 4,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    title: { fontSize: 22, fontWeight: '800', color: colors.textPrimary },
    card: {
      margin: 16,
      borderRadius: 16,
      padding: 16,
      backgroundColor: colors.cardBg,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    cardHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    cardTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    cardSubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 8,
      marginBottom: 16,
      lineHeight: 18,
    },
    optionsList: {
      gap: 4,
    },
    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 10,
      backgroundColor: colors.surfaceVariant,
    },
    optionRowSelected: {
      backgroundColor: colors.primary + '1A',
    },
    optionLabel: {
      fontSize: 15,
      color: colors.textMuted,
    },
    optionLabelSelected: {
      color: colors.primary,
      fontWeight: '600',
    },
  });
}
