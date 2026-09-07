-- Union — RLS audit fix (2026-09-07).
-- get_cron_job_status() (024_cron_visibility.sql) was granted to
-- `authenticated` with no in-function permission check, so any logged-in
-- student could call it directly via supabase.rpc and see cron job
-- internals — the /admin/reports page gates rendering it on reports.view,
-- but that's an app-layer check only, not enforced at the RPC itself.
-- Run after 024_cron_visibility.sql.

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
    and has_permission('reports.view')
  order by j.jobname;
$$ language sql stable security definer set search_path = public, cron;

grant execute on function get_cron_job_status() to authenticated;
