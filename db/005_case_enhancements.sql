-- Union — Cases module completion
-- Adds: anonymous-identity protection (D5), escalation tracking (D2),
-- and attachment storage. Run after 004_fix_search_path.sql.

-- ============================================================
-- Anonymous identity protection (D5)
-- ============================================================
-- "Anonymous" means hidden from other students and from general case
-- admins. Only cases.reveal_anonymous (Super Admin by default) can see the
-- real identity, and doing so is written to audit_logs by the app layer.

insert into permissions (key, description) values
  ('cases.reveal_anonymous', 'Reveal the identity behind an anonymous case submission')
on conflict (key) do nothing;

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p on p.key = 'cases.reveal_anonymous'
where r.name = 'Super Admin'
on conflict do nothing;

-- Anonymous submission only makes sense for categories the SU has decided
-- to allow it for (typically sensitive ones). Default sensitive categories
-- to allow_anonymous = true; everything else stays false until reviewed.
alter table case_categories add column if not exists allow_anonymous boolean not null default false;
update case_categories set allow_anonymous = true where is_sensitive;

-- ============================================================
-- Escalation tracking (D2) — informal, phone/message-based in practice.
-- No external system integration; this is an internal note + reporting field.
-- ============================================================

alter table cases add column if not exists escalated_to_office text;

-- ============================================================
-- Attachments — private storage bucket, path convention: {case_id}/{filename}
-- ============================================================

insert into storage.buckets (id, name, public)
values ('case-attachments', 'case-attachments', false)
on conflict (id) do nothing;

drop policy if exists case_attachments_storage_select on storage.objects;
create policy case_attachments_storage_select on storage.objects
  for select using (
    bucket_id = 'case-attachments'
    and exists (
      select 1 from cases c
      where c.id::text = (storage.foldername(name))[1]
      and (c.student_id = app_user_id() or can_manage_case(c.category_id))
    )
  );

drop policy if exists case_attachments_storage_insert on storage.objects;
create policy case_attachments_storage_insert on storage.objects
  for insert with check (
    bucket_id = 'case-attachments'
    and exists (
      select 1 from cases c
      where c.id::text = (storage.foldername(name))[1]
      and (c.student_id = app_user_id() or can_manage_case(c.category_id))
    )
  );
