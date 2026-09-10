import { CameraView, useCameraPermissions } from 'expo-camera';
import { Checkbox } from 'expo-checkbox';
import * as FileSystem from 'expo-file-system/legacy';
import * as Location from 'expo-location';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { color, radius, space, type } from '@/constants/tokens';
import CustomTextInput from '../components/custom-text-input';
import LiveCameraModal from '../components/live-camera-modal';
import SignaturePad from '../components/signature-pad';
import SubmissionReceiptModal, { type AuditRecord } from '../components/submission-receipt-modal';
import ViolationItemCard from '../components/violation-item-card';
import DateInputGroup from '../components/date-input-group';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';
import { saveAuditLocally } from '../lib/sqlite';
import { triggerAtomicSync } from '../lib/syncManager';
import { loadGuardsForBranch, RosterSource } from '../lib/guardRoster';
import { getInspectorId } from '../lib/inspectorAccount';
import { API_BASE_URL } from '../lib/api';

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

export default function AuditFormScreen() {
    const insets = useSafeAreaInsets();

    const [submittedPayload, setSubmittedPayload] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [permission, requestPermission] = useCameraPermissions();
    const [isVerified, setIsVerified] = useState<boolean>(false);
    const [isProcessingScan, setIsProcessingScan] = useState<boolean>(false);
    const [branchCode, setBranchCode] = useState<string>('');
    const [branchName, setBranchName] = useState<string>('');
    const [branchLocation, setBranchLocation] = useState<string>('');

    const [isTorchOn, setIsTorchOn] = useState<boolean>(false);

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

    /* An alarm response is a site check, not a post inspection: the client only
     * calls operations out when no guard is there to answer. So the guard-on-post
     * toggle has no say over it. Everything keyed on the guard, the roster
     * fields, the compliance ticket and the guard signature, sits this one out,
     * and the site condition is recorded instead. */
    const isAlarmResponse = visitType === 'Alarm Response';
    const isGuardAudited = !isAlarmResponse && isGuardPresent;

    const [inspectorName, setInspectorName] = useState<string>('Unknown Inspector');
    /* The roster row id, which is what audits.inspector_id and the daily
     * progress tracker are keyed on. Null only if the gate never cached it. */
    const [inspectorId, setInspectorId] = useState<string | null>(null);

    useEffect(() => {
        const fetchIdentity = async () => {
            try {
                const storedName = await AsyncStorage.getItem('inspector_name');
                if (storedName) {
                    setInspectorName(storedName);
                }
                setInspectorId(await getInspectorId());
            } catch (error) {
                console.error("Failed to load inspector identity", error);
            }
        };
        fetchIdentity();
    }, []);

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

    /**
     * The submitted payload as the receipt's record shape.
     *
     * The two are not the same: the payload has no row id, carries the
     * submission time as inspector_out_time, and names the uniform field
     * uniform_compliance where the table calls it uniform_status. Passing the
     * payload straight through typechecked only because the state was `any`,
     * and rendered empty rows.
     */
    const toAuditRecord = (payload: any): AuditRecord => ({
        id: payload.branch_code + ':' + payload.inspector_out_time,
        created_at: payload.inspector_out_time ?? null,
        branch_code: payload.branch_code,
        branch_name: payload.branch_name ?? null,
        branch_location: payload.branch_location ?? null,
        inspector_name: payload.inspector_name,
        guard_name: payload.guard_name ?? null,
        firearm_make: payload.firearm_make ?? null,
        firearm_serial: payload.firearm_serial ?? null,
        lesp_expiry: payload.lesp_expiry ?? null,
        uniform_status: payload.uniform_compliance ?? null,
        remarks: payload.remarks ?? null,
        guard_present_status: payload.guard_present_status ?? null,
        incident_remarks: payload.incident_remarks ?? null,
        visit_type: payload.visit_type ?? null,
        escalation_status: null,
    });

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
            inspector_id: inspectorId,
            inspector_in_time: timeIn,
            inspector_out_time: new Date().toISOString(),
            gps_coordinates: location
                ? {
                      latitude: location.coords.latitude,
                      longitude: location.coords.longitude,
                      accuracy: location.coords.accuracy,
                  }
                : null,
            guard_present_status: !isGuardAudited
                ? {
                      atm_online: isAtmOnline,
                      atm_offline: isAtmOffline,
                      door_secure: isDoorSecure,
                  }
                : null,
            guard_name: isGuardAudited ? guardName : null,
            lesp_expiry: isGuardAudited ? formattedLespExpiry : null,
            uniform_compliance: isGuardAudited ? isUniformCompliant : null,
            firearm_serial: isGuardAudited ? firearmSerial : null,
            firearm_make: isGuardAudited ? firearmMake : null,
            metrics: isGuardAudited
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
            violation_ticket: isGuardAudited && isTicketOpen
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
            guard_signature: isGuardAudited ? guardSignature : null,
            client_signature: isClientAbsent ? 'UNAVAILABLE_ON_SITE' : clientSignature,

            visit_type: visitType,
            incident_remarks: incidentRemarks
        };

        const network = await Network.getNetworkStateAsync();
        const isOffline = !network.isConnected || !network.isInternetReachable;

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
            const API_URL = `${API_BASE_URL}/api/audits`;
            
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
        } catch {
            Alert.alert("Scan Failed", "Unrecognized QR format. Please scan an official Utopia detachment code.", [{ text: "Try Again", onPress: () => setIsProcessingScan(false) }]);
        }
    };

    const handleSubmit = async () => {
        if (isGuardAudited && !guardSignature) {
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

    /* --- Permission gate ------------------------------------------------- */

    if (!permission || !locationPermission) {
        return (
            <View style={styles.screen}>
                <View style={[styles.gate, { paddingTop: insets.top + space.xl }]}>
                    <Text style={type.label}>Initialising</Text>
                    <Text style={[type.title, { marginTop: space.xs }]}>Checking device permissions</Text>
                </View>
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <View style={styles.screen}>
                <View style={[styles.gate, { paddingTop: insets.top + space.xl }]}>
                    <Text style={[type.label, { color: color.dangerInk }]}>Access required</Text>
                    <Text style={[type.title, { marginTop: space.xs }]}>Camera and location</Text>
                    <Text style={[type.body, { marginTop: space.sm }]}>
                        An audit is only valid with a live photo and a position fix taken on site. The
                        form does not open until both are granted.
                    </Text>
                    <Pressable
                        onPress={() => { requestPermission(); requestLocationPermission(); }}
                        style={({ pressed }) => [styles.button, { marginTop: space.lg }, pressed && styles.buttonPressed]}
                    >
                        <Text style={styles.buttonLabel}>Grant permissions</Text>
                    </Pressable>
                </View>
            </View>
        );
    }

    /* --- Scanner ---------------------------------------------------------- */

    if (!isVerified) {
        return (
            <View style={styles.scanScreen}>
                <CameraView
                    style={StyleSheet.absoluteFill}
                    barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                    onBarcodeScanned={handleBarcodeScanned}
                    enableTorch={isTorchOn}
                />

                {/* box-none so the frame never swallows a tap meant for the camera. */}
                <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
                    <View style={[styles.scanHead, { paddingTop: insets.top + space.lg }]}>
                        <Text style={styles.scanTitle}>Scan detachment code</Text>
                        <Text style={styles.scanNote}>
                            The branch code unlocks that branch and no other. Your position is
                            captured at the same moment.
                        </Text>
                    </View>

                    {/* A still 1px frame. A sweeping laser line would be motion with
                      * nothing to say: the live camera feed already shows the scanner
                      * is running. */}
                    <View style={styles.scanMiddle} pointerEvents="none">
                        <View style={styles.scanWindow} />
                    </View>

                    <View style={[styles.scanFoot, { paddingBottom: insets.bottom + space.lg }]}>
                        <Pressable
                            onPress={() => setIsTorchOn(!isTorchOn)}
                            accessibilityRole="switch"
                            accessibilityState={{ checked: isTorchOn }}
                            style={[styles.scanControl, isTorchOn && styles.scanControlOn]}
                        >
                            <Text style={[styles.scanControlLabel, isTorchOn && styles.scanControlLabelOn]}>
                                {isTorchOn ? 'Torch on' : 'Torch off'}
                            </Text>
                        </Pressable>

                        {/* __DEV__ only. This skips the QR check, which is the whole
                          * micro-locator half of the location proof, so it must not be
                          * reachable in a release build. */}
                        {__DEV__ ? (
                            <Pressable
                                onPress={() => {
                                    setBranchCode('DEV-001');
                                    setBranchName('Development Branch');
                                    setBranchLocation('Localhost');
                                    setTimeIn(new Date().toISOString());
                                    setIsVerified(true);
                                }}
                                style={[styles.scanControl, styles.scanControlDev]}
                            >
                                <Text style={[styles.scanControlLabel, { color: color.dangerInk }]}>
                                    Dev bypass
                                </Text>
                            </Pressable>
                        ) : null}
                    </View>
                </View>
            </View>
        );
    }

    /* --- Audit form -------------------------------------------------------- */

    const coords = location?.coords;

    /* The 22 regulatory metrics, as data rather than 22 hand-written rows.
     * Order and wording follow the routing form, so the numbering an inspector
     * reads here matches the numbering the ticket is filed under. */
    const complianceItems: { name: string; value: 'Yes' | 'No'; set: (v: 'Yes' | 'No') => void }[] = [
        { name: 'Valid Security License', value: validSecurityLicense, set: setValidSecurityLicense },
        { name: 'Company ID', value: companyId, set: setCompanyId },
        { name: 'Pershing Cap', value: pershingCap, set: setPershingCap },
        { name: 'Authorized Hair Cut', value: authorizedHairCut, set: setAuthorizedHairCut },
        { name: 'Properly Shaved', value: properlyShaved, set: setProperlyShaved },
        { name: 'Authorized Uniform', value: authorizedUniform, set: setAuthorizedUniform },
        { name: 'Authorized Name Cloth', value: authorizedNameCloth, set: setAuthorizedNameCloth },
        { name: 'Authorized Agency Patch', value: authorizedAgencyPatch, set: setAuthorizedAgencyPatch },
        { name: 'Necktie With Clip', value: necktieWithClip, set: setNecktieWithClip },
        { name: 'Security Badge', value: securityBadge, set: setSecurityBadge },
        { name: 'Collar Pin 2 pcs.', value: collarPin, set: setCollarPin },
        { name: 'Lanyard (Navy Blue)', value: lanyard, set: setLanyard },
        { name: 'Whistle', value: whistle, set: setWhistle },
        { name: 'Holster', value: holster, set: setHolster },
        { name: 'Belt Clip 6 pcs.', value: beltClip, set: setBeltClip },
        { name: 'Belt with buckle', value: beltWithBuckle, set: setBeltWithBuckle },
        { name: 'Garrison Belt', value: garrisonBelt, set: setGarrisonBelt },
        { name: 'Authorized Shoes', value: authorizedShoes, set: setAuthorizedShoes },
        { name: 'Hand Cuff', value: handCuff, set: setHandCuff },
        { name: 'Short/Clean finger Nails', value: shortCleanFingerNails, set: setShortCleanFingerNails },
        { name: 'Medicine Kit With Mediplus', value: medicineKitWithMediplus, set: setMedicineKitWithMediplus },
        { name: 'Stun Gun With Flashlight', value: stunGunWithFlashlight, set: setStunGunWithFlashlight },
    ];

    const flaggedCount = complianceItems.filter((item) => item.value === 'No').length;

    /* The same three conditions handleSubmit enforces. They used to be visible
     * only after tapping Submit and reading an alert, so an inspector standing
     * at the post learned what was missing one item at a time. */
    const readiness = [
        { label: 'Photo', done: livePhotoUri !== null },
        ...(isGuardAudited ? [{ label: 'Guard signed', done: guardSignature !== null }] : []),
        { label: 'Client signed', done: isClientAbsent || clientSignature !== null },
    ];
    const outstanding = readiness.filter((item) => !item.done).length;

    return (
    <>
        <KeyboardAvoidingView
            style={styles.screen}
            /* iOS needs the pad. Android resizes the window itself under the
             * manifest's adjustResize, and stacking both double-counts it. */
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView
                /* Padding belongs on the content container. On the ScrollView
                 * itself the bottom inset is ignored and the last field sits
                 * under the action bar. */
                contentContainerStyle={[
                    styles.content,
                    { paddingLeft: insets.left, paddingRight: insets.right },
                ]}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            >
                <View style={[styles.identity, { paddingTop: insets.top + space.md }]}>
                    <Text style={styles.branchCode}>{branchCode}</Text>
                    <Text style={[type.title, { fontSize: 18 }]}>{branchName}</Text>
                    <Text style={type.dataMuted}>{branchLocation}</Text>
                </View>

                <View style={styles.section}>
                    <DataRow label="Time in" value={timeIn ? new Date(timeIn).toLocaleTimeString() : 'Not set'} isFirst />
                    <DataRow
                        label="Position"
                        value={coords ? `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}` : 'No fix'}
                    />
                    <DataRow
                        label="Accuracy"
                        value={coords?.accuracy != null ? `${coords.accuracy.toFixed(1)} m` : 'Unknown'}
                    />
                    <DataRow label="Inspector" value={inspectorName} />
                </View>

                <Section label="Visit classification" icon="flag-outline">
                    <View style={styles.controlRow}>
                        <Segment label="Routine" selected={visitType === 'Routine'} onPress={() => setVisitType('Routine')} />
                        <Segment
                            label="Alarm response"
                            selected={visitType === 'Alarm Response'}
                            tone="danger"
                            onPress={() => setVisitType('Alarm Response')}
                        />
                    </View>
                </Section>

                {isAlarmResponse ? (
                    <>
                        <Section label="Site condition" icon="business-outline">
                            <ToggleRow label="ATM is online" value={isAtmOnline} onValueChange={handleAtmOnlineToggle} isFirst />
                            <ToggleRow label="ATM is offline" value={isAtmOffline} onValueChange={handleAtmOfflineToggle} />
                            <ToggleRow label="Door, glass and padlock secure" value={isDoorSecure} onValueChange={setIsDoorSecure} />
                        </Section>

                        <Section label="Incident resolution" icon="warning-outline">
                            <View style={styles.field}>
                                <CustomTextInput
                                    value={incidentRemarks}
                                    onChangeText={setIncidentRemarks}
                                    multiline
                                    placeholder="Branch concern, findings, and resolution"
                                />
                            </View>
                        </Section>
                    </>
                ) : (
                    <>
                        <Section label="Guard on post" icon="person-outline">
                            <ToggleRow
                                label="Guard is present"
                                value={isGuardPresent}
                                onValueChange={setIsGuardPresent}
                                isFirst
                            />
                        </Section>

                        {isGuardPresent ? (
                            <>
                                <Section label="Identity" icon="id-card-outline">
                                    <Pressable
                                        onPress={() => setIsGuardDropdownOpen(!isGuardDropdownOpen)}
                                        style={styles.selectRow}
                                    >
                                        <Text style={guardName ? type.title : styles.selectPlaceholder}>
                                            {guardName || 'Select guard from roster'}
                                        </Text>
                                        <Text style={styles.chevron}>{isGuardDropdownOpen ? '-' : '+'}</Text>
                                    </Pressable>

                                    {isGuardDropdownOpen ? (
                                        <View style={styles.divider}>
                                            {rosterSource === 'cache' ? (
                                                <Text style={styles.rosterNotice}>
                                                    {`Offline. Showing the roster saved on this device${
                                                        rosterRefreshedAt
                                                            ? ` on ${new Date(rosterRefreshedAt).toLocaleString()}`
                                                            : ''
                                                    }.`}
                                                </Text>
                                            ) : null}

                                            {isRosterLoading ? (
                                                <Text style={styles.rosterEmpty}>Loading roster</Text>
                                            ) : assignedGuards.length === 0 ? (
                                                <Text style={[styles.rosterEmpty, { color: color.dangerInk }]}>
                                                    {rosterSource === 'cache' && !rosterRefreshedAt
                                                        ? 'No roster saved on this device yet. Connect once to download it before heading to a dead zone.'
                                                        : 'No guards deployed to this detachment in the system.'}
                                                </Text>
                                            ) : (
                                                assignedGuards.map((guard, index) => (
                                                    <Pressable
                                                        key={`${guard.guard_name}-${index}`}
                                                        style={[
                                                            styles.rosterRow,
                                                            index > 0 && styles.divider,
                                                            guardName === guard.guard_name && styles.rosterRowSelected,
                                                        ]}
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
                                                        <Text style={type.title}>{guard.guard_name}</Text>
                                                        <Text style={type.dataMuted}>
                                                            {guard.lesp_expiry_date
                                                                ? `LESP ${guard.lesp_expiry_date}`
                                                                : 'LESP not on file'}
                                                        </Text>
                                                    </Pressable>
                                                ))
                                            )}
                                        </View>
                                    ) : null}

                                    <View style={[styles.field, styles.divider]}>
                                        <FieldLabel text="LESP expiry date" hintKey="lesp" />
                                        <DateInputGroup
                                            label=""
                                            day={lespExpDay}
                                            month={lespExpMonth}
                                            year={lespExpYear}
                                            onDayChange={setLespExpDay}
                                            onMonthChange={setLespExpMonth}
                                            onYearChange={setLespExpYear}
                                        />
                                    </View>

                                    {/* Both of these already ride in the payload and are
                                      * columns on the audits row. The form never rendered
                                      * an input for either, so every report so far has
                                      * carried an empty firearm make and serial. */}
                                    <View style={[styles.field, styles.divider]}>
                                        <CustomTextInput
                                            label="Firearm make"
                                            value={firearmMake}
                                            onChangeText={setFirearmMake}
                                            placeholder="Leave blank if unarmed"
                                        />
                                    </View>
                                    <View style={[styles.field, styles.divider]}>
                                        <CustomTextInput
                                            label="Firearm serial"
                                            value={firearmSerial}
                                            onChangeText={setFirearmSerial}
                                            placeholder="Leave blank if unarmed"
                                        />
                                    </View>

                                    <ToggleRow
                                        label="Proper uniform authorized"
                                        value={isUniformCompliant}
                                        onValueChange={setIsUniformCompliant}
                                    />
                                </Section>

                                <Section label="Documents" icon="document-text-outline">
                                    <StatusRow hintKey="lto" label="LTO" value={ltoStatus} onChange={setLtoStatus} isFirst />
                                    <StatusRow hintKey="ddo" label="DDO" value={ddoStatus} onChange={setDdoStatus} />
                                    <StatusRow hintKey="ltofp" label="LTOFP" value={ltofpStatus} onChange={setLtofpStatus} />
                                    <StatusRow hintKey="fa" label="FA licence" value={faStatus} onChange={setFaStatus} />
                                    <StatusRow hintKey="id" label="Company ID" value={idStatus} onChange={setIdStatus} />
                                    <StatusRow hintKey="rlm" label="RLM" value={rlmStatus} onChange={setRlmStatus} />
                                </Section>

                                <Section label="Remarks" icon="create-outline">
                                    <View style={styles.field}>
                                        <FieldLabel text="Inspector remarks" hintKey="remarks" />
                                        <CustomTextInput
                                            value={remarks}
                                            onChangeText={setRemarks}
                                            multiline
                                            placeholder="Observations from this visit"
                                        />
                                    </View>
                                </Section>

                                <Section label={`Compliance (${flaggedCount} flagged)`} icon="checkbox-outline">
                                    <Pressable
                                        onPress={() => setIsTicketOpen(!isTicketOpen)}
                                        style={styles.discloseRow}
                                    >
                                        <View style={{ flex: 1 }}>
                                            <Text style={type.title}>Violation ticket</Text>
                                            <Text style={type.dataMuted}>22 regulatory metrics</Text>
                                        </View>
                                        <Text style={styles.chevron}>{isTicketOpen ? '-' : '+'}</Text>
                                    </Pressable>

                                    {isTicketOpen ? (
                                        <>
                                            <View style={[styles.field, styles.divider]}>
                                                <CustomTextInput
                                                    label="Security licence no."
                                                    value={securityLicenseNo}
                                                    onChangeText={setSecurityLicenseNo}
                                                    placeholder="As printed on the licence"
                                                />
                                            </View>
                                            <View style={[styles.field, styles.divider]}>
                                                <CustomTextInput
                                                    label="Security licence expiry"
                                                    value={securityLicenseExpiry}
                                                    onChangeText={setSecurityLicenseExpiry}
                                                    placeholder="DD/MM/YYYY"
                                                />
                                            </View>

                                            <View style={[styles.groupHead, styles.divider]}>
                                                <Text style={type.label}>Presentable, operational, applicable</Text>
                                            </View>

                                            {complianceItems.map((item, index) => (
                                                <ViolationItemCard
                                                    key={item.name}
                                                    itemName={`${index + 1}. ${item.name}`}
                                                    status={item.value}
                                                    onUpdate={item.set}
                                                />
                                            ))}

                                            <View style={[styles.field, styles.divider]}>
                                                <FieldLabel text="Violation detail" hintKey="violation" />
                                                <CustomTextInput
                                                    value={violationRemarks}
                                                    onChangeText={setViolationRemarks}
                                                    multiline
                                                    placeholder="Reason for the violation, for example sleeping on post"
                                                />
                                            </View>
                                        </>
                                    ) : null}
                                </Section>
                            </>
                        ) : (
                            <Section label="Site condition" icon="business-outline">
                                <ToggleRow label="ATM is online" value={isAtmOnline} onValueChange={handleAtmOnlineToggle} isFirst />
                                <ToggleRow label="ATM is offline" value={isAtmOffline} onValueChange={handleAtmOfflineToggle} />
                                <ToggleRow label="Door, glass and padlock secure" value={isDoorSecure} onValueChange={setIsDoorSecure} />
                            </Section>
                        )}
                    </>
                )}

                <Section label="Live photo" icon="camera-outline">
                    <View style={styles.captureRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={type.title}>
                                {isGuardAudited ? 'Guard on post' : 'Site condition'}
                            </Text>
                            <Text style={type.dataMuted}>
                                {isGuardAudited
                                    ? 'Camera only. Uploads are blocked.'
                                    : isAlarmResponse
                                      ? 'Photograph the site as found on arrival.'
                                      : 'Photograph the site or logbook to record the absence.'}
                            </Text>
                        </View>
                        <Pressable
                            onPress={() => setIsCameraModalOpen(true)}
                            style={[styles.captureButton, livePhotoUri ? styles.captureButtonDone : null]}
                        >
                            <Text style={[styles.captureLabel, livePhotoUri ? styles.captureLabelDone : null]}>
                                {livePhotoUri ? 'Captured' : 'Open camera'}
                            </Text>
                        </Pressable>
                    </View>
                </Section>

                <Section label="Signatures" icon="pencil-outline">
                    {isGuardAudited ? (
                        <SignRow
                            label="Guard on duty"
                            signed={guardSignature !== null}
                            onPress={() => setActiveSigner('guard')}
                            isFirst
                        />
                    ) : null}

                    <ToggleRow
                        label="Client unavailable on site"
                        value={isClientAbsent}
                        onValueChange={(absent: boolean) => {
                            setIsClientAbsent(absent);
                            if (absent) setClientSignature(null);
                        }}
                        isFirst={!isGuardAudited}
                    />

                    {!isClientAbsent ? (
                        <SignRow
                            label="Client representative"
                            signed={clientSignature !== null}
                            onPress={() => setActiveSigner('client')}
                        />
                    ) : null}
                </Section>
            </ScrollView>

            {/* Outside the ScrollView, so submit is reachable from anywhere in a
              * form this long and the keyboard can never cover it. */}
            <View style={[styles.actionBar, { paddingBottom: insets.bottom + space.md }]}>
                <View style={styles.readyRow}>
                    {readiness.map((item) => (
                        <ReadyChip key={item.label} label={item.label} done={item.done} />
                    ))}
                </View>

                <Pressable
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: isSubmitting }}
                    style={({ pressed }) => [
                        styles.button,
                        isSubmitting && styles.buttonBusy,
                        pressed && !isSubmitting && styles.buttonPressed,
                    ]}
                >
                    {isSubmitting ? (
                        <View style={styles.busyRow}>
                            <ActivityIndicator size="small" color={color.surface} />
                            <Text style={styles.buttonLabel}>Submitting</Text>
                        </View>
                    ) : (
                        <Text style={styles.buttonLabel}>
                            {outstanding === 0
                                ? 'Submit audit report'
                                : `${outstanding} still needed`}
                        </Text>
                    )}
                </Pressable>
            </View>
        </KeyboardAvoidingView>

        <LiveCameraModal
            visible={isCameraModalOpen}
            onClose={() => setIsCameraModalOpen(false)}
            onCapture={(uri) => { setLivePhotoUri(uri); }}
        />

        {submittedPayload !== null && (
            <SubmissionReceiptModal
                visible={true}
                auditData={toAuditRecord(submittedPayload)}
                onClose={() => setSubmittedPayload(null)}
            />
        )}

        {activeSigner !== null && (
            <SignaturePad
                key={activeSigner}
                title={activeSigner === 'guard' ? 'Guard on Duty Signature' : 'Client / Representative Signature'}
                visible={true}
                onClose={() => setActiveSigner(null)}
                onSign={activeSigner === 'guard' ? setGuardSignature : setClientSignature}
            />
        )}
    </>
    );
}

