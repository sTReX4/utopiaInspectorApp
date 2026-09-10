/* Row shapes mirrored from the Supabase schema, nullability included, so a
 * column change shows up as a type error instead of an undefined in the field. */

export type InspectorStatus = 'pending' | 'approved' | 'rejected';

export interface Inspector {
  id: string;
  full_name: string;
  contact_number: string | null;
  email: string | null;
  /* Onboarding state, separate from is_active, which operations uses to stand
   * down an inspector who was already approved. */
  status: InspectorStatus;
  is_active: boolean;
  auth_id: string | null;
  last_login: string | null;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
}

export interface Detachment {
  id: string;
  branch_code: string;
  branch_name: string;
  branch_location: string;
  is_active: boolean | null;
  latitude: number | null;
  longitude: number | null;
  assigned_inspector_id: string | null;
  created_at: string | null;
}

export interface Guard {
  id: string;
  guard_name: string;
  lesp_number: string;
  lesp_expiry_date: string;
  assigned_branch: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

/** What /api/inspectors/status answers, and what the gatekeeper routes on. */
export interface InspectorClearance {
  registered: boolean;
  status: InspectorStatus | null;
  is_active: boolean;
  inspector_id: string | null;
  full_name: string | null;
}
