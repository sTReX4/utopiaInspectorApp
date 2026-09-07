import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { data, error } = await supabase.from('audits').insert([
      {
        branch_code: body.branch_code,
        branch_name: body.branch_name,
        branch_location: body.branch_location,
        inspector_name: body.inspector_name,
        time_in: body.inspector_in_time,
        time_out: body.inspector_out_time,
        gps_latitude: body.gps_coordinates?.latitude || null,
        gps_longitude: body.gps_coordinates?.longitude || null,
        guard_present_status: body.guard_present_status,
        guard_name: body.guard_name,
        lesp_expiry: body.lesp_expiry,
        uniform_compliance: body.uniform_compliance,
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