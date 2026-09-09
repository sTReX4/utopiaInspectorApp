import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useDailyRouting } from '@/hooks/use-daily-routing';
import type { RouteStop } from '@/lib/dailyRouting';
import { color, radius, space, type } from '@/constants/tokens';

/**
 * The inspector's primary view: what is assigned today, what is closed, what
 * is left, and the fastest way into the next audit.
 *
 * Structured as full-bleed data sections separated by hairlines rather than
 * floating cards. At this density a card border plus a page margin plus a
 * shadow spends three visual devices to say what one hairline says.
 */
export default function HomepageScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { routing, isLoading, isRefreshing, refresh } = useDailyRouting();

  const stops = routing?.stops ?? [];
  const total = routing?.totalAssigned ?? 0;
  const completed = routing?.completedToday ?? 0;
  const remaining = Math.max(total - completed, 0);
  const queued = stops.filter((stop) => stop.isPendingSync).length;
  const guardsOnRoute = stops.reduce((sum, stop) => sum + stop.guards.length, 0);

  return (
    <View style={styles.screen}>
      <ScrollView
        /* Styles go on the content container, not the ScrollView, or the
         * bottom padding is ignored and the last row sits under the system
         * navigation bar. */
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + space.xl }]}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={color.ink} />
        }
      >
        <ProgressPanel
          completed={completed}
          total={total}
          remaining={remaining}
          isLoading={isLoading}
          stops={stops}
          servingCache={routing?.source === 'cache'}
        />

        <ReadoutGrid
          rows={[
            { label: 'Assigned', value: String(total) },
            { label: 'Closed', value: String(completed) },
            { label: 'Remaining', value: String(remaining) },
            { label: 'Guards on route', value: String(guardsOnRoute) },
            ...(queued > 0 ? [{ label: 'Queued offline', value: String(queued), state: 'warn' as const }] : []),
          ]}
        />

        <Section label={`Route (${stops.length})`}>
          {isLoading ? (
            <RouteSkeleton />
          ) : stops.length === 0 ? (
            <EmptyRoute />
          ) : (
            stops.map((stop, index) => (
              <StopRow
                key={stop.detachment.id}
                stop={stop}
                isFirst={index === 0}
                onPress={() => router.push('/detachment-list' as any)}
              />
            ))
          )}
        </Section>

        <Section label="Actions">
          <ActionRow label="Start audit" hint="Scan a branch code" onPress={() => router.push('/audit' as any)} isFirst />
          <ActionRow label="Submission history" hint="Past audits and receipts" onPress={() => router.push('/history' as any)} />
        </Section>
      </ScrollView>
    </View>
  );
}

/* --- Primary metric ------------------------------------------------------ */

function ProgressPanel({
  completed, total, remaining, isLoading, stops, servingCache,
}: {
  completed: number; total: number; remaining: number;
  isLoading: boolean; stops: RouteStop[]; servingCache: boolean;
}) {
  return (
    <View style={styles.panel}>
      <View style={styles.panelHead}>
        <Text style={type.label}>Daily progress</Text>
        {servingCache ? <Badge tone="warn">Offline</Badge> : null}
      </View>

      <View style={styles.metricRow}>
        <Text style={type.metric}>
          {isLoading ? '--' : completed}
          <Text style={type.metricSub}>{isLoading ? '' : ` / ${total}`}</Text>
        </Text>
      </View>

      {/* One segment per assigned stop, so the bar is a readout of the route
        * rather than a decorative percentage track. */}
      <View style={styles.segments}>
        {total === 0 ? (
          <View style={[styles.segment, styles.segmentEmpty]} />
        ) : (
          stops.map((stop) => (
            <View
              key={stop.detachment.id}
              style={[
                styles.segment,
                stop.isPendingSync ? styles.segmentQueued
                  : stop.isCompletedToday ? styles.segmentDone
                  : styles.segmentEmpty,
              ]}
            />
          ))
        )}
      </View>

      <Text style={styles.panelNote}>
        {isLoading ? 'Loading route'
          : total === 0 ? 'No detachments assigned to you'
          : remaining === 0 ? 'Route complete'
          : `${remaining} of ${total} still to inspect`}
      </Text>
    </View>
  );
}

/* --- Key/value readout --------------------------------------------------- */

function ReadoutGrid({ rows }: { rows: { label: string; value: string; state?: 'warn' }[] }) {
  return (
    <View style={styles.section}>
      {rows.map((row, index) => (
        <View key={row.label} style={[styles.readoutRow, index > 0 && styles.rowDivider]}>
          <Text style={type.label}>{row.label}</Text>
          <Text style={[type.data, row.state === 'warn' && { color: color.warnInk }]}>{row.value}</Text>
        </View>
      ))}
    </View>
  );
}

/* --- Route ---------------------------------------------------------------- */

