export interface Guard {
  id: string;
  guard_name: string;
  lesp_number: string;
  lesp_expiry_date: string;
  assigned_branch: string | null;
  is_active: boolean;
}

export interface InspectorKey {
  id: string;
  access_key: string;
  assigned_to: string;
  is_used: boolean;
  created_by: string;
  created_at: string;
  used_at: string | null;
}

export interface Inspector {
  id: string;
  full_name: string;
  contact_number: string | null;
  is_active: boolean;
  created_at: string;
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
  type: 'guard' | 'inspector' | 'key';
};
