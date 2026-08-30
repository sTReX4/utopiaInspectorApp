import { Stack } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Checkbox from 'expo-checkbox';
import * as FileSystem from 'expo-file-system/legacy';
import * as Location from 'expo-location';
import * as ImageManipulator from 'expo-image-manipulator';
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { useNavigation, useRouter } from 'expo-router';
import { Alert, Button, Keyboard, Platform, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View, ActivityIndicator } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import CustomTextInput from '../components/custom-text-input';
import LiveCameraModal from '../components/live-camera-modal';
import SignaturePad from '../components/signature-pad';
import SubmissionReceiptModal from '../components/submission-receipt-modal';
import ViolationItemCard from '../components/violation-item-card';
import DateInputGroup from '../components/date-input-group';
import AsyncStorage from '@react-native-async-storage/async-storage';


const NAME_HISTORY_FILE = FileSystem.documentDirectory + 'nameHistory.json';

export default function AuditFormScreen() {

    const navigation = useNavigation();
    const router = useRouter();

    // Modal State for Submission Receipt
    const [submittedPayload, setSubmittedPayload] = useState<any>(null);
    const [savedNames, setSavedNames] = useState<string[]>([]);
    
    // Loading State
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Camera Permissions
    const [permission, requestPermission] = useCameraPermissions();

    const [isVerified, setIsVerified] = useState<boolean>(false);
    const [isProcessingScan, setIsProcessingScan] = useState<boolean>(false);

    const [branchCode, setBranchCode] = useState<string>('');
    const [branchName, setBranchName] = useState<string>('');
    const [branchLocation, setBranchLocation] = useState<string>('');

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [middleInitial, setMiddleInitial] = useState('');

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

    useEffect(() => {
        const loadNameHistory = async () => {
            try {
                const info = await FileSystem.getInfoAsync(NAME_HISTORY_FILE);
                if (!info.exists) {
                    setSavedNames([]);
                    return;
                }

                const content = await FileSystem.readAsStringAsync(NAME_HISTORY_FILE, { encoding: FileSystem.EncodingType.UTF8 });
                const parsed = JSON.parse(content) as string[];
                setSavedNames(Array.from(new Set(parsed.filter(Boolean))));
            } catch (error) {
                console.error('Failed to load saved guard names:', error);
            }
        };

        loadNameHistory();
    }, []);

    const addNameToHistory = async (name: string) => {
        if (!name.trim()) return;

        const normalized = name.trim();
        const nextNames = [normalized, ...savedNames.filter((item) => item.toLowerCase() !== normalized.toLowerCase())].slice(0, 20);
        setSavedNames(nextNames);

        try {
            await FileSystem.writeAsStringAsync(NAME_HISTORY_FILE, JSON.stringify(nextNames), { encoding: FileSystem.EncodingType.UTF8 });
        } catch (error) {
            console.error('Failed to save guard name history:', error);
        }
    };

    const nameQuery = useMemo(() => {
        return [firstName, middleInitial, lastName].filter(Boolean).join(' ').trim();
    }, [firstName, middleInitial, lastName]);

    const nameSuggestions = useMemo(() => {
        if (!nameQuery) return [];
        const lowerQuery = nameQuery.toLowerCase();
        return savedNames
            .filter((name) => name.toLowerCase().includes(lowerQuery))
            .slice(0, 5);
    }, [nameQuery, savedNames]);

    const applyNameSuggestion = (name: string) => {
        const parts = name.split(' ').filter(Boolean);
        setFirstName(parts[0] ?? '');
        if (parts.length === 1) {
            setMiddleInitial('');
            setLastName('');
        } else if (parts.length === 2) {
            setMiddleInitial('');
            setLastName(parts[1]);
        } else {
            setMiddleInitial(parts.slice(1, parts.length - 1).join(' '));
            setLastName(parts[parts.length - 1]);
        }
    };

    const clearAuditInputs = () => {
        setFirstName('');
        setLastName('');
        setMiddleInitial('');

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
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Wipe Memory',
                    style: 'destructive',
                    onPress: async () => {
                        clearAuditInputs();
                        await AsyncStorage.clear(); // <-- Destroys 'Inspector Alpha'
                        router.replace('/login');   // <-- Kicks you back to the start
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
            guard_name: isGuardPresent ? `${firstName}${middleInitial ? ' ' + middleInitial : ''} ${lastName}`.trim() : null,
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
        };

        console.log('SECURE PAYLOAD LOCKED');
        console.log(JSON.stringify(payload, null, 2));

        try {
            const API_URL = 'https://utopia-inspector-app.vercel.app/api/audits';
            
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            
            // Read the raw text first to prevent the JSON crash
            const responseText = await response.text();
            
            if (!response.ok) {
                console.error('Vercel Error Text:', responseText);
                Alert.alert('Vercel Server Error', `Response: ${responseText.substring(0, 100)}`);
                setIsSubmitting(false);
                return;
            }

            const result = JSON.parse(responseText);

            if (isGuardPresent) {
                const guardName = `${firstName}${middleInitial ? ' ' + middleInitial : ''} ${lastName}`.trim();
                await addNameToHistory(guardName);
            }
            clearAuditInputs();
            Alert.alert('Audit Submitted', 'The audit has been successfully submitted and logged.', [
                {
                    text: 'View Receipt',
                    onPress: () => setSubmittedPayload(payload),
                },
                {
                    text: 'OK',
                    style: 'cancel',
                },
            ]);
            
        } catch (error) {
            console.error('Submission Error:', error);
            Alert.alert('Submission Error', 'An error occurred while submitting the audit. Please check your network connection and try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle ATM Online/Offline Toggle Logic//
    const handleAtmOnlineToggle = (newValue: boolean) => {
        setIsAtmOnline(newValue);
        if (newValue)
            setIsAtmOffline(false);
        };

    const handleAtmOfflineToggle = (newValue: boolean) => {
        setIsAtmOffline(newValue);
        if (newValue)
            setIsAtmOnline(false);
        };

    const handleBarcodeScanned = async ({ data }: { data: string }) => {
        if (isVerified || isProcessingScan) 
            
        return;

        setIsProcessingScan(true);

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
    // Handle Form Submission Logic //
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
                <View style={{flex: 1}}>
                    <CameraView
                        style={StyleSheet.absoluteFill}
                        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                        onBarcodeScanned={handleBarcodeScanned}
                    />

                    <View style={styles.overlay}>
                    <View style={styles.unfocusedContainer} />
                    <View style={styles.middleContainer}>
                    <View style={styles.unfocusedContainer} />
                    <View style={styles.focusedContainer} />
                    <View style={styles.unfocusedContainer} />
                    </View>
                    <View style={styles.bottomContainer} />
                    <Button
                            title="DEV BYPASS (FOR TESTING ONLY)"
                            color="red"
                            onPress={() => {
                                setBranchCode("DEV-001");
                                setBranchName("Development Branch");
                                setBranchLocation("Localhost");
                                setIsVerified(true);
                            }}
                    />
                        <Text style={styles.scannerText}>Scan Detachment QR Code to Begin Audit</Text>

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
                <TouchableOpacity
                onPress={handleClearAll}
                style={{ marginRight: 15 }}
                    >
                        <Text
                            style={{
                                color: '#d32f2f',
                                fontWeight: 'bold',
                                fontSize: 12,
                            }}
                        >
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

        {isGuardPresent ? (

                <View>
                <Text style={styles.header}>Audit Form</Text>

                <View style={styles.nameGroup}>

    <Text style={styles.nameLabel}>Guard Name</Text>

    {/* First Name */}
    <CustomTextInput
        label="First Name"
        value={firstName}
        onChangeText={setFirstName}
        hint="Type the guard's first name"
    />

        <View style={styles.nameRow}>   

        <View style={{ flex: 3 }}>
            <CustomTextInput
                label="Last Name"
                value={lastName}
                onChangeText={setLastName}
                hint="Type the guard's last name"
            />
        </View>

        <View style={{ flex: 1 }}>
            <CustomTextInput
                label="M.I"
                value={middleInitial}
                onChangeText={setMiddleInitial}
                hint="Optional middle initial"
            />
        </View>

        </View>

        </View>

                <CustomTextInput
                    label="Firearm Serial No."
                    value={firearmSerial}
                    onChangeText={setFirearmSerial}
                    hint="Example: GLK-123456"
                />

                <CustomTextInput
                    label="Firearm Make"
                    value={firearmMake}
                    onChangeText={setFirearmMake}
                    hint="Example: Glock, Sig Sauer, etc."
                />

                {nameSuggestions.length > 0 && (
                    <View style={styles.suggestionList}>
                        <Text style={styles.suggestionLabel}>Suggested Guard Names</Text>
                        {nameSuggestions.map((suggestion) => (
                            <TouchableOpacity
                                key={suggestion}
                                style={styles.suggestionItem}
                                onPress={() => applyNameSuggestion(suggestion)}
                            >
                                <Text style={styles.suggestionText}>{suggestion}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                <DateInputGroup 
                label="LESP Expiry Date"
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
                <Text style={styles.labelTitle}>LTO</Text>
                <View style={styles.radioGroup}>
                    {['Valid', 'Expired', 'Missing'].map((status) => (
                        <TouchableOpacity
                            key={status}
                            style={[styles.radioButton, ltoStatus === status && styles.radioButtonActive]}
                            onPress={() => setLtoStatus(status)}
                        >
                            <Text style={[styles.radioText, ltoStatus === status && styles.radioTextActive]}>
                                {status}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.labelTitle}>DDO</Text>
                <View style={styles.radioGroup}>
                    {['Valid', 'Expired', 'Missing'].map((status) => (
                        <TouchableOpacity
                            key={status}
                            style={[styles.radioButton, ddoStatus === status && styles.radioButtonActive]}
                            onPress={() => setDdoStatus(status)}
                        >
                            <Text style={[styles.radioText, ddoStatus === status && styles.radioTextActive]}>
                                {status}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.labelTitle}>LTOFP</Text>
                <View style={styles.radioGroup}>
                    {['Valid', 'Expired', 'Missing'].map((status) => (
                        <TouchableOpacity
                            key={status}
                            style={[styles.radioButton, ltofpStatus === status && styles.radioButtonActive]}
                            onPress={() => setLtofpStatus(status)}
                        >
                            <Text style={[styles.radioText, ltofpStatus === status && styles.radioTextActive]}>
                                {status}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.labelTitle}>FA LICENSE</Text>
                <View style={styles.radioGroup}>
                    {['Valid', 'Expired', 'Missing'].map((status) => (
                        <TouchableOpacity
                            key={status}
                            style={[styles.radioButton, faStatus === status && styles.radioButtonActive]}
                            onPress={() => setFaStatus(status)}
                        >
                            <Text style={[styles.radioText, faStatus === status && styles.radioTextActive]}>
                                {status}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.labelTitle}>COMPANY ID</Text>
                <View style={styles.radioGroup}>
                    {['Valid', 'Expired', 'Missing'].map((status) => (
                        <TouchableOpacity
                            key={status}
                            style={[styles.radioButton, idStatus === status && styles.radioButtonActive]}
                            onPress={() => setIdStatus(status)}
                        >
                            <Text style={[styles.radioText, idStatus === status && styles.radioTextActive]}>
                                {status}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.labelTitle}>RLM</Text>
                <View style={styles.radioGroup}>
                    {['Valid', 'Expired', 'Missing'].map((status) => (
                        <TouchableOpacity
                            key={status}
                            style={[styles.radioButton, rlmStatus === status && styles.radioButtonActive]}
                            onPress={() => setRlmStatus(status)}
                        >
                            <Text style={[styles.radioText, rlmStatus === status && styles.radioTextActive]}>
                                {status}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <CustomTextInput
                    label="Remarks"
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

                        <ViolationItemCard 
                            itemName="1. Valid Security License" 
                            status={validSecurityLicense} 
                            onUpdate={setValidSecurityLicense} 
                        />

                        <ViolationItemCard 
                            itemName="2. Company ID" 
                            status={companyId} 
                            onUpdate={setCompanyId} 
                        />

                        <ViolationItemCard 
                            itemName="3. Pershing Cap" 
                            status={pershingCap} 
                            onUpdate={setPershingCap} 
                        />

                        <ViolationItemCard 
                            itemName="4. Authorized Hair Cut" 
                            status={authorizedHairCut} 
                            onUpdate={setAuthorizedHairCut} 
                        />

                        <ViolationItemCard 
                            itemName="5. Properly Shaved" 
                            status={properlyShaved} 
                            onUpdate={setProperlyShaved} 
                        />
                        
                        <ViolationItemCard 
                            itemName="6. Authorized Uniform" 
                            status={authorizedUniform} 
                            onUpdate={setAuthorizedUniform} 
                        />
                        
                        <ViolationItemCard 
                            itemName="7. Authorized Name Cloth" 
                            status={authorizedNameCloth} 
                            onUpdate={setAuthorizedNameCloth} 
                        />

                        <ViolationItemCard 
                            itemName="8. Authorized Agency Patch" 
                            status={authorizedAgencyPatch} 
                            onUpdate={setAuthorizedAgencyPatch} 
                        />

                        <ViolationItemCard 
                            itemName="9. Necktie With Clip" 
                            status={necktieWithClip} 
                            onUpdate={setNecktieWithClip} 
                        />

                        <ViolationItemCard 
                            itemName="10. Security Badge" 
                            status={securityBadge} 
                            onUpdate={setSecurityBadge} 
                        />

                        <ViolationItemCard 
                            itemName="11. Collar Pin 2 pcs." 
                            status={collarPin} 
                            onUpdate={setCollarPin} 
                        />

                        <ViolationItemCard 
                            itemName="12. Lanyard (Navy Blue)" 
                            status={lanyard} 
                            onUpdate={setLanyard} 
                        />

                        <ViolationItemCard 
                            itemName="13. Whistle" 
                            status={whistle} 
                            onUpdate={setWhistle} 
                        />

                        <ViolationItemCard 
                            itemName="14. Holster" 
                            status={holster} 
                            onUpdate={setHolster} 
                        />

                        <ViolationItemCard 
                            itemName="15. Belt Clip 6 pcs." 
                            status={beltClip} 
                            onUpdate={setBeltClip} 
                        />

                        <ViolationItemCard 
                            itemName="16. Belt with buckle" 
                            status={beltWithBuckle} 
                            onUpdate={setBeltWithBuckle} 
                        />

                        <ViolationItemCard 
                            itemName="17. Garrison Belt" 
                            status={garrisonBelt} 
                            onUpdate={setGarrisonBelt} 
                        />

                        <ViolationItemCard 
                            itemName="18. Authorized Shoes" 
                            status={authorizedShoes} 
                            onUpdate={setAuthorizedShoes} 
                        />

                        <ViolationItemCard 
                            itemName="19. Hand Cuff" 
                            status={handCuff} 
                            onUpdate={setHandCuff} 
                        />

                        <ViolationItemCard 
                            itemName="20. Short/Clean finger Nails" 
                            status={shortCleanFingerNails} 
                            onUpdate={setShortCleanFingerNails} 
                        />

                        <ViolationItemCard 
                            itemName="21. Medicine Kit With Mediplus" 
                            status={medicineKitWithMediplus} 
                            onUpdate={setMedicineKitWithMediplus} 
                        />


                        <ViolationItemCard 
                            itemName="22. Stun Gun With Flashlight" 
                            status={stunGunWithFlashlight} 
                            onUpdate={setStunGunWithFlashlight} 
                        />

                        <CustomTextInput
                            label="Violation"
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
                    <>
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
                    </>
                )}

            <View style={styles.buttonContainer}>
                <TouchableOpacity 
                    style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} 
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                            <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 10 }} />
                            <Text style={styles.submitButtonText}>Submitting...</Text>
                        </View>
                    ) : (
                        <Text style={styles.submitButtonText}>Submit</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5'
  },
    contentContainer: {
        paddingBottom: 120,
    },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  subHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  labelTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
    marginTop: 10,
    marginBottom: 8,
    color: '#333',

    // For documents
  },
  checkboxGroup: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ccc',
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
    color: '#333',
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
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    alignItems: 'center',
  },
  radioButtonActive: {
    backgroundColor: '#0056b3',
    borderColor: '#0056b3',
  },
  radioText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
  radioTextActive: {
    color: '#fff',
  },
  buttonContainer: {
    marginBottom: 60,
  },
  clearButtonContainer: {
    padding: 10,
    backgroundColor: '#fff',
  },
  clearButton: {
    padding: 10,
    backgroundColor: '#dc3545',
    borderRadius: 5,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Drop Down Selection
  dropdownButton: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#dc3545',
    alignItems: 'center',
    marginBottom: 20,
  },
  dropdownText: { fontSize: 16, fontWeight: 'bold', color: '#dc3545' },
  violationSection: {
    backgroundColor: '#ffe6e6',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },

  //E-Signature Styles
  signatureTriggerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15, backgroundColor: '#fff', padding: 15, borderRadius: 5, borderWidth: 1, borderColor: '#ccc' },
  triggerLabel: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  triggerButton: { paddingVertical: 10, paddingHorizontal: 15, backgroundColor: '#f0f0f0', borderRadius: 5, borderWidth: 1, borderColor: '#aaa' },
  triggerButtonSuccess: { backgroundColor: '#28a745' },
  triggerButtonText: { fontSize: 14, fontWeight: 'bold', color: '#333' },

  //QR CODE THAT HOPEFULLY WORKS ON FIRST TRY GOD
  scannerOverlay: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 15,
    borderRadius: 10,
  },
  scannerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  detachmentHeader: {
    backgroundColor: '#e9ecef',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 5,
    borderLeftColor: '#28a745',
  },
  detachmentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  detachmentSubtitle: {
    fontSize: 14,
    color: '#666',
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
    backgroundColor: 'rgba(0,0,0,0.7)', // Darkens the outside
  },
  middleContainer: {
    flexDirection: 'row',
    flex: 1.5, // Controls the height of the scanning box
  },
  focusedContainer: {
    flex: 2, // Controls the width of the scanning box
    borderColor: '#fff',
    borderWidth: 2,
    borderRadius: 12, // Gives it that modern rounded look from your reference
    backgroundColor: 'transparent',
  },
  bottomContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100, // Lifts the text slightly
  },

  nameGroup: {
    marginBottom: 20,
  },

  nameLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },

  nameRow: {
    flexDirection: 'row',
    gap: 8,
  },
  suggestionList: {
    backgroundColor: '#fff',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
  },
  suggestionLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    color: '#333',
  },
  suggestionItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#f4f6f8',
    marginBottom: 8,
  },
  suggestionText: {
    color: '#222',
    fontSize: 15,
  },
  submitButton: {
    backgroundColor: '#0056b3',
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#a0c4e8',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});