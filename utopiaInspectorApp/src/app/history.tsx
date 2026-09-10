import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, RefreshControl, StyleSheet, TextInput, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../lib/supabase';
import HistoryItemCard from '../components/history-item-card';
import SubmissionReceiptModal from '../components/submission-receipt-modal';
import { EmptyState, ListFrame, ScreenTitle } from '../components/data-surface';
import { color, radius, space, type } from '@/constants/tokens';

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const [audits, setAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAudit, setSelectedAudit] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // Date Picker State
  const [showPicker, setShowPicker] = useState(false);
  const [pickerType, setPickerType] = useState<'start' | 'end'>('start');

  const fetchAudits = async () => {
    const { data, error: queryError } = await supabase
      .from('audits')
      .select('*')
      .order('created_at', { ascending: false });

    return { data, queryError };
  };

  const loadOperationsData = async () => {
    setLoading(true);
    const { data, queryError } = await fetchAudits();

    /* A dropped query error rendered as "No recent inspection activity",
     * which reads as a fact about the work rather than about the read. */
    if (queryError) {
      setError(queryError.message);
    } else if (data) {
      setError(null);
      setAudits(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    let alive = true;

    /* Kicked off inside the async body rather than called straight from the
     * effect, so nothing writes state before the first await. Loading already
     * starts true, so the opening pass has nothing to announce. */
    (async () => {
      const { data, queryError } = await fetchAudits();
      if (!alive) return;

      if (queryError) setError(queryError.message);
      else if (data) { setError(null); setAudits(data); }
      setLoading(false);
    })();

    return () => { alive = false; };
  }, []);

  const filteredAudits = audits.filter((audit) => {
    const auditDate = new Date(audit.created_at);
    const query = searchQuery.toLowerCase();

    const matchesSearch =
      (audit.guard_name || '').toLowerCase().includes(query) ||
      (audit.inspector_name || '').toLowerCase().includes(query) ||
      (audit.branch_name || '').toLowerCase().includes(query);

    let matchesDate = true;
    if (startDate) matchesDate = matchesDate && auditDate >= startDate;
    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && auditDate <= endOfDay;
    }

    return matchesSearch && matchesDate;
  });

  const clearFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setShowCalendar(false);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    // Hide picker automatically on Android after selection
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }

    if (selectedDate) {
      if (pickerType === 'start') {
        setStartDate(selectedDate);
      } else {
        setEndDate(selectedDate);
      }
    }
  };

  const openPicker = (type: 'start' | 'end') => {
    setPickerType(type);
    setShowPicker(true);
  };

  const isFiltered = !!(searchQuery || startDate || endDate);

  return (
    <View style={styles.screen}>
      <ScreenTitle
        title="Submission history"
        subtitle={
          isFiltered
            ? `${filteredAudits.length} of ${audits.length} shown`
            : `${audits.length} filed`
        }
      />

      <View style={styles.controls}>
        <TextInput
          style={styles.search}
          placeholder="Guard, inspector or branch"
          placeholderTextColor={color.inkMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <Pressable
          onPress={() => setShowCalendar(!showCalendar)}
          accessibilityRole="button"
          accessibilityState={{ expanded: showCalendar }}
          style={[styles.filterButton, showCalendar && styles.filterButtonOn]}
        >
          <Text style={[type.badge, styles.filterLabel, showCalendar && styles.filterLabelOn]}>
            Dates
          </Text>
        </Pressable>
      </View>

      {showCalendar ? (
        <View style={styles.datePanel}>
          <View style={styles.dateRow}>
            <DateField label="From" value={startDate} onPress={() => openPicker('start')} />
            <DateField label="To" value={endDate} onPress={() => openPicker('end')} />
          </View>

          {startDate || endDate ? (
            <Pressable
              onPress={clearFilters}
              accessibilityRole="button"
              style={({ pressed }) => [styles.clear, pressed && styles.clearPressed]}
            >
              <Text style={[type.badge, { color: color.dangerInk, fontSize: 10 }]}>Clear dates</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {showPicker && (
        <DateTimePicker
          value={pickerType === 'start' ? startDate || new Date() : endDate || new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      <ListFrame>
        <FlatList
          data={filteredAudits}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={loadOperationsData} tintColor={color.ink} />
          }
          contentContainerStyle={[
            styles.listContent,
            {
              paddingLeft: insets.left,
              paddingRight: insets.right,
              paddingBottom: insets.bottom + space.xl,
            },
          ]}
          ListEmptyComponent={
            loading ? null : error ? (
              <EmptyState title="Could not load history" body={error} />
            ) : isFiltered ? (
              <EmptyState
                title="Nothing matches"
                body="No filed audit matches this search and date range."
              />
            ) : (
              <EmptyState
                title="No audits filed yet"
                body="Submitted reports appear here, newest first."
              />
            )
          }
          renderItem={({ item, index }) => (
            <HistoryItemCard
              guardName={item.guard_name || 'Guard absent'}
              inspectorName={item.inspector_name || 'Unknown inspector'}
              date={new Date(item.created_at).toLocaleDateString()}
              isFirst={index === 0}
              onPress={() => {
                setSelectedAudit(item);
                setModalVisible(true);
              }}
            />
          )}
        />
      </ListFrame>

      <SubmissionReceiptModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        auditData={selectedAudit}
      />
    </View>
  );
}

function DateField({
  label, value, onPress,
}: {
  label: string; value: Date | null; onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label} date`}
      style={({ pressed }) => [styles.dateField, pressed && styles.dateFieldPressed]}
    >
      <Text style={type.label}>{label}</Text>
      <Text style={[type.data, !value && { color: color.inkMuted }]}>
        {value ? value.toLocaleDateString() : 'Any'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.canvas },
  listContent: { flexGrow: 1 },

  controls: {
    flexDirection: 'row', gap: space.sm,
    paddingHorizontal: space.lg, paddingBottom: space.md,
  },
  search: {
    flex: 1,
    borderWidth: 1, borderColor: color.lineStrong, borderRadius: radius.control,
    backgroundColor: color.surface,
    paddingHorizontal: space.md, paddingVertical: space.sm,
    fontSize: 15, color: color.ink,
  },
  filterButton: {
    justifyContent: 'center',
    borderWidth: 1, borderColor: color.lineStrong, borderRadius: radius.control,
    backgroundColor: color.surface,
    paddingHorizontal: space.md,
  },
  /* Instant, no timing curve. */
  filterButtonOn: { backgroundColor: color.ink, borderColor: color.ink },
  filterLabel: { color: color.inkMuted, fontSize: 10 },
  filterLabelOn: { color: color.surface },

  datePanel: {
    backgroundColor: color.surface,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: color.line,
    marginBottom: space.md,
  },
  dateRow: { flexDirection: 'row' },
  dateField: {
    flex: 1, gap: 2,
    paddingHorizontal: space.lg, paddingVertical: space.md,
  },
  dateFieldPressed: { backgroundColor: color.sunken },
  clear: {
    alignItems: 'center',
    borderTopWidth: 1, borderTopColor: color.line,
    paddingVertical: space.sm,
  },
  clearPressed: { backgroundColor: color.dangerBg },
});
