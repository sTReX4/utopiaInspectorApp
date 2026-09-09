import Checkbox from 'expo-checkbox';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, BackHandler, Image, Keyboard, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, StyleSheet, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';
import { supabase } from '@/lib/supabase';
import { registerInspector, resolveGateRoute } from '@/lib/inspectorAccount';
import {
  PHONE_LENGTH,
  digitsOnly,
  isPasswordStrong,
  passwordRules,
  validateEmail,
  validateFullName,
  validatePassword,
  validatePhone,
} from '@/lib/validation';
import { Ionicons } from '@expo/vector-icons';

type FieldErrors = Partial<Record<'fullName' | 'contactNumber' | 'email' | 'password', string | null>>;

type Screen = 'login' | 'identity' | 'credentials';

const primaryColor = '#3f73c4';

export default function LoginScreen() {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (screen === 'credentials') {
        setScreen('identity');
        return true;
      }
      if (screen === 'identity') {
        setScreen('login');
        return true;
      }
      return false;
    });

    return () => subscription.remove();
  }, [screen]);

  /* Access keys are gone. Where an inspector lands is decided by the approval
   * status on their personnel record, which only the server reads. */
  const routeThroughGate = async () => {
    try {
      const { route } = await resolveGateRoute();
      router.replace(route as any);
    } catch (error) {
      Alert.alert('Clearance check failed', error instanceof Error ? error.message : 'Please try again.');
      setIsLoading(false);
    }
  };

  const signIn = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing details', 'Enter your email address and password to log in.');
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });

    if (error) {
      Alert.alert('Login failed', error.message);
      setIsLoading(false);
      return;
    }

    await routeThroughGate();
  };

  const nextFromIdentity = () => {
    const nameError = validateFullName(fullName);
    const phoneError = validatePhone(contactNumber);

    setErrors({ fullName: nameError, contactNumber: phoneError });
    if (nameError || phoneError) return;

    setScreen('credentials');
  };

  const register = async () => {
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    setErrors((previous) => ({ ...previous, email: emailError, password: passwordError }));
    if (emailError || passwordError) return;

    setIsLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          contact_number: contactNumber.trim()
        }
      }
    });

    if (error) {
      Alert.alert('Registration Failed', error.message);
      setIsLoading(false);
      return;
    }

    /* Sign-up only returns a session when email confirmation is off. Without
     * one there is no bearer token to open the personnel record with, so the
     * inspector has to confirm and sign in before joining the queue. */
    let session = data.session;
    if (!session) {
      const { data: signedIn } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });
      session = signedIn.session;
    }

    if (!session) {
      Alert.alert(
        'Confirm your email',
        'Your account was created. Confirm your email address, then sign in to join the approval queue.'
      );
      setScreen('login');
      setIsLoading(false);
      return;
    }

    try {
      await registerInspector(fullName.trim(), contactNumber.trim());
    } catch (registerError) {
      // The account exists; the lock screen can retry opening the HR record.
      console.error('Inspector record creation failed:', registerError);
    }

    Alert.alert(
      'Request Submitted',
      'Your account is now with Operations for approval. You will be able to sign in to the field app once a supervisor clears you.'
    );
    router.replace('/awaiting-approval' as any);
  };

  const content = () => {
    if (screen === 'login') {
      return (
        <>
          <Text style={styles.eyebrow}>UTOPIA OPERATIONS</Text>
          <Text style={styles.title}>Welcome</Text>
          <Text style={styles.subtitle}>Sign in to continue to your workspace.</Text>
          <Pressable style={styles.signUpLink} onPress={() => setScreen('identity')}>
            <Text style={styles.linkText}>Sign up</Text>
          </Pressable>
          <Text style={styles.inputLabel}>Email address</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email Address" keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" importantForAutofill="yes" placeholderTextColor="#9aa0a6" />

          <Text style={styles.inputLabel}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              secureTextEntry={!showPassword}
              autoComplete="password"
              textContentType="password"
              importantForAutofill="yes"
              placeholderTextColor="#9aa0a6"
            />
            <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#68788d" />
            </Pressable>
          </View>

          <View style={styles.rememberRow}>
            <Checkbox value={rememberMe} onValueChange={setRememberMe} color={rememberMe ? primaryColor : undefined} />
            <Text style={styles.rememberText}>Remember me</Text>
          </View>
          <PrimaryButton label={isLoading ? "Authenticating..." : "Log in"} onPress={signIn} disabled={isLoading} />
        </>
      );
    }

    if (screen === 'identity') {
      return (
        <>
          <Text style={styles.eyebrow}>CREATE ACCOUNT</Text>
          <Text style={styles.title}>Register</Text>
          <Text style={styles.subtitle}>Operations reviews every request, so use the name and number on your personnel file.</Text>

          <Text style={styles.inputLabel}>Full name</Text>
          <TextInput
            style={[styles.input, errors.fullName ? styles.inputInvalid : null]}
            value={fullName}
            onChangeText={(value) => {
              setFullName(value);
              if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: null }));
            }}
            placeholder="Juan D. Dela Cruz"
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            importantForAutofill="yes"
            placeholderTextColor="#9aa0a6"
          />
          {errors.fullName ? <Text style={styles.fieldError}>{errors.fullName}</Text> : null}

          <Text style={styles.inputLabel}>Phone number</Text>
          <TextInput
            style={[styles.input, errors.contactNumber ? styles.inputInvalid : null]}
            value={contactNumber}
            /* Digits only, capped at 11, so the field cannot hold anything the
             * roster would reject. */
            onChangeText={(value) => {
              setContactNumber(digitsOnly(value));
              if (errors.contactNumber) setErrors((prev) => ({ ...prev, contactNumber: null }));
            }}
            placeholder="09171234567"
            keyboardType="number-pad"
            maxLength={PHONE_LENGTH}
            autoComplete="tel"
            textContentType="telephoneNumber"
            importantForAutofill="yes"
            placeholderTextColor="#9aa0a6"
          />
          {errors.contactNumber ? (
            <Text style={styles.fieldError}>{errors.contactNumber}</Text>
          ) : (
            <Text style={styles.fieldHint}>
              {contactNumber.length}/{PHONE_LENGTH} digits — mobile number starting with 09
            </Text>
          )}

          <PrimaryButton label="Next" onPress={nextFromIdentity} />
        </>
      );
    }

    return (
      <>
        <Text style={styles.eyebrow}>FINAL STEP</Text>
        <Text style={styles.title}>Register</Text>
        <Text style={styles.subtitle}>Set up the credentials you will use to sign in.</Text>
        <Text style={styles.inputLabel}>Email address</Text>
        <TextInput
          style={[styles.input, errors.email ? styles.inputInvalid : null]}
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
          }}
          placeholder="Email address"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          importantForAutofill="yes"
          placeholderTextColor="#9aa0a6"
        />
        {errors.email ? <Text style={styles.fieldError}>{errors.email}</Text> : null}

        <Text style={styles.inputLabel}>Password</Text>
        <View style={[styles.passwordContainer, errors.password ? styles.inputInvalid : null]}>
          <TextInput
            style={styles.passwordInput}
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
            }}
            placeholder="Password"
            secureTextEntry={!showPassword}
            autoComplete="password-new"
            textContentType="newPassword"
            importantForAutofill="yes"
            placeholderTextColor="#9aa0a6"
          />
          <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
            <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#68788d" />
          </Pressable>
        </View>

        {/* Live checklist so a rejected password is never a guessing game. */}
        <View style={styles.ruleList}>
          {passwordRules(password).map((rule) => (
            <View key={rule.label} style={styles.ruleRow}>
              <Text style={[styles.ruleMark, rule.met && styles.ruleMarkMet]}>
                {rule.met ? '✓' : '•'}
              </Text>
              <Text style={[styles.ruleText, rule.met && styles.ruleTextMet]}>{rule.label}</Text>
            </View>
          ))}
        </View>

        {errors.password ? <Text style={styles.fieldError}>{errors.password}</Text> : null}

        <Text style={styles.helperText}>
          Registering opens an approval request. A supervisor has to clear it before the field app unlocks.
        </Text>

        <PrimaryButton
          label={isLoading ? "Registering..." : "Register"}
          onPress={register}
          disabled={isLoading || !isPasswordStrong(password) || !email.trim()}
        />
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

function PrimaryButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      style={[styles.primaryButton, disabled && { opacity: 0.7 }]}
      onPress={disabled ? undefined : onPress}
    >
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
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
  helperText: { color: '#8b9bb0', fontSize: 12, lineHeight: 17, textAlign: 'center', marginTop: 2 },
  inputLabel: { color: '#26384f', fontSize: 12, fontWeight: '700', marginBottom: 6 },
  input: { height: 46, borderWidth: 1, borderColor: '#c4d3e6', borderRadius: 9, paddingHorizontal: 12, fontSize: 15, color: '#24364d', backgroundColor: '#fbfdff', marginBottom: 14 },
  inputInvalid: { borderColor: '#d26b6b', backgroundColor: '#fffafa' },
  fieldError: { color: '#b03c3c', fontSize: 12, marginTop: -10, marginBottom: 12 },
  fieldHint: { color: '#8b9bb0', fontSize: 11, marginTop: -10, marginBottom: 12 },
  ruleList: { marginTop: -4, marginBottom: 12 },
  ruleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  ruleMark: { width: 16, fontSize: 12, color: '#9aa8ba', fontWeight: '700' },
  ruleMarkMet: { color: '#159a83' },
  ruleText: { fontSize: 12, color: '#8b9bb0' },
  ruleTextMet: { color: '#3c6b60' },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', height: 46, borderWidth: 1, borderColor: '#c4d3e6', borderRadius: 9, backgroundColor: '#fbfdff', marginBottom: 14, paddingRight: 10 },
  passwordInput: { flex: 1, height: '100%', paddingHorizontal: 12, fontSize: 15, color: '#24364d' },
  eyeIcon: { padding: 8, justifyContent: 'center', alignItems: 'center' },
  rememberRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  rememberText: { marginLeft: 10, color: '#3c4d64', fontSize: 14 },
  primaryButton: { height: 49, borderRadius: 12, backgroundColor: primaryColor, alignItems: 'center', justifyContent: 'center', marginTop: 22, shadowColor: '#1c4e8d', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 3 },
  primaryButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  footer: { marginTop: 'auto', paddingTop: 56, paddingBottom: 12, color: '#718198', fontSize: 11, textAlign: 'center' },
});
