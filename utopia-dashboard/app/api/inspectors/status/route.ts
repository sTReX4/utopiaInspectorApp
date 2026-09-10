import { NextResponse } from 'next/server';
import { requireUser, supabaseAdmin } from '@/lib/supabase-admin';
import type { InspectorStatusResponse } from '@/lib/types';

/* The gatekeeper the mobile app hits on every cold start. It answers only for
 * the bearer token's own record, so a handset cannot poll anyone else's. */
export async function GET(request: Request) {
  const user = await requireUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from('inspectors')
    .select('id, full_name, status, is_active')
    .eq('auth_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Inspector status lookup failed:', error);
    return NextResponse.json({ error: 'Could not read your clearance.' }, { status: 500 });
  }

  // An authenticated user with no HR record signed up before the record write
  // landed. The app sends them back through registration rather than the queue.
  const payload: InspectorStatusResponse = data
    ? {
        registered: true,
        status: data.status,
        is_active: data.is_active,
        inspector_id: data.id,
        full_name: data.full_name,
      }
    : { registered: false, status: null, is_active: false, inspector_id: null, full_name: null };

  if (data && data.status === 'approved' && data.is_active) {
    await supabaseAdmin
      .from('inspectors')
      .update({ last_login: new Date().toISOString() })
      .eq('id', data.id);
  }

  return NextResponse.json(payload);
}
