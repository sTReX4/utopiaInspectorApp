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
      adopted: false,
      inspector: existing,
    });
  }

  /* Operations may have pre-registered this person from the console, which
   * leaves a record carrying their HR details but no account. Claim it instead
   * of opening a second row for the same human.
   *
   * Adoption always drops the record back to pending, even though the console
   * created it as approved. Sign-up proves control of the mailbox only when
   * email confirmation is on, so inheriting cleared field access off a known
   * address is not something to hand out automatically -- a supervisor still
   * clicks Approve. */
  const email = user.email?.trim().toLowerCase() ?? null;

  if (email) {
    const { data: preRegistered } = await supabaseAdmin
      .from('inspectors')
      .select('id')
      .is('auth_id', null)
      .ilike('email', email)
      .order('created_at', { ascending: true })
      .limit(1);

    const candidate = preRegistered?.[0];

    if (candidate) {
      const { data: adopted } = await supabaseAdmin
        .from('inspectors')
        .update({
          auth_id: user.id,
          /* full_name is left as operations entered it -- that is the vetted
           * HR spelling. The number the inspector just typed on their own
           * handset is the more current one, so that does get taken. */
          contact_number: contactNumber,
          email,
          status: 'pending',
          is_active: false,
          approved_at: null,
          approved_by: null,
        })
        .eq('id', candidate.id)
        .is('auth_id', null) // Lost race: someone else claimed it first.
        .select('id, full_name, status, is_active')
        .maybeSingle();

      if (adopted) {
        return NextResponse.json({
          success: true,
          alreadyRegistered: false,
          adopted: true,
          inspector: adopted,
        });
      }
      // Race lost or the update failed; fall through and open a fresh record.
    }
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
    adopted: false,
    inspector: data as Pick<InspectorRow, 'id' | 'full_name' | 'status' | 'is_active'>,
  });
}
