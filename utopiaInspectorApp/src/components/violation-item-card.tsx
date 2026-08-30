import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';

interface AuditCardProps {
  guardName: string;
  inspectorName: string;
  guardPhotoUrl?: string; 
  date: string;
  onPress: () => void;
}

export default function ViolationItemCard({ guardName, inspectorName, guardPhotoUrl, date, onPress }: AuditCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.imageContainer}>
        {guardPhotoUrl ? (
          <Image source={{ uri: guardPhotoUrl }} style={styles.image} />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>No Photo</Text>
          </View>
        )}
      </View>
      
      <View style={styles.detailsContainer}>
        <Text style={styles.guardName}>Guard: {guardName}</Text>
        <Text style={styles.inspectorName}>Inspector: {inspectorName}</Text>
        <Text style={styles.date}>{date}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#ffffff',
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: { marginRight: 16, justifyContent: 'center' },
  image: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#e2e8f0' },
  placeholderImage: { 
    width: 60, height: 60, borderRadius: 30, 
    backgroundColor: '#cbd5e1', 
    justifyContent: 'center', alignItems: 'center' 
  },
  placeholderText: { fontSize: 10, color: '#475569' },
  detailsContainer: { flex: 1, justifyContent: 'center' },
  guardName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  inspectorName: { fontSize: 14, color: '#475569', marginTop: 4 },
  date: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
});