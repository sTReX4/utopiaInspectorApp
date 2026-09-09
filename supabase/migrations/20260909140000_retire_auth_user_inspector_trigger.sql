-- Retire the auth.users -> inspectors trigger, which contradicts the approval
-- queue on three counts:
--
--   1. It inserted with is_active = true, so every self-registered account
--      would have been cleared for field duty before anyone reviewed it.
--   2. It read first_name / last_name out of raw_user_meta_data. The sign-up
--      screen now sends full_name and contact_number, so the trigger would
--      have written an empty name.
--   3. It set inspectors.id = auth.users.id while leaving auth_id null. The
--      registration route links on auth_id, so it would have found nothing and
--      opened a second record -- two rows per inspector, one of them a
--      nameless active ghost.
--
-- Registration is now a single explicit writer: POST /api/inspectors/register,
-- on the service key, after the caller's bearer token is verified.
--
-- The definition being dropped, for the record:
--
--   CREATE FUNCTION public.handle_new_inspector() RETURNS trigger
--   LANGUAGE plpgsql SECURITY DEFINER AS $function$
--   DECLARE first_name text; last_name text; combined_name text;
--   BEGIN
--     first_name := NEW.raw_user_meta_data->>'first_name';
--     last_name  := NEW.raw_user_meta_data->>'last_name';
--     combined_name := COALESCE(first_name,'') || ' ' || COALESCE(last_name,'');
--     INSERT INTO public.inspectors (id, full_name, is_active)
--     VALUES (NEW.id, TRIM(combined_name), true);
--     RETURN NEW;
--   END; $function$;
--
--   CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
--     FOR EACH ROW EXECUTE FUNCTION public.handle_new_inspector();

begin;

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_inspector();

-- Supabase grants EXECUTE on public functions to anon and authenticated by
-- default, so revoking from PUBLIC left both explicit grants standing. The
-- clearance helpers answer a question about the caller and have no business
-- being reachable as /rest/v1/rpc endpoints by a signed-out client.
revoke execute on function public.is_console_staff() from anon;
revoke execute on function public.is_superadmin()    from anon;

commit;
