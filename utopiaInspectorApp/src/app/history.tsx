import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, RefreshControl, StyleSheet, TextInput, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../lib/supabase';
import ViolationItemCard from '../components/violation-item-card';
import SubmissionReceiptModal from '../components/submission-receipt-modal';

export default function HistoryScreen() {
  const [audits, setAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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

  const loadOperationsData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('audits')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAudits(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadOperationsData();
  }, []);

  const filteredAudits = audits.filter((audit) => {
    const auditDate = new Date(audit.created_at);
    const query = searchQuery.toLowerCase();
    
    const matchesSearch = 
      (audit.guard_name || '').toLowerCase().includes(query) ||
      (audit.inspector_name || '').toLowerCase().includes(query) ||
      (audit.site_name || '').toLowerCase().includes(query);

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

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyText}>
        {searchQuery || startDate || endDate 
          ? 'No reports match your search.' 
          : 'No recent inspection activity.'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeader}>Recent Inspection Activity</Text>
      
      {/* Search and Filter Row */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by guard, inspector..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity 
          style={[styles.filterButton, showCalendar && styles.filterButtonActive]} 
          onPress={() => setShowCalendar(!showCalendar)}
        >
          <Text style={[styles.filterButtonText, showCalendar && styles.filterButtonTextActive]}>
            Filter Date
          </Text>
        </TouchableOpacity>
      </View>

      {/* Pop-down Calendar Section */}
      {showCalendar && (
        <View style={styles.calendarDropdown}>
          <Text style={styles.calendarTitle}>Select Date Range</Text>
          <View style={styles.dateRow}>
            <TouchableOpacity style={styles.dateBox} onPress={() => openPicker('start')}>
              <Text style={styles.dateLabel}>Start Date</Text>
              <Text style={styles.dateValue}>{startDate ? startDate.toLocaleDateString() : 'Select...'}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.dateBox} onPress={() => openPicker('end')}>
              <Text style={styles.dateLabel}>End Date</Text>
              <Text style={styles.dateValue}>{endDate ? endDate.toLocaleDateString() : 'Select...'}</Text>
            </TouchableOpacity>
          </View>
          
          {(startDate || endDate) && (
            <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
              <Text style={styles.clearButtonText}>Clear Dates</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* The Native Date Picker */}
      {showPicker && (
        <DateTimePicker
          value={
            pickerType === 'start'
              ? startDate || new Date()
              : endDate || new Date()
          }
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      <FlatList
        data={filteredAudits}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadOperationsData} />}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={{ paddingTop: 8 }}
        renderItem={({ item }) => (
          <ViolationItemCard
            guardName={item.guard_name || 'Unknown Guard'}
            inspectorName={item.inspector_name || 'Unknown Inspector'}
            guardPhotoUrl={item.guard_photo_url}
            date={new Date(item.created_at).toLocaleDateString()}
            onPress={() => {
              setSelectedAudit(item);
              setModalVisible(true);
            }}
          />
        )}
      />

      <SubmissionReceiptModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
        audit={selectedAudit} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f8fafc' },
  sectionHeader: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 12 },
  
  searchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 15,
    color: '#1e293b',
  },
  filterButton: {
    marginLeft: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
  },
  filterButtonActive: { backgroundColor: '#eff6ff', borderColor: '#3b82f6' },
  filterButtonText: { color: '#475569', fontWeight: '600', fontSize: 14 },
  filterButtonTextActive: { color: '#3b82f6' },

  calendarDropdown: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  calendarTitle: { fontSize: 14, fontWeight: '600', color: '#1e293b', marginBottom: 12 },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dateBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  dateLabel: { fontSize: 11, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 },
  dateValue: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  clearButton: { marginTop: 12, alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  clearButtonText: { color: '#ef4444', fontWeight: '600', fontSize: 13 },

  emptyState: { alignItems: 'center', marginTop: 40 },
  emptyText: { fontSize: 16, color: '#475569', fontWeight: '600' },
});