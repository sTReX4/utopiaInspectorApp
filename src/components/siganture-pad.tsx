import { useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import SignatureScreen from 'react-native-signature-canvas';

interface SignaturePadProps {
    title: string;
    onSign: (signatureBase64: string) => void;
}

export default function SignaturePad({ title, onSign }: SignaturePadProps) {
    const signatureRef = useRef<any>(null);

    const handleSignature = (signature: string) => {
        onSign(signature);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{title}</Text>

            <View style={styles.canvasContainer}>
                <SignatureScreen
                    ref={signatureRef}
                    onOK={handleSignature}
                    webStyle={`
                        .m-signature-pad--footer { display: none; margin: 0px; }`}
                    descriptionText="Sign above"
                    clearText="Clear"
                    confirmText="Save"
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
    title: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#333' },
    canvasContainer: { height: 200, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, overflow: 'hidden' },
});