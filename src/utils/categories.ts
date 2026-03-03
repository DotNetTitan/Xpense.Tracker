import { Category } from '../types';

export const CATEGORIES: Record<string, Category> = {
  Food: { name: 'Food', color: '#FF6B6B', icon: 'restaurant' },
  Transport: { name: 'Transport', color: '#FFB347', icon: 'directions-car' },
  Shopping: { name: 'Shopping', color: '#4FC3F7', icon: 'shopping-bag' },
  Entertainment: { name: 'Entertainment', color: '#AB47BC', icon: 'movie' },
  Utilities: { name: 'Utilities', color: '#26C6DA', icon: 'bolt' },
  Health: { name: 'Health', color: '#66BB6A', icon: 'local-hospital' },
  Travel: { name: 'Travel', color: '#FFA726', icon: 'flight' },
  Groceries: { name: 'Groceries', color: '#8BC34A', icon: 'local-grocery-store' },
  Education: { name: 'Education', color: '#42A5F5', icon: 'school' },
  Finance: { name: 'Finance', color: '#7E57C2', icon: 'account-balance' },
  Uncategorized: { name: 'Uncategorized', color: '#90A4AE', icon: 'category' },
};

/**
 * Keyword-based auto-categorization from merchant name.
 * Checks the merchant string against known keywords for each category.
 */
const KEYWORD_MAP: Array<{ keywords: string[]; category: string }> = [
  {
    keywords: ['swiggy', 'zomato', 'mcdonald', 'kfc', 'pizza', 'burger', 'cafe', 'restaurant', 'food', 'domino', 'subway', 'dunkin', 'starbucks'],
    category: 'Food',
  },
  {
    keywords: ['uber', 'ola', 'rapido', 'redbus', 'petrol', 'fuel', 'metro', 'irctc', 'auto', 'taxi', 'bus', 'transport'],
    category: 'Transport',
  },
  {
    keywords: ['amazon', 'flipkart', 'myntra', 'ajio', 'nykaa', 'meesho', 'shopclues', 'snapdeal', 'mall', 'store', 'shop', 'retail'],
    category: 'Shopping',
  },
  {
    keywords: ['netflix', 'prime', 'hotstar', 'spotify', 'youtube', 'cinema', 'movie', 'pvr', 'inox', 'bookmyshow', 'gaming', 'steam'],
    category: 'Entertainment',
  },
  {
    keywords: ['electricity', 'bill', 'recharge', 'airtel', 'jio', 'bsnl', 'vodafone', 'vi ', 'tata sky', 'piped gas', 'water', 'util'],
    category: 'Utilities',
  },
  {
    keywords: ['hospital', 'clinic', 'pharmacy', 'medplus', 'apollomedics', 'apollo', 'health', 'doctor', 'medical', 'lab', 'diagnostic'],
    category: 'Health',
  },
  {
    keywords: ['flight', 'airline', 'hotel', 'makemytrip', 'goibibo', 'yatra', 'cleartrip', 'oyo', 'booking.com', 'airbnb', 'trivago'],
    category: 'Travel',
  },
  {
    keywords: ['bigbasket', 'grofers', 'blinkit', 'zepto', 'dmart', 'reliance fresh', 'more ', 'supermarket', 'vegetable', 'grocery'],
    category: 'Groceries',
  },
  {
    keywords: ['udemy', 'coursera', 'byju', 'unacademy', 'school', 'college', 'university', 'tuition', 'education', 'book', 'library'],
    category: 'Education',
  },
  {
    keywords: ['emi', 'loan', 'insurance', 'mutual fund', 'sip', 'nps', 'investment', 'lic', 'hdfc life', 'icici pru', 'bank', 'finance'],
    category: 'Finance',
  },
];

export function categorizeTransaction(merchant?: string, rawSms?: string): string {
  const text = `${merchant ?? ''} ${rawSms ?? ''}`.toLowerCase();
  for (const { keywords, category } of KEYWORD_MAP) {
    if (keywords.some((kw) => text.includes(kw))) {
      return category;
    }
  }
  return 'Uncategorized';
}
