import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Surface, Text } from 'react-native-paper';
import { Transaction } from '../types';
import { CATEGORIES } from '../utils/categories';
import { formatCurrency, formatDate } from '../utils/formatters';

interface Props {
  transaction: Transaction;
}

export function TransactionCard({ transaction }: Props) {
  const { amount, type, merchant, category, date, bank } = transaction;
  const cat = CATEGORIES[category] ?? CATEGORIES.Uncategorized;
  const isDebit = type === 'debit';

  return (
    <Surface style={styles.card} elevation={1}>
      {/* Icon */}
      <View style={[styles.iconWrap, { backgroundColor: cat.color + '22' }]}>
        <MaterialIcons name={cat.icon as any} size={22} color={cat.color} />
      </View>

      {/* Details */}
      <View style={styles.details}>
        <Text style={styles.merchant} numberOfLines={1}>
          {merchant || bank}
        </Text>
        <Text style={styles.meta}>
          {category} · {formatDate(date)}
        </Text>
      </View>

      {/* Amount */}
      <Text style={[styles.amount, isDebit ? styles.debit : styles.credit]}>
        {isDebit ? '−' : '+'} {formatCurrency(amount)}
      </Text>
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  details: {
    flex: 1,
  },
  merchant: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  meta: {
    fontSize: 12,
    color: '#7B8B9A',
    marginTop: 2,
  },
  amount: {
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
  debit: {
    color: '#E53935',
  },
  credit: {
    color: '#43A047',
  },
});
