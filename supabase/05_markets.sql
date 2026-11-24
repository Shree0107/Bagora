-- =============================================================================
-- VÉRANE — 05_markets.sql
-- France (EUR, Stripe) + India (INR, Razorpay) markets.
-- Run AFTER 01–04, BEFORE deploying the code that uses it. Safe to re-run.
--
-- Adds:
--   * per-market product prices (EUR in price_cents, INR in price_inr_paise)
--   * optional French product/category names and descriptions
--   * market, currency, tax, shipping method, payment provider/status/method
--     and a checkout idempotency key on orders
--   * a trigger that locks market/currency (always) and amounts/address
--     (after payment)
--   * confirm_order_payment(): one idempotent, amount-checked payment
--     confirmation used by both Stripe and Razorpay (replaces mark_order_paid)
--   * a small database-backed rate limiter for checkout/payment endpoints
-- All amounts are integers in the currency's minor unit (cents / paise).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.market as enum ('fr', 'in');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_status as enum ('pending', 'paid', 'failed', 'cancelled', 'refunded');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Products & categories
-- ---------------------------------------------------------------------------
alter table public.products
  add column if not exists price_inr_paise integer check (price_inr_paise is null or price_inr_paise >= 0),
  add column if not exists name_fr         text,
  add column if not exists description_fr  text;

comment on column public.products.price_cents     is 'France price in EUR cents (VAT included).';
comment on column public.products.price_inr_paise is 'India price in INR paise (GST included). NULL = not sold in India.';

alter table public.categories
  add column if not exists name_fr        text,
  add column if not exists description_fr text;

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------
alter table public.orders
  add column if not exists market             public.market not null default 'fr',
  add column if not exists language           text not null default 'en' check (language in ('en', 'fr')),
  add column if not exists payment_provider   text check (payment_provider in ('stripe', 'razorpay')),
  add column if not exists payment_status     public.payment_status not null default 'pending',
  add column if not exists payment_method     text,
  add column if not exists tax_cents          integer not null default 0 check (tax_cents >= 0),
  add column if not exists prices_include_tax boolean not null default true,
  add column if not exists shipping_method    text,
  add column if not exists razorpay_order_id  text unique,
  add column if not exists razorpay_payment_id text,
  add column if not exists checkout_key       uuid;

comment on column public.orders.subtotal_cents is 'Minor units of orders.currency (cents for EUR, paise for INR).';
comment on column public.orders.tax_cents      is 'Tax included in total (VAT/GST), minor units.';

-- Back-fill existing (pre-market) orders: they were all Stripe / EUR / France.
update public.orders set payment_provider = 'stripe'
  where payment_provider is null and stripe_session_id is not null;
update public.orders set payment_status = 'paid'
  where payment_status = 'pending' and status in ('paid', 'shipped', 'delivered');
update public.orders set payment_status = 'cancelled'
  where payment_status = 'pending' and status = 'cancelled';

