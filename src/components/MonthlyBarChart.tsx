import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { Text } from 'react-native-paper';
import { AppColors } from '../../constants/theme';
import { useAppColors } from '../../hooks/use-app-colors';
import { MonthlyTotal } from '../types';
import { formatCurrency, monthLabel } from '../utils/formatters';

interface Props {
  data: MonthlyTotal[];
}

export function MonthlyBarChart({ data }: Props) {
  const colors = useAppColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

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
    frontColor: i === data.length - 1 ? colors.primary : colors.barInactive,
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

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    container: {
      paddingVertical: 8,
    },
    barTopLabel: {
      fontSize: 9,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    xLabel: {
      color: colors.textSecondary,
      fontSize: 11,
    },
    yLabel: {
      color: colors.textSecondary,
      fontSize: 10,
    },
    empty: {
      padding: 24,
      alignItems: 'center',
    },
    emptyText: {
      color: colors.textSecondary,
      fontSize: 14,
    },
  });
}
