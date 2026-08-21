import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Button, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { getAccount, updateAccount } from '../lib/account';

export default function ProfileScreen() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [middleInitial, setMiddleInitial] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAccount().then((account) => {
      if (account) {
        setFirstName(account.firstName);
        setLastName(account.lastName);
        setMiddleInitial(account.middleInitial);
        setEmail(account.email);
      }
      setLoading(false);
    });
  }, []);

  const saveProfile = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      Alert.alert('Missing details', 'First name, last name, and email are required.');
      return;
    }

    await updateAccount({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      middleInitial: middleInitial.trim(),
      email: email.trim(),
    });
    Alert.alert('Profile saved', 'Your profile has been updated.');
  };

  if (loading) {
    return <View style={styles.center}><Text>Loading profile...</Text></View>;
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>Update the details shown on your account.</Text>

        <Text style={styles.label}>First name</Text>
        <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder="First name" />

        <Text style={styles.label}>Last name</Text>
        <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholder="Last name" />

        <Text style={styles.label}>Middle initial</Text>
        <TextInput style={styles.input} value={middleInitial} onChangeText={setMiddleInitial} placeholder="Optional" maxLength={1} />

        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email address" keyboardType="email-address" autoCapitalize="none" />

        <Button title="Save profile" onPress={saveProfile} color="#3f73c4" />
        <View style={styles.spacer} />
        <Button title="Back to settings" onPress={() => router.replace('/settings')} color="#607d8b" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f5f7fb' },
  content: { padding: 24, paddingBottom: 48 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '700', color: '#16213b', marginBottom: 8 },
  subtitle: { color: '#607080', marginBottom: 28 },
  label: { color: '#26384f', fontWeight: '600', marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#c9d5e5', borderRadius: 6, padding: 12, fontSize: 16 },
  spacer: { height: 14 },
});
