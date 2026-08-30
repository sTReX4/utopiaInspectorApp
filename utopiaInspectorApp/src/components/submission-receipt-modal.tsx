import React from 'react';
import { Modal, View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, SafeAreaView } from 'react-native';

interface SubmissionReceiptModalProps {
  visible: boolean;
  onClose: () => void;
  audit: any;
}

export default function SubmissionReceiptModal({ visible, onClose, audit }: SubmissionReceiptModalProps) {
  if (!audit) return null;

  // Helper for Valid/Expired and Compliant/Non-Compliant badges
  const renderBadge = (status: string) => {
    const isGood = status?.toUpperCase() === 'VALID' || status?.toUpperCase() === 'COMPLIANT';
    const isBad = status?.toUpperCase() === 'NON-COMPLIANT';
    
    let bg = '#fef3c7'; // Default warning/expired yellow
    let color = '#d97706';
    
    if (isGood) {
      bg = '#dcfce7';
      color = '#16a34a';
    } else if (isBad) {
      bg = '#fee2e2';
      color = '#dc2626';
    }

    return (
      <View style={[styles.badge, { backgroundColor: bg }]}>
        <Text style={[styles.badgeText, { color }]}>{status?.toUpperCase() || 'N/A'}</Text>
      </View>
    );
  };

  const DocBox = ({ title, status }: { title: string, status: string }) => (
    <View style={styles.docBox}>
      <Text style={styles.docTitle}>{title}</Text>
      {renderBadge(status)}
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          
          {/* Detachment Info */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Detachment Info</Text>
            <View style={styles.divider} />
            
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Branch Name</Text>
                <Text style={styles.value}>{audit.branch_name || audit.site_name}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Branch Code</Text>
                <Text style={styles.value}>{audit.branch_code}</Text>
              </View>
            </View>

            <Text style={styles.label}>Location</Text>
            <Text style={styles.value}>{audit.location}</Text>

            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Time In (Arrival)</Text>
                <Text style={styles.value}>{audit.time_in ? new Date(audit.time_in).toLocaleString() : 'N/A'}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Time Out (Submitted)</Text>
                <Text style={styles.value}>{new Date(audit.created_at).toLocaleString()}</Text>
              </View>
            </View>

            <Text style={styles.label}>Inspector</Text>
            <Text style={styles.value}>{audit.inspector_name}</Text>
          </View>

          {/* Guard Identity & Equipment */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Guard Identity & Equipment</Text>
            <View style={styles.divider} />
            
            <View style={styles.row}>
              {/* Photo */}
              <View style={styles.photoContainer}>
                {audit.guard_photo_url ? (
                  <Image source={{ uri: audit.guard_photo_url }} style={styles.guardPhoto} />
                ) : (
                  <View style={[styles.guardPhoto, styles.photoPlaceholder]}>
                    <Text style={styles.placeholderText}>No Photo</Text>
                  </View>
                )}
              </View>

              {/* Guard Details */}
              <View style={styles.guardDetails}>
                <Text style={styles.label}>Guard On Post</Text>
                <Text style={styles.value}>{audit.guard_name}</Text>

                <View style={styles.row}>
                  <View style={styles.col}>
                    <Text style={styles.label}>Uniform Compliance</Text>
                    {renderBadge(audit.uniform_compliance)}
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.label}>LESP Expiry</Text>
                    <Text style={styles.value}>{audit.lesp_expiry}</Text>
                  </View>
                </View>

                <View style={[styles.row, { marginTop: 12 }]}>
                  <View style={styles.col}>
                    <Text style={styles.label}>Firearm Make</Text>
                    <Text style={styles.value}>{audit.firearm_make}</Text>
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.label}>Firearm Serial</Text>
                    <Text style={styles.value}>{audit.firearm_serial}</Text>
                  </View>
                </View>
              </View>
            </View>

            <Text style={[styles.label, { marginTop: 16 }]}>General Remarks</Text>
            <View style={styles.remarksBox}>
              <Text style={styles.value}>{audit.general_remarks || 'None'}</Text>
            </View>
          </View>

          {/* Document Compliance */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Document Compliance</Text>
            <View style={styles.divider} />
            
            <View style={styles.docGrid}>
              <DocBox title="FA" status={audit.doc_fa} />
              <DocBox title="ID" status={audit.doc_id} />
              <DocBox title="DDO" status={audit.doc_ddo} />
              <DocBox title="LTO" status={audit.doc_lto} />
              <DocBox title="RLM" status={audit.doc_rlm} />
              <DocBox title="LTOFP" status={audit.doc_ltofp} />
            </View>
          </View>

          {/* Captured Signatures */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Captured Signatures</Text>
            <View style={styles.divider} />
            
            <View style={styles.row}>
              <View style={styles.sigBox}>
                <Text style={styles.label}>Guard Signature</Text>
                {audit.guard_signature_url ? (
                  <Image source={{ uri: audit.guard_signature_url }} style={styles.sigImage} resizeMode="contain" />
                ) : (
                  <Text style={styles.noSignature}>No signature</Text>
                )}
                <View style={styles.sigDivider} />
                <Text style={styles.sigName}>{audit.guard_name}</Text>
              </View>

              <View style={styles.sigBox}>
                <Text style={styles.label}>Client Signature</Text>
                {audit.client_signature_url ? (
                  <Image source={{ uri: audit.client_signature_url }} style={styles.sigImage} resizeMode="contain" />
                ) : (
                  <Text style={styles.noSignature}>No signature</Text>
                )}
                <View style={styles.sigDivider} />
                <Text style={styles.sigName}>{audit.client_name || 'Verified Representative'}</Text>
              </View>
            </View>
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
  badge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, alignSelf: 'flex-start', marginTop: 2 },
  badgeText: { fontSize: 11, fontWeight: '800' },
  photoContainer: { width: '35%', paddingRight: 16 },
  guardPhoto: { width: '100%', aspectRatio: 1, borderRadius: 8 },
  photoPlaceholder: { backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' },
  placeholderText: { fontSize: 12, color: '#64748b' },
  guardDetails: { width: '65%' },
  remarksBox: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, minHeight: 60 },
  docGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  docBox: { width: '31%', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 10, marginBottom: 10 },
  docTitle: { fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 8 },
  sigBox: { flex: 1, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, marginHorizontal: 4, alignItems: 'center' },
  sigImage: { width: '100%', height: 60, marginVertical: 8 },
  noSignature: { fontSize: 12, fontStyle: 'italic', color: '#94a3b8', height: 60, textAlignVertical: 'center', marginVertical: 8 },
  sigDivider: { height: 1, backgroundColor: '#e2e8f0', width: '100%', marginBottom: 8 },
  sigName: { fontSize: 13, fontWeight: '600', color: '#0f172a' }
});