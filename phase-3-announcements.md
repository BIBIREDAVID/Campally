# Phase 3 — Announcements Module
**Days 22–35 · Campus Portal V1**

## Goal
A working, simple communication channel: admin posts, students read. No audience segmentation, no scheduling, no expiry — those are explicitly deferred to V2.

*Depends on:* Phase 1 (auth, schema, RLS) and Phase 2 (complaints, fully finished and tested) already complete.

## Table (already created in Phase 1)
```sql
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  pinned BOOLEAN DEFAULT false,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## RLS for this table
- Any authenticated user can `SELECT`
- Only admin can `INSERT`/`UPDATE`/`DELETE`

## Features
**Admin side**
- Create announcement: title, body, optional "pinned" flag
- Edit / delete an existing announcement

**Student side**
- Feed view of all announcements, pinned items first, then newest first

## Sample Query
```sql
-- Insert: new announcement
INSERT INTO announcements (title, body, pinned, created_by)
VALUES ('Exam Timetable Released', 'Check the portal for your schedule.', true, '<admin_id>');

-- Feed ordering: pinned first, then newest
SELECT * FROM announcements ORDER BY pinned DESC, created_at DESC;
```

## Tasks (Days 22–35)
- Admin: create/edit/delete announcement
- Student: feed view, pinned sorting
- Finish and test completely — no partial states carried into Phase 4

## Exit Criteria
Admin-created announcements appear correctly ordered on the student feed, and edits/deletes reflect immediately with no stale cached data.
