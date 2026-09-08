import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, DeviceEventEmitter } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getPendingAudits, PendingAudit } from '../lib/sqlite';
import { triggerAtomicSync } from '../lib/syncManager';

export default function OfflineQueueScreen() {
    const [drafts, setDrafts] = useState<PendingAudit[]>([]);
    const [isSyncing, setIsSyncing] = useState(false);

    const loadDrafts = async () => {
        const pending = await getPendingAudits();
        setDrafts(pending);
    };

    useEffect(() => {
        loadDrafts();
        
        // Listen for live updates if the background sync catches a signal
        const subscription = DeviceEventEmitter.addListener('sync_status', (event) => {
            setIsSyncing(event.isSyncing);
            if (!event.isSyncing) loadDrafts(); // Reload the list once sync completes
        });
        
        return () => subscription.remove();
    }, []);

    const handleManualSync = async () => {
        setIsSyncing(true);
        await triggerAtomicSync();
        await loadDrafts();
        setIsSyncing(false);
    };

    const renderDraft = ({ item }: { item: PendingAudit }) => {
        const payload = JSON.parse(item.payload);
        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.branchName}>{payload.branch_name || 'Unknown Detachment'}</Text>
                    {item.is_critical === 1 && (
                        <View style={styles.criticalBadge}>
                            <Text style={styles.criticalText}>ALARM RESPONSE</Text>
                        </View>
                    )}
                </View>
                <Text style={styles.metaText}>Time In: {new Date(payload.inspector_in_time).toLocaleString()}</Text>
                <Text style={styles.metaText}>Cached On: {new Date(item.created_at).toLocaleString()}</Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: 'Pending Uploads' }} />
            
            <View style={styles.header}>
                <Ionicons name="cloud-offline-outline" size={42} color="#64748b" />
                <Text style={styles.title}>{drafts.length} Offline Draft(s)</Text>
                <Text style={styles.subtitle}>These reports are safely encrypted in your local memory. They will be permanently removed from this device once successfully transmitted to Command Center.</Text>
            </View>

            <FlatList
                data={drafts}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderDraft}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>Your local cache is clean. No pending uploads.</Text>
                }
            />

            <TouchableOpacity 
                style={[styles.syncButton, (isSyncing || drafts.length === 0) && styles.syncButtonDisabled]} 
                onPress={handleManualSync}
                disabled={isSyncing || drafts.length === 0}
            >
                {isSyncing ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <ActivityIndicator size="small" color="#fff" style={{ marginRight: 10 }} />
                        <Text style={styles.syncButtonText}>Transmitting to Server...</Text>
                    </View>
                ) : (
                    <Text style={styles.syncButtonText}>Force Sync Now</Text>
                )}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f1f5f9' },
    header: { padding: 24, alignItems: 'center', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
    title: { fontSize: 20, fontWeight: 'bold', color: '#0f172a', marginTop: 10 },
    subtitle: { fontSize: 12, color: '#64748b', textAlign: 'center', marginTop: 8, lineHeight: 18 },
    list: { padding: 16, flexGrow: 1 },
    card: { backgroundColor: '#fff', padding: 16, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#cbd5e1', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    branchName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', flex: 1 },
    criticalBadge: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fca5a5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 },
    criticalText: { fontSize: 10, fontWeight: 'bold', color: '#dc2626' },
    metaText: { fontSize: 12, color: '#64748b', fontFamily: 'monospace', marginBottom: 4 },
    emptyText: { textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', marginTop: 40 },
    syncButton: { backgroundColor: '#0f172a', margin: 16, padding: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    syncButtonDisabled: { backgroundColor: '#94a3b8' },
    syncButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
});