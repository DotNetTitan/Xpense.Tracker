import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Surface, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppColors } from '../../constants/theme';
import { useAppColors } from '../../hooks/use-app-colors';
import { EmptyState } from '../../src/components/EmptyState';
import { ExportButton } from '../../src/components/ExportButton';
import { MonthlyBarChart } from '../../src/components/MonthlyBarChart';
import { MonthPicker } from '../../src/components/MonthPicker';
import { SpendingDonutChart } from '../../src/components/SpendingDonutChart';
import { ThemeToggle } from '../../src/components/ThemeToggle';
import { useCategoryTotals, useMonthlyTotals, useTransactions } from '../../src/hooks/useTransactions';
import { useFilterStore } from '../../src/store/filterStore';
import { exportAnalyticsToExcel, generateExportFilename } from '../../src/utils/excelExport';
import { formatCurrency, monthLabel } from '../../src/utils/formatters';

export default function AnalyticsScreen() {
  const colors = useAppColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { selectedMonth, setSelectedMonth } = useFilterStore();
  const { data: categoryTotals = [], isLoading: loadingCats } = useCategoryTotals();
  const { data: monthlyTotals = [], isLoading: loadingMonthly } = useMonthlyTotals(6);
  const { data: transactions = [] } = useTransactions();

  const totalSpent = categoryTotals.reduce((s, c) => s + c.total, 0);
  const hasData = categoryTotals.length > 0 || monthlyTotals.some((m) => m.total > 0);

  const handleExport = async () => {
    const filename = generateExportFilename('analytics');
    await exportAnalyticsToExcel(categoryTotals, monthlyTotals, transactions, filename);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Analytics</Text>
          <View style={styles.headerActions}>
            <ExportButton onPress={handleExport} disabled={!hasData} />
            <ThemeToggle size={24} />
          </View>
        </View>

        {/* Month Picker */}
        <MonthPicker selectedMonth={selectedMonth} onChange={setSelectedMonth} />

        {!hasData && !loadingCats && !loadingMonthly ? (
          <View style={{ flex: 1, marginTop: 80 }}>
            <EmptyState
              title="No data yet"
              subtitle="Sync your bank SMS messages to see spending analytics."
              icon="insights"
            />
          </View>
        ) : (
          <>
            {/* Spending Breakdown */}
            <Surface style={styles.card} elevation={1}>
              <Text style={styles.cardTitle}>
                Spending Breakdown · {monthLabel(selectedMonth)}
              </Text>
              {loadingCats ? (
                <ActivityIndicator style={{ padding: 24 }} color={colors.primary} />
              ) : (
                <SpendingDonutChart data={categoryTotals} totalSpent={totalSpent} />
              )}
            </Surface>

            {/* Monthly Trend */}
            <Surface style={styles.card} elevation={1}>
              <Text style={styles.cardTitle}>Monthly Trend (Last 6 Months)</Text>
              {loadingMonthly ? (
                <ActivityIndicator style={{ padding: 24 }} color={colors.primary} />
              ) : (
                <MonthlyBarChart data={monthlyTotals} />
              )}
            </Surface>

            {/* Category Breakdown Table */}
            {categoryTotals.length > 0 && (
              <Surface style={styles.card} elevation={1}>
                <Text style={styles.cardTitle}>Category Details</Text>
                {categoryTotals.map((cat, index) => (
                  <View key={cat.category}>
                    <View style={styles.catRow}>
                      <View
                        style={[styles.catDot, { backgroundColor: cat.color }]}
                      />
                      <Text style={styles.catName}>{cat.category}</Text>
                      <Text style={styles.catPct}>
                        {totalSpent > 0
                          ? `${((cat.total / totalSpent) * 100).toFixed(1)}%`
                          : '—'}
                      </Text>
                      <Text style={styles.catAmount}>{formatCurrency(cat.total)}</Text>
                    </View>
                    {/* Progress bar */}
                    <View style={styles.barBg}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            width: totalSpent > 0
                              ? `${(cat.total / totalSpent) * 100}%`
                              : '0%',
                            backgroundColor: cat.color,
                          },
                        ]}
                      />
                    </View>
                    {index < categoryTotals.length - 1 && (
                      <View style={styles.divider} />
                    )}
                  </View>
                ))}
              </Surface>
            )}
          </>
        )}
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
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    title: { fontSize: 22, fontWeight: '800', color: colors.textPrimary },
    card: {
      margin: 16,
      marginBottom: 0,
      borderRadius: 16,
      padding: 16,
      backgroundColor: colors.cardBg,
    },
    cardTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 16,
    },
    catRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
      gap: 8,
    },
    catDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    catName: { flex: 1, fontSize: 14, color: colors.textMuted },
    catPct: { fontSize: 12, color: colors.textSecondary, minWidth: 40, textAlign: 'right' },
    catAmount: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
      minWidth: 80,
      textAlign: 'right',
    },
    barBg: {
      height: 6,
      backgroundColor: colors.progressBg,
      borderRadius: 3,
      marginBottom: 12,
      overflow: 'hidden',
    },
    barFill: {
      height: '100%',
      borderRadius: 3,
    },
    divider: {
      height: 1,
      backgroundColor: colors.progressBg,
      marginBottom: 12,
    },
  });
}
