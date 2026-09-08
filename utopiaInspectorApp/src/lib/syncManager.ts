import NetInfo from '@react-native-community/netinfo';
import * as Notifications from 'expo-notifications';
import { DeviceEventEmitter } from 'react-native';
import { getPendingAudits, removeSyncedAudit } from './sqlite';


const API_URL = 'http://192.168.1.8:3000/api/audits';

// Ensure notifications show even when the app is open
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

let isSyncing = false;

export const triggerAtomicSync = async () => {
    if (isSyncing) return;
    
    const pendingRecords = await getPendingAudits();
    if (pendingRecords.length === 0) {
        DeviceEventEmitter.emit('sync_status', { isSyncing: false, count: 0 });
        return;
    }

    isSyncing = true;
    DeviceEventEmitter.emit('sync_status', { isSyncing: true, count: pendingRecords.length });

    await Notifications.scheduleNotificationAsync({
        content: {
            title: "Utopia Network Restored",
            body: `Uploading ${pendingRecords.length} offline report(s) to Command Center...`,
        },
        trigger: null,
    });

    let successCount = 0;
    let failureCount = 0;

    for (const record of pendingRecords) {
        try {
            const parsedPayload = JSON.parse(record.payload);
            
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(parsedPayload),
            });

            if (response.ok) {
                await removeSyncedAudit(record.id);
                successCount++;
            } else {
                throw new Error(`Server rejected offline audit ${record.id}`);
            }
        } catch (error) {
            console.error(`Atomic Sync failed for audit ${record.id}`, error);
            failureCount++;
            // Break loop on first failure. Un-synced choices are safely retained in SQLite.
            break; 
        }
    }

    isSyncing = false;
    DeviceEventEmitter.emit('sync_status', { isSyncing: false, count: pendingRecords.length - successCount });

    if (successCount > 0) {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: "Sync Complete",
                body: `Successfully transmitted ${successCount} report(s).`,
            },
            trigger: null,
        });
    }

    if (failureCount > 0) {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: "Sync Paused",
                body: "A transmission error occurred. Pending reports remain safely saved on your device.",
            },
            trigger: null,
        });
    }
};

// Global listener for automatic background sync
export const initializeNetworkListener = () => {
    NetInfo.addEventListener(state => {
        if (state.isConnected && state.isInternetReachable) {
            triggerAtomicSync();
        }
    });
};