/* --- Primitives ----------------------------------------------------------- */

/**
 * A titled band of rows. Full bleed, hairline top and bottom, no card.
 * At this density a card border plus a page margin plus a shadow spends three
 * visual devices to say what one hairline says.
 */
function Section({
    label, icon, children,
}: {
    label: string;
    icon?: React.ComponentProps<typeof Ionicons>['name'];
    children: React.ReactNode;
}) {
    return (
        <View>
            <View style={styles.sectionHead}>
                {icon ? <Ionicons name={icon} size={13} color={color.inkMuted} /> : null}
                <Text style={type.label}>{label}</Text>
            </View>
            <View style={styles.section}>{children}</View>
        </View>
    );
}

/** One submission prerequisite, ticked or not. */
function ReadyChip({ label, done }: { label: string; done: boolean }) {
    return (
        <View style={[styles.chip, done ? styles.chipDone : styles.chipTodo]}>
            <Ionicons
                name={done ? 'checkmark-circle' : 'ellipse-outline'}
                size={12}
                color={done ? color.okInk : color.dangerInk}
            />
            <Text style={[type.badge, styles.chipLabel, { color: done ? color.okInk : color.dangerInk }]}>
                {label}
            </Text>
        </View>
    );
}

/** Read-only key and value. Values are mono so digits align down the column. */
function DataRow({ label, value, isFirst }: { label: string; value: string; isFirst?: boolean }) {
    return (
        <View style={[styles.dataRow, !isFirst && styles.divider]}>
            <Text style={type.label}>{label}</Text>
            <Text style={type.data} numberOfLines={1}>{value}</Text>
        </View>
    );
}

