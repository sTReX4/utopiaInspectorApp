import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAdminKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
// REMINDER: For secure backend operations, consider using SUPABASE_SERVICE_ROLE_KEY here instead if I run into RLS issues
const supabase = createClient(supabaseUrl, supabaseAdminKey);

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('audits')
            .select('id, inspector_name, guard_name, branch_name, branch_location, time_in, time_out, lesp_expiry, uniform_status, remarks')
            .order('time_in', { ascending: false })
            .limit(100);

        if (error) {
            console.error('Audit history fetch error:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(data);
    } catch (err) {
        console.error('Unexpected audit history error:', err);
        return NextResponse.json({ error: 'Unable to load audit history.' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        let finalPhotoUrl = null;
        if (body.live_photo_uri && body.live_photo_uri.startsWith('data:image')) {
            // Upload the base64 image to Supabase Storage
            const base64Data = body.live_photo_uri.split(',')[1]; // Remove the data URL prefix
            const buffer = Buffer.from(base64Data, 'base64');
            const fileName = `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}.jpg`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('audit-photos')
                .upload(fileName, buffer, {
                    contentType: 'image/jpeg',
                });
            
            if (uploadError) {
                console.error('Supabase storage upload error:', uploadError);
                throw new Error('Failed to upload photo to storage.');
            }

            const {data: publicUrlData } = supabase.storage
                .from('audit-photos')
                .getPublicUrl(fileName);

            finalPhotoUrl = publicUrlData.publicUrl;
        }

        const lat = body.gps_coordinates?.latitude || null;
        const lng = body.gps_coordinates?.longitude || null;

        const { data, error } = await supabase.from('audits').insert([
            {
                branch_code: body.branch_code,
                branch_name: body.branch_name,
                branch_location: body.branch_location,

                inspector_name: "Inspector Alpha",

                time_in: body.inspector_in_time,
                time_out: body.inspector_out_time,

                gps_latitude: lat,                          
                gps_longitude: lng, 
                
                guard_name: body.guard_name, 

                firearm_serial: body.firearm_serial,
                firearm_make: body.firearm_make,
                lesp_expiry: body.lesp_expiry,
                 
                uniform_status: body.uniform_compliance,

                guard_present_status: body.guard_present_status,

                documents_checklist: body.metrics,          

                violations_checklist: body.violation_ticket,

                remarks: body.remarks,
                
                live_photo_url: finalPhotoUrl,
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
