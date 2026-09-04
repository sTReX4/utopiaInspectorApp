import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface HistoryItemCardProps {
  guardName: string;
  inspectorName: string;
  date: string;
  onPress: () => void;
}

export default function HistoryItemCard({ guardName, inspectorName, date, onPress }: HistoryItemCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <Text style={styles.guardName} numberOfLines={1}>{guardName}</Text>
        <Text style={styles.dateText}>{date}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.inspectorLabel}>INSPECTED BY:</Text>
        <Text style={styles.inspectorName} numberOfLines={1}>{inspectorName}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 10,
  },
  guardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    flex: 1,
    marginRight: 10,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inspectorLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94a3b8',
    marginRight: 6,
  },
  inspectorName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#334155',
    flex: 1,
  },
});