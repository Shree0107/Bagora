-- =============================================================================
-- Bagora — 01_schema.sql
-- Tables, indexes, helper functions and triggers.
-- Run this FIRST in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query).
-- Safe to re-run: objects are created only if they don't exist / replaced.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('customer', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.order_status as enum ('pending', 'paid', 'shipped', 'delivered', 'cancelled');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- One profile per auth user (created automatically by a trigger below).
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  full_name   text,
  role        public.user_role not null default 'customer',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.categories (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  slug         text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description  text not null default '',
  image_url    text,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);

create table if not exists public.products (
  id           uuid primary key default gen_random_uuid(),
  category_id  uuid not null references public.categories (id) on delete restrict,
  name         text not null,
  slug         text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description  text not null default '',
  price_cents  integer not null check (price_cents >= 0),   -- EUR cents (12900 = €129.00)
  stock        integer not null default 0 check (stock >= 0),
  is_active    boolean not null default true,                -- hidden from the shop when false
  is_featured  boolean not null default false,               -- shown on the home page
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.product_images (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products (id) on delete cascade,
  url         text not null,          -- "/products/x.jpg" (served by the app) or a Storage public URL
  alt         text not null default '',
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

-- Cart of a logged-in user (guests keep their cart in the browser).
create table if not exists public.cart_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  product_id  uuid not null references public.products (id) on delete cascade,
  quantity    integer not null check (quantity between 1 and 99),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, product_id)
);

-- Orders are created ONLY by the server (secret key) at checkout.
-- user_id is always set by the app; it becomes NULL only if the user account is
-- deleted later, so the order record is kept for bookkeeping.
create table if not exists public.orders (
  id                        uuid primary key default gen_random_uuid(),
  user_id                   uuid references auth.users (id) on delete set null,
  email                     text not null,
  status                    public.order_status not null default 'pending',
  subtotal_cents            integer not null check (subtotal_cents >= 0),
  shipping_cents            integer not null default 0 check (shipping_cents >= 0),
  total_cents               integer not null check (total_cents >= 0),
  currency                  text not null default 'eur',
  stripe_session_id         text unique,
  stripe_payment_intent_id  text,
  shipping_address          jsonb,     -- { name, address: { line1, city, ... } } from Stripe
  paid_at                   timestamptz,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

-- Snapshot of each purchased product (name + price at the time of purchase).
create table if not exists public.order_items (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null references public.orders (id) on delete cascade,
  product_id        uuid references public.products (id) on delete set null,
  product_name      text not null,
  product_slug      text,
  image_url         text,
  unit_price_cents  integer not null check (unit_price_cents >= 0),
  quantity          integer not null check (quantity > 0),
  created_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes (foreign keys + common filters/sorts)
-- ---------------------------------------------------------------------------
create index if not exists products_category_active_idx on public.products (category_id, is_active);
create index if not exists products_created_at_idx      on public.products (created_at desc);
create index if not exists products_featured_idx        on public.products (is_featured) where is_featured;
create index if not exists product_images_product_idx   on public.product_images (product_id, sort_order);
create index if not exists cart_items_user_idx          on public.cart_items (user_id);
create index if not exists cart_items_product_idx       on public.cart_items (product_id);
create index if not exists orders_user_created_idx      on public.orders (user_id, created_at desc);
create index if not exists orders_status_idx            on public.orders (status);
create index if not exists order_items_order_idx        on public.order_items (order_id);
create index if not exists order_items_product_idx      on public.order_items (product_id);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.profiles;
create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.products;
create trigger set_updated_at before update on public.products
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.cart_items;
create trigger set_updated_at before update on public.cart_items
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.orders;
create trigger set_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Auto-create a profile when someone signs up
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, coalesce(new.email, ''), new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Users must not be able to make themselves admin.
-- Only the SQL Editor (postgres) or the server secret key (service_role)
-- may change profiles.role.
-- ---------------------------------------------------------------------------
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.role is distinct from old.role and current_user in ('authenticated', 'anon') then
    raise exception 'You are not allowed to change the role of a profile';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role before update on public.profiles
  for each row execute function public.protect_profile_role();

-- ---------------------------------------------------------------------------
-- is_admin(): used by RLS policies. SECURITY DEFINER so it can read profiles
-- without recursively triggering the profiles RLS policies.
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- mark_order_paid(): called by the Stripe webhook (server secret key only).
-- In ONE transaction: marks the order paid, reduces stock and removes the
-- purchased products from the user's saved cart.
-- Idempotent: returns false (and does nothing) if the order is not pending,
-- so Stripe retrying the same event never reduces stock twice.
-- ---------------------------------------------------------------------------
create or replace function public.mark_order_paid(
  p_order_id        uuid,
  p_session_id      text,
  p_payment_intent  text,
  p_shipping        jsonb
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status  public.order_status;
  v_user_id uuid;
begin
  select status, user_id into v_status, v_user_id
  from public.orders
  where id = p_order_id
  for update;                         -- lock the row against concurrent webhooks

  if not found then
    raise exception 'Order % not found', p_order_id;
  end if;

  if v_status <> 'pending' then
    return false;                     -- already handled
  end if;

  update public.orders
  set status                   = 'paid',
      paid_at                  = now(),
      stripe_session_id        = coalesce(stripe_session_id, p_session_id),
      stripe_payment_intent_id = p_payment_intent,
      shipping_address         = p_shipping
  where id = p_order_id;

  update public.products p
  set stock = greatest(p.stock - oi.qty, 0)
  from (
    select product_id, sum(quantity)::int as qty
    from public.order_items
    where order_id = p_order_id and product_id is not null
    group by product_id
  ) oi
  where p.id = oi.product_id;

  if v_user_id is not null then
    delete from public.cart_items c
    using public.order_items oi
    where oi.order_id = p_order_id
      and c.user_id = v_user_id
      and c.product_id = oi.product_id;
  end if;

  return true;
end;
$$;

revoke execute on function public.mark_order_paid(uuid, text, text, jsonb) from public, anon, authenticated;
grant  execute on function public.mark_order_paid(uuid, text, text, jsonb) to service_role;
