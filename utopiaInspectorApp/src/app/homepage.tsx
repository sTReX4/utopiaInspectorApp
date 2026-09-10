import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { useDailyRouting } from '@/hooks/use-daily-routing';
import type { RouteStop } from '@/lib/dailyRouting';
import { color, radius, space, type } from '@/constants/tokens';

/**
 * The inspector's primary view.
 *
 * Built around one question, because it is the only one an inspector asks
 * standing in a car park at 13:00: what is left, and which branch is next.
 * The headline figure is therefore what remains, not a completed-over-total
 * fraction, and the next outstanding stop is promoted out of the list into its
 * own block with the action attached to it.
 *
 * Sections stay full bleed on hairlines. Icons carry meaning only: a glyph
 * marks what a row does or what state it is in, never decorates a heading.
 */
export default function HomepageScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { routing, isLoading, isRefreshing, error, retry, refresh } = useDailyRouting();

  const stops = routing?.stops ?? [];
  const total = routing?.totalAssigned ?? 0;
  const completed = routing?.completedToday ?? 0;
  const remaining = Math.max(total - completed, 0);
  const queued = stops.filter((stop) => stop.isPendingSync).length;
  const guardsOnRoute = stops.reduce((sum, stop) => sum + stop.guards.length, 0);

  // The first stop still open is the one the inspector is driving to.
  const nextStop = stops.find((stop) => !stop.isCompletedToday) ?? null;

  return (
    <View style={styles.screen}>
      <ScrollView
        /* Styles go on the content container, not the ScrollView, or the
         * bottom padding is ignored and the last row sits under the system
         * navigation bar. */
        contentContainerStyle={[
          styles.content,
          {
            paddingLeft: insets.left,
            paddingRight: insets.right,
            paddingBottom: insets.bottom + space.xl,
          },
        ]}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={color.ink} />
        }
      >
        {error && stops.length > 0 ? <StaleNotice onRetry={retry} /> : null}

        <StatusPanel
          completed={completed}
          total={total}
          remaining={remaining}
          queued={queued}
          isLoading={isLoading}
          stops={stops}
          servingCache={routing?.source === 'cache'}
        />

        {nextStop ? (
          <NextStop stop={nextStop} onPress={() => router.push('/audit' as any)} />
        ) : null}

        <StatStrip assigned={total} guards={guardsOnRoute} queued={queued} />

        <Section label="Route" count={stops.length}>
          {isLoading ? (
            <RouteSkeleton />
          ) : error && stops.length === 0 ? (
            <RouteFailure message={error} onRetry={retry} />
          ) : stops.length === 0 ? (
            <EmptyRoute />
          ) : (
            stops.map((stop, index) => (
              <StopRow
                key={stop.detachment.id}
                stop={stop}
                index={index + 1}
                isFirst={index === 0}
                onPress={() =>
                  router.push({
                    pathname: '/detachment-list',
                    params: { focus: stop.detachment.branch_code },
                  } as any)
                }
              />
            ))
          )}
        </Section>

        <Section label="Actions">
          <ActionRow
            icon="qr-code-outline"
            label="Start audit"
            hint="Scan a branch code to open its report"
            onPress={() => router.push('/audit' as any)}
            isPrimary
            isFirst
          />
          <ActionRow
            icon="receipt-outline"
            label="Submission history"
            hint="Past audits and receipts"
            onPress={() => router.push('/history' as any)}
          />
        </Section>
      </ScrollView>
    </View>
  );
}

/* --- Status ---------------------------------------------------------------- */

