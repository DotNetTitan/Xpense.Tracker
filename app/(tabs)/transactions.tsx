import React from 'react';
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
import { useTransactions } from '../../src/hooks/useTransactions';
import { useFilterStore } from '../../src/store/filterStore';
import { Transaction } from '../../src/types';
import { CATEGORIES } from '../../src/utils/categories';
import { formatDate } from '../../src/utils/formatters';

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
  const { selectedMonth, setSelectedMonth, selectedCategory, setSelectedCategory } =
    useFilterStore();
  const { data: transactions = [], isLoading, refetch } = useTransactions();

  const grouped = groupByDate(transactions);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Transactions</Text>
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
        <ActivityIndicator style={{ padding: 40 }} color="#1565C0" />
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
                <TransactionCard key={tx.id} transaction={tx} />
              ))}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F7FB' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  title: { fontSize: 22, fontWeight: '800', color: '#1a1a2e' },
  filterRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#E8EEF7',
    borderRadius: 20,
  },
  filterChipActive: {
    backgroundColor: '#1565C0',
  },
  filterChipText: {
    color: '#444',
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
    color: '#7B8B9A',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
