import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    getCategoryTotals,
    getMonthlyTotals,
    getTransactionCount,
    getTransactions,
} from '../services/db.service';
import { useFilterStore } from '../store/filterStore';
import { CategoryTotal, MonthlyTotal } from '../types';
import { CATEGORIES } from '../utils/categories';

/** Fetch transactions for the current selected month and category filter. */
export function useTransactions() {
  const { selectedMonth, selectedCategory } = useFilterStore();
  return useQuery({
    queryKey: ['transactions', selectedMonth, selectedCategory],
    queryFn: () => getTransactions(selectedMonth, selectedCategory),
  });
}

/** Get monthly totals for the past 6 months (bar chart data). */
export function useMonthlyTotals(monthsBack = 6) {
  return useQuery({
    queryKey: ['monthlyTotals', monthsBack],
    queryFn: (): MonthlyTotal[] => getMonthlyTotals(monthsBack),
  });
}

/** Get category totals for the current selected month (pie chart data). */
export function useCategoryTotals() {
  const { selectedMonth } = useFilterStore();
  return useQuery({
    queryKey: ['categoryTotals', selectedMonth],
    queryFn: (): CategoryTotal[] => {
      const raw = getCategoryTotals(selectedMonth);
      return raw.map((r) => ({
        category: r.category,
        total: r.total,
        color: CATEGORIES[r.category]?.color ?? CATEGORIES.Uncategorized.color,
      }));
    },
  });
}

/** Get the total transaction count (to determine whether DB is empty). */
export function useTransactionCount() {
  return useQuery({
    queryKey: ['transactionCount'],
    queryFn: getTransactionCount,
  });
}

/** Return the query client's invalidation helper pre-bound to transaction keys. */
export function useInvalidateTransactions() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: ['transactions'] }).then(() =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['monthlyTotals'] }),
        queryClient.invalidateQueries({ queryKey: ['categoryTotals'] }),
        queryClient.invalidateQueries({ queryKey: ['transactionCount'] }),
      ])
    );
}
