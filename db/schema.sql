-- Campus Portal V1 — Phase 1 schema
-- Run this once in the Supabase SQL editor. Freeze after this pass.

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

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;

-- Helper: is the current auth user an admin?
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- users: a user can read their own row; admin can read all; role not client-editable
CREATE POLICY users_select_own ON users
  FOR SELECT USING (id = auth.uid() OR is_admin());

CREATE POLICY users_insert_self ON users
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY users_update_own_no_role ON users
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = (SELECT role FROM users WHERE id = auth.uid()));

-- complaints: student inserts/selects own; only admin updates status/admin_note
CREATE POLICY complaints_insert_own ON complaints
  FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY complaints_select_own_or_admin ON complaints
  FOR SELECT USING (student_id = auth.uid() OR is_admin());

CREATE POLICY complaints_update_admin_only ON complaints
  FOR UPDATE USING (is_admin());

-- announcements: any authenticated user selects; only admin inserts/updates
CREATE POLICY announcements_select_all ON announcements
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY announcements_insert_admin ON announcements
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY announcements_update_admin ON announcements
  FOR UPDATE USING (is_admin());

-- events: any authenticated user selects; only admin inserts/updates
CREATE POLICY events_select_all ON events
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY events_insert_admin ON events
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY events_update_admin ON events
  FOR UPDATE USING (is_admin());

-- event_rsvps: student inserts/updates only own row; admin selects all
CREATE POLICY event_rsvps_insert_own ON event_rsvps
  FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY event_rsvps_update_own ON event_rsvps
  FOR UPDATE USING (student_id = auth.uid());

CREATE POLICY event_rsvps_select_own_or_admin ON event_rsvps
  FOR SELECT USING (student_id = auth.uid() OR is_admin());

-- ============================================================
-- Seed an admin manually after creating the Supabase Auth user, e.g.:
-- INSERT INTO users (id, name, email, role)
-- VALUES ('<auth-user-uuid>', 'Admin Name', 'admin@example.com', 'admin');
-- ============================================================
