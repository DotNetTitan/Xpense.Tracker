import { MaterialIcons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Surface, Text } from 'react-native-paper';
import { AppColors } from '../../constants/theme';
import { useAppColors } from '../../hooks/use-app-colors';
import { Transaction } from '../types';
import { CATEGORIES } from '../utils/categories';
import { formatCurrency, formatDate, normalizeBankName, normalizeMerchantName } from '../utils/formatters';

interface Props {
  transaction: Transaction;
  onPress?: (transaction: Transaction) => void;
}

export function TransactionCard({ transaction, onPress }: Props) {
  const colors = useAppColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { amount, type, merchant, category, date, bank } = transaction;
  const cat = CATEGORIES[category] ?? CATEGORIES.Uncategorized;
  const isDebit = type === 'debit';

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress ? () => onPress(transaction) : undefined}
    >
      <Surface style={styles.card} elevation={1}>
      {/* Icon */}
      <View style={[styles.iconWrap, { backgroundColor: cat.color + '22' }]}>
        <MaterialIcons name={cat.icon as any} size={22} color={cat.color} />
      </View>

      {/* Details */}
      <View style={styles.details}>
        <Text style={styles.merchant} numberOfLines={1}>
          {merchant ? normalizeMerchantName(merchant) : normalizeBankName(bank)}
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
    </TouchableOpacity>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginHorizontal: 16,
      marginVertical: 4,
      borderRadius: 12,
      backgroundColor: colors.cardBg,
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
      color: colors.textPrimary,
    },
    meta: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    amount: {
      fontSize: 15,
      fontWeight: '700',
      marginLeft: 8,
    },
    debit: {
      color: colors.debit,
    },
    credit: {
      color: colors.credit,
    },
  });
}
