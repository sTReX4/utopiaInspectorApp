-- Key audits to the inspector who filed them.
--
-- audits has only inspector_name, a free-text field stamped from the device.
-- The daily progress tracker has to count "detachments this inspector closed
-- today", and matching people by display name is not something to build a
-- metric on -- two inspectors sharing a surname would silently pool.
--
-- The mobile app already reads .eq('inspector_id', ...) in homepage.tsx and
-- profile.tsx against a column that never existed, so both screens have been
-- returning nothing. This adds the column those queries were written for.
--
-- Nullable on purpose: the column is unknowable for legacy rows whose
-- inspector_name matches nobody on the roster, and audits ingestion must never
-- start rejecting a field submission over it.

begin;

alter table public.audits
  add column if not exists inspector_id uuid references public.inspectors(id);

comment on column public.audits.inspector_id is 'Filing inspector (inspectors.id, not auth.users.id). Null for legacy rows predating the column.';

-- Backfill what can be matched unambiguously by name. Rows naming someone who
-- is not on the roster -- test data such as "Inspector Alpha" -- stay null.
update public.audits a
   set inspector_id = i.id
  from public.inspectors i
 where a.inspector_id is null
   and lower(trim(a.inspector_name)) = lower(trim(i.full_name));

-- The progress query is always "this inspector, since local midnight".
create index if not exists audits_inspector_id_created_at_idx
  on public.audits (inspector_id, created_at desc);

commit;