function StopRow({ stop, isFirst, onPress }: { stop: RouteStop; isFirst: boolean; onPress: () => void }) {
  const { detachment, guards, isCompletedToday, isPendingSync } = stop;

  return (
    <Pressable
      onPress={onPress}
      /* Instant state change, no timing curve. Feedback on a field device
       * should land before the finger lifts. */
      style={({ pressed }) => [
        styles.stopRow,
        !isFirst && styles.rowDivider,
        pressed && styles.rowPressed,
      ]}
    >
      <View style={styles.stopMain}>
        <Text style={styles.stopCode}>{detachment.branch_code}</Text>
        <Text style={type.title} numberOfLines={1}>{detachment.branch_name}</Text>
        <Text style={type.dataMuted} numberOfLines={1}>
          {guards.length} {guards.length === 1 ? 'guard' : 'guards'} posted
          {detachment.branch_location ? `  ${detachment.branch_location}` : ''}
        </Text>
      </View>

      <Badge tone={isPendingSync ? 'warn' : isCompletedToday ? 'ok' : 'idle'}>
        {isPendingSync ? 'Queued' : isCompletedToday ? 'Closed' : 'Open'}
      </Badge>
    </Pressable>
  );
}

function RouteSkeleton() {
  /* Shaped like the rows it replaces, so the layout does not jump when data
   * lands. */
  return (
    <View>
      {[0, 1, 2].map((i) => (
        <View key={i} style={[styles.stopRow, i > 0 && styles.rowDivider]}>
          <View style={styles.stopMain}>
            <View style={[styles.skeleton, { width: 48, height: 10 }]} />
            <View style={[styles.skeleton, { width: '62%', height: 14 }]} />
            <View style={[styles.skeleton, { width: '40%', height: 10 }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

function EmptyRoute() {
  return (
    <View style={styles.empty}>
      <Text style={type.title}>No stops assigned</Text>
      <Text style={[type.body, { marginTop: space.xs }]}>
        Operations assigns detachments from the console. Pull down to refresh once they do.
      </Text>
    </View>
  );
}

/* --- Actions -------------------------------------------------------------- */

function ActionRow({ label, hint, onPress, isFirst }: { label: string; hint: string; onPress: () => void; isFirst?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.actionRow, !isFirst && styles.rowDivider, pressed && styles.rowPressed]}
    >
      <View>
        <Text style={type.title}>{label}</Text>
        <Text style={type.dataMuted}>{hint}</Text>
      </View>
      <Text style={styles.chevron}>{'>'}</Text>
    </Pressable>
  );
}

/* --- Primitives ----------------------------------------------------------- */

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View>
      <View style={styles.sectionHead}>
        <Text style={type.label}>{label}</Text>
      </View>
      <View style={styles.section}>{children}</View>
    </View>
  );
}

function Badge({ tone, children }: { tone: 'ok' | 'warn' | 'idle'; children: React.ReactNode }) {
  const tones = {
    ok: { backgroundColor: color.okBg, borderColor: color.okInk, color: color.okInk },
    warn: { backgroundColor: color.warnBg, borderColor: color.warnInk, color: color.warnInk },
    idle: { backgroundColor: color.sunken, borderColor: color.lineStrong, color: color.inkMuted },
  }[tone];

  return (
    <View style={[styles.badge, { backgroundColor: tones.backgroundColor, borderColor: tones.borderColor }]}>
      <Text style={[type.badge, { color: tones.color }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.canvas },
  content: { paddingTop: space.md },

  /* Sections are full-bleed. A hairline top and bottom is the only container. */
  panel: {
    backgroundColor: color.surface,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: color.line,
    paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.lg,
    marginBottom: space.lg,
  },
  panelHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metricRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: space.sm },
  panelNote: { ...type.dataMuted, marginTop: space.md },

  segments: { flexDirection: 'row', gap: 3, marginTop: space.md },
  segment: { flex: 1, height: 3 },
  segmentDone: { backgroundColor: color.ink },
  segmentQueued: { backgroundColor: color.warnInk },
  segmentEmpty: { backgroundColor: color.line },

  sectionHead: { paddingHorizontal: space.lg, paddingBottom: space.sm },
  section: {
    backgroundColor: color.surface,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: color.line,
    marginBottom: space.lg,
  },
  /* Divider between rows only, never a border on every row. */
  rowDivider: { borderTopWidth: 1, borderTopColor: color.line },
  rowPressed: { backgroundColor: color.sunken },

  readoutRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: space.lg, paddingVertical: space.md,
  },

  stopRow: {
    flexDirection: 'row', alignItems: 'center', gap: space.md,
    paddingHorizontal: space.lg, paddingVertical: space.md,
  },
  stopMain: { flex: 1, gap: 2 },
  stopCode: { ...type.dataMuted, letterSpacing: 0.5 },

  actionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: space.lg, paddingVertical: space.lg,
  },
  chevron: { ...type.dataMuted, fontSize: 16 },

  badge: {
    borderWidth: 1, borderRadius: radius.badge,
    paddingHorizontal: space.sm, paddingVertical: 3,
  },

  empty: { paddingHorizontal: space.lg, paddingVertical: space.xl },
  skeleton: { backgroundColor: color.sunken, borderRadius: radius.surface, marginVertical: 3 },
});
