import * as FileSystem from 'expo-file-system/legacy';
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
    console.log('Starting export with', transactions.length, 'transactions');
    
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

    console.log('Data prepared, creating workbook');

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

    console.log('Generating Excel file');

    // Generate Excel file
    const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

    console.log('Excel generated, saving file');

    // Save and share file
    await saveAndShareFile(wbout, filename);
    
    console.log('Export completed successfully');
  } catch (error) {
    console.error('Error exporting transactions:', error);
    Alert.alert('Export Failed', `Unable to export transactions to Excel. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    console.log('Starting analytics export');
    
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

    console.log('Generating Excel file');

    // Generate Excel file
    const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

    console.log('Excel generated, saving file');

    // Save and share file
    await saveAndShareFile(wbout, filename);
    
    console.log('Analytics export completed successfully');
  } catch (error) {
    console.error('Error exporting analytics:', error);
    Alert.alert('Export Failed', `Unable to export analytics to Excel. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Save file and share it using legacy expo-file-system API (compatible with Expo Go)
 */
async function saveAndShareFile(base64Data: string, filename: string): Promise<void> {
  try {
    console.log('Creating file:', filename);
    
    if (!FileSystem.cacheDirectory) {
      throw new Error('Cache directory not available');
    }
    
    const fileUri = FileSystem.cacheDirectory + filename;
    console.log('File URI:', fileUri);

    // Write base64 data to file
    await FileSystem.writeAsStringAsync(fileUri, base64Data, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    console.log('File written successfully');

    // Check if sharing is available
    const isAvailable = await Sharing.isAvailableAsync();
    
    console.log('Sharing available:', isAvailable);
    
    if (isAvailable) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: 'Export Excel File',
        UTI: 'com.microsoft.excel.xlsx',
      });
      console.log('File shared successfully');
    } else {
      Alert.alert(
        'Export Successful',
        `File saved to: ${fileUri}`,
        [{ text: 'OK' }]
      );
    }
  } catch (error) {
    console.error('Error in saveAndShareFile:', error);
    throw error;
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
