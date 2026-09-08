import React from 'react';
import { 
  Modal, 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity 
} from 'react-native';

/**
 * Mirrors a row of the `audits` table in Supabase, which uses snake_case
 * column names. Keep this in sync with the table definition.
 */
export interface AuditRecord {
  id: string;
  created_at: string | null;
  branch_code: string;
  branch_name: string | null;
  branch_location: string | null;
  inspector_name: string;
  guard_name: string | null;
  firearm_make: string | null;
  firearm_serial: string | null;
  lesp_expiry: string | null;
  uniform_status: boolean | null;
  remarks: string | null;
  /**
   * Only populated when the guard was a no-show; it carries the facility
   * status the inspector recorded in the guard's absence.
   */
  guard_present_status: {
    atm_online?: boolean;
    atm_offline?: boolean;
    door_secure?: boolean;
  } | null;
  incident_remarks: string | null;
  visit_type: string | null;
  escalation_status: string | null;
}

interface SubmissionReceiptModalProps {
  visible: boolean;
  onClose: () => void;
  auditData: AuditRecord | null;
}

export default function SubmissionReceiptModal({
  visible,
  onClose,
  auditData
}: SubmissionReceiptModalProps) {
  if (!auditData) return null;

  // A populated `guard_present_status` means the guard was absent from post.
  const guardAbsent = !!auditData.guard_present_status;

  const submittedAt = auditData.created_at
    ? new Date(auditData.created_at).toLocaleString()
    : 'N/A';

  const firearm = [auditData.firearm_make, auditData.firearm_serial]
    .filter(Boolean)
    .join(' - ');

  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      presentationStyle="pageSheet" 
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Modal Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Audit Summary Receipt</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>

        {/* Modal Body (Important Info Only - No Pictures, No Signatures) */}
        <ScrollView contentContainerStyle={styles.body}>
          
          {/* Detachment Information Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Detachment Information</Text>
            <Text style={styles.label}>Branch Name: <Text style={styles.value}>{auditData.branch_name || 'N/A'}</Text></Text>
            <Text style={styles.label}>Branch Code: <Text style={styles.value}>{auditData.branch_code || 'N/A'}</Text></Text>
            <Text style={styles.label}>Location: <Text style={styles.value}>{auditData.branch_location || 'N/A'}</Text></Text>
            <Text style={styles.label}>Date & Time: <Text style={styles.value}>{submittedAt}</Text></Text>
          </View>

          {/* Guard & Personnel Info Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Guard & Personnel Info</Text>
            <Text style={styles.label}>Inspected Guard: <Text style={styles.value}>{guardAbsent ? 'NO-SHOW (ABSENT)' : (auditData.guard_name || 'N/A')}</Text></Text>
            <Text style={styles.label}>Inspector: <Text style={styles.value}>{auditData.inspector_name || 'N/A'}</Text></Text>
            <Text style={styles.label}>Shift Status: <Text style={styles.value}>{guardAbsent ? 'Absent from post' : 'Present on post'}</Text></Text>
          </View>

          {/* Compliance & Operational Notes Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Compliance & Operational Notes</Text>
            <Text style={styles.label}>Uniform Status: <Text style={styles.value}>{guardAbsent ? 'N/A (guard absent)' : (auditData.uniform_status ? 'Compliant' : 'Non-Compliant')}</Text></Text>
            <Text style={styles.label}>Firearm: <Text style={styles.value}>{guardAbsent ? 'N/A (guard absent)' : (firearm || 'N/A')}</Text></Text>
            <Text style={styles.label}>LESP Expiry: <Text style={styles.value}>{guardAbsent ? 'N/A (guard absent)' : (auditData.lesp_expiry || 'N/A')}</Text></Text>
            <Text style={styles.label}>Remarks: <Text style={styles.value}>{auditData.remarks || 'No additional remarks.'}</Text></Text>
          </View>

        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8fafc' 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 16, 
    backgroundColor: '#ffffff', 
    borderBottomWidth: 1, 
    borderBottomColor: '#e2e8f0' 
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#0f172a' 
  },
  closeButton: { 
    paddingVertical: 6, 
    paddingHorizontal: 12, 
    backgroundColor: '#e2e8f0', 
    borderRadius: 6 
  },
  closeButtonText: { 
    fontWeight: '600', 
    color: '#334155' 
  },
  body: { 
    padding: 16 
  },
  section: { 
    backgroundColor: '#ffffff', 
    borderRadius: 8, 
    padding: 16, 
    marginBottom: 12, 
    shadowColor: '#000', 
    shadowOpacity: 0.05, 
    shadowRadius: 2, 
    elevation: 1 
  },
  sectionTitle: { 
    fontSize: 15, 
    fontWeight: 'bold', 
    color: '#1e293b', 
    marginBottom: 8, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f1f5f9', 
    paddingBottom: 4 
  },
  label: { 
    fontSize: 14, 
    color: '#64748b', 
    marginBottom: 6 
  },
  value: { 
    color: '#0f172a', 
    fontWeight: '500' 
  },
  loadingContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  submitButton: { 
    padding: 14, 
    borderRadius: 8, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 12 
  },
  submitButtonText: { 
    color: '#ffffff', 
    fontWeight: '600', 
    fontSize: 16 
  }
});