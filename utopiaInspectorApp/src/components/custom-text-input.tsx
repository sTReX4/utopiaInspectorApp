import { StyleSheet, Text, TextInput, View } from 'react-native';
import { color, radius, space, type } from '@/constants/tokens';

interface CustomTextInputProps {
    label?: string;
    value: string;
    onChangeText: (text: string) => void;
    multiline?: boolean;
    placeholder?: string;
    hint?: string;
}

/**
 * Label above, control below, helper under that. Never placeholder-as-label:
 * the placeholder disappears the moment the inspector types, and a field whose
 * only label vanishes on first keystroke is unreadable on review.
 */
export default function CustomTextInput({
    label, value, onChangeText, multiline = false, placeholder, hint,
}: CustomTextInputProps) {
    return (
        <View style={styles.container}>
            {label ? <Text style={type.label}>{label}</Text> : null}
            <TextInput
                style={[styles.input, multiline && styles.textArea]}
                value={value}
                onChangeText={onChangeText}
                multiline={multiline}
                placeholder={placeholder}
                /* inkMuted, not a stock slate-400. Placeholder text still has
                 * to clear WCAG AA against the white field. */
                placeholderTextColor={color.inkMuted}
            />
            {hint ? <Text style={styles.hint}>{hint}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { gap: space.xs },
    input: {
        borderWidth: 1, borderColor: color.lineStrong, borderRadius: radius.control,
        backgroundColor: color.surface,
        paddingHorizontal: space.md, paddingVertical: space.sm,
        fontSize: 15, color: color.ink,
    },
    textArea: { minHeight: 96, textAlignVertical: 'top', paddingTop: space.sm },
    hint: { ...type.dataMuted },
});
