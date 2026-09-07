-- Union — six small feature additions:
--   1. Public case tracking by reference number (no login required)
--   2. Faculty filtering on Events
--   4. (schema support for) Verified official badges — no schema needed,
--      UI-only, see components. Listed here for numbering continuity.
--   5. Lightweight polls
--   6. Deal expiry reminders, reusing the existing deal_favourites ("saved
--      deals") table from 011_deals.sql.
-- Run after 020_remove_fictional_deals.sql.

-- ============================================================
-- 1. Public case tracking
-- Returns only what a student needs to check progress — never internal
-- comments, staff notes, or (for an anonymous case) who submitted it.
-- security definer so it can run for anon (no session) requests; the
-- reference number itself is the credential, same as a courier tracking
-- number, so no further access check is layered on top.
-- ============================================================

create or replace function track_case_by_reference(p_reference_number text)
returns table (
  reference_number text,
  title text,
  status text,
  priority text,
  category_name text,
  created_at timestamptz,
  updated_at timestamptz,
  resolved_at timestamptz
) as $$
  select c.reference_number, c.title, c.status, c.priority, cc.name,
    c.created_at, c.updated_at, c.resolved_at
  from cases c
  join case_categories cc on cc.id = c.category_id
  where c.reference_number = upper(trim(p_reference_number));
$$ language sql stable security definer set search_path = public;

grant execute on function track_case_by_reference(text) to anon, authenticated;

-- Public, coarse-grained timeline — status changes only, no free-text notes.
create or replace function track_case_history(p_reference_number text)
returns table (
  field_changed text,
  new_value text,
  changed_at timestamptz
) as $$
  select h.field_changed, h.new_value, h.created_at
  from case_history h
  join cases c on c.id = h.case_id
  where c.reference_number = upper(trim(p_reference_number))
    and h.field_changed = 'status'
  order by h.created_at asc;
$$ language sql stable security definer set search_path = public;

grant execute on function track_case_history(text) to anon, authenticated;

-- ============================================================
-- 2. Faculty filtering on Events
-- Nullable — most events are campus-wide; only set when an event is
-- genuinely faculty-specific (e.g. a faculty week, a departmental orientation).
-- ============================================================

alter table events add column if not exists faculty_id uuid references faculties(id);
create index if not exists events_faculty_idx on events(faculty_id);

-- ============================================================
-- 5. Lightweight polls
-- ============================================================

create table polls (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  question text not null,
  description text,
  status text not null default 'draft' check (status in ('draft', 'published', 'closed')),
  closes_at timestamptz,
  author_id uuid not null references users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index polls_status_idx on polls(status);

create table poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references polls(id) on delete cascade,
  label text not null,
  position int not null default 0
);

create index poll_options_poll_idx on poll_options(poll_id);

create table poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references polls(id) on delete cascade,
  option_id uuid not null references poll_options(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz default now(),
  unique (poll_id, user_id)
);

create index poll_votes_poll_idx on poll_votes(poll_id);
create index poll_votes_option_idx on poll_votes(option_id);

insert into permissions (key, description) values
  ('polls.manage', 'Create and manage student polls')
on conflict (key) do nothing;

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p on p.key = 'polls.manage'
where r.name = 'Super Admin'
on conflict do nothing;

alter table polls enable row level security;
alter table poll_options enable row level security;
alter table poll_votes enable row level security;

create policy polls_select on polls
  for select using (status <> 'draft' or has_permission('polls.manage'));

create policy polls_manage on polls
  for all using (has_permission('polls.manage'))
  with check (has_permission('polls.manage'));

create policy poll_options_select on poll_options
  for select using (
    exists (select 1 from polls p where p.id = poll_id and (p.status <> 'draft' or has_permission('polls.manage')))
  );

create policy poll_options_manage on poll_options
  for all using (has_permission('polls.manage'))
  with check (has_permission('polls.manage'));

create policy poll_votes_select on poll_votes
  for select using (user_id = app_user_id() or has_permission('polls.manage'));

create policy poll_votes_insert_own on poll_votes
  for insert with check (
    user_id = app_user_id()
    and exists (select 1 from polls p where p.id = poll_id and p.status = 'published'
      and (p.closes_at is null or p.closes_at > now()))
  );

create policy poll_votes_delete_own on poll_votes
  for delete using (
    user_id = app_user_id()
    and exists (select 1 from polls p where p.id = poll_id and p.status = 'published'
      and (p.closes_at is null or p.closes_at > now()))
  );

-- Public vote counts, safe to expose — never who voted for what.
create or replace function poll_results(p_poll_id uuid)
returns table (option_id uuid, label text, votes bigint) as $$
  select o.id, o.label, count(v.id)
  from poll_options o
  left join poll_votes v on v.option_id = o.id
  where o.poll_id = p_poll_id
  group by o.id, o.label
  order by o.position;
$$ language sql stable security definer set search_path = public;

grant execute on function poll_results(uuid) to anon, authenticated;

-- ============================================================
-- 6. Deal expiry reminders — reuses deal_favourites as "saved deals".
-- ============================================================

alter table notifications drop constraint if exists notifications_kind_check;
alter table notifications add constraint notifications_kind_check check (kind in
  ('case_status_changed', 'case_comment_added', 'announcement_published',
   'event_reminder', 'club_announcement', 'membership_decided',
   'poll_published', 'deal_expiring'));

alter table deals add column if not exists expiry_reminder_sent boolean not null default false;

create or replace function send_deal_expiry_reminders() returns void as $$
begin
  insert into notifications (tenant_id, user_id, kind, title, body, link_url)
  select d.tenant_id, f.user_id, 'deal_expiring',
    'Expiring soon: ' || d.merchant_name,
    'This saved deal expires ' || to_char(d.expires_at, 'DD Mon YYYY') || '.',
    '/deals/' || d.id
  from deals d
  join deal_favourites f on f.deal_id = d.id
  where d.status = 'published'
    and d.expiry_reminder_sent = false
    and d.expires_at is not null
    and d.expires_at between now() and now() + interval '3 days';

  update deals set expiry_reminder_sent = true
  where status = 'published' and expiry_reminder_sent = false
    and expires_at is not null
    and expires_at between now() and now() + interval '3 days';
end;
$$ language plpgsql security definer set search_path = public;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('union-deal-expiry-reminders', '0 */6 * * *', 'select send_deal_expiry_reminders();');
  else
    raise notice 'pg_cron not installed — deal expiry reminders will not fire until it is enabled and this migration is re-run.';
  end if;
exception when others then
  raise notice 'Could not schedule deal expiry reminder job (%). Run manually or enable pg_cron in Database > Extensions.', sqlerrm;
end $$;

-- Optional: notify everyone when a poll is published, same pattern as
-- announcements. Kept simple (no faculty targeting) — polls are meant to
-- be quick, union-wide sentiment checks.
create or replace function notify_poll_published() returns trigger as $$
begin
  if new.status = 'published' and (old.status is distinct from 'published') then
    insert into notifications (tenant_id, user_id, kind, title, body, link_url)
    select new.tenant_id, u.id, 'poll_published',
      'New poll: ' || new.question,
      coalesce(left(new.description, 140), 'Have your say.'),
      '/polls/' || new.id
    from users u where u.tenant_id = new.tenant_id;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_notify_poll_published on polls;
create trigger trg_notify_poll_published
  after update on polls
  for each row execute function notify_poll_published();
