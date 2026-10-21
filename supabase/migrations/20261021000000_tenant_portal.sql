-- Tenant portal: tenants may open maintenance requests for their own lease.
drop policy if exists "tenant create own" on maintenance_tickets;
create policy "tenant create own" on maintenance_tickets
  for insert to authenticated with check (
    exists (
      select 1 from tenants t
      where t.id = maintenance_tickets.tenant_id and t.auth_user_id = auth.uid()
    )
  );
