import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { color, space, type } from '@/constants/tokens';

interface HistoryItemCardProps {
  guardName: string;
  inspectorName: string;
  date: string;
  onPress: () => void;
  /** Suppresses the divider on the first row of a list. */
  isFirst?: boolean;
}

/**
 * One filed audit in the submission history, as a flush row.
 *
 * The date is mono so a column of them aligns and can be scanned down, which
 * is the only reason anyone opens this list.
 */
export default function HistoryItemCard({
  guardName, inspectorName, date, onPress, isFirst,
}: HistoryItemCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.row,
        !isFirst && styles.divider,
        pressed && styles.rowPressed,
      ]}
    >
      <View style={styles.main}>
        <Text style={type.title} numberOfLines={1}>{guardName}</Text>
        <Text style={type.dataMuted} numberOfLines={1}>
          Inspected by {inspectorName}
        </Text>
      </View>

      <Text style={type.data}>{date}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: space.md,
    paddingHorizontal: space.lg, paddingVertical: space.md,
    backgroundColor: color.surface,
  },
  divider: { borderTopWidth: 1, borderTopColor: color.line },
  rowPressed: { backgroundColor: color.sunken },
  main: { flex: 1, gap: 2 },
});
