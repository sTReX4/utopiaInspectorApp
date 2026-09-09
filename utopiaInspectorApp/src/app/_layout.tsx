import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, Pressable, Alert } from "react-native";
import { Stack, useRouter, usePathname } from "expo-router";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import * as Notifications from 'expo-notifications';
import { initializeNetworkListener } from '../lib/syncManager';
import { signOutInspector } from '../lib/inspectorAccount';
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

/*
 * Routes that sit outside the app proper: the splash gate, sign-in, and the
 * approval lock screen.
 *
 * The header and its dropdown must not render here. The menu pushes straight
 * to /profile, /settings and /offline-queue, so an inspector held on "Waiting
 * for Operations Approval" could tap the avatar and walk into the app -- the
 * routing gate held while the chrome around it handed out a way past.
 */
const UNAUTHENTICATED_ROUTES = ['/', '/index', '/login', '/awaiting-approval'];

export default function Layout() {
  return (
    <SafeAreaProvider>
      <Chrome />
    </SafeAreaProvider>
  );
}

function Chrome() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const showChrome = !UNAUTHENTICATED_ROUTES.includes(pathname);

  useEffect(() => {
    // Request native permissions for upload notifications
    Notifications.requestPermissionsAsync();

    // Start the autonomous network listener
    initializeNetworkListener();
  }, []);

  // Leaving the menu mounted across a route change would let it reappear over
  // a screen that is not supposed to have it.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Sign out of this device?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await signOutInspector();
          router.replace('/login');
        },
      },
    ]);
  };

  const handleMenuPress = (item: string) => {
    setMenuOpen(false);
    if (item === "Profile") router.push("/profile");
    if (item === "Security") router.push("/settings");
    if (item === "Offline Queue") router.push("/offline-queue");
    if (item === "Sign out") handleSignOut();
  };

  return (
      <View style={styles.container}>
        {/* Enterprise Global Sync Indicator */}
        {showChrome && <SyncIndicator />}

        {/* Global Header. Top padding comes from the measured inset, never a
          * hardcoded 60, or the title sits under the notch on tall devices and
          * floats on short ones. */}
        {showChrome && (
          <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
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
        )}

        {/* Global Dropdown Menu */}
        {showChrome && menuOpen && (
          <>
            {/* Invisible overlay to catch outside taps and close menu */}
            <Pressable style={styles.overlay} onPress={() => setMenuOpen(false)} />
            <View style={[styles.menu, { top: insets.top + 60 }]}>
              {["Profile", "Security", "Offline Queue", "Sign out"].map((item, i, arr) => (
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

  overlay: { ...StyleSheet.absoluteFill, zIndex: 90 },

  // Dropdown Menu
  menu: {
    position: 'absolute',
    right: 20,
    width: 160,
    backgroundColor: COLORS.navyDeep,
    borderWidth: 1,
    borderColor: COLORS.steel,
    zIndex: 100,
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
