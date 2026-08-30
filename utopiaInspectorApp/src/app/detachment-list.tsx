import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { supabase } from '../lib/supabase';
import SiteItemCard from '../components/site-item-card';
import SiteDetailModal from '../components/site-detail-modal';

export default function DetachmentList() {
  const [detachments, setDetachments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDetachment, setSelectedDetachment] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const loadDetachments = async () => {
    setLoading(true);
    // Replace 'detachments' with your actual table name if it differs (e.g., 'sites')
    const { data, error } = await supabase
      .from('detachments')
      .select('*')
      .order('branch_name', { ascending: true });

    if (!error && data) {
      setDetachments(data);
    } else if (error) {
      console.error("Error fetching detachments:", error.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadDetachments();
  }, []);

  const handlePress = (detachment: any) => {
    setSelectedDetachment(detachment);
    setModalVisible(true);
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyText}>No detachments available.</Text>
      <Text style={styles.emptySubtext}>Add a detachment to see it listed here.</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={detachments}
        keyExtractor={(item) => item.id?.toString()}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadDetachments} />}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <SiteItemCard
            branchName={item.branch_name || 'Unknown Branch'}
            branchCode={item.branch_code || 'N/A'}
            location={item.location || 'No location provided'}
            status={item.status || 'Active'}
            onPress={() => handlePress(item)}
          />
        )}
      />

      <SiteDetailModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
        site={selectedDetachment} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  listContent: { padding: 16, paddingBottom: 40 },
  emptyState: { alignItems: 'center', marginTop: 40 },
  emptyText: { fontSize: 16, color: '#475569', fontWeight: '600' },
  emptySubtext: { fontSize: 14, color: '#94a3b8', marginTop: 8 }
});