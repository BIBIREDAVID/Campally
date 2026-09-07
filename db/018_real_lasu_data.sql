-- Union — real LASU details (E18), scoped to what was actually confirmed
-- against lasu.edu.ng and healthcenter.lasu.edu.ng. Anything not directly
-- confirmed is deliberately left untouched — existing generic placeholders
-- stay rather than being replaced with a guess.
--
-- Renames (not delete+recreate) so existing FK references — seeded
-- students, any future data — keep pointing at the same row.
-- Run after 017_seed_preview_images.sql.

update faculties set name = 'Science' where name = 'Sciences';
update faculties set name = 'Arts' where name = 'Arts & Humanities';
update faculties set name = 'Management Sciences' where name = 'Business Administration';
-- 'Engineering' and 'Social Sciences' already match the real faculty names.

-- Real LASU faculties/schools not yet represented at all. Confirmed via two
-- independent page fetches of lasu.edu.ng's faculty directory.
insert into faculties (tenant_id, name)
select t.id, v.name
from tenants t
cross join (values
  ('Agriculture'),
  ('Allied Health Sciences'),
  ('Basic Medical Sciences'),
  ('Clinical Sciences'),
  ('Computing and Information Technology'),
  ('Dentistry'),
  ('Education'),
  ('Environmental Sciences'),
  ('Law'),
  ('Communications'),
  ('Creativity, Culture and Tourism Studies'),
  ('Library, Archival and Information Science'),
  ('Transport'),
  ('Postgraduate Studies')
) as v(name)
where t.slug = 'demo-university'
  and not exists (
    select 1 from faculties f where f.tenant_id = t.id and f.name = v.name
  );

-- Departments confirmed exact (not truncated) from lasu.edu.ng. Existing
-- Engineering departments are left as-is — the site's department listing
-- for Engineering came back truncated, so guessing exact names would be
-- worse than the current honest placeholder.

insert into departments (tenant_id, faculty_id, name)
select f.tenant_id, f.id, v.name
from faculties f
cross join (values
  ('Botany'), ('Chemistry'), ('Fisheries'), ('Mathematics'), ('Microbiology'),
  ('Science Laboratory and Technology'), ('Zoology and Environmental Biology')
) as v(name)
where f.name = 'Science'
  and not exists (select 1 from departments d where d.faculty_id = f.id and d.name = v.name);

insert into departments (tenant_id, faculty_id, name)
select f.tenant_id, f.id, v.name
from faculties f
cross join (values
  ('Economics'), ('Geography'), ('Political Science'), ('Psychology'), ('Sociology')
) as v(name)
where f.name = 'Social Sciences'
  and not exists (select 1 from departments d where d.faculty_id = f.id and d.name = v.name);

insert into departments (tenant_id, faculty_id, name)
select f.tenant_id, f.id, v.name
from faculties f
-- Site states 9 departments but only 8 were retrievable without
-- truncation — the 9th is deliberately omitted rather than guessed.
cross join (values
  ('Anaesthesia'), ('Behavioural Medicine'), ('Community Health and Primary Health Care'),
  ('Surgery'), ('Medicine'), ('Obstetrics and Gynaecology'),
  ('Paediatrics and Child Health'), ('Nursing')
) as v(name)
where f.name = 'Clinical Sciences'
  and not exists (select 1 from departments d where d.faculty_id = f.id and d.name = v.name);

-- Real Health Centre details, from healthcenter.lasu.edu.ng.
update campus_content
set body = 'The LASU Health Centre operates 24 hours a day, with emergency services available every day of the week. It is located at the Main Campus, Badagry Expressway, Ojo, Lagos, and includes a 40-bed facility with a mini ICU and three ambulances covering multiple campuses.' || E'\n\n'
  || 'Working-hours line: +234 703 148 2984' || E'\n'
  || 'Emergency line (24/7): +234 703 148 2778' || E'\n'
  || 'Email: director.healthservices@lasu.edu.ng'
where title = 'What are the health centre''s opening hours?';
