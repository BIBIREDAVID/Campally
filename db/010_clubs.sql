-- Union — Clubs & Societies module
-- Run after 009_news_cover_images.sql.

create table clubs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  name text not null,
  category text not null check (category in
    ('faculty_society', 'academic', 'sports', 'entrepreneurship', 'cultural',
     'religious', 'debate', 'arts', 'music', 'volunteering', 'other')),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  logo_url text,
  cover_image_url text,
  description text not null,
  contact_email text,
  contact_phone text,
  -- Small, denormalised — a handful of optional social links per club doesn't
  -- earn its own table the way clubs/events/announcements do.
  social_links jsonb not null default '{}'::jsonb,
  -- Executives are display-only (name + title) rather than linked user
  -- accounts: V1 has no per-officer login distinct from the club admin
  -- account, so a real table would just be an unused join.
  executives jsonb not null default '[]'::jsonb,
  membership_mode text not null default 'request' check (membership_mode in ('open', 'request')),
  author_id uuid not null references users(id),
  last_edited_by uuid references users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index clubs_status_idx on clubs(status);
create index clubs_category_idx on clubs(category);

-- Grants a specific user management rights over one club (profile, officers,
-- announcements, membership requests) without the global clubs.manage
-- permission — the RBAC scoping the spec calls for "Club Administrator can
-- only manage their own club."
create table club_admins (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references clubs(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz default now(),
  unique (club_id, user_id)
);

create table club_follows (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references clubs(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz default now(),
  unique (club_id, user_id)
);

create index club_follows_club_idx on club_follows(club_id);
create index club_follows_user_idx on club_follows(user_id);

create table club_memberships (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references clubs(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  requested_at timestamptz default now(),
  decided_at timestamptz,
  decided_by uuid references users(id),
  created_at timestamptz default now(),
  unique (club_id, user_id)
);

create index club_memberships_club_idx on club_memberships(club_id);
create index club_memberships_user_idx on club_memberships(user_id);

create table club_announcements (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references clubs(id) on delete cascade,
  title text not null,
  body text not null,
  author_id uuid not null references users(id),
  created_at timestamptz default now()
);

create index club_announcements_club_idx on club_announcements(club_id);

-- Lets a club be shown as the organiser of an event and lets a club's page
-- list its own upcoming events, without duplicating event data.
alter table events add column club_id uuid references clubs(id) on delete set null;
create index events_club_idx on events(club_id);

create or replace function is_club_admin(target_club_id uuid) returns boolean as $$
  select exists (
    select 1 from club_admins ca where ca.club_id = target_club_id and ca.user_id = app_user_id()
  );
$$ language sql stable security definer set search_path = public;

insert into permissions (key, description) values
  ('clubs.manage', 'Create and manage all clubs and societies')
on conflict (key) do nothing;

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p on p.key = 'clubs.manage'
where r.name = 'Super Admin'
on conflict do nothing;

alter table clubs enable row level security;
alter table club_admins enable row level security;
alter table club_follows enable row level security;
alter table club_memberships enable row level security;
alter table club_announcements enable row level security;

create policy clubs_select on clubs
  for select using (status = 'published' or has_permission('clubs.manage') or is_club_admin(id));

create policy clubs_manage on clubs
  for all using (has_permission('clubs.manage'))
  with check (has_permission('clubs.manage'));

create policy clubs_update_own on clubs
  for update using (is_club_admin(id))
  with check (is_club_admin(id));

create policy club_admins_select on club_admins
  for select using (user_id = app_user_id() or has_permission('clubs.manage'));

create policy club_admins_manage on club_admins
  for all using (has_permission('clubs.manage'))
  with check (has_permission('clubs.manage'));

create policy club_follows_select on club_follows
  for select using (user_id = app_user_id() or has_permission('clubs.manage') or is_club_admin(club_id));

create policy club_follows_insert_own on club_follows
  for insert with check (user_id = app_user_id());

create policy club_follows_delete_own on club_follows
  for delete using (user_id = app_user_id());

create policy club_memberships_select on club_memberships
  for select using (user_id = app_user_id() or has_permission('clubs.manage') or is_club_admin(club_id));

create policy club_memberships_insert_own on club_memberships
  for insert with check (
    user_id = app_user_id()
    and exists (select 1 from clubs c where c.id = club_id and c.status = 'published')
  );

create policy club_memberships_delete_own on club_memberships
  for delete using (user_id = app_user_id() and status = 'pending');

create policy club_memberships_decide on club_memberships
  for update using (has_permission('clubs.manage') or is_club_admin(club_id))
  with check (has_permission('clubs.manage') or is_club_admin(club_id));

create policy club_announcements_select on club_announcements
  for select using (
    exists (select 1 from clubs c where c.id = club_id and c.status = 'published')
    or has_permission('clubs.manage')
    or is_club_admin(club_id)
  );

create policy club_announcements_manage on club_announcements
  for all using (has_permission('clubs.manage') or is_club_admin(club_id))
  with check (has_permission('clubs.manage') or is_club_admin(club_id));

insert into storage.buckets (id, name, public)
values ('club-images', 'club-images', true)
on conflict (id) do nothing;

drop policy if exists club_images_select on storage.objects;
create policy club_images_select on storage.objects
  for select using (bucket_id = 'club-images');

drop policy if exists club_images_insert on storage.objects;
create policy club_images_insert on storage.objects
  for insert with check (bucket_id = 'club-images' and has_permission('clubs.manage'));
