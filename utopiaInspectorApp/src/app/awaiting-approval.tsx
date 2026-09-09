import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ApiError, isOffline } from '@/lib/api';
import { fetchClearance, getCachedClearance, isCleared, registerInspector, signOutInspector } from '@/lib/inspectorAccount';
import type { InspectorClearance } from '@/lib/types';
import { PHONE_LENGTH, digitsOnly, validateFullName, validatePhone } from '@/lib/validation';

const primaryColor = '#3f73c4';
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
        check();

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

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                {/* The card grows with its content instead of being pinned to a
                  * fixed height. The registration form pushed the old fixed card
                  * past the viewport, which collapsed the footer's auto margin
                  * on top of the sign-out button and swallowed its taps. */}
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                        <View style={styles.card}>
                            <Image source={require('../../imgfolder/download-removebg-preview.png')} style={styles.logo} resizeMode="contain" />

                            <View style={[styles.securityBadge, wasRejected && styles.badgeDanger]}>
                                <View style={[styles.securityDot, wasRejected && styles.dotDanger]} />
                                <Text style={[styles.securityBadgeText, wasRejected && styles.badgeTextDanger]}>
                                    {wasRejected ? 'ACCESS DENIED' : 'AWAITING CLEARANCE'}
                                </Text>
                            </View>

                            <Text style={styles.eyebrow}>UTOPIA OPERATIONS</Text>
                            <Text style={styles.title}>{heading}</Text>
                            <Text style={styles.subtitle}>{message}</Text>

                            {clearance?.full_name ? (
                                <View style={styles.identityRow}>
                                    <Text style={styles.identityLabel}>REGISTERED AS</Text>
                                    <Text style={styles.identityValue}>{clearance.full_name}</Text>
                                </View>
                            ) : null}

                            {offline ? (
                                <Text style={styles.offlineNote}>Offline — showing your last verified status.</Text>
                            ) : null}

                            {lastError && !offline ? (
                                <Text style={styles.errorNote}>{lastError}</Text>
                            ) : null}

                            {needsRegistration ? (
                                <View style={styles.formBlock}>
                                    <Text style={styles.inputLabel}>Full name</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={fullName}
                                        onChangeText={setFullName}
                                        placeholder="Juan D. Dela Cruz"
                                        placeholderTextColor="#9aa0a6"
                                        autoCapitalize="words"
                                    />
                                    <Text style={styles.inputLabel}>Phone number</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={contactNumber}
                                        onChangeText={(value) => setContactNumber(digitsOnly(value))}
                                        placeholder="09171234567"
                                        placeholderTextColor="#9aa0a6"
                                        keyboardType="number-pad"
                                        maxLength={PHONE_LENGTH}
                                    />
                                    <Pressable
                                        style={[styles.primaryButton, isSubmitting && styles.buttonDisabled]}
                                        onPress={isSubmitting ? undefined : handleCompleteRegistration}
                                    >
                                        <Text style={styles.primaryButtonText}>
                                            {isSubmitting ? 'Submitting…' : 'Submit for Approval'}
                                        </Text>
                                    </Pressable>
                                </View>
                            ) : isChecking ? (
                                <ActivityIndicator size="large" color={primaryColor} style={{ marginTop: 22 }} />
                            ) : (
                                <Pressable style={styles.primaryButton} onPress={() => check()}>
                                    <Text style={styles.primaryButtonText}>Check Approval Status</Text>
                                </Pressable>
                            )}

                            <Pressable
                                style={styles.secondaryButton}
                                onPress={handleSignOut}
                                /* Widen the touch target: this is the only way off
                                 * this screen and it sits near the card edge. */
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                <Text style={styles.secondaryButtonText}>Sign out</Text>
                            </Pressable>

                            <Text style={styles.footer}>Utopia Security And Safety Solutions Inc.  |  Inspector Portal</Text>
                        </View>
                    </TouchableWithoutFeedback>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#0b1d31' },
    flex: { flex: 1 },
    /* flexGrow keeps a short card vertically centred while letting a tall one
     * scroll, rather than forcing one fixed height to serve both. */
    scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 24 },
    card: {
        width: '100%', maxWidth: 430, alignSelf: 'center',
        borderWidth: 1, borderColor: '#d8e3ef', borderRadius: 18, backgroundColor: '#fff',
        paddingHorizontal: 28, paddingTop: 32, paddingBottom: 20,
        shadowColor: '#020b17', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 24, elevation: 8,
    },
    logo: { width: 96, height: 108, alignSelf: 'center', marginBottom: 16 },
    securityBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', marginBottom: 16, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: '#fff7e6' },
    badgeDanger: { backgroundColor: '#fdeeee' },
    securityDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#b45309', marginRight: 7 },
    dotDanger: { backgroundColor: '#b91c1c' },
    securityBadgeText: { color: '#b45309', fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
    badgeTextDanger: { color: '#b91c1c' },
    eyebrow: { color: '#3f73c4', fontSize: 11, fontWeight: '800', letterSpacing: 1.8, textAlign: 'center', marginBottom: 8 },
    title: { color: '#16213b', fontSize: 28, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
    subtitle: { color: '#68788d', fontSize: 14, lineHeight: 20, textAlign: 'center', marginBottom: 18 },
    identityRow: { borderWidth: 1, borderColor: '#dce6f2', backgroundColor: '#f7fafd', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, marginBottom: 14 },
    identityLabel: { color: '#8b9bb0', fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginBottom: 3 },
    identityValue: { color: '#16213b', fontSize: 15, fontWeight: '700' },
    offlineNote: { color: '#b45309', fontSize: 12, textAlign: 'center', marginBottom: 12 },
    errorNote: { color: '#b03c3c', fontSize: 12, lineHeight: 17, textAlign: 'center', marginBottom: 12 },
    formBlock: { width: '100%' },
    inputLabel: { color: '#26384f', fontSize: 12, fontWeight: '700', marginBottom: 6 },
    input: { height: 46, borderWidth: 1, borderColor: '#c4d3e6', borderRadius: 9, paddingHorizontal: 12, fontSize: 15, color: '#24364d', backgroundColor: '#fbfdff', marginBottom: 14 },
    primaryButton: { height: 49, borderRadius: 12, backgroundColor: primaryColor, alignItems: 'center', justifyContent: 'center', marginTop: 8, shadowColor: '#1c4e8d', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 3 },
    buttonDisabled: { opacity: 0.7 },
    primaryButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
    secondaryButton: { height: 46, borderRadius: 10, borderWidth: 1, borderColor: '#dbe4ef', alignItems: 'center', justifyContent: 'center', marginTop: 12 },
    secondaryButtonText: { color: '#68788d', fontSize: 14, fontWeight: '700' },
    /* Plain flow spacing. The old marginTop:'auto' collapsed once content
     * outgrew the card and painted this over the sign-out button. */
    footer: { marginTop: 20, color: '#718198', fontSize: 11, textAlign: 'center' },
});
