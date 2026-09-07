-- Union — real preview images for seeded Clubs and Deals (E13).
-- Uses Picsum's seeded-photo endpoint (https://picsum.photos/seed/<seed>/w/h)
-- — a stable, well-documented public placeholder-photo service, not a
-- fabricated or guessed URL. Each seed is deterministic (same club/deal
-- always gets the same photo), so this is safe to re-run.
-- Run after 016_schedule_event_reminders.sql.

update clubs set cover_image_url = 'https://picsum.photos/seed/' || replace(lower(name), ' ', '-') || '/800/450'
where cover_image_url is null;

update deals set logo_url = 'https://picsum.photos/seed/' || replace(lower(merchant_name), ' ', '-') || '/400/400'
where logo_url is null and status != 'archived';
