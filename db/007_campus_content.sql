-- Union — Campus Information module (digital handbook)
-- Run after 006_news.sql.

create table campus_content (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  category text not null check (category in
    ('academic', 'health_safety', 'accommodation_transport', 'student_services', 'finance_admissions', 'contacts', 'faq')),
  title text not null,
  body text not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  sort_order int not null default 0,
  author_id uuid not null references users(id),
  last_edited_by uuid references users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index campus_content_category_idx on campus_content(category);
create index campus_content_status_idx on campus_content(status);

insert into permissions (key, description) values
  ('campus.manage', 'Create and manage Campus Information handbook content')
on conflict (key) do nothing;

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p on p.key = 'campus.manage'
where r.name = 'Super Admin'
on conflict do nothing;

alter table campus_content enable row level security;

create policy campus_content_select on campus_content
  for select using (status = 'published' or has_permission('campus.manage'));

create policy campus_content_manage on campus_content
  for all using (has_permission('campus.manage'))
  with check (has_permission('campus.manage'));
