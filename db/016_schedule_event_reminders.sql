-- Union — schedule the event-reminder cron job now that pg_cron is enabled.
-- Run once, after enabling pg_cron in Database > Extensions (or via
-- `create extension pg_cron;`). Safe to re-run: cron.schedule with the
-- same job name replaces the existing schedule rather than duplicating it.
select cron.schedule('union-event-reminders', '*/10 * * * *', 'select send_event_reminders();');
