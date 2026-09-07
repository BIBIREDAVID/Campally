-- Union — Deals & Student Benefits module
-- Run after 010_clubs.sql.

create table deals (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  merchant_name text not null,
  logo_url text,
  category text not null check (category in
    ('restaurants', 'cafes', 'food_delivery', 'supermarkets', 'printing', 'bookstores',
     'transport', 'gyms', 'fashion', 'entertainment', 'telecom_data', 'technology', 'health_wellness')),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  description text not null,
  discount_summary text not null,
  eligibility text,
  promo_code text,
  redemption_instructions text,
  locations text,
  starts_at date,
  expires_at date,
  terms text,
  contact_info text,
  external_url text,
  author_id uuid not null references users(id),
  last_edited_by uuid references users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index deals_status_idx on deals(status);
create index deals_category_idx on deals(category);
create index deals_expires_idx on deals(expires_at);

create table deal_favourites (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references deals(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz default now(),
  unique (deal_id, user_id)
);

create index deal_favourites_deal_idx on deal_favourites(deal_id);
create index deal_favourites_user_idx on deal_favourites(user_id);

insert into permissions (key, description) values
  ('deals.manage', 'Create and manage student deals and benefits')
on conflict (key) do nothing;

insert into role_permissions (role_id, permission_id)
select r.id, p.id from roles r join permissions p on p.key = 'deals.manage'
where r.name = 'Super Admin'
on conflict do nothing;

alter table deals enable row level security;
alter table deal_favourites enable row level security;

-- A deal is "live" for students once published, and stays visible only
-- while unexpired — expiry is a plain date comparison, not a cron job, so
-- an expired deal disappears from student view the moment its date passes
-- without any admin or background action required.
create policy deals_select on deals
  for select using (
    (status = 'published' and (expires_at is null or expires_at >= current_date))
    or has_permission('deals.manage')
  );

create policy deals_manage on deals
  for all using (has_permission('deals.manage'))
  with check (has_permission('deals.manage'));

create policy deal_favourites_select on deal_favourites
  for select using (user_id = app_user_id() or has_permission('deals.manage'));

create policy deal_favourites_insert_own on deal_favourites
  for insert with check (user_id = app_user_id());

create policy deal_favourites_delete_own on deal_favourites
  for delete using (user_id = app_user_id());

insert into storage.buckets (id, name, public)
values ('deal-images', 'deal-images', true)
on conflict (id) do nothing;

drop policy if exists deal_images_select on storage.objects;
create policy deal_images_select on storage.objects
  for select using (bucket_id = 'deal-images');

drop policy if exists deal_images_insert on storage.objects;
create policy deal_images_insert on storage.objects
  for insert with check (bucket_id = 'deal-images' and has_permission('deals.manage'));