function StatusPanel({
  completed, total, remaining, queued, isLoading, stops, servingCache,
}: {
  completed: number; total: number; remaining: number; queued: number;
  isLoading: boolean; stops: RouteStop[]; servingCache: boolean;
}) {
  const isComplete = total > 0 && remaining === 0;

  return (
    <View style={styles.panel}>
      <View style={styles.panelHead}>
        <Text style={type.label}>Today</Text>
        {servingCache ? (
          <Badge tone="warn" icon="cloud-offline-outline">Offline</Badge>
        ) : null}
      </View>

      {isLoading ? (
        <View style={styles.headlineRow}>
          <View style={[styles.skeleton, { width: 96, height: 40 }]} />
        </View>
      ) : total === 0 ? (
        <View style={styles.headlineRow}>
          <Text style={styles.headlineFlat}>No route today</Text>
        </View>
      ) : isComplete ? (
        <View style={styles.headlineRow}>
          <Ionicons name="checkmark-circle" size={30} color={color.okInk} />
          <Text style={[styles.headlineFlat, { color: color.okInk }]}>Route complete</Text>
        </View>
      ) : (
        /* The number that answers the actual question. Completed over total
         * reads as a score; remaining reads as work. */
        <View style={styles.headlineRow}>
          <Text style={styles.headlineNumber}>{remaining}</Text>
          <View style={styles.headlineMeta}>
            <Text style={type.label}>{remaining === 1 ? 'Stop left' : 'Stops left'}</Text>
            <Text style={type.dataMuted}>{completed} of {total} closed</Text>
          </View>
        </View>
      )}

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

      {total > 0 ? (
        <View style={styles.legend}>
          <LegendKey swatch={color.ink} label={`${Math.max(completed - queued, 0)} closed`} />
          {queued > 0 ? <LegendKey swatch={color.warnInk} label={`${queued} queued`} /> : null}
          <LegendKey swatch={color.line} label={`${remaining} open`} />
        </View>
      ) : (
        <Text style={styles.panelNote}>
          {isLoading ? 'Loading route' : 'Operations has not assigned you a detachment yet.'}
        </Text>
      )}
    </View>
  );
}

function LegendKey({ swatch, label }: { swatch: string; label: string }) {
  return (
    <View style={styles.legendKey}>
      {/* Carries real state, and is the same mark as the bar above it. */}
      <View style={[styles.legendSwatch, { backgroundColor: swatch }]} />
      <Text style={type.dataMuted}>{label}</Text>
    </View>
  );
}

/* --- Next stop -------------------------------------------------------------- */

