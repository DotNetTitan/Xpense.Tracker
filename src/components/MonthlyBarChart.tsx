import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { Text } from 'react-native-paper';
import { MonthlyTotal } from '../types';
import { formatCurrency, monthLabel } from '../utils/formatters';

interface Props {
  data: MonthlyTotal[];
}

export function MonthlyBarChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No monthly data available.</Text>
      </View>
    );
  }

  const barData = data.map((d, i) => ({
    value: d.total,
    label: monthLabel(d.month),
    frontColor: i === data.length - 1 ? '#1565C0' : '#90CAF9',
    topLabelComponent: () =>
      d.total > 0 ? (
        <Text style={styles.barTopLabel}>
          {formatCurrency(d.total).replace('₹', '').trim()}
        </Text>
      ) : null,
  }));

  const maxVal = Math.max(...data.map((d) => d.total), 1);

  return (
    <View style={styles.container}>
      <BarChart
        data={barData}
        barWidth={32}
        spacing={20}
        roundedTop
        roundedBottom
        hideRules
        xAxisLabelTextStyle={styles.xLabel}
        noOfSections={4}
        maxValue={maxVal * 1.2}
        yAxisTextStyle={styles.yLabel}
        yAxisTextNumberOfLines={1}
        hideYAxisText={false}
        isAnimated
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  barTopLabel: {
    fontSize: 9,
    color: '#7B8B9A',
    marginBottom: 2,
  },
  xLabel: {
    color: '#7B8B9A',
    fontSize: 11,
  },
  yLabel: {
    color: '#7B8B9A',
    fontSize: 10,
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
