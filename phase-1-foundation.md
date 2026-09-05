# Phase 1 — Foundation
**Days 1–7 · Campus Portal V1**

## Goal
Everything a user touches before they reach a module: auth, roles, routing, schema, and the skeleton screens that later phases will fill in with real logic. Nothing feature-specific happens here — no complaints, no announcements, no events.

## Stack (locked for the whole project)
- **Frontend:** React + Vite
- **Database:** PostgreSQL via Supabase (hosted Postgres + Auth + Row Level Security)
- **Auth:** Supabase Auth (email/password)
- **Hosting:** Vercel (frontend), Supabase (backend services)
- **RBAC enforcement:** Postgres Row Level Security — no custom permissions engine

## Roles
Two hardcoded roles, nothing else:
- `student`
- `admin`

Stored as a column on `users`. Students self-register; admin accounts are seeded manually via SQL insert or a one-time setup script. No admin self-signup UI.

## Full Database Schema
Set up all tables now, even though later phases only populate some of them — this avoids mid-project migrations.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'admin')),
  created_at TIMESTAMPTZ DEFAULT now()
);

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

CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  pinned BOOLEAN DEFAULT false,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

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

## Row Level Security (draft now, refine per-module later)
- `users`: a user can read their own row; only admin can read others; role is not client-editable
- `complaints`: student can `INSERT` where `student_id = auth.uid()`; student can `SELECT` only their own rows; only admin can `UPDATE status`/`admin_note`
- `announcements` / `events`: any authenticated user can `SELECT`; only admin can `INSERT`/`UPDATE`
- `event_rsvps`: student can `INSERT`/`UPDATE` only their own row; admin can `SELECT` all

## Tasks (Days 1–7)
**Days 1–2**
- Confirm module list (Auth, Complaints, Announcements, Events+RSVP) — no additions
- Run the schema above, freeze it after this pass
- Set up repo, Supabase project, Vercel project, environment variables

**Days 3–7**
- Supabase Auth wired up: sign up, login, logout
- On sign-up, insert matching row into `users` with `role = 'student'`
- Route guarding: student routes vs admin routes
- Skeleton screens for all four modules (empty states only, no logic yet)
- RLS policies drafted and tested against both roles

## Exit Criteria
A user can sign up, log in, and land on the correct (empty) screen for their role. Nothing else needs to work yet. Do not start Phase 2 until this is genuinely true — not "mostly working."
