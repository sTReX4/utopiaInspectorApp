'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { BranchOption, Guard, Inspector } from './types';

/*
 * The three roster reads for this page. Queries are unchanged from when they
 * lived inline; this only moves them off the component so the page is about
 * layout and the modals can ask for exactly the refresh they need.
 */
export function usePersonnelData() {
  const [guards, setGuards] = useState<Guard[]>([]);
  const [inspectors, setInspectors] = useState<Inspector[]>([]);
  const [branchOptions, setBranchOptions] = useState<BranchOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGuards = useCallback(async () => {
    const { data } = await supabase.from('guards').select('*').order('guard_name', { ascending: true });
    if (data) setGuards(data);
  }, []);

  const fetchBranches = useCallback(async () => {
    const { data } = await supabase
      .from('detachments')
      .select('id, branch_name, assigned_inspector_id, inspector:inspectors(full_name)')
      .order('branch_name');
    if (data) setBranchOptions(data as any);
  }, []);

  const fetchInspectors = useCallback(async () => {
    const { data } = await supabase
      .from('inspectors')
      .select('*, detachments(branch_name)')
      .order('full_name', { ascending: true });
    if (data) setInspectors(data);
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchGuards(), fetchBranches(), fetchInspectors()]);
    setIsLoading(false);
  }, [fetchGuards, fetchBranches, fetchInspectors]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    guards,
    inspectors,
    branchOptions,
    isLoading,
    /* The mutation handlers stay on the page and patch these arrays in place
     * after a write, rather than re-reading the whole roster. Exposing the
     * setters keeps those handlers exactly as they were. */
    setGuards,
    setInspectors,
    setBranchOptions,
    fetchData,
    fetchGuards,
    fetchBranches,
    fetchInspectors,
  };
}
