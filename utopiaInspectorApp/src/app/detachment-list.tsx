import React, { useState } from 'react';
import { View, Text, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import RouteStopCard from '../components/route-stop-card';
import SiteDetailModal from '../components/site-detail-modal';
import { useDailyRouting } from '@/hooks/use-daily-routing';
import type { RouteStop } from '@/lib/dailyRouting';

export default function DetachmentList() {
  const router = useRouter();
  const { routing, isLoading, isRefreshing, refresh } = useDailyRouting();
  const [selectedStop, setSelectedStop] = useState<RouteStop | null>(null);

  const stops = routing?.stops ?? [];
  const completedToday = routing?.completedToday ?? 0;
  const totalAssigned = routing?.totalAssigned ?? 0;

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyText}>
        {isLoading ? 'Loading your route…' : 'No detachments assigned.'}
      </Text>
      <Text style={styles.emptySubtext}>
        {isLoading
          ? 'Fetching today’s assignments.'
          : 'Operations has not assigned you a detachment yet. Pull to refresh once they do.'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Today’s Route</Text>
          <Text style={styles.headerSub}>
            {totalAssigned > 0
              ? `${completedToday} of ${totalAssigned} inspected`
              : 'No assignments'}
          </Text>
        </View>
        {routing?.source === 'cache' ? (
          <View style={styles.offlineBadge}>
            <Text style={styles.offlineBadgeText}>OFFLINE</Text>
          </View>
        ) : null}
      </View>

      <FlatList
        data={stops}
        keyExtractor={(stop) => stop.detachment.id}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} />}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <RouteStopCard
            stop={item}
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

      <SiteDetailModal
        visible={selectedStop !== null}
        onClose={() => setSelectedStop(null)}
        site={selectedStop?.detachment ?? null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
  headerSub: { fontSize: 13, color: '#64748b', marginTop: 2 },
  offlineBadge: {
    borderWidth: 1, borderColor: '#fcd34d', backgroundColor: '#fffbeb',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12,
  },
  offlineBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, color: '#b45309' },
  listContent: { padding: 16, paddingBottom: 40, flexGrow: 1 },
  emptyState: { alignItems: 'center', marginTop: 40, paddingHorizontal: 24 },
  emptyText: { fontSize: 16, color: '#475569', fontWeight: '600' },
  emptySubtext: { fontSize: 14, color: '#94a3b8', marginTop: 8, textAlign: 'center' },
});
