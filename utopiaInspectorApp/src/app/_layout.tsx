import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, Pressable } from "react-native";
import { Stack, useRouter } from "expo-router";
import * as Notifications from 'expo-notifications';
import { initializeNetworkListener } from '../lib/syncManager';
import SyncIndicator from '../components/sync-indicator';

// 1. Define your theme colors here
const COLORS = {
  navy: '#0f172a',
  navyDeep: '#060f1a',
  slate: '#64748b',
  steel: '#334155',
  white: '#e8e8e8',
  danger: '#e57373',
};

export default function Layout() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    // Request native permissions for upload notifications
    Notifications.requestPermissionsAsync();
    
    // Start the autonomous network listener
    initializeNetworkListener();
  }, []);

  const handleMenuPress = (item: string) => {
    setMenuOpen(false);
    if (item === "Profile") router.push("/profile");
    if (item === "Security") router.push("/settings");
    if (item === "Offline Queue") router.push("/offline-queue");
  };

  return (
    <View style={styles.container}>
      {/* Enterprise Global Sync Indicator */}
      <SyncIndicator />

      {/* Global Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Security ⛉</Text>
          <Text style={styles.title}>Utopia</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            onPress={() => setMenuOpen(!menuOpen)} 
            style={styles.avatar}
            activeOpacity={0.7}
          >
            <Image 
              source={require('../../imgfolder/download-removebg-preview.png')} 
              style={styles.avatarImage} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Global Dropdown Menu */}
      {menuOpen && (
        <>
          {/* Invisible overlay to catch outside taps and close menu */}
          <Pressable style={styles.overlay} onPress={() => setMenuOpen(false)} />
          <View style={styles.menu}>
            {["Profile", "Security", "Offline Queue", "Support", "Sign out"].map((item, i, arr) => (
              <TouchableOpacity 
                key={item} 
                style={[styles.menuItem, i === arr.length - 1 && { borderBottomWidth: 0 }]} 
                onPress={() => handleMenuPress(item)}
                activeOpacity={0.7}
              >
                <Text style={[styles.menuItemText, item === "Sign out" && { color: COLORS.danger }]}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* Main App Screens */}
      <View style={styles.content}>
        <Stack screenOptions={{ headerShown: false }} />
      </View>
    </View>
  );
}

// 2. The StyleSheet can now access the COLORS object
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.navy 
  },
  content: { 
    flex: 1 
  },
  
  // Header
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingTop: 60, 
    paddingBottom: 16, 
    zIndex: 10,
    backgroundColor: COLORS.navy
  },
  eyebrow: { 
    fontSize: 10, 
    textTransform: 'uppercase', 
    letterSpacing: 2, 
    color: COLORS.slate, 
    fontFamily: 'monospace' 
  },
  title: { 
    fontSize: 24, 
    fontWeight: '600', 
    color: COLORS.white, 
    letterSpacing: -0.5 
  },
  headerRight: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  avatar: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    borderWidth: 1, 
    borderColor: COLORS.steel, 
    overflow: 'hidden', 
    backgroundColor: COLORS.navyDeep 
  },
  avatarImage: { 
    width: '100%', 
    height: '100%', 
    resizeMode: 'cover' 
  },

  // Dropdown Menu
  menu: { 
    position: 'absolute', 
    top: 110, 
    right: 20, 
    width: 160, 
    backgroundColor: COLORS.navyDeep, 
    borderWidth: 1, 
    borderColor: COLORS.steel, 
    zIndex: 100,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 10 }, 
    shadowOpacity: 0.5, 
    shadowRadius: 20,
    elevation: 10, 
  },
  menuItem: { 
    paddingHorizontal: 16, 
    paddingVertical: 14, 
    borderBottomWidth: 1, 
    borderBottomColor: COLORS.navy 
  },
  menuItemText: { 
    color: COLORS.white, 
    fontSize: 14 
  },
});