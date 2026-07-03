import { CameraView, useCameraPermissions } from 'expo-camera';
import Checkbox from 'expo-checkbox';
import * as Location from 'expo-location';
import { useState } from 'react';
import { Alert, Button, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CustomTextInput from '../components/custom-text-input';
import LiveCameraModal from '../components/live-camera-modal';
import SignaturePad from '../components/siganture-pad';
import ViolationItemCard from '../components/violation-item-card';

export default function AuditFormScreen() {
    // Camera Permissions
    const [permission, requestPermission] = useCameraPermissions();

    const [isVerified, setIsVerified] = useState<boolean>(false);
    const [isProcessingScan, setIsProcessingScan] = useState<boolean>(false);

    const [branchCode, setBranchCode] = useState<string>('');
    const [branchName, setBranchName] = useState<string>('');
    const [branchLocation, setBranchLocation] = useState<string>('');


    const [guardName, setGuardName] = useState<string>('');
    const [lespNumber, setLespNumber] = useState<string>('');
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

    //Signature State Memory
    const [guardSignature, setGuardSignature] = useState<string | null>(null);
    const [clientSignature, setClientSignature] = useState<string | null>(null);
    const [isClientAbsent, setIsClientAbsent] = useState<boolean>(false);

    const [isGuardModalOpen, setIsGuardModalOpen] = useState<boolean>(false);
    const [isClientModalOpen, setIsClientModalOpen] = useState<boolean>(false);

    //Live Photo Camera
    const [livePhotoUri, setLivePhotoUri] = useState<string | null>(null);
    const [isCameraModalOpen, setIsCameraModalOpen] = useState<boolean>(false);

    // Coordinates Tracker
    const [locationPermission, requestLocationPermission ] = Location.useForegroundPermissions();
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [timeIn, setTimeIn] = useState<string | null>(null);

    const handleBarcodeScanned = ({ data }: { data: string }) => {
        try {
            const parsedData = JSON.parse(data);
            
            if (parsedData.code && parsedData.name && parsedData.location) {
                setBranchCode(parsedData.code);
                setBranchName(parsedData.name);
                setBranchLocation(parsedData.location);
                setIsVerified(true);
                Alert.alert("Detachment Verified", `Welcome to ${parsedData.name}, ${parsedData.location}`);
            } else {
                Alert.alert("Invalid QR Code", "This QR code does not belong to a valid detachment.", [{ text: "Try Again", onPress: () => setIsProcessingScan(false) }]);
            }
            } catch (error) {
                Alert.alert("Scan Failed", "Unrecognized QR format. Please scan an official Utopia detachment code.", [{ text: "Try Again", onPress: () => setIsProcessingScan(false) }]);
            }
        
    };

    const handleSubmit = () => {

        if (!guardSignature) {
            Alert.alert("Missing Signature", "The Guard on duty MUST sign the audit.");
            return;
        }

        //Live Photo Capture Modal
        if (!livePhotoUri) {
            Alert.alert("Missing Evidence", "You must capture a live photo of the guard on post before submitting the audit.");
            return ;
        }

        const payload = {
            branch_code: branchCode,
            branch_name: branchName,
            branch_location: branchLocation,

            inspector_in_time: new Date().toISOString(),
            guard_name: guardName,
            lesp_number: lespNumber,
            uniform_compliance: isUniformCompliant,

            metrics: {
                lto_license: ltoStatus,
                ddo_license: ddoStatus,
                ltofp_license: ltofpStatus,
                fa_license: faStatus,
                id_license: idStatus,
                rlm_license: rlmStatus,
            },
            remarks: remarks,

            violation_ticket: isTicketOpen ? {
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
            } : "No violations recorded",

            live_photo_uri: livePhotoUri,
            guard_signature: guardSignature,
            client_signature: isClientAbsent ? "Client Absent" : clientSignature
        };

        console.log("SECURE PAYLOAD LOCKED");
        console.log(JSON.stringify(payload, null, 2));

        Alert.alert('Form Submitted', 'Your audit form has been submitted successfully.');
    };

    // For Camera QR Code Scanning
        if (!permission) {
            return <View style={styles.container}><Text>Loading Camera...</Text></View>;
        }

        if (!permission.granted) {
            return (
                <View style={[styles.container, { justifyContent: 'center'}]}>
                    <Text style={{ textAlign: 'center', marginBottom: 20 }}>Camera access is required to scan the detachment QR code.</Text>
                    <Button title="Grant Camera Permission" onPress={requestPermission} color="#0056b3"/>
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
                        <Text style={styles.scannerText}>Scan Detachment QR Code to Begin Audit</Text>
                    </View>
                </View>
            );
        }

    return (

        <ScrollView style={styles.container}>

            <View style={styles.detachmentHeader}>
                <Text style={styles.detachmentTitle}>{branchName} ({branchCode})</Text>
                <Text style={styles.detachmentSubtitle}>{branchLocation}</Text>
            </View>

            <Text style={styles.header}>Audit Form</Text>

            <CustomTextInput
                label="Guard Name"
                value={guardName}
                onChangeText={setGuardName}
            />
            
            <CustomTextInput
                label="LESP Details"
                value={lespNumber}
                onChangeText={setLespNumber}
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
                </View>
            )}

            <Text style={styles.subHeader}>Live Photo Capture</Text>
            <View style={styles.signatureTriggerRow}>   
                <Text style={styles.triggerLabel}>Guard on Post:</Text>
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
                <View style={styles.signatureTriggerRow}>
                    <Text style={styles.triggerLabel}>Guard on Duty:</Text>
                    <TouchableOpacity 
                        style={[styles.triggerButton, guardSignature && styles.triggerButtonSuccess]} 
                        onPress={() => setIsGuardModalOpen(true)}
                    >
                        <Text style={styles.triggerButtonText}>
                            {guardSignature ? "✅ Signature Captured" : "Tap to Sign"}
                        </Text>
                    </TouchableOpacity>
                </View>

                <SignaturePad 
                    title="Guard on Duty Signature" 
                    visible={isGuardModalOpen}
                    onClose={() => setIsGuardModalOpen(false)}
                    onSign={setGuardSignature} 
                />

                <View style={styles.checkboxContainer}>
                    <Checkbox value={isClientAbsent} onValueChange={setIsClientAbsent} color={isClientAbsent ? '#dc3545' : undefined} />
                    <Text style={styles.checkboxLabel}>Client is currently UNAVAILABLE on site</Text>
                </View>

                {!isClientAbsent && (
                    <>
                        <View style={styles.signatureTriggerRow}>
                            <Text style={styles.triggerLabel}>Client Rep:</Text>
                            <TouchableOpacity 
                                style={[styles.triggerButton, clientSignature && styles.triggerButtonSuccess]} 
                                onPress={() => setIsClientModalOpen(true)}
                            >
                                <Text style={styles.triggerButtonText}>
                                    {clientSignature ? "✅ Signature Captured" : "Tap to Sign"}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Client Modal Component */}
                        <SignaturePad 
                            title="Client / Representative Signature" 
                            visible={isClientModalOpen}
                            onClose={() => setIsClientModalOpen(false)}
                            onSign={setClientSignature} 
                        />
                    </>
                )}

            <View style={styles.buttonContainer}>
                <Button title="Submit" onPress={handleSubmit} color="#0056b3"/>
            </View>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5'
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
    paddingBottom: 40, // Lifts the text slightly
  }
});
