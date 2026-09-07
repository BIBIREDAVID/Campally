-- Union — Events module
-- Run after 007_campus_content.sql.

create table events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  title text not null,
  description text not null,
  cover_image_url text,
  category text not null check (category in
    ('social', 'academic', 'sports', 'career', 'orientation', 'entertainment',
     'student_union', 'clubs', 'cultural', 'religious', 'workshops', 'competitions', 'volunteering')),
  status text not null default 'draft' check (status in ('draft', 'published', 'cancelled')),
  start_at timestamptz not null,
  end_at timestamptz,
  location text,
  organiser text,
  contact_person text,
  capacity int,
  rsvp_enabled boolean not null default true,
  author_id uuid not null references users(id),
  last_edited_by uuid references users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index events_status_idx on events(status);
create index events_start_at_idx on events(start_at);
create index events_category_idx on events(category);

create table event_rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz default now(),
  unique (event_id, user_id)
);

create index event_rsvps_event_idx on event_rsvps(event_id);
create index event_rsvps_user_idx on event_rsvps(user_id);

insert into permissions (key, description) values
  ('events.manage', 'Create and manage campus events')
on conflict (key) do nothing;

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p on p.key = 'events.manage'
where r.name = 'Super Admin'
on conflict do nothing;

alter table events enable row level security;
alter table event_rsvps enable row level security;

create policy events_select on events
  for select using (status = 'published' or has_permission('events.manage'));

create policy events_manage on events
  for all using (has_permission('events.manage'))
  with check (has_permission('events.manage'));

create policy event_rsvps_select on event_rsvps
  for select using (user_id = app_user_id() or has_permission('events.manage'));

create policy event_rsvps_insert_own on event_rsvps
  for insert with check (
    user_id = app_user_id()
    and exists (select 1 from events e where e.id = event_id and e.status = 'published' and e.rsvp_enabled)
  );

create policy event_rsvps_delete_own on event_rsvps
  for delete using (user_id = app_user_id());

-- Cover images are public, promotional assets — unlike case attachments,
-- no reason to gate them behind signed URLs.
insert into storage.buckets (id, name, public)
values ('event-covers', 'event-covers', true)
on conflict (id) do nothing;

drop policy if exists event_covers_select on storage.objects;
create policy event_covers_select on storage.objects
  for select using (bucket_id = 'event-covers');

drop policy if exists event_covers_insert on storage.objects;
create policy event_covers_insert on storage.objects
  for insert with check (bucket_id = 'event-covers' and has_permission('events.manage'));
