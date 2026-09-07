-- Union — real, verifiable student deals (global programs any accredited
-- student can redeem individually with a valid student email/ID, not
-- locally-negotiated ones we can't verify). Sourced directly from each
-- provider's own site, checked at time of writing.
--
-- Deliberately excluded: Amazon Prime Student (US address required, not
-- usable from Nigeria) and Canva Campus (requires the institution itself
-- to be registered with Canva — not something an individual student can
-- self-serve, unlike the four below).
--
-- The existing local-merchant deals (Mama Put Kitchen, QuickPrint Hub,
-- etc.) are left untouched — they're clearly fictional demo businesses,
-- not claimed as real, and stay that way until there's an actual
-- negotiated partnership to replace them with.
-- Run after 018_real_lasu_data.sql.

do $$
declare
  v_tenant_id uuid;
  v_author_id uuid;
begin
  select id into v_tenant_id from tenants where slug = 'demo-university';
  select id into v_author_id from users where tenant_id = v_tenant_id and is_verified = true order by created_at limit 1;

  if v_tenant_id is null or v_author_id is null then
    raise notice 'Skipping real student deals seed — no verified user found yet.';
    return;
  end if;

  insert into deals (tenant_id, merchant_name, category, status, description, discount_summary, eligibility, redemption_instructions, external_url, author_id)
  values
    (
      v_tenant_id, 'GitHub Student Developer Pack', 'technology', 'published',
      'A bundle of free developer tools and cloud credits for verified students — GitHub Pro, a free JetBrains license, DigitalOcean and Azure credits, and dozens of other partner offers.',
      'Free access to 70+ developer tools and services',
      'Enrolled in a degree- or diploma-granting course of study, age 13+. No .edu email required — a student ID photo or enrollment letter also works.',
      'Apply at the link below with your school email or a photo of your student ID. Approval typically takes up to 72 hours.',
      'https://education.github.com/pack',
      v_author_id
    ),
    (
      v_tenant_id, 'Spotify Premium for Students', 'entertainment', 'published',
      'Discounted Spotify Premium for students at an accredited higher-education institution, verified through SheerID.',
      '₦800/month after a free first month (vs. full price)',
      'Enrolled at an accredited college or university. Verified annually, for up to 4 years.',
      'Sign up at the link below and verify your student status via your school portal login or proof of enrollment.',
      'https://www.spotify.com/ng/student/',
      v_author_id
    ),
    (
      v_tenant_id, 'Notion Education Plan', 'technology', 'published',
      'Notion''s paid "Plus" plan — unlimited pages, file uploads, and 30-day version history — free for students at accredited institutions.',
      'Notion Plus, free (normally a paid plan)',
      'Individual student at a college or university listed in the World Higher Education Database (WHED).',
      'Sign up with your school email, then go to Settings → Upgrade plan → Get free education plan.',
      'https://www.notion.com/help/notion-for-education',
      v_author_id
    ),
    (
      v_tenant_id, 'Microsoft 365 Education', 'technology', 'published',
      'Word, Excel, PowerPoint, Outlook, and cloud storage at no cost for students at participating institutions.',
      'Free access to Word, Excel, PowerPoint & more',
      'Actively enrolled student with a valid school-issued email address, at an institution registered with Microsoft''s education program.',
      'Sign up with your school email at the link below and complete the eligibility check — usually instant.',
      'https://www.microsoft.com/en-us/education/products/office',
      v_author_id
    )
  on conflict do nothing;
end $$;
