import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface SiteCardProps {
  branchName: string;
  branchCode: string;
  location: string;
  status?: string;
  onPress: () => void;
}

export default function SiteItemCard({ branchName, branchCode, location, status, onPress }: SiteCardProps) {
  const isActive = status?.toLowerCase() === 'active';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
    <View style={styles.headerRow}>
    <Text style={styles.branchName}>{branchName}</Text>
    <View style={[styles.badge, { backgroundColor: isActive ? '#dcfce7' : '#f1f5f9' }]}>
    <Text style={[styles.badgeText, { color: isActive ? '#16a34a' : '#64748b' }]}>
          {status?.toUpperCase() || 'UNKNOWN'}
    </Text>
    </View>
    </View>
      
    <View style={styles.detailsContainer}>
    <Text style={styles.text}><Text style={styles.label}>Code: 
    </Text>{branchCode}</Text>
    <Text style={styles.text}><Text style={styles.label}>Location: 
    </Text>{location}</Text>
    </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    backgroundColor: '#ffffff',
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  branchName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', flex: 1 },
  badge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: '800' },
  detailsContainer: { marginTop: 4 },
  text: { fontSize: 14, color: '#334155', marginBottom: 4 },
  label: { fontWeight: '600', color: '#94a3b8' },
});