import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { color, space, type } from '@/constants/tokens';

/**
 * The shared vocabulary every data screen is built from.
 *
 * One definition of what a section, a row and an empty state look like, so a
 * value on the profile screen reads the same as a value on the audit receipt.
 * Screens compose these; none of them restate the geometry.
 */

/** Page heading, sitting on the canvas rather than inside a panel. */
export function ScreenTitle({
  title, subtitle, action,
}: {
  title: string; subtitle?: string; action?: React.ReactNode;
}) {
  return (
    <View style={styles.titleRow}>
      <View style={styles.titleMain}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={type.dataMuted}>{subtitle}</Text> : null}
      </View>
      {action}
    </View>
  );
}

/** A labelled group of rows. Full bleed, hairline top and bottom, never a card. */
export function Section({
  label, children,
}: {
  label?: string; children: React.ReactNode;
}) {
  return (
    <View>
      {label ? (
        <View style={styles.sectionHead}>
          <Text style={type.label}>{label}</Text>
        </View>
      ) : null}
      <View style={styles.section}>{children}</View>
    </View>
  );
}

/** Label on the left, value on the right in mono so a column of them aligns. */
export function Row({
  label, value, tone, isFirst,
}: {
  label: string; value?: string | null; tone?: 'ok' | 'warn' | 'danger'; isFirst?: boolean;
}) {
  const tint = tone === 'ok' ? color.okInk
    : tone === 'warn' ? color.warnInk
    : tone === 'danger' ? color.dangerInk
    : undefined;

  return (
    <View style={[styles.row, !isFirst && styles.divider]}>
      <Text style={type.label}>{label}</Text>
      <Text style={[styles.value, tint ? { color: tint } : null]} numberOfLines={3}>
        {value || 'Not recorded'}
      </Text>
    </View>
  );
}

/** Says what is missing and how to make it appear. Never a bare "no data". */
export function EmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <View style={styles.empty}>
      <Text style={type.title}>{title}</Text>
      {body ? <Text style={[type.body, { marginTop: space.xs }]}>{body}</Text> : null}
    </View>
  );
}

/** Frames a scrolling list so its rows sit on a surface, not loose on canvas. */
export function ListFrame({ children }: { children: React.ReactNode }) {
  return <View style={styles.listFrame}>{children}</View>;
}

export const surfaceStyles = StyleSheet.create({
  divider: { borderTopWidth: 1, borderTopColor: color.line },
});

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    gap: space.md,
    paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: space.md,
  },
  titleMain: { flex: 1, gap: 2 },
  title: { ...type.title, fontSize: 20, letterSpacing: -0.4 },

  sectionHead: { paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: space.sm },
  section: {
    backgroundColor: color.surface,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: color.line,
  },
  divider: { borderTopWidth: 1, borderTopColor: color.line },

  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    gap: space.md,
    paddingHorizontal: space.lg, paddingVertical: space.md,
  },
  value: { ...type.data, flexShrink: 1, textAlign: 'right' },

  empty: { paddingHorizontal: space.lg, paddingVertical: space.xl },

  listFrame: {
    flex: 1,
    backgroundColor: color.surface,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: color.line,
  },
});
