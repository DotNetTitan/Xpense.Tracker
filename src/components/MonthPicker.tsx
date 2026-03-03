import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { monthLabel, toMonthKey } from '../utils/formatters';

interface Props {
  selectedMonth: string; // "YYYY-MM"
  onChange: (month: string) => void;
}

/** Generate last 12 months (current month last). */
function getLast12Months(): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(toMonthKey(d));
  }
  return months;
}

export function MonthPicker({ selectedMonth, onChange }: Props) {
  const months = getLast12Months();

  function shift(delta: number) {
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    const newKey = toMonthKey(d);
    // Clamp to available range
    if (months.includes(newKey)) onChange(newKey);
  }

  const currentMonthKey = toMonthKey(new Date());
  const isCurrentMonth = selectedMonth === currentMonthKey;
  const isOldestMonth = selectedMonth === months[0];

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => shift(-1)}
        disabled={isOldestMonth}
        style={styles.arrow}
      >
        <MaterialIcons
          name="chevron-left"
          size={28}
          color={isOldestMonth ? '#CBD5E1' : '#1565C0'}
        />
      </TouchableOpacity>

      <View style={styles.label}>
        <Text style={styles.labelText}>
          {monthLabel(selectedMonth)} {selectedMonth.split('-')[0]}
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => shift(1)}
        disabled={isCurrentMonth}
        style={styles.arrow}
      >
        <MaterialIcons
          name="chevron-right"
          size={28}
          color={isCurrentMonth ? '#CBD5E1' : '#1565C0'}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 16,
  },
  arrow: {
    padding: 4,
  },
  label: {
    minWidth: 120,
    alignItems: 'center',
  },
  labelText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
  },
});
