import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ViolationItemCardProps {
    itemName: string;
    status: 'Yes' | 'No';
    onUpdate: (newStatus: 'Yes' | 'No') => void;
}

export default function ViolationItemCard({ itemName, status, onUpdate }: ViolationItemCardProps) {
    return (
        <View style={styles.cardContainer}>
            <Text style={styles.itemName}>{itemName}</Text>
            <View style={styles.radioGroup}>
                <TouchableOpacity
                    style={[styles.radioButton, status === 'Yes' && styles.radioButtonActive]}
                    onPress={() => onUpdate('Yes')}
                >
                    <Text style={[styles.radioText, status === 'Yes' && styles.radioTextActive]}>Yes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.radioButton, status === 'No' && styles.radioButtonActive]}
                    onPress={() => onUpdate('No')}
                >
                    <Text style={[styles.radioText, status === 'No' && styles.radioTextActive]}>No</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    cardContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 12,
  },
  itemName: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  radioGroup: { flexDirection: 'row', justifyContent: 'space-between' },
  radioButton: { flex: 1, paddingVertical: 10, marginHorizontal: 5, backgroundColor: '#f0f0f0', borderRadius: 5, alignItems: 'center' },
  radioButtonActive: { backgroundColor: '#0056b3' },
  radioButtonActiveRed: { backgroundColor: '#dc3545' }, // Red for 'No' violations
  radioText: { fontSize: 14, fontWeight: 'bold', color: '#555' },
  radioTextActive: { color: '#fff' }
});