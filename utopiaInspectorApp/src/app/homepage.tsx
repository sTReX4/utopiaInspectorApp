import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated } from "react-native";
import { useRouter, Href } from "expo-router";

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
  
  // Set to 1 to auto-start the tutorial on first load, or trigger via a button
  const [tutorialStep, setTutorialStep] = useState(0); 

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
      setTutorialStep(0); // End tutorial
    }
  };

  return (
    <View style={styles.container}>
      {/* Welcome Notification */}
      <Animated.View style={[styles.welcomeBanner, { transform: [{ translateY: slideAnim }] }]}>
        <Text style={styles.welcomeText}>Welcome back, Inspector</Text>
        {/* Hidden button to manually trigger tutorial for testing */}
        <TouchableOpacity onPress={() => setTutorialStep(1)} style={{ marginTop: 4 }}>
          <Text style={{ color: '#c9a84c', fontSize: 10 }}>Start Tour</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Main Content */}
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Alert banner */}
        <View style={[styles.alertBanner, tutorialStep === 1 && styles.highlightedElement]}>
          <View style={styles.pulseDot} />
          <View style={{ flex: 1 }}>
            <Text style={styles.alertTitle}>Active audit in progress</Text>
            <Text style={styles.alertSub}>AUD-2847 · 02:14:33</Text>
          </View>
          <Text style={{ color: '#555', fontSize: 18 }}>›</Text>
        </View>

        {/* Stat row */}
        <View style={styles.statRow}>
          {[
            { label: "Audits", value: "3" },
            { label: "Blocked", value: "147" },
            { label: "Score", value: "94%" },
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
            { label: "Detachments", sub: "Manage units", route: "/sites", icon: "◉" },
            { label: "Escalations", sub: "Configure app", route: "/escalations", icon: "!" },
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

  alertBanner: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', 
    borderLeftWidth: 2, borderLeftColor: '#e8e8e8', padding: 14, marginBottom: 20 
  },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff', marginRight: 12 },
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

  // Tutorial Styles
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
  
  // Highlight currently active tutorial element
  highlightedElement: {
    borderColor: '#c9a84c',
    borderWidth: 1,
    zIndex: 101, // brings element above the overlay slightly if combined with precise absolute positioning
    backgroundColor: '#1a1a1a'
  }
});