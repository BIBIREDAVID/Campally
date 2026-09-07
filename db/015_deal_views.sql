-- Union — deal view counts, for the reports screen and merchant renewal
-- conversations ("is this deal actually landing?").
-- Run after 014_search.sql.

alter table deals add column if not exists views int not null default 0;

-- Incrementing views is the one write a plain student can make on a table
-- they can otherwise only read — scoped to just that column, and only on
-- a deal they're already allowed to see.
create or replace function increment_deal_views(deal_id uuid) returns void as $$
  update deals set views = views + 1 where id = deal_id and status = 'published';
$$ language sql security definer set search_path = public;
