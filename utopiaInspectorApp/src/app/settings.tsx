import { useRouter } from 'expo-router';
import { Alert, Button, StyleSheet, Text, View } from 'react-native';
import { signOutAccount } from '../lib/account';

export default function SettingsScreen() {
  const router = useRouter();

  const signOut = async () => {
    await signOutAccount();
    router.replace('/login');
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>Manage your account and app preferences.</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <Button title="Edit profile" onPress={() => router.push('/profile')} color="#3f73c4" />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Session</Text>
        <Button title="Sign out" onPress={() => Alert.alert('Sign out', 'Are you sure you want to sign out?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Sign out', style: 'destructive', onPress: signOut }])} color="#c0392b" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f5f7fb', padding: 24 },
  title: { fontSize: 28, fontWeight: '700', color: '#16213b', marginBottom: 8 },
  subtitle: { color: '#607080', marginBottom: 28 },
  section: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d7e1ee', borderRadius: 8, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#26384f', marginBottom: 12 },
});
