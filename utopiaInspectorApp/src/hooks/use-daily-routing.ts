import React, { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { loadDailyRouting, type DailyRouting } from '@/lib/dailyRouting';

/**
 * Today's route, re-read whenever the screen regains focus.
 *
 * Coming back from a submitted audit is the main way progress changes, so
 * focus is the right trigger -- a mount-only fetch would leave the tracker
 * stale on exactly the transition that matters.
 */
export function useDailyRouting() {
    const [routing, setRouting] = useState<DailyRouting | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // A screen can lose focus mid-fetch; do not set state into a dead tree.
    const isFocused = useRef(true);

    const load = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
        if (mode === 'refresh') setIsRefreshing(true);

        try {
            const next = await loadDailyRouting();
            if (isFocused.current) setRouting(next);
        } catch (error) {
            console.error('Failed to load daily routing:', error);
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
        refresh: useCallback(() => load('refresh'), [load]),
    };
}
