-- Union — Global search
-- Run after 013_notifications.sql.
--
-- Postgres full-text search across the five student-facing content tables,
-- rather than a separate search service — the brief was explicit that this
-- doesn't justify Elasticsearch at pilot scale. Each table gets a generated
-- tsvector column + GIN index; global_search() unions ranked matches from
-- all five behind one RPC call.

alter table announcements add column if not exists search_vector tsvector
  generated always as (setweight(to_tsvector('english', coalesce(title, '')), 'A') || setweight(to_tsvector('english', coalesce(body, '')), 'B')) stored;
create index if not exists announcements_search_idx on announcements using gin (search_vector);

alter table events add column if not exists search_vector tsvector
  generated always as (setweight(to_tsvector('english', coalesce(title, '')), 'A') || setweight(to_tsvector('english', coalesce(description, '')), 'B')) stored;
create index if not exists events_search_idx on events using gin (search_vector);

alter table clubs add column if not exists search_vector tsvector
  generated always as (setweight(to_tsvector('english', coalesce(name, '')), 'A') || setweight(to_tsvector('english', coalesce(description, '')), 'B')) stored;
create index if not exists clubs_search_idx on clubs using gin (search_vector);

alter table campus_content add column if not exists search_vector tsvector
  generated always as (setweight(to_tsvector('english', coalesce(title, '')), 'A') || setweight(to_tsvector('english', coalesce(body, '')), 'B')) stored;
create index if not exists campus_content_search_idx on campus_content using gin (search_vector);

alter table deals add column if not exists search_vector tsvector
  generated always as (setweight(to_tsvector('english', coalesce(merchant_name, '')), 'A') || setweight(to_tsvector('english', coalesce(description, '') || ' ' || coalesce(discount_summary, '')), 'B')) stored;
create index if not exists deals_search_idx on deals using gin (search_vector);

create or replace function global_search(search_query text, for_tenant uuid)
returns table (
  kind text,
  id uuid,
  title text,
  snippet text,
  url text,
  rank real
) as $$
  select 'news', a.id, a.title, left(a.body, 140), '/news/' || a.id, ts_rank(a.search_vector, websearch_to_tsquery('english', search_query)) as rank
  from announcements a
  where a.tenant_id = for_tenant and a.status = 'published' and a.search_vector @@ websearch_to_tsquery('english', search_query)

  union all

  select 'event', e.id, e.title, left(e.description, 140), '/events/' || e.id, ts_rank(e.search_vector, websearch_to_tsquery('english', search_query))
  from events e
  where e.tenant_id = for_tenant and e.status = 'published' and e.search_vector @@ websearch_to_tsquery('english', search_query)

  union all

  select 'club', c.id, c.name, left(c.description, 140), '/clubs/' || c.id, ts_rank(c.search_vector, websearch_to_tsquery('english', search_query))
  from clubs c
  where c.tenant_id = for_tenant and c.status = 'published' and c.search_vector @@ websearch_to_tsquery('english', search_query)

  union all

  select 'campus', cc.id, cc.title, left(cc.body, 140), '/campus/' || cc.id, ts_rank(cc.search_vector, websearch_to_tsquery('english', search_query))
  from campus_content cc
  where cc.tenant_id = for_tenant and cc.status = 'published' and cc.search_vector @@ websearch_to_tsquery('english', search_query)

  union all

  select 'deal', d.id, d.merchant_name, left(d.description, 140), '/deals/' || d.id, ts_rank(d.search_vector, websearch_to_tsquery('english', search_query))
  from deals d
  where d.tenant_id = for_tenant and d.status = 'published' and d.search_vector @@ websearch_to_tsquery('english', search_query)

  order by rank desc
  limit 30;
$$ language sql stable security invoker set search_path = public;
