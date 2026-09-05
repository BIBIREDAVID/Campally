# Phase 2 — Complaints Module
**Days 8–21 · Campus Portal V1**

## Goal
The module that proves the whole system is real. A student can submit a genuine complaint; an admin can genuinely change its status and add a note; the student sees the change reflected back. No fake states, no hardcoded demo cases.

*Depends on:* Phase 1 (auth, schema, RLS) already complete.

## Table (already created in Phase 1)
```sql
CREATE TABLE complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'resolved')),
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

## RLS for this table
- Student can `INSERT` where `student_id = auth.uid()`
- Student can `SELECT` only rows where `student_id = auth.uid()`
- Only admin can `UPDATE status` or `admin_note`

## Features
**Student side**
- Submit complaint form: title, category, description, optional image upload (Supabase Storage)
- List view of own complaints, ordered newest first
- Detail view showing live status and any admin note

**Admin side**
- List all complaints, filterable by status
- Detail view: change status (`open` → `in_review` → `resolved`), add/edit internal note

## Sample Queries (for the "issue queries" deliverable)
```sql
-- Open complaints, newest first
SELECT * FROM complaints WHERE status = 'open' ORDER BY created_at DESC;

-- Join: complaints with the student's name attached
SELECT c.title, c.status, u.name AS student_name
FROM complaints c
JOIN users u ON u.id = c.student_id;

-- Update: admin resolves a complaint
UPDATE complaints SET status = 'resolved', updated_at = now() WHERE id = '<complaint_id>';
```
Screenshot these running against real data for the submission — they're evidence of direct table manipulation, not just app UI.

## Tasks (Days 8–21)
- Student: submit complaint form → `INSERT`
- Student: list + detail view of own complaints, live status
- Admin: list all complaints, filter by status
- Admin: detail view, change status (`UPDATE`), add note
- Image upload if time allows — otherwise cut it, don't fake it with a placeholder

## Exit Criteria
A student can submit a real complaint, an admin can change its status, and the student sees the change — fully, with no shortcuts or mock data. Do not start Phase 3 until this is true.
