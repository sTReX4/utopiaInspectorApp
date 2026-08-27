import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

// We use the Service Role Key to securely interact with the database from the server
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAdminKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseAdminKey);

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // 1. Validate incoming payload
        if (!body.accessKey || !body.authId) {
            return NextResponse.json({ error: "Missing required provisioning credentials." }, { status: 400 });
        }
        
        // 2. Query the Gatekeeper Table for an unused key
        const { data: keyData, error: findError } = await supabase
            .from('inspector_keys')
            .select('*')
            .eq('access_key', body.accessKey)
            .eq('is_used', false)
            .single();

        if (findError || !keyData) {
            return NextResponse.json({ error: "Access Denied: Invalid or expired Access Key." }, { status: 401 });
        }

        // 3. Link the Auth ID to the official HR Record & Update Last Login
        const { data: inspectorData, error: inspectorError } = await supabase
            .from('inspectors')
            .update({ 
                auth_id: body.authId, 
                last_login: new Date().toISOString() 
            })
            .eq('full_name', keyData.assigned_to)
            .select()
            .single();

        // Handle Database Linking Errors (e.g., HR Record missing or Unique Constraint Violation)
        if (inspectorError || !inspectorData) {
            if (inspectorError?.code === '23505') {
                return NextResponse.json({ error: "Security Alert: This account is already bound to another active device." }, { status: 403 });
            }
            return NextResponse.json({ error: "HR Record not found. Please contact the Operations Manager." }, { status: 404 });
        }

        // 4. Burn the Provisioning Key (Mark as used)
        const { error: updateError } = await supabase
            .from('inspector_keys')
            .update({ is_used: true, used_at: new Date().toISOString() })
            .eq('id', keyData.id);

        if (updateError) throw updateError;

        // 5. Return success and the inspector's verified name to personalize the device
        return NextResponse.json({ 
            success: true, 
            inspectorName: inspectorData.full_name 
        });
        
    } catch (error: any) {
        console.error("Provisioning Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}