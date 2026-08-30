import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { supabase } from '../lib/supabase';
import SiteItemCard from '../components/site-item-card';
import SiteDetailModal from '../components/site-detail-modal';

export default function SitesScreen() {
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSite, setSelectedSite] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const loadSitesData = async () => {
    setLoading(true);
    // Adjust 'sites' to match your exact Supabase table name
    const { data, error } = await supabase
      .from('sites')
      .select('*')
      .order('branch_name', { ascending: true });

    if (!error && data) {
      setSites(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSitesData();
  }, []);

  const handleCardPress = (site: any) => {
    setSelectedSite(site);
    setModalVisible(true);
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyText}>No detachments found.</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeader}>Active Detachments</Text>
      
      <FlatList
        data={sites}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadSitesData} />}
        ListEmptyComponent={renderEmptyState}
        renderItem={({ item }) => (
          <SiteItemCard
            branchName={item.branch_name}
            branchCode={item.branch_code}
            location={item.location}
            status={item.status}
            onPress={() => handleCardPress(item)}
          />
        )}
      />

      <SiteDetailModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
        site={selectedSite} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f8fafc' },
  sectionHeader: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 16 },
  emptyState: { alignItems: 'center', marginTop: 40 },
  emptyText: { fontSize: 16, color: '#475569', fontWeight: '600' },
});