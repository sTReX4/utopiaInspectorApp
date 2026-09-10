import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, DeviceEventEmitter } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getPendingAudits, PendingAudit } from '../lib/sqlite';
import { triggerAtomicSync } from '../lib/syncManager';
import { EmptyState, ListFrame, ScreenTitle } from '../components/data-surface';
import { color, radius, space, type } from '@/constants/tokens';

export default function OfflineQueueScreen() {
    const insets = useSafeAreaInsets();
    const [drafts, setDrafts] = useState<PendingAudit[]>([]);
    const [isSyncing, setIsSyncing] = useState(false);

    const loadDrafts = async () => {
        const pending = await getPendingAudits();
        setDrafts(pending);
    };

    useEffect(() => {
        let alive = true;

        /* Read inside the async body, not straight from the effect, so the
         * first write lands after the await and never on a dead tree. */
        (async () => {
            const pending = await getPendingAudits();
            if (alive) setDrafts(pending);
        })();

        // Listen for live updates if the background sync catches a signal
        const subscription = DeviceEventEmitter.addListener('sync_status', (event) => {
            setIsSyncing(event.isSyncing);
            if (!event.isSyncing) loadDrafts(); // Reload the list once sync completes
        });

        return () => {
            alive = false;
            subscription.remove();
        };
    }, []);

    const handleManualSync = async () => {
        setIsSyncing(true);
        await triggerAtomicSync();
        await loadDrafts();
        setIsSyncing(false);
    };

    const canSync = !isSyncing && drafts.length > 0;

    return (
        <View style={styles.screen}>
            <ScreenTitle
                title="Pending uploads"
                subtitle={
                    drafts.length === 0
                        ? 'Local cache is clear'
                        : `${drafts.length} ${drafts.length === 1 ? 'draft' : 'drafts'} held on this device`
                }
            />

            <ListFrame>
                <FlatList
                    data={drafts}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={[
                        styles.listContent,
                        {
                            paddingLeft: insets.left,
                            paddingRight: insets.right,
                        },
                    ]}
                    ListEmptyComponent={
                        <EmptyState
                            title="Nothing waiting"
                            body="Reports filed out of coverage are held here until signal returns, then removed from this device once the server has them."
                        />
                    }
                    renderItem={({ item, index }) => <DraftRow draft={item} isFirst={index === 0} />}
                />
            </ListFrame>

            <View style={[styles.actionBar, { paddingBottom: insets.bottom + space.md }]}>
                <Pressable
                    onPress={handleManualSync}
                    disabled={!canSync}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: !canSync }}
                    style={({ pressed }) => [
                        styles.button,
                        !canSync && styles.buttonDisabled,
                        pressed && canSync && styles.buttonPressed,
                    ]}
                >
                    {isSyncing ? (
                        <View style={styles.busyRow}>
                            <ActivityIndicator size="small" color={color.surface} />
                            <Text style={styles.buttonLabel}>Transmitting</Text>
                        </View>
                    ) : (
                        <Text style={styles.buttonLabel}>Sync now</Text>
                    )}
                </Pressable>
            </View>
        </View>
    );
}

function DraftRow({ draft, isFirst }: { draft: PendingAudit; isFirst: boolean }) {
    /* A payload that will not parse cannot be attributed to a branch. Show the
     * row anyway: a draft the inspector cannot see is a draft they cannot
     * report as stuck. */
    let branchName = 'Unreadable draft';
    let timeIn: string | null = null;

    try {
        const payload = JSON.parse(draft.payload);
        branchName = payload.branch_name || 'Unknown detachment';
        timeIn = payload.inspector_in_time
            ? new Date(payload.inspector_in_time).toLocaleString()
            : null;
    } catch {
        // Leave the fallbacks in place.
    }

    return (
        <View style={[styles.row, !isFirst && styles.divider]}>
            <View style={styles.rowHead}>
                <Text style={[type.title, { flex: 1 }]} numberOfLines={1}>{branchName}</Text>
                {draft.is_critical === 1 ? (
                    <View style={styles.criticalBadge}>
                        <Text style={[type.badge, { color: color.dangerInk }]}>Alarm response</Text>
                    </View>
                ) : null}
            </View>

            <Text style={type.dataMuted}>Time in {timeIn ?? 'not recorded'}</Text>
            <Text style={type.dataMuted}>Cached {new Date(draft.created_at).toLocaleString()}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: color.canvas },
    listContent: { flexGrow: 1 },

    row: { paddingHorizontal: space.lg, paddingVertical: space.md, gap: 2 },
    divider: { borderTopWidth: 1, borderTopColor: color.line },
    rowHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: 2 },
    criticalBadge: {
        borderWidth: 1, borderColor: color.dangerInk, backgroundColor: color.dangerBg,
        paddingHorizontal: space.sm, paddingVertical: 2,
    },

    /* Outside the list, so the action is reachable however long the queue is. */
    actionBar: {
        backgroundColor: color.surface,
        borderTopWidth: 1, borderTopColor: color.line,
        paddingHorizontal: space.lg, paddingTop: space.md,
    },
    button: {
        backgroundColor: color.ink, borderRadius: radius.control,
        paddingVertical: space.md, alignItems: 'center',
    },
    buttonPressed: { backgroundColor: color.shellHover },
    buttonDisabled: { backgroundColor: color.lineStrong },
    buttonLabel: { ...type.badge, color: color.surface, fontSize: 12 },
    busyRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
});