do $$ begin
  alter table public.orders add constraint orders_market_currency_check
    check ((market = 'fr' and currency = 'eur') or (market = 'in' and currency = 'inr'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.orders add constraint orders_market_provider_check
    check (payment_provider is null
        or (market = 'fr' and payment_provider = 'stripe')
        or (market = 'in' and payment_provider = 'razorpay'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.orders add constraint orders_total_check
    check (total_cents = subtotal_cents + shipping_cents);
exception when duplicate_object then null; end $$;

-- One order per checkout attempt (stops double-click duplicates).
create unique index if not exists orders_user_checkout_key_idx
  on public.orders (user_id, checkout_key) where checkout_key is not null;
create index if not exists orders_market_created_idx on public.orders (market, created_at desc);

-- ---------------------------------------------------------------------------
-- Lock order fields
--   * market and currency can never change
--   * after payment: amounts, address and owner can never change
--   * fulfilment statuses (paid/shipped/delivered) require a confirmed payment
-- Refunds/adjustments must be done in the payment provider + a new process.
-- ---------------------------------------------------------------------------
create or replace function public.protect_order_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.market is distinct from old.market or new.currency is distinct from old.currency then
    raise exception 'An order''s market and currency cannot be changed';
  end if;

  if old.payment_status = 'paid' then
    if new.subtotal_cents   is distinct from old.subtotal_cents
    or new.shipping_cents   is distinct from old.shipping_cents
    or new.tax_cents        is distinct from old.tax_cents
    or new.total_cents      is distinct from old.total_cents
    or new.shipping_address is distinct from old.shipping_address
    or new.user_id          is distinct from old.user_id then
      raise exception 'Paid orders cannot change amounts, address or customer. Use a refund/adjustment process.';
    end if;
    if new.payment_status not in ('paid', 'refunded') then
      raise exception 'A paid order can only become refunded';
    end if;
  end if;

  if new.status in ('paid', 'shipped', 'delivered') and new.payment_status <> 'paid' then
    raise exception 'Order % has no confirmed payment', old.id;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_order_fields on public.orders;
create trigger protect_order_fields before update on public.orders
  for each row execute function public.protect_order_fields();

-- Admins (authenticated role) may only change the fulfilment status column.
revoke update on public.orders from authenticated;
grant update (status) on public.orders to authenticated;

-- ---------------------------------------------------------------------------
-- confirm_order_payment(): called by the server (secret key) after a payment
-- has been verified with Stripe or Razorpay. In ONE transaction it checks the
-- provider, amount and currency against the order, marks it paid, reduces
-- stock and removes the bought items from the customer's saved cart.
-- Returns false (no changes) if the order was already paid.
-- A payment that arrives for an expired/cancelled order is still honoured
-- (money was taken), as long as the amount matches.
-- ---------------------------------------------------------------------------
create or replace function public.confirm_order_payment(
  p_order_id       uuid,
  p_provider       text,
  p_amount         integer,
  p_currency       text,
  p_payment_ref    text,
  p_payment_method text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Order % not found', p_order_id;
  end if;

  if v_order.payment_status = 'paid' then
    return false;
  end if;

  if v_order.payment_provider is distinct from p_provider then
    raise exception 'Payment provider mismatch for order %', p_order_id;
  end if;

  if v_order.total_cents <> p_amount or lower(v_order.currency) <> lower(p_currency) then
    raise exception 'Amount/currency mismatch for order %', p_order_id;
  end if;

  update public.orders
  set status                   = 'paid',
      payment_status           = 'paid',
      paid_at                  = now(),
      payment_method           = p_payment_method,
      stripe_payment_intent_id = case when p_provider = 'stripe'   then p_payment_ref else stripe_payment_intent_id end,
      razorpay_payment_id      = case when p_provider = 'razorpay' then p_payment_ref else razorpay_payment_id end
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

  if v_order.user_id is not null then
    delete from public.cart_items c
    using public.order_items oi
    where oi.order_id = p_order_id
      and c.user_id = v_order.user_id
      and c.product_id = oi.product_id;
  end if;

  return true;
end;
$$;

revoke execute on function public.confirm_order_payment(uuid, text, integer, text, text, text) from public, anon, authenticated;
grant  execute on function public.confirm_order_payment(uuid, text, integer, text, text, text) to service_role;

-- Superseded by confirm_order_payment().
drop function if exists public.mark_order_paid(uuid, text, text, jsonb);

-- ---------------------------------------------------------------------------
-- Rate limiting (fixed window). Only the server (secret key) can use it.
-- Keys contain user ids, never personal data.
-- ---------------------------------------------------------------------------
create table if not exists public.rate_limits (
  key          text primary key,
  window_start timestamptz not null,
  hits         integer not null
);
alter table public.rate_limits enable row level security;   -- no policies: not readable by clients
grant all on public.rate_limits to service_role;

create or replace function public.hit_rate_limit(p_key text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hits integer;
begin
  insert into public.rate_limits as r (key, window_start, hits)
  values (p_key, now(), 1)
  on conflict (key) do update
  set hits         = case when r.window_start < now() - make_interval(secs => p_window_seconds) then 1 else r.hits + 1 end,
      window_start = case when r.window_start < now() - make_interval(secs => p_window_seconds) then now() else r.window_start end
  returning hits into v_hits;

  -- Occasional cleanup of old windows.
  if random() < 0.01 then
    delete from public.rate_limits where window_start < now() - interval '1 day';
  end if;

  return v_hits <= p_limit;
end;
$$;

revoke execute on function public.hit_rate_limit(text, integer, integer) from public, anon, authenticated;
grant  execute on function public.hit_rate_limit(text, integer, integer) to service_role;

-- ---------------------------------------------------------------------------
-- Sample data: INR prices + French texts for the 6 sample products.
-- ⚠️ INR prices are PLACEHOLDERS — set your real prices in Admin → Products.
-- ---------------------------------------------------------------------------
update public.categories c set name_fr = v.name_fr, description_fr = v.description_fr
from (values
  ('totes',     'Sacs cabas',       'Des cabas spacieux et structurés pour le travail, les voyages et tout le reste.'),
  ('crossbody', 'Sacs bandoulière', 'Mains libres et compacts : l''essentiel, toujours à portée de main.'),
  ('shoulder',  'Sacs portés épaule', 'Des silhouettes souples qui se glissent naturellement sous le bras.')
) as v(slug, name_fr, description_fr)
where c.slug = v.slug and c.name_fr is null;

update public.products p set
  price_inr_paise = coalesce(p.price_inr_paise, v.price_inr_paise),
  name_fr         = coalesce(p.name_fr, v.name_fr),
  description_fr  = coalesce(p.description_fr, v.description_fr)
from (values
  ('heritage-leather-tote', 1599900, 'Cabas Héritage en cuir',
   'Un cabas ouvert intemporel, taillé dans un cuir pleine fleur bordeaux qui se patine magnifiquement avec le temps. Rivets en laiton, étiquette en cuir amovible et longues anses confortables à l''épaule. Accueille un ordinateur 13".'),
  ('buckle-slouch-tote', 1349900, 'Cabas souple à boucles',
   'Un cuir bordeaux souple et brillant, des boucles, une quincaillerie argentée et des poches zippées sur les côtés. Ample et spacieux, avec une bandoulière unique réglable.'),
  ('saddle-crossbody', 999900, 'Sac besace Selle',
   'Une besace compacte en cuir végan cognac, avec rabat à boucle, poche plaquée à l''avant et bandoulière réglable. Votre compagnon de tous les jours.'),
  ('denim-satchel-crossbody', 849900, 'Petit cartable en denim',
   'Le denim délavé rencontre des finitions en cuir chocolat sur ce mini cartable. Deux fermoirs tournants, une poignée et une bandoulière amovible.'),
  ('cherry-charm-shoulder-bag', 1199900, 'Sac épaule Cerise',
   'Un sac épaule arrondi en bordeaux laqué, au plissé délicat, avec quincaillerie dorée et un charmant bijou cerise noué d''un ruban.'),
  ('blush-charm-shoulder-bag', 1249900, 'Sac épaule Poudré',
   'Un sac baguette crème et léger, orné de nœuds rose poudré, de perles et d''une chaîne de breloques dorées. Délicat, petit et fait pour être remarqué.')
) as v(slug, price_inr_paise, name_fr, description_fr)
where p.slug = v.slug;
