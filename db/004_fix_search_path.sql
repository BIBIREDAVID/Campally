-- Fix: SECURITY DEFINER functions get an empty search_path by default in
-- Supabase, so unqualified table names (e.g. "tenants") fail to resolve.
-- Run this to patch the functions in place.

create or replace function app_user_id() returns uuid as $$
  select id from public.users where auth_user_id = auth.uid();
$$ language sql stable security definer set search_path = public;

create or replace function has_permission(perm_key text) returns boolean as $$
  select exists (
    select 1
    from user_roles ur
    join role_permissions rp on rp.role_id = ur.role_id
    join permissions p on p.id = rp.permission_id
    where ur.user_id = app_user_id() and p.key = perm_key
  );
$$ language sql stable security definer set search_path = public;

create or replace function can_manage_case(case_category_id uuid) returns boolean as $$
  select
    has_permission('cases.manage')
    and (
      not exists (select 1 from case_categories where id = case_category_id and is_sensitive)
      or has_permission('cases.manage.sensitive')
    );
$$ language sql stable security definer set search_path = public;

create or replace function handle_new_auth_user() returns trigger as $$
declare
  v_tenant_id uuid;
begin
  select id into v_tenant_id from tenants where slug = 'demo-university';

  insert into public.users (
    tenant_id, auth_user_id, first_name, last_name, school_email, matric_number,
    faculty_id, department_id, programme_id, academic_level_id
  ) values (
    v_tenant_id,
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'matric_number', ''),
    nullif(new.raw_user_meta_data->>'faculty_id', '')::uuid,
    nullif(new.raw_user_meta_data->>'department_id', '')::uuid,
    nullif(new.raw_user_meta_data->>'programme_id', '')::uuid,
    nullif(new.raw_user_meta_data->>'academic_level_id', '')::uuid
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function handle_auth_user_verified() returns trigger as $$
begin
  if new.email_confirmed_at is not null and old.email_confirmed_at is null then
    update public.users set is_verified = true where auth_user_id = new.id;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;
