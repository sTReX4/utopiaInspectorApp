import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const days = Array.from({ length: 31 }, (_, index) => String(index + 1));
const months = Array.from({ length: 12 }, (_, index) => String(index + 1));
const years = Array.from({ length: 21 }, (_, index) => String(2040 - index));

interface DateInputGroupProps {
    label: string;
    day: string;
    month: string;
    year: string;
    onDayChange: (text: string) => void;
    onMonthChange: (text: string) => void;
    onYearChange: (text: string) => void;
}

type DatePart = 'day' | 'month' | 'year' | null;

export default function DateInputGroup({
    label,
    day,
    month,
    year,
    onDayChange,
    onMonthChange,
    onYearChange,
}: DateInputGroupProps) {
    const [openList, setOpenList] = useState<DatePart>(null);

    const enforceNumericInput = (
        text: string,
        stateUpdater: (value: string) => void,
        min: number,
        max: number,
        maxLength: number,
    ) => {
        const numericValue = text.replace(/[^0-9]/g, '');

        if (
            numericValue.length === maxLength &&
            (Number(numericValue) < min || Number(numericValue) > max)
        ) {
            return;
        }

        stateUpdater(numericValue);
    };

    const selectValue = (value: string, stateUpdater: (value: string) => void) => {
        stateUpdater(value);
        setOpenList(null);
    };

    const renderOptions = (placeholder: string, options: string[], stateUpdater: (value: string) => void) => {
        const optionItems = [
            ...(placeholder === 'YYYY' ? [] : [{ label: '0', value: '' }]),
            ...options.map((value) => ({ label: value, value })),
        ];

        return (
            <ScrollView style={styles.optionsList} nestedScrollEnabled>
                {optionItems.map((item) => (
                    <TouchableOpacity key={item.label} style={styles.option} onPress={() => selectValue(item.value, stateUpdater)}>
                        <Text style={styles.optionText}>{item.label}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        );
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>{label}</Text>

            <View style={styles.row}>
                <View style={styles.fieldGroup}>
                    <TextInput
                        style={styles.box}
                        value={day}
                        onChangeText={(text) => enforceNumericInput(text, onDayChange, 1, 31, 2)}
                        keyboardType="numeric"
                        placeholder="DD"
                        maxLength={2}
                        placeholderTextColor="#999"
                    />
                    <TouchableOpacity style={styles.arrowButton} onPress={() => setOpenList(openList === 'day' ? null : 'day')}>
                        <Text style={styles.arrow}>⌄</Text>
                    </TouchableOpacity>
                    {openList === 'day' && renderOptions('DD', days, onDayChange)}
                </View>

                <View style={styles.fieldGroup}>
                    <TextInput
                        style={styles.box}
                        value={month}
                        onChangeText={(text) => enforceNumericInput(text, onMonthChange, 1, 12, 2)}
                        keyboardType="numeric"
                        placeholder="MM"
                        maxLength={2}
                        placeholderTextColor="#999"
                    />
                    <TouchableOpacity style={styles.arrowButton} onPress={() => setOpenList(openList === 'month' ? null : 'month')}>
                        <Text style={styles.arrow}>⌄</Text>
                    </TouchableOpacity>
                    {openList === 'month' && renderOptions('MM', months, onMonthChange)}
                </View>

                <View style={[styles.fieldGroup, styles.yearFieldGroup]}>
                    <TextInput
                        style={[styles.box, styles.yearBox]}
                        value={year}
                        onChangeText={(text) => enforceNumericInput(text, onYearChange, 2020, 2040, 4)}
                        keyboardType="numeric"
                        placeholder="YYYY"
                        maxLength={4}
                        placeholderTextColor="#999"
                    />
                    <TouchableOpacity style={styles.arrowButton} onPress={() => setOpenList(openList === 'year' ? null : 'year')}>
                        <Text style={styles.arrow}>⌄</Text>
                    </TouchableOpacity>
                    {openList === 'year' && renderOptions('YYYY', years, onYearChange)}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { marginBottom: 15 },
    label: { fontSize: 16, fontWeight: 'bold', marginBottom: 8, color: '#333' },
    row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    fieldGroup: { flexDirection: 'row', alignItems: 'center', position: 'relative' },
    yearFieldGroup: {},
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
    yearBox: { width: 80 },
    arrowButton: {
        width: 28,
        height: 42,
        marginLeft: 3,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    arrow: { fontSize: 22, color: '#555', marginTop: -5 },
    optionsList: {
        position: 'absolute',
        top: 48,
        left: 0,
        width: '100%',
        maxHeight: 180,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        backgroundColor: '#fff',
        zIndex: 10,
        elevation: 10,
    },
    option: { height: 40, paddingHorizontal: 14, justifyContent: 'center' },
    optionText: { fontSize: 16, color: '#333' },
});
