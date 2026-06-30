import SignaturePad from '@/components/siganture-pad';
import Checkbox from 'expo-checkbox';
import { useState } from 'react';
import { Alert, Button, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CustomTextInput from '../components/custom-text-input';
import ViolationItemCard from '../components/violation-item-card';

export default function AuditFormScreen() {
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

    const handleSubmit = () => {

        if (!guardSignature) {
            Alert.alert("Missing Signature", "The Guard on duty MUST sign the audit.");
            return;
        }

        const payload = {
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
            } : "No violations recorded"
        };

        console.log("SECURE PAYLOAD LOCKED");
        console.log(JSON.stringify(payload, null, 2));

        Alert.alert('Form Submitted', 'Your audit form has been submitted successfully.');
    };

    return (

        <ScrollView style={styles.container}>
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
                        status={pershingCap} 
                        onUpdate={setPershingCap} 
                    />

                    <ViolationItemCard 
                        itemName="2. Company ID" 
                        status={pershingCap} 
                        onUpdate={setPershingCap} 
                    />

                    <ViolationItemCard 
                        itemName="3. Pershing Cap" 
                        status={pershingCap} 
                        onUpdate={setPershingCap} 
                    />

                    <ViolationItemCard 
                        itemName="4. Authorized Hair Cut" 
                        status={pershingCap} 
                        onUpdate={setPershingCap} 
                    />

                    <ViolationItemCard 
                        itemName="5. Properly Shaved" 
                        status={pershingCap} 
                        onUpdate={setPershingCap} 
                    />
                    
                    <ViolationItemCard 
                        itemName="6. Authorized Uniform" 
                        status={pershingCap} 
                        onUpdate={setPershingCap} 
                    />
                    
                    <ViolationItemCard 
                        itemName="7. Authorized Name Cloth" 
                        status={pershingCap} 
                        onUpdate={setPershingCap} 
                    />

                    <ViolationItemCard 
                        itemName="8. Authorized Agency Patch" 
                        status={pershingCap} 
                        onUpdate={setPershingCap} 
                    />

                    <ViolationItemCard 
                        itemName="9. Necktie With Clip" 
                        status={pershingCap} 
                        onUpdate={setPershingCap} 
                    />

                    <ViolationItemCard 
                        itemName="10. Security Badge" 
                        status={pershingCap} 
                        onUpdate={setPershingCap} 
                    />

                    <ViolationItemCard 
                        itemName="11. Collar Pin 2 pcs." 
                        status={pershingCap} 
                        onUpdate={setPershingCap} 
                    />

                    <ViolationItemCard 
                        itemName="12. Lanyard (Navy Blue)" 
                        status={pershingCap} 
                        onUpdate={setPershingCap} 
                    />

                    <ViolationItemCard 
                        itemName="13. Whistle" 
                        status={pershingCap} 
                        onUpdate={setPershingCap} 
                    />

                    <ViolationItemCard 
                        itemName="14. Holster" 
                        status={pershingCap} 
                        onUpdate={setPershingCap} 
                    />

                    <ViolationItemCard 
                        itemName="15. Belt Clip 6 pcs." 
                        status={pershingCap} 
                        onUpdate={setPershingCap} 
                    />

                    <ViolationItemCard 
                        itemName="16. Belt with buckle" 
                        status={pershingCap} 
                        onUpdate={setPershingCap} 
                    />

                    <ViolationItemCard 
                        itemName="17. Garrison Belt" 
                        status={pershingCap} 
                        onUpdate={setPershingCap} 
                    />

                    <ViolationItemCard 
                        itemName="18. Authorized Shoes" 
                        status={pershingCap} 
                        onUpdate={setPershingCap} 
                    />

                    <ViolationItemCard 
                        itemName="19. Hand Cuff" 
                        status={pershingCap} 
                        onUpdate={setPershingCap} 
                    />

                    <ViolationItemCard 
                        itemName="20. Short/Clean finger Nails" 
                        status={pershingCap} 
                        onUpdate={setPershingCap} 
                    />

                    <ViolationItemCard 
                        itemName="21. Medicine Kit With Mediplus" 
                        status={pershingCap} 
                        onUpdate={setPershingCap} 
                    />


                    <ViolationItemCard 
                        itemName="22. Stun Gun With Flashlight" 
                        status={pershingCap} 
                        onUpdate={setPershingCap} 
                    />
                </View>
            )}

            <Text style={styles.subHeader}>E-Signatures</Text>
            <SignaturePad
                title="Guard Signature"
                onSign={(signature) => setGuardSignature(signature)}
            />

            <View style={styles.checkboxContainer}>
                <Checkbox
                    value={isClientAbsent}
                    onValueChange={setIsClientAbsent}
                    color={isClientAbsent ? '#0056b3' : undefined}
                />
                <Text style={styles.checkboxLabel}>Client is currently UNAVAILABLE on site</Text>
            </View>

            {!isClientAbsent && (
                <SignaturePad
                    title="Client Signature"
                    onSign={setClientSignature}
                />
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
  }
});
