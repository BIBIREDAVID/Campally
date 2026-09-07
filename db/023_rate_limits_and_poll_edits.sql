-- Union — D3: rate limiting for public routes, D4: poll option editing.
-- Run after 022_tenant_branding.sql.

-- ============================================================
-- D3. Rate limiting
-- A simple sliding-window counter backed by a log table. Not built for
-- huge scale (that's what a proper edge rate limiter is for), but this app
-- has no Redis/Upstash available — this is proportionate to the actual
-- risk (case-reference guessing, submission spam) at Union's traffic.
-- ============================================================

create table rate_limit_attempts (
  id bigint generated always as identity primary key,
  key text not null,
  created_at timestamptz not null default now()
);

create index rate_limit_attempts_key_idx on rate_limit_attempts(key, created_at);

-- Periodically prunes itself on use rather than needing a separate cron
-- job — cheap because the index makes the range delete fast.
create or replace function check_rate_limit(p_key text, p_max_attempts int, p_window_seconds int)
returns boolean as $$
declare
  v_count int;
begin
  delete from rate_limit_attempts
  where key = p_key and created_at < now() - (p_window_seconds || ' seconds')::interval;

  select count(*) into v_count from rate_limit_attempts
  where key = p_key and created_at >= now() - (p_window_seconds || ' seconds')::interval;

  if v_count >= p_max_attempts then
    return false;
  end if;

  insert into rate_limit_attempts (key) values (p_key);
  return true;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function check_rate_limit(text, int, int) to anon, authenticated;

-- No RLS select policy needed — nothing reads this table from the client,
-- only the security definer function above touches it.
alter table rate_limit_attempts enable row level security;

-- ============================================================
-- D4. Poll option editing after publish
-- Previously updatePollAction deleted and re-inserted every option, which
-- silently wiped votes (poll_votes cascades on poll_options delete) even
-- for an admin just fixing a typo. Options now carry a stable identity the
-- app can diff against instead of always replacing wholesale.
-- (No schema change needed — poll_options.id was already stable; this is
-- a marker migration documenting the app-layer fix in updatePollAction.)
-- ============================================================
select 1;
