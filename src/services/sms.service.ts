import { PermissionsAndroid, Platform } from 'react-native';
import { Transaction } from '../types';
import { categorizeTransaction } from '../utils/categories';
import { isBankSender, parseBankSMS } from '../utils/smsPatterns';

interface RawSms {
  _id: string;
  address: string;
  body: string;
  date: number;
}

/** Ask Android for READ_SMS permission. Returns true if granted. */
export async function requestSmsPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;

  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.READ_SMS,
    {
      title: 'SMS Permission Required',
      message:
        'XpenseTracker needs access to your SMS inbox to automatically detect and import bank transactions.',
      buttonPositive: 'Allow',
      buttonNegative: 'Deny',
    }
  );
  return granted === PermissionsAndroid.RESULTS.GRANTED;
}

/** Check if READ_SMS is already granted (without prompting). */
export async function hasSmsPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  return PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_SMS);
}

/**
 * Read the SMS inbox and return a list of parsed Transaction objects.
 * Only processes messages from recognized bank senders.
 * Requires READ_SMS permission.
 * NOTE: This function uses react-native-get-sms-android which only works
 *       in a dev build or production build — NOT in Expo Go.
 */
export async function fetchAndParseBankSMS(daysBack = 90): Promise<Transaction[]> {
  // Dynamically import to avoid crashing in Expo Go
  let SmsAndroid: any;
  try {
    const mod = require('react-native-get-sms-android');
    SmsAndroid = mod.default ?? mod;
  } catch {
    throw new Error(
      'react-native-get-sms-android is not available. Make sure you are running a dev build, not Expo Go.'
    );
  }

  if (!SmsAndroid?.list) {
    throw new Error(
      'SmsAndroid.list is not available. Make sure the native module is linked (dev build required).'
    );
  }

  const minDate = Date.now() - daysBack * 24 * 60 * 60 * 1000;

  const filter = {
    box: 'inbox',
    minDate,
    maxCount: 500,
    indexFrom: 0,
  };

  return new Promise((resolve, reject) => {
    SmsAndroid.list(
      JSON.stringify(filter),
      (error: string) => reject(new Error(error)),
      (_count: number, smsList: string) => {
        let messages: RawSms[] = [];
        try {
          messages = JSON.parse(smsList);
        } catch {
          resolve([]);
          return;
        }

        const transactions: Transaction[] = [];

        for (const msg of messages) {
          // Filter to bank senders only
          if (!isBankSender(msg.address)) continue;

          const parsed = parseBankSMS(msg.body);
          if (!parsed) continue;

          const category = categorizeTransaction(parsed.merchant, msg.body);

          transactions.push({
            id: `sms_${msg._id}`,
            amount: parsed.amount,
            type: parsed.type,
            merchant: parsed.merchant,
            bank: msg.address,
            account: parsed.account,
            category,
            date: msg.date,
            rawSms: msg.body,
            smsId: String(msg._id),
          });
        }

        resolve(transactions);
      }
    );
  });
}
