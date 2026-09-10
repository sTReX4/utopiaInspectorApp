-- Row Level Security for the four tables that were fully exposed to the anon
-- key: audits, guards, inspectors, inspector_keys.
--
-- Both apps authenticate against the same pool, so "authenticated" on its own
-- is not a useful boundary: console staff have a profiles row, field inspectors
-- do not. These two helpers draw that line; superadmin narrows it further.
--
-- Nothing here grants anon a single row. The one server path that used to write
-- as anon -- POST /api/audits -- moves to the service key in the same change.

begin;

create or replace function public.is_console_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p where p.id = (select auth.uid())
  );
$$;

create or replace function public.is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
     where p.id = (select auth.uid())
       and p.role = 'superadmin'
  );
$$;

comment on function public.is_console_staff() is 'True for dashboard users (anyone with a profiles row). False for field inspectors.';
comment on function public.is_superadmin()    is 'True for dashboard users whose profile role is superadmin.';

revoke execute on function public.is_console_staff() from public;
revoke execute on function public.is_superadmin()    from public;
grant  execute on function public.is_console_staff() to authenticated;
grant  execute on function public.is_superadmin()    to authenticated;


-- === audits =================================================================
-- Read stays wide for signed-in users: the dashboard reports on the whole log
-- and the mobile history screen lists every submission. Narrowing this to the
-- submitting inspector needs an inspector id column on audits, which the table
-- does not have yet -- see the Phase 2 note about inspector_id.
--
-- Writes are the tight part. Inserts arrive only from POST /api/audits on the
-- service key, so no insert policy exists at all; the escalation workflow is
-- the sole browser write, and only console staff run it.
alter table public.audits enable row level security;

drop policy if exists "audits_select_authenticated" on public.audits;
create policy "audits_select_authenticated"
  on public.audits for select to authenticated
  using (true);

drop policy if exists "audits_update_console_staff" on public.audits;
create policy "audits_update_console_staff"
  on public.audits for update to authenticated
  using (public.is_console_staff())
  with check (public.is_console_staff());


-- === guards =================================================================
-- The mobile guard roster caches this table, so every signed-in user reads it.
-- Roster edits are superadmin-only, matching the gate the personnel page draws.
alter table public.guards enable row level security;

drop policy if exists "guards_select_authenticated" on public.guards;
create policy "guards_select_authenticated"
  on public.guards for select to authenticated
  using (true);

drop policy if exists "guards_write_superadmin" on public.guards;
create policy "guards_write_superadmin"
  on public.guards for all to authenticated
  using (public.is_superadmin())
  with check (public.is_superadmin());


-- === inspectors =============================================================
-- A field inspector may read their own record and nothing else, so one handset
-- cannot enumerate the roster. The approval queue itself runs on the service
-- key through /api/inspectors/*, which RLS does not apply to.
alter table public.inspectors enable row level security;

drop policy if exists "inspectors_select_staff_or_self" on public.inspectors;
create policy "inspectors_select_staff_or_self"
  on public.inspectors for select to authenticated
  using (public.is_console_staff() or auth_id = (select auth.uid()));

drop policy if exists "inspectors_write_superadmin" on public.inspectors;
create policy "inspectors_write_superadmin"
  on public.inspectors for all to authenticated
  using (public.is_superadmin())
  with check (public.is_superadmin());


-- === inspector_keys =========================================================
-- The access-key flow is retired. RLS on with no policy at all means the issued
-- key history stays readable to the service role and to SQL, and to nobody
-- holding an anon key.
alter table public.inspector_keys enable row level security;

commit;