/**
 * Field label with an optional expansion of the acronym.
 *
 * The hint used to slide in over 300ms. On a form with nine of them that is
 * nine waits for a definition the inspector wanted immediately, so it now
 * appears on the same frame as the tap.
 */
function FieldLabel({ text, hintKey }: { text: string; hintKey: string }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <View style={styles.fieldLabelBlock}>
            <Pressable
                onPress={() => setIsOpen(!isOpen)}
                accessibilityRole="button"
                accessibilityState={{ expanded: isOpen }}
                accessibilityLabel={`${text}. Show what this stands for.`}
                style={styles.fieldLabelRow}
            >
                <Text style={type.label}>{text}</Text>
                <Text style={styles.hintMark}>{isOpen ? '-' : '?'}</Text>
            </Pressable>
            {isOpen ? <Text style={styles.hintText}>{HINTS_DATA[hintKey]}</Text> : null}
        </View>
    );
}

/** One document and its three-way status, on a single row. */
function StatusRow({
    label, hintKey, value, onChange, isFirst,
}: {
    label: string; hintKey: string; value: string;
    onChange: (v: string) => void; isFirst?: boolean;
}) {
    return (
        <View style={[styles.statusRow, !isFirst && styles.divider]}>
            <FieldLabel text={label} hintKey={hintKey} />
            <View style={styles.controlRow}>
                {['Valid', 'Expired', 'Missing'].map((status) => (
                    <Segment
                        key={status}
                        label={status}
                        selected={value === status}
                        tone={status === 'Valid' ? 'ink' : 'danger'}
                        onPress={() => onChange(status)}
                    />
                ))}
            </View>
        </View>
    );
}

