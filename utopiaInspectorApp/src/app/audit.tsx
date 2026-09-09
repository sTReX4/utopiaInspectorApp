import { Stack } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Checkbox from 'expo-checkbox';
import * as FileSystem from 'expo-file-system/legacy';
import * as Location from 'expo-location';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useState, useRef } from 'react';
import { useNavigation, useRouter } from 'expo-router';
import { Alert, Button, Keyboard, Platform, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View, ActivityIndicator, Animated } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import CustomTextInput from '../components/custom-text-input';
import LiveCameraModal from '../components/live-camera-modal';
import SignaturePad from '../components/signature-pad';
import SubmissionReceiptModal from '../components/submission-receipt-modal';
import ViolationItemCard from '../components/violation-item-card';
import DateInputGroup from '../components/date-input-group';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';
import { saveAuditLocally } from '../lib/sqlite';
import { triggerAtomicSync } from '../lib/syncManager';
import { loadGuardsForBranch, RosterSource } from '../lib/guardRoster';

const NAME_HISTORY_FILE = FileSystem.documentDirectory + 'nameHistory.json';

const HINTS_DATA: Record<string, string> = {
    lesp: "License to Exercise Security Profession",
    lto: "Land Transportation Office",
    ddo: "Duty Detail Order",
    ltofp: "License to Own and Possess Firearms",
    fa: "Firearm License",
    id: "Company Identification",
    rlm: "Record of Lawful Movement",
    remarks: "General inspector comments or notes",
    violation: "Details regarding any observed infractions"
};

// Custom component for the animated inline hint
const HintLabel = ({ text, hintKey }: { text: string; hintKey: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    const slideAnim = useRef(new Animated.Value(-30)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    const toggleHint = () => {
        if (isOpen) {
            // Animate out
            Animated.parallel([
                Animated.timing(slideAnim, { toValue: -30, duration: 200, useNativeDriver: true }),
                Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true })
            ]).start(() => setIsOpen(false));
        } else {
            // Animate in
            setIsOpen(true);
            Animated.parallel([
                Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
                Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true })
            ]).start();
        }
    };

    return (
        <View style={styles.hintRow}>
            <Text style={styles.labelTitle}>{text}</Text>
            <TouchableOpacity onPress={toggleHint} style={styles.hintButton}>
                <Text style={styles.exclamation}>!</Text>
            </TouchableOpacity>

            {isOpen && (
                <Animated.View style={[styles.message, { opacity: opacityAnim, transform: [{ translateX: slideAnim }] }]}>
                    <Text style={styles.messageText}>{HINTS_DATA[hintKey]}</Text>
                </Animated.View>
            )}
        </View>
    );
};

