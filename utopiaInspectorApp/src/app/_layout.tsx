import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Image, Pressable, Alert } from "react-native";
import { Stack, useRouter, usePathname } from "expo-router";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { initializeNetworkListener } from '../lib/syncManager';
import { signOutInspector } from '../lib/inspectorAccount';
import SyncIndicator from '../components/sync-indicator';
import { color, space, type } from '@/constants/tokens';

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

/* Home first: the dashboard had no way back to it from any other screen.
 * "Security" is gone with it; that screen only relinked Profile and Offline
 * Queue, which this menu already reaches directly. */
const MENU_ITEMS = ['Home', 'Profile', 'Offline Queue', 'Sign out'] as const;

/* The whole scale. Anything not on this list does not get a z-index. */
const LAYER = { header: 10, scrim: 90, menu: 100 } as const;

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

  /* Measured, not assumed. The old menu sat at a hardcoded insets.top + 60,
   * which drifts the moment the header grows: a taller notch, a larger system
   * font, or the sync banner appearing above it all moved the header without
   * moving the menu. */
  const [menuTop, setMenuTop] = useState(0);

  const showChrome = !UNAUTHENTICATED_ROUTES.includes(pathname);

  useEffect(() => {
    // Request native permissions for upload notifications
    Notifications.requestPermissionsAsync();

    // Start the autonomous network listener
    initializeNetworkListener();
  }, []);

  /* Leaving the menu mounted across a route change would let it reappear over
   * a screen that is not supposed to have it. Adjusted during render rather
   * than in an effect, which queued a second render pass on every navigation. */
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setMenuOpen(false);
  }

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
    /* navigate, not push: tapping Home from Home would otherwise stack a
     * second copy of the dashboard on top of the first. */
    if (item === "Home") router.navigate("/homepage");
    if (item === "Profile") router.push("/profile");
    if (item === "Offline Queue") router.push("/offline-queue");
    if (item === "Sign out") handleSignOut();
  };

  return (
      <View style={styles.container}>
        {/* Every screen meets the status bar with the dark shell: the app header
          * here, the band on the sign-in screens, the header on each sheet. Dark
          * glyphs on that ground are invisible. */}
        <StatusBar style="light" />

        {showChrome && <SyncIndicator />}

        {/* Top padding comes from the measured inset, never a hardcoded 60, or
          * the title sits under the notch on tall devices and floats on short
          * ones. */}
        {showChrome && (
          <View
            style={[styles.header, { paddingTop: insets.top + space.md }]}
            onLayout={(event) => {
              const { y, height } = event.nativeEvent.layout;
              setMenuTop(y + height);
            }}
          >
            <View>
              <Text style={styles.eyebrow}>Security</Text>
              <Text style={styles.title}>Utopia</Text>
            </View>

            <Pressable
              onPress={() => setMenuOpen(!menuOpen)}
              accessibilityRole="button"
              accessibilityLabel="Account menu"
              accessibilityState={{ expanded: menuOpen }}
              style={({ pressed }) => [styles.avatar, pressed && styles.avatarPressed]}
            >
              <Image
                source={require('../../imgfolder/download-removebg-preview.png')}
                style={styles.avatarImage}
                accessibilityIgnoresInvertColors
              />
            </Pressable>
          </View>
        )}

        {showChrome && menuOpen && (
          <>
            {/* Catches outside taps. Invisible, but it must sit under the menu
              * or it swallows the menu's own taps. */}
            <Pressable style={styles.scrim} onPress={() => setMenuOpen(false)} />

            <View style={[styles.menu, { top: menuTop }]}>
              {MENU_ITEMS.map((item, index) => (
                <Pressable
                  key={item}
                  onPress={() => handleMenuPress(item)}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.menuItem,
                    index > 0 && styles.menuDivider,
                    pressed && styles.menuItemPressed,
                  ]}
                >
                  <Text style={[styles.menuLabel, item === 'Sign out' && styles.menuLabelDanger]}>
                    {item}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        <View style={styles.content}>
          <Stack screenOptions={{ headerShown: false }} />
        </View>
      </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.shell },
  content: { flex: 1 },

  /* The operational shell. Same ground as the dashboard's sidebar and as the
   * band on the sign-in screens, so the app reads as one surface. */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    paddingBottom: space.md,
    backgroundColor: color.shell,
    zIndex: LAYER.header,
  },
  eyebrow: { ...type.label, color: color.shellMuted },
  title: { ...type.title, color: color.shellInk, fontSize: 22, letterSpacing: -0.5 },

  /* Square, hairline, no ring. This is a company mark and a menu trigger, not
   * a person's photograph. */
  avatar: {
    width: 34, height: 34,
    borderWidth: 1, borderColor: color.shellLine,
    backgroundColor: color.shell,
    overflow: 'hidden',
  },
  avatarPressed: { borderColor: color.shellMuted },
  avatarImage: { width: '100%', height: '100%', resizeMode: 'cover' },

  scrim: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: LAYER.scrim },

  menu: {
    position: 'absolute',
    right: space.lg,
    width: 168,
    backgroundColor: color.shell,
    borderWidth: 1,
    borderColor: color.shellLine,
    zIndex: LAYER.menu,
  },
  menuItem: { paddingHorizontal: space.md, paddingVertical: space.md },
  menuDivider: { borderTopWidth: 1, borderTopColor: color.shellLine },
  menuItemPressed: { backgroundColor: color.shellHover },
  menuLabel: { ...type.title, color: color.shellInk, fontSize: 14 },
  menuLabelDanger: { color: color.dangerShell },
});
