# Campus Portal — Phase 1 Setup

Code scaffolding for Phase 1 is done (`app/`). These steps need your accounts and can't be done for you:

## 1. Supabase project
1. Create a project at supabase.com.
2. Open the SQL editor and run `db/schema.sql` (creates tables + RLS policies).
3. Project Settings → API: copy the Project URL and `anon` public key.
4. In `app/`, copy `.env.example` to `.env` and fill in those two values.

## 2. Seed the admin account
1. In Supabase Auth, create a user manually (or sign up through the app UI first).
2. Copy that user's UUID from Auth → Users.
3. In the SQL editor:
   ```sql
   INSERT INTO users (id, name, email, role)
   VALUES ('<uuid>', 'Admin Name', 'admin@example.com', 'admin');
   ```
   (If you signed up through the UI, the row already exists as `student` — just `UPDATE users SET role = 'admin' WHERE id = '<uuid>'` instead.)

## 3. Run locally
```
cd app
npm install
npm run dev
```

## 4. Vercel
1. Import this repo (root directory: `app`) into a new Vercel project.
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables.
3. Deploy.

## What's implemented
- Supabase Auth (sign up / log in / log out), student row auto-created on sign-up with `role = 'student'`
- Route guarding: `/student/*` vs `/admin/*`, redirects based on role
- Empty-state skeleton screens for Complaints, Announcements, Events (student + admin)
- Full schema + RLS policies in `db/schema.sql`, matching phase-1-foundation.md

## Exit criteria check
A user can sign up, log in, and land on the correct empty screen for their role — verify this end-to-end once your Supabase project is wired up, before starting Phase 2.
