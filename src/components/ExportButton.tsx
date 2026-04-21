import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { useAppColors } from '../../hooks/use-app-colors';

interface ExportButtonProps {
  onPress: () => Promise<void>;
  label?: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
  disabled?: boolean;
}

export function ExportButton({
  onPress,
  label = 'Export to Excel',
  icon = 'file-download',
  disabled = false,
}: ExportButtonProps) {
  const colors = useAppColors();
  const [isExporting, setIsExporting] = useState(false);

  const handlePress = async () => {
    if (disabled || isExporting) return;
    
    setIsExporting(true);
    try {
      await onPress();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || isExporting}
      style={[
        styles.button,
        { backgroundColor: colors.primary },
        (disabled || isExporting) && styles.buttonDisabled,
      ]}
      activeOpacity={0.7}
    >
      {isExporting ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <MaterialIcons name={icon} size={18} color="#fff" />
      )}
      <Text style={styles.buttonText}>{isExporting ? 'Exporting...' : label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
