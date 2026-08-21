import { useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

export default function DashboardScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.actions}>
        <Pressable style={styles.actionButton} onPress={() => router.push('/audit')}>
          <Image source={require('../../imgfolder/audit.png')} style={styles.actionIcon} resizeMode="contain" />
          <Text style={styles.actionText}>DIGITAL AUDIT</Text>
        </Pressable>

        <Pressable style={styles.actionButton} onPress={() => router.push('/history')}>
          <Image source={require('../../imgfolder/History.png')} style={styles.actionIcon} resizeMode="contain" />
          <Text style={styles.actionText}>HISTORY</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', paddingHorizontal: 24 },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: 34, marginTop: 40 },
  actionButton: {
    width: 125,
    height: 123,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#b9d4f2',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: { width: 52, height: 52 },
  actionText: { color: '#222', fontSize: 14, fontWeight: '500' },
});
