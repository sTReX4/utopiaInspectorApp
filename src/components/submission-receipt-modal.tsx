import { Button, Image, Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

interface ReceiptProps {
    visible: boolean;
    onClose: () => void;
    payload: any;
}

export default function SubmissionReceiptModal({ visible, onClose, payload }: ReceiptProps) {
    if (!payload) return null;

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Audit Submission Receipt</Text>
            </View>

            <ScrollView style={styles.container}>

                {/* Visual Map Rendering */}
                <Text style={styles.sectionTitle}>GPS Location Verification</Text> 
                {payload.gps_coordinates !== "GPS Unavailable" ? (
                    <View style={styles.mapContainer}>
                        <MapView
                            style={styles.map}
                            initialRegion={{
                                latitude: payload.gps_coordinates.latitude,
                                longitude: payload.gps_coordinates.longitude,
                                latitudeDelta: 0.005,
                                longitudeDelta: 0.005,
                            }}
                        >
                            <Marker
                                coordinate={{
                                    latitude: payload.gps_coordinates.latitude,
                                    longitude: payload.gps_coordinates.longitude,
                                }}
                                title="Inspector Location"
                                description={payload.branch_name}
                            /> 
                        </MapView>
                    </View>
                ) : (
                    <Text style={styles.errorText}>No GPS Data Captured</Text>
                )}

                {/* Live Photo Rendering */}
                <Text style={styles.sectionTitle}>Live Photo Evidence</Text>
                {payload.live_photo_uri ? (
                    <Image source={{ uri: payload.live_photo_uri }} style={styles.livePhoto} />
                ) : (
                    <Text style={styles.errorText}>No Photo Captured</Text>
                )}

                {/* E-Signature Rendering */}
                <Text style={styles.sectionTitle}>E-Signature</Text>
                <View style={styles.signatureRow}>
                    <View style={styles.signatureBlock}>
                        <Text style={styles.signatureLabel}>Guard on Duty</Text>
                        {payload.guard_signature ? (
                            <Image source={{ uri: payload.guard_signature }} style={styles.signatureImage} />
                        ) : (
                            <Text style={styles.errorText}>Missing</Text>
                        )}
                    </View>

                    <View style={styles.signatureBlock}>
                        <Text style={styles.signatureLabel}>Client Rep</Text>
                        {payload.client_signature === "Client Absent" ? (
                            <Text style={styles.absentText}>Client Absent</Text>
                        ) : payload.client_signature ? (
                            <Image source={{ uri: payload.client_signature }} style={styles.signatureImage} />
                        ) : (
                            <Text style={styles.errorText}>Missing</Text>
                        )}
                    </View>
                </View>

                <View style={styles.buttonContainer}>
                    <Button title="Close Receipt & Return Home" onPress={onClose} color="#28a745"/>
                </View>

            </ScrollView>
        </Modal>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
    header: { backgroundColor: '#0056b3', padding: 20, paddingTop: 50, alignItems: 'center' },
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 10, color: '#333' },
    mapContainer: { height: 200, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#ccc' },
    map: { flex: 1 },
    livePhoto: { width: '100%', height: 300, borderRadius: 10, resizeMode: 'cover', borderWidth: 1, borderColor: '#ccc' },
    signatureRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    signatureBlock: { flex: 1, backgroundColor: '#fff', padding: 10, marginHorizontal: 5, borderRadius: 8, borderWidth: 1, borderColor: '#ccc', alignItems: 'center' },
    signatureLabel: { fontSize: 14, fontWeight: 'bold', marginBottom: 5 },
    signatureImage: { width: 120, height: 80, resizeMode: 'contain' },
    errorText: { color: 'red', fontStyle: 'italic' },
    absentText: { color: '#dc3545', fontWeight: 'bold', marginTop: 30 },
    buttonContainer: { marginTop: 20, marginBottom: 50 }
});