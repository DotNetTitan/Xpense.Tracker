import { create } from 'zustand';
import { toMonthKey } from '../utils/formatters';

interface FilterState {
  /** Currently selected month key, e.g. "2026-03" */
  selectedMonth: string;
  /** Active category filter, or "All" for no filter */
  selectedCategory: string;
  setSelectedMonth: (month: string) => void;
  setSelectedCategory: (category: string) => void;
  resetFilters: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  selectedMonth: toMonthKey(new Date()),
  selectedCategory: 'All',
  setSelectedMonth: (month) => set({ selectedMonth: month, selectedCategory: 'All' }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  resetFilters: () =>
    set({ selectedMonth: toMonthKey(new Date()), selectedCategory: 'All' }),
}));
