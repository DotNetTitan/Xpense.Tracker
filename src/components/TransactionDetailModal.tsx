import { MaterialIcons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
    Alert,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    useDeleteTransaction,
    useUpdateTransactionCategory,
} from '../hooks/useTransactions';
import { Transaction } from '../types';
import { CATEGORIES } from '../utils/categories';
import { formatCurrency, formatDate, normalizeBankName, normalizeMerchantName } from '../utils/formatters';
import { AppColors } from '../../constants/theme';
import { useAppColors } from '../../hooks/use-app-colors';

interface Props {
  transaction: Transaction | null;
  onClose: () => void;
}

export function TransactionDetailModal({ transaction, onClose }: Props) {
  const [showRawSms, setShowRawSms] = useState(false);
  const deleteMutation = useDeleteTransaction();
  const updateCategoryMutation = useUpdateTransactionCategory();

  const colors = useAppColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (!transaction) return null;

  const { id, amount, type, merchant, bank, account, category, date, rawSms } = transaction;
  const cat = CATEGORIES[category] ?? CATEGORIES.Uncategorized;
  const isDebit = type === 'debit';
  const bankDisplay = normalizeBankName(bank);

  function handleDelete() {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteMutation.mutate(id, { onSuccess: onClose });
          },
        },
      ]
    );
  }

  function handleCategoryChange(newCategory: string) {
    if (newCategory === category) return;
    updateCategoryMutation.mutate({ id, category: newCategory });
  }

  return (
    <Modal
      visible={!!transaction}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* Drag handle + close */}
        <View style={styles.handleRow}>
          {/* Left spacer keeps handle centered */}
          <View style={styles.handleSpacer} />
          <View style={styles.handle} />
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={16}>
            <MaterialIcons name="close" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Category icon + amount */}
          <View style={styles.heroSection}>
            <View style={[styles.heroIcon, { backgroundColor: cat.color + '22' }]}>
              <MaterialIcons name={cat.icon as any} size={36} color={cat.color} />
            </View>
            <Text style={[styles.amount, isDebit ? styles.amountDebit : styles.amountCredit]}>
              {isDebit ? '−' : '+'} {formatCurrency(amount)}
            </Text>
            <Text style={styles.typeLabel}>{isDebit ? 'Expense' : 'Income'}</Text>
          </View>

          {/* Details card */}
          <View style={styles.card}>
            <DetailRow
              icon="store"
              label="Merchant"
              value={merchant ? normalizeMerchantName(merchant) : '—'}
            />
            <Divider />
            <DetailRow
              icon="account-balance"
              label="Bank"
              value={bankDisplay}
            />
            {account ? (
              <>
                <Divider />
                <DetailRow
                  icon="credit-card"
                  label="Account"
                  value={`•••• ${account}`}
                />
              </>
            ) : null}
            <Divider />
            <DetailRow
              icon="calendar-today"
              label="Date"
              value={formatDate(date)}
            />
          </View>

          {/* Category picker */}
          <Text style={styles.sectionLabel}>Category</Text>
          <View style={styles.categoryGrid}>
            {Object.entries(CATEGORIES).map(([key, info]) => {
              const isSelected = key === (updateCategoryMutation.variables?.category ?? category);
              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.categoryChip,
                    isSelected && { backgroundColor: info.color + '22', borderColor: info.color },
                  ]}
                  onPress={() => handleCategoryChange(key)}
                  disabled={updateCategoryMutation.isPending}
                >
                  <MaterialIcons
                    name={info.icon as any}
                    size={16}
                    color={isSelected ? info.color : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.categoryChipLabel,
                      isSelected && { color: info.color, fontWeight: '700' },
                    ]}
                  >
                    {key}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Raw SMS toggle */}
          {rawSms ? (
            <>
              <TouchableOpacity
                style={styles.rawSmsToggle}
                onPress={() => setShowRawSms((v) => !v)}
              >
                <MaterialIcons
                  name={showRawSms ? 'expand-less' : 'expand-more'}
                  size={18}
                  color={colors.textSecondary}
                />
                <Text style={styles.rawSmsToggleLabel}>
                  {showRawSms ? 'Hide' : 'Show'} raw SMS
                </Text>
              </TouchableOpacity>
              {showRawSms && (
                <View style={styles.rawSmsBox}>
                  <Text style={styles.rawSmsText}>{rawSms}</Text>
                </View>
              )}
            </>
          ) : null}

          {/* Delete button */}
          <Pressable
            style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.75 }]}
            onPress={handleDelete}
            disabled={deleteMutation.isPending}
          >
            <MaterialIcons name="delete-outline" size={20} color={colors.debit} />
            <Text style={styles.deleteBtnLabel}>Delete Transaction</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  const colors = useAppColors();
  return (
    <View style={sharedStyles.detailRow}>
      <MaterialIcons name={icon as any} size={18} color={colors.textSecondary} style={sharedStyles.detailIcon} />
      <Text style={[sharedStyles.detailLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[sharedStyles.detailValue, { color: colors.textPrimary }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function Divider() {
  const colors = useAppColors();
  return <View style={[sharedStyles.divider, { backgroundColor: colors.divider }]} />;
}

/** Layout-only styles shared between DetailRow and Divider (no colors). */
const sharedStyles = StyleSheet.create({
  detailRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  detailIcon: { marginRight: 12 },
  detailLabel: { fontSize: 14, width: 76 },
  detailValue: { flex: 1, fontSize: 14, fontWeight: '600', textAlign: 'right' },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 30 },
});

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.modalBg,
    },
    handleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 12,
      paddingHorizontal: 16,
      paddingBottom: 8,
      zIndex: 1,
    },
    handleSpacer: {
      width: 38,
    },
    handle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.dragHandle,
    },
    closeBtn: {
      width: 38,
      height: 38,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 19,
      backgroundColor: colors.surfaceVariant,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingBottom: 32,
    },
    heroSection: {
      alignItems: 'center',
      paddingVertical: 24,
    },
    heroIcon: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    amount: {
      fontSize: 32,
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    amountDebit: { color: colors.debit },
    amountCredit: { color: colors.credit },
    typeLabel: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 4,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    card: {
      backgroundColor: colors.cardBg,
      borderRadius: 16,
      paddingHorizontal: 16,
      marginBottom: 20,
      elevation: 1,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
    },
    sectionLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 10,
    },
    categoryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 20,
    },
    categoryChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 20,
      backgroundColor: colors.cardBg,
      borderWidth: 1.5,
      borderColor: colors.divider,
    },
    categoryChipLabel: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    rawSmsToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginBottom: 8,
      alignSelf: 'flex-start',
    },
    rawSmsToggleLabel: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    rawSmsBox: {
      backgroundColor: colors.rawSmsBg,
      borderRadius: 10,
      padding: 12,
      marginBottom: 20,
    },
    rawSmsText: {
      fontSize: 12,
      color: colors.rawSmsText,
      lineHeight: 18,
    },
    deleteBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 8,
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: colors.deleteBorder,
      backgroundColor: colors.deleteBg,
    },
    deleteBtnLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.debit,
    },
  });
}
