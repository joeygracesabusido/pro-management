-- Repair tenants.auth_user_id schema drift.
--
-- Some databases created tenants.auth_user_id with an FK to public.users(id),
-- but every tenant RLS policy compares tenants.auth_user_id to auth.uid().
-- Linking to auth.users.id fails the FK; linking to public.users.id can never
-- satisfy the policy, causing 42501 on maintenance_tickets inserts.
--
-- This migration:
--   1. drops the wrong FK,
--   2. converts legacy public.users.id values to auth.users.id,
--   3. backfills unlinked tenants by email using users.auth_user_id,
--   4. recreates the FK against auth.users(id),
--   5. removes the stale permissive tenants policy,
--   6. recreates the tenant insert policy idempotently.

-- 1. Drop the wrong FK first. The data conversion fails until this is gone.
alter table public.tenants
  drop constraint if exists tenants_auth_user_id_fkey;

-- 2. Convert legacy public.users.id values to auth.users.id.
update public.tenants t
set auth_user_id = u.auth_user_id
from public.users u
where t.auth_user_id = u.id
  and u.auth_user_id is not null;

-- 3. Clear values that are neither null nor valid auth user ids.
update public.tenants t
set auth_user_id = null
where t.auth_user_id is not null
  and not exists (select 1 from auth.users au where au.id = t.auth_user_id);

-- 4. Backfill unlinked tenants by email, using users.auth_user_id.
--    Guards avoid violating the unique constraint on tenants.auth_user_id.
update public.tenants t
set auth_user_id = (
  select u.auth_user_id
  from public.users u
  where lower(u.email) = lower(t.email)
    and u.auth_user_id is not null
    and u.role in ('tenant', 'pending')
    and not exists (
      select 1 from public.tenants t2
      where t2.auth_user_id = u.auth_user_id
    )
  limit 1
)
where t.auth_user_id is null
  and (select count(*) from public.tenants t2 where lower(t2.email) = lower(t.email)) = 1;

-- 5. Recreate the FK against auth.users(id), matching the RLS policies.
alter table public.tenants
  add constraint tenants_auth_user_id_fkey
  foreign key (auth_user_id) references auth.users(id) on delete cascade;

-- 6. Remove the stale permissive policy that let tenants read every tenant row.
drop policy if exists "authenticated all" on public.tenants;

-- 7. Recreate tenant read/staff policies idempotently.
drop policy if exists "staff all" on public.tenants;
create policy "staff all" on public.tenants
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "tenant read own" on public.tenants;
create policy "tenant read own" on public.tenants
  for select to authenticated using (auth_user_id = auth.uid());

-- 8. Recreate the tenant insert policy idempotently.
drop policy if exists "tenant create own" on public.maintenance_tickets;
create policy "tenant create own" on public.maintenance_tickets
  for insert to authenticated
  with check (
    exists (
      select 1 from public.tenants t
      where t.id = maintenance_tickets.tenant_id
        and t.auth_user_id = auth.uid()
    )
  );
