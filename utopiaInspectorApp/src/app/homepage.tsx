import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated } from "react-native";
import { useRouter, Href } from "expo-router";
import { useDailyRouting } from '@/hooks/use-daily-routing';

const HISTORY = [
  { date: "Sep 4", event: "Full network audit initiated", result: "12 anomalies", flag: true },
  { date: "Sep 3", event: "Detachment sync — Unit 7", result: "Clean", flag: false },
  { date: "Sep 3", event: "Auth policy update deployed", result: "Applied", flag: false },
];

const TUTORIAL_STEPS = [
  { title: "Status & Alerts", text: "Monitor ongoing audits and system anomalies in real-time." },
  { title: "Quick Actions", text: "Your main navigation hub. Start audits, check history, or manage units here." },
  { title: "Recent Activity", text: "Track the latest system events and deployment syncs at a glance." }
];

export default function HomepageScreen() {
  const router = useRouter();
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const [tutorialStep, setTutorialStep] = useState(0); 

  /* Today's route, keyed on the inspectors row id rather than the auth id and
   * counting queued offline audits alongside synced ones. */
  const { routing, isLoading } = useDailyRouting();

  const totalAssigned = routing?.totalAssigned ?? 0;
  const completedToday = routing?.completedToday ?? 0;
  const remaining = Math.max(totalAssigned - completedToday, 0);
  const progressPercent = totalAssigned > 0 ? Math.round((completedToday / totalAssigned) * 100) : 0;
  const pendingSyncCount = routing?.stops.filter((stop) => stop.isPendingSync).length ?? 0;
  const isServingCache = routing?.source === 'cache';

  const stats = {
    detachments: totalAssigned.toString(),
    progress: `${progressPercent}%`,
    status: `${completedToday}/${totalAssigned}`,
  };

  useEffect(() => {
    Animated.sequence([
      Animated.timing(slideAnim, { toValue: 12, duration: 400, useNativeDriver: true }),
      Animated.delay(3000),
      Animated.timing(slideAnim, { toValue: -100, duration: 400, useNativeDriver: true })
    ]).start();
  }, [slideAnim]);

  const handleNextStep = () => {
    if (tutorialStep < TUTORIAL_STEPS.length) {
      setTutorialStep(tutorialStep + 1);
    } else {
      setTutorialStep(0); 
    }
  };

  return (
    <View style={styles.container}>
      {/* Welcome Notification */}
      <Animated.View style={[styles.welcomeBanner, { transform: [{ translateY: slideAnim }] }]}>
        <Text style={styles.welcomeText}>Welcome back, Inspector</Text>
        <TouchableOpacity onPress={() => setTutorialStep(1)} style={{ marginTop: 4 }}>
          <Text style={{ color: '#c9a84c', fontSize: 10 }}>Start Tour</Text>
        </TouchableOpacity>
      </Animated.View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* --- Daily Progress: the day's headline number --- */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push('/detachment-list')}
        >
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Daily Progress</Text>
              {isServingCache ? (
                <Text style={styles.progressOffline}>OFFLINE</Text>
              ) : null}
            </View>

            <View style={styles.progressFigureRow}>
              <Text style={styles.progressFigure}>
                {isLoading ? '—' : completedToday}
                <Text style={styles.progressFigureTotal}>{isLoading ? '' : ` / ${totalAssigned}`}</Text>
              </Text>
              <Text style={styles.progressPercent}>{isLoading ? '' : `${progressPercent}%`}</Text>
            </View>

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
            </View>

            <Text style={styles.progressCaption}>
              {isLoading
                ? 'Loading your route…'
                : totalAssigned === 0
                  ? 'No detachments assigned to you yet'
                  : remaining === 0
                    ? 'Route complete — every detachment inspected today'
                    : `${remaining} detachment${remaining === 1 ? '' : 's'} left to inspect today`}
            </Text>

            {pendingSyncCount > 0 ? (
              <Text style={styles.progressPending}>
                {pendingSyncCount} counted from the offline queue, not yet synced
              </Text>
            ) : null}
          </View>
        </TouchableOpacity>

        {/* --- Detachment Alert --- */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/detachment-list')}
        >
          <View style={[
            styles.alertBanner,
            totalAssigned > 0 ? styles.alertBannerActive : styles.alertBannerInactive,
            tutorialStep === 1 && styles.highlightedElement
          ]}>
            <View style={[
              styles.pulseDot,
              totalAssigned > 0 ? styles.pulseDotActive : styles.pulseDotInactive
            ]} />

            <View style={{ flex: 1 }}>
              <Text style={[
                styles.alertTitle,
                totalAssigned > 0 && { color: '#ef4444' } // Red title text when active
              ]}>
                Detachment Alert
              </Text>
              <Text style={styles.alertSub}>
                {totalAssigned > 0
                  ? `Notice: You have ${totalAssigned} assigned detachment(s)`
                  : `No pending assignments`}
              </Text>
            </View>

            <Text style={{ color: '#555', fontSize: 18 }}>›</Text>
          </View>
        </TouchableOpacity>
        {/* --- STEP 3B: Updated Stat Row --- */}
        <View style={styles.statRow}>
          {[
            { label: "Detachments", value: stats.detachments },
            { label: "Progress", value: stats.progress },
            { label: "Status", value: stats.status },
          ].map((s, idx) => (
            <View key={s.label} style={[styles.statBox, idx === 1 && { marginHorizontal: 1 }]}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Quick actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={[styles.grid, tutorialStep === 2 && styles.highlightedElement]}>
          {[
            { label: "Digital Audit", sub: "Run full scan", route: "/audit", icon: "◈" },
            { label: "History", sub: "View event log", route: "/history", icon: "≡" },
          ].map((a) => (
            <TouchableOpacity
              key={a.label}
              style={styles.actionCard}
              onPress={() => router.push(a.route as Href)}
              activeOpacity={0.7}
            >
              <Text style={styles.actionIcon}>{a.icon}</Text>
              <View>
                <Text style={styles.actionTitle}>{a.label}</Text>
                <Text style={styles.actionSub}>{a.sub}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent activity */}
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={[styles.historyContainer, tutorialStep === 3 && styles.highlightedElement]}>
          {HISTORY.map((h, i) => (
            <View key={i} style={styles.historyRow}>
              <View style={[styles.historyDot, h.flag ? { backgroundColor: "#fff" } : { backgroundColor: "#333" }]} />
              <Text style={styles.historyEvent} numberOfLines={1}>{h.event}</Text>
              <Text style={styles.historyDate}>{h.date}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Tutorial Overlay */}
      {tutorialStep > 0 && (
        <View style={styles.tutorialOverlay}>
          <View style={styles.tutorialBox}>
            <Text style={styles.tutorialStepText}>Step {tutorialStep} of {TUTORIAL_STEPS.length}</Text>
            <Text style={styles.tutorialTitle}>{TUTORIAL_STEPS[tutorialStep - 1].title}</Text>
            <Text style={styles.tutorialDesc}>{TUTORIAL_STEPS[tutorialStep - 1].text}</Text>
            
            <TouchableOpacity style={styles.tutorialButton} onPress={handleNextStep}>
              <Text style={styles.tutorialButtonText}>
                {tutorialStep === TUTORIAL_STEPS.length ? "Finish Tour" : "Next"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050505" },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 10 },
  
  welcomeBanner: {
    position: 'absolute', left: 20, right: 20, zIndex: 50,
    backgroundColor: '#111', borderColor: '#333', borderWidth: 1,
    borderRadius: 8, padding: 12, alignItems: 'center'
  },
  welcomeText: { color: '#e8e8e8', fontSize: 13, fontWeight: '500' },

  progressCard: {
    backgroundColor: '#111', borderWidth: 1, borderColor: '#1e1e1e',
    padding: 18, marginBottom: 14
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  progressLabel: {
    fontSize: 10, textTransform: 'uppercase', letterSpacing: 2,
    color: '#555', fontFamily: 'monospace'
  },
  progressOffline: {
    fontSize: 9, letterSpacing: 1.5, color: '#c9a84c', fontFamily: 'monospace',
    borderWidth: 1, borderColor: '#3a3121', paddingHorizontal: 6, paddingVertical: 2
  },
  progressFigureRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  progressFigure: { fontSize: 44, fontWeight: '700', color: '#e8e8e8', letterSpacing: -1 },
  progressFigureTotal: { fontSize: 24, fontWeight: '500', color: '#555' },
  progressPercent: { fontSize: 15, fontWeight: '600', color: '#c9a84c', fontFamily: 'monospace' },
  progressTrack: { height: 4, backgroundColor: '#1e1e1e', marginTop: 14, marginBottom: 10 },
  progressFill: { height: 4, backgroundColor: '#c9a84c' },
  progressCaption: { fontSize: 11, color: '#777', fontFamily: 'monospace' },
  progressPending: { fontSize: 10, color: '#c9a84c', fontFamily: 'monospace', marginTop: 6 },

  alertBanner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#111',
    borderLeftWidth: 2, padding: 14, marginBottom: 20
  },
  alertBannerActive: {
    borderLeftColor: '#ef4444', // Red border
    shadowColor: '#ef4444', // Red glow
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8, // Required for Android glow
  },
  alertBannerInactive: {
    borderLeftColor: '#333', // Dull border when no assignments
  },
  pulseDot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  pulseDotActive: { backgroundColor: '#ef4444' }, // Red dot
  pulseDotInactive: { backgroundColor: '#333' }, // Dull dot
  alertTitle: { fontSize: 13, fontWeight: '500', color: '#e8e8e8' },
  alertSub: { fontSize: 11, color: '#555', fontFamily: 'monospace', marginTop: 4 },

  statRow: { flexDirection: 'row', backgroundColor: '#1a1a1a', marginBottom: 24 },
  statBox: { flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', paddingVertical: 18 },
  statValue: { fontSize: 22, fontWeight: '600', color: '#e8e8e8', marginBottom: 6 },
  statLabel: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, color: '#555', fontFamily: 'monospace' },

  sectionTitle: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, color: '#555', fontFamily: 'monospace', marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 28 },
  actionCard: { 
    width: '48%', backgroundColor: '#111', borderWidth: 1, borderColor: '#1e1e1e', 
    padding: 16, marginBottom: 12, justifyContent: 'space-between', minHeight: 110 
  },
  actionIcon: { fontSize: 20, color: '#555', marginBottom: 16 },
  actionTitle: { fontSize: 14, fontWeight: '500', color: '#e8e8e8' },
  actionSub: { fontSize: 11, color: '#555', fontFamily: 'monospace', marginTop: 4 },

  historyContainer: { backgroundColor: '#111' },
  historyRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  historyDot: { width: 6, height: 6, borderRadius: 3, marginRight: 12 },
  historyEvent: { flex: 1, fontSize: 13, color: '#e8e8e8', marginRight: 12 },
  historyDate: { fontSize: 11, color: '#555', fontFamily: 'monospace' },

  tutorialOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    zIndex: 100, justifyContent: 'flex-end', padding: 20, paddingBottom: 60,
  },
  tutorialBox: {
    backgroundColor: '#111', borderColor: '#333', borderWidth: 1,
    borderRadius: 8, padding: 24,
  },
  tutorialStepText: { fontSize: 10, color: '#c9a84c', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 },
  tutorialTitle: { fontSize: 18, fontWeight: '600', color: '#e8e8e8', marginBottom: 8 },
  tutorialDesc: { fontSize: 13, color: '#888', lineHeight: 20, marginBottom: 20 },
  tutorialButton: { backgroundColor: '#fff', paddingVertical: 12, borderRadius: 4, alignItems: 'center' },
  tutorialButtonText: { color: '#000', fontSize: 14, fontWeight: '600' },
  
  highlightedElement: {
    borderColor: '#c9a84c',
    borderWidth: 1,
    zIndex: 101, 
    backgroundColor: '#1a1a1a'
  }
});