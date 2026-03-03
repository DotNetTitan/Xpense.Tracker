import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { Text } from 'react-native-paper';
import { CategoryTotal } from '../types';
import { formatCurrency } from '../utils/formatters';

interface Props {
  data: CategoryTotal[];
  totalSpent: number;
}

export function SpendingDonutChart({ data, totalSpent }: Props) {
  if (data.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No spending data this month.</Text>
      </View>
    );
  }

  const pieData = data.map((d) => ({
    value: d.total,
    color: d.color,
    text: d.category,
  }));

  return (
    <View style={styles.container}>
      <PieChart
        data={pieData}
        donut
        radius={90}
        innerRadius={55}
        centerLabelComponent={() => (
          <View style={styles.centerLabel}>
            <Text style={styles.centerAmount}>{formatCurrency(totalSpent)}</Text>
            <Text style={styles.centerSub}>spent</Text>
          </View>
        )}
        showText={false}
      />
      {/* Legend */}
      <View style={styles.legend}>
        {data.map((d) => (
          <View key={d.category} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: d.color }]} />
            <Text style={styles.legendLabel} numberOfLines={1}>
              {d.category}
            </Text>
            <Text style={styles.legendAmount}>{formatCurrency(d.total)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 20,
  },
  centerLabel: {
    alignItems: 'center',
  },
  centerAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  centerSub: {
    fontSize: 12,
    color: '#7B8B9A',
  },
  legend: {
    width: '100%',
    paddingHorizontal: 16,
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    flex: 1,
    fontSize: 13,
    color: '#444',
  },
  legendAmount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  empty: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#7B8B9A',
    fontSize: 14,
  },
});
