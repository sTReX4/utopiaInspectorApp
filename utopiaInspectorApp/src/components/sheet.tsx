import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color, radius, space, type } from '@/constants/tokens';

/* Sections and rows are the app-wide vocabulary, not a sheet invention. */
export { Row, Section } from './data-surface';

/**
 * Chrome for the full-screen record sheets: the detachment profile and the
 * audit receipt.
 *
 * Both are read to check one value against another, so both use the same rows
 * as every other data surface. Two sheets showing the same kind of thing
 * should not look like two different products.
 */
export function ModalFrame({
  title, onClose, children,
}: {
  title: string; onClose: () => void; children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + space.md }]}>
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          hitSlop={8}
          style={({ pressed }) => [styles.close, pressed && styles.closePressed]}
        >
          <Text style={styles.closeLabel}>Close</Text>
        </Pressable>
      </View>

      <ScrollView
        /* Padding on the content container. On the ScrollView the bottom inset
         * is ignored and the last row sits under the navigation bar. */
        contentContainerStyle={[
          styles.content,
          {
            paddingLeft: insets.left,
            paddingRight: insets.right,
            paddingBottom: insets.bottom + space.xl,
          },
        ]}
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.canvas },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    gap: space.md,
    paddingHorizontal: space.lg, paddingBottom: space.md,
    backgroundColor: color.shell,
  },
  headerTitle: { ...type.title, color: color.shellInk, flex: 1, fontSize: 17 },
  close: {
    borderWidth: 1, borderColor: color.shellLine, borderRadius: radius.control,
    paddingHorizontal: space.md, paddingVertical: space.xs + 2,
  },
  closePressed: { backgroundColor: color.shellHover },
  closeLabel: { ...type.badge, color: color.shellInk, fontSize: 10 },

  content: { paddingBottom: space.xl },
});
