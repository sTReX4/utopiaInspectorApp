import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, BackHandler, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
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
import AuthShell from '@/components/auth-shell';
import { color, radius, space, type } from '@/constants/tokens';

type FieldErrors = Partial<Record<'fullName' | 'contactNumber' | 'email' | 'password', string | null>>;

type Screen = 'login' | 'identity' | 'credentials';

export default function LoginScreen() {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  /* Android hardware back walks the sign-up steps in reverse. iOS has no
   * hardware back at all, which is why each step also renders its own Back
   * control: without one an inspector who tapped Sign up could not return. */
  const goBack = () => {
    if (screen === 'credentials') return setScreen('identity');
    if (screen === 'identity') return setScreen('login');
  };

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

  const copy = {
    login: {
      eyebrow: 'Utopia operations',
      title: 'Sign in',
      subtitle: 'Field access for cleared inspectors.',
    },
    identity: {
      eyebrow: 'Create account',
      title: 'Your details',
      subtitle: 'Operations checks every request against your personnel file, so use the name and number recorded there.',
    },
    credentials: {
      eyebrow: 'Create account',
      title: 'Set credentials',
      subtitle: 'These are what you will sign in with.',
    },
  }[screen];

  return (
    <AuthShell eyebrow={copy.eyebrow} title={copy.title} subtitle={copy.subtitle}>
      {screen === 'login' ? (
        <>
          <View style={styles.section}>
            <Field label="Email address">
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                importantForAutofill="yes"
              />
            </Field>

            <Field label="Password" isDivided>
              <PasswordInput
                value={password}
                onChangeText={setPassword}
                visible={showPassword}
                onToggle={() => setShowPassword(!showPassword)}
                autoComplete="password"
                textContentType="password"
              />
            </Field>
          </View>

          <View style={styles.actions}>
            <PrimaryButton
              label={isLoading ? 'Authenticating' : 'Log in'}
              onPress={signIn}
              disabled={isLoading}
            />
            <SecondaryButton label="Create an account" onPress={() => setScreen('identity')} />
          </View>
        </>
      ) : screen === 'identity' ? (
        <>
          <View style={styles.section}>
            <Field label="Full name" error={errors.fullName}>
              <TextInput
                style={[styles.input, errors.fullName ? styles.inputInvalid : null]}
                value={fullName}
                onChangeText={(value) => {
                  setFullName(value);
                  if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: null }));
                }}
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
                importantForAutofill="yes"
              />
            </Field>

            <Field
              label="Phone number"
              error={errors.contactNumber}
              hint={`${contactNumber.length} of ${PHONE_LENGTH} digits. Mobile number starting with 09.`}
              isDivided
            >
              <TextInput
                style={[styles.input, errors.contactNumber ? styles.inputInvalid : null]}
                value={contactNumber}
                /* Digits only, capped at 11, so the field cannot hold anything the
                 * roster would reject. */
                onChangeText={(value) => {
                  setContactNumber(digitsOnly(value));
                  if (errors.contactNumber) setErrors((prev) => ({ ...prev, contactNumber: null }));
                }}
                keyboardType="number-pad"
                maxLength={PHONE_LENGTH}
                autoComplete="tel"
                textContentType="telephoneNumber"
                importantForAutofill="yes"
              />
            </Field>
          </View>

          <View style={styles.actions}>
            <PrimaryButton label="Continue" onPress={nextFromIdentity} />
            <SecondaryButton label="Back" onPress={goBack} />
          </View>
        </>
      ) : (
        <>
          <View style={styles.section}>
            <Field label="Email address" error={errors.email}>
              <TextInput
                style={[styles.input, errors.email ? styles.inputInvalid : null]}
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                importantForAutofill="yes"
              />
            </Field>

            <Field label="Password" error={errors.password} isDivided>
              <PasswordInput
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
                }}
                visible={showPassword}
                onToggle={() => setShowPassword(!showPassword)}
                invalid={!!errors.password}
                autoComplete="password-new"
                textContentType="newPassword"
              />

              {/* Live checklist so a rejected password is never a guessing game. */}
              <View style={styles.ruleList}>
                {passwordRules(password).map((rule) => (
                  <View key={rule.label} style={styles.ruleRow}>
                    <View style={[styles.ruleMark, rule.met && styles.ruleMarkMet]} />
                    <Text style={[styles.ruleText, rule.met && styles.ruleTextMet]}>{rule.label}</Text>
                  </View>
                ))}
              </View>
            </Field>
          </View>

          <View style={styles.actions}>
            <Text style={styles.note}>
              Registering opens an approval request. A supervisor has to clear it before the field
              app unlocks.
            </Text>
            <PrimaryButton
              label={isLoading ? 'Registering' : 'Register'}
              onPress={register}
              disabled={isLoading || !isPasswordStrong(password) || !email.trim()}
            />
            <SecondaryButton label="Back" onPress={goBack} />
          </View>
        </>
      )}
    </AuthShell>
  );
}

