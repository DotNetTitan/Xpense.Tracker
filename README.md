# XpenseTracker

An Android expense tracker that automatically detects and imports bank transactions from your SMS inbox and Gmail, categorizes them, and gives you a clear picture of your spending.

## Features

- **Automatic SMS sync** — reads bank transaction SMS messages and imports them on every app launch (requires READ_SMS permission on Android)
- **Gmail sync** — connects to your Google account via OAuth and parses bank/payment email receipts (read-only access)
- **Smart categorization** — rules-based engine maps merchants and keywords to categories: Food, Transport, Shopping, Entertainment, Utilities, Health, Travel, Groceries, Education, Finance, and brand-specific buckets (Swiggy, Zomato, Uber)
- **Dashboard** — monthly spending/credit summary, top-category breakdown, pinned brand cards (Swiggy, Zomato, Uber), and a recent transactions list
- **Transactions** — full searchable/filterable transaction list with debit/credit detail modal
- **Analytics** — spending donut chart by category and a 6-month bar chart trend
- **Light & dark theme** — toggle in the header on any screen
- **Local-first** — all data is stored on-device with SQLite via `expo-sqlite`; no account or backend required

## Tech Stack

| Layer | Library |
|---|---|
| Framework | Expo (React Native) |
| Navigation | Expo Router (file-based) + React Navigation Bottom Tabs |
| Database | expo-sqlite |
| Data fetching | TanStack React Query |
| UI components | React Native Paper |
| Charts | react-native-gifted-charts |
| Auth (Gmail) | @react-native-google-signin/google-signin |
| State | Zustand (filter, sync, theme stores) |

## Project Structure

```
app/               # Expo Router screens (file-based routing)
  (tabs)/          # Bottom tab screens: Dashboard, Transactions, Analytics
src/
  components/      # Shared UI components (charts, cards, modals, badges)
  config/          # Gmail OAuth config
  hooks/           # Data hooks (useTransactions, useSmsSync, useEmailSync)
  services/        # SMS and Gmail parsing services
  store/           # Zustand stores (filterStore, syncStore, themeStore)
  types/           # TypeScript interfaces (Transaction, Category, etc.)
  utils/           # Categorization rules, SMS/email patterns, formatters
constants/         # Theme tokens
hooks/             # App-level hooks (color scheme, theme colors)
```

## Getting Started

> **Note:** SMS reading requires a real Android device or emulator. The app will not function correctly in Expo Go — use a development build.

### 1. Install dependencies

```bash
npm install
```

### 2. Run on Android (development build)

```bash
npm run android
```

Or start the dev server and connect a dev build manually:

```bash
npm start
```

### 3. Grant permissions

On first launch, the app will request **READ_SMS** permission to import bank transactions from your SMS inbox.

To enable Gmail sync, tap the Gmail button on the Dashboard and sign in with your Google account. Only `gmail.readonly` scope is requested — the app never writes or deletes emails.

## Building for Production

This project is configured for [EAS Build](https://docs.expo.dev/build/introduction/). See `eas.json` for build profiles.

```bash
npx eas build --platform android
```

## Supported Banks & Merchants

Transaction parsing covers most major Indian banks (via SMS sender ID and message pattern matching) and common merchants including Swiggy, Zomato, Uber, Amazon, Flipkart, Ola, and many more. See [src/utils/smsPatterns.ts](src/utils/smsPatterns.ts) and [src/utils/emailPatterns.ts](src/utils/emailPatterns.ts) for the full pattern list.