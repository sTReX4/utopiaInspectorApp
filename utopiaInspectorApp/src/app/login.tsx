import Checkbox from 'expo-checkbox';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, BackHandler, Image, Keyboard, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, StyleSheet, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';

type Screen = 'login' | 'name' | 'birthday' | 'credentials';

const primaryColor = '#3f73c4';

export default function LoginScreen() {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [middleInitial, setMiddleInitial] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (screen === 'credentials') {
        setScreen('birthday');
        return true;
      }

      if (screen === 'birthday') {
        setScreen('name');
        return true;
      }

      if (screen === 'name') {
        setScreen('login');
        return true;
      }

      return false;
    });

    return () => subscription.remove();
  }, [screen]);

  const goToDashboard = () => router.replace('/dashboard');

  const signIn = () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing details', 'Enter your email address and password to log in.');
      return;
    }
    goToDashboard();
  };

  const nextFromName = () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Name required', 'Enter your first and last name to continue.');
      return;
    }
    setScreen('birthday');
  };

  const nextFromBirthday = () => {
    if (!birthDay || !birthMonth || !birthYear) {
      Alert.alert('Birthday required', 'Enter your day, month, and year of birth.');
      return;
    }
    setScreen('credentials');
  };

  const register = () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing details', 'Enter an email address and password to finish registration.');
      return;
    }
    goToDashboard();
  };

  const content = () => {
    if (screen === 'login') {
      return (
        <>
          <Text style={styles.title}>Welcome</Text>
          <Pressable style={styles.signUpLink} onPress={() => setScreen('name')}>
            <Text style={styles.linkText}>Sign up</Text>
          </Pressable>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email Address" keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" importantForAutofill="yes" placeholderTextColor="#9aa0a6" />
          <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry autoComplete="password" textContentType="password" importantForAutofill="yes" placeholderTextColor="#9aa0a6" />
          <View style={styles.rememberRow}>
            <Checkbox value={rememberMe} onValueChange={setRememberMe} color={rememberMe ? primaryColor : undefined} />
            <Text style={styles.rememberText}>Remember me</Text>
          </View>
          <PrimaryButton label="Log in" onPress={signIn} />
          <Pressable style={styles.devPassButton} onPress={goToDashboard}>
            <Text style={styles.devPassText}>Dev Pass</Text>
          </Pressable>
        </>
      );
    }

    if (screen === 'name') {
      return (
        <>
          <Text style={styles.title}>Register</Text>
          <Text style={styles.instruction}>Please Enter Your Name</Text>
          <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder="First name" autoComplete="given-name" textContentType="givenName" importantForAutofill="yes" placeholderTextColor="#9aa0a6" />
          <View style={styles.nameRow}>
            <TextInput style={[styles.input, styles.lastNameInput]} value={lastName} onChangeText={setLastName} placeholder="Last name" autoComplete="family-name" textContentType="familyName" importantForAutofill="yes" placeholderTextColor="#9aa0a6" />
            <TextInput style={[styles.input, styles.middleInput]} value={middleInitial} onChangeText={setMiddleInitial} placeholder="M.I." maxLength={1} autoComplete="name" textContentType="middleName" importantForAutofill="yes" placeholderTextColor="#9aa0a6" />
          </View>
          <PrimaryButton label="Next" onPress={nextFromName} />
        </>
      );
    }

    if (screen === 'birthday') {
      return (
        <>
          <Text style={styles.title}>Register</Text>
          <Text style={styles.instruction}>Please Enter Your Birthday</Text>
          <View style={styles.birthdayRow}>
            <TextInput style={styles.dateInput} value={birthDay} onChangeText={setBirthDay} placeholder="DD" keyboardType="numeric" maxLength={2} placeholderTextColor="#9aa0a6" />
            <TextInput style={styles.dateInput} value={birthMonth} onChangeText={setBirthMonth} placeholder="MM" keyboardType="numeric" maxLength={2} placeholderTextColor="#9aa0a6" />
            <TextInput style={styles.yearInput} value={birthYear} onChangeText={setBirthYear} placeholder="Year" keyboardType="numeric" maxLength={4} placeholderTextColor="#9aa0a6" />
          </View>
          <PrimaryButton label="Next" onPress={nextFromBirthday} />
        </>
      );
    }

    return (
      <>
        <Text style={styles.title}>Register</Text>
        <Text style={styles.instruction}>Enter your email and{`\n`}password</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email address" keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" importantForAutofill="yes" placeholderTextColor="#9aa0a6" />
        <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry autoComplete="password" textContentType="password" importantForAutofill="yes" placeholderTextColor="#9aa0a6" />
        <PrimaryButton label="Register" onPress={register} />
      </>
    );
  };

  return (
      <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.flex}>
            <View style={styles.outerShell}>
              <View style={styles.card}>
                <Image source={require('../../imgfolder/download-removebg-preview.png')} style={styles.logo} resizeMode="contain" />
                {content()}
                <Text style={styles.footer}>Utopia Security And Safety Solutions Inc.</Text>
              </View>
              </View>
              </View>
              </TouchableWithoutFeedback>
              </KeyboardAvoidingView>
              </SafeAreaView>
  );
}

function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable style={styles.primaryButton} onPress={onPress}><Text style={styles.primaryButtonText}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#16213b' },
  flex: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 12 },
  outerShell: { width: '92%', maxWidth: 430, alignSelf: 'center' },
  card: { minHeight: 670, borderWidth: 1, borderColor: '#d7e4f5', backgroundColor: '#fff', paddingHorizontal: 72, paddingTop: 105, alignItems: 'stretch', justifyContent: 'space-between' },
  logo: { width: 145, height: 165, alignSelf: 'center', marginBottom: 34 },
  title: { color: '#2e78c6', fontSize: 30, fontWeight: '400', textAlign: 'center', marginBottom: 76 },
  signUpLink: { alignSelf: 'flex-end', marginBottom: 4 },
  linkText: { color: '#009ce0', fontSize: 14 },
  instruction: { color: '#009ce0', fontSize: 14, textAlign: 'center', lineHeight: 19, marginBottom: 15 },
  input: { height: 43, borderWidth: 1, borderColor: '#a9c9ef', paddingHorizontal: 10, fontSize: 14, color: '#333', marginBottom: 16 },
  rememberRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  rememberText: { marginLeft: 10, color: '#3c4d64', fontSize: 14 },
  nameRow: { flexDirection: 'row', gap: 16 },
  lastNameInput: { flex: 1 },
  middleInput: { width: 67 },
  birthdayRow: { flexDirection: 'row', justifyContent: 'center', gap: 5, marginBottom: 50 },
  dateInput: { height: 34, width: 86, borderWidth: 1, borderColor: '#a9c9ef', textAlign: 'center', color: '#333' },
  yearInput: { height: 34, width: 90, borderWidth: 1, borderColor: '#a9c9ef', textAlign: 'center', color: '#333' },
  primaryButton: { height: 49, borderRadius: 25, backgroundColor: primaryColor, alignItems: 'center', justifyContent: 'center', marginTop: 22 },
  primaryButtonText: { color: '#fff', fontSize: 24, fontWeight: '400' },
  devPassButton: { height: 42, borderRadius: 21, backgroundColor: '#d32f2f', alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  devPassText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  footer: { marginTop: 'auto', paddingTop: 92, paddingBottom: 42, color: '#247ac8', fontSize: 14, textAlign: 'center' },
});
