import React, { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { loadDailyRouting, type DailyRouting } from '@/lib/dailyRouting';

/**
 * Today's route, re-read whenever the screen regains focus.
 *
 * Coming back from a submitted audit is the main way progress changes, so
 * focus is the right trigger -- a mount-only fetch would leave the tracker
 * stale on exactly the transition that matters.
 *
 * `loadDailyRouting` already degrades to the local cache when the network is
 * down, so a throw reaching this hook is not a dead zone: it is a hard local
 * failure. That distinction has to survive into the UI. Swallowing it into a
 * console line left `routing` null, which the screen rendered as "no stops
 * assigned" -- telling an inspector operations had given them nothing to do
 * when in fact the read had failed.
 */
export function useDailyRouting() {
    const [routing, setRouting] = useState<DailyRouting | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // A screen can lose focus mid-fetch; do not set state into a dead tree.
    const isFocused = useRef(true);

    const load = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
        if (mode === 'refresh') setIsRefreshing(true);

        try {
            const next = await loadDailyRouting();
            if (isFocused.current) {
                setRouting(next);
                setError(null);
            }
        } catch (cause) {
            console.error('Failed to load daily routing:', cause);
            /* The last good route stays on screen. A failed refresh must not
             * blank out the stops an inspector is standing in front of. */
            if (isFocused.current) {
                setError('Could not read your route from this device.');
            }
        } finally {
            if (isFocused.current) {
                setIsLoading(false);
                setIsRefreshing(false);
            }
        }
    }, []);

    useFocusEffect(
        React.useCallback(() => {
            isFocused.current = true;
            load();

            return () => {
                isFocused.current = false;
            };
        }, [load])
    );

    return {
        routing,
        isLoading,
        isRefreshing,
        error,
        refresh: useCallback(() => load('refresh'), [load]),
        retry: useCallback(() => load('initial'), [load]),
    };
}
