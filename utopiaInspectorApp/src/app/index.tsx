import { useEffect } from 'react';
import { ActivityIndicator, Image, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

export default function IndexScreen() {
    const router = useRouter();

    useEffect(() => {
        const checkRoutingState = async () => {
            try {
                // 1. Check if the user is currently logged in via Supabase Auth
                const { data: { session } } = await supabase.auth.getSession();
                
                if (!session) {
                    router.replace('/login');
                    return;
                }

                // 2. Check if the device is securely provisioned
                const isProvisioned = await AsyncStorage.getItem('device_provisioned');
                
                if (isProvisioned === 'true') {
                    router.replace('/homepage' as any);
                } else {
                    router.replace('/provision');
                }
            } catch (error) {
                console.error("Routing Error", error);
                router.replace('/login');
            }
        };

        // Add a slight delay so the user actually sees the beautiful splash screen
        setTimeout(checkRoutingState, 1500);
    }, []);

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.flex}>
                <View style={styles.outerShell}>
                    <View style={styles.card}>
                        <Image source={require('../../imgfolder/download-removebg-preview.png')} style={styles.logo} resizeMode="contain" />
                        
                        <View style={styles.securityBadge}>
                            <View style={styles.securityDot} />
                            <Text style={styles.securityBadgeText}>SECURE BOOT</Text>
                        </View>

                        <View style={styles.content}>
                            <Text style={styles.eyebrow}>UTOPIA OPERATIONS</Text>
                            <Text style={styles.title}>System Init</Text>
                            <Text style={styles.subtitle}>Verifying cryptographic identity...</Text>
                            
                            <ActivityIndicator size="large" color="#3f73c4" style={{ marginTop: 20 }} />
                        </View>

                        <Text style={styles.footer}>Utopia Security And Safety Solutions Inc.  |  Inspector Portal</Text>
                    </View>
                </View>
            </View>
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
    content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    eyebrow: { color: '#3f73c4', fontSize: 11, fontWeight: '800', letterSpacing: 1.8, textAlign: 'center', marginBottom: 8 },
    title: { color: '#16213b', fontSize: 32, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
    subtitle: { color: '#68788d', fontSize: 14, lineHeight: 20, textAlign: 'center', marginBottom: 22 },
    footer: { marginTop: 'auto', paddingTop: 56, paddingBottom: 12, color: '#718198', fontSize: 11, textAlign: 'center' },
});