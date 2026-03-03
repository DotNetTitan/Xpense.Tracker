import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
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

interface Props {
  transaction: Transaction | null;
  onClose: () => void;
}

export function TransactionDetailModal({ transaction, onClose }: Props) {
  const [showRawSms, setShowRawSms] = useState(false);
  const deleteMutation = useDeleteTransaction();
  const updateCategoryMutation = useUpdateTransactionCategory();

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
            <MaterialIcons name="close" size={22} color="#7B8B9A" />
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
                    color={isSelected ? info.color : '#7B8B9A'}
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
                  color="#7B8B9A"
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
            <MaterialIcons name="delete-outline" size={20} color="#E53935" />
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
  return (
    <View style={styles.detailRow}>
      <MaterialIcons name={icon as any} size={18} color="#7B8B9A" style={styles.detailIcon} />
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FB',
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
    width: 38, // same width as closeBtn to keep handle centered
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D0D7E2',
  },
  closeBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    backgroundColor: '#E8EEF7',
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
  amountDebit: { color: '#E53935' },
  amountCredit: { color: '#43A047' },
  typeLabel: {
    fontSize: 13,
    color: '#7B8B9A',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  detailIcon: { marginRight: 12 },
  detailLabel: {
    fontSize: 14,
    color: '#7B8B9A',
    width: 76,
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a2e',
    textAlign: 'right',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E8EEF7',
    marginLeft: 30,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7B8B9A',
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
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E8EEF7',
  },
  categoryChipLabel: {
    fontSize: 13,
    color: '#7B8B9A',
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
    color: '#7B8B9A',
  },
  rawSmsBox: {
    backgroundColor: '#E8EEF7',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  rawSmsText: {
    fontSize: 12,
    color: '#555',
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
    borderColor: '#FFCDD2',
    backgroundColor: '#FFF5F5',
  },
  deleteBtnLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#E53935',
  },
});
