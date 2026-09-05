# Phase 5 — Polish, Documentation & Buffer
**Days 50–60 · Campus Portal V1**

## Goal
Turn a working app into a working, *presentable* submission — and produce the written evidence a reviewer will actually check against the database-skills requirement. No new features start here.

*Depends on:* Phases 1–4 complete and fully tested.

## Tasks

**Polish (Days 50–53)**
- Seed realistic Nigerian demo data — real-sounding names, believable complaint categories, plausible announcement content and event names. This is what makes the demo feel real, not generic Lorem Ipsum.
- Click through every path yourself, twice. Add empty states, loading states, and error states for every screen — no blank white pages, no silently-failing buttons.

**Documentation (Days 54–56)**
Build a README that includes:
- What the app does, and who it's for
- Stack: React + Vite, PostgreSQL via Supabase, Vercel
- Setup instructions (env vars, running locally)
- Screenshots of each core screen
- **ER diagram** — tables and their foreign-key relationships (draw this from the Section 4 schema in the master brief; it's the single clearest piece of evidence for the database requirement)
- The sample SQL queries from Phases 2–4, with screenshots of their real output run against the seeded data
- A short note on how RLS policies serve as the RBAC approach
- A **"V2 Roadmap"** section explicitly listing what was cut: clubs directory, deals, global search, multi-channel notifications, CMS handbook, offline/PWA support, audit logs, custom RBAC engine, multi-tenancy prep. This shows deliberate scoping, not a missed feature.

**Buffer (Days 57–60)**
- Reserved for the inevitable slip from earlier phases. Do not schedule new work here — if everything above finished on time, use this window to re-test rather than add scope.

## Exit Criteria
A stranger can read the README, understand the app in two minutes, and every screen they click through behaves exactly as documented. The ER diagram and query screenshots are present and match the live schema.
