-- Union — Milestone 1: Foundation + Cases
-- Run this once in the Supabase SQL editor for a fresh project.

create extension if not exists "pgcrypto";

-- ============================================================
-- Tenancy
-- ============================================================

create table tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  primary_color text default '#3b6ef6',
  logo_url text,
  student_email_domain text not null,
  created_at timestamptz default now()
);

-- Single pilot tenant. Multi-tenant onboarding is additive later, not a rewrite.
-- Replace student_email_domain with the real university domain before launch.
insert into tenants (name, slug, student_email_domain)
values ('Demo University', 'demo-university', '@demo.edu.ng');

-- ============================================================
-- Academic structure
-- ============================================================

create table faculties (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  name text not null
);

create table departments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  faculty_id uuid not null references faculties(id),
  name text not null
);

create table programmes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  department_id uuid not null references departments(id),
  name text not null
);

create table academic_levels (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  name text not null,
  sort_order int not null default 0
);

-- ============================================================
-- Users
-- ============================================================

create table users (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  school_email text not null,
  matric_number text not null,
  phone text,
  faculty_id uuid references faculties(id),
  department_id uuid references departments(id),
  programme_id uuid references programmes(id),
  academic_level_id uuid references academic_levels(id),
  profile_photo_url text,
  user_type text not null default 'student' check (user_type in ('student', 'staff')),
  is_verified boolean not null default false,
  created_at timestamptz default now(),
  unique (tenant_id, school_email),
  unique (tenant_id, matric_number)
);

-- ============================================================
-- RBAC
-- ============================================================

create table roles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  name text not null,
  is_system_default boolean not null default false,
  created_at timestamptz default now(),
  unique (tenant_id, name)
);

create table permissions (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  description text
);

create table role_permissions (
  role_id uuid not null references roles(id) on delete cascade,
  permission_id uuid not null references permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create table user_roles (
  user_id uuid not null references users(id) on delete cascade,
  role_id uuid not null references roles(id) on delete cascade,
  primary key (user_id, role_id)
);

-- Seed the permission catalog (code-defined, tenant-agnostic).
insert into permissions (key, description) values
  ('cases.manage', 'Triage, assign, and update all cases'),
  ('cases.manage.sensitive', 'Manage cases in sensitive categories (e.g. Welfare)'),
  ('students.view', 'View the student directory'),
  ('students.manage', 'Correct student identity fields'),
  ('roles.manage', 'Assign roles and define custom roles'),
  ('audit.view', 'View the security audit log'),
  ('dashboard.view', 'View the admin dashboard'),
  ('reports.view', 'View reports');

-- Seed default system roles for the pilot tenant.
insert into roles (tenant_id, name, is_system_default)
select id, 'Super Admin', true from tenants where slug = 'demo-university';

insert into roles (tenant_id, name, is_system_default)
select id, 'Union Officer', true from tenants where slug = 'demo-university';

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r cross join permissions p
where r.name = 'Super Admin';

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p
  on p.key in ('cases.manage', 'students.view', 'dashboard.view', 'reports.view')
where r.name = 'Union Officer';

-- ============================================================
-- Cases
-- ============================================================

create table case_categories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  name text not null,
  description text,
  is_sensitive boolean not null default false,
  is_active boolean not null default true
);

create table cases (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  reference_number text unique not null,
  student_id uuid not null references users(id),
  category_id uuid not null references case_categories(id),
  title text not null,
  description text not null,
  location text,
  status text not null default 'submitted' check (status in
    ('submitted', 'acknowledged', 'assigned', 'in_progress', 'awaiting_university', 'awaiting_student', 'resolved', 'closed', 'rejected')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  is_anonymous boolean not null default false,
  assigned_to uuid references users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  resolved_at timestamptz
);

create index cases_status_idx on cases(status);
create index cases_priority_idx on cases(priority);
create index cases_student_idx on cases(student_id);

create table case_comments (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  author_id uuid not null references users(id),
  body text not null,
  is_internal boolean not null default false,
  created_at timestamptz default now()
);

create table case_history (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  changed_by uuid not null references users(id),
  field_changed text not null,
  old_value text,
  new_value text,
  created_at timestamptz default now()
);

create table case_attachments (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  file_url text not null,
  uploaded_by uuid not null references users(id),
  created_at timestamptz default now()
);

create table case_feedback (
  id uuid primary key default gen_random_uuid(),
  case_id uuid unique not null references cases(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now()
);

-- ============================================================
-- Audit log
-- ============================================================

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  actor_id uuid references users(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before jsonb,
  after jsonb,
  created_at timestamptz default now()
);
