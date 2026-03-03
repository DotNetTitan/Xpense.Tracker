import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Chip, Text } from 'react-native-paper';
import { CATEGORIES } from '../utils/categories';

interface Props {
  category: string;
  /** Set to true to render a small filled badge (no icon, no close). */
  compact?: boolean;
}

export function CategoryBadge({ category, compact = false }: Props) {
  const cat = CATEGORIES[category] ?? CATEGORIES.Uncategorized;

  if (compact) {
    return (
      <View style={[styles.badge, { backgroundColor: cat.color + '22' }]}>
        <Text style={[styles.badgeText, { color: cat.color }]}>{category}</Text>
      </View>
    );
  }

  return (
    <Chip
      icon={() => (
        <MaterialIcons name={cat.icon as any} size={14} color={cat.color} />
      )}
      style={[styles.chip, { backgroundColor: cat.color + '22' }]}
      textStyle={{ color: cat.color, fontSize: 13 }}
    >
      {category}
    </Chip>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: 30,
    borderRadius: 15,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
