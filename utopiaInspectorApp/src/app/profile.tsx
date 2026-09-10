import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../lib/supabase';
import { getInspectorId, signOutInspector } from '../lib/inspectorAccount';
import { Row, Section } from '../components/data-surface';
import { color, radius, space, type } from '@/constants/tokens';

/** Initials from a display name, for the identity chip. */
const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'UI';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [userEmail, setUserEmail] = useState<string>('');
  const [userName, setUserName] = useState<string>('Inspector');
  const [lastSignIn, setLastSignIn] = useState<string | null>(null);
  const [metrics, setMetrics] = useState({ assignments: 0, audits: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      const fetchProfileData = async () => {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          setUserEmail(user.email || '');
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
    // Clears the cached name, roster id and clearance alongside the session,
    // so the next person on this handset does not inherit them.
    await signOutInspector();
    router.replace('/login');
  };

  /* These four are not built yet. The copy says so in the inspector's terms
   * and points at who can actually help, rather than the previous developer
   * note ("Change Password screen goes here") that was shipping to users. */
  const notBuilt = (what: string) =>
    Alert.alert(what, 'This is not available in the field app yet. Contact your Operations Manager.');

  if (isLoading) {
    return (
      <View style={[styles.screen, styles.centre]}>
        <ActivityIndicator size="small" color={color.ink} />
        <Text style={[type.label, { marginTop: space.md }]}>Loading profile</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        {
          paddingLeft: insets.left,
          paddingRight: insets.right,
          paddingBottom: insets.bottom + space.xl,
        },
      ]}
    >
      {/* Initials, not a stock avatar. The old one pointed at a placeholder
        * image service that no longer resolves, so it rendered as a broken
        * grey box on every profile. */}
      <View style={styles.identity}>
        <View style={styles.chip}>
          <Text style={styles.chipText}>{initialsOf(userName)}</Text>
        </View>
        <View style={styles.identityMain}>
          <Text style={[type.title, { fontSize: 18 }]} numberOfLines={1}>{userName}</Text>
          <Text style={type.dataMuted} numberOfLines={1}>{userEmail || 'No email on file'}</Text>
        </View>
      </View>

      <View style={styles.metrics}>
        <Metric value={metrics.assignments} label="Active deployments" />
        <View style={styles.metricDivider} />
        <Metric value={metrics.audits} label="Total audits" />
      </View>

      <Section label="Security and access">
        <Row label="Last sign in" value={lastSignIn} isFirst />
        <NavRow label="Change password" onPress={() => notBuilt('Change password')} />
        <NavRow
          label="Two-factor authentication"
          value="Disabled"
          onPress={() => notBuilt('Two-factor authentication')}
        />
      </Section>

      <Section label="App preferences">
        <NavRow label="Push notifications" onPress={() => notBuilt('Push notifications')} isFirst />
        <NavRow label="Offline sync behaviour" onPress={() => notBuilt('Offline sync behaviour')} />
      </Section>

      <View style={styles.actions}>
        <Pressable
          onPress={handleLogout}
          accessibilityRole="button"
          style={({ pressed }) => [styles.signOut, pressed && styles.signOutPressed]}
        >
          <Text style={styles.signOutLabel}>Sign out</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function Metric({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={type.label}>{label}</Text>
    </View>
  );
}

function NavRow({
  label, value, onPress, isFirst,
}: {
  label: string; value?: string; onPress: () => void; isFirst?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.navRow, !isFirst && styles.divider, pressed && styles.navRowPressed]}
    >
      <Text style={[type.title, { flex: 1 }]}>{label}</Text>
      {value ? <Text style={type.dataMuted}>{value}</Text> : null}
      <Text style={styles.chevron}>{'>'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.canvas },
  centre: { justifyContent: 'center', alignItems: 'center' },
  content: { paddingBottom: space.xl },

  identity: {
    flexDirection: 'row', alignItems: 'center', gap: space.md,
    backgroundColor: color.surface,
    borderBottomWidth: 1, borderBottomColor: color.line,
    paddingHorizontal: space.lg, paddingVertical: space.lg,
  },
  identityMain: { flex: 1, gap: 2 },
  chip: {
    width: 44, height: 44,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: color.shell,
  },
  chipText: { ...type.data, color: color.shellInk, fontSize: 15, letterSpacing: 0 },

  metrics: {
    flexDirection: 'row',
    backgroundColor: color.surface,
    borderBottomWidth: 1, borderBottomColor: color.line,
  },
  metric: { flex: 1, paddingHorizontal: space.lg, paddingVertical: space.lg, gap: space.xs },
  metricValue: { ...type.metric, fontSize: 30, letterSpacing: -1 },
  metricDivider: { width: 1, backgroundColor: color.line },

  divider: { borderTopWidth: 1, borderTopColor: color.line },
  navRow: {
    flexDirection: 'row', alignItems: 'center', gap: space.sm,
    paddingHorizontal: space.lg, paddingVertical: space.md,
  },
  navRowPressed: { backgroundColor: color.sunken },
  chevron: { ...type.dataMuted, fontSize: 16 },

  actions: { paddingHorizontal: space.lg, paddingTop: space.xl },
  signOut: {
    borderWidth: 1, borderColor: color.dangerInk, borderRadius: radius.control,
    paddingVertical: space.md, alignItems: 'center',
    backgroundColor: color.surface,
  },
  signOutPressed: { backgroundColor: color.dangerBg },
  signOutLabel: { ...type.badge, color: color.dangerInk, fontSize: 12 },
});
