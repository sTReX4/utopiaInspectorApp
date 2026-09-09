import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

/* Ingestion for the mobile offline queue. This runs on the service key, not
 * the anon client: audits is under RLS, and the only writer allowed through is
 * the server. A failure here is safe — syncManager keeps the record in SQLite
 * and retries. */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { data, error } = await supabaseAdmin.from('audits').insert([
      {
        branch_code: body.branch_code,
        branch_name: body.branch_name,
        branch_location: body.branch_location,
        inspector_name: body.inspector_name,
        /* Queued payloads written before this column existed still sync; they
         * just land unattributed rather than being rejected. */
        inspector_id: body.inspector_id ?? null,
        time_in: body.inspector_in_time,
        time_out: body.inspector_out_time,
        gps_latitude: body.gps_coordinates?.latitude || null,
        gps_longitude: body.gps_coordinates?.longitude || null,
        guard_present_status: body.guard_present_status,
        guard_name: body.guard_name,
        lesp_expiry: body.lesp_expiry,
        uniform_status: body.uniform_compliance,
        firearm_serial: body.firearm_serial,
        firearm_make: body.firearm_make,
        documents_checklist: body.metrics,
        violations_checklist: body.violation_ticket,
        remarks: body.remarks,
        live_photo_url: body.live_photo_uri,
        guard_signature: body.guard_signature,
        inspector_signature: body.client_signature,
        visit_type: body.visit_type,
        incident_remarks: body.incident_remarks
      }
    ]).select();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}