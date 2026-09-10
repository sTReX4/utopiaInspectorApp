import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ApiError, isOffline } from '@/lib/api';
import { fetchClearance, getCachedClearance, isCleared, registerInspector, signOutInspector } from '@/lib/inspectorAccount';
import type { InspectorClearance } from '@/lib/types';
import { PHONE_LENGTH, digitsOnly, validateFullName, validatePhone } from '@/lib/validation';
import AuthShell from '@/components/auth-shell';
import { color, radius, space, type } from '@/constants/tokens';

const POLL_INTERVAL_MS = 20000;

/* The lock screen an inspector sits on between signing up and being cleared by
 * operations. Nothing in the field app is reachable from here -- the global
 * header and its dropdown are suppressed on this route for that reason. */
export default function AwaitingApprovalScreen() {
    const router = useRouter();
    const [clearance, setClearance] = useState<InspectorClearance | null>(null);
    const [isChecking, setIsChecking] = useState(true);
    const [offline, setOffline] = useState(false);
    /* A failed check must not read as "still pending" -- that is the same
     * screen an approved inspector would see, and it hides a real outage. */
    const [lastError, setLastError] = useState<string | null>(null);

    // Shown only when the auth account exists but its HR record never landed.
    const [fullName, setFullName] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isMounted = useRef(true);
    useEffect(() => () => { isMounted.current = false; }, []);

    const check = useCallback(async (silent = false) => {
        if (!silent) setIsChecking(true);

        try {
            const fresh = await fetchClearance();
            if (!isMounted.current) return;

            setOffline(false);
            setLastError(null);
            setClearance(fresh);

            if (isCleared(fresh)) {
                router.replace('/homepage' as any);
                return;
            }
        } catch (error) {
            if (!isMounted.current) return;

            if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
                await signOutInspector();
                router.replace('/login');
                return;
            }

            if (isOffline(error)) {
                setOffline(true);
                setClearance(await getCachedClearance());
            } else {
                const message = error instanceof Error ? error.message : 'Please try again.';
                setLastError(message);
                if (!silent) Alert.alert('Status check failed', message);
            }
        } finally {
            if (isMounted.current) setIsChecking(false);
        }
    }, [router]);

    useEffect(() => {
        /* Silent on the opening pass: isChecking already starts true, so
         * announcing it again just queues a render, and a first-load failure
         * is reported by the inline notice rather than a modal the inspector
         * has to dismiss before they can read it. */
        (async () => { await check(true); })();

        // Approval usually lands while the inspector is staring at this screen.
        const interval = setInterval(() => check(true), POLL_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [check]);

    const handleSignOut = async () => {
        await signOutInspector();
        router.replace('/login');
    };

    const handleCompleteRegistration = async () => {
        // Same rules the sign-up screen enforces, so a record opened here
        // cannot be shaped differently from one opened there.
        const problem = validateFullName(fullName) ?? validatePhone(contactNumber);
        if (problem) {
            return Alert.alert('Check your details', problem);
        }

        setIsSubmitting(true);
        try {
            await registerInspector(fullName.trim(), contactNumber.trim());
            await check();
        } catch (error) {
            Alert.alert('Registration failed', error instanceof Error ? error.message : 'Please try again.');
        } finally {
            if (isMounted.current) setIsSubmitting(false);
        }
    };

    const status = clearance?.status ?? null;
    const needsRegistration = clearance !== null && !clearance.registered;
    const wasRejected = status === 'rejected';
    const isSuspended = status === 'approved' && !clearance?.is_active;

    const heading = needsRegistration
        ? 'Finish Registration'
        : wasRejected
            ? 'Access Declined'
            : isSuspended
                ? 'Access Suspended'
                : 'Pending Approval';

    const message = needsRegistration
        ? 'Your account exists but your personnel record was never opened. Confirm your details to join the approval queue.'
        : wasRejected
            ? 'Operations declined this access request. Contact your Operations Manager if you believe this is a mistake.'
            : isSuspended
                ? 'Your clearance has been stood down by Operations. Contact your Operations Manager to be reinstated.'
                : 'Your account is in the Operations approval queue. This screen unlocks the moment a supervisor clears you for field duty.';

    /* This badge carries real clearance state, which is the one case a status
     * marker earns its place. The decorative dot that used to sit beside it
     * did not. */
    const badge: { label: string; tone: 'warn' | 'danger' } = wasRejected
        ? { label: 'Access denied', tone: 'danger' }
        : isSuspended
            ? { label: 'Stood down', tone: 'danger' }
            : { label: 'Awaiting clearance', tone: 'warn' };

    return (
        <AuthShell
            eyebrow="Utopia operations"
            title={heading}
            subtitle={message}
            badge={badge}
        >
            <View style={styles.section}>
                {clearance?.full_name ? (
                    <View style={styles.dataRow}>
                        <Text style={type.label}>Registered as</Text>
                        <Text style={type.data} numberOfLines={1}>{clearance.full_name}</Text>
                    </View>
                ) : null}

                {offline ? (
                    <View style={[styles.notice, clearance?.full_name ? styles.divider : null]}>
                        <Text style={[type.label, { color: color.warnInk }]}>Offline</Text>
                        <Text style={[type.dataMuted, { marginTop: 2 }]}>
                            Showing your last verified status.
                        </Text>
                    </View>
                ) : null}

                {lastError && !offline ? (
                    <View style={[styles.notice, styles.noticeDanger, clearance?.full_name ? styles.divider : null]}>
                        <Text style={[type.label, { color: color.dangerInk }]}>Status check failed</Text>
                        <Text style={[type.dataMuted, { marginTop: 2 }]}>{lastError}</Text>
                    </View>
                ) : null}

                {needsRegistration ? (
                    <>
                        <View style={[styles.field, styles.divider]}>
                            <Text style={type.label}>Full name</Text>
                            <TextInput
                                style={styles.input}
                                value={fullName}
                                onChangeText={setFullName}
                                autoCapitalize="words"
                            />
                        </View>
                        <View style={[styles.field, styles.divider]}>
                            <Text style={type.label}>Phone number</Text>
                            <TextInput
                                style={styles.input}
                                value={contactNumber}
                                onChangeText={(value) => setContactNumber(digitsOnly(value))}
                                keyboardType="number-pad"
                                maxLength={PHONE_LENGTH}
                            />
                            <Text style={type.dataMuted}>
                                {`${contactNumber.length} of ${PHONE_LENGTH} digits. Mobile number starting with 09.`}
                            </Text>
                        </View>
                    </>
                ) : (
                    <View style={[styles.pollRow, clearance?.full_name || offline || lastError ? styles.divider : null]}>
                        <View style={{ flex: 1 }}>
                            <Text style={type.title}>Approval status</Text>
                            <Text style={type.dataMuted}>
                                {isChecking ? 'Checking with Operations' : 'Rechecked every 20 seconds'}
                            </Text>
                        </View>
                        {isChecking ? <ActivityIndicator size="small" color={color.ink} /> : null}
                    </View>
                )}
            </View>

            <View style={styles.actions}>
                {needsRegistration ? (
                    <Pressable
                        onPress={isSubmitting ? undefined : handleCompleteRegistration}
                        accessibilityRole="button"
                        accessibilityState={{ disabled: isSubmitting }}
                        style={({ pressed }) => [
                            styles.primaryButton,
                            isSubmitting && styles.primaryButtonDisabled,
                            pressed && !isSubmitting && styles.primaryButtonPressed,
                        ]}
                    >
                        <Text style={styles.primaryLabel}>
                            {isSubmitting ? 'Submitting' : 'Submit for approval'}
                        </Text>
                    </Pressable>
                ) : (
                    <Pressable
                        onPress={() => check()}
                        accessibilityRole="button"
                        style={({ pressed }) => [
                            styles.primaryButton,
                            isChecking && styles.primaryButtonDisabled,
                            pressed && !isChecking && styles.primaryButtonPressed,
                        ]}
                    >
                        <Text style={styles.primaryLabel}>Check now</Text>
                    </Pressable>
                )}

                <Pressable
                    onPress={handleSignOut}
                    accessibilityRole="button"
                    /* Widen the touch target: this is the only way off this screen. */
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}
                >
                    <Text style={styles.secondaryLabel}>Sign out</Text>
                </Pressable>
            </View>
        </AuthShell>
    );
}

const styles = StyleSheet.create({
    section: {
        backgroundColor: color.surface,
        borderTopWidth: 1, borderBottomWidth: 1, borderColor: color.line,
    },
    divider: { borderTopWidth: 1, borderTopColor: color.line },

    dataRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        gap: space.md,
        paddingHorizontal: space.lg, paddingVertical: space.md,
    },
    notice: { paddingHorizontal: space.lg, paddingVertical: space.sm, backgroundColor: color.warnBg },
    noticeDanger: { backgroundColor: color.dangerBg },

    pollRow: {
        flexDirection: 'row', alignItems: 'center', gap: space.md,
        paddingHorizontal: space.lg, paddingVertical: space.md,
    },

    field: { paddingHorizontal: space.lg, paddingVertical: space.md, gap: space.xs },
    input: {
        borderWidth: 1, borderColor: color.lineStrong, borderRadius: radius.control,
        backgroundColor: color.surface,
        paddingHorizontal: space.md, paddingVertical: space.sm,
        fontSize: 15, color: color.ink,
    },

    actions: { paddingHorizontal: space.lg, paddingTop: space.lg, gap: space.sm },
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
