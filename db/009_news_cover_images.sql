-- Union — cover images for announcements (needed for the featured/card UI)
-- Run after 008_events.sql.

alter table announcements add column if not exists cover_image_url text;

-- Public, promotional — same reasoning as event-covers, not private like case attachments.
insert into storage.buckets (id, name, public)
values ('news-covers', 'news-covers', true)
on conflict (id) do nothing;

drop policy if exists news_covers_select on storage.objects;
create policy news_covers_select on storage.objects
  for select using (bucket_id = 'news-covers');

drop policy if exists news_covers_insert on storage.objects;
create policy news_covers_insert on storage.objects
  for insert with check (bucket_id = 'news-covers' and has_permission('news.manage'));
    