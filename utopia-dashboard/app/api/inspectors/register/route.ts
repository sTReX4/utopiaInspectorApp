import { NextResponse } from 'next/server';
import { requireUser, supabaseAdmin } from '@/lib/supabase-admin';
import type { InspectorRow, RegisterInspectorBody } from '@/lib/types';

/* Mobile sign-up, step two: the app creates the auth user, then calls this to
 * open its HR record.
 *
 * The insert runs through the service key rather than from the device so the
 * client never gets to choose its own status — a self-registering handset that
 * could write is_active: true would defeat the entire approval queue. */
export async function POST(request: Request) {
  const user = await requireUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  let body: Partial<RegisterInspectorBody>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Malformed request body.' }, { status: 400 });
  }

  const fullName = body.full_name?.trim().replace(/\s+/g, ' ');
  /* Stored as bare digits so the roster never holds two spellings of the same
   * number. The app enforces the same rule, but a request can be made without
   * the app, so the check has to exist here too. */
  const contactNumber = (body.contact_number ?? '').replace(/\D/g, '');

  if (!fullName || fullName.length < 2) {
    return NextResponse.json({ error: 'A full name is required.' }, { status: 400 });
  }

  if (contactNumber.length !== 11 || !contactNumber.startsWith('09')) {
    return NextResponse.json(
      { error: 'Contact number must be 11 digits and start with 09.' },
      { status: 400 }
    );
  }

  // Sign-up can be retried after a dropped response, so an existing record is
  // the expected outcome rather than an error. Report its state and stop.
  const { data: existing } = await supabaseAdmin
    .from('inspectors')
    .select('id, status, is_active')
    .eq('auth_id', user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({
      success: true,
      alreadyRegistered: true,
      inspector: existing,
    });
  }

  const { data, error } = await supabaseAdmin
    .from('inspectors')
    .insert([
      {
        auth_id: user.id,
        full_name: fullName,
        contact_number: contactNumber,
        email: user.email,
        status: 'pending',
        is_active: false,
      },
    ])
    .select('id, full_name, status, is_active')
    .single();

  if (error) {
    console.error('Inspector registration failed:', error);
    return NextResponse.json({ error: 'Could not open your personnel record.' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    alreadyRegistered: false,
    inspector: data as Pick<InspectorRow, 'id' | 'full_name' | 'status' | 'is_active'>,
  });
}