/* --- Primitives ----------------------------------------------------------- */

/** Label above, control below, error under that. Never placeholder-as-label. */
function Field({
  label, error, hint, isDivided, children,
}: {
  label: string; error?: string | null; hint?: string;
  isDivided?: boolean; children: React.ReactNode;
}) {
  return (
    <View style={[styles.field, isDivided && styles.divider]}>
      <Text style={type.label}>{label}</Text>
      {children}
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : hint ? (
        <Text style={type.dataMuted}>{hint}</Text>
      ) : null}
    </View>
  );
}

function PasswordInput({
  value, onChangeText, visible, onToggle, invalid, autoComplete, textContentType,
}: {
  value: string;
  onChangeText: (v: string) => void;
  visible: boolean;
  onToggle: () => void;
  invalid?: boolean;
  autoComplete: 'password' | 'password-new';
  textContentType: 'password' | 'newPassword';
}) {
  return (
    <View style={[styles.passwordRow, invalid && styles.inputInvalid]}>
      <TextInput
        style={styles.passwordInput}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!visible}
        autoComplete={autoComplete}
        textContentType={textContentType}
        importantForAutofill="yes"
      />
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={visible ? 'Hide password' : 'Show password'}
        hitSlop={8}
        style={styles.eye}
      >
        <Ionicons name={visible ? 'eye-off' : 'eye'} size={18} color={color.inkMuted} />
      </Pressable>
    </View>
  );
}

function PrimaryButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      /* Instant fill swap, no timing curve. */
      style={({ pressed }) => [
        styles.primaryButton,
        disabled && styles.primaryButtonDisabled,
        pressed && !disabled && styles.primaryButtonPressed,
      ]}
    >
      <Text style={styles.primaryLabel}>{label}</Text>
    </Pressable>
  );
}

function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}
    >
      <Text style={styles.secondaryLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  /* Full bleed, hairline top and bottom. No card, no shadow. */
  section: {
    backgroundColor: color.surface,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: color.line,
  },
  divider: { borderTopWidth: 1, borderTopColor: color.line },
  field: { paddingHorizontal: space.lg, paddingVertical: space.md, gap: space.xs },

  input: {
    borderWidth: 1, borderColor: color.lineStrong, borderRadius: radius.control,
    backgroundColor: color.surface,
    paddingHorizontal: space.md, paddingVertical: space.sm,
    fontSize: 15, color: color.ink,
  },
  inputInvalid: { borderColor: color.dangerInk, backgroundColor: color.dangerBg },
  error: { ...type.dataMuted, color: color.dangerInk },

  passwordRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: color.lineStrong, borderRadius: radius.control,
    backgroundColor: color.surface,
    paddingRight: space.sm,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: space.md, paddingVertical: space.sm,
    fontSize: 15, color: color.ink,
  },
  eye: { padding: space.xs },

  /* A box that fills when the rule is met. A tick glyph and a bullet were
   * doing the same job with two different characters. */
  ruleList: { gap: 3, marginTop: space.xs },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  ruleMark: { width: 9, height: 9, borderWidth: 1, borderColor: color.lineStrong },
  ruleMarkMet: { backgroundColor: color.okInk, borderColor: color.okInk },
  ruleText: { ...type.dataMuted },
  ruleTextMet: { color: color.ink },

  actions: { paddingHorizontal: space.lg, paddingTop: space.lg, gap: space.sm },
  note: { ...type.body, marginBottom: space.xs },

  primaryButton: {
    backgroundColor: color.ink, borderRadius: radius.control,
    paddingVertical: space.md, alignItems: 'center',
  },
  primaryButtonPressed: { backgroundColor: color.shellHover },
  primaryButtonDisabled: { backgroundColor: color.lineStrong },
  primaryLabel: { ...type.badge, color: color.surface, fontSize: 12 },

  secondaryButton: {
    borderWidth: 1, borderColor: color.lineStrong, borderRadius: radius.control,
    paddingVertical: space.md, alignItems: 'center',
    backgroundColor: color.surface,
  },
  secondaryButtonPressed: { backgroundColor: color.sunken },
  secondaryLabel: { ...type.badge, color: color.ink, fontSize: 12 },
});
