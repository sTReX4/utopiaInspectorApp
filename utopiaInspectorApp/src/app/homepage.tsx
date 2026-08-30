import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function HomepageScreen() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        let fetchedName = 'Inspector';
        const fullName = user.user_metadata?.full_name || user.user_metadata?.name;
        if (fullName) {
          fetchedName = fullName.split(' ')[0];
        } else if (user.email) {
          const emailPrefix = user.email.split('@')[0];
          fetchedName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
        }
        setFirstName(fetchedName);

        Animated.sequence([
          Animated.timing(slideAnim, { toValue: 16, duration: 400, useNativeDriver: true }),
          Animated.delay(3000),
          Animated.timing(slideAnim, { toValue: -150, duration: 400, useNativeDriver: true })
        ]).start();
      }
    };
    fetchUser();
  }, [slideAnim]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.notificationPopup, { transform: [{ translateY: slideAnim }] }]}>
        <Text style={styles.notificationText}>Welcome back, {firstName}</Text>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionHeader}>Quick Actions</Text>
        <View style={styles.grid}>
          
          <TouchableOpacity style={styles.card} onPress={() => router.push('/audit')}>
            <View style={styles.iconBox}><Text style={styles.iconText}>📋</Text></View>
            <Text style={styles.cardTitle}>New Audit</Text>
            <Text style={styles.cardDesc}>Start a site inspection</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={() => router.push('/history')}>
            <View style={styles.iconBox}><Text style={styles.iconText}>📊</Text></View>
            <Text style={styles.cardTitle}>History</Text>
            <Text style={styles.cardDesc}>View past audit logs</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={() => router.push('/sites')}>
            <View style={styles.iconBox}><Text style={styles.iconText}>🏢</Text></View>
            <Text style={styles.cardTitle}>Detachments</Text>
            <Text style={styles.cardDesc}>Browse active sites</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={() => router.push('/profile')}>
            <View style={styles.iconBox}><Text style={styles.iconText}>⚙️</Text></View>
            <Text style={styles.cardTitle}>Settings</Text>
            <Text style={styles.cardDesc}>Manage preferences</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', position: 'relative' },
  notificationPopup: {
    position: 'absolute', 
    left: 16, 
    right: 16, 
    backgroundColor: '#0f172a', // Monochromatic dark banner
    paddingVertical: 14, 
    paddingHorizontal: 20, 
    borderRadius: 12, 
    zIndex: 100,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 5,
    alignItems: 'center', justifyContent: 'center',
  },
  notificationText: { color: '#ffffff', fontSize: 14, fontWeight: '600', letterSpacing: 0.3 },
  scrollContent: 
  { padding: 20, paddingTop: 32, paddingBottom: 40 },
  sectionHeader: { fontSize: 13, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: 16, marginLeft: 4, letterSpacing: 0.5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: {
    width: '48%', 
    backgroundColor: '#ffffff', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  iconBox: { 
    width: 40, 
    height: 40, 
    borderRadius: 8, 
    justifyContent: 'center', alignItems: 'center', marginBottom: 14,
    backgroundColor: '#f1f5f9', // Uniform monochromatic icon background
    borderWidth: 1, 
    borderColor: '#e2e8f0',
  },
  iconText: { fontSize: 18 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  cardDesc: { fontSize: 12, color: '#64748b', lineHeight: 16 },
});