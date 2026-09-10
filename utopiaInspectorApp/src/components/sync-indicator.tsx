import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, DeviceEventEmitter } from 'react-native';
import { getPendingAudits } from '../lib/sqlite';
import { color, space, type } from '@/constants/tokens';

/**
 * A one-line band above the header reporting the offline queue.
 *
 * The two states used to be a bright sky blue and a bright amber, which read
 * as decoration on an otherwise neutral shell. They now use the same
 * desaturated status inks as every other state in the app, so the band reads
 * as information rather than as a second brand colour.
 */
export default function SyncIndicator() {
    const [isSyncing, setIsSyncing] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        // Check initial local queue on boot
        const checkInitialQueue = async () => {
            const pending = await getPendingAudits();
            setPendingCount(pending.length);
        };
        checkInitialQueue();

        // Listen for live updates from syncManager
        const subscription = DeviceEventEmitter.addListener('sync_status', (event) => {
            setIsSyncing(event.isSyncing);
            setPendingCount(event.count);
        });

        return () => subscription.remove();
    }, []);

    if (!isSyncing && pendingCount === 0) return null;

    const draft = pendingCount === 1 ? 'draft' : 'drafts';

    return (
        <View style={[styles.band, isSyncing ? styles.syncing : styles.pending]}>
            <Text style={[styles.label, isSyncing ? styles.labelSyncing : styles.labelPending]}>
                {isSyncing
                    ? `Uploading ${pendingCount} offline ${draft}`
                    : `${pendingCount} ${draft} waiting for network`}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    band: {
        width: '100%',
        alignItems: 'center',
        paddingVertical: space.xs + 2,
        borderBottomWidth: 1,
    },
    syncing: { backgroundColor: color.infoBg, borderBottomColor: color.infoInk },
    pending: { backgroundColor: color.warnBg, borderBottomColor: color.warnInk },
    label: { ...type.badge, fontSize: 10 },
    labelSyncing: { color: color.infoInk },
    labelPending: { color: color.warnInk },
});
