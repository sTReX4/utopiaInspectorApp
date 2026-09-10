-- Retire inspector_keys.
--
-- The UTP-XXXX flow is gone from both codebases; a grep across the dashboard
-- and the mobile app finds no reference to this table. What remained was six
-- rows, every one is_used = true, all issued by superadmin@utopiasecurity.com
-- during development to the three inspectors who are already on the roster and
-- already linked to their accounts. Nothing reads it, nothing joins to it, and
-- it documents a workflow that no longer exists.
--
-- The rows as they stood, since dropping the table is the only place this
-- history lived:
--
--   UTP-5RTSCL  John J Jhonny          used 2026-08-27
--   UTP-5OBVZP  Paul Martin N. Bucad   used 2026-08-30
--   UTP-VQK60C  John Utopia            used 2026-08-30
--   UTP-LYE6UZ  Paul Martin N. Bucad   used 2026-09-06
--   UTP-O6WX6R  Paul Martin N. Bucad   used 2026-09-08
--   UTP-GY8F2T  Paul Martin N. Bucad   used 2026-09-09
--
-- All six keys are spent, so nothing here grants access if it ever resurfaces.

begin;

drop table if exists public.inspector_keys;

commit;
