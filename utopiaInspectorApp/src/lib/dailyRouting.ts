import { supabase } from './supabase';
import { fetchClearance, getInspectorId } from './inspectorAccount';
import { refreshGuardRoster } from './guardRoster';
import {
    CachedDetachment,
    CachedGuard,
    getCachedAssignedDetachments,
    getCachedGuardsForBranch,
    getPendingAudits,
    getRoutingRefreshedAt,
    replaceAssignedDetachments,
} from './sqlite';

export type RoutingSource = 'network' | 'cache';

/** One detachment on today's route, with the guards due to be audited there. */
export interface RouteStop {
    detachment: CachedDetachment;
    guards: CachedGuard[];
    /** True once an audit for this branch exists today, synced or still queued. */
    isCompletedToday: boolean;
    /** Set when the completion is still sitting in the local queue. */
    isPendingSync: boolean;
}

export interface DailyRouting {
    inspectorId: string | null;
    stops: RouteStop[];
    totalAssigned: number;
    completedToday: number;
    source: RoutingSource;
    refreshedAt: string | null;
}

/** Local midnight, expressed as an instant the server can compare against. */
export const startOfToday = (): Date => {
    const midnight = new Date();
    midnight.setHours(0, 0, 0, 0);
    return midnight;
};

/**
 * The inspector's own roster row id.
 *
 * Not auth.users.id -- detachments.assigned_inspector_id and audits.inspector_id
 * are both foreign keys to inspectors.id, and the two are different values.
 * The gate caches it on every clearance check; this re-fetches if that cache
 * was cleared.
 */
const resolveInspectorId = async (): Promise<string | null> => {
    const cached = await getInspectorId();
    if (cached) return cached;

    try {
        const clearance = await fetchClearance();
        return clearance.inspector_id;
    } catch {
        return null;
    }
};

/**
 * Branch codes this inspector has already closed today.
 *
 * Reads both sides of the offline queue: what the server has, plus what is
 * still waiting in SQLite. An audit filed in a dead zone counts toward the
 * day's progress the moment it is written, not whenever coverage returns --
 * otherwise the tracker would march backwards on a bad signal day.
 */
const collectCompletedBranchCodes = async (
    inspectorId: string | null,
    since: Date
): Promise<{ synced: Set<string>; pending: Set<string> }> => {
    const synced = new Set<string>();
    const pending = new Set<string>();

    if (inspectorId) {
        const { data, error } = await supabase
            .from('audits')
            .select('branch_code')
            .eq('inspector_id', inspectorId)
            .gte('created_at', since.toISOString());

        if (!error && data) {
            for (const row of data) {
                if (row.branch_code) synced.add(row.branch_code);
            }
        }
    }

    for (const record of await getPendingAudits()) {
        if (new Date(record.created_at) < since) continue;

        try {
            const payload = JSON.parse(record.payload) as { branch_code?: string };
            if (payload.branch_code) pending.add(payload.branch_code);
        } catch {
            // A payload that will not parse cannot be attributed to a branch.
            // syncManager surfaces the same record as a failure; skip it here.
        }
    }

    return { synced, pending };
};

/**
 * Everything the home screen and the route list need for the day.
 *
 * The local cache is the read path throughout, so the screens behave the same
 * online and off. Each network leg is attempted first and skipped on failure,
 * which is the ordinary case in the field rather than an error state.
 */
export const loadDailyRouting = async (): Promise<DailyRouting> => {
    const inspectorId = await resolveInspectorId();
    let source: RoutingSource = 'network';

    if (inspectorId) {
        const { data, error } = await supabase
            .from('detachments')
            .select('id, branch_code, branch_name, branch_location, latitude, longitude')
            .eq('assigned_inspector_id', inspectorId)
            .order('branch_name', { ascending: true });

        if (error || !data) {
            source = 'cache';
        } else {
            await replaceAssignedDetachments(data as CachedDetachment[]);
        }
    } else {
        source = 'cache';
    }

    try {
        await refreshGuardRoster();
    } catch (error) {
        // Expected out of coverage. The cached roster below is the fallback.
        console.warn('Guard roster refresh failed, serving cached roster instead:', error);
        source = 'cache';
    }

    const detachments = await getCachedAssignedDetachments();
    const { synced, pending } = await collectCompletedBranchCodes(inspectorId, startOfToday());

    const stops: RouteStop[] = [];
    for (const detachment of detachments) {
        const isPendingSync = pending.has(detachment.branch_code);

        stops.push({
            detachment,
            guards: await getCachedGuardsForBranch(detachment.branch_name),
            isCompletedToday: synced.has(detachment.branch_code) || isPendingSync,
            isPendingSync,
        });
    }

    return {
        inspectorId,
        stops,
        totalAssigned: stops.length,
        completedToday: stops.filter((stop) => stop.isCompletedToday).length,
        source,
        refreshedAt: await getRoutingRefreshedAt(),
    };
};
