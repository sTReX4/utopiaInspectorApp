import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { RouteStop } from '@/lib/dailyRouting';

interface RouteStopCardProps {
    stop: RouteStop;
    onPress: () => void;
}

/**
 * One detachment on the day's route, with the guards posted there.
 *
 * The guard list is the point of the card: an inspector arriving on site needs
 * to know who is supposed to be standing there before they can report anyone
 * missing.
 */
export default function RouteStopCard({ stop, onPress }: RouteStopCardProps) {
    const { detachment, guards, isCompletedToday, isPendingSync } = stop;

    const badge = isPendingSync
        ? { label: 'QUEUED', bg: '#fef3c7', fg: '#b45309' }
        : isCompletedToday
            ? { label: 'INSPECTED', bg: '#dcfce7', fg: '#16a34a' }
            : { label: 'PENDING', bg: '#f1f5f9', fg: '#64748b' };

    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
            <View style={styles.headerRow}>
                <Text style={styles.branchName} numberOfLines={1}>{detachment.branch_name}</Text>
                <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.badgeText, { color: badge.fg }]}>{badge.label}</Text>
                </View>
            </View>

            <View style={styles.detailsContainer}>
                <Text style={styles.text}><Text style={styles.label}>Code: </Text>{detachment.branch_code}</Text>
                <Text style={styles.text}>
                    <Text style={styles.label}>Location: </Text>
                    {detachment.branch_location || 'No location provided'}
                </Text>
            </View>

            <View style={styles.guardSection}>
                <Text style={styles.guardHeading}>
                    Guards to audit ({guards.length})
                </Text>

                {guards.length === 0 ? (
                    <Text style={styles.guardEmpty}>
                        No active guards deployed to this branch.
                    </Text>
                ) : (
                    guards.map((guard) => (
                        <View key={`${guard.assigned_branch}-${guard.guard_name}`} style={styles.guardRow}>
                            <View style={styles.guardDot} />
                            <Text style={styles.guardName} numberOfLines={1}>{guard.guard_name}</Text>
                            <Text style={styles.guardExpiry}>
                                {guard.lesp_expiry_date
                                    ? `LESP ${new Date(guard.lesp_expiry_date).toLocaleDateString()}`
                                    : 'LESP —'}
                            </Text>
                        </View>
                    ))
                )}
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        padding: 16,
        backgroundColor: '#ffffff',
        marginBottom: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
    branchName: { flex: 1, fontSize: 16, fontWeight: '700', color: '#0f172a' },
    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
    badgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },

    detailsContainer: { marginTop: 10, gap: 3 },
    label: { color: '#94a3b8', fontWeight: '600' },
    text: { fontSize: 13, color: '#475569' },

    guardSection: { marginTop: 14, borderTopWidth: 1, borderTopColor: '#eef2f7', paddingTop: 12 },
    guardHeading: {
        fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.2,
        color: '#94a3b8', fontWeight: '800', marginBottom: 8,
    },
    guardEmpty: { fontSize: 12, color: '#94a3b8', fontStyle: 'italic' },
    guardRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, gap: 8 },
    guardDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#3f73c4' },
    guardName: { flex: 1, fontSize: 13, color: '#1e293b', fontWeight: '600' },
    guardExpiry: { fontSize: 11, color: '#94a3b8' },
});