export default function AuditFormScreen() {
    const navigation = useNavigation();
    const router = useRouter();

    const [submittedPayload, setSubmittedPayload] = useState<any>(null);
    const [savedNames, setSavedNames] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [permission, requestPermission] = useCameraPermissions();
    const [isVerified, setIsVerified] = useState<boolean>(false);
    const [isProcessingScan, setIsProcessingScan] = useState<boolean>(false);
    const [branchCode, setBranchCode] = useState<string>('');
    const [branchName, setBranchName] = useState<string>('');
    const [branchLocation, setBranchLocation] = useState<string>('');

    // Scanner Enhancements State
    const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
    const scanLineAnim = useRef(new Animated.Value(0)).current;

    interface GuardRosterData {
        guard_name: string;
        lesp_expiry_date: string;
    }

    const [guardName, setGuardName] = useState<string>('');
    const [assignedGuards, setAssignedGuards] = useState<GuardRosterData[]>([]);
    const [rosterSource, setRosterSource] = useState<RosterSource | null>(null);
    const [rosterRefreshedAt, setRosterRefreshedAt] = useState<string | null>(null);
    const [isRosterLoading, setIsRosterLoading] = useState<boolean>(false);
    const [isGuardDropdownOpen, setIsGuardDropdownOpen] = useState<boolean>(false);
    const [firearmSerial, setFirearmSerial] = useState<string>('');
    const [firearmMake, setFirearmMake] = useState<string>('');
    const [lespExpDay, setLespExpDay] = useState<string>('');
    const [lespExpMonth, setLespExpMonth] = useState<string>('');
    const [lespExpYear, setLespExpYear] = useState<string>('');
    const [remarks, setRemarks] = useState<string>('');
    const [isUniformCompliant, setIsUniformCompliant] = useState<boolean>(false);
    
    // Document Statuses
    const [ltoStatus, setLtoStatus] = useState<string>('Valid');
    const [ddoStatus, setDdoStatus] = useState<string>('Valid');
    const [ltofpStatus, setLtofpStatus] = useState<string>('Valid');
    const [faStatus, setFaStatus] = useState<string>('Valid');
    const [idStatus, setIdStatus] = useState<string>('Valid');
    const [rlmStatus, setRlmStatus] = useState<string>('Valid');

    // Violation Ticket States
    const [isTicketOpen, setIsTicketOpen] = useState<boolean>(false);
    const [securityLicenseNo, setSecurityLicenseNo] = useState<string>('');
    const [securityLicenseExpiry, setSecurityLicenseExpiry] = useState<string>('');
    const [pershingCap, setPershingCap] = useState<'Yes' | 'No'>('Yes');
    const [validSecurityLicense, setValidSecurityLicense] = useState<'Yes' | 'No'>('Yes');
    const [companyId, setCompanyId] = useState<'Yes' | 'No'>('Yes');
    const [authorizedHairCut, setAuthorizedHairCut] = useState<'Yes' | 'No'>('Yes');
    const [properlyShaved, setProperlyShaved] = useState<'Yes' | 'No'>('Yes');
    const [authorizedUniform, setAuthorizedUniform] = useState<'Yes' | 'No'>('Yes');
    const [authorizedNameCloth, setAuthorizedNameCloth] = useState<'Yes' | 'No'>('Yes');
    const [authorizedAgencyPatch, setAuthorizedAgencyPatch] = useState<'Yes' | 'No'>('Yes');
    const [necktieWithClip, setNecktieWithClip] = useState<'Yes' | 'No'>('Yes');
    const [securityBadge, setSecurityBadge] = useState<'Yes' | 'No'>('Yes');
    const [collarPin, setCollarPin] = useState<'Yes' | 'No'>('Yes');
    const [lanyard, setLanyard] = useState<'Yes' | 'No'>('Yes');
    const [whistle, setWhistle] = useState<'Yes' | 'No'>('Yes');
    const [holster, setHolster] = useState<'Yes' | 'No'>('Yes');
    const [beltClip, setBeltClip] = useState<'Yes' | 'No'>('Yes');
    const [beltWithBuckle, setBeltWithBuckle] = useState<'Yes' | 'No'>('Yes');
    const [garrisonBelt, setGarrisonBelt] = useState<'Yes' | 'No'>('Yes');
    const [authorizedShoes, setAuthorizedShoes] = useState<'Yes' | 'No'>('Yes');
    const [handCuff, setHandCuff] = useState<'Yes' | 'No'>('Yes');
    const [shortCleanFingerNails, setShortCleanFingerNails] = useState<'Yes' | 'No'>('Yes');
    const [medicineKitWithMediplus, setMedicineKitWithMediplus] = useState<'Yes' | 'No'>('Yes');
    const [stunGunWithFlashlight, setStunGunWithFlashlight] = useState<'Yes' | 'No'>('Yes');
    const [violationRemarks, setViolationRemarks] = useState<string>('');

    //Signature State Memory
    const [guardSignature, setGuardSignature] = useState<string | null>(null);
    const [clientSignature, setClientSignature] = useState<string | null>(null);
    const [isClientAbsent, setIsClientAbsent] = useState<boolean>(false);
    const [activeSigner, setActiveSigner] = useState<'guard' | 'client' | null>(null);

    //Live Photo Camera
    const [livePhotoUri, setLivePhotoUri] = useState<string | null>(null);
    const [isCameraModalOpen, setIsCameraModalOpen] = useState<boolean>(false);

    // Coordinates Tracker
    const [locationPermission, requestLocationPermission ] = Location.useForegroundPermissions();
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [timeIn, setTimeIn] = useState<string | null>(null);

    //No-show Guard
    const [isGuardPresent, setIsGuardPresent] = useState<boolean>(true);
    const [isAtmOnline, setIsAtmOnline] = useState<boolean>(false);
    const [isAtmOffline, setIsAtmOffline] = useState<boolean>(false);
    const [isDoorSecure, setIsDoorSecure] = useState<boolean>(false);

    const [visitType, setVisitType] = useState<'Routine' | 'Alarm Response'>('Routine');
    const [incidentRemarks, setIncidentRemarks] = useState('');

    const [inspectorName, setInspectorName] = useState<string>('Unknown Inspector');

    useEffect(() => {
        const fetchIdentity = async () => {
            try {
                const storedName = await AsyncStorage.getItem('inspector_name');
                if (storedName) {
                    setInspectorName(storedName);
                }
            } catch (error) {
                console.error("Failed to load inspector identity", error);
            }
        };
        fetchIdentity();
    }, []);

    // Animated Laser Sweep Effect
    useEffect(() => {
        if (!isVerified) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(scanLineAnim, {
                        toValue: 250, 
                        duration: 2000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(scanLineAnim, {
                        toValue: 0,
                        duration: 2000,
                        useNativeDriver: true,
                    })
                ])
            ).start();
        }
    }, [isVerified, scanLineAnim]);

    useEffect(() => {
        const fetchAssignedGuards = async () => {
            if (!isVerified || !branchName) return;

            setIsRosterLoading(true);
            try {
                // Reads the local mirror, refreshing it first when there is signal.
                const roster = await loadGuardsForBranch(branchName);
                setAssignedGuards(roster.guards as GuardRosterData[]);
                setRosterSource(roster.source);
                setRosterRefreshedAt(roster.refreshedAt);
            } catch (error) {
                // Only reachable if local storage itself fails.
                console.error('Failed to load guard roster', error);
                setAssignedGuards([]);
                setRosterSource(null);
                setRosterRefreshedAt(null);
            } finally {
                setIsRosterLoading(false);
            }
        };

        fetchAssignedGuards();
    }, [isVerified, branchName]);

    const clearAuditInputs = () => {
        setGuardName('');
        setIsGuardDropdownOpen(false);
        setFirearmSerial('');
        setFirearmMake('');
        setLespExpDay('');
        setLespExpMonth('');
        setLespExpYear('');
        setRemarks('');
        setIsUniformCompliant(false);
        setLtoStatus('Valid');
        setDdoStatus('Valid');
        setLtofpStatus('Valid');
        setFaStatus('Valid');
        setIdStatus('Valid');
        setRlmStatus('Valid');
        setIsTicketOpen(false);
        setSecurityLicenseNo('');
        setSecurityLicenseExpiry('');
        setPershingCap('Yes');
        setValidSecurityLicense('Yes');
        setCompanyId('Yes');
        setAuthorizedHairCut('Yes');
        setProperlyShaved('Yes');
        setAuthorizedUniform('Yes');
        setAuthorizedNameCloth('Yes');
        setAuthorizedAgencyPatch('Yes');
        setNecktieWithClip('Yes');
        setSecurityBadge('Yes');
        setCollarPin('Yes');
        setLanyard('Yes');
        setWhistle('Yes');
        setHolster('Yes');
        setBeltClip('Yes');
        setBeltWithBuckle('Yes');
        setGarrisonBelt('Yes');
        setAuthorizedShoes('Yes');
        setHandCuff('Yes');
        setShortCleanFingerNails('Yes');
        setMedicineKitWithMediplus('Yes');
        setStunGunWithFlashlight('Yes');
        setViolationRemarks('');
        setGuardSignature(null);
        setClientSignature(null);
        setIsClientAbsent(false);
        setLivePhotoUri(null);
        setIsAtmOnline(false);
        setIsAtmOffline(false);
        setIsDoorSecure(false);
    };

    const handleClearAll = () => {
        Alert.alert(
            'System Flush',
            'Wipe local device memory and clear the corrupted Inspector identity?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Wipe Memory',
                    style: 'destructive',
                    onPress: async () => {
                        clearAuditInputs();
                        await AsyncStorage.clear();
                        router.replace('/login');
                    },
                },
            ]
        );
    };

    const submitAuditPayload = async () => {
        setIsSubmitting(true);
        let base64Photo = null;
        try {
            const compressedImage = await ImageManipulator.manipulateAsync(
                livePhotoUri!,
                [{ resize: { width: 800 } }],
                { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
            );

            base64Photo = await FileSystem.readAsStringAsync(compressedImage.uri, { encoding: FileSystem.EncodingType.Base64 });
        } catch (error) {
            console.error('Error reading live photo file:', error);
            Alert.alert('File Read Error', 'Failed to process the captured photo.');
            setIsSubmitting(false);
            return;
        }

        const formattedLespExpiry = `${lespExpDay}/${lespExpMonth}/${lespExpYear}`;

        const payload = {
            branch_code: branchCode,
            branch_name: branchName,
            branch_location: branchLocation,
            inspector_name: inspectorName,
            inspector_in_time: timeIn,
            inspector_out_time: new Date().toISOString(),
            gps_coordinates: location
                ? {
                      latitude: location.coords.latitude,
                      longitude: location.coords.longitude,
                      accuracy: location.coords.accuracy,
                  }
                : null,
            guard_present_status: !isGuardPresent
                ? {
                      atm_online: isAtmOnline,
                      atm_offline: isAtmOffline,
                      door_secure: isDoorSecure,
                  }
                : null,
            guard_name: isGuardPresent ? guardName : null,
            lesp_expiry: isGuardPresent ? formattedLespExpiry : null,
            uniform_compliance: isGuardPresent ? isUniformCompliant : null,
            firearm_serial: isGuardPresent ? firearmSerial : null,
            firearm_make: isGuardPresent ? firearmMake : null,
            metrics: isGuardPresent
                ? {
                      lto_license: ltoStatus,
                      ddo_license: ddoStatus,
                      ltofp_license: ltofpStatus,
                      fa_license: faStatus,
                      id_license: idStatus,
                      rlm_license: rlmStatus,
                  }
                : null,
            remarks: remarks,
            violation_ticket: isGuardPresent && isTicketOpen
                ? {
                      security_license_no: securityLicenseNo,
                      security_license_expiry: securityLicenseExpiry,
                      pershing_cap: pershingCap,
                      company_id: companyId,
                      authorized_hair_cut: authorizedHairCut,
                      properly_shaved: properlyShaved,
                      authorized_uniform: authorizedUniform,
                      authorized_name_cloth: authorizedNameCloth,
                      authorized_agency_patch: authorizedAgencyPatch,
                      necktie_with_clip: necktieWithClip,
                      security_badge: securityBadge,
                      collar_pin: collarPin,
                      lanyard: lanyard,
                      whistle: whistle,
                      holster: holster,
                      belt_clip: beltClip,
                      belt_with_buckle: beltWithBuckle,
                      garrison_belt: garrisonBelt,
                      authorized_shoes: authorizedShoes,
                      hand_cuff: handCuff,
                      short_clean_finger_nails: shortCleanFingerNails,
                      medicine_kit_with_mediplus: medicineKitWithMediplus,
                      stun_gun_with_flashlight: stunGunWithFlashlight,
                      violation_remarks: violationRemarks,
                  }
                : null,
            live_photo_uri: `data:image/jpeg;base64,${base64Photo}`,
            guard_signature: isGuardPresent ? guardSignature : null,
            client_signature: isClientAbsent ? 'UNAVAILABLE_ON_SITE' : clientSignature,

            visit_type: visitType,
            incident_remarks: incidentRemarks
        };

        const network = await Network.getNetworkStateAsync();
        const isOffline = !network.isConnected || !network.isInternetReachable;
        const isAlarmResponse = visitType === 'Alarm Response';

        // --- OFFLINE ARCHITECTURE INTERCEPT ---
        if (isOffline) {
            try {
                await saveAuditLocally(payload, isAlarmResponse);
            } catch (error) {
                // Surface the failure instead of letting it escape as an
                // unhandled rejection, which leaves the form stuck submitting
                // and the inspector believing the report was cached.
                console.error('Offline cache write failed:', error);
                Alert.alert(
                    'Local Save Failed',
                    'This audit could not be written to local storage, so it has NOT been saved. Please try submitting again.'
                );
                setIsSubmitting(false);
                return;
            }

            Alert.alert(
                'Offline Mode Active',
                'Network dead zone detected. Audit securely encrypted to local storage and will sync automatically once signal is restored.'
            );

            // Ensure UI safely resets for the next field audit
            clearAuditInputs();
            setIsSubmitting(false);
            return;
        }

        // --- STANDARD ONLINE TRANSMISSION ---
        try {
            const API_URL = 'https://utopia-inspector-app.vercel.app/api/audits';
            
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            
            if (response.ok) {
                await triggerAtomicSync();
                
                clearAuditInputs();
                Alert.alert('Audit Submitted', 'Data safely transmitted to Command Center.', [
                    {
                        text: 'View Receipt',
                        onPress: () => setSubmittedPayload(payload),
                    },
                    {
                        text: 'OK',
                        style: 'cancel',
                    },
                ]);
            } else {
                const responseText = await response.text();
                console.error('Server Error Text:', responseText);
                Alert.alert('Server Error', `Response: ${responseText.substring(0, 100)}`);
            }
        } catch (error) {
            console.error('Submission Error:', error);
            Alert.alert('Transmission Error', 'Failed to reach headquarters. Please ensure stable connectivity and try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAtmOnlineToggle = (newValue: boolean) => {
        setIsAtmOnline(newValue);
        if (newValue) setIsAtmOffline(false);
    };

    const handleAtmOfflineToggle = (newValue: boolean) => {
        setIsAtmOffline(newValue);
        if (newValue) setIsAtmOnline(false);
    };

    const handleBarcodeScanned = async ({ data }: { data: string }) => {
        if (isVerified || isProcessingScan) return;

        setIsProcessingScan(true);

        // TRIGGER HAPTIC VIBRATION UPON SCAN
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        try {
            const parsedData = JSON.parse(data);
            
            if (parsedData.code && parsedData.name && parsedData.location) {

                if (!locationPermission?.granted) {
                    Alert.alert(
                        "GPS Required", 
                        "You must enable location services to verify your arrival at the detachment.",
                        [{ text: "OK", onPress: () => setIsProcessingScan(false) }]
                    );
                    return;
                }

                setTimeIn(new Date().toISOString());
                
                let currentLocation = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.High
                });
                setLocation(currentLocation);

                setBranchCode(parsedData.code);
                setBranchName(parsedData.name);
                setBranchLocation(parsedData.location);
                setIsVerified(true);
                Alert.alert("Detachment Verified", `Welcome to ${parsedData.name}\nGPS Secured.`);
            } else {
                Alert.alert("Invalid QR Code", "This QR code does not belong to a valid detachment.", [{ text: "Try Again", onPress: () => setIsProcessingScan(false) }]);
            }
        } catch (error) {
            Alert.alert("Scan Failed", "Unrecognized QR format. Please scan an official Utopia detachment code.", [{ text: "Try Again", onPress: () => setIsProcessingScan(false) }]);
        }
    };

    const handleSubmit = async () => {
        if (isGuardPresent && !guardSignature) {
            Alert.alert('Missing Signature', 'The Guard on duty MUST sign the audit.');
            return;
        }

        if (!isClientAbsent && !clientSignature) {
            Alert.alert('Missing Signature', 'The client representative must sign, or mark them as unavailable on site.');
            return;
        }

        if (!livePhotoUri) {
            Alert.alert('Missing Evidence', 'You must capture a live photo of the guard on post before submitting the audit.');
            return;
        }

        Alert.alert('Submit Audit', 'Are you sure you want to submit this audit now?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Submit', onPress: submitAuditPayload },
        ]);
    };

    if (!permission || !locationPermission) {
        return <View style={styles.container}><Text>Loading Camera...</Text></View>;
    }

    if (!permission.granted) {
        return (
            <View style={[styles.container, { justifyContent: 'center'}]}>
                <Text style={{ textAlign: 'center', marginBottom: 20 }}>Camera and GPS access are strictly required to conduct this audit.</Text>
                <Button title="Grant Permissions" onPress={() => { requestPermission(); requestLocationPermission(); }} color="#0056b3"/>
            </View>
        );
    }

    if (!isVerified) {
        return (
            <View style={{flex: 1, backgroundColor: '#000'}}>
                <CameraView
                    style={StyleSheet.absoluteFill}
                    barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                    onBarcodeScanned={handleBarcodeScanned}
                    enableTorch={isTorchOn} // Flaslight control integration
                />
                <View style={styles.overlay}>
                    <View style={styles.unfocusedContainer} />
                    <View style={styles.middleContainer}>
                        <View style={styles.unfocusedContainer} />
                        
                        <View style={styles.focusedContainer}>
                            {/* Animated Green Laser Line */}
                            <Animated.View style={[
                                styles.scanLine,
                                { transform: [{ translateY: scanLineAnim }] }
                            ]} />
                        </View>
                        
                        <View style={styles.unfocusedContainer} />
                    </View>
                    <View style={styles.bottomContainer}>
                        <Text style={styles.scannerText}>Scan Detachment QR Code to Begin Audit</Text>
                        
                        {/* Flashlight Toggle */}
                        <TouchableOpacity 
                            style={styles.torchButton}
                            onPress={() => setIsTorchOn(!isTorchOn)}
                        >
                            <Text style={styles.torchButtonText}>
                                {isTorchOn ? "🔦 Turn Flashlight Off" : "🔦 Turn Flashlight On"}
                            </Text>
                        </TouchableOpacity>

                        <Button
                            title="DEV BYPASS (FOR TESTING ONLY)"
                            color="red"
                            onPress={() => {
                                setBranchCode("DEV-001");
                                setBranchName("Development Branch");
                                setBranchLocation("Localhost");
                                setTimeIn(new Date().toISOString());
                                setIsVerified(true);
                            }}
                        />
                    </View>
                </View>
            </View>
        );
    }

    return (
    <>
        <Stack.Screen
            options={{
                title: 'Digital Audit',
                headerRight: () => (
                    <TouchableOpacity onPress={handleClearAll} style={{ marginRight: 15 }}>
                        <Text style={{ color: '#d32f2f', fontWeight: 'bold', fontSize: 12 }}>
                            Clear
                        </Text>
                    </TouchableOpacity>
                ),
            }}
        />

        <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAwareScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            enableOnAndroid
            enableAutomaticScroll
            enableResetScrollToCoords={false}
            extraScrollHeight={24}
            extraHeight={24}
        >

            <View style={{ marginBottom: 20, padding: 15, backgroundColor: '#fff', borderRadius: 8}}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>Guard Duty Status</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                    <Checkbox value={isGuardPresent} onValueChange={setIsGuardPresent} color={isGuardPresent ? '#28a745' : undefined} />
                    <Text style={{ marginLeft: 10, fontSize: 16 }}>Guard is Present</Text>
                </View>
            </View> 

            <View style={styles.detachmentHeader}>
                <Text style={styles.detachmentTitle}>{branchName} ({branchCode})</Text>
                <Text style={styles.detachmentSubtitle}>{branchLocation}</Text>
            </View>

            {/* --- NEW: ACTIVE DISPATCH SELECTOR --- */}
            <View style={{ marginBottom: 20, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc', padding: 15 }}>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: 10 }}>Visit Classification</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity 
                        style={{ flex: 1, padding: 12, borderWidth: 1, borderColor: visitType === 'Routine' ? '#0f172a' : '#cbd5e1', backgroundColor: visitType === 'Routine' ? '#0f172a' : '#ffffff', alignItems: 'center' }}
                        onPress={() => setVisitType('Routine')}
                    >
                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: visitType === 'Routine' ? '#ffffff' : '#64748b' }}>ROUTINE</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={{ flex: 1, padding: 12, borderWidth: 1, borderColor: visitType === 'Alarm Response' ? '#dc2626' : '#cbd5e1', backgroundColor: visitType === 'Alarm Response' ? '#dc2626' : '#ffffff', alignItems: 'center' }}
                        onPress={() => setVisitType('Alarm Response')}
                    >
                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: visitType === 'Alarm Response' ? '#ffffff' : '#64748b' }}>ALARM RESPONSE</Text>
                    </TouchableOpacity>
                </View>
            </View>

        {visitType === 'Alarm Response' ? (
            <View style={{ marginBottom: 20, borderWidth: 1, borderColor: '#fca5a5', backgroundColor: '#fef2f2', padding: 15 }}>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#991b1b', textTransform: 'uppercase', marginBottom: 10 }}>Incident Resolution Report</Text>
                <TextInput
                    style={{ borderWidth: 1, borderColor: '#f87171', backgroundColor: '#ffffff', padding: 12, fontSize: 14, minHeight: 100, textAlignVertical: 'top' }}
                    placeholder="Detail the branch concern, findings, and resolution..."
                    multiline
                    value={incidentRemarks}
                    onChangeText={setIncidentRemarks}
                />
            </View>
        ) : isGuardPresent ? (

            <View>
                <Text style={styles.header}>Audit Form</Text>

                <View style={{ marginBottom: 20 }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8, color: '#333' }}>Guard on Post</Text>
                    
                    <TouchableOpacity
                        style={{
                            backgroundColor: '#fff',
                            borderWidth: 1,
                            borderColor: '#ccc',
                            borderRadius: 8,
                            padding: 15,
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}
                        onPress={() => setIsGuardDropdownOpen(!isGuardDropdownOpen)}
                    >
                        <Text style={{ fontSize: 16, color: guardName ? '#0f172a' : '#94a3b8', fontWeight: guardName ? '600' : 'normal' }}>
                            {guardName ? guardName : 'Tap to select guard from roster...'}
                        </Text>
                        <Text style={{ color: '#64748b', fontSize: 18, fontWeight: 'bold' }}>
                            {isGuardDropdownOpen ? '▲' : '▼'}
                        </Text>
                    </TouchableOpacity>

                    {isGuardDropdownOpen && (
                        <View style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, marginTop: 5, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}>
                            {rosterSource === 'cache' && (
                                <Text style={{ paddingHorizontal: 15, paddingTop: 12, color: '#b45309', fontSize: 12, fontWeight: '600' }}>
                                    {`Offline. Showing the roster saved on this device${
                                        rosterRefreshedAt
                                            ? ` on ${new Date(rosterRefreshedAt).toLocaleString()}`
                                            : ''
                                    }.`}
                                </Text>
                            )}

                            {isRosterLoading ? (
                                <Text style={{ padding: 15, color: '#64748b', fontStyle: 'italic' }}>
                                    Loading roster...
                                </Text>
                            ) : assignedGuards.length === 0 ? (
                                <Text style={{ padding: 15, color: '#ef4444', fontStyle: 'italic', fontWeight: '500' }}>
                                    {rosterSource === 'cache' && !rosterRefreshedAt
                                        ? 'No roster saved on this device yet. Connect to the internet once to download it before heading to a dead zone.'
                                        : 'No guards officially deployed to this detachment in the system.'}
                                </Text>
                            ) : (
                                assignedGuards.map((guard, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={{
                                            padding: 16,
                                            borderBottomWidth: index === assignedGuards.length - 1 ? 0 : 1,
                                            borderBottomColor: '#f1f5f9',
                                            backgroundColor: guardName === guard.guard_name ? '#f8fafc' : '#fff'
                                        }}
                                        onPress={() => {
                                            setGuardName(guard.guard_name);
                                            setIsGuardDropdownOpen(false);
                                            
                                            if (guard.lesp_expiry_date) {
                                                const [year, month, day] = guard.lesp_expiry_date.split('-');
                                                setLespExpYear(year);
                                                setLespExpMonth(month);
                                                setLespExpDay(day);
                                            } else {
                                                setLespExpYear('');
                                                setLespExpMonth('');
                                                setLespExpDay('');
                                            }
                                        }}
                                    >
                                        <Text style={{ fontSize: 15, color: guardName === guard.guard_name ? '#0ea5e9' : '#334155', fontWeight: guardName === guard.guard_name ? 'bold' : '500' }}>
                                            {guard.guard_name}
                                        </Text>
                                    </TouchableOpacity>
                                ))
                            )}
                        </View>
                    )}
                </View>

                <HintLabel text="LESP Expiry Date" hintKey="lesp" />
                <DateInputGroup 
                    label=""
                    day={lespExpDay}
                    month={lespExpMonth}
                    year={lespExpYear}
                    onDayChange={setLespExpDay}
                    onMonthChange={setLespExpMonth}
                    onYearChange={setLespExpYear}
                />

                <View style={styles.checkboxContainer}>
                    <Checkbox
                        value={isUniformCompliant}
                        onValueChange={setIsUniformCompliant}
                        color={isUniformCompliant ? '#0056b3' : undefined}
                    />
                    <Text style={styles.checkboxLabel}>Proper Uniform Authorized?</Text>
                </View>

                <Text style={styles.subHeader}>Documents</Text>

                <HintLabel text="LTO" hintKey="lto" />
                <View style={styles.radioGroup}>
                    {['Valid', 'Expired', 'Missing'].map((status) => (
                        <TouchableOpacity
                            key={status}
                            style={[styles.radioButton, ltoStatus === status && styles.radioButtonActive]}
                            onPress={() => setLtoStatus(status)}
                        >
                            <Text style={[styles.radioText, ltoStatus === status && styles.radioTextActive]}>{status}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <HintLabel text="DDO" hintKey="ddo" />
                <View style={styles.radioGroup}>
                    {['Valid', 'Expired', 'Missing'].map((status) => (
                        <TouchableOpacity
                            key={status}
                            style={[styles.radioButton, ddoStatus === status && styles.radioButtonActive]}
                            onPress={() => setDdoStatus(status)}
                        >
                            <Text style={[styles.radioText, ddoStatus === status && styles.radioTextActive]}>{status}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <HintLabel text="LTOFP" hintKey="ltofp" />
                <View style={styles.radioGroup}>
                    {['Valid', 'Expired', 'Missing'].map((status) => (
                        <TouchableOpacity
                            key={status}
                            style={[styles.radioButton, ltofpStatus === status && styles.radioButtonActive]}
                            onPress={() => setLtofpStatus(status)}
                        >
                            <Text style={[styles.radioText, ltofpStatus === status && styles.radioTextActive]}>{status}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <HintLabel text="FA LICENSE" hintKey="fa" />
                <View style={styles.radioGroup}>
                    {['Valid', 'Expired', 'Missing'].map((status) => (
                        <TouchableOpacity
                            key={status}
                            style={[styles.radioButton, faStatus === status && styles.radioButtonActive]}
                            onPress={() => setFaStatus(status)}
                        >
                            <Text style={[styles.radioText, faStatus === status && styles.radioTextActive]}>{status}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <HintLabel text="COMPANY ID" hintKey="id" />
                <View style={styles.radioGroup}>
                    {['Valid', 'Expired', 'Missing'].map((status) => (
                        <TouchableOpacity
                            key={status}
                            style={[styles.radioButton, idStatus === status && styles.radioButtonActive]}
                            onPress={() => setIdStatus(status)}
                        >
                            <Text style={[styles.radioText, idStatus === status && styles.radioTextActive]}>{status}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <HintLabel text="RLM" hintKey="rlm" />
                <View style={styles.radioGroup}>
                    {['Valid', 'Expired', 'Missing'].map((status) => (
                        <TouchableOpacity
                            key={status}
                            style={[styles.radioButton, rlmStatus === status && styles.radioButtonActive]}
                            onPress={() => setRlmStatus(status)}
                        >
                            <Text style={[styles.radioText, rlmStatus === status && styles.radioTextActive]}>{status}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <HintLabel text="Remarks" hintKey="remarks" />
                <CustomTextInput
                    value={remarks}
                    onChangeText={setRemarks}
                    multiline={true}
                />

                <TouchableOpacity 
                    style={styles.dropdownButton} 
                    onPress={() => setIsTicketOpen(!isTicketOpen)}
                >
                    <Text style={styles.dropdownText}>
                        {isTicketOpen ? "[-]" : "[+]"} Log Guard Violations
                    </Text>
                </TouchableOpacity>

                {isTicketOpen && (
                    <View style={styles.checkboxGroup}>
                        <Text style={styles.subHeader}>Violation Ticket</Text>

                        <CustomTextInput
                            label="Security License No."
                            value={securityLicenseNo}
                            onChangeText={setSecurityLicenseNo}
                        />

                        <CustomTextInput
                            label="Security License Expiry"
                            value={securityLicenseExpiry}
                            onChangeText={setSecurityLicenseExpiry}
                        />

                        <Text style={styles.subHeader}>Presentable/Operational/Applicable</Text>

                        <ViolationItemCard itemName="1. Valid Security License" status={validSecurityLicense} onUpdate={setValidSecurityLicense} />
                        <ViolationItemCard itemName="2. Company ID" status={companyId} onUpdate={setCompanyId} />
                        <ViolationItemCard itemName="3. Pershing Cap" status={pershingCap} onUpdate={setPershingCap} />
                        <ViolationItemCard itemName="4. Authorized Hair Cut" status={authorizedHairCut} onUpdate={setAuthorizedHairCut} />
                        <ViolationItemCard itemName="5. Properly Shaved" status={properlyShaved} onUpdate={setProperlyShaved} />
                        <ViolationItemCard itemName="6. Authorized Uniform" status={authorizedUniform} onUpdate={setAuthorizedUniform} />
                        <ViolationItemCard itemName="7. Authorized Name Cloth" status={authorizedNameCloth} onUpdate={setAuthorizedNameCloth} />
                        <ViolationItemCard itemName="8. Authorized Agency Patch" status={authorizedAgencyPatch} onUpdate={setAuthorizedAgencyPatch} />
                        <ViolationItemCard itemName="9. Necktie With Clip" status={necktieWithClip} onUpdate={setNecktieWithClip} />
                        <ViolationItemCard itemName="10. Security Badge" status={securityBadge} onUpdate={setSecurityBadge} />
                        <ViolationItemCard itemName="11. Collar Pin 2 pcs." status={collarPin} onUpdate={setCollarPin} />
                        <ViolationItemCard itemName="12. Lanyard (Navy Blue)" status={lanyard} onUpdate={setLanyard} />
                        <ViolationItemCard itemName="13. Whistle" status={whistle} onUpdate={setWhistle} />
                        <ViolationItemCard itemName="14. Holster" status={holster} onUpdate={setHolster} />
                        <ViolationItemCard itemName="15. Belt Clip 6 pcs." status={beltClip} onUpdate={setBeltClip} />
                        <ViolationItemCard itemName="16. Belt with buckle" status={beltWithBuckle} onUpdate={setBeltWithBuckle} />
                        <ViolationItemCard itemName="17. Garrison Belt" status={garrisonBelt} onUpdate={setGarrisonBelt} />
                        <ViolationItemCard itemName="18. Authorized Shoes" status={authorizedShoes} onUpdate={setAuthorizedShoes} />
                        <ViolationItemCard itemName="19. Hand Cuff" status={handCuff} onUpdate={setHandCuff} />
                        <ViolationItemCard itemName="20. Short/Clean finger Nails" status={shortCleanFingerNails} onUpdate={setShortCleanFingerNails} />
                        <ViolationItemCard itemName="21. Medicine Kit With Mediplus" status={medicineKitWithMediplus} onUpdate={setMedicineKitWithMediplus} />
                        <ViolationItemCard itemName="22. Stun Gun With Flashlight" status={stunGunWithFlashlight} onUpdate={setStunGunWithFlashlight} />

                        <HintLabel text="Violation" hintKey="violation" />
                        <CustomTextInput
                            value={violationRemarks}
                            onChangeText={setViolationRemarks}
                            multiline={true}
                        />
                    </View>
                )}
            </View>

        ) : (
            <View style={{ marginBottom: 20, padding: 15, backgroundColor: '#fff3cd', borderRadius: 8, borderLeftWidth: 5, borderLeftColor: '#ffc107'}}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#856404', marginBottom: 15 }}>
                    Bank Detachment Status (Guard Absent)
                </Text>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15}}>
                    <Checkbox value={isAtmOnline} onValueChange={handleAtmOnlineToggle} />
                    <Text style={{ marginLeft: 10, fontSize: 16, fontWeight: '500' }}>ATM is Online</Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15}}>
                    <Checkbox value={isAtmOffline} onValueChange={handleAtmOfflineToggle}/>
                    <Text style={{ marginLeft: 10, fontSize: 16, fontWeight: '500' }}>ATM is Offline</Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center'}}>
                    <Checkbox value={isDoorSecure} onValueChange={setIsDoorSecure} />
                    <Text style={{ marginLeft: 10, fontSize: 16, fontWeight: '500' }}>DOOR GLASS PADLOCK NO PROBLEM</Text>
                </View>
            </View>
        )}

            <Text style={styles.subHeader}>Live Photo Capture</Text>

            <Text style={{ fontStyle: 'italic', color: '#666', marginBottom: 15}}>
                {isGuardPresent ? "Capture a live photo of the guard on post for verification." 
                : "Capture a live photo of the detachment to document the absence of the guard."}
            </Text>

            <View style={styles.signatureTriggerRow}>   
                <Text style={styles.triggerLabel}>
                    {isGuardPresent ? "Guard on Post:" : "Site Condition:"}
                </Text>
                <TouchableOpacity 
                    style={[styles.triggerButton, livePhotoUri && styles.triggerButtonSuccess]} 
                    onPress={() => setIsCameraModalOpen(true)}
                >
                    <Text style={styles.triggerButtonText}>
                        {livePhotoUri ? "✅ Photo Captured" : "📷 Tap to Open Camera"}
                    </Text>
                </TouchableOpacity>
            </View>

            <LiveCameraModal
                visible={isCameraModalOpen}
                onClose={() => setIsCameraModalOpen(false)}
                onCapture={(uri) => {setLivePhotoUri(uri);}}
            />

            <Text style={styles.subHeader}>E-Signatures</Text>

            {isGuardPresent && (
                <View style={styles.signatureTriggerRow}>
                    <Text style={styles.triggerLabel}>Guard on Duty:</Text>
                    <TouchableOpacity 
                        style={[styles.triggerButton, guardSignature && styles.triggerButtonSuccess]} 
                        onPress={() => setActiveSigner('guard')}
                    >
                        <Text style={styles.triggerButtonText}>
                            {guardSignature ? "✅ Signature Captured" : "Tap to Sign"}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

                <View style={styles.checkboxContainer}>
                    <Checkbox
                        value={isClientAbsent}
                        onValueChange={(absent) => {
                            setIsClientAbsent(absent);
                            if (absent) setClientSignature(null);
                        }}
                        color={isClientAbsent ? '#dc3545' : undefined}
                    />
                    <Text style={styles.checkboxLabel}>Client is currently UNAVAILABLE on site</Text>
                </View>

                {!isClientAbsent && (
                    <View style={styles.signatureTriggerRow}>
                        <Text style={styles.triggerLabel}>Client Rep:</Text>
                        <TouchableOpacity 
                            style={[styles.triggerButton, clientSignature && styles.triggerButtonSuccess]} 
                            onPress={() => setActiveSigner('client')}
                        >
                            <Text style={styles.triggerButtonText}>
                                {clientSignature ? "✅ Signature Captured" : "Tap to Sign"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

            <View style={styles.buttonContainer}>
                {/* DYNAMIC RED BUTTON TO PREVENT SPAM CLICKING */}
                <TouchableOpacity
                    style={[
                        styles.submitButton,
                        { backgroundColor: isSubmitting ? '#ef4444' : '#0f172a' } 
                    ]}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                            <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 10 }} />
                            <Text style={styles.submitButtonText}>Submitting...</Text>
                        </View>
                    ) : (
                        <Text style={styles.submitButtonText}>Submit Audit Report</Text>
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAwareScrollView>
        </TouchableWithoutFeedback>

            {activeSigner !== null && (
                <SignaturePad
                    key={activeSigner}
                    title={activeSigner === 'guard' ? 'Guard on Duty Signature' : 'Client / Representative Signature'}
                    visible={true}
                    onClose={() => setActiveSigner(null)}
                    onSign={activeSigner === 'guard' ? setGuardSignature : setClientSignature}
                />
            )}

        

        </View>
    </>
    );
}

const colors = {
    cloud: '#f8fafc',
    white: '#ffffff',
    navy: '#0f172a',
    charcoal: '#334155',
    steel: '#64748b',
    silver: '#cbd5e1',
    fog: '#e2e8f0',
    mist: '#f1f5f9',
    overlay: 'rgba(15, 23, 42, 0.75)',
    overlaySoft: 'rgba(15, 23, 42, 0.08)',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.cloud
  },
  contentContainer: {
    paddingBottom: 120,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: colors.navy,
  },
  subHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: colors.navy,
  },

  // Slide Animation Inline Hint Styles
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 8,
    marginLeft: 5,
    zIndex: 10,
  },
  labelTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.navy,
  },
  hintButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  exclamation: {
    color: colors.navy,
    fontSize: 16,
    fontWeight: 'bold',
  },
  message: {
    backgroundColor: colors.navy,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 4,
    flexShrink: 1,
  },
  messageText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
  },

  checkboxGroup: {
    backgroundColor: colors.white,
    padding: 15,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.fog,
    marginBottom: 15,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    padding: 10,
  },
  checkboxLabel: {
    marginLeft: 10,
    fontSize: 16,
    color: colors.charcoal,
  },
  radioGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  radioButton: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 4,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.fog,
    borderRadius: 5,
    alignItems: 'center',
  },
  radioButtonActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  radioText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.steel,
  },
  radioTextActive: {
    color: colors.white,
  },
  buttonContainer: {
    marginBottom: 60,
  },
  submitButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: colors.navy,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  clearButtonContainer: {
    padding: 10,
    backgroundColor: colors.white,
  },
  // Destructive action: outline + bold weight carries the emphasis, no red
  clearButton: {
    padding: 10,
    backgroundColor: colors.white,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: colors.navy,
    alignItems: 'center',
  },
  clearButtonText: {
    color: colors.navy,
    fontSize: 16,
    fontWeight: 'bold',
  },
  dropdownButton: {
    backgroundColor: colors.white,
    padding: 15,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: colors.navy,
    alignItems: 'center',
    marginBottom: 20,
  },
  dropdownText: { fontSize: 16, fontWeight: 'bold', color: colors.navy },
  violationSection: {
    backgroundColor: colors.mist,
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.fog,
  },
  signatureTriggerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15, backgroundColor: colors.white, padding: 15, borderRadius: 5, borderWidth: 1, borderColor: colors.fog },
  triggerLabel: { fontSize: 16, fontWeight: 'bold', color: colors.navy },
  triggerButton: { paddingVertical: 10, paddingHorizontal: 15, backgroundColor: colors.mist, borderRadius: 5, borderWidth: 1, borderColor: colors.silver },
  triggerButtonSuccess: { backgroundColor: colors.navy, borderColor: colors.navy },
  triggerButtonText: { fontSize: 14, fontWeight: 'bold', color: colors.charcoal },

  // Camera Overlay Enhanced Styles
  scannerOverlay: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    backgroundColor: colors.overlay,
    padding: 15,
    borderRadius: 10,
  },
  scannerText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  scanLine: {
    width: '100%',
    height: 3,
    backgroundColor: colors.white,
    shadowColor: colors.white,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 5,
  },
  torchButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.white,
    alignSelf: 'center',
  },
  torchButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },

  detachmentHeader: {
    backgroundColor: colors.mist,
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 5,
    borderLeftColor: colors.navy,
  },
  detachmentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.navy,
  },
  detachmentSubtitle: {
    fontSize: 14,
    color: colors.steel,
    marginTop: 5,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  unfocusedContainer: {
    flex: 1,
    backgroundColor: colors.overlaySoft,
  },
  middleContainer: {
    flexDirection: 'row',
    flex: 1.5,
  },
  focusedContainer: {
    flex: 2,
    borderColor: colors.white,
    borderWidth: 2,
    borderRadius: 12,
    backgroundColor: 'transparent',
    overflow: 'hidden', // Keeps the laser sweep strictly inside the bounds
  },
  bottomContainer: {
    flex: 1,
    backgroundColor: colors.overlaySoft,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  nameGroup: {
    marginBottom: 20,
  },
  nameLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: colors.navy,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 8,
  },
  suggestionList: {
    backgroundColor: colors.white,
    borderColor: colors.fog,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
  },
  suggestionLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    color: colors.navy,
  },
  suggestionItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: colors.mist,
    marginBottom: 8,
  },
  suggestionText: {
    color: colors.charcoal,
    fontSize: 15,
  },
});
