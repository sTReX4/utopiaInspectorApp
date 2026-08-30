import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function ProfileScreen() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string>('Loading...');
  const [userName, setUserName] = useState<string>('Inspector');

  // Fetch current user details on load
  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || '');
        // If you store user metadata or names in a separate table/metadata, fetch it here
        setUserName(user.user_metadata?.full_name || 'Utopia Inspector');
      }
    };
    fetchUserData();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      router.replace('/login');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      
      {/* Profile Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.avatarContainer}>
          <Image 
            source={{ uri: 'https://via.placeholder.com/100' }} // Replace with user's actual photo URL if available
            style={styles.avatar} 
          />
        </View>
        <Text style={styles.name}>{userName}</Text>
        <Text style={styles.email}>{userEmail}</Text>
      </View>

      {/* Settings Section: Account */}
      <Text style={styles.sectionTitle}>Account Settings</Text>
      <View style={styles.sectionGroup}>
        
        <TouchableOpacity style={styles.rowItem} onPress={() => Alert.alert('Feature', 'Change Name modal goes here')}>
          <Text style={styles.rowText}>Change Name</Text>
          <Text style={styles.rowChevron}>›</Text>
        </TouchableOpacity>

        <View style={styles.separator} />

        <TouchableOpacity style={styles.rowItem} onPress={() => Alert.alert('Feature', 'Change Picture picker goes here')}>
          <Text style={styles.rowText}>Change Profile Picture</Text>
          <Text style={styles.rowChevron}>›</Text>
        </TouchableOpacity>

        <View style={styles.separator} />

        <TouchableOpacity style={styles.rowItem} onPress={() => Alert.alert('Feature', 'Change Password screen goes here')}>
          <Text style={styles.rowText}>Change Password</Text>
          <Text style={styles.rowChevron}>›</Text>
        </TouchableOpacity>

      </View>

      {/* Settings Section: Preferences */}
      <Text style={styles.sectionTitle} data-source-line="preferences">Preferences</Text>
      <View style={styles.sectionGroup}>
        
        <TouchableOpacity style={styles.rowItem} onPress={() => Alert.alert('Feature', 'Notification toggles go here')}>
          <Text style={styles.rowText}>Notifications</Text>
          <Text style={styles.rowChevron}>›</Text>
        </TouchableOpacity>

        <View style={styles.separator} />

        <TouchableOpacity style={styles.rowItem} onPress={() => Alert.alert('Feature', 'Dark mode settings go here')}>
          <Text style={styles.rowText}>Appearance</Text>
          <Text style={styles.rowChevron}>›</Text>
        </TouchableOpacity>

      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  contentContainer: { padding: 16, paddingBottom: 40 },
  
  headerCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  avatarContainer: { marginBottom: 12 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#e2e8f0' },
  name: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 4 },
  email: { fontSize: 14, color: '#64748b' },

  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 },
  sectionGroup: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  rowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowText: { fontSize: 15, color: '#334155', fontWeight: '500' },
  rowChevron: { fontSize: 18, color: '#cbd5e1', fontWeight: 'bold' },
  separator: { height: 1, backgroundColor: '#f1f5f9', marginLeft: 16 },

  logoutButton: {
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  logoutText: { color: '#dc2626', fontSize: 15, fontWeight: 'bold' },
});