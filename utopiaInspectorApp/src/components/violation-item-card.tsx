import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { color, space, type } from '@/constants/tokens';

interface ViolationItemCardProps {
  itemName: string;
  status: 'Yes' | 'No';
  onUpdate: (value: 'Yes' | 'No') => void;
  /** Suppresses the divider on the first row of a group. */
  isFirst?: boolean;
}

/**
 * One of the 22 compliance metrics, as a row rather than a card.
 *
 * Twenty-two stacked cards ran to roughly two thousand points of scroll. As
 * flush rows on a shared hairline the same list is about half that, and the
 * inspector can see several at once while working down the guard.
 *
 * "No" is the finding that costs a guard money, so it is the one the eye can
 * pick out of the column without reading every label.
 */
export default function ViolationItemCard({
  itemName, status, onUpdate, isFirst,
}: ViolationItemCardProps) {
  return (
    <View style={[styles.row, !isFirst && styles.divider]}>
      <Text style={styles.name} numberOfLines={2}>{itemName}</Text>

      <View style={styles.control}>
        {(['Yes', 'No'] as const).map((option) => {
          const selected = status === option;
          const flags = selected && option === 'No';

          return (
            <Pressable
              key={option}
              onPress={() => onUpdate(option)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`${itemName}: ${option}`}
              /* No timing curve. The inspector is tapping down a list of 22
               * and needs the mark to land before the finger lifts. */
              style={[
                styles.option,
                selected && styles.optionSelected,
                flags && styles.optionFlagged,
              ]}
            >
              <Text style={[
                type.badge,
                styles.optionLabel,
                selected && styles.optionLabelSelected,
              ]}>
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: space.md,
    paddingHorizontal: space.lg, paddingVertical: space.sm,
    backgroundColor: color.surface,
  },
  divider: { borderTopWidth: 1, borderTopColor: color.line },
  name: { ...type.title, flex: 1, fontSize: 13, fontWeight: '500' },

  control: { flexDirection: 'row' },
  option: {
    minWidth: 46, alignItems: 'center',
    paddingVertical: space.xs + 2, paddingHorizontal: space.sm,
    borderWidth: 1, borderColor: color.lineStrong,
    backgroundColor: color.surface,
  },
  /* One control, one radius: the pair reads as a single segmented unit. */
  optionSelected: { backgroundColor: color.ink, borderColor: color.ink },
  optionFlagged: { backgroundColor: color.dangerInk, borderColor: color.dangerInk },
  optionLabel: { color: color.inkMuted, fontSize: 10 },
  optionLabelSelected: { color: color.surface },
});
