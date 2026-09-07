-- Union — Milestone 1: RLS policies, helper functions, and auth trigger
-- Run after 001_foundation_and_cases.sql

-- ============================================================
-- Helper functions
-- ============================================================

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

-- A case is visible/manageable to a non-owner only if they hold cases.manage,
-- and additionally cases.manage.sensitive when the category is sensitive.
create or replace function can_manage_case(case_category_id uuid) returns boolean as $$
  select
    has_permission('cases.manage')
    and (
      not exists (select 1 from case_categories where id = case_category_id and is_sensitive)
      or has_permission('cases.manage.sensitive')
    );
$$ language sql stable security definer set search_path = public;

-- ============================================================
-- Auth trigger: create the public.users row on signup.
-- Identity fields (name, matric number, faculty/dept/programme/level) are
-- collected at signup and passed as auth metadata; SECURITY DEFINER lets
-- this succeed even before the client has a confirmed session.
-- ============================================================

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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();

-- Mark verified once Supabase confirms the email (OTP flow).
create or replace function handle_auth_user_verified() returns trigger as $$
begin
  if new.email_confirmed_at is not null and old.email_confirmed_at is null then
    update public.users set is_verified = true where auth_user_id = new.id;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_verified on auth.users;
create trigger on_auth_user_verified
  after update on auth.users
  for each row execute function handle_auth_user_verified();

-- ============================================================
-- Enable RLS
-- ============================================================

alter table tenants enable row level security;
alter table faculties enable row level security;
alter table departments enable row level security;
alter table programmes enable row level security;
alter table academic_levels enable row level security;
alter table users enable row level security;
alter table roles enable row level security;
alter table permissions enable row level security;
alter table role_permissions enable row level security;
alter table user_roles enable row level security;
alter table case_categories enable row level security;
alter table cases enable row level security;
alter table case_comments enable row level security;
alter table case_history enable row level security;
alter table case_attachments enable row level security;
alter table case_feedback enable row level security;
alter table audit_logs enable row level security;

-- ============================================================
-- Reference/lookup tables: readable by any authenticated user in the tenant
-- ============================================================

-- Public (including pre-auth) read access: these are needed on the signup
-- form before a session exists, and contain no sensitive data.
create policy tenants_select on tenants for select using (true);
create policy faculties_select on faculties for select using (true);
create policy departments_select on departments for select using (true);
create policy programmes_select on programmes for select using (true);
create policy academic_levels_select on academic_levels for select using (true);
create policy case_categories_select on case_categories for select using (auth.role() = 'authenticated');

-- ============================================================
-- Users
-- ============================================================

create policy users_select_self_or_staff on users
  for select using (id = app_user_id() or has_permission('students.view'));

create policy users_update_self_limited on users
  for update using (id = app_user_id())
  with check (id = app_user_id());

-- Identity fields are protected from self-edit at the application layer
-- (the update form never exposes them); a stricter DB-level column lock
-- can be added via a BEFORE UPDATE trigger if this proves insufficient.

create policy users_update_staff on users
  for update using (has_permission('students.manage'));

-- ============================================================
-- RBAC tables
-- ============================================================

create policy roles_select on roles for select using (auth.role() = 'authenticated');
create policy permissions_select on permissions for select using (auth.role() = 'authenticated');
create policy role_permissions_select on role_permissions for select using (auth.role() = 'authenticated');
create policy user_roles_select_self_or_staff on user_roles
  for select using (user_id = app_user_id() or has_permission('roles.manage'));

create policy roles_manage on roles for all using (has_permission('roles.manage'));
create policy role_permissions_manage on role_permissions for all using (has_permission('roles.manage'));
create policy user_roles_manage on user_roles for all using (has_permission('roles.manage'));

-- ============================================================
-- Cases
-- ============================================================

create policy cases_insert_own on cases
  for insert with check (student_id = app_user_id());

create policy cases_select_own_or_manager on cases
  for select using (
    student_id = app_user_id()
    or assigned_to = app_user_id()
    or can_manage_case(category_id)
  );

create policy cases_update_manager on cases
  for update using (can_manage_case(category_id));

-- ============================================================
-- Case comments (public/internal split is the security-critical policy)
-- ============================================================

create policy case_comments_select on case_comments
  for select using (
    exists (
      select 1 from cases c where c.id = case_id
      and (c.student_id = app_user_id() or can_manage_case(c.category_id))
    )
    and (not is_internal or exists (
      select 1 from cases c where c.id = case_id and can_manage_case(c.category_id)
    ))
  );

create policy case_comments_insert_public_by_owner on case_comments
  for insert with check (
    not is_internal
    and author_id = app_user_id()
    and exists (select 1 from cases c where c.id = case_id and c.student_id = app_user_id())
  );

create policy case_comments_insert_by_manager on case_comments
  for insert with check (
    author_id = app_user_id()
    and exists (select 1 from cases c where c.id = case_id and can_manage_case(c.category_id))
  );

-- ============================================================
-- Case history, attachments, feedback
-- ============================================================

create policy case_history_select on case_history
  for select using (
    exists (
      select 1 from cases c where c.id = case_id
      and (c.student_id = app_user_id() or can_manage_case(c.category_id))
    )
  );

create policy case_history_insert on case_history
  for insert with check (
    changed_by = app_user_id()
    and exists (
      select 1 from cases c where c.id = case_id
      and (c.student_id = app_user_id() or can_manage_case(c.category_id))
    )
  );

create policy case_attachments_select on case_attachments
  for select using (
    exists (
      select 1 from cases c where c.id = case_id
      and (c.student_id = app_user_id() or can_manage_case(c.category_id))
    )
  );

create policy case_attachments_insert on case_attachments
  for insert with check (
    uploaded_by = app_user_id()
    and exists (
      select 1 from cases c where c.id = case_id
      and (c.student_id = app_user_id() or can_manage_case(c.category_id))
    )
  );

create policy case_feedback_select on case_feedback
  for select using (
    exists (
      select 1 from cases c where c.id = case_id
      and (c.student_id = app_user_id() or can_manage_case(c.category_id))
    )
  );

create policy case_feedback_insert_owner on case_feedback
  for insert with check (
    exists (
      select 1 from cases c where c.id = case_id
      and c.student_id = app_user_id() and c.status = 'resolved'
    )
  );

-- ============================================================
-- Audit log — write by any staff action, read restricted to audit.view
-- ============================================================

create policy audit_logs_select on audit_logs
  for select using (has_permission('audit.view'));

create policy audit_logs_insert on audit_logs
  for insert with check (actor_id = app_user_id());
