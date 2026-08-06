import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

interface DateInputGroupProps {
    label: string;
    day: string;
    month: string;
    year: string;
    onDayChange: (text: string) => void;
    onMonthChange: (text: string) => void;
    onYearChange: (text: string) => void;
}

export default function DateInputGroup({
    label,
    day,
    month,
    year,
    onDayChange,
    onMonthChange,
    onYearChange,
}: DateInputGroupProps) {
    const enforceNumericInput = (text: string, stateUpdater: (val: string) => void) => {
        const numericValue = text.replace(/[^0-9]/g, '');
        stateUpdater(numericValue);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>{label}</Text>

        <View style={styles.row}>
            <TextInput
                style={styles.box}
                value={day}
                onChangeText={(text) => enforceNumericInput(text, onDayChange)}
                keyboardType="numeric"
                placeholder="DD"
                maxLength={2}
                placeholderTextColor="#999"
            />

            <Text style={styles.slash}>/</Text>

            <TextInput
                    style={styles.box}
                    value={month}
                    onChangeText={(text) => enforceNumericInput(text, onMonthChange)}
                    keyboardType="numeric"
                    maxLength={2}
                    placeholder="MM"
                    placeholderTextColor="#999"
            />

            <Text style={styles.slash}>/</Text>

            <TextInput
                    style={[styles.box, styles.yearBox]} // Year box is slightly wider
                    value={year}
                    onChangeText={(text) => enforceNumericInput(text, onYearChange)}
                    keyboardType="numeric"
                    maxLength={4}
                    placeholder="YYYY"
                    placeholderTextColor="#999"
            />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { marginBottom: 15 },
    label: { fontSize: 16, fontWeight: 'bold', marginBottom: 8, color: '#333' },
    row: { flexDirection: 'row', alignItems: 'center' },
    box: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        fontSize: 16,
        textAlign: 'center',
        width: 60,
        color: '#333',
    },
    yearBox: {
        width: 80,
    },
    slash: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#777',
        marginHorizontal: 10,
    }
});