import * as SQLite from 'expo-sqlite';

export interface PendingAudit {
    id: number;
    payload: string;
    is_critical: number;
    created_at: string;
}

// Initialize the local database file natively on the Android/iOS flash memory
export const getDBConnection = async () => {
    const db = await SQLite.openDatabaseAsync('utopia_offline.db');
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS pending_audits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            payload TEXT NOT NULL,
            is_critical INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL
        );
    `);
    return db;
};

// Intercept and cache the JSON payload safely
export const saveAuditLocally = async (payload: any, isCritical: boolean) => {
    const db = await getDBConnection();
    // Use runAsync with flat parameters to prevent Android native bridge NPEs
    await db.runAsync(
        'INSERT INTO pending_audits (payload, is_critical, created_at) VALUES (?, ?, ?)',
        JSON.stringify(payload),
        isCritical ? 1 : 0,
        new Date().toISOString()
    );
};

export const getPendingAudits = async (): Promise<PendingAudit[]> => {
    const db = await getDBConnection();
    return await db.getAllAsync<PendingAudit>('SELECT * FROM pending_audits ORDER BY created_at ASC');
};

export const removeSyncedAudit = async (id: number) => {
    const db = await getDBConnection();
    await db.runAsync('DELETE FROM pending_audits WHERE id = ?', id);
};