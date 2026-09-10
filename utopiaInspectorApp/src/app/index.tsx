import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { ApiError } from '@/lib/api';
import { resolveGateRoute, signOutInspector } from '@/lib/inspectorAccount';
import AuthShell from '@/components/auth-shell';
import { color, space, type } from '@/constants/tokens';

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

                /* 2. Ask operations whether this inspector has been cleared.
                 * The access-key prompt is gone: approval now lives in the
                 * inspectors record, and the server is the one who reads it. */
                const { route } = await resolveGateRoute();
                router.replace(route as any);
            } catch (error) {
                // A rejected token is a dead session, not a denied approval.
                if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
                    await signOutInspector();
                    router.replace('/login');
                    return;
                }

                console.error("Routing Error", error);
                router.replace('/awaiting-approval' as any);
            }
        };

        // Add a slight delay so the user actually sees the beautiful splash screen
        setTimeout(checkRoutingState, 1500);
    }, [router]);

    return (
        <AuthShell eyebrow="Utopia operations" title="Inspector portal">
            <View style={styles.status}>
                <ActivityIndicator size="small" color={color.ink} />
                <Text style={type.label}>Verifying identity</Text>
            </View>
        </AuthShell>
    );
}

const styles = StyleSheet.create({
    status: {
        flexDirection: 'row', alignItems: 'center', gap: space.md,
        backgroundColor: color.surface,
        borderTopWidth: 1, borderBottomWidth: 1, borderColor: color.line,
        paddingHorizontal: space.lg, paddingVertical: space.lg,
    },
});
