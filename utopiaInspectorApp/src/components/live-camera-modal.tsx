import { CameraView } from 'expo-camera';
import { useRef } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color, radius, space, type } from '@/constants/tokens';

interface LiveCameraModalProps {
    visible: boolean;
    onClose: () => void;
    onCapture: (uri: string) => void;
}

/**
 * Camera-only capture. There is no gallery picker here by design: the audit is
 * only evidence if the photograph was taken on site, at the moment of the
 * inspection.
 */
export default function LiveCameraModal({ visible, onClose, onCapture }: LiveCameraModalProps) {
    const cameraRef = useRef<CameraView>(null);
    const insets = useSafeAreaInsets();

    const handleTakePicture = async () => {
        if (cameraRef.current) {
            const photo = await cameraRef.current.takePictureAsync();
            if (photo && photo.uri) {
                onCapture(photo.uri);
                onClose();
            }
        }
    };

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <View style={styles.container}>
                <CameraView style={StyleSheet.absoluteFill} facing="back" ref={cameraRef} />

                <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
                    <View style={[styles.head, { paddingTop: insets.top + space.md }]}>
                        <Text style={styles.headLabel}>Live capture</Text>
                    </View>

                    <View style={{ flex: 1 }} pointerEvents="none" />

                    <View style={[styles.controls, { paddingBottom: insets.bottom + space.lg }]}>
                        <View style={styles.side}>
                            <Pressable
                                onPress={onClose}
                                accessibilityRole="button"
                                hitSlop={8}
                                style={({ pressed }) => [styles.cancel, pressed && styles.cancelPressed]}
                            >
                                <Text style={styles.cancelLabel}>Cancel</Text>
                            </Pressable>
                        </View>

                        {/* The one round control in the app. A shutter is a
                          * platform convention an inspector already knows, and
                          * the pill step is on the radius scale anyway. */}
                        <Pressable
                            onPress={handleTakePicture}
                            accessibilityRole="button"
                            accessibilityLabel="Take photo"
                            style={({ pressed }) => [styles.shutter, pressed && styles.shutterPressed]}
                        >
                            <View style={styles.shutterRing} />
                        </Pressable>

                        <View style={styles.side} />
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: color.shell },

    head: {
        backgroundColor: 'rgba(15, 23, 42, 0.82)',
        paddingHorizontal: space.lg, paddingBottom: space.md,
    },
    headLabel: { ...type.badge, color: color.shellMuted, fontSize: 10 },

    controls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.82)',
        paddingHorizontal: space.lg, paddingTop: space.lg,
    },
    side: { flex: 1 },

    cancel: {
        alignSelf: 'flex-start',
        borderWidth: 1, borderColor: color.shellMuted, borderRadius: radius.control,
        paddingHorizontal: space.md, paddingVertical: space.sm,
    },
    cancelPressed: { backgroundColor: color.shellHover },
    cancelLabel: { ...type.badge, color: color.shellInk, fontSize: 11 },

    shutter: {
        width: 66, height: 66, borderRadius: radius.badge,
        backgroundColor: color.shellInk,
        justifyContent: 'center', alignItems: 'center',
    },
    shutterPressed: { backgroundColor: color.shellMuted },
    shutterRing: {
        width: 56, height: 56, borderRadius: radius.badge,
        borderWidth: 1, borderColor: color.shell,
    },
});
