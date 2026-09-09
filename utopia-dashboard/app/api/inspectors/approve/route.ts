import { NextResponse } from 'next/server';
import { requireSuperadmin, supabaseAdmin } from '@/lib/supabase-admin';
import type { ApproveInspectorBody, InspectorRow } from '@/lib/types';

/* Operations clearing (or turning away) a self-registered inspector.
 *
 * The write crosses the console's own RLS boundary and flips a field-access
 * flag, so it runs on the service key behind a server-side superadmin check
 * rather than trusting the button that was rendered. */
export async function POST(request: Request) {
  const admin = await requireSuperadmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Superadmin clearance required.' }, { status: 403 });
  }

  let body: Partial<ApproveInspectorBody>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Malformed request body.' }, { status: 400 });
  }

  const { inspectorId, decision } = body;

  if (!inspectorId || (decision !== 'approve' && decision !== 'reject')) {
    return NextResponse.json({ error: 'inspectorId and a valid decision are required.' }, { status: 400 });
  }

  const approved = decision === 'approve';

  const { data, error } = await supabaseAdmin
    .from('inspectors')
    .update({
      status: approved ? 'approved' : 'rejected',
      is_active: approved,
      approved_at: new Date().toISOString(),
      approved_by: admin.email,
    })
    .eq('id', inspectorId)
    .eq('status', 'pending') // Only a queued record can be decided; re-clicks no-op.
    .select('*')
    .maybeSingle();

  if (error) {
    console.error('Inspector approval failed:', error);
    return NextResponse.json({ error: 'Could not update the inspector record.' }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json(
      { error: 'That inspector is no longer awaiting approval.' },
      { status: 409 }
    );
  }

  return NextResponse.json({ success: true, inspector: data as InspectorRow });
}
