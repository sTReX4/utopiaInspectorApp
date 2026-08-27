import React, { useState } from 'react';
import { View, Text, TextInput, Alert, ActivityIndicator, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

const primaryColor = '#3f73c4';

export default function ProvisionScreen() {
    const router = useRouter();
    const [accessKey, setAccessKey] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleProvisionDevice = async () => {
        if (!accessKey.trim()) {
            return Alert.alert('Required', 'Please enter your assigned Access Key.');
        }

        setIsLoading(true);

        try {
            const { data: { session }, error: authError } = await supabase.auth.getSession();
            if (authError || !session) {
                Alert.alert('Authentication Error', 'You must be logged in to provision a device.');
                setIsLoading(false);
                return;
            }

            // IMPORTANT: Ensure this matches your actual Vercel URL
            const API_URL = 'https://utopia-inspector-app.vercel.app/api/provision';
            
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accessKey: accessKey.trim().toUpperCase(),
                    authId: session.user.id
                }),
            });

            const responseText = await response.text();
            
            if (!response.ok) {
                let errorMsg = 'Authorization Failed';
                try {
                    const errorObj = JSON.parse(responseText);
                    errorMsg = errorObj.error || errorMsg;
                } catch (e) {
                    errorMsg = responseText;
                }
                Alert.alert('Authorization Failed', errorMsg);
                setIsLoading(false);
                return;
            }

            const result = JSON.parse(responseText);

            await AsyncStorage.setItem('device_provisioned', 'true');
            await AsyncStorage.setItem('inspector_name', result.inspectorName);
            
            Alert.alert('Device Authorized', `Identity linked! Welcome, ${result.inspectorName}.`, [
                { text: 'Proceed', onPress: () => router.replace('/audit') }
            ]);
            
        } catch (error) {
            Alert.alert('Network Error', 'Could not connect to Utopia servers. Please verify your connection.');
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                    <View style={styles.flex}>
                        <View style={styles.outerShell}>
                            <View style={styles.card}>
                                <Image source={require('../../imgfolder/download-removebg-preview.png')} style={styles.logo} resizeMode="contain" />
                                
                                <View style={styles.securityBadge}>
                                    <View style={styles.securityDot} />
                                    <Text style={styles.securityBadgeText}>DEVICE LINKING</Text>
                                </View>

                                <View style={styles.content}>
                                    <Text style={styles.eyebrow}>STEP 2 OF 2</Text>
                                    <Text style={styles.title}>Authorization</Text>
                                    <Text style={styles.subtitle}>Enter the Access Key provided by your Operations Manager to unlock this device.</Text>

                                    <View style={styles.inputContainer}>
                                        <Text style={styles.inputLabel}>Admin Access Key</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="UTP-XXXXXX"
                                            placeholderTextColor="#9aa0a6"
                                            value={accessKey}
                                            onChangeText={setAccessKey}
                                            autoCapitalize="characters"
                                            autoCorrect={false}
                                        />
                                    </View>

                                    {isLoading ? (
                                        <ActivityIndicator size="large" color={primaryColor} style={{ marginTop: 22 }} />
                                    ) : (
                                        <Pressable style={styles.primaryButton} onPress={handleProvisionDevice}>
                                            <Text style={styles.primaryButtonText}>Verify & Unlock</Text>
                                        </Pressable>
                                    )}
                                </View>

                                <Text style={styles.footer}>Utopia Security And Safety Solutions Inc.  |  Inspector Portal</Text>
                            </View>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#0b1d31' },
    flex: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    outerShell: { width: '92%', maxWidth: 430, alignSelf: 'center' },
    card: { minHeight: 670, borderWidth: 1, borderColor: '#d8e3ef', borderRadius: 18, backgroundColor: '#fff', paddingHorizontal: 42, paddingTop: 42, paddingBottom: 24, alignItems: 'stretch', justifyContent: 'space-between', shadowColor: '#020b17', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 24, elevation: 8 },
    logo: { width: 120, height: 135, alignSelf: 'center', marginBottom: 20 },
    securityBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', marginBottom: 16, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: '#eaf7f5' },
    securityDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#159a83', marginRight: 7 },
    securityBadgeText: { color: '#147866', fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
    content: { flex: 1, justifyContent: 'center', alignItems: 'stretch', width: '100%' },
    eyebrow: { color: '#3f73c4', fontSize: 11, fontWeight: '800', letterSpacing: 1.8, textAlign: 'center', marginBottom: 8 },
    title: { color: '#16213b', fontSize: 32, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
    subtitle: { color: '#68788d', fontSize: 14, lineHeight: 20, textAlign: 'center', marginBottom: 22 },
    inputContainer: { width: '100%' },
    inputLabel: { color: '#26384f', fontSize: 12, fontWeight: '700', marginBottom: 6 },
    input: { height: 46, borderWidth: 1, borderColor: '#c4d3e6', borderRadius: 9, paddingHorizontal: 12, fontSize: 15, color: '#24364d', backgroundColor: '#fbfdff', marginBottom: 14 },
    primaryButton: { height: 49, borderRadius: 12, backgroundColor: primaryColor, alignItems: 'center', justifyContent: 'center', marginTop: 22, shadowColor: '#1c4e8d', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 3 },
    primaryButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
    footer: { marginTop: 'auto', paddingTop: 56, paddingBottom: 12, color: '#718198', fontSize: 11, textAlign: 'center' },
});