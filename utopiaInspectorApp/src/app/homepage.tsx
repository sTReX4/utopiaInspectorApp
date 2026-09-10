import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated } from "react-native";
import { useRouter, Href, useFocusEffect } from "expo-router";
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

const TUTORIAL_STEPS = [
  { title: "Status & Alerts", text: "Monitor ongoing audits and system anomalies in real-time." },
  { title: "Quick Actions", text: "Your main navigation hub. Start audits, check history, or manage units here." },
  { title: "Recent Activity", text: "Track the latest system events and deployment syncs at a glance." }
];

export default function HomepageScreen() {
  const router = useRouter();
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const [tutorialStep, setTutorialStep] = useState(0); 

  // --- States for Deployment & Stats ---
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [assignedSites, setAssignedSites] = useState<any[]>([]);
  const [activeSite, setActiveSite] = useState<any>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [stats, setStats] = useState({
    detachments: "0",
    progress: "0%",
    status: "0/0"
  });

  // --- New States for Daily Progress ---
  const [isLoading, setIsLoading] = useState(true);
  const [isServingCache, setIsServingCache] = useState(false);
  const [completedToday, setCompletedToday] = useState(0);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [progressPercentNum, setProgressPercentNum] = useState(0);

  // --- Fetch Logic ---
  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;

      const fetchDashboardData = async () => {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        console.log("MOBILE APP USER ID:", user.id);

        // 1. Get all assigned detachments
        const { data: sites } = await supabase
          .from('detachments')
          .select('*')
          .eq('assigned_inspector_id', user.id)
          .eq('is_active', true);

        const safeSites = sites || [];
        if (isActive) setAssignedSites(safeSites);

        // Auto-select the first site if none is selected
        const currentActiveSite = activeSite || (safeSites.length > 0 ? safeSites[0] : null);
        if (isActive && !activeSite && safeSites.length > 0) {
          setActiveSite(safeSites[0]);
        }

        // 2. Calculate Stats
        const totalDetachments = safeSites.length;
        let guardsCount = 0;
        let auditsCount = 0;
        let calculatedProgress = 0;

        const today = new Date().toISOString().split('T')[0];

        // Fetch all audits submitted by this inspector today for progress calculation
        const { data: todayAudits } = await supabase
          .from('audits') 
          .select('branch_name') 
          .eq('inspector_id', user.id)
          .gte('created_at', `${today}T00:00:00Z`);

        const safeAudits = todayAudits || [];

        // Progress Calculation: Percentage of detachments audited today
        const auditedBranchNames = new Set(safeAudits.map(a => a.branch_name));
        const auditedDetachmentsCount = safeSites.filter(s => auditedBranchNames.has(s.branch_name)).length;

        if (isActive) setCompletedToday(auditedDetachmentsCount);

        if (totalDetachments > 0) {
          calculatedProgress = Math.round((auditedDetachmentsCount / totalDetachments) * 100);
        }

        if (isActive) setProgressPercentNum(calculatedProgress);

        // Status Calculation: Guard vs Audit ratio for the CURRENT deployment
        if (currentActiveSite) {
          const { count: gCount } = await supabase
            .from('guards')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_branch', currentActiveSite.branch_name)
            .eq('is_active', true);
          
          guardsCount = gCount || 0;
          auditsCount = safeAudits.filter(a => a.branch_name === currentActiveSite.branch_name).length;
        }

        // 3. Fetch GLOBAL Recent Activity (Live Feed of all records)
        // Notice we removed the `.eq('inspector_id', user.id)` so it fetches everything!
        const { data: historyData } = await supabase
          .from('audits') 
          .select('branch_name, created_at, status') 
          .order('created_at', { ascending: false })
          .limit(5); // Increased to 5 to make the feed look more active

        if (isActive && historyData) {
          const formattedHistory = historyData.map((item) => {
            const dateObj = new Date(item.created_at);
            return {
              date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              event: `Audit submitted — ${item.branch_name}`,
              flag: item.status === 'flagged', 
            };
          });
          setRecentActivity(formattedHistory);
        }

        if (isActive) {
          setStats({
            detachments: totalDetachments.toString(),
            progress: `${calculatedProgress}%`,
            status: `${auditsCount}/${guardsCount}`
          });
          setIsLoading(false);
        }
      };

      fetchDashboardData();

      return () => { isActive = false; };
    }, [activeSite]) 
  );

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

  // --- UI Calculations ---
  const totalAssigned = assignedSites.length;
  const remaining = Math.max(0, totalAssigned - completedToday);

  return (
    <View style={styles.container}>
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
              <Text style={styles.progressPercent}>{isLoading ? '' : `${progressPercentNum}%`}</Text>
            </View>

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressPercentNum}%` }]} />
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
          onPress={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <View style={[
            styles.alertBanner,
            totalAssigned > 0 ? styles.alertBannerActive : styles.alertBannerInactive,
            isDropdownOpen && styles.alertBannerOpen,
            tutorialStep === 1 && styles.highlightedElement
          ]}>
            <View style={[
              styles.pulseDot,
              totalAssigned > 0 ? styles.pulseDotActive : styles.pulseDotInactive
            ]} />

            <View style={{ flex: 1 }}>
              <Text style={[
                styles.alertTitle,
                totalAssigned > 0 && { color: '#ef4444' } 
              ]}>
                {activeSite ? activeSite.branch_code : 'Detachment Alert'}
              </Text>
              <Text style={styles.alertSub}>
                {activeSite 
                  ? activeSite.branch_location
                  : 'No pending assignments'}
              </Text>
            </View>

            <Ionicons 
              name={isDropdownOpen ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={assignedSites.length > 0 ? "#ef4444" : "#555"} 
            />
          </View>
        </TouchableOpacity>

        {/* --- Dropdown Menu for Switching Sites --- */}
        {isDropdownOpen && assignedSites.length > 0 && (
          <View style={styles.dropdownContainer}>
            <Text style={styles.dropdownHeader}>Switch Active Detachment:</Text>
            {assignedSites.map(site => (
              <TouchableOpacity 
                key={site.id} 
                style={[styles.dropdownItem, activeSite?.id === site.id && styles.dropdownItemActive]}
                onPress={() => {
                  setActiveSite(site);
                  setIsDropdownOpen(false);
                }}
              >
                <Text style={[styles.dropdownItemText, activeSite?.id === site.id && { color: '#c9a84c' }]}>
                  {site.branch_name} <Text style={{color: '#555'}}>({site.branch_code})</Text>
                </Text>
                {activeSite?.id === site.id && <Ionicons name="checkmark" size={16} color="#c9a84c" />}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* --- Stat Row --- */}
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
        <Text style={styles.sectionTitle}>Live Feed: All Records</Text>
        <View style={[styles.historyContainer, tutorialStep === 3 && styles.highlightedElement]}>
          {recentActivity.length > 0 ? (
            recentActivity.map((h, i) => (
              <View key={i} style={styles.historyRow}>
                <View style={[styles.historyDot, h.flag ? { backgroundColor: "#ef4444" } : { backgroundColor: "#159a83" }]} />
                <Text style={styles.historyEvent} numberOfLines={1}>{h.event}</Text>
                <Text style={styles.historyDate}>{h.date}</Text>
              </View>
            ))
          ) : (
            <View style={{ padding: 16, alignItems: 'center' }}>
              <Text style={{ color: '#555', fontSize: 12, fontFamily: 'monospace' }}>NO RECENT ACTIVITY</Text>
            </View>
          )}
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
  alertBannerOpen: {
    marginBottom: 0, 
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  alertBannerActive: {
    borderLeftColor: '#ef4444', 
    shadowColor: '#ef4444', 
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8, 
  },
  alertBannerInactive: { borderLeftColor: '#333' },
  pulseDot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  pulseDotActive: { backgroundColor: '#ef4444' },
  pulseDotInactive: { backgroundColor: '#333' },
  alertTitle: { fontSize: 13, fontWeight: '500', color: '#e8e8e8' },
  alertSub: { fontSize: 11, color: '#555', fontFamily: 'monospace', marginTop: 4 },

  // Dropdown Styles
  dropdownContainer: { 
    backgroundColor: '#0a0a0a', 
    borderWidth: 1, 
    borderColor: '#1e1e1e', 
    borderTopWidth: 0, 
    borderBottomLeftRadius: 8, 
    borderBottomRightRadius: 8, 
    marginBottom: 20, 
    padding: 8, 
    zIndex: 10 
  },
  dropdownHeader: { fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginLeft: 8, marginTop: 4, fontFamily: 'monospace' },
  dropdownItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 4, marginBottom: 2 },
  dropdownItemActive: { backgroundColor: '#111', borderColor: '#1e1e1e', borderWidth: 1 },
  dropdownItemText: { fontSize: 13, color: '#888', fontWeight: '500' },

  statRow: { flexDirection: 'row', backgroundColor: '#1a1a1a', marginBottom: 24 },
  statBox: { flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', paddingVertical: 18 },
  statValue: { fontSize: 22, fontWeight: '600', color: '#e8e8e8', marginBottom: 6 },
  statLabel: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, color: '#555', fontFamily: 'monospace' },

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