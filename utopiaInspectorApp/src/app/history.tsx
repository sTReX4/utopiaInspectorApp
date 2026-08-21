import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

const API_URL = 'http://192.168.1.3:3000/api/audits';
const HISTORY_FILE = FileSystem.documentDirectory + 'auditHistory.json';

type AuditRecord = {
  id: string;
  inspector_name: string | null;
  guard_name: string | null;
  branch_name: string | null;
  branch_location: string | null;
  time_in: string | null;
  time_out: string | null;
  lesp_expiry: string | null;
  uniform_status: boolean | null;
  remarks: string | null;
};

export default function HistoryScreen() {
  const [records, setRecords] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<AuditRecord | null>(null);

  const loadRecords = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('Unable to load audit records.');
      const json = await response.json();
      setRecords(Array.isArray(json) ? json : []);
      setError('');
    } catch {
      try {
        const info = await FileSystem.getInfoAsync(HISTORY_FILE);
        if (!info.exists) throw new Error('No local history found.');
        const content = await FileSystem.readAsStringAsync(HISTORY_FILE, { encoding: FileSystem.EncodingType.UTF8 });
        const json = JSON.parse(content);
        setRecords(Array.isArray(json) ? json : []);
        setError('');
      } catch {
        setError('Could not load audit records. Pull down to try again.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color="#0056b3" /></View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => item.id}
          contentContainerStyle={records.length ? styles.list : styles.emptyList}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadRecords(true)} colors={['#0056b3']} />}
          ListHeaderComponent={error ? <Text style={styles.error}>{error}</Text> : null}
          ListEmptyComponent={<Text style={styles.emptyText}>No audit records yet.</Text>}
          renderItem={({ item }) => <AuditBar record={item} onPress={() => setSelectedRecord(item)} />}
        />
      )}

      <AuditDetails record={selectedRecord} onClose={() => setSelectedRecord(null)} />
    </View>
  );
}

function AuditBar({ record, onPress }: { record: AuditRecord; onPress: () => void }) {
  return (
    <Pressable style={styles.auditBar} onPress={onPress}>
      <View style={styles.auditText}>
        <Text style={styles.guardName}>{record.guard_name || 'Guard not present'}</Text>
        <Text style={styles.recordDetail}>Inspector: {record.inspector_name || 'Not recorded'}</Text>
        <Text style={styles.recordDetail}>{record.branch_name || record.branch_location || 'Branch not recorded'}</Text>
      </View>
      <Text style={styles.date}>{formatDate(record.time_in)}</Text>
    </Pressable>
  );
}

function AuditDetails({ record, onClose }: { record: AuditRecord | null; onClose: () => void }) {
  if (!record) return null;

  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Audit Record</Text>
          <Detail label="Guard" value={record.guard_name || 'Guard not present'} />
          <Detail label="Inspector" value={record.inspector_name || 'Not recorded'} />
          <Detail label="Branch" value={record.branch_name || 'Not recorded'} />
          <Detail label="Location" value={record.branch_location || 'Not recorded'} />
          <Detail label="Audit date" value={formatDate(record.time_in)} />
          <Detail label="LESP expiry" value={record.lesp_expiry || 'Not recorded'} />
          <Detail label="Uniform" value={record.uniform_status === null ? 'Not recorded' : record.uniform_status ? 'Compliant' : 'Not compliant'} />
          <Detail label="Remarks" value={record.remarks || 'None'} />
          <Pressable style={styles.closeButton} onPress={onClose}><Text style={styles.closeButtonText}>Close</Text></Pressable>
        </View>
      </View>
    </Modal>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <Text style={styles.modalDetail}><Text style={styles.modalLabel}>{label}: </Text>{value}</Text>;
}

function formatDate(value: string | null) {
  if (!value) return 'No date';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 12, gap: 10 },
  emptyList: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  error: { color: '#b3261e', textAlign: 'center', marginBottom: 12 },
  emptyText: { color: '#666', textAlign: 'center', fontSize: 16 },
  auditBar: { minHeight: 86, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#d4dce5', borderRadius: 7, padding: 14 },
  auditText: { flex: 1, gap: 3 },
  guardName: { color: '#222', fontSize: 17, fontWeight: '700' },
  recordDetail: { color: '#555', fontSize: 13 },
  date: { color: '#0056b3', fontSize: 13, marginLeft: 10 },
  modalBackdrop: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: 'rgba(0,0,0,0.45)' },
  modalCard: { backgroundColor: '#fff', borderRadius: 10, padding: 22 },
  modalTitle: { color: '#0056b3', fontSize: 22, fontWeight: '700', marginBottom: 16 },
  modalDetail: { color: '#333', fontSize: 15, lineHeight: 22, marginBottom: 6 },
  modalLabel: { fontWeight: '700' },
  closeButton: { alignSelf: 'flex-end', marginTop: 12, backgroundColor: '#0056b3', borderRadius: 5, paddingVertical: 9, paddingHorizontal: 22 },
  closeButtonText: { color: '#fff', fontWeight: '700' },
});
