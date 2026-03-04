import React, { useMemo, useState } from 'react';
import {
    FlatList,
    RefreshControl,
    StyleSheet,
    View,
} from 'react-native';
import { ActivityIndicator, Chip, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '../../src/components/EmptyState';
import { MonthPicker } from '../../src/components/MonthPicker';
import { TransactionCard } from '../../src/components/TransactionCard';
import { TransactionDetailModal } from '../../src/components/TransactionDetailModal';
import { useTransactions } from '../../src/hooks/useTransactions';
import { useFilterStore } from '../../src/store/filterStore';
import { ThemeToggle } from '../../src/components/ThemeToggle';
import { Transaction } from '../../src/types';
import { CATEGORIES } from '../../src/utils/categories';
import { formatDate } from '../../src/utils/formatters';
import { AppColors } from '../../constants/theme';
import { useAppColors } from '../../hooks/use-app-colors';

const ALL_CATEGORIES = ['All', ...Object.keys(CATEGORIES)];

function groupByDate(txs: Transaction[]): { date: string; items: Transaction[] }[] {
  const map = new Map<string, Transaction[]>();
  for (const tx of txs) {
    const key = formatDate(tx.date);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(tx);
  }
  return Array.from(map.entries()).map(([date, items]) => ({ date, items }));
}

export default function TransactionsScreen() {
  const colors = useAppColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { selectedMonth, setSelectedMonth, selectedCategory, setSelectedCategory } =
    useFilterStore();
  const { data: transactions = [], isLoading, refetch } = useTransactions();
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const grouped = groupByDate(transactions);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Transactions</Text>
        <ThemeToggle size={24} />
      </View>

      {/* Month Picker */}
      <MonthPicker selectedMonth={selectedMonth} onChange={setSelectedMonth} />

      {/* Category Filter */}
      <View>
        <FlatList
          data={ALL_CATEGORIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.filterRow}
          renderItem={({ item }) => (
            <Chip
              selected={selectedCategory === item}
              onPress={() => setSelectedCategory(item)}
              style={[
                styles.filterChip,
                selectedCategory === item && styles.filterChipActive,
              ]}
              textStyle={
                selectedCategory === item ? styles.filterChipTextActive : styles.filterChipText
              }
              compact
            >
              {item}
            </Chip>
          )}
        />
      </View>

      {/* Transaction List */}
      {isLoading ? (
        <ActivityIndicator style={{ padding: 40 }} color={colors.primary} />
      ) : grouped.length === 0 ? (
        <EmptyState
          title="No transactions"
          subtitle="No transactions match your current filters."
        />
      ) : (
        <FlatList
          data={grouped}
          keyExtractor={(item) => item.date}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={refetch} />
          }
          renderItem={({ item }) => (
            <View>
              <Text style={styles.dateHeader}>{item.date}</Text>
              {item.items.map((tx) => (
                <TransactionCard
                  key={tx.id}
                  transaction={tx}
                  onPress={setSelectedTx}
                />
              ))}
            </View>
          )}
        />
      )}

      {/* Detail modal */}
      <TransactionDetailModal
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
      />
    </SafeAreaView>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.pageBg },
    header: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 4,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    title: { fontSize: 22, fontWeight: '800', color: colors.textPrimary },
    filterRow: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      gap: 8,
    },
    filterChip: {
      backgroundColor: colors.filterChipBg,
      borderRadius: 20,
    },
    filterChipActive: {
      backgroundColor: colors.primary,
    },
    filterChipText: {
      color: colors.textMuted,
      fontSize: 12,
    },
    filterChipTextActive: {
      color: '#fff',
      fontSize: 12,
    },
    listContent: {
      paddingBottom: 32,
    },
    dateHeader: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textSecondary,
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 4,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
  });
}
