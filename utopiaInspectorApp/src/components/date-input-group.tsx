import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { color, radius, space, type } from '@/constants/tokens';

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
    const startYear = currentYear - 1; // Anchors the dropdown to last year

    const years = Array.from({ length: 15 }, (_, i) => (startYear + i).toString());
    const isSet = !!(day && month && year);

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
            {label ? <Text style={type.label}>{label}</Text> : null}

            <Pressable
                onPress={openCalendar}
                accessibilityRole="button"
                accessibilityLabel="Choose a date"
                style={({ pressed }) => [styles.trigger, pressed && styles.triggerPressed]}
            >
                <Text style={[styles.value, !isSet && styles.valueEmpty]}>
                    {formatDateMMDDYYYY(day, month, year)}
                </Text>
                <Text style={styles.triggerHint}>Change</Text>
            </Pressable>

            <Modal
                transparent
                visible={isCalendarVisible}
                animationType="fade"
                onRequestClose={() => setIsCalendarVisible(false)}
            >
                <Pressable style={styles.scrim} onPress={() => setIsCalendarVisible(false)}>
                    {/* Stops a tap inside the sheet from closing it. */}
                    <Pressable style={styles.sheet} onPress={() => {}}>
                        <View style={styles.sheetHead}>
                            {pickerMode === 'calendar' ? (
                                <>
                                    <Pressable
                                        onPress={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
                                        accessibilityRole="button"
                                        accessibilityLabel="Previous month"
                                        hitSlop={8}
                                        style={styles.nav}
                                    >
                                        <Text style={styles.navLabel}>Prev</Text>
                                    </Pressable>

                                    <View style={styles.selector}>
                                        <Pressable onPress={() => setPickerMode('month')} hitSlop={6}>
                                            <Text style={styles.selectorLabel}>{monthNames[viewDate.getMonth()]}</Text>
                                        </Pressable>
                                        <Pressable onPress={() => setPickerMode('year')} hitSlop={6}>
                                            <Text style={styles.selectorLabel}>{viewDate.getFullYear()}</Text>
                                        </Pressable>
                                    </View>

                                    <Pressable
                                        onPress={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
                                        accessibilityRole="button"
                                        accessibilityLabel="Next month"
                                        hitSlop={8}
                                        style={styles.nav}
                                    >
                                        <Text style={styles.navLabel}>Next</Text>
                                    </Pressable>
                                </>
                            ) : (
                                <Text style={styles.sheetTitle}>
                                    {pickerMode === 'month' ? 'Choose month' : 'Choose year'}
                                </Text>
                            )}
                        </View>

                        {pickerMode === 'calendar' && (
                            <View style={styles.sheetBody}>
                                <View style={styles.weekdayRow}>
                                    {weekdayNames.map((weekday, index) => (
                                        <Text key={index} style={styles.weekday}>{weekday}</Text>
                                    ))}
                                </View>
                                <View style={styles.grid}>
                                    {calendarDays.map((item, index) => {
                                        const isSelected =
                                            item.date.getDate() === selectedDate.getDate() &&
                                            item.date.getMonth() === selectedDate.getMonth() &&
                                            item.date.getFullYear() === selectedDate.getFullYear();

                                        return (
                                            <Pressable
                                                key={`${item.date.toISOString()}-${index}`}
                                                onPress={() => handleDateSelect(item.date)}
                                                accessibilityRole="button"
                                                style={[styles.dayCell, isSelected && styles.dayCellSelected]}
                                            >
                                                <Text style={[
                                                    styles.dayText,
                                                    !item.isCurrentMonth && styles.dayTextMuted,
                                                    isSelected && styles.dayTextSelected,
                                                ]}>
                                                    {item.day}
                                                </Text>
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            </View>
                        )}

                        {pickerMode === 'month' && (
                            <View style={[styles.sheetBody, styles.chipGrid]}>
                                {monthNames.map((monthName, monthIndex) => (
                                    <Pressable
                                        key={monthName}
                                        onPress={() => {
                                            setViewDate(new Date(viewDate.getFullYear(), monthIndex, 1));
                                            setPickerMode('calendar');
                                        }}
                                        style={[styles.chip, monthIndex === viewDate.getMonth() && styles.chipSelected]}
                                    >
                                        <Text style={[
                                            styles.chipLabel,
                                            monthIndex === viewDate.getMonth() && styles.chipLabelSelected,
                                        ]}>
                                            {monthName.slice(0, 3)}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                        )}

                        {pickerMode === 'year' && (
                            <ScrollView style={styles.yearList} contentContainerStyle={[styles.sheetBody, styles.chipGrid]}>
                                {years.map((yearValue) => (
                                    <Pressable
                                        key={yearValue}
                                        onPress={() => {
                                            setViewDate(new Date(Number(yearValue), viewDate.getMonth(), 1));
                                            setPickerMode('calendar');
                                        }}
                                        style={[
                                            styles.chip,
                                            Number(yearValue) === viewDate.getFullYear() && styles.chipSelected,
                                        ]}
                                    >
                                        <Text style={[
                                            styles.chipLabel,
                                            Number(yearValue) === viewDate.getFullYear() && styles.chipLabelSelected,
                                        ]}>
                                            {yearValue}
                                        </Text>
                                    </Pressable>
                                ))}
                            </ScrollView>
                        )}

                        <Pressable
                            onPress={() => setIsCalendarVisible(false)}
                            accessibilityRole="button"
                            style={({ pressed }) => [styles.done, pressed && styles.donePressed]}
                        >
                            <Text style={styles.doneLabel}>Done</Text>
                        </Pressable>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { gap: space.xs },

    trigger: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        borderWidth: 1, borderColor: color.lineStrong, borderRadius: radius.control,
        backgroundColor: color.surface,
        paddingHorizontal: space.md, paddingVertical: space.sm,
    },
    /* Instant, no timing curve. */
    triggerPressed: { backgroundColor: color.sunken },
    /* Mono, so a column of dates aligns wherever this control is reused. */
    value: { ...type.data, fontSize: 15 },
    valueEmpty: { color: color.inkMuted },
    triggerHint: { ...type.badge, color: color.inkMuted, fontSize: 10 },

    scrim: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        justifyContent: 'center',
        padding: space.lg,
    },
    sheet: {
        backgroundColor: color.surface,
        borderWidth: 1, borderColor: color.lineStrong,
        maxWidth: 380, width: '100%', alignSelf: 'center',
    },
    sheetHead: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: space.md, paddingVertical: space.sm,
        borderBottomWidth: 1, borderBottomColor: color.line,
    },
    sheetTitle: { ...type.label, flex: 1 },
    sheetBody: { padding: space.md },

    /* Word labels, not chevron glyphs. A screen reader announces these. */
    nav: { paddingHorizontal: space.sm, paddingVertical: space.xs },
    navLabel: { ...type.badge, color: color.inkMuted, fontSize: 10 },
    selector: { flexDirection: 'row', gap: space.md },
    selectorLabel: { ...type.title, fontSize: 14 },

    weekdayRow: { flexDirection: 'row', marginBottom: space.xs },
    weekday: { ...type.label, width: '14.28%', textAlign: 'center' },

    grid: { flexDirection: 'row', flexWrap: 'wrap' },
    dayCell: {
        width: '14.28%', aspectRatio: 1,
        justifyContent: 'center', alignItems: 'center',
    },
    dayCellSelected: { backgroundColor: color.ink },
    dayText: { ...type.data },
    dayTextMuted: { color: color.lineStrong },
    dayTextSelected: { color: color.surface },

    chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
    chip: {
        width: '30%', alignItems: 'center',
        paddingVertical: space.sm,
        borderWidth: 1, borderColor: color.lineStrong,
        backgroundColor: color.surface,
    },
    chipSelected: { backgroundColor: color.ink, borderColor: color.ink },
    chipLabel: { ...type.badge, color: color.inkMuted, fontSize: 10 },
    chipLabelSelected: { color: color.surface },
    yearList: { maxHeight: 300 },

    done: {
        alignItems: 'center',
        paddingVertical: space.md,
        borderTopWidth: 1, borderTopColor: color.line,
        backgroundColor: color.ink,
    },
    donePressed: { backgroundColor: color.shellHover },
    doneLabel: { ...type.badge, color: color.surface, fontSize: 11 },
});
