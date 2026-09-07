-- Union — News & Announcements module
-- Run after 005_case_enhancements.sql.

create table announcements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  title text not null,
  body text not null,
  category text not null default 'student_union' check (category in
    ('student_union', 'campus_news', 'faculty', 'administrative', 'event_promotion')),
  priority text not null default 'normal' check (priority in ('normal', 'urgent')),
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'published', 'archived')),
  -- V1 audience targeting is deliberately just these two presets (see product
  -- decision D3-equivalent for news); "club_followers" is added once Clubs ships.
  audience_type text not null default 'everyone' check (audience_type in ('everyone', 'faculty')),
  audience_faculty_id uuid references faculties(id),
  published_at timestamptz,
  expires_at timestamptz,
  author_id uuid not null references users(id),
  last_edited_by uuid references users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint audience_faculty_required check (
    (audience_type = 'faculty' and audience_faculty_id is not null)
    or (audience_type = 'everyone' and audience_faculty_id is null)
  )
);

create index announcements_status_idx on announcements(status);
create index announcements_published_at_idx on announcements(published_at);
create index announcements_faculty_idx on announcements(audience_faculty_id);

insert into permissions (key, description) values
  ('news.manage', 'Create, publish, and manage news and announcements')
on conflict (key) do nothing;

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p on p.key = 'news.manage'
where r.name = 'Super Admin'
on conflict do nothing;

alter table announcements enable row level security;

-- Published, in-window, audience-matching announcements are visible to any
-- authenticated student; anyone with news.manage sees everything (all
-- statuses) so they can manage drafts and scheduled posts.
create policy announcements_select on announcements
  for select using (
    (
      status = 'published'
      and (published_at is null or published_at <= now())
      and (expires_at is null or expires_at > now())
      and (
        audience_type = 'everyone'
        or (audience_type = 'faculty' and audience_faculty_id = (select faculty_id from users where id = app_user_id()))
      )
    )
    or has_permission('news.manage')
  );

create policy announcements_manage on announcements
  for all using (has_permission('news.manage'))
  with check (has_permission('news.manage'));
