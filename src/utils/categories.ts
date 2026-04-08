import { Category } from '../types';

export const CATEGORIES: Record<string, Category> = {
  Swiggy: { name: 'Swiggy', color: '#FC8019', icon: 'delivery-dining' },
  Zomato: { name: 'Zomato', color: '#E23744', icon: 'delivery-dining' },
  Uber: { name: 'Uber', color: '#607D8B', icon: 'directions-car' },
  Transport: { name: 'Transport', color: '#FFB347', icon: 'directions-car' },
  Shopping: { name: 'Shopping', color: '#4FC3F7', icon: 'shopping-bag' },
  Entertainment: { name: 'Entertainment', color: '#AB47BC', icon: 'movie' },
  Utilities: { name: 'Utilities', color: '#26C6DA', icon: 'bolt' },
  Health: { name: 'Health', color: '#66BB6A', icon: 'local-hospital' },
  Travel: { name: 'Travel', color: '#FFA726', icon: 'flight' },
  Groceries: { name: 'Groceries', color: '#8BC34A', icon: 'local-grocery-store' },
  Restaurants: { name: 'Restaurants', color: '#26A69A', icon: 'restaurant' },
  Education: { name: 'Education', color: '#42A5F5', icon: 'school' },
  Finance: { name: 'Finance', color: '#7E57C2', icon: 'account-balance' },
  Rent: { name: 'Rent', color: '#5C6BC0', icon: 'home' },
  Uncategorized: { name: 'Uncategorized', color: '#90A4AE', icon: 'category' },
};

/**
 * Keyword maps for categorization.
 *
 * MERCHANT_KEYWORDS  – matched against the parsed merchant name only.
 *   Safe to be broad because merchant names are already extracted & short.
 *
 * SMS_KEYWORDS – matched against the full raw SMS body only as a fallback
 *   when the merchant field yields no match.  Must be very specific brand/
 *   service names to avoid false positives on generic SMS words.
 */
const MERCHANT_KEYWORDS: Array<{ keywords: string[]; category: string }> = [
  // Brand-specific — must come before generic Food to take priority
  { keywords: ['swiggy'], category: 'Swiggy' },
  { keywords: ['zomato'], category: 'Zomato' },
  { keywords: ['uber'], category: 'Uber' },
  {
    keywords: ['ola', 'rapido', 'redbus', 'petrol', 'fuel', 'metro', 'irctc', 'taxi', 'bus', 'transport'],
    category: 'Transport',
  },
  {
    keywords: ['amazon', 'flipkart', 'myntra', 'ajio', 'nykaa', 'meesho', 'shopclues', 'snapdeal', 'mall', 'retail'],
    category: 'Shopping',
  },
  {
    keywords: ['netflix', 'prime video', 'hotstar', 'spotify', 'youtube', 'cinema', 'pvr', 'inox', 'bookmyshow', 'gaming', 'steam', 'google play', 'apple music', 'apple tv', 'zee5', 'sonyliv', 'jiocinema', 'mxplayer', 'voot', 'discord', 'playstation', 'xbox'],
    category: 'Entertainment',
  },
  {
    keywords: ['electricity', 'recharge', 'airtel', 'jio', 'bsnl', 'vodafone idea', 'vodafone', 'vi mobile', 'tata sky', 'piped gas', 'water board', 'bescom', 'mseb', 'tneb', 'bses'],
    category: 'Utilities',
  },
  {
    keywords: ['hospital', 'clinic', 'pharmacy', 'medplus', 'apollo pharmacy', 'apollo', 'health', 'doctor', 'medical', 'diagnostic', 'practo', 'tata 1mg', '1mg', 'netmeds'],
    category: 'Health',
  },
  {
    keywords: ['flight', 'airline', 'indigo', 'air india', 'spicejet', 'vistara', 'makemytrip', 'goibibo', 'yatra', 'cleartrip', 'oyo', 'airbnb', 'trivago'],
    category: 'Travel',
  },
  {
    keywords: ['bigbasket', 'grofers', 'blinkit', 'zepto', 'dmart', 'reliance fresh', 'more supermarket', 'supermarket'],
    category: 'Groceries',
  },
  {
    keywords: ['zam zam', 'turf cafe', 'supreme', 'upper crust', 'kadalas', 'veg', 'dhaba', 'drink', 'drinks', 'ambrosia', 'bistro', 'mcdonald', 'kfc', 'pizza', 'burger', 'cafe', 'restaurant', 'food', 'domino', 'subway', 'dunkin', 'starbucks'],
    category: 'Restaurants',
  },
  {
    keywords: ['rent', 'house rent', 'pg rent', 'room rent', 'landlord', 'flat rent', 'accommodation', 'monthly rent'],
    category: 'Rent',
  },
  {
    keywords: ['udemy', 'coursera', 'byju', 'unacademy', 'school', 'college', 'university', 'tuition', 'education', 'library'],
    category: 'Education',
  },
  {
    keywords: ['emi', 'loan', 'insurance', 'mutual fund', 'sip', 'nps', 'investment', 'lic', 'hdfc life', 'icici pru', 'zerodha', 'groww', 'upstox'],
    category: 'Finance',
  },
];

