import { useEffect, useRef } from 'react';
import { Alert, BackHandler, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SignatureScreen from 'react-native-signature-canvas';
import { color, radius, space, type } from '@/constants/tokens';

interface SignaturePadProps {
    title: string;
    visible: boolean;
    onClose: () => void;
    onSign: (signatureBase64: string) => void;
}

/**
 * The e-signature block that replaces the wet signature on the paper form.
 *
 * The canvas is deliberately a fixed 300pt band, not a full-height surface.
 * SignatureScreen is a WebView running with androidHardwareAccelerationDisabled
 * and a software layer, which the blank-canvas bug on Android needs. Under
 * software rendering the cost of a stroke scales with the painted area, so
 * stretching the canvas to fill the screen made every stroke repaint roughly
 * two and a half times the pixels and the pen visibly lagged the finger.
 * A signature is wide and short anyway.
 */
export default function SignaturePad({ title, visible, onClose, onSign }: SignaturePadProps) {
    const signatureRef = useRef<any>(null);
    const insets = useSafeAreaInsets();

    useEffect(() => {
        if (!visible) {
            return;
        }

        const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
            onClose();
            return true;
        });

        return () => subscription.remove();
    }, [visible, onClose]);

    const handleSignature = (signature: string) => {
        if (!signature) {
            Alert.alert('Signature unavailable', 'Please sign inside the box, then try saving again.');
            return;
        }

        onSign(signature);
        onClose();
    };

    if (!visible) {
        return null;
    }

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <View style={styles.screen}>
                <View style={[styles.header, { paddingTop: insets.top + space.md }]}>
                    <Text style={styles.headerEyebrow}>Signature</Text>
                    <Text style={styles.headerTitle}>{title}</Text>
                </View>

                <View style={styles.hint}>
                    <Text style={styles.hintText}>Sign inside the box</Text>
                </View>

                <View style={styles.canvas}>
                    <SignatureScreen
                        ref={signatureRef}
                        onOK={handleSignature}
                        onEmpty={() => Alert.alert('Signature required', 'Please add a signature before saving.')}
                        onError={(error) => {
                            console.error('Signature pad error:', error);
                            Alert.alert('Signature error', 'The signature pad could not save. Please try again.');
                        }}
                        androidLayerType="software"
                        androidHardwareAccelerationDisabled={true}
                        webStyle={`.m-signature-pad--footer { display: none; margin: 0px; }`}
                    />
                </View>

                <View style={styles.spacer} />

                <View style={[styles.actions, { paddingBottom: insets.bottom + space.md }]}>
                    <Pressable
                        onPress={onClose}
                        accessibilityRole="button"
                        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
                    >
                        <Text style={styles.buttonLabel}>Cancel</Text>
                    </Pressable>

                    <Pressable
                        onPress={() => signatureRef.current?.clearSignature()}
                        accessibilityRole="button"
                        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
                    >
                        <Text style={styles.buttonLabel}>Clear</Text>
                    </Pressable>

                    <Pressable
                        onPress={() => signatureRef.current?.readSignature()}
                        accessibilityRole="button"
                        style={({ pressed }) => [styles.button, styles.save, pressed && styles.savePressed]}
                    >
                        <Text style={[styles.buttonLabel, styles.saveLabel]}>Save</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: color.canvas },

    header: {
        backgroundColor: color.shell,
        paddingHorizontal: space.lg, paddingBottom: space.md,
        gap: 2,
    },
    headerEyebrow: { ...type.label, color: color.shellMuted },
    headerTitle: { ...type.title, color: color.shellInk, fontSize: 17 },

    hint: { paddingHorizontal: space.lg, paddingVertical: space.md },
    hintText: { ...type.label },

    /* Fixed height, for the reason in the header comment. Hairline box, no
     * radius: the canvas is the content, not a card. */
    canvas: {
        height: 300,
        backgroundColor: color.surface,
        borderTopWidth: 1, borderBottomWidth: 1, borderColor: color.line,
        overflow: 'hidden',
    },

    spacer: { flex: 1 },

    actions: {
        flexDirection: 'row', gap: space.sm,
        paddingHorizontal: space.lg, paddingTop: space.md,
        backgroundColor: color.surface,
    },
    button: {
        flex: 1, alignItems: 'center',
        borderWidth: 1, borderColor: color.lineStrong, borderRadius: radius.control,
        paddingVertical: space.md,
        backgroundColor: color.surface,
    },
    /* Instant, no timing curve. */
    buttonPressed: { backgroundColor: color.sunken },
    buttonLabel: { ...type.badge, color: color.ink, fontSize: 11 },

    save: { backgroundColor: color.ink, borderColor: color.ink },
    savePressed: { backgroundColor: color.shellHover },
    saveLabel: { color: color.surface },
});
