-- Close the last anon-readable table.
--
-- detachments had RLS enabled but carried "Allow public access to detachments"
-- -- ALL commands, to role public, qual true. That is every branch name,
-- address, GPS pin and inspector assignment readable by anyone holding the
-- anon key, which ships inside the mobile bundle. RLS being "on" made it look
-- covered in the advisor output while it was wide open.
--
-- Writes were UI-gated only: handleAddSite, toggleSiteStatus and
-- handleAssignPersonnel on the sites page never checked isSuperadmin in the
-- handler, just in what they rendered. Same shape as the guards and inspectors
-- gates already closed.

begin;

drop policy if exists "Allow public access to detachments" on public.detachments;

/* A field inspector sees the stops on their own route and nothing else -- the
 * three mobile screens that read this table already filter by
 * assigned_inspector_id, so this takes nothing away from them. The audit form
 * takes branch details from the scanned QR code rather than a lookup here, so
 * covering an unassigned site still works. */
create policy "detachments_select_staff_or_assigned"
  on public.detachments for select to authenticated
  using (
    public.is_console_staff()
    or assigned_inspector_id in (
      select i.id from public.inspectors i where i.auth_id = (select auth.uid())
    )
  );

create policy "detachments_write_superadmin"
  on public.detachments for all to authenticated
  using (public.is_superadmin())
  with check (public.is_superadmin());

commit;
