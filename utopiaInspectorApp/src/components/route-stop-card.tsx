import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import type { RouteStop } from '@/lib/dailyRouting';
import { color, radius, space, type } from '@/constants/tokens';

interface RouteStopCardProps {
    stop: RouteStop;
    onPress: () => void;
    /** True for the stop the inspector tapped to get here. */
    isFocused?: boolean;
    /** Suppresses the divider on the first row of a list. */
    isFirst?: boolean;
}

/**
 * One detachment on the day's route, with the guards posted there.
 *
 * The guard list is the point of the row: an inspector arriving on site needs
 * to know who is supposed to be standing there before they can report anyone
 * missing. Each guard carries their LESP expiry in mono, so a column of dates
 * lines up and an expired one is visible without reading every entry.
 */
export default function RouteStopCard({
    stop, onPress, isFocused, isFirst,
}: RouteStopCardProps) {
    const { detachment, guards, isCompletedToday, isPendingSync } = stop;

    const badge = isPendingSync
        ? { label: 'Queued', bg: color.warnBg, border: color.warnInk, fg: color.warnInk }
        : isCompletedToday
            ? { label: 'Inspected', bg: color.okBg, border: color.okInk, fg: color.okInk }
            : { label: 'Pending', bg: color.sunken, border: color.lineStrong, fg: color.inkMuted };

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
            <View style={styles.head}>
                <View style={styles.headMain}>
                    <Text style={styles.code}>{detachment.branch_code}</Text>
                    <Text style={type.title} numberOfLines={1}>{detachment.branch_name}</Text>
                    <Text style={type.dataMuted} numberOfLines={1}>
                        {detachment.branch_location || 'No location provided'}
                    </Text>
                </View>

                <View style={[styles.badge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                    <Text style={[type.badge, { color: badge.fg }]}>{badge.label}</Text>
                </View>
            </View>

            <View style={styles.guards}>
                <Text style={type.label}>
                    Guards to audit ({guards.length})
                </Text>

                {guards.length === 0 ? (
                    <Text style={[type.dataMuted, { color: color.dangerInk }]}>
                        No active guards deployed to this branch.
                    </Text>
                ) : (
                    guards.map((guard) => (
                        <View
                            key={`${guard.assigned_branch}-${guard.guard_name}`}
                            style={styles.guardRow}
                        >
                            <Text style={styles.guardName} numberOfLines={1}>{guard.guard_name}</Text>
                            <Text style={type.dataMuted}>
                                {guard.lesp_expiry_date
                                    ? `LESP ${guard.lesp_expiry_date}`
                                    : 'LESP not on file'}
                            </Text>
                        </View>
                    ))
                )}
            </View>

            {/* Darkens the existing hairline rather than adding chrome. */}
            {isFocused ? <View style={styles.focusMark} pointerEvents="none" /> : null}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    row: {
        paddingHorizontal: space.lg, paddingVertical: space.md,
        backgroundColor: color.surface,
        gap: space.md,
    },
    divider: { borderTopWidth: 1, borderTopColor: color.line },
    /* Instant, no timing curve. */
    rowPressed: { backgroundColor: color.sunken },

    head: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
    headMain: { flex: 1, gap: 2 },
    code: { ...type.dataMuted, letterSpacing: 0.5, textTransform: 'uppercase' },

    badge: {
        borderWidth: 1, borderRadius: radius.badge,
        paddingHorizontal: space.sm, paddingVertical: 3,
    },

    /* One hairline above the roster, never a border on every guard. */
    guards: { borderTopWidth: 1, borderTopColor: color.line, paddingTop: space.sm, gap: space.xs },
    guardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
    guardName: { ...type.title, flex: 1, fontSize: 13, fontWeight: '500' },

    focusMark: {
        position: 'absolute', top: 0, right: 0, bottom: 0, left: 0,
        borderWidth: 1, borderColor: color.ink,
    },
});
