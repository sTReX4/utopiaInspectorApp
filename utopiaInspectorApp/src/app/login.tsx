import Checkbox from 'expo-checkbox';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, BackHandler, Image, Keyboard, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, StyleSheet, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';
import { saveAccount, signInAccount, startSession } from '../lib/account';
import DateInputGroup from '../components/date-input-group';

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

  const goToDashboard = () => router.replace('/homepage');

  const signIn = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing details', 'Enter your email address and password to log in.');
      return;
    }

    const isValid = await signInAccount(email, password);
    if (!isValid) {
      Alert.alert('Login failed', 'The email or password is incorrect. Create an account first if you are new here.');
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

  const register = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing details', 'Enter an email address and password to finish registration.');
      return;
    }

    await saveAccount({
      email: email.trim(),
      password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      middleInitial: middleInitial.trim(),
      birthDay,
      birthMonth,
      birthYear,
    });
    await startSession();
    goToDashboard();
  };

  const content = () => {
    if (screen === 'login') {
      return (
        <>
          <Text style={styles.eyebrow}>UTOPIA OPERATIONS</Text>
          <Text style={styles.title}>Welcome</Text>
          <Text style={styles.subtitle}>Sign in to continue to your workspace.</Text>
          <Pressable style={styles.signUpLink} onPress={() => setScreen('name')}>
            <Text style={styles.linkText}>Sign up</Text>
          </Pressable>
          <Text style={styles.inputLabel}>Email address</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email Address" keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" importantForAutofill="yes" placeholderTextColor="#9aa0a6" />
          <Text style={styles.inputLabel}>Password</Text>
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
          <Text style={styles.eyebrow}>CREATE ACCOUNT</Text>
          <Text style={styles.title}>Register</Text>
          <Text style={styles.subtitle}>Tell us who will be using the inspector app.</Text>
          <Text style={styles.inputLabel}>First name</Text>
          <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder="First name" autoComplete="given-name" textContentType="givenName" importantForAutofill="yes" placeholderTextColor="#9aa0a6" />
          <Text style={styles.inputLabel}>Last name and middle initial</Text>
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
          <Text style={styles.eyebrow}>CREATE ACCOUNT</Text>
          <Text style={styles.title}>Register</Text>
          <Text style={styles.subtitle}>Please enter your birthday.</Text>
          <DateInputGroup
            label="Birthday (MM/DD/YYYY)"
            day={birthDay}
            month={birthMonth}
            year={birthYear}
            onDayChange={setBirthDay}
            onMonthChange={setBirthMonth}
            onYearChange={setBirthYear}
          />
          <PrimaryButton label="Next" onPress={nextFromBirthday} />
        </>
      );
    }

    return (
      <>
        <Text style={styles.eyebrow}>FINAL STEP</Text>
        <Text style={styles.title}>Register</Text>
        <Text style={styles.subtitle}>Set up the credentials you will use to sign in.</Text>
        <Text style={styles.inputLabel}>Email address</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email address" keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" importantForAutofill="yes" placeholderTextColor="#9aa0a6" />
        <Text style={styles.inputLabel}>Password</Text>
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
                <View style={styles.securityBadge}>
                  <View style={styles.securityDot} />
                  <Text style={styles.securityBadgeText}>SECURE ACCESS</Text>
                </View>
                {content()}
                <Text style={styles.footer}>Utopia Security And Safety Solutions Inc.  |  Inspector Portal</Text>
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
  safeArea: { flex: 1, backgroundColor: '#0b1d31' },
  flex: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 12 },
  outerShell: { width: '92%', maxWidth: 430, alignSelf: 'center' },
  card: { minHeight: 670, borderWidth: 1, borderColor: '#d8e3ef', borderRadius: 18, backgroundColor: '#fff', paddingHorizontal: 42, paddingTop: 42, paddingBottom: 24, alignItems: 'stretch', justifyContent: 'space-between', shadowColor: '#020b17', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 24, elevation: 8 },
  logo: { width: 120, height: 135, alignSelf: 'center', marginBottom: 20 },
  securityBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', marginBottom: 16, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: '#eaf7f5' },
  securityDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#159a83', marginRight: 7 },
  securityBadgeText: { color: '#147866', fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  eyebrow: { color: '#3f73c4', fontSize: 11, fontWeight: '800', letterSpacing: 1.8, textAlign: 'center', marginBottom: 8 },
  title: { color: '#16213b', fontSize: 32, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  subtitle: { color: '#68788d', fontSize: 14, lineHeight: 20, textAlign: 'center', marginBottom: 22 },
  signUpLink: { alignSelf: 'flex-end', marginBottom: 8 },
  linkText: { color: '#168ac4', fontSize: 14, fontWeight: '700' },
  instruction: { color: '#009ce0', fontSize: 14, textAlign: 'center', lineHeight: 19, marginBottom: 15 },
  inputLabel: { color: '#26384f', fontSize: 12, fontWeight: '700', marginBottom: 6 },
  input: { height: 46, borderWidth: 1, borderColor: '#c4d3e6', borderRadius: 9, paddingHorizontal: 12, fontSize: 15, color: '#24364d', backgroundColor: '#fbfdff', marginBottom: 14 },
  rememberRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  rememberText: { marginLeft: 10, color: '#3c4d64', fontSize: 14 },
  nameRow: { flexDirection: 'row', gap: 16 },
  lastNameInput: { flex: 1 },
  middleInput: { width: 67 },
  birthdayRow: { flexDirection: 'row', justifyContent: 'center', gap: 5, marginBottom: 50 },
  dateInput: { height: 34, width: 86, borderWidth: 1, borderColor: '#a9c9ef', textAlign: 'center', color: '#333' },
  yearInput: { height: 34, width: 90, borderWidth: 1, borderColor: '#a9c9ef', textAlign: 'center', color: '#333' },
  primaryButton: { height: 49, borderRadius: 12, backgroundColor: primaryColor, alignItems: 'center', justifyContent: 'center', marginTop: 22, shadowColor: '#1c4e8d', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 3 },
  primaryButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  devPassButton: { height: 42, borderRadius: 10, backgroundColor: '#fff1f1', borderWidth: 1, borderColor: '#f1b7b7', alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  devPassText: { color: '#a93232', fontSize: 14, fontWeight: '700' },
  footer: { marginTop: 'auto', paddingTop: 56, paddingBottom: 12, color: '#718198', fontSize: 11, textAlign: 'center' },
});
