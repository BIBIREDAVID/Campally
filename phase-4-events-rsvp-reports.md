# Phase 4 — Events, RSVP & Reports
**Days 36–49 · Campus Portal V1**

## Goal
This phase carries the project's clearest evidence of relational-database competence: a genuine many-to-many linking table (`event_rsvps`), plus a reports screen built on real aggregate queries rather than hardcoded numbers.

*Depends on:* Phases 1–3 complete and fully tested.

## Tables (already created in Phase 1)
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  event_date TIMESTAMPTZ NOT NULL,
  location TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Linking/junction table: many-to-many between events and users
CREATE TABLE event_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id),
  student_id UUID NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'going',
  responded_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (event_id, student_id)
);
```

## RLS for these tables
- `events`: any authenticated user can `SELECT`; only admin can `INSERT`/`UPDATE`
- `event_rsvps`: student can `INSERT`/`UPDATE` only their own row (`student_id = auth.uid()`); admin can `SELECT` all

## Features
**Admin side**
- Create event: title, description, date, location
- View attendee list / count per event (joined query)
- Reports screen (see below)

**Student side**
- View upcoming events
- RSVP / see own RSVP status per event

## Sample Queries
```sql
-- Aggregate: RSVP count per event (this is your linking-table evidence)
SELECT e.title, COUNT(r.id) AS rsvp_count
FROM events e
LEFT JOIN event_rsvps r ON r.event_id = e.id
GROUP BY e.title;

-- Attendee list for one event
SELECT u.name, r.status, r.responded_at
FROM event_rsvps r
JOIN users u ON u.id = r.student_id
WHERE r.event_id = '<event_id>';
```

## Reports Screen
One admin screen, two queries:
- Complaints grouped by status (`GROUP BY status` on the `complaints` table from Phase 2)
- Events with RSVP counts (query above)

This is a small addition — one screen, two queries — but it's what directly satisfies the "generate/design reports" requirement with real data.

## Tasks
**Days 36–45 — Events + RSVP**
- Admin: create event
- Student: view + RSVP (writes to `event_rsvps`)
- Admin: attendee list per event (joined query)

**Days 46–49 — Reports**
- Build the admin "Reports" view described above

## Exit Criteria
The `event_rsvps` table is populated by real RSVPs (not seeded fake rows left untouched), and the reports screen shows numbers derived from live `GROUP BY`/`JOIN` queries against current data, not hardcoded values.
