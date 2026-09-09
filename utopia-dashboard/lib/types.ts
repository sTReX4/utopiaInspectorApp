/* Row shapes for the tables both the dashboard and the inspector app touch.
 * These mirror the Supabase schema exactly — nullability included — so a
 * column change surfaces as a type error rather than an undefined at runtime. */

export type InspectorStatus = 'pending' | 'approved' | 'rejected';

export interface InspectorRow {
  id: string;
  full_name: string;
  contact_number: string | null;
  email: string | null;
  /* Onboarding state. Distinct from is_active, which is the suspension switch
   * operations already used for inspectors who are approved but stood down. */
  status: InspectorStatus;
  is_active: boolean;
  auth_id: string | null;
  last_login: string | null;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
}

export interface DetachmentRow {
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

export interface GuardRow {
  id: string;
  guard_name: string;
  lesp_number: string;
  lesp_expiry_date: string;
  assigned_branch: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

/* --- API contracts shared with the mobile client --- */

export interface RegisterInspectorBody {
  full_name: string;
  contact_number: string;
}

/** What the mobile gatekeeper needs to decide where to send the inspector. */
export interface InspectorStatusResponse {
  registered: boolean;
  status: InspectorStatus | null;
  is_active: boolean;
  inspector_id: string | null;
  full_name: string | null;
}

export interface ApproveInspectorBody {
  inspectorId: string;
  decision: 'approve' | 'reject';
}
