import * as SQLite from 'expo-sqlite';

export interface PendingAudit {
    id: number;
    payload: string;
    is_critical: number;
    created_at: string;
}

const DATABASE_NAME = 'utopia_offline.db';

/**
 * A single connection is opened for the lifetime of the app and held here.
 *
 * This reference is load-bearing, not just an optimization. `openDatabaseAsync`
 * hands back a JS wrapper around a shared native handle that is reference
 * counted on the native side. When such a wrapper is garbage collected, the
 * native handle it points at is closed, but the module's internal connection
 * cache still holds that entry and still reports it as open. A later
 * `openDatabaseAsync` for the same file then hands back the dead handle, and
 * the next statement fails with a NullPointerException from the native bridge.
 *
 * Keeping one wrapper alive at module scope means the handle is never released
 * and the cache never goes stale.
 */
let connection: Promise<SQLite.SQLiteDatabase> | null = null;

const openConnection = async (): Promise<SQLite.SQLiteDatabase> => {
    const db = await SQLite.openDatabaseAsync(DATABASE_NAME);

    await db.execAsync(`
        PRAGMA journal_mode = WAL;
        -- Wait for a competing writer instead of failing instantly with
        -- "database is locked". Deduplication upstream should keep writes from
        -- overlapping at all; this is the belt to that pair of braces.
        PRAGMA busy_timeout = 5000;
        CREATE TABLE IF NOT EXISTS pending_audits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            payload TEXT NOT NULL,
            is_critical INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS guard_roster (
            assigned_branch TEXT NOT NULL,
            guard_name TEXT NOT NULL,
            lesp_expiry_date TEXT,
            PRIMARY KEY (assigned_branch, guard_name)
        );
        CREATE TABLE IF NOT EXISTS roster_meta (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            refreshed_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS assigned_detachments (
            id TEXT PRIMARY KEY,
            branch_code TEXT NOT NULL,
            branch_name TEXT NOT NULL,
            branch_location TEXT,
            latitude REAL,
            longitude REAL
        );
        CREATE TABLE IF NOT EXISTS routing_meta (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            refreshed_at TEXT NOT NULL
        );
    `);

    return db;
};

// Initialize the local database file natively on the Android/iOS flash memory
export const getDBConnection = (): Promise<SQLite.SQLiteDatabase> => {
    if (!connection) {
        // Cache the promise itself so concurrent callers share one open request
        // instead of racing to create competing connections.
        connection = openConnection().catch((error) => {
            // Let the next caller retry rather than caching a rejected promise.
            connection = null;
            throw error;
        });
    }

    return connection;
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

/**
 * A guard as mirrored from the `guards` table for offline use.
 */
export interface CachedGuard {
    assigned_branch: string;
    guard_name: string;
    lesp_expiry_date: string | null;
}

/**
 * Replaces the whole cached roster in one transaction.
 *
 * This is only ever called with a roster the server actually returned. A failed
 * download throws before reaching here, so a dead zone leaves the previous
 * cache intact rather than emptying it.
 */
export const replaceGuardRoster = async (guards: CachedGuard[]) => {
    const db = await getDBConnection();

    await db.withExclusiveTransactionAsync(async (txn) => {
        await txn.runAsync('DELETE FROM guard_roster');

        for (const guard of guards) {
            await txn.runAsync(
                'INSERT OR REPLACE INTO guard_roster (assigned_branch, guard_name, lesp_expiry_date) VALUES (?, ?, ?)',
                guard.assigned_branch,
                guard.guard_name,
                guard.lesp_expiry_date ?? null
            );
        }

        await txn.runAsync(
            `INSERT INTO roster_meta (id, refreshed_at) VALUES (1, ?)
             ON CONFLICT(id) DO UPDATE SET refreshed_at = excluded.refreshed_at`,
            new Date().toISOString()
        );
    });
};

export const getCachedGuardsForBranch = async (branchName: string): Promise<CachedGuard[]> => {
    const db = await getDBConnection();
    return await db.getAllAsync<CachedGuard>(
        `SELECT assigned_branch, guard_name, lesp_expiry_date
         FROM guard_roster
         WHERE assigned_branch = ?
         ORDER BY guard_name ASC`,
        branchName
    );
};

/** When the cached roster was last downloaded, so the UI can show its age. */
export const getRosterRefreshedAt = async (): Promise<string | null> => {
    const db = await getDBConnection();
    const row = await db.getFirstAsync<{ refreshed_at: string }>(
        'SELECT refreshed_at FROM roster_meta WHERE id = 1'
    );
    return row?.refreshed_at ?? null;
};

/**
 * One stop on the inspector's route, mirrored from `detachments` for offline
 * use. Only the fields the field screens actually render are kept.
 */
export interface CachedDetachment {
    id: string;
    branch_code: string;
    branch_name: string;
    branch_location: string | null;
    latitude: number | null;
    longitude: number | null;
}

/**
 * Replaces the cached route in one transaction.
 *
 * Same contract as the guard roster: this is only reached with a list the
 * server actually returned, so a dead zone leaves yesterday's route on the
 * device rather than blanking the inspector's assignments.
 */
export const replaceAssignedDetachments = async (detachments: CachedDetachment[]) => {
    const db = await getDBConnection();

    await db.withExclusiveTransactionAsync(async (txn) => {
        await txn.runAsync('DELETE FROM assigned_detachments');

        for (const detachment of detachments) {
            await txn.runAsync(
                `INSERT OR REPLACE INTO assigned_detachments
                   (id, branch_code, branch_name, branch_location, latitude, longitude)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                detachment.id,
                detachment.branch_code,
                detachment.branch_name,
                detachment.branch_location ?? null,
                detachment.latitude ?? null,
                detachment.longitude ?? null
            );
        }

        await txn.runAsync(
            `INSERT INTO routing_meta (id, refreshed_at) VALUES (1, ?)
             ON CONFLICT(id) DO UPDATE SET refreshed_at = excluded.refreshed_at`,
            new Date().toISOString()
        );
    });
};

export const getCachedAssignedDetachments = async (): Promise<CachedDetachment[]> => {
    const db = await getDBConnection();
    return await db.getAllAsync<CachedDetachment>(
        `SELECT id, branch_code, branch_name, branch_location, latitude, longitude
         FROM assigned_detachments
         ORDER BY branch_name ASC`
    );
};

/** When the cached route was last downloaded, so the UI can show its age. */
export const getRoutingRefreshedAt = async (): Promise<string | null> => {
    const db = await getDBConnection();
    const row = await db.getFirstAsync<{ refreshed_at: string }>(
        'SELECT refreshed_at FROM routing_meta WHERE id = 1'
    );
    return row?.refreshed_at ?? null;
};
