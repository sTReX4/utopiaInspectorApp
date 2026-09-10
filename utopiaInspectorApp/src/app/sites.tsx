import React, { useEffect, useState } from 'react';
import { View, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import SiteItemCard from '../components/site-item-card';
import SiteDetailModal from '../components/site-detail-modal';
import { EmptyState, ListFrame, ScreenTitle } from '../components/data-surface';
import { color, space } from '@/constants/tokens';

export default function SitesScreen() {
  const insets = useSafeAreaInsets();
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSite, setSelectedSite] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  /* Adjust 'sites' to match your exact Supabase table name. */
  const fetchSites = async () => {
    const { data, error: queryError } = await supabase
      .from('sites')
      .select('*')
      .order('branch_name', { ascending: true });

    return { data, queryError };
  };

  const loadSitesData = async () => {
    setLoading(true);
    const { data, queryError } = await fetchSites();

    /* The query error used to be dropped on the floor, which rendered a failed
     * read as "No detachments found" -- a statement about the data when the
     * truth was a statement about the connection. */
    if (queryError) {
      setError(queryError.message);
    } else if (data) {
      setError(null);
      setSites(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    let alive = true;

    /* No synchronous setState here: loading already starts true, and every
     * write below lands after the await, guarded against a dead tree. */
    (async () => {
      const { data, queryError } = await fetchSites();
      if (!alive) return;

      if (queryError) setError(queryError.message);
      else if (data) { setError(null); setSites(data); }
      setLoading(false);
    })();

    return () => { alive = false; };
  }, []);

  const handleCardPress = (site: any) => {
    setSelectedSite(site);
    setModalVisible(true);
  };

  return (
    <View style={styles.screen}>
      <ScreenTitle title="Detachments" subtitle={`${sites.length} on file`} />

      <ListFrame>
        <FlatList
          data={sites}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadSitesData} tintColor={color.ink} />}
          contentContainerStyle={[
            styles.listContent,
            { paddingLeft: insets.left, paddingRight: insets.right, paddingBottom: insets.bottom + space.xl },
          ]}
          ListEmptyComponent={
            loading ? null : error ? (
              <EmptyState
                title="Could not load detachments"
                body={error}
              />
            ) : (
              <EmptyState
                title="No detachments on file"
                body="Operations maintains this list from the console. Pull down to refresh."
              />
            )
          }
          renderItem={({ item, index }) => (
            <SiteItemCard
              branchName={item.branch_name}
              branchCode={item.branch_code}
              location={item.location}
              status={item.status}
              isFirst={index === 0}
              onPress={() => handleCardPress(item)}
            />
          )}
        />
      </ListFrame>

      <SiteDetailModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        site={selectedSite}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.canvas },
  listContent: { flexGrow: 1 },
});
