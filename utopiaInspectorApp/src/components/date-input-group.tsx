import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

function formatDateDDMMYYYY(date: Date): string {
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
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

    const openCalendar = () => {
        setViewDate(getInitialDate(day, month, year));
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
                <View style={styles.valueBox}>
                    <Text style={styles.valueLabel}>DD</Text>
                    <Text style={styles.valueText}>{day || 'DD'}</Text>
                </View>
                <View style={styles.valueBox}>
                    <Text style={styles.valueLabel}>MM</Text>
                    <Text style={styles.valueText}>{month || 'MM'}</Text>
                </View>
                <View style={[styles.valueBox, styles.yearBox]}>
                    <Text style={styles.valueLabel}>YYYY</Text>
                    <Text style={styles.valueText}>{year || 'YYYY'}</Text>
                </View>
            </TouchableOpacity>

            <Modal transparent visible={isCalendarVisible} animationType="fade" onRequestClose={() => setIsCalendarVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.calendarCard}>
                        <View style={styles.calendarHeader}>
                            <TouchableOpacity onPress={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}>
                                <Text style={styles.navButton}>‹</Text>
                            </TouchableOpacity>
                            <Text style={styles.calendarTitle}>{monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}</Text>
                            <TouchableOpacity onPress={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}>
                                <Text style={styles.navButton}>›</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.weekdayRow}>
                            {weekdayNames.map((weekday) => (
                                <Text key={weekday} style={styles.weekdayText}>{weekday}</Text>
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
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

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
        gap: 8,
    },
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
