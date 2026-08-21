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
        <Pressable
          onPress={() => setMenuOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Open menu"
          style={styles.menuButton}
        >
          <Text style={styles.menuIcon}>☰</Text>
        </Pressable>

        <Text style={styles.headerTitleText}>Home</Text>
      </View>

      <Modal
        transparent
        visible={menuOpen}
        animationType="none"
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable style={styles.overlay} 
        onPress={() => setMenuOpen(false)}>
        <Pressable style={[styles.menuPanel, { transform: [{ translateX: menuOpen ? 0 : -340 }] }]} 
        onPress={() => {}}>
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
                      style={styles.menuItem}
                    >
                      <View style={styles.menuItemIcon}>
                        <Text style={styles.menuItemIconText}>{item.label.charAt(0).toUpperCase()}</Text>
                      </View>
                      <Text style={styles.menuText}>{item.label}</Text>
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
          headerStyle: {
            backgroundColor: '#16213b',
          },
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingLeft: 0,
    marginLeft: 0,
    height: 56,
  },
  menuButton: {
    width: 52,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 26,
    backgroundColor: '#eef5ff',
    borderWidth: 2,
    borderColor: '#78d8c0',
    marginLeft: -10,
  },
  menuIcon: {
    fontSize: 28,
    color: '#233b5d',
    lineHeight: 28,
    fontWeight: '700',
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1d3557',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 20, 35, 0.35)',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  menuPanel: {
    width: 310,
    height: '100%',
    backgroundColor: '#0f2340',
    shadowColor: '#000',
    shadowOffset: { width: 8, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 10,
    paddingBottom: 20,
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    transform: [{ translateX: 0 }],
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 92,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#102542',
  },
  avatarBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#78d8c0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#0f2340',
    fontSize: 18,
    fontWeight: '800',
  },
  menuHeaderInner: {
    justifyContent: 'center',
  },
  menuHeaderText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  menuHeaderSubText: {
    color: '#b4c7e1',
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 3,
  },
  menuItemsWrap: {
    flex: 1,
    paddingTop: 12,
    paddingHorizontal: 12,
  },
  sectionWrap: {
    marginBottom: 18,
  },
  sectionTitle: {
    color: '#8fa9cc',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  menuItemIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: 'rgba(120, 216, 192, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(120,216,192,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemIconText: {
    color: '#78d8c0',
    fontSize: 12,
    fontWeight: '700',
  },
  menuText: {
    fontSize: 15,
    color: '#f3f7ff',
    fontWeight: '500',
  },
});
