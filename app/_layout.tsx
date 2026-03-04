import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffectiveColorScheme } from '../hooks/use-app-colors';
import { deduplicateExistingTransactions, initDb } from '../src/services/db.service';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
    },
  },
});

const paperLightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#1565C0',
    secondary: '#1E88E5',
  },
};

const paperDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#5C9CE6',
    secondary: '#64B5F6',
  },
};

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useEffectiveColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    // Initialize SQLite database on startup, then clean up any cross-source duplicates
    // (e.g. an Uber email receipt + the matching UPI bank SMS debit).
    initDb();
    deduplicateExistingTransactions();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <PaperProvider theme={isDark ? paperDarkTheme : paperLightTheme}>
            <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
              <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              </Stack>
              <StatusBar style={isDark ? 'light' : 'dark'} />
            </ThemeProvider>
          </PaperProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
