import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, DeviceEventEmitter } from 'react-native';
import { getPendingAudits } from '../lib/sqlite';

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

    return (
        <View style={[styles.container, isSyncing ? styles.syncing : styles.pending]}>
            <Text style={styles.text}>
                {isSyncing 
                    ? `UPLOADING ${pendingCount} OFFLINE DRAFT(S)...` 
                    : `${pendingCount} DRAFT(S) WAITING FOR NETWORK`}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 6,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999,
        width: '100%',
    },
    syncing: {
        backgroundColor: '#0ea5e9', // TasteSkill info blue
    },
    pending: {
        backgroundColor: '#f59e0b', // TasteSkill warning orange
    },
    text: {
        color: '#ffffff',
        fontSize: 10,
        fontFamily: 'monospace',
        fontWeight: 'bold',
        letterSpacing: 1,
    }
});