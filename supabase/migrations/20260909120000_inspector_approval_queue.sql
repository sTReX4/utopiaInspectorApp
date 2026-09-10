-- Inspector onboarding: a pending-approval queue replaces the UTP-XXXX access keys.
--
-- Inspectors now self-register from the mobile app. The row lands with
-- status = 'pending' and is_active = false, and the field app stays locked
-- until a superadmin approves it from Personnel -> Roving Inspectors.
--
-- The inspector_keys table is intentionally left in place: the key flow is
-- retired in the apps, but the issued-key history stays readable in SQL.

begin;

alter table public.inspectors
  add column if not exists email       text,
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by text;

comment on column public.inspectors.email       is 'Sign-up email, mirrored from auth.users so the approval queue reads without a join.';
comment on column public.inspectors.approved_at is 'When operations cleared this inspector for field work.';
comment on column public.inspectors.approved_by is 'Email of the superadmin who approved or rejected the record.';

-- The backfill has to run exactly once, on the roster that predates the queue.
-- Guarding on the column keeps a re-run from approving genuinely pending rows.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
     where table_schema = 'public'
       and table_name   = 'inspectors'
       and column_name  = 'status'
  ) then
    alter table public.inspectors add column status text not null default 'pending';

    -- Everyone already on the roster came through the access-key flow, so they
    -- are approved whether or not they are currently deactivated.
    update public.inspectors
       set status      = 'approved',
           approved_at = coalesce(approved_at, created_at),
           approved_by = coalesce(approved_by, 'migration:legacy_access_key');
  end if;
end $$;

comment on column public.inspectors.status is 'pending | approved | rejected. Onboarding state, independent of is_active suspension.';

alter table public.inspectors drop constraint if exists inspectors_status_check;
alter table public.inspectors add  constraint inspectors_status_check
  check (status in ('pending', 'approved', 'rejected'));

-- Self-registered rows must be locked out unless something says otherwise.
-- Both writers (the dashboard's Register Inspector form and /api/inspectors/*)
-- set is_active explicitly, so flipping the default only affects new callers.
update public.inspectors set is_active = true where is_active is null;
alter table public.inspectors alter column is_active set not null;
alter table public.inspectors alter column is_active set default false;

-- Existing linked accounts get their email mirrored in so the queue and the
-- roster render the same column for old and new records alike.
update public.inspectors i
   set email = u.email
  from auth.users u
 where i.auth_id = u.id
   and i.email is null;

create index if not exists inspectors_status_idx  on public.inspectors (status);
create index if not exists inspectors_auth_id_idx on public.inspectors (auth_id);

commit;
