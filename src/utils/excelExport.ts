import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import * as XLSX from 'xlsx';
import { CategoryTotal, MonthlyTotal, Transaction } from '../types';
import { formatCurrency, formatDate, normalizeBankName, normalizeMerchantName } from './formatters';

/**
 * Export transactions to Excel file
 */
export async function exportTransactionsToExcel(
  transactions: Transaction[],
  filename: string = 'transactions.xlsx'
): Promise<void> {
  try {
    // Prepare data for Excel
    const data = transactions.map((tx) => ({
      Date: formatDate(tx.date),
      Type: tx.type === 'debit' ? 'Expense' : 'Income',
      Amount: tx.amount,
      'Amount (Formatted)': formatCurrency(tx.amount),
      Category: tx.category,
      Merchant: tx.merchant ? normalizeMerchantName(tx.merchant) : '',
      Bank: normalizeBankName(tx.bank),
      Account: tx.account || '',
      Source: tx.source || 'sms',
    }));

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');

    // Set column widths
    ws['!cols'] = [
      { wch: 12 }, // Date
      { wch: 10 }, // Type
      { wch: 12 }, // Amount
      { wch: 15 }, // Amount (Formatted)
      { wch: 15 }, // Category
      { wch: 25 }, // Merchant
      { wch: 20 }, // Bank
      { wch: 10 }, // Account
      { wch: 10 }, // Source
    ];

    // Generate Excel file
    const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

    // Save and share file
    await saveAndShareFile(wbout, filename);
  } catch (error) {
    console.error('Error exporting transactions:', error);
    Alert.alert('Export Failed', 'Unable to export transactions to Excel.');
  }
}

/**
 * Export analytics data to Excel with multiple sheets
 */
export async function exportAnalyticsToExcel(
  categoryTotals: CategoryTotal[],
  monthlyTotals: MonthlyTotal[],
  transactions: Transaction[],
  filename: string = 'analytics.xlsx'
): Promise<void> {
  try {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Category Breakdown
    const totalSpent = categoryTotals.reduce((s, c) => s + c.total, 0);
    const categoryData = categoryTotals.map((cat) => ({
      Category: cat.category,
      Amount: cat.total,
      'Amount (Formatted)': formatCurrency(cat.total),
      Percentage: totalSpent > 0 ? `${((cat.total / totalSpent) * 100).toFixed(1)}%` : '0%',
    }));
    const wsCategory = XLSX.utils.json_to_sheet(categoryData);
    wsCategory['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 18 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, wsCategory, 'Category Breakdown');

    // Sheet 2: Monthly Trend
    const monthlyData = monthlyTotals.map((m) => ({
      Month: m.month,
      Amount: m.total,
      'Amount (Formatted)': formatCurrency(m.total),
    }));
    const wsMonthly = XLSX.utils.json_to_sheet(monthlyData);
    wsMonthly['!cols'] = [{ wch: 12 }, { wch: 12 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, wsMonthly, 'Monthly Trend');

    // Sheet 3: All Transactions
    const txData = transactions.map((tx) => ({
      Date: formatDate(tx.date),
      Type: tx.type === 'debit' ? 'Expense' : 'Income',
      Amount: tx.amount,
      'Amount (Formatted)': formatCurrency(tx.amount),
      Category: tx.category,
      Merchant: tx.merchant ? normalizeMerchantName(tx.merchant) : '',
      Bank: normalizeBankName(tx.bank),
    }));
    const wsTx = XLSX.utils.json_to_sheet(txData);
    wsTx['!cols'] = [
      { wch: 12 },
      { wch: 10 },
      { wch: 12 },
      { wch: 15 },
      { wch: 15 },
      { wch: 25 },
      { wch: 20 },
    ];
    XLSX.utils.book_append_sheet(wb, wsTx, 'Transactions');

    // Generate Excel file
    const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

    // Save and share file
    await saveAndShareFile(wbout, filename);
  } catch (error) {
    console.error('Error exporting analytics:', error);
    Alert.alert('Export Failed', 'Unable to export analytics to Excel.');
  }
}

/**
 * Save file and share it using modern expo-file-system API (SDK 54+)
 */
async function saveAndShareFile(base64Data: string, filename: string): Promise<void> {
  // Create file in cache directory using new API
  const file = new File(Paths.cache, filename);

  // Write base64 data to file
  file.write(base64Data, { encoding: 'base64' });

  // Check if sharing is available
  const isAvailable = await Sharing.isAvailableAsync();
  
  if (isAvailable) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      dialogTitle: 'Export Excel File',
      UTI: 'com.microsoft.excel.xlsx',
    });
  } else {
    Alert.alert(
      'Export Successful',
      `File saved to: ${file.uri}`,
      [{ text: 'OK' }]
    );
  }
}

/**
 * Generate filename with current date
 */
export function generateExportFilename(prefix: string = 'export'): string {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
  return `${prefix}_${dateStr}.xlsx`;
}
