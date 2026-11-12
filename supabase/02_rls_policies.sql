-- =============================================================================
-- Bagora — 02_rls_policies.sql
-- Row Level Security on EVERY table. Run AFTER 01_schema.sql.
-- Safe to re-run (policies are dropped and re-created).
--
-- Summary
--   profiles        : users read/update their own row; admins read all
--   categories      : everyone reads; admins write
--   products        : everyone reads ACTIVE products; admins read all + write
--   product_images  : readable when the product is readable; admins write
--   cart_items      : users fully manage their own rows only
--   orders          : users read their own; admins read all + update status
--   order_items     : readable with the parent order
--   Orders/order items have NO insert policy: they are created only by the
--   server with the secret key (which bypasses RLS) after price checks.
-- =============================================================================

alter table public.profiles       enable row level security;
alter table public.categories     enable row level security;
alter table public.products       enable row level security;
alter table public.product_images enable row level security;
alter table public.cart_items     enable row level security;
alter table public.orders         enable row level security;
alter table public.order_items    enable row level security;

-- Table privileges (RLS still decides which ROWS are visible).
grant usage on schema public to anon, authenticated;
grant select on public.categories, public.products, public.product_images to anon, authenticated;
grant insert, update, delete on public.categories, public.products, public.product_images to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.cart_items to authenticated;
grant select, update on public.orders to authenticated;
grant select on public.order_items to authenticated;
grant all on all tables in schema public to service_role;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
-- (role changes are blocked by the protect_profile_role trigger)

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
drop policy if exists "categories_select_all" on public.categories;
create policy "categories_select_all" on public.categories
  for select to anon, authenticated
  using (true);

drop policy if exists "categories_admin_insert" on public.categories;
create policy "categories_admin_insert" on public.categories
  for insert to authenticated with check ((select public.is_admin()));

drop policy if exists "categories_admin_update" on public.categories;
create policy "categories_admin_update" on public.categories
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "categories_admin_delete" on public.categories;
create policy "categories_admin_delete" on public.categories
  for delete to authenticated using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------
drop policy if exists "products_select_active_or_admin" on public.products;
create policy "products_select_active_or_admin" on public.products
  for select to anon, authenticated
  using (is_active or (select public.is_admin()));

drop policy if exists "products_admin_insert" on public.products;
create policy "products_admin_insert" on public.products
  for insert to authenticated with check ((select public.is_admin()));

drop policy if exists "products_admin_update" on public.products;
create policy "products_admin_update" on public.products
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "products_admin_delete" on public.products;
create policy "products_admin_delete" on public.products
  for delete to authenticated using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- product_images
-- ---------------------------------------------------------------------------
drop policy if exists "product_images_select_visible" on public.product_images;
create policy "product_images_select_visible" on public.product_images
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id and (p.is_active or (select public.is_admin()))
    )
  );

drop policy if exists "product_images_admin_insert" on public.product_images;
create policy "product_images_admin_insert" on public.product_images
  for insert to authenticated with check ((select public.is_admin()));

drop policy if exists "product_images_admin_update" on public.product_images;
create policy "product_images_admin_update" on public.product_images
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "product_images_admin_delete" on public.product_images;
create policy "product_images_admin_delete" on public.product_images
  for delete to authenticated using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- cart_items (own rows only)
-- ---------------------------------------------------------------------------
drop policy if exists "cart_select_own" on public.cart_items;
create policy "cart_select_own" on public.cart_items
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "cart_insert_own" on public.cart_items;
create policy "cart_insert_own" on public.cart_items
  for insert to authenticated with check (user_id = (select auth.uid()));

drop policy if exists "cart_update_own" on public.cart_items;
create policy "cart_update_own" on public.cart_items
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "cart_delete_own" on public.cart_items;
create policy "cart_delete_own" on public.cart_items
  for delete to authenticated using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------
drop policy if exists "orders_select_own_or_admin" on public.orders;
create policy "orders_select_own_or_admin" on public.orders
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "orders_admin_update" on public.orders;
create policy "orders_admin_update" on public.orders
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- order_items
-- ---------------------------------------------------------------------------
drop policy if exists "order_items_select_own_or_admin" on public.order_items;
create policy "order_items_select_own_or_admin" on public.order_items
  for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.user_id = (select auth.uid()) or (select public.is_admin()))
    )
  );

-- =============================================================================
-- Optional sanity checks (run separately after everything is set up):
--
--   -- Every table should show rowsecurity = true
--   select tablename, rowsecurity from pg_tables where schemaname = 'public';
--
--   -- List all policies
--   select tablename, policyname, cmd, roles from pg_policies where schemaname = 'public';
--
--   -- Simulate an anonymous visitor: should see only active products, no orders
--   set role anon;
--   select count(*) from public.products;
--   select count(*) from public.orders;   -- error: permission denied (expected)
--   reset role;
-- =============================================================================