function NextStop({ stop, onPress }: { stop: RouteStop; onPress: () => void }) {
  const { detachment, guards } = stop;

  return (
    <View style={styles.nextBlock}>
      <View style={styles.nextHead}>
        <Text style={[type.label, { color: color.shellMuted }]}>Next stop</Text>
      </View>

      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Start audit at ${detachment.branch_name}`}
        style={({ pressed }) => [styles.nextRow, pressed && styles.nextRowPressed]}
      >
        <View style={styles.nextMain}>
          <Text style={styles.nextCode}>{detachment.branch_code}</Text>
          <Text style={styles.nextName} numberOfLines={1}>{detachment.branch_name}</Text>
          <Text style={styles.nextMeta} numberOfLines={1}>
            {guards.length} {guards.length === 1 ? 'guard' : 'guards'} posted
            {detachment.branch_location ? `  ${detachment.branch_location}` : ''}
          </Text>
        </View>

        <View style={styles.nextAction}>
          <Ionicons name="qr-code-outline" size={18} color={color.shell} />
          <Text style={styles.nextActionLabel}>Scan</Text>
        </View>
      </Pressable>
    </View>
  );
}

/* --- Stat strip -------------------------------------------------------------- */

function StatStrip({ assigned, guards, queued }: { assigned: number; guards: number; queued: number }) {
  return (
    <View style={styles.strip}>
      <Stat icon="business-outline" value={assigned} label="Assigned" />
      <View style={styles.stripDivider} />
      <Stat icon="people-outline" value={guards} label="Guards" />
      {queued > 0 ? (
        <>
          <View style={styles.stripDivider} />
          <Stat icon="cloud-upload-outline" value={queued} label="Queued" tone="warn" />
        </>
      ) : null}
    </View>
  );
}

function Stat({
  icon, value, label, tone,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  value: number; label: string; tone?: 'warn';
}) {
  const tint = tone === 'warn' ? color.warnInk : color.ink;

  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={14} color={color.inkMuted} />
      <Text style={[styles.statValue, { color: tint }]}>{value}</Text>
      <Text style={type.label}>{label}</Text>
    </View>
  );
}

/* --- Route ---------------------------------------------------------------- */

function StopRow({
  stop, index, isFirst, onPress,
}: {
  stop: RouteStop; index: number; isFirst: boolean; onPress: () => void;
}) {
  const { detachment, guards, isCompletedToday, isPendingSync } = stop;

  const state = isPendingSync
    ? { icon: 'cloud-upload-outline' as const, tint: color.warnInk, label: 'Queued' }
    : isCompletedToday
      ? { icon: 'checkmark-circle' as const, tint: color.okInk, label: 'Closed' }
      : { icon: 'ellipse-outline' as const, tint: color.inkMuted, label: 'Open' };

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Stop ${index}, ${detachment.branch_name}, ${state.label}`}
      /* Instant state change, no timing curve. Feedback on a field device
       * should land before the finger lifts. */
      style={({ pressed }) => [
        styles.stopRow,
        !isFirst && styles.rowDivider,
        pressed && styles.rowPressed,
      ]}
    >
      {/* Position on the route, so an inspector can say "I am on four of six"
        * without counting rows. */}
      <View style={styles.stopIndex}>
        <Text style={styles.stopIndexText}>{index}</Text>
      </View>

      <View style={styles.stopMain}>
        <Text style={styles.stopCode}>{detachment.branch_code}</Text>
        <Text style={type.title} numberOfLines={1}>{detachment.branch_name}</Text>
        <Text style={type.dataMuted} numberOfLines={1}>
          {guards.length} {guards.length === 1 ? 'guard' : 'guards'} posted
          {detachment.branch_location ? `  ${detachment.branch_location}` : ''}
        </Text>
      </View>

      <View style={styles.stopState}>
        <Ionicons name={state.icon} size={16} color={state.tint} />
        <Ionicons name="chevron-forward" size={16} color={color.lineStrong} />
      </View>
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
          <View style={[styles.skeleton, { width: 22, height: 22 }]} />
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
      <Ionicons name="map-outline" size={22} color={color.lineStrong} />
      <Text style={[type.title, { marginTop: space.sm }]}>No stops assigned</Text>
      <Text style={[type.body, { marginTop: space.xs }]}>
        Operations assigns detachments from the console. Pull down to refresh once they do.
      </Text>
    </View>
  );
}

/* --- Failure -------------------------------------------------------------- */

/**
 * Shown when the route could not be read and there is nothing cached to fall
 * back on.
 *
 * Deliberately not worded like EmptyRoute. "No stops assigned" is a statement
 * about operations; this is a statement about the device. An inspector who
 * reads the wrong one stands down for a day they were rostered to work.
 */
function RouteFailure({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.failure}>
      <View style={styles.failureHead}>
        <Ionicons name="alert-circle" size={16} color={color.dangerInk} />
        <Text style={[type.label, { color: color.dangerInk }]}>Route unavailable</Text>
      </View>
      <Text style={[type.title, { marginTop: space.xs }]}>{message}</Text>
      <Text style={[type.body, { marginTop: space.xs }]}>
        Your assignments could not be read from local storage. Retry, or sign out and back in if it
        keeps failing.
      </Text>
      <RetryButton onRetry={onRetry} />
    </View>
  );
}

/** The stops on screen are the last good read, so say so rather than hide it. */
function StaleNotice({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.stale}>
      <Ionicons name="alert-circle" size={16} color={color.dangerInk} />
      <View style={{ flex: 1 }}>
        <Text style={[type.label, { color: color.dangerInk }]}>Last refresh failed</Text>
        <Text style={[type.dataMuted, { marginTop: 2 }]}>Showing your last known route.</Text>
      </View>
      <RetryButton onRetry={onRetry} compact />
    </View>
  );
}

