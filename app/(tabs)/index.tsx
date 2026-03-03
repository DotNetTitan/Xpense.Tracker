import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import { ActivityIndicator, FAB, Snackbar, Surface, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '../../src/components/EmptyState';
import { MonthPicker } from '../../src/components/MonthPicker';
import { TransactionCard } from '../../src/components/TransactionCard';
import { useSmsSync } from '../../src/hooks/useSmsSync';
import { useCategoryTotals, useTransactionCount, useTransactions } from '../../src/hooks/useTransactions';
import { useFilterStore } from '../../src/store/filterStore';
import { CATEGORIES } from '../../src/utils/categories';
import { formatCurrency } from '../../src/utils/formatters';

export default function DashboardScreen() {
  const { selectedMonth, setSelectedMonth } = useFilterStore();
  const { data: transactions = [], isLoading, refetch } = useTransactions();
  const { data: categoryTotals = [] } = useCategoryTotals();
  const { data: txCount = 0 } = useTransactionCount();
  const { sync, status, result, error, reset } = useSmsSync();

  const totalSpent = transactions
    .filter((t) => t.type === 'debit')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalCredited = transactions
    .filter((t) => t.type === 'credit')
    .reduce((sum, t) => sum + t.amount, 0);

  const recentTransactions = transactions.slice(0, 5);
  const top3Categories = categoryTotals.slice(0, 3);
  const isSyncing = status === 'fetching' || status === 'requesting_permission';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appTitle}>XpenseTracker</Text>
            <Text style={styles.appSub}>Your financial overview</Text>
          </View>
          <MaterialIcons name="account-balance-wallet" size={28} color="#1565C0" />
        </View>

        {/* Month Picker */}
        <MonthPicker selectedMonth={selectedMonth} onChange={setSelectedMonth} />

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <Surface style={[styles.summaryCard, { backgroundColor: '#1565C0' }]} elevation={3}>
            <MaterialIcons name="arrow-upward" size={18} color="rgba(255,255,255,0.8)" />
            <Text style={styles.summaryLabel}>Spent</Text>
            <Text style={styles.summaryAmount}>{formatCurrency(totalSpent)}</Text>
          </Surface>
          <Surface style={[styles.summaryCard, { backgroundColor: '#43A047' }]} elevation={3}>
            <MaterialIcons name="arrow-downward" size={18} color="rgba(255,255,255,0.8)" />
            <Text style={styles.summaryLabel}>Received</Text>
            <Text style={styles.summaryAmount}>{formatCurrency(totalCredited)}</Text>
          </Surface>
        </View>

        {/* Transaction count */}
        <Text style={styles.txCount}>
          {transactions.length} transaction{transactions.length !== 1 ? 's' : ''} this month
        </Text>

        {/* Top Categories */}
        {top3Categories.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Categories</Text>
            <View style={styles.categoriesRow}>
              {top3Categories.map((cat) => {
                const catDef = CATEGORIES[cat.category] ?? CATEGORIES.Uncategorized;
                return (
                  <Surface key={cat.category} style={styles.catCard} elevation={1}>
                    <View style={[styles.catIcon, { backgroundColor: catDef.color + '22' }]}>
                      <MaterialIcons name={catDef.icon as any} size={20} color={catDef.color} />
                    </View>
                    <Text style={styles.catName} numberOfLines={1}>{cat.category}</Text>
                    <Text style={[styles.catAmount, { color: catDef.color }]}>
                      {formatCurrency(cat.total)}
                    </Text>
                  </Surface>
                );
              })}
            </View>
          </View>
        )}

        {/* Recent Transactions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {isLoading ? (
            <ActivityIndicator style={{ padding: 24 }} color="#1565C0" />
          ) : recentTransactions.length === 0 ? (
            <EmptyState
              title={txCount === 0 ? 'No transactions yet' : 'Nothing this month'}
              subtitle={
                txCount === 0
                  ? 'Tap "Sync SMS" to import your bank transactions automatically.'
                  : 'No transactions found for this month. Try syncing or switching months.'
              }
            />
          ) : (
            recentTransactions.map((tx) => (
              <TransactionCard key={tx.id} transaction={tx} />
            ))
          )}
        </View>
      </ScrollView>

      {/* Sync FAB */}
      <FAB
        icon="sync"
        label={isSyncing ? 'Syncing…' : 'Sync SMS'}
        style={styles.fab}
        color="#fff"
        onPress={() => !isSyncing && sync()}
        loading={isSyncing}
        disabled={isSyncing}
      />

      {/* Snackbar */}
      <Snackbar
        visible={status === 'done' || status === 'error'}
        onDismiss={reset}
        duration={4000}
        style={status === 'error' ? styles.snackError : styles.snackSuccess}
      >
        {status === 'done'
          ? `Imported ${result?.imported ?? 0} transaction(s)`
          : error ?? 'Something went wrong'}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F7FB' },
  scroll: { flex: 1 },
  content: { paddingBottom: 100 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  appTitle: { fontSize: 22, fontWeight: '800', color: '#1a1a2e' },
  appSub: { fontSize: 13, color: '#7B8B9A', marginTop: 2 },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    gap: 4,
  },
  summaryLabel: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  summaryAmount: { fontSize: 20, fontWeight: '800', color: '#fff' },
  txCount: {
    fontSize: 12,
    color: '#7B8B9A',
    textAlign: 'center',
    marginTop: 8,
  },
  section: { marginTop: 20 },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a2e',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  categoriesRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
  },
  catCard: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#fff',
    padding: 12,
    alignItems: 'center',
    gap: 6,
  },
  catIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catName: { fontSize: 11, color: '#444', fontWeight: '600', textAlign: 'center' },
  catAmount: { fontSize: 12, fontWeight: '700' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 80,
    backgroundColor: '#1565C0',
    borderRadius: 28,
  },
  snackSuccess: { backgroundColor: '#2E7D32' },
  snackError: { backgroundColor: '#C62828' },
});
