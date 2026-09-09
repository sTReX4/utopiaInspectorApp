import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../lib/supabase';
import { getInspectorId } from '../lib/inspectorAccount';

export default function ProfileScreen() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string>('Loading...');
  const [userName, setUserName] = useState<string>('Inspector');
  const [lastSignIn, setLastSignIn] = useState<string>('Unknown');
  const [metrics, setMetrics] = useState({ assignments: 0, audits: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      const fetchProfileData = async () => {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          setUserEmail(user.email || 'No email provided');
          setUserName(user.user_metadata?.full_name || 'Utopia Inspector');
          
          if (user.last_sign_in_at) {
            setLastSignIn(new Date(user.last_sign_in_at).toLocaleString());
          }

          /* Both columns are foreign keys to inspectors.id, which is not the
           * auth id these queries used to pass. */
          const inspectorId = await getInspectorId();

          if (inspectorId) {
            const { count: assignmentCount } = await supabase
              .from('detachments')
              .select('*', { count: 'exact', head: true })
              .eq('assigned_inspector_id', inspectorId);

            const { count: auditCount } = await supabase
              .from('audits')
              .select('*', { count: 'exact', head: true })
              .eq('inspector_id', inspectorId);

            setMetrics({
              assignments: assignmentCount || 0,
              audits: auditCount || 0
            });
          }
        }
        setIsLoading(false);
      };

      fetchProfileData();
    }, [])
  );

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      router.replace('/login');
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#0f172a" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      
      {/* Profile Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.avatarContainer}>
          <Image 
            source={{ uri: 'https://via.placeholder.com/100' }} 
            style={styles.avatar} 
          />
        </View>
        <Text style={styles.name}>{userName}</Text>
        <Text style={styles.email}>{userEmail}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>FIELD INSPECTOR</Text>
        </View>
      </View>

      {/* Operational Metrics */}
      <View style={styles.metricsContainer}>
        <View style={styles.metricBox}>
          <Text style={styles.metricValue}>{metrics.assignments}</Text>
          <Text style={styles.metricLabel}>Active{'\n'}Deployments</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricBox}>
          <Text style={styles.metricValue}>{metrics.audits}</Text>
          <Text style={styles.metricLabel}>Total{'\n'}Audits</Text>
        </View>
      </View>

      {/* Security & Authentication */}
      <Text style={styles.sectionTitle}>Security & Access</Text>
      <View style={styles.sectionGroup}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Last Login</Text>
          <Text style={styles.infoValue}>{lastSignIn}</Text>
        </View>
        <View style={styles.separator} />
        <TouchableOpacity style={styles.rowItem} onPress={() => Alert.alert('Feature', 'Change Password screen goes here')}>
          <Text style={styles.rowText}>Change Password</Text>
          <Text style={styles.rowChevron}>›</Text>
        </TouchableOpacity>
        <View style={styles.separator} />
        <TouchableOpacity style={styles.rowItem} onPress={() => Alert.alert('Feature', 'MFA Setup goes here')}>
          <Text style={styles.rowText}>Two-Factor Authentication</Text>
          <Text style={styles.statusBadge}>Disabled</Text>
        </TouchableOpacity>
      </View>

      {/* App Preferences */}
      <Text style={styles.sectionTitle}>App Preferences</Text>
      <View style={styles.sectionGroup}>
        <TouchableOpacity style={styles.rowItem} onPress={() => Alert.alert('Feature', 'Notification toggles go here')}>
          <Text style={styles.rowText}>Push Notifications</Text>
          <Text style={styles.rowChevron}>›</Text>
        </TouchableOpacity>
        <View style={styles.separator} />
        <TouchableOpacity style={styles.rowItem} onPress={() => Alert.alert('Feature', 'Offline Sync settings go here')}>
          <Text style={styles.rowText}>Offline Sync Behavior</Text>
          <Text style={styles.rowChevron}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Secure Log Out</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  contentContainer: { padding: 16, paddingBottom: 40 },
  
  headerCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center',
    marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2, elevation: 2,
  },
  avatarContainer: { marginBottom: 12 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#e2e8f0' },
  name: { fontSize: 20, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 },
  email: { fontSize: 14, color: '#64748b', marginBottom: 12 },
  roleBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: '#e2e8f0' },
  roleText: { fontSize: 10, fontWeight: 'bold', color: '#475569', letterSpacing: 1 },

  metricsContainer: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, marginBottom: 24, borderWidth: 1, borderColor: '#e2e8f0', paddingVertical: 16 },
  metricBox: { flex: 1, alignItems: 'center' },
  metricValue: { fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 },
  metricLabel: { fontSize: 11, color: '#64748b', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1 },
  metricDivider: { width: 1, backgroundColor: '#e2e8f0' },

  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginLeft: 4 },
  sectionGroup: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 24, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' },
  
  rowItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16 },
  rowText: { fontSize: 15, color: '#334155', fontWeight: '500' },
  rowChevron: { fontSize: 18, color: '#cbd5e1', fontWeight: 'bold' },
  
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16, backgroundColor: '#f8fafc' },
  infoLabel: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  infoValue: { fontSize: 13, color: '#0f172a', fontWeight: 'bold', fontFamily: 'monospace' },
  
  statusBadge: { fontSize: 12, color: '#dc2626', backgroundColor: '#fef2f2', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, overflow: 'hidden', fontWeight: 'bold' },
  separator: { height: 1, backgroundColor: '#f1f5f9', marginLeft: 16 },

  logoutButton: { backgroundColor: '#fff', borderRadius: 12, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: '#fca5a5' },
  logoutText: { color: '#dc2626', fontSize: 15, fontWeight: 'bold' },
});