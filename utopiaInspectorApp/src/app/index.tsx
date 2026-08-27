import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DeviceProvisioningScreen() {
    const router = useRouter();
    const [accessKey, setAccessKey] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkProvisioningStatus = async () => {
            try {
                const isProvisioned = await AsyncStorage.getItem('device_provisioned');
                if (isProvisioned === 'true') {
                    router.replace('/login');
                } else {
                    setIsLoading(false);
                }
            } catch (error) {
                setIsLoading(false);
            }
        };
        checkProvisioningStatus();
    }, []);

    const handleProvisionDevice = async () => {
        if (!accessKey.trim()) {
            Alert.alert('Required', 'Please enter your Access Key.');
            return;
        }

        setIsLoading(true);

        try {
            // IMPORTANT: Ensure this matches your actual Vercel URL
            const API_URL = 'https://utopia-inspector-app.vercel.app/api/provision';
            
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accessKey: accessKey.trim().toUpperCase()
                }),
            });

            const responseText = await response.text();
            
            if (!response.ok) {
                Alert.alert('Authorization Failed', responseText);
                setIsLoading(false);
                return;
            }

            const result = JSON.parse(responseText);

            await AsyncStorage.setItem('device_provisioned', 'true');
            await AsyncStorage.setItem('inspector_name', result.inspectorName);
            
            Alert.alert('Device Authorized', `Welcome, ${result.inspectorName}.`, [
                { text: 'Proceed', onPress: () => router.replace('/login') }
            ]);
            
        } catch (error) {
            Alert.alert('Network Error', 'Could not connect to Utopia servers. Please verify your connection.');
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#0056b3" />
                <Text style={{ marginTop: 20, color: '#666' }}>Verifying Device...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.title}>Utopia Security</Text>
                <Text style={styles.subtitle}>Device Provisioning</Text>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Access Key</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="UTP-XXXXXX"
                        placeholderTextColor="#9ca3af"
                        value={accessKey}
                        onChangeText={setAccessKey}
                        autoCapitalize="characters"
                        autoCorrect={false}
                    />
                </View>

                <TouchableOpacity 
                    style={styles.button} 
                    onPress={handleProvisionDevice}
                    disabled={isLoading}
                >
                    <Text style={styles.buttonText}>Authorize Device</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f3f4f6', justifyContent: 'center', padding: 20 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6' },
    card: { backgroundColor: '#ffffff', padding: 30, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
    title: { fontSize: 28, fontWeight: '900', color: '#111827', textAlign: 'center', textTransform: 'uppercase' },
    subtitle: { fontSize: 14, fontWeight: 'bold', color: '#6b7280', textAlign: 'center', marginBottom: 30, textTransform: 'uppercase', letterSpacing: 1 },
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 12, fontWeight: 'bold', color: '#4b5563', marginBottom: 8, textTransform: 'uppercase' },
    input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 15, fontSize: 16, color: '#111827', fontWeight: '500' },
    button: { backgroundColor: '#111827', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    buttonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' }
});