import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { color, radius, space, type } from '@/constants/tokens';

interface SiteCardProps {
  branchName: string;
  branchCode: string;
  location: string;
  status?: string;
  onPress: () => void;
  /** Suppresses the divider on the first row of a list. */
  isFirst?: boolean;
}

/**
 * One detachment in a list, as a flush row.
 *
 * It used to be a rounded card with a drop shadow and a blue accent stripe
 * down its left edge. Three devices were separating it from the next card;
 * one hairline does the same work.
 */
export default function SiteItemCard({
  branchName, branchCode, location, status, onPress, isFirst,
}: SiteCardProps) {
  const isActive = status?.toLowerCase() === 'active';

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
        <Text style={styles.code}>{branchCode}</Text>
        <Text style={type.title} numberOfLines={1}>{branchName}</Text>
        <Text style={type.dataMuted} numberOfLines={1}>{location}</Text>
      </View>

      <View style={[styles.badge, isActive ? styles.badgeActive : styles.badgeIdle]}>
        <Text style={[type.badge, isActive ? styles.badgeTextActive : styles.badgeTextIdle]}>
          {status || 'Unknown'}
        </Text>
      </View>
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
  /* Instant, no timing curve. */
  rowPressed: { backgroundColor: color.sunken },

  main: { flex: 1, gap: 2 },
  code: { ...type.dataMuted, letterSpacing: 0.5, textTransform: 'uppercase' },

  badge: {
    borderWidth: 1, borderRadius: radius.badge,
    paddingHorizontal: space.sm, paddingVertical: 3,
  },
  badgeActive: { backgroundColor: color.okBg, borderColor: color.okInk },
  badgeIdle: { backgroundColor: color.sunken, borderColor: color.lineStrong },
  badgeTextActive: { color: color.okInk },
  badgeTextIdle: { color: color.inkMuted },
});