/**
 * One cell of a segmented control.
 *
 * No timing curve anywhere: on a field device the mark has to land before the
 * finger lifts, and an inspector working down 22 metrics feels every 200ms.
 */
function Segment({
    label, selected, onPress, tone = 'ink',
}: {
    label: string; selected: boolean; onPress: () => void; tone?: 'ink' | 'danger';
}) {
    const fill = tone === 'danger' ? color.dangerInk : color.ink;

    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            style={[
                styles.segment,
                selected && { backgroundColor: fill, borderColor: fill },
            ]}
        >
            <Text style={[type.badge, styles.segmentLabel, selected && styles.segmentLabelOn]}>
                {label}
            </Text>
        </Pressable>
    );
}

/** A checkbox and its label, as a full-width row so the whole row is the target. */
function ToggleRow({
    label, value, onValueChange, isFirst,
}: {
    label: string; value: boolean; onValueChange: (v: boolean) => void; isFirst?: boolean;
}) {
    return (
        <Pressable
            onPress={() => onValueChange(!value)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: value }}
            style={[styles.toggleRow, !isFirst && styles.divider]}
        >
            <Checkbox
                value={value}
                onValueChange={onValueChange}
                color={value ? color.ink : undefined}
                style={styles.checkbox}
            />
            <Text style={type.title}>{label}</Text>
        </Pressable>
    );
}

