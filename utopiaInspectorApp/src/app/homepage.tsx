import React, { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated } from "react-native";
import { useRouter, Href } from "expo-router";

const HISTORY = [
  { date: "Sep 4", event: "Full network audit initiated", result: "12 anomalies", flag: true },
  { date: "Sep 3", event: "Detachment sync — Unit 7", result: "Clean", flag: false },
  { date: "Sep 3", event: "Auth policy update deployed", result: "Applied", flag: false },
];

export default function HomepageScreen() {
  const router = useRouter();
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(slideAnim, { toValue: 12, duration: 400, useNativeDriver: true }),
      Animated.delay(3000),
      Animated.timing(slideAnim, { toValue: -100, duration: 400, useNativeDriver: true })
    ]).start();
  }, [slideAnim]);

  return (
    <View style={styles.container}>
      {/* Welcome Notification */}
      <Animated.View style={[styles.welcomeBanner, { transform: [{ translateY: slideAnim }] }]}>
        <Text style={styles.welcomeText}>Welcome back, Inspector</Text>
      </Animated.View>

      {/* Main Content */}
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Alert banner */}
        <View style={styles.alertBanner}>
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
        <View style={styles.grid}>
          {[
            { label: "Digital Audit", sub: "Run full scan", route: "/audit", icon: "◈" },
            { label: "History", sub: "View event log", route: "/history", icon: "≡" },
            { label: "Detachments", sub: "Manage units", route: "/sites", icon: "◉" },
            { label: "Settings", sub: "Configure app", route: "/profile", icon: "⚙" },
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
        <View style={styles.historyContainer}>
          {HISTORY.map((h, i) => (
            <View key={i} style={styles.historyRow}>
              <View style={[styles.historyDot, h.flag ? { backgroundColor: "#fff" } : { backgroundColor: "#333" }]} />
              <Text style={styles.historyEvent} numberOfLines={1}>{h.event}</Text>
              <Text style={styles.historyDate}>{h.date}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
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
});