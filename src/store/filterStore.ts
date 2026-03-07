import { create } from 'zustand';
import { toMonthKey } from '../utils/formatters';

interface FilterState {
  /** Currently selected month key, e.g. "2026-03" */
  selectedMonth: string;
  /** Active category filter, or "All" for no filter */
  selectedCategory: string;
  /** Active transaction type filter: "All", "debit", or "credit" */
  selectedType: 'All' | 'debit' | 'credit';
  setSelectedMonth: (month: string) => void;
  setSelectedCategory: (category: string) => void;
  setSelectedType: (type: 'All' | 'debit' | 'credit') => void;
  resetFilters: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  selectedMonth: toMonthKey(new Date()),
  selectedCategory: 'All',
  selectedType: 'All',
  setSelectedMonth: (month) => set({ selectedMonth: month, selectedCategory: 'All', selectedType: 'All' }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setSelectedType: (type) => set({ selectedType: type }),
  resetFilters: () =>
    set({ selectedMonth: toMonthKey(new Date()), selectedCategory: 'All', selectedType: 'All' }),
}));
