-- Union — In-app notifications
-- Run after 012_seed_clubs_and_deals.sql.
--
-- Notifications are created by AFTER triggers on the source tables, not by
-- application code — so a case status change, a new comment, a published
-- announcement, a club announcement, or a membership decision always
-- produces a notification no matter which code path (admin UI, future API,
-- direct SQL) caused it. Trigger functions are `security definer`, owned by
-- the migration role, which already bypasses RLS in this project the same
-- way has_permission() and is_club_admin() do — so no insert policy is
-- needed on notifications at all; users can only ever read their own.

create table notifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  user_id uuid not null references users(id) on delete cascade,
  kind text not null check (kind in
    ('case_status_changed', 'case_comment_added', 'announcement_published',
     'event_reminder', 'club_announcement', 'membership_decided')),
  title text not null,
  body text,
  link_url text,
  is_read boolean not null default false,
  created_at timestamptz default now()
);

create index notifications_user_idx on notifications(user_id, is_read, created_at desc);

alter table notifications enable row level security;

create policy notifications_select_own on notifications
  for select using (user_id = app_user_id());

create policy notifications_update_own on notifications
  for update using (user_id = app_user_id())
  with check (user_id = app_user_id());

-- ============================================================
-- Case status changed
-- ============================================================

create or replace function notify_case_status_changed() returns trigger as $$
begin
  if new.status is distinct from old.status then
    insert into notifications (tenant_id, user_id, kind, title, body, link_url)
    select c.tenant_id, c.student_id, 'case_status_changed',
      'Case update: ' || c.title,
      'Your case is now ' || replace(new.status, '_', ' ') || '.',
      '/cases/' || c.id
    from cases c where c.id = new.id;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_notify_case_status_changed on cases;
create trigger trg_notify_case_status_changed
  after update on cases
  for each row execute function notify_case_status_changed();

-- ============================================================
-- Case comment added (student-visible only, and only when the
-- commenter isn't the student themselves)
-- ============================================================

create or replace function notify_case_comment_added() returns trigger as $$
begin
  if new.is_internal = false then
    insert into notifications (tenant_id, user_id, kind, title, body, link_url)
    select c.tenant_id, c.student_id, 'case_comment_added',
      'New reply on: ' || c.title,
      left(new.body, 140),
      '/cases/' || c.id
    from cases c
    where c.id = new.case_id and c.student_id <> new.author_id;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_notify_case_comment_added on case_comments;
create trigger trg_notify_case_comment_added
  after insert on case_comments
  for each row execute function notify_case_comment_added();

-- ============================================================
-- Announcement published — fans out to every matching student.
-- Respects the same audience targeting the announcement itself uses.
-- ============================================================

create or replace function notify_announcement_published() returns trigger as $$
begin
  if new.status = 'published' and (old.status is distinct from 'published') then
    insert into notifications (tenant_id, user_id, kind, title, body, link_url)
    select new.tenant_id, u.id, 'announcement_published',
      case when new.priority = 'urgent' then 'Urgent: ' || new.title else new.title end,
      left(new.body, 140),
      '/news/' || new.id
    from users u
    where u.tenant_id = new.tenant_id
      and (new.audience_type = 'everyone' or u.faculty_id = new.audience_faculty_id);
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_notify_announcement_published on announcements;
create trigger trg_notify_announcement_published
  after update on announcements
  for each row execute function notify_announcement_published();

-- ============================================================
-- Club announcement — notifies followers and approved members
-- ============================================================

create or replace function notify_club_announcement() returns trigger as $$
begin
  insert into notifications (tenant_id, user_id, kind, title, body, link_url)
  select c.tenant_id, recipient.user_id, 'club_announcement',
    c.name || ': ' || new.title,
    left(new.body, 140),
    '/clubs/' || c.id
  from clubs c
  cross join lateral (
    select user_id from club_follows where club_id = c.id
    union
    select user_id from club_memberships where club_id = c.id and status = 'approved'
  ) recipient
  where c.id = new.club_id;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_notify_club_announcement on club_announcements;
create trigger trg_notify_club_announcement
  after insert on club_announcements
  for each row execute function notify_club_announcement();

-- ============================================================
-- Club membership decided (approved or rejected)
-- ============================================================

create or replace function notify_membership_decided() returns trigger as $$
begin
  if new.status in ('approved', 'rejected') and old.status is distinct from new.status then
    insert into notifications (tenant_id, user_id, kind, title, body, link_url)
    select c.tenant_id, new.user_id, 'membership_decided',
      case when new.status = 'approved' then 'Welcome to ' || c.name || '!'
           else 'Update on your ' || c.name || ' request' end,
      case when new.status = 'approved' then 'Your membership request was approved.'
           else 'Your membership request was not approved this time.' end,
      '/clubs/' || c.id
    from clubs c where c.id = new.club_id;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_notify_membership_decided on club_memberships;
create trigger trg_notify_membership_decided
  after update on club_memberships
  for each row execute function notify_membership_decided();

-- ============================================================
-- Event reminders — 1 hour before start, for everyone RSVP'd.
-- Requires pg_cron (available on Supabase). If pg_cron isn't enabled on
-- this project, this block is skipped rather than failing the migration —
-- the reminder feature simply won't fire until an admin enables the
-- extension and re-runs this file.
-- ============================================================

alter table events add column if not exists reminder_sent boolean not null default false;

create or replace function send_event_reminders() returns void as $$
begin
  insert into notifications (tenant_id, user_id, kind, title, body, link_url)
  select e.tenant_id, r.user_id, 'event_reminder',
    'Starting soon: ' || e.title,
    'Starts at ' || to_char(e.start_at, 'HH12:MI AM') || (case when e.location is not null then ' — ' || e.location else '' end),
    '/events/' || e.id
  from events e
  join event_rsvps r on r.event_id = e.id
  where e.status = 'published'
    and e.reminder_sent = false
    and e.start_at between now() and now() + interval '1 hour';

  update events set reminder_sent = true
  where status = 'published' and reminder_sent = false
    and start_at between now() and now() + interval '1 hour';
end;
$$ language plpgsql security definer set search_path = public;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('union-event-reminders', '*/10 * * * *', 'select send_event_reminders();');
  else
    raise notice 'pg_cron not installed — event reminders will not fire until it is enabled and this migration is re-run.';
  end if;
exception when others then
  raise notice 'Could not schedule event reminder job (%). Run manually or enable pg_cron in Database > Extensions.', sqlerrm;
end $$;
