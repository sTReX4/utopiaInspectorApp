import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAdminKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseAdminKey);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        
        // Query the Gatekeeper Table for an unused key
        const { data: keyData, error: findError } = await supabase
            .from('inspector_keys')
            .select('*')
            .eq('access_key', body.accessKey)
            .eq('is_used', false)
            .single();

        if (findError || !keyData) {
            return NextResponse.json({ error: "Access Denied: Invalid or expired Access Key." }, { status: 401 });
        }

        // Burn the Key
        const { error: updateError } = await supabase
            .from('inspector_keys')
            .update({ is_used: true, used_at: new Date().toISOString() })
            .eq('id', keyData.id);

        if (updateError) throw updateError;

        return NextResponse.json({ success: true, inspectorName: keyData.assigned_to });
        
    } catch (error: any) {
        console.error("Provisioning Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}