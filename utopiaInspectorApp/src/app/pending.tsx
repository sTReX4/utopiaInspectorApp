import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';
import { API_BASE_URL } from '../lib/api';

export type ReportStatus = 'PENDING' | 'SYNCING' | 'SUBMITTED' | 'FAILED';
export type QueuedReport<T = any> = {
    localId: string;
    reportData: T;
    createdAt: string;
    status: ReportStatus;
    retryCount: number;
    lastAttemptAt?: string;
    lastError?: string;
};

const KEY = 'utopia-inspector:pending-reports:v1';

// Async storage wrappers for React Native
export const loadReports = async (): Promise<QueuedReport[]> => {
    try {
        const stored = await AsyncStorage.getItem(KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

export const saveReports = async (items: QueuedReport[]) => {
    await AsyncStorage.setItem(KEY, JSON.stringify(items));
};

export const enqueueReport = async <T,>(reportData: T): Promise<QueuedReport<T>> => {
    const report: QueuedReport<T> = { 
        localId: `${Date.now()}-${Math.random().toString(36).slice(2)}`, 
        reportData, 
        createdAt: new Date().toISOString(), 
        status: 'PENDING', 
        retryCount: 0 
    };
    const existing = await loadReports();
    await saveReports([...existing, report]);
    return report;
};

// Dummy fetch function - replace with your Supabase/Vercel logic
async function postReport(report: QueuedReport) {
    const response = await fetch(`${API_BASE_URL}/api/audits`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(report.reportData) 
    });
    if (!response.ok) throw new Error(`Server returned ${response.status}`);
    return response.json();
}

type Props = { submitReport?: (report: QueuedReport) => Promise<any> };

export default function PendingReportsScreen({ submitReport = postReport }: Props) {
    const [reports, setReports] = useState<QueuedReport[]>([]);
    const [online, setOnline] = useState(true);
    const [syncing, setSyncing] = useState(false);

    const refresh = useCallback(async () => {
        const data = await loadReports();
        setReports(data);
    }, []);

    const checkNetwork = async () => {
        const networkState = await Network.getNetworkStateAsync();
        setOnline(!!networkState.isConnected && !!networkState.isInternetReachable);
    };

    const sync = useCallback(async () => {
        await checkNetwork();
        if (!online || syncing) return;
        
        setSyncing(true);
        try {
            let currentReports = await loadReports();
            const pendingReports = currentReports.filter(r => r.status !== 'SUBMITTED');

            for (const item of pendingReports) {
                const networkState = await Network.getNetworkStateAsync();
                if (!networkState.isConnected) break;

                const attempt = { ...item, status: 'SYNCING' as ReportStatus, retryCount: item.retryCount + 1, lastAttemptAt: new Date().toISOString(), lastError: undefined };
                
                // Update UI to show syncing
                currentReports = currentReports.map(r => r.localId === item.localId ? attempt : r);
                await saveReports(currentReports);
                await refresh();

                try {
                    await submitReport(attempt);
                    // Remove successfully submitted
                    currentReports = currentReports.filter(r => r.localId !== item.localId);
                    await saveReports(currentReports);
                } catch (error) {
                    const failed = { ...attempt, status: 'FAILED' as ReportStatus, lastError: error instanceof Error ? error.message : 'Submission failed' };
                    currentReports = currentReports.map(r => r.localId === item.localId ? failed : r);
                    await saveReports(currentReports);
                    break;
                }
            }
        } finally {
            setSyncing(false);
            await refresh();
        }
    }, [online, refresh, submitReport, syncing]);

    useEffect(() => {
        refresh();
        checkNetwork();
        // Check network status every 10 seconds while on this screen
        const interval = setInterval(checkNetwork, 10000);
        return () => clearInterval(interval);
    }, [refresh]);

    const pending = reports.filter(report => report.status !== 'SUBMITTED');

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Pending Audits</Text>
                <View style={[styles.statusBadge, { backgroundColor: online ? '#dcfce7' : '#fee2e2' }]}>
                    <Text style={[styles.statusText, { color: online ? '#166534' : '#991b1b' }]}>
                        {online ? '✓ Online' : '⚠ Offline'}
                    </Text>
                </View>
            </View>

            <Text style={styles.summaryText}>
                {syncing 
                    ? `Syncing ${pending.length} pending reports...` 
                    : `${pending.length} reports waiting to sync`}
            </Text>

            <TouchableOpacity 
                style={[styles.syncButton, (!online || syncing || pending.length === 0) && styles.syncButtonDisabled]} 
                onPress={sync}
                disabled={!online || syncing || pending.length === 0}
            >
                {syncing ? <ActivityIndicator color="#fff" /> : <Text style={styles.syncButtonText}>Force Sync Now</Text>}
            </TouchableOpacity>

            <ScrollView style={styles.list}>
                {pending.length === 0 ? (
                    <Text style={styles.emptyText}>No pending reports in queue.</Text>
                ) : (
                    pending.map(report => (
                        <View key={report.localId} style={styles.card}>
                            <Text style={styles.cardTitle}>Audit Report: {report.reportData.branch_name || 'Unknown Branch'}</Text>
                            <Text style={styles.cardDetail}>Local ID: {report.localId.split('-')[0]}</Text>
                            <Text style={styles.cardDetail}>Status: {report.status}</Text>
                            <Text style={styles.cardDetail}>Attempts: {report.retryCount}</Text>
                            {report.lastAttemptAt && <Text style={styles.cardDetail}>Last sync: {new Date(report.lastAttemptAt).toLocaleTimeString()}</Text>}
                            {report.lastError && <Text style={styles.errorText}>Error: {report.lastError}</Text>}
                        </View>
                    ))
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc', padding: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingTop: 40 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#0f172a' },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
    statusText: { fontSize: 12, fontWeight: 'bold' },
    summaryText: { fontSize: 14, color: '#64748b', marginBottom: 20 },
    syncButton: { backgroundColor: '#0f172a', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 20 },
    syncButtonDisabled: { opacity: 0.5 },
    syncButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
    list: { flex: 1 },
    emptyText: { textAlign: 'center', color: '#64748b', marginTop: 40, fontStyle: 'italic' },
    card: { backgroundColor: '#ffffff', padding: 16, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#0f172a', marginBottom: 8 },
    cardDetail: { fontSize: 13, color: '#64748b', marginBottom: 4 },
    errorText: { fontSize: 13, color: '#dc2626', marginTop: 8, fontWeight: 'bold' }
});