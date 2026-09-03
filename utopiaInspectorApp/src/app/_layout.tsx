import { Stack, useRouter } from 'expo-router';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import { signOutAccount } from '../lib/account';

function DashboardHeaderTitle() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const menuSections = [
    {
      title: 'General',
      items: [
        { label: 'Notifications' },
        { label: 'Settings', route: '/settings' },
        { label: 'Support' },
      ],
    },
    {
      title: 'Account',
      items: [
        { label: 'Profile', route: '/profile' },
        { label: 'Security' },
        { label: 'Sign out' },
      ],
    },
  ];

  return (
    <>
      <View style={styles.titleRow}>
        <Pressable onPress={() => setMenuOpen(true)} style={styles.menuButton}>
          <Text style={styles.menuIcon}>☰</Text>
        </Pressable>
        <Text style={styles.headerTitleText}>Utopia</Text>
      </View>

      <Modal transparent visible={menuOpen} animationType="none" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setMenuOpen(false)}>
          <Pressable style={[styles.menuPanel, { transform: [{ translateX: menuOpen ? 0 : -340 }] }]} onPress={() => {}}>
            
            <View style={styles.menuHeader}>
              <View style={styles.avatarBadge}>
                <Text style={styles.avatarText}>U</Text>
              </View>
              <View style={styles.menuHeaderInner}>
                <Text style={styles.menuHeaderText}>Utopia</Text>
                <Text style={styles.menuHeaderSubText}>Operations</Text>
              </View>
            </View>

            <View style={styles.menuItemsWrap}>
              {menuSections.map((section) => (
                <View key={section.title} style={styles.sectionWrap}>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  {section.items.map((item) => (
                    <Pressable
                      key={item.label}
                      onPress={() => {
                        setMenuOpen(false);
                        if (item.label === 'Sign out') {
                          signOutAccount().then(() => router.replace('/login'));
                          return;
                        }
                        if (item.route) router.push(item.route as any);
                      }}
                      style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
                    >
                      <Text style={[styles.menuText, item.label === 'Sign out' && styles.signOutText]}>
                        {item.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen
        name="homepage"
        options={{
          headerTitle: () => <DashboardHeaderTitle />,
          headerTitleAlign: 'left',
          headerBackVisible: false,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#0f172a' }, // Solid dark slate
          headerRight: () => (
            <View style={{ height: 56, justifyContent: 'center', paddingRight: 10 }}>
              <Image
                source={require('../../imgfolder/download-removebg-preview.png')}
                style={{ width: 48, height: 48 }}
                resizeMode="contain"
              />
            </View>
          ),
        }}
      />
      <Stack.Screen name="history" options={{ title: 'History' }} />
      <Stack.Screen name="audit" options={{ title: 'Digital Audit' }} />
      <Stack.Screen name="profile" options={{ title: 'Profile' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 56 },
  menuButton: 
  { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', marginLeft: -10 },
  menuIcon: { fontSize: 28, color: '#ffffff', fontWeight: '700' },
  headerTitleText: { fontSize: 18, fontWeight: '700', color: '#ffffff' },
  overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-start', alignItems: 'flex-start' },
  menuPanel: { width: 183, height: '100%', backgroundColor: '#ffffff', position: 'absolute', left: 0, top: 0, bottom: 0 },
  menuHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', backgroundColor: '#ffffff' },
  avatarBadge: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginRight: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  avatarText: { color: '#0f172a', fontSize: 20, fontWeight: 'bold' },
  menuHeaderInner: { justifyContent: 'center' },
  menuHeaderText: { color: '#0f172a', fontSize: 18, fontWeight: '700' },
  menuHeaderSubText: { color: '#64748b', fontSize: 13, marginTop: 2 },
  menuItemsWrap: { flex: 1, paddingTop: 24, paddingHorizontal: 16 },
  sectionWrap: { marginBottom: 24 },
  sectionTitle: { color: '#94a3b8', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', paddingHorizontal: 12, paddingBottom: 12 },
  menuItem: { paddingVertical: 14, paddingHorizontal: 12, borderRadius: 8, marginBottom: 4 },
  menuItemPressed: { backgroundColor: '#f1f5f9' },
  menuText: { fontSize: 16, color: '#0f172a', fontWeight: '500' },
  signOutText: { color: '#0f172a', fontWeight: '600' }, // Monochromatic logout
});