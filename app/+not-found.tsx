import { Link, Stack } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { AppColors } from '../constants/theme';
import { useAppColors } from '../hooks/use-app-colors';

export default function NotFoundScreen() {
  const colors = useAppColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <>
      <Stack.Screen options={{ title: 'Not Found' }} />
      <View style={styles.container}>
        <Text style={styles.title}>This screen does not exist.</Text>
        <Link href="/(tabs)" asChild>
          <Button mode="contained">Go to Home</Button>
        </Link>
      </View>
    </>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      gap: 16,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.textPrimary,
    },
  });
}
