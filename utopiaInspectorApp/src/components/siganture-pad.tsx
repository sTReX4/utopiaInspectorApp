import { useRef } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import SignatureScreen from 'react-native-signature-canvas';

interface SignaturePadProps {
    title: string;
    visible: boolean;
    onClose: () => void;
    onSign: (signatureBase64: string) => void;
}

export default function SignaturePad({ title, visible, onClose, onSign }: SignaturePadProps) {
    const signatureRef = useRef<any>(null);

    const handleSignature = (signature: string) => {
        onSign(signature);
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent={true}>

            <View style={styles.modalOverlay}>

                <View style={styles.modalContent}>

                    <Text style={styles.title}>{title}</Text>

                    <View style={styles.canvasContainer}>
                        <SignatureScreen
                            ref={signatureRef}
                            onOK={handleSignature}
                            webStyle={`.m-signature-pad--footer { display: none; margin: 0px; }`}
                        />
                    </View>

                    <View style={styles.buttonRow}>
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton]}
                            onPress={onClose}
                        >
                            <Text style={styles.buttonText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.clearButton]}
                            onPress={() => signatureRef.current.clearSignature()}
                        >
                            <Text style={styles.buttonText}>Clear</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.saveButton]}
                            onPress={() => signatureRef.current?.readSignature()}
                        >
                            <Text style={[styles.buttonText, { color: '#fff' }]}>Save</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
            
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        elevation: 5,
    },
    title: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
    canvasContainer: { 
        height: 300, // Taller canvas since it's a pop-up now
        backgroundColor: '#fff', 
        borderWidth: 1, 
        borderColor: '#ccc',
        borderRadius: 5,
        overflow: 'hidden'
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 15,
    },
    button: {
        flex: 1,
        padding: 12,
        borderRadius: 5,
        marginHorizontal: 5,
        alignItems: 'center',
    },
    cancelButton: { backgroundColor: '#e0e0e0' },
    clearButton: { backgroundColor: '#ffc107' },
    saveButton: { backgroundColor: '#0056b3' },
    buttonText: { fontWeight: 'bold', color: '#333' }
});