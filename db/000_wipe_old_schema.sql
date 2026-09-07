-- Run this FIRST to clear the old Campally schema before applying
-- 001_foundation_and_cases.sql, 002_rls_and_triggers.sql, 003_seed_demo_data.sql.

drop trigger if exists on_auth_user_created on auth.users;

drop table if exists event_rsvps cascade;
drop table if exists events cascade;
drop table if exists announcements cascade;
drop table if exists complaints cascade;
drop table if exists users cascade;

drop function if exists is_admin();
drop function if exists handle_new_auth_user();

-- Old storage policies/bucket from the complaints image upload feature.
drop policy if exists complaint_images_insert_own on storage.objects;
drop policy if exists complaint_images_select_all on storage.objects;
