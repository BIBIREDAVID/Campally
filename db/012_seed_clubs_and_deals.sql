-- Union — demo seed data for Clubs and Deals
-- Run after 011_deals.sql. No demo users are pre-seeded (accounts come from
-- real Supabase Auth sign-ups), so this picks whichever verified user
-- exists first as the nominal author — if none exist yet, it does nothing
-- rather than fail, and can simply be re-run after your first sign-up.

do $$
declare
  v_tenant_id uuid;
  v_author_id uuid;
begin
  select id into v_tenant_id from tenants where slug = 'demo-university';
  select id into v_author_id from users where tenant_id = v_tenant_id and is_verified = true order by created_at limit 1;

  if v_tenant_id is null or v_author_id is null then
    raise notice 'Skipping clubs/deals seed — no verified user found yet. Sign up, then re-run this file.';
    return;
  end if;

  insert into clubs (tenant_id, name, category, status, description, contact_email, social_links, executives, membership_mode, author_id)
  values
    (v_tenant_id, 'Computer Science Society', 'academic', 'published', 'For students in Computer Science and related programmes — hosts hackathons, tech talks, and coding workshops throughout the session.', 'css@demo-union.edu.ng', '{"instagram":"@css_demo"}', '[{"name":"Adaeze Okonkwo","title":"President"},{"name":"Tunde Bakare","title":"Vice President"}]', 'open', v_author_id),
    (v_tenant_id, 'Engineering Students Association', 'faculty_society', 'published', 'The umbrella association for all engineering departments — represents student interests and organises the annual Engineering Week.', 'esa@demo-union.edu.ng', '{}', '[{"name":"Ifeoma Chukwu","title":"President"}]', 'open', v_author_id),
    (v_tenant_id, 'Entrepreneurship Club', 'entrepreneurship', 'published', 'For students building side hustles and startups — pitch nights, mentorship pairing, and a termly business plan competition.', 'entrepreneurship@demo-union.edu.ng', '{"instagram":"@edemo_club","website":"https://example.com"}', '[{"name":"Chinedu Eze","title":"President"},{"name":"Bola Adigun","title":"Treasurer"}]', 'request', v_author_id),
    (v_tenant_id, 'Debate Society', 'debate', 'published', 'Competitive and social debating — weekly practice sessions and representation at inter-university debate championships.', 'debate@demo-union.edu.ng', '{}', '[{"name":"Fatima Yusuf","title":"President"}]', 'open', v_author_id),
    (v_tenant_id, 'Photography Club', 'arts', 'published', 'Campus photographers documenting student life — gear-share sessions, photo walks, and an end-of-session exhibition.', 'photo@demo-union.edu.ng', '{"instagram":"@demo_photog"}', '[{"name":"Emeka Nwosu","title":"Coordinator"}]', 'open', v_author_id),
    (v_tenant_id, 'Football Club', 'sports', 'published', 'Trains three times a week and represents the university in inter-faculty and inter-university competitions.', 'football@demo-union.edu.ng', '{}', '[{"name":"Segun Ajayi","title":"Captain"}]', 'request', v_author_id),
    (v_tenant_id, 'Women in Technology', 'academic', 'published', 'Supporting women in STEM through mentorship, skills workshops, and networking with alumnae in tech careers.', 'wit@demo-union.edu.ng', '{"instagram":"@wit_demo"}', '[{"name":"Amaka Obi","title":"Lead"}]', 'open', v_author_id),
    (v_tenant_id, 'Volunteer Network', 'volunteering', 'published', 'Coordinates student volunteering for campus and community outreach — blood drives, literacy outreach, and clean-up days.', 'volunteer@demo-union.edu.ng', '{}', '[{"name":"David Okafor","title":"Coordinator"}]', 'open', v_author_id)
  on conflict do nothing;

  insert into deals (tenant_id, merchant_name, category, status, description, discount_summary, eligibility, promo_code, redemption_instructions, locations, expires_at, terms, author_id)
  values
    (v_tenant_id, 'Mama Put Kitchen', 'restaurants', 'published', 'Home-style Nigerian meals just off campus — a student favourite for lunch between lectures.', '10% off all meals', 'Valid student ID required.', 'STUDENT10', 'Show your student ID at checkout.', 'Opposite Main Gate', current_date + interval '90 days', 'One redemption per student per visit.', v_author_id),
    (v_tenant_id, 'QuickPrint Hub', 'printing', 'published', 'Printing, binding, and photocopying services for assignments, projects, and theses.', '15% off printing and binding', 'Valid student ID required.', 'QPRINT15', 'Mention the discount when placing your order.', 'Student Centre, Ground Floor', current_date + interval '90 days', 'Cannot be combined with other offers.', v_author_id),
    (v_tenant_id, 'Campus Bites Delivery', 'food_delivery', 'published', 'Food delivery service covering all campus hostels and faculty buildings.', 'Free delivery on orders over ₦2,000', 'Valid student ID required.', 'FREEDROP', 'Apply code at checkout in the app.', 'Campus-wide delivery', current_date + interval '90 days', 'One use per student per week.', v_author_id),
    (v_tenant_id, 'FitZone Gym', 'gyms', 'published', 'Fully equipped gym with group classes, five minutes from the Female Hostel block.', '20% off monthly membership', 'Valid student ID required.', 'FITZONE20', 'Bring your student ID to reception to redeem.', 'Behind Hostel Block D', current_date + interval '90 days', 'New members only.', v_author_id),
    (v_tenant_id, 'BookNest', 'bookstores', 'published', 'Textbooks, stationery, and past exam question banks for most faculties.', '10% off textbooks', 'Valid student ID required.', null, 'Discount applied automatically for students at checkout.', 'Along Library Road', current_date + interval '90 days', null, v_author_id),
    (v_tenant_id, 'Naija Data Plug', 'telecom_data', 'published', 'Affordable data bundles and airtime, with a dedicated student support line.', '5% bonus data on all bundles', 'Valid student ID required.', 'DATAPLUG5', 'Use the promo code when purchasing via their USSD or app.', 'Online / USSD', current_date + interval '90 days', null, v_author_id),
    (v_tenant_id, 'Threads & Co', 'fashion', 'published', 'Casual and corporate wear popular for interviews, project defences, and convocation.', '₦1,000 off purchases over ₦8,000', 'Valid student ID required.', 'THREADS1K', 'Show your student ID in-store.', 'Shopping Complex, Shop 12', current_date + interval '90 days', null, v_author_id)
  on conflict do nothing;
end $$;
