import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

function formatDateMMDDYYYY(day: string, month: string, year: string): string {
    if (!day || !month || !year) return 'MM/DD/YYYY';
    return `${month.padStart(2, '0')}/${day.padStart(2, '0')}/${year}`;
}

function getInitialDate(day: string, month: string, year: string): Date {
  const parsedDay = Number(day);
  const parsedMonth = Number(month) - 1;
  const parsedYear = Number(year);

  const candidate = new Date(parsedYear, parsedMonth, parsedDay);

  if (
    Number.isNaN(parsedDay) ||
    Number.isNaN(parsedMonth) ||
    Number.isNaN(parsedYear) ||
    candidate.getFullYear() !== parsedYear ||
    candidate.getMonth() !== parsedMonth ||
    candidate.getDate() !== parsedDay
  ) {
    return new Date();
  }

  return candidate;
}

interface DateInputGroupProps {
    label: string;
    day: string;
    month: string;
    year: string;
    onDayChange: (text: string) => void;
    onMonthChange: (text: string) => void;
    onYearChange: (text: string) => void;
}

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const weekdayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function DateInputGroup({
    label,
    day,
    month,
    year,
    onDayChange,
    onMonthChange,
    onYearChange,
}: DateInputGroupProps) {
    const [isCalendarVisible, setIsCalendarVisible] = useState(false);
    const [viewDate, setViewDate] = useState(() => getInitialDate(day, month, year));
    const [pickerMode, setPickerMode] = useState<'calendar' | 'month' | 'year'>('calendar');
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: currentYear - 1899 }, (_, index) => currentYear - index);

    const openCalendar = () => {
        setViewDate(getInitialDate(day, month, year));
        setPickerMode('calendar');
        setIsCalendarVisible(true);
    };

    const handleDateSelect = (selectedDate: Date) => {
        onDayChange(String(selectedDate.getDate()).padStart(2, '0'));
        onMonthChange(String(selectedDate.getMonth() + 1).padStart(2, '0'));
        onYearChange(String(selectedDate.getFullYear()));
        setIsCalendarVisible(false);
    };

    const calendarDays = Array.from({ length: 42 }, (_, index) => {
        const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
        const firstDayIndex = firstDayOfMonth.getDay();
        const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
        const offset = index - firstDayIndex;

        if (offset < 0) {
            const prevMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 0);
            const dayNumber = prevMonth.getDate() + offset + 1;
            return {
                day: dayNumber,
                date: new Date(prevMonth.getFullYear(), prevMonth.getMonth(), dayNumber),
                isCurrentMonth: false,
            };
        }

        if (offset >= daysInMonth) {
            const nextMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
            const dayNumber = offset - daysInMonth + 1;
            return {
                day: dayNumber,
                date: new Date(nextMonth.getFullYear(), nextMonth.getMonth(), dayNumber),
                isCurrentMonth: false,
            };
        }

        return {
            day: offset + 1,
            date: new Date(viewDate.getFullYear(), viewDate.getMonth(), offset + 1),
            isCurrentMonth: true,
        };
    });

    const selectedDate = getInitialDate(day, month, year);

    return (
        <View style={styles.container}>
            <Text style={styles.label}>{label}</Text>

            <TouchableOpacity style={styles.triggerButton} onPress={openCalendar} activeOpacity={0.85}>
                <Text style={styles.valueText}>{formatDateMMDDYYYY(day, month, year)}</Text>
                <Text style={styles.calendarIcon}>▣</Text>
            </TouchableOpacity>

            <Modal transparent visible={isCalendarVisible} animationType="fade" onRequestClose={() => setIsCalendarVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.calendarCard}>
                        <View style={styles.calendarHeader}>
<<<<<<< HEAD
                            <TouchableOpacity onPress={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}>
                                <Text style={styles.navButton}>‹</Text>
                            </TouchableOpacity>
                            <Text style={styles.calendarTitle}>{monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}</Text>
                            <TouchableOpacity onPress={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}>
                                <Text style={styles.navButton}>›</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.weekdayRow}>
                        {weekdayNames.map((weekday, index) => (
                            <Text key={index} style={styles.weekdayText}>
                                {weekday}
                            </Text>
                        ))}
                    </View>

                        <View style={styles.calendarGrid}>
                            {calendarDays.map((item, index) => {
                                const isSelected =
                                    item.date.getDate() === selectedDate.getDate() &&
                                    item.date.getMonth() === selectedDate.getMonth() &&
                                    item.date.getFullYear() === selectedDate.getFullYear();

                                return (
                                    <TouchableOpacity
                                        key={`${item.date.toISOString()}-${index}`}
                                        style={[styles.dayCell, !item.isCurrentMonth && styles.dayCellMuted, isSelected && styles.dayCellSelected]}
                                        onPress={() => handleDateSelect(item.date)}
                                    >
                                        <Text style={[styles.dayText, !item.isCurrentMonth && styles.dayTextMuted, isSelected && styles.dayTextSelected]}>
                                            {item.day}
                                        </Text>
=======
                            {pickerMode === 'calendar' && (
                                <TouchableOpacity onPress={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}>
                                    <Text style={styles.navButton}>‹</Text>
                                </TouchableOpacity>
                            )}
                            {pickerMode === 'calendar' ? (
                                <View style={styles.selectorHeader}>
                                    <TouchableOpacity onPress={() => setPickerMode('month')}>
                                        <Text style={styles.selectorButton}>{monthNames[viewDate.getMonth()]}</Text>
>>>>>>> origin/moxcorp
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setPickerMode('year')}>
                                        <Text style={styles.selectorButton}>{viewDate.getFullYear()}</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <Text style={styles.calendarTitle}>{pickerMode === 'month' ? 'Choose month' : 'Choose year'}</Text>
                            )}
                            {pickerMode === 'calendar' && (
                                <TouchableOpacity onPress={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}>
                                    <Text style={styles.navButton}>›</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {pickerMode === 'calendar' && (
                            <>
                                <View style={styles.weekdayRow}>
                                    {weekdayNames.map((weekday) => (
                                        <Text key={weekday} style={styles.weekdayText}>{weekday}</Text>
                                    ))}
                                </View>
                                <View style={styles.calendarGrid}>
                                    {calendarDays.map((item, index) => {
                                        const isSelected = item.date.getDate() === selectedDate.getDate() && item.date.getMonth() === selectedDate.getMonth() && item.date.getFullYear() === selectedDate.getFullYear();
                                        return (
                                            <TouchableOpacity key={`${item.date.toISOString()}-${index}`} style={[styles.dayCell, !item.isCurrentMonth && styles.dayCellMuted, isSelected && styles.dayCellSelected]} onPress={() => handleDateSelect(item.date)}>
                                                <Text style={[styles.dayText, !item.isCurrentMonth && styles.dayTextMuted, isSelected && styles.dayTextSelected]}>{item.day}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </>
                        )}

                        {pickerMode === 'month' && (
                            <View style={styles.monthGrid}>
                                {monthNames.map((monthName, monthIndex) => (
                                    <TouchableOpacity key={monthName} style={[styles.monthButton, monthIndex === viewDate.getMonth() && styles.selectionActive]} onPress={() => { setViewDate(new Date(viewDate.getFullYear(), monthIndex, 1)); setPickerMode('calendar'); }}>
                                        <Text style={[styles.monthButtonText, monthIndex === viewDate.getMonth() && styles.selectionActiveText]}>{monthName.slice(0, 3)}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        {pickerMode === 'year' && (
                            <ScrollView style={styles.yearList} contentContainerStyle={styles.yearGrid}>
                                {years.map((yearValue) => (
                                    <TouchableOpacity key={yearValue} style={[styles.yearButton, yearValue === viewDate.getFullYear() && styles.selectionActive]} onPress={() => { setViewDate(new Date(yearValue, viewDate.getMonth(), 1)); setPickerMode('calendar'); }}>
                                        <Text style={[styles.yearButtonText, yearValue === viewDate.getFullYear() && styles.selectionActiveText]}>{yearValue}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}

                        <TouchableOpacity style={styles.doneButton} onPress={() => setIsCalendarVisible(false)}>
                            <Text style={styles.doneButtonText}>Done</Text>
                        </TouchableOpacity>
                    </View>
                    </View>
                    </Modal>
                    </View>
    );
}

const styles = StyleSheet.create({
    container: { marginBottom: 15 },
    label: { fontSize: 16, fontWeight: 'bold', marginBottom: 8, color: '#333' },
    triggerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 14,
    },
    calendarIcon: { fontSize: 18, color: '#0056b3' },
    valueBox: {
        flex: 1,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 8,
        alignItems: 'center',
    },
    yearBox: { flex: 1.2 },
    valueLabel: { fontSize: 11, color: '#888', marginBottom: 4, textTransform: 'uppercase' },
    valueText: { fontSize: 16, color: '#333', fontWeight: '600' },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.35)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    calendarCard: {
        width: '100%',
        maxWidth: 360,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
    },
    calendarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    navButton: { fontSize: 28, color: '#0056b3', fontWeight: '700' },
    calendarTitle: { fontSize: 18, fontWeight: '700', color: '#222' },
    selectorHeader: { flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 12 },
    selectorButton: { fontSize: 18, fontWeight: '700', color: '#0056b3' },
    weekdayRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    weekdayText: { width: '14.28%', textAlign: 'center', color: '#777', fontSize: 12, fontWeight: '600' },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    monthGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 },
    monthButton: { width: '30%', paddingVertical: 14, borderRadius: 8, alignItems: 'center', backgroundColor: '#eef4fb' },
    monthButtonText: { color: '#22344d', fontWeight: '600' },
    yearList: { maxHeight: 300 },
    yearGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 },
    yearButton: { width: '30%', paddingVertical: 12, borderRadius: 8, alignItems: 'center', backgroundColor: '#eef4fb' },
    yearButtonText: { color: '#22344d', fontWeight: '600' },
    selectionActive: { backgroundColor: '#0056b3' },
    selectionActiveText: { color: '#fff' },
    dayCell: {
        width: '14.28%',
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 999,
        marginBottom: 6,
    },
    dayCellMuted: { opacity: 0.45 },
    dayCellSelected: { backgroundColor: '#0056b3' },
    dayText: { fontSize: 14, color: '#222' },
    dayTextMuted: { color: '#999' },
    dayTextSelected: { color: '#fff', fontWeight: '700' },
    doneButton: {
        marginTop: 12,
        alignItems: 'center',
        backgroundColor: '#0056b3',
        paddingVertical: 10,
        borderRadius: 8,
    },
    doneButtonText: { color: '#fff', fontWeight: '700' },
});
