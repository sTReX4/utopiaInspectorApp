import type { InspectorRow } from '@/lib/types';

export type { InspectorStatus } from '@/lib/types';

export interface Guard {
  id: string;
  guard_name: string;
  lesp_number: string;
  lesp_expiry_date: string;
  assigned_branch: string | null;
  is_active: boolean;
}

/* The roster read joins the detachments each inspector covers; everything else
 * is the inspectors row verbatim. */
export interface Inspector extends InspectorRow {
  detachments?: { branch_name: string }[];
}

export interface BranchOption {
  id: string;
  branch_name: string;
  assigned_inspector_id: string | null;
  inspector?: { full_name: string } | null;
}

export type DeleteTarget = {
  id: string;
  name: string;
  type: 'guard' | 'inspector';
};
