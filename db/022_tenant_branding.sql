-- Union — tenant branding admin settings.
-- The tenants table already has name/slug/primary_color/logo_url/
-- student_email_domain (001_foundation_and_cases.sql) — this migration
-- only adds the permission, RLS, and storage needed for an admin to edit
-- those fields instead of them being fixed at seed time.
-- Run after 021_case_tracking_faculty_polls_deals.sql.

insert into permissions (key, description) values
  ('tenant.manage', 'Edit Student Union branding and tenant settings')
on conflict (key) do nothing;

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p on p.key = 'tenant.manage'
where r.name = 'Super Admin'
on conflict do nothing;

alter table tenants enable row level security;

-- Branding is public — every page (logged in or not) needs to render the
-- current tenant's name/logo/color, same reasoning as the "everyone" news
-- audience being publicly readable.
drop policy if exists tenants_select on tenants;
create policy tenants_select on tenants
  for select using (true);

drop policy if exists tenants_manage on tenants;
create policy tenants_manage on tenants
  for update using (has_permission('tenant.manage'))
  with check (has_permission('tenant.manage'));

insert into storage.buckets (id, name, public)
values ('tenant-branding', 'tenant-branding', true)
on conflict (id) do nothing;

drop policy if exists tenant_branding_select on storage.objects;
create policy tenant_branding_select on storage.objects
  for select using (bucket_id = 'tenant-branding');

drop policy if exists tenant_branding_insert on storage.objects;
create policy tenant_branding_insert on storage.objects
  for insert with check (bucket_id = 'tenant-branding' and has_permission('tenant.manage'));
