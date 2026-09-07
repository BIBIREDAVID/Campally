-- Union — demo seed data (fictional university, per product principle:
-- never impersonate a real institution). Run after 001 and 002.

do $$
declare
  v_tenant_id uuid;
  v_eng uuid;
  v_sci uuid;
begin
  select id into v_tenant_id from tenants where slug = 'demo-university';

  insert into faculties (tenant_id, name) values
    (v_tenant_id, 'Engineering'),
    (v_tenant_id, 'Sciences'),
    (v_tenant_id, 'Social Sciences'),
    (v_tenant_id, 'Arts & Humanities'),
    (v_tenant_id, 'Business Administration');

  select id into v_eng from faculties where tenant_id = v_tenant_id and name = 'Engineering';
  select id into v_sci from faculties where tenant_id = v_tenant_id and name = 'Sciences';

  insert into departments (tenant_id, faculty_id, name) values
    (v_tenant_id, v_eng, 'Electrical Engineering'),
    (v_tenant_id, v_eng, 'Civil Engineering'),
    (v_tenant_id, v_eng, 'Mechanical Engineering'),
    (v_tenant_id, v_sci, 'Computer Science'),
    (v_tenant_id, v_sci, 'Biochemistry'),
    (v_tenant_id, v_sci, 'Physics');

  insert into academic_levels (tenant_id, name, sort_order) values
    (v_tenant_id, '100 Level', 1),
    (v_tenant_id, '200 Level', 2),
    (v_tenant_id, '300 Level', 3),
    (v_tenant_id, '400 Level', 4),
    (v_tenant_id, '500 Level', 5);

  insert into case_categories (tenant_id, name, description, is_sensitive) values
    (v_tenant_id, 'Facilities', 'Broken infrastructure, lighting, general upkeep', false),
    (v_tenant_id, 'Accommodation', 'Hostel and housing issues', false),
    (v_tenant_id, 'Academic Administration', 'Timetables, registration, results', false),
    (v_tenant_id, 'Security', 'Campus safety concerns', false),
    (v_tenant_id, 'Sanitation', 'Waste, water, cleanliness', false),
    (v_tenant_id, 'Electricity', 'Power supply issues', false),
    (v_tenant_id, 'Water Supply', 'Water availability issues', false),
    (v_tenant_id, 'Welfare', 'Personal welfare and support concerns', true),
    (v_tenant_id, 'Student Services', 'General student service requests', false),
    (v_tenant_id, 'General / Suggestion', 'Anything else, or a suggestion', false);
end $$;
