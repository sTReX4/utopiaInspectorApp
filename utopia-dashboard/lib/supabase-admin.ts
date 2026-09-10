import { createClient } from '@supabase/supabase-js';

/* The service-role client bypasses RLS, so it must never be imported into a
 * client component. Route handlers only. */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export type AuthedUser = { id: string; email: string | null };

/* Callers send their Supabase session token as a bearer. Verifying it here is
 * what keeps these routes from being an open door around RLS: the request has
 * to prove which auth user it is before the service key touches a row. */
export async function requireUser(request: Request): Promise<AuthedUser | null> {
  const header = request.headers.get('authorization') ?? '';
  const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
  if (!token) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;

  return { id: data.user.id, email: data.user.email ?? null };
}

/* Approvals are a superadmin action, and the mobile app shares the same auth
 * pool as the console, so the role has to be checked server-side too. */
export async function requireSuperadmin(request: Request): Promise<AuthedUser | null> {
  const user = await requireUser(request);
  if (!user) return null;

  const { data } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return data?.role === 'superadmin' ? user : null;
}