function RetryButton({ onRetry, compact }: { onRetry: () => void; compact?: boolean }) {
  return (
    <Pressable
      onPress={onRetry}
      accessibilityRole="button"
      accessibilityLabel="Retry loading route"
      style={({ pressed }) => [
        styles.retry,
        compact ? styles.retryCompact : { marginTop: space.md },
        pressed && styles.retryPressed,
      ]}
    >
      {({ pressed }) => (
        <Text style={[styles.retryLabel, pressed && { color: color.surface }]}>Retry</Text>
      )}
    </Pressable>
  );
}

/* --- Actions -------------------------------------------------------------- */

function ActionRow({
  icon, label, hint, onPress, isPrimary, isFirst,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string; hint: string; onPress: () => void;
  isPrimary?: boolean; isFirst?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}. ${hint}`}
      style={({ pressed }) => [styles.actionRow, !isFirst && styles.rowDivider, pressed && styles.rowPressed]}
    >
      {/* A bordered glyph chip reads as a control. The bare chevron the row
        * used to carry did not look pressable at all. */}
      <View style={[styles.actionIcon, isPrimary && styles.actionIconPrimary]}>
        <Ionicons name={icon} size={18} color={isPrimary ? color.surface : color.ink} />
      </View>

      <View style={styles.actionMain}>
        <Text style={type.title}>{label}</Text>
        <Text style={type.dataMuted}>{hint}</Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color={color.lineStrong} />
    </Pressable>
  );
}

/* --- Primitives ----------------------------------------------------------- */

function Section({ label, count, children }: { label: string; count?: number; children: React.ReactNode }) {
  return (
    <View>
      <View style={styles.sectionHead}>
        <Text style={type.label}>{label}</Text>
        {count !== undefined ? <Text style={styles.sectionCount}>{count}</Text> : null}
      </View>
      <View style={styles.section}>{children}</View>
    </View>
  );
}

function Badge({
  tone, icon, children,
}: {
  tone: 'ok' | 'warn' | 'idle';
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  children: React.ReactNode;
}) {
  const tones = {
    ok: { backgroundColor: color.okBg, borderColor: color.okInk, color: color.okInk },
    warn: { backgroundColor: color.warnBg, borderColor: color.warnInk, color: color.warnInk },
    idle: { backgroundColor: color.sunken, borderColor: color.lineStrong, color: color.inkMuted },
  }[tone];

  return (
    <View style={[styles.badge, { backgroundColor: tones.backgroundColor, borderColor: tones.borderColor }]}>
      {icon ? <Ionicons name={icon} size={11} color={tones.color} /> : null}
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
  },
  panelHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  panelNote: { ...type.dataMuted, marginTop: space.md },

  headlineRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginTop: space.sm },
  headlineNumber: { ...type.metric, fontSize: 44, lineHeight: 48 },
  headlineFlat: { ...type.title, fontSize: 22 },
  headlineMeta: { gap: 2 },

  segments: { flexDirection: 'row', gap: 3, marginTop: space.lg },
  segment: { flex: 1, height: 4 },
  segmentDone: { backgroundColor: color.ink },
  segmentQueued: { backgroundColor: color.warnInk },
  segmentEmpty: { backgroundColor: color.line },

  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md, marginTop: space.sm },
  legendKey: { flexDirection: 'row', alignItems: 'center', gap: space.xs + 2 },
  legendSwatch: { width: 8, height: 8 },

  /* The one dark block in the body. It marks the single row that is an
   * instruction rather than a readout. */
  nextBlock: { backgroundColor: color.shell, marginTop: space.lg },
  nextHead: { paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.xs },
  nextRow: {
    flexDirection: 'row', alignItems: 'center', gap: space.md,
    paddingHorizontal: space.lg, paddingBottom: space.lg, paddingTop: space.xs,
  },
  nextRowPressed: { backgroundColor: color.shellHover },
  nextMain: { flex: 1, gap: 2 },
  nextCode: { ...type.dataMuted, color: color.shellMuted, letterSpacing: 0.5, textTransform: 'uppercase' },
  nextName: { ...type.title, color: color.shellInk, fontSize: 17 },
  nextMeta: { ...type.dataMuted, color: color.shellMuted },
  nextAction: {
    alignItems: 'center', gap: 2,
    backgroundColor: color.shellInk, borderRadius: radius.control,
    paddingHorizontal: space.md, paddingVertical: space.sm,
  },
  nextActionLabel: { ...type.badge, color: color.shell, fontSize: 9 },

  strip: {
    flexDirection: 'row',
    backgroundColor: color.surface,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: color.line,
    marginTop: space.lg,
  },
  stat: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: space.md },
  statValue: { ...type.metric, fontSize: 22, lineHeight: 26 },
  stripDivider: { width: 1, backgroundColor: color.line },

  sectionHead: {
    flexDirection: 'row', alignItems: 'center', gap: space.sm,
    paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: space.sm,
  },
  sectionCount: { ...type.dataMuted },
  section: {
    backgroundColor: color.surface,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: color.line,
  },
  /* Divider between rows only, never a border on every row. */
  rowDivider: { borderTopWidth: 1, borderTopColor: color.line },
  rowPressed: { backgroundColor: color.sunken },

  stopRow: {
    flexDirection: 'row', alignItems: 'center', gap: space.md,
    paddingHorizontal: space.lg, paddingVertical: space.md,
  },
  stopIndex: {
    width: 22, height: 22, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: color.line, backgroundColor: color.sunken,
  },
  stopIndexText: { ...type.data, fontSize: 11 },
  stopMain: { flex: 1, gap: 2 },
  stopCode: { ...type.dataMuted, letterSpacing: 0.5, textTransform: 'uppercase' },
  stopState: { flexDirection: 'row', alignItems: 'center', gap: space.xs },

  actionRow: {
    flexDirection: 'row', alignItems: 'center', gap: space.md,
    paddingHorizontal: space.lg, paddingVertical: space.md,
  },
  actionIcon: {
    width: 38, height: 38, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: color.lineStrong, backgroundColor: color.surface,
  },
  actionIconPrimary: { backgroundColor: color.ink, borderColor: color.ink },
  actionMain: { flex: 1, gap: 2 },

  badge: {
    flexDirection: 'row', alignItems: 'center', gap: space.xs,
    borderWidth: 1, borderRadius: radius.badge,
    paddingHorizontal: space.sm, paddingVertical: 3,
  },

  empty: { paddingHorizontal: space.lg, paddingVertical: space.xl },

  failure: {
    backgroundColor: color.dangerBg,
    paddingHorizontal: space.lg, paddingVertical: space.lg,
    alignItems: 'flex-start',
  },
  failureHead: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  stale: {
    flexDirection: 'row', alignItems: 'center', gap: space.md,
    backgroundColor: color.dangerBg,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: color.dangerInk,
    paddingHorizontal: space.lg, paddingVertical: space.sm,
    marginBottom: space.lg,
  },

  retry: {
    borderWidth: 1, borderColor: color.dangerInk, borderRadius: radius.control,
    paddingHorizontal: space.md, paddingVertical: space.sm,
  },
  retryCompact: { paddingVertical: space.xs },
  /* Instant, no timing curve. Field feedback lands before the finger lifts. */
  retryPressed: { backgroundColor: color.dangerInk },
  retryLabel: { ...type.badge, color: color.dangerInk, fontSize: 11 },

  skeleton: { backgroundColor: color.sunken, borderRadius: radius.surface, marginVertical: 3 },
});
