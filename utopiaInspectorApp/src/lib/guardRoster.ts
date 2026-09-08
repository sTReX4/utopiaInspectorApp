import { supabase } from './supabase';
import {
    CachedGuard,
    getCachedGuardsForBranch,
    getRosterRefreshedAt,
    replaceGuardRoster,
} from './sqlite';

export type RosterSource = 'network' | 'cache';

export interface RosterResult {
    guards: CachedGuard[];
    source: RosterSource;
    /** ISO timestamp of the last successful download, or null if never. */
    refreshedAt: string | null;
}

/**
 * Downloads the full active roster and mirrors it into local storage.
 *
 * The whole roster is pulled rather than just the current detachment's, because
 * an inspector needs the guards for a site they have not reached yet. By the
 * time they scan the QR code at a dead-zone site it is too late to fetch.
 *
 * Throws when the download fails, which leaves the existing cache untouched.
 */
export const refreshGuardRoster = async (): Promise<number> => {
    const { data, error } = await supabase
        .from('guards')
        .select('guard_name, lesp_expiry_date, assigned_branch')
        .eq('is_active', true)
        .order('guard_name', { ascending: true });

    if (error) throw error;

    const guards = (data ?? []) as CachedGuard[];
    await replaceGuardRoster(guards);
    return guards.length;
};

/**
 * Resolves the roster for one detachment.
 *
 * The local cache is always the read path, so the screen behaves identically
 * online and offline. A refresh is attempted first and simply skipped when it
 * fails, which is the normal case in the field.
 */
export const loadGuardsForBranch = async (branchName: string): Promise<RosterResult> => {
    let source: RosterSource = 'network';

    try {
        await refreshGuardRoster();
    } catch (error) {
        // Expected whenever the inspector is out of coverage. Not an error state:
        // the cached roster below is the designed fallback.
        console.warn('Guard roster refresh failed, serving cached roster instead:', error);
        source = 'cache';
    }

    return {
        guards: await getCachedGuardsForBranch(branchName),
        source,
        refreshedAt: await getRosterRefreshedAt(),
    };
};
