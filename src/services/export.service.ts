import { Platform, Share } from 'react-native';
import { File, Paths } from 'expo-file-system';
import { getAllTransactions } from './db.service';
import { Transaction } from '../types';

function formatExportDate(timestamp: number): string {
  return new Date(timestamp).toISOString();
}

function escapeCsvValue(value: string | number): string {
  const stringValue = String(value ?? '');
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function toCsv(transactions: Transaction[]): string {
  const headers = [
    'ID',
    'Date',
    'Type',
    'Amount',
    'Merchant',
    'Category',
    'Bank',
    'Account',
    'Source',
    'Raw Message',
  ];

  const rows = transactions.map((tx) => [
    tx.id,
    formatExportDate(tx.date),
    tx.type,
    tx.amount,
    tx.merchant ?? '',
    tx.category,
    tx.bank,
    tx.account ?? '',
    tx.source ?? 'sms',
    tx.rawSms,
  ]);

  return [headers, ...rows]
    .map((row) => row.map((value) => escapeCsvValue(value)).join(','))
    .join('\n');
}

function escapeXmlValue(value: string | number): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toExcelXml(transactions: Transaction[]): string {
  const rows = transactions
    .map(
      (tx) => `
      <Row>
        <Cell><Data ss:Type="String">${escapeXmlValue(tx.id)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXmlValue(formatExportDate(tx.date))}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXmlValue(tx.type)}</Data></Cell>
        <Cell><Data ss:Type="Number">${tx.amount}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXmlValue(tx.merchant ?? '')}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXmlValue(tx.category)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXmlValue(tx.bank)}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXmlValue(tx.account ?? '')}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXmlValue(tx.source ?? 'sms')}</Data></Cell>
        <Cell><Data ss:Type="String">${escapeXmlValue(tx.rawSms)}</Data></Cell>
      </Row>`
    )
    .join('');

  return `<?xml version="1.0"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:html="http://www.w3.org/TR/REC-html40">
  <Worksheet ss:Name="Transactions">
    <Table>
      <Row>
        <Cell><Data ss:Type="String">ID</Data></Cell>
        <Cell><Data ss:Type="String">Date</Data></Cell>
        <Cell><Data ss:Type="String">Type</Data></Cell>
        <Cell><Data ss:Type="String">Amount</Data></Cell>
        <Cell><Data ss:Type="String">Merchant</Data></Cell>
        <Cell><Data ss:Type="String">Category</Data></Cell>
        <Cell><Data ss:Type="String">Bank</Data></Cell>
        <Cell><Data ss:Type="String">Account</Data></Cell>
        <Cell><Data ss:Type="String">Source</Data></Cell>
        <Cell><Data ss:Type="String">Raw Message</Data></Cell>
      </Row>${rows}
    </Table>
  </Worksheet>
</Workbook>`;
}

async function writeExportFile(content: string, extension: 'csv' | 'xls'): Promise<string | null> {
  const timestamp = new Date().toISOString().replace(/[.:]/g, '-');
  const file = new File(Paths.document, `transactions-${timestamp}.${extension}`);
  file.create({ intermediates: true, overwrite: true });
  file.write(content, {
    encoding: 'utf8',
  });
  return file.uri;
}

async function shareExport(content: string, format: 'CSV' | 'Excel', fileUri: string | null) {
  const message = fileUri
    ? `${format} export created at:\n${fileUri}\n\nYou can open or copy this file from your device storage.`
    : `${format} export is ready below:\n\n${content}`;

  await Share.share({
    title: `${format} Export`,
    message,
  });
}

async function emailExport(
  content: string,
  format: 'CSV' | 'Excel',
  fileUri: string | null
) {
  const url = fileUri
    ? Platform.OS === 'android'
      ? new File(fileUri).contentUri
      : fileUri
    : undefined;
  const message = fileUri ? `Attached is your ${format} export.` : `Your ${format} export is below:\n\n${content}`;

  await Share.share({
    title: `Email ${format} Export`,
    subject: `XpenseTracker ${format} Export`,
    message,
    url,
  });
}

export async function exportTransactionsAsCsv(): Promise<string | null> {
  const transactions = getAllTransactions();
  const csvContent = toCsv(transactions);
  const fileUri = await writeExportFile(csvContent, 'csv');
  await shareExport(csvContent, 'CSV', fileUri);
  return fileUri;
}

export async function exportTransactionsAsExcel(): Promise<string | null> {
  const transactions = getAllTransactions();
  const excelContent = toExcelXml(transactions);
  const fileUri = await writeExportFile(excelContent, 'xls');
  await shareExport(excelContent, 'Excel', fileUri);
  return fileUri;
}

export async function emailTransactionsAsCsv(): Promise<string | null> {
  const transactions = getAllTransactions();
  const csvContent = toCsv(transactions);
  const fileUri = await writeExportFile(csvContent, 'csv');
  await emailExport(csvContent, 'CSV', fileUri);
  return fileUri;
}

export async function emailTransactionsAsExcel(): Promise<string | null> {
  const transactions = getAllTransactions();
  const excelContent = toExcelXml(transactions);
  const fileUri = await writeExportFile(excelContent, 'xls');
  await emailExport(excelContent, 'Excel', fileUri);
  return fileUri;
}