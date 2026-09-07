-- Union — D5: surface pg_cron job health in the admin console.
-- cron.job and cron.job_run_details live in a schema PostgREST can't see
-- and RLS can't reach directly — this exposes just enough (job name, last
-- run time/status, schedule) through a security definer function so an
-- admin can tell at a glance whether the reminder jobs are actually
-- running, without granting broad access to the cron schema itself.
-- Run after 023_rate_limits_and_poll_edits.sql.

create or replace function get_cron_job_status()
returns table (
  job_name text,
  schedule text,
  active boolean,
  last_run_at timestamptz,
  last_status text
) as $$
  select
    j.jobname,
    j.schedule,
    j.active,
    d.last_run_at,
    d.last_status
  from cron.job j
  left join lateral (
    select start_time as last_run_at, status as last_status
    from cron.job_run_details
    where jobid = j.jobid
    order by start_time desc
    limit 1
  ) d on true
  where j.jobname in ('union-event-reminders', 'union-deal-expiry-reminders')
  order by j.jobname;
$$ language sql stable security definer set search_path = public, cron;

grant execute on function get_cron_job_status() to authenticated;
