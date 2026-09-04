import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface ViolationItemCardProps {
  itemName: string;
  status: 'Yes' | 'No';
  onUpdate: (value: 'Yes' | 'No') => void;
}

export default function ViolationItemCard({ itemName, status, onUpdate }: ViolationItemCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{itemName}</Text>
      <View style={styles.optionsRow}>
        <TouchableOpacity
          style={[styles.option, status === 'Yes' && styles.optionSelected]}
          onPress={() => onUpdate('Yes')}
        >
          <Text style={[styles.optionText, status === 'Yes' && styles.optionTextSelected]}>Yes</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.option, status === 'No' && styles.optionSelected]}
          onPress={() => onUpdate('No')}
        >
          <Text style={[styles.optionText, status === 'No' && styles.optionTextSelected]}>No</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 10,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  option: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  optionSelected: {
    backgroundColor: '#0056b3',
    borderColor: '#0056b3',
  },
  optionText: {
    color: '#374151',
    fontWeight: '600',
  },
  optionTextSelected: {
    color: '#fff',
  },
});