/**
 * Conservative keywords matched only against the raw SMS body (fallback).
 * Only include proper nouns / brand names — never generic English words.
 */
const SMS_KEYWORDS: Array<{ keywords: string[]; category: string }> = [
  { keywords: ['swiggy'], category: 'Swiggy' },
  { keywords: ['zomato'], category: 'Zomato' },
  { keywords: ['uber'], category: 'Uber' },
  { keywords: ['mcdonald', 'dominos', 'starbucks', 'kfc'], category: 'Food' },
  { keywords: ['ola cabs', 'rapido', 'redbus', 'irctc'], category: 'Transport' },
  { keywords: ['amazon', 'flipkart', 'myntra', 'ajio', 'nykaa', 'meesho'], category: 'Shopping' },
  { keywords: ['netflix', 'hotstar', 'spotify', 'bookmyshow', 'pvr cinemas', 'inox', 'google play', 'apple music', 'apple tv', 'zee5', 'sonyliv', 'jiocinema', 'discord', 'playstation', 'xbox game'], category: 'Entertainment' },
  { keywords: ['airtel', 'jio recharge', 'bsnl', 'vodafone idea', 'tata sky', 'bescom', 'mseb'], category: 'Utilities' },
  { keywords: ['apollo pharmacy', 'medplus', 'netmeds', 'tata 1mg', 'practo'], category: 'Health' },
  { keywords: ['makemytrip', 'goibibo', 'cleartrip', 'indigo airlines', 'air india', 'spicejet'], category: 'Travel' },
  { keywords: ['bigbasket', 'blinkit', 'zepto', 'grofers', 'dmart'], category: 'Groceries' },
  { keywords: ['kirana', 'provisions store', 'fresh market'], category: 'Grocery' },
  { keywords: ['house rent', 'room rent', 'pg rent', 'flat rent', 'monthly rent', 'landlord'], category: 'Rent' },
  { keywords: ['udemy', 'coursera', 'byjus', 'unacademy'], category: 'Education' },
  { keywords: ['mutual fund', 'hdfc life', 'icici prudential', 'lic premium', 'zerodha', 'groww'], category: 'Finance' },
];

export function categorizeTransaction(merchant?: string, rawSms?: string): string {
  // Pass 1 – merchant name only (fast, low false-positive risk)
  if (merchant) {
    const m = merchant.toLowerCase();
    for (const { keywords, category } of MERCHANT_KEYWORDS) {
      if (keywords.some((kw) => m.includes(kw))) {
        return category;
      }
    }
  }

  // Pass 2 – full SMS body with a tighter keyword set (fallback)
  if (rawSms) {
    const s = rawSms.toLowerCase();
    for (const { keywords, category } of SMS_KEYWORDS) {
      if (keywords.some((kw) => s.includes(kw))) {
        return category;
      }
    }
  }

  return 'Finance';
}
