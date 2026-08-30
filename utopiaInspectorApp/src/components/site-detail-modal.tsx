import React from 'react';
import { Modal, View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';

interface SiteDetailModalProps {
  visible: boolean;
  onClose: () => void;
  site: any;
}

export default function SiteDetailModal({ visible, onClose, site }: SiteDetailModalProps) {
  if (!site) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          
          <View style={styles.card}>
          <Text style={styles.sectionTitle}>Detachment Profile</Text>
          <View style={styles.divider} />
            
          <View style={styles.row}>
          <View style={styles.col}>
          <Text style={styles.label}>Branch Name</Text>
          <Text style={styles.value}>{site.branch_name}</Text>
          </View>
          <View style={styles.col}>
          <Text style={styles.label}>Branch Code</Text>
          <Text style={styles.value}>{site.branch_code}</Text>
          </View>
          </View>

          <Text style={styles.label}>Complete Location</Text>
          <Text style={styles.value}>{site.location}</Text>

          <View style={styles.row}>
          <View style={styles.col}>
          <Text style={styles.label}>Client / Client Group</Text>
          <Text style={styles.value}>{site.client_name || 'N/A'}</Text>
          </View>
          <View style={styles.col}>
          <Text style={styles.label}>Status</Text>
          <Text style={[styles.value, { color: site.status?.toLowerCase() === 'active' ? '#16a34a' : '#64748b' }]}>
                {site.status?.toUpperCase() || 'N/A'}
          </Text>
          </View>
          </View>
          </View>

          <View style={styles.card}>
          <Text style={styles.sectionTitle}>Operational Details</Text>
          <View style={styles.divider} />
            
          <View style={styles.row}>
          <View style={styles.col}>
          <Text style={styles.label}>Total Guards</Text>
          <Text style={styles.value}>{site.guard_count || 0}</Text>
          </View>
          <View style={styles.col}>
          <Text style={styles.label}>Shift Schedule</Text>
          <Text style={styles.value}>{site.shift_schedule || 'Standard'}</Text>
          </View>
          </View>

          <Text style={styles.label}>OIC / Commander</Text>
          <Text style={styles.value}>{site.oic_name || 'Unassigned'}</Text>
            
          <Text style={styles.label}>Contact Number</Text>
          <Text style={styles.value}>{site.contact_number || 'N/A'}</Text>
          </View>

        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { padding: 16, backgroundColor: '#f1f5f9', alignItems: 'flex-end' },
  closeButton: { padding: 8 },
  closeButtonText: { fontSize: 16, color: '#3b82f6', fontWeight: '600' },
  content: { flex: 1 },
  contentContainer: { padding: 12 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  col: { flex: 1, paddingRight: 8 },
  label: { fontSize: 11, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 },
  value: { fontSize: 15, color: '#1e293b', marginBottom: 12 },
});