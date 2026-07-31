import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const lat = typeof body.gps_coordinates === 'object' ? body.gps_coordinates.latitude : null;
        const lng = typeof body.gps_coordinates === 'object' ? body.gps_coordinates.longitude : null;

        const { data, error } = await supabase.from('audits').insert([
            {
                detachment_code: body.branch_code,          
                branch_name: body.branch_name,
                branch_location: body.branch_location,
                inspector_name: "Inspector Alpha",
                guard_name: body.guard_name, 
                lesp_expiry: body.lesp_expiry_number,       // FIX 1: Matched the mobile key!
                time_in: body.inspector_in_time,
                time_out: body.inspector_out_time,
                gps_latitude: lat,                          
                gps_longitude: lng,  
                uniform_status: body.uniform_compliance,    // FIX 2: Added the missing pipe!
                firearm_serial: body.firearm_serial,        // FIX 3: Added missing pipe
                firearm_make: body.firearm_make,            // FIX 3: Added missing pipe
                guard_present_status: body.guard_present_status,
                documents_checklist: body.metrics,          
                violations_checklist: body.violation_ticket,
                remarks: body.remarks,
                live_photo_url: body.live_photo_uri,
                guard_signature: body.guard_signature,
                inspector_signature: body.client_signature
            }
        ]);

        if (error) {
            console.error ('Supabase insert error:', error);
            return NextResponse.json({ success: false, error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true, message: 'Audit securely logged.' }, { status: 201 });

    } catch (err) {
        console.error('Unexpected error:', err);
        return NextResponse.json({ success: false, error: 'An unexpected error occurred.' }, { status: 500 });
    }
}