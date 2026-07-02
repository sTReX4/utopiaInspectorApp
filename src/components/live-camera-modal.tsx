import { CameraView } from 'expo-camera';
import { useRef } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface LiveCameraModalProps {
    visible: boolean;
    onClose: () => void;
    onCapture: (uri: string) => void;
}

export default function LiveCameraModal({ visible, onClose, onCapture }: LiveCameraModalProps) {
    const cameraRef = useRef<CameraView>(null);

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
                <CameraView style={styles.camera} facing="back" ref={cameraRef}>
                    <View style={{ flex: 1}}/>

                    <View style={styles.controlsContainer}>

                        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                            <Text style={styles.buttonText}>Close</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.captureButton} onPress={handleTakePicture}>
                            <View style={styles.captureInnerCircle} />
                        </TouchableOpacity>
                        
                        <View style={{ flex: 1 }} />

                    </View>
                </CameraView>
            </View>
        </Modal>
    );

}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    camera: { flex: 1, justifyContent: 'space-between' },
    controlsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 30,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    cancelButton: { flex: 1 },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    captureButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    captureInnerCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 2,
        borderColor: '#000',
    }
});