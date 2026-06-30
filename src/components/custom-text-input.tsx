import { StyleSheet, Text, TextInput, View } from 'react-native';

interface CustomTextInputProps {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    multiline?: boolean;
}

export default function CustomTextInput({ label, value, onChangeText, multiline = false }: CustomTextInputProps) {
    return (
        <View style={styles.container}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
                style={[styles.input, multiline && styles.textArea]}
                value={value}
                onChangeText={onChangeText}
                multiline={multiline}
                placeholder={`Enter ${label}...`}
            />
        </View>
    );
}   

const styles = StyleSheet.create({
    container: { marginBottom: 15 },
    label: { fontSize: 16, fontWeight: 'bold', marginBottom: 5, color: '#333' },
    input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10, fontSize: 16, backgroundColor: '#fff' },
    textArea: { height: 100, textAlignVertical: 'top' },
});