/** A signature slot and its state. */
function SignRow({
    label, signed, onPress, isFirst,
}: {
    label: string; signed: boolean; onPress: () => void; isFirst?: boolean;
}) {
    return (
        <View style={[styles.captureRow, !isFirst && styles.divider]}>
            <Text style={[type.title, { flex: 1 }]}>{label}</Text>
            <Pressable
                onPress={onPress}
                style={[styles.captureButton, signed ? styles.captureButtonDone : null]}
            >
                <Text style={[styles.captureLabel, signed ? styles.captureLabelDone : null]}>
                    {signed ? 'Signed' : 'Sign'}
                </Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: color.canvas },
    content: { paddingBottom: space.xl },
    gate: { paddingHorizontal: space.lg, paddingBottom: space.xl },

    /* Sections are full bleed and separate on hairlines, never on cards. */
    sectionHead: {
        flexDirection: 'row', alignItems: 'center', gap: space.xs + 2,
        paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: space.sm,
    },

    readyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, marginBottom: space.sm },
    chip: {
        flexDirection: 'row', alignItems: 'center', gap: space.xs,
        borderWidth: 1, borderRadius: radius.badge,
        paddingHorizontal: space.sm, paddingVertical: 2,
    },
    chipDone: { borderColor: color.okInk, backgroundColor: color.okBg },
    chipTodo: { borderColor: color.dangerInk, backgroundColor: color.dangerBg },
    chipLabel: { fontSize: 9 },
    section: {
        backgroundColor: color.surface,
        borderTopWidth: 1, borderBottomWidth: 1, borderColor: color.line,
    },
    divider: { borderTopWidth: 1, borderTopColor: color.line },

    /* Branch identity. The code is the key to the whole report, so it is the
     * one piece of type given mono at full contrast. */
    identity: {
        backgroundColor: color.shell,
        paddingHorizontal: space.lg, paddingBottom: space.lg,
        gap: 2,
    },
    branchCode: {
        ...type.data, color: color.shellMuted,
        letterSpacing: 1, textTransform: 'uppercase',
    },

    dataRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: space.lg, paddingVertical: space.sm,
        gap: space.md,
    },

    field: { paddingHorizontal: space.lg, paddingVertical: space.md, gap: space.sm },
    groupHead: { paddingHorizontal: space.lg, paddingVertical: space.sm, backgroundColor: color.sunken },

    fieldLabelBlock: { gap: space.xs },
    fieldLabelRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
    hintMark: { ...type.badge, color: color.inkMuted, fontSize: 11 },
    hintText: { ...type.dataMuted, color: color.infoInk },

    statusRow: { paddingHorizontal: space.lg, paddingVertical: space.md, gap: space.sm },
    controlRow: { flexDirection: 'row' },
    segment: {
        flex: 1, alignItems: 'center',
        paddingVertical: space.sm,
        borderWidth: 1, borderColor: color.lineStrong,
        backgroundColor: color.surface,
    },
    segmentLabel: { color: color.inkMuted, fontSize: 10 },
    segmentLabelOn: { color: color.surface },

    toggleRow: {
        flexDirection: 'row', alignItems: 'center', gap: space.md,
        paddingHorizontal: space.lg, paddingVertical: space.md,
    },
    checkbox: { width: 18, height: 18, borderRadius: 0, borderColor: color.lineStrong },

    selectRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: space.lg, paddingVertical: space.md,
    },
    selectPlaceholder: { ...type.title, color: color.inkMuted, fontWeight: '400' },
    chevron: { ...type.data, fontSize: 18, color: color.inkMuted },

    rosterNotice: {
        ...type.dataMuted, color: color.warnInk,
        paddingHorizontal: space.lg, paddingTop: space.sm,
    },
    rosterEmpty: { ...type.body, paddingHorizontal: space.lg, paddingVertical: space.md },
    rosterRow: { paddingHorizontal: space.lg, paddingVertical: space.sm, gap: 2 },
    rosterRowSelected: { backgroundColor: color.sunken },

    discloseRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: space.lg, paddingVertical: space.md,
    },

    captureRow: {
        flexDirection: 'row', alignItems: 'center', gap: space.md,
        paddingHorizontal: space.lg, paddingVertical: space.md,
    },
    captureButton: {
        borderWidth: 1, borderColor: color.lineStrong, borderRadius: radius.control,
        paddingHorizontal: space.md, paddingVertical: space.sm,
    },
    captureButtonDone: { backgroundColor: color.okBg, borderColor: color.okInk },
    captureLabel: { ...type.badge, color: color.inkMuted, fontSize: 10 },
    captureLabelDone: { color: color.okInk },

    /* Pinned above the keyboard, so a form this long never hides its own
     * submit. */
    actionBar: {
        backgroundColor: color.surface,
        borderTopWidth: 1, borderTopColor: color.line,
        paddingHorizontal: space.lg, paddingTop: space.md,
    },
    button: {
        backgroundColor: color.ink, borderRadius: radius.control,
        paddingVertical: space.md, alignItems: 'center',
    },
    buttonPressed: { backgroundColor: color.shellHover },
    buttonBusy: { backgroundColor: color.inkMuted },
    buttonLabel: { ...type.badge, color: color.surface, fontSize: 12 },
    busyRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },

    /* Scanner. Dark by necessity: it sits over a camera feed. */
    scanScreen: { flex: 1, backgroundColor: color.shell },
    scanHead: {
        backgroundColor: 'rgba(15, 23, 42, 0.82)',
        paddingHorizontal: space.lg, paddingBottom: space.lg, gap: space.xs,
    },
    scanTitle: { ...type.title, color: color.shellInk, fontSize: 17 },
    scanNote: { ...type.body, color: color.shellMuted },
    scanMiddle: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    scanWindow: { width: '74%', aspectRatio: 1, borderWidth: 1, borderColor: color.shellInk },
    scanFoot: {
        backgroundColor: 'rgba(15, 23, 42, 0.82)',
        paddingHorizontal: space.lg, paddingTop: space.lg, gap: space.sm,
    },
    scanControl: {
        borderWidth: 1, borderColor: color.shellMuted, borderRadius: radius.control,
        paddingVertical: space.sm, alignItems: 'center',
    },
    scanControlOn: { backgroundColor: color.shellInk, borderColor: color.shellInk },
    scanControlDev: { borderColor: color.dangerInk },
    scanControlLabel: { ...type.badge, color: color.shellMuted, fontSize: 11 },
    scanControlLabelOn: { color: color.shell },
});
