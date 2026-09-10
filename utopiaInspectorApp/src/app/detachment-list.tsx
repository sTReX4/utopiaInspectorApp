import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import RouteStopCard from '../components/route-stop-card';
import SiteDetailModal from '../components/site-detail-modal';
import { useDailyRouting } from '@/hooks/use-daily-routing';
import type { RouteStop } from '@/lib/dailyRouting';
import { EmptyState, ListFrame, ScreenTitle } from '../components/data-surface';
import { color, radius, space, type } from '@/constants/tokens';

export default function DetachmentList() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { routing, isLoading, isRefreshing, error, refresh } = useDailyRouting();
  const [selectedStop, setSelectedStop] = useState<RouteStop | null>(null);

  /* Set when the inspector arrived by tapping a specific stop on the home
   * screen. Params arrive as string | string[]; only the first value is ours. */
  const { focus } = useLocalSearchParams<{ focus?: string | string[] }>();
  const focusCode = Array.isArray(focus) ? focus[0] : focus;

  const listRef = useRef<FlatList<RouteStop>>(null);
  /* The route reloads on every focus. Without this the list would scroll back
   * to the arrival row each time, fighting an inspector who scrolled away. */
  const scrolledTo = useRef<string | null>(null);

  const stops = useMemo(() => routing?.stops ?? [], [routing]);
  const completedToday = routing?.completedToday ?? 0;
  const totalAssigned = routing?.totalAssigned ?? 0;

  useEffect(() => {
    if (!focusCode || stops.length === 0) return;
    if (scrolledTo.current === focusCode) return;

    const index = stops.findIndex((stop) => stop.detachment.branch_code === focusCode);
    if (index < 0) return;

    scrolledTo.current = focusCode;
    // Not animated: the branch should already be there when the screen lands.
    listRef.current?.scrollToIndex({ index, animated: false, viewPosition: 0 });
  }, [focusCode, stops]);

  return (
    <View style={styles.screen}>
      <ScreenTitle
        title="Today's route"
        subtitle={totalAssigned > 0 ? `${completedToday} of ${totalAssigned} inspected` : 'No assignments'}
        action={
          routing?.source === 'cache' ? (
            <View style={styles.badge}>
              <Text style={[type.badge, { color: color.warnInk }]}>Offline</Text>
            </View>
          ) : null
        }
      />

      <ListFrame>
        <FlatList
          ref={listRef}
          data={stops}
          keyExtractor={(stop) => stop.detachment.id}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={color.ink} />}
          contentContainerStyle={[
            styles.listContent,
            {
              paddingLeft: insets.left,
              paddingRight: insets.right,
              paddingBottom: insets.bottom + space.xl,
            },
          ]}
          /* Card height varies with the guard count, so the target row may not be
           * measured yet. Fall back to the running average rather than retrying,
           * which can loop. */
          onScrollToIndexFailed={({ index, averageItemLength }) =>
            listRef.current?.scrollToOffset({ offset: averageItemLength * index, animated: false })
          }
          /* A failed read and an empty roster are different facts. Saying "no
           * detachments assigned" after a failure tells an inspector operations
           * gave them nothing to do. */
          ListEmptyComponent={
            isLoading ? null : error ? (
              <EmptyState
                title="Route unavailable"
                body={`${error} Retry from the home screen, or sign out and back in if it keeps failing.`}
              />
            ) : (
              <EmptyState
                title="No detachments assigned"
                body="Operations assigns detachments from the console. Pull down to refresh once they do."
              />
            )
          }
          renderItem={({ item, index }) => (
            <RouteStopCard
              stop={item}
              isFirst={index === 0}
              isFocused={item.detachment.branch_code === focusCode}
              /* An inspected stop opens its detail; an outstanding one goes
               * straight to the audit form, which is what the inspector is
               * standing at the branch to do. */
              onPress={() =>
                item.isCompletedToday
                  ? setSelectedStop(item)
                  : router.push('/audit' as any)
              }
            />
          )}
        />
      </ListFrame>

      <SiteDetailModal
        visible={selectedStop !== null}
        onClose={() => setSelectedStop(null)}
        site={selectedStop?.detachment ?? null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.canvas },
  listContent: { flexGrow: 1 },
  badge: {
    borderWidth: 1, borderColor: color.warnInk, backgroundColor: color.warnBg,
    borderRadius: radius.badge,
    paddingHorizontal: space.sm, paddingVertical: 3,
  },
});
