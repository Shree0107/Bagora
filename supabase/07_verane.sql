-- =============================================================================
-- VÉRANE — 07_verane.sql
-- India-only relaunch: colour variants, product details, Cash on Delivery,
-- prepaid discount, reviews, newsletter, contact messages, Work Bags category,
-- new sample prices and WebP images.
-- Run AFTER 01–06, in the Supabase SQL Editor. Safe to re-run.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Order status "confirmed" (a Cash-on-Delivery order accepted, not yet paid)
--    (ALTER TYPE ... ADD VALUE must commit before the value is used in data;
--     nothing below writes 'confirmed', only function bodies mention it.)
-- ---------------------------------------------------------------------------
alter type public.order_status add value if not exists 'confirmed' after 'pending';

-- ---------------------------------------------------------------------------
-- 2. Products: INR is the only price; product details for the product page
-- ---------------------------------------------------------------------------
alter table public.products alter column price_cents drop not null;
comment on column public.products.price_cents     is 'Unused since 07_verane.sql (EUR market removed).';
comment on column public.products.price_inr_paise is 'Price in INR paise, GST included (459000 = ₹4,590). NULL = not for sale.';

alter table public.products
  add column if not exists style_ref     text,
  add column if not exists width_cm      numeric(5,1) check (width_cm  is null or width_cm  > 0),
  add column if not exists height_cm     numeric(5,1) check (height_cm is null or height_cm > 0),
  add column if not exists depth_cm      numeric(5,1) check (depth_cm  is null or depth_cm  > 0),
  add column if not exists strap_drop_cm numeric(5,1) check (strap_drop_cm is null or strap_drop_cm > 0),
  add column if not exists weight_g      integer      check (weight_g  is null or weight_g  > 0),
  add column if not exists fits          text[] not null default '{}',
  add column if not exists leather       text,
  add column if not exists hardware      text,
  add column if not exists lining        text;

comment on column public.products.fits is 'What fits inside: any of phone, tablet, laptop-13, laptop-14, laptop-16, bottle, a4.';

-- ---------------------------------------------------------------------------
-- 3. Colour variants (stock lives on the variant)
-- ---------------------------------------------------------------------------
create table if not exists public.product_variants (
  id             uuid primary key default gen_random_uuid(),
  product_id     uuid not null references public.products (id) on delete cascade,
  colour_name    text not null check (length(colour_name) between 1 and 40),
  colour_hex     text not null default '#3B2A20' check (colour_hex ~ '^#[0-9A-Fa-f]{6}$'),
  colour_family  text not null default 'brown'
                 check (colour_family in ('black','brown','tan','burgundy','green','cream','grey','blue','pink','other')),
  sku            text unique,
  stock          integer not null default 0 check (stock >= 0),
  sort_order     integer not null default 0,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (product_id, colour_name)
);
create index if not exists product_variants_product_idx on public.product_variants (product_id, sort_order);
create index if not exists product_variants_family_idx  on public.product_variants (colour_family) where is_active;

drop trigger if exists set_updated_at on public.product_variants;
create trigger set_updated_at before update on public.product_variants
  for each row execute function public.set_updated_at();

-- products.stock is kept as the SUM of active variant stock (used by listings/filters).
create or replace function public.sync_product_stock()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_product uuid := coalesce(new.product_id, old.product_id);
begin
  update public.products p
  set stock = coalesce((select sum(v.stock) from public.product_variants v
                        where v.product_id = v_product and v.is_active), 0)
  where p.id = v_product;
  if tg_op = 'UPDATE' and old.product_id is distinct from new.product_id then
    update public.products p
    set stock = coalesce((select sum(v.stock) from public.product_variants v
                          where v.product_id = old.product_id and v.is_active), 0)
    where p.id = old.product_id;
  end if;
  return null;
end;
$$;

drop trigger if exists sync_product_stock on public.product_variants;
create trigger sync_product_stock after insert or update or delete on public.product_variants
  for each row execute function public.sync_product_stock();

-- One default variant for every product that has none (carries its current stock).
insert into public.product_variants (product_id, colour_name, colour_hex, colour_family, stock, sort_order)
select p.id,
       coalesce(c.colour_name, 'Signature'),
       coalesce(c.colour_hex, '#3B2A20'),
       coalesce(c.colour_family, 'brown'),
       p.stock, 0
from public.products p
left join (values
  ('heritage-leather-tote',     'Bordeaux', '#5E1F24', 'burgundy'),
  ('buckle-slouch-tote',        'Bordeaux', '#5E1F24', 'burgundy'),
  ('saddle-crossbody',          'Cognac',   '#8A4A22', 'tan'),
  ('denim-satchel-crossbody',   'Denim',    '#5B6F8C', 'blue'),
  ('cherry-charm-shoulder-bag', 'Cerise',   '#7A1B22', 'burgundy'),
  ('blush-charm-shoulder-bag',  'Crème',    '#E9DFCF', 'cream'),
  ('city-leather-backpack',     'Noir',     '#1D1A18', 'black')
) as c(slug, colour_name, colour_hex, colour_family) on c.slug = p.slug
where not exists (select 1 from public.product_variants v where v.product_id = p.id);

-- Images can belong to one colour (NULL = shown for every colour).
alter table public.product_images
  add column if not exists variant_id uuid references public.product_variants (id) on delete set null;
create index if not exists product_images_variant_idx on public.product_images (variant_id);

-- ---------------------------------------------------------------------------
-- 4. Cart and order lines point at a variant
-- ---------------------------------------------------------------------------
alter table public.cart_items
  add column if not exists variant_id uuid references public.product_variants (id) on delete cascade;

update public.cart_items c
set variant_id = (select v.id from public.product_variants v
                  where v.product_id = c.product_id order by v.sort_order, v.created_at limit 1)
where c.variant_id is null;
delete from public.cart_items where variant_id is null;
alter table public.cart_items alter column variant_id set not null;

alter table public.cart_items drop constraint if exists cart_items_user_id_product_id_key;
do $$ begin
  alter table public.cart_items add constraint cart_items_user_variant_key unique (user_id, variant_id);
exception when duplicate_object or duplicate_table then null; end $$;
create index if not exists cart_items_variant_idx on public.cart_items (variant_id);

alter table public.order_items
  add column if not exists variant_id  uuid references public.product_variants (id) on delete set null,
  add column if not exists colour_name text;
create index if not exists order_items_variant_idx on public.order_items (variant_id);

-- ---------------------------------------------------------------------------
-- 5. Orders: Cash on Delivery + prepaid discount
-- ---------------------------------------------------------------------------
alter table public.orders
  add column if not exists discount_cents integer not null default 0 check (discount_cents >= 0);
comment on column public.orders.discount_cents is 'Prepaid (online payment) discount in paise, already subtracted from total.';

alter table public.orders drop constraint if exists orders_payment_provider_check;
alter table public.orders drop constraint if exists orders_market_provider_check;
do $$ begin
  alter table public.orders add constraint orders_payment_provider_check
    check (payment_provider is null or payment_provider in ('stripe', 'razorpay', 'cod'));
exception when duplicate_object then null; end $$;

alter table public.orders drop constraint if exists orders_total_check;
do $$ begin
  alter table public.orders add constraint orders_total_check
    check (total_cents = subtotal_cents + shipping_cents - discount_cents);
exception when duplicate_object then null; end $$;

create or replace function public.protect_order_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.market is distinct from old.market or new.currency is distinct from old.currency then
    raise exception 'An order''s market and currency cannot be changed';
  end if;

  -- Paid orders, and accepted COD orders, are locked.
  if old.payment_status = 'paid' or old.status::text in ('confirmed', 'shipped', 'delivered') then
    if new.subtotal_cents   is distinct from old.subtotal_cents
    or new.shipping_cents   is distinct from old.shipping_cents
    or new.discount_cents   is distinct from old.discount_cents
    or new.tax_cents        is distinct from old.tax_cents
    or new.total_cents      is distinct from old.total_cents
    or new.shipping_address is distinct from old.shipping_address
    or new.user_id          is distinct from old.user_id then
      raise exception 'This order is confirmed: amounts, address and customer cannot change.';
    end if;
  end if;

  if old.payment_status = 'paid' and new.payment_status not in ('paid', 'refunded') then
    raise exception 'A paid order can only become refunded';
  end if;

  -- Online orders need a confirmed payment before fulfilment.
  -- COD orders are fulfilled first and paid on delivery.
  if new.payment_provider is distinct from 'cod' then
    if new.status::text in ('paid', 'shipped', 'delivered') and new.payment_status <> 'paid' then
      raise exception 'Order % has no confirmed payment', old.id;
    end if;
  else
    if new.status::text = 'paid' and new.payment_status <> 'paid' then
      raise exception 'COD order % is not collected yet', old.id;
    end if;
    if new.status::text in ('shipped', 'delivered') and old.status::text = 'pending' then
      raise exception 'COD order % must be confirmed before shipping', old.id;
    end if;
  end if;

  return new;
end;
$$;

-- Shared stock + cart step used by both payment paths.
create or replace function public.apply_order_stock(p_order_id uuid, p_strict boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid;
  v_short text;
begin
  select user_id into v_user from public.orders where id = p_order_id;

  -- Quantity per variant. Lines without a variant (older orders) use the
  -- product's first variant.
  if p_strict then
    select string_agg(v.colour_name, ', ') into v_short
    from (
      select s.vid, sum(s.qty)::int as qty
      from (
        select coalesce(oi.variant_id,
                 (select v2.id from public.product_variants v2
                  where v2.product_id = oi.product_id order by v2.sort_order, v2.created_at limit 1)) as vid,
               oi.quantity as qty
        from public.order_items oi
        where oi.order_id = p_order_id
      ) s
      where s.vid is not null
      group by s.vid
    ) q
    join public.product_variants v on v.id = q.vid
    where v.stock < q.qty;
    if v_short is not null then
      raise exception 'insufficient_stock: %', v_short using errcode = 'P0001';
    end if;
  end if;

  -- Online payments (money already taken) never block: stock floors at zero.
  update public.product_variants v
  set stock = greatest(v.stock - q.qty, 0)
  from (
    select s.vid, sum(s.qty)::int as qty
    from (
      select coalesce(oi.variant_id,
               (select v2.id from public.product_variants v2
                where v2.product_id = oi.product_id order by v2.sort_order, v2.created_at limit 1)) as vid,
             oi.quantity as qty
      from public.order_items oi
      where oi.order_id = p_order_id
    ) s
    where s.vid is not null
    group by s.vid
  ) q
  where v.id = q.vid;

  if v_user is not null then
    delete from public.cart_items c
    using public.order_items oi
    where oi.order_id = p_order_id
      and c.user_id = v_user
      and (c.variant_id = oi.variant_id or (oi.variant_id is null and c.product_id = oi.product_id));
  end if;
end;
$$;
revoke execute on function public.apply_order_stock(uuid, boolean) from public, anon, authenticated;

-- Online payment verified (Razorpay; Stripe kept for orders made before the switch).
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
  if v_order.payment_provider is distinct from p_provider or p_provider = 'cod' then
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

  perform public.apply_order_stock(p_order_id, false);
  return true;
end;
$$;
revoke execute on function public.confirm_order_payment(uuid, text, integer, text, text, text) from public, anon, authenticated;
grant  execute on function public.confirm_order_payment(uuid, text, integer, text, text, text) to service_role;

-- Cash on Delivery: accept the order (checks + reserves stock, clears the cart).
create or replace function public.place_cod_order(p_order_id uuid)
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
  if v_order.payment_provider is distinct from 'cod' then
    raise exception 'Order % is not a COD order', p_order_id;
  end if;
  if v_order.status::text <> 'pending' then
    return false;  -- already placed (idempotent)
  end if;

  perform public.apply_order_stock(p_order_id, true);
  update public.orders set status = 'confirmed', payment_method = 'cod' where id = p_order_id;
  return true;
end;
$$;
revoke execute on function public.place_cod_order(uuid) from public, anon, authenticated;
grant  execute on function public.place_cod_order(uuid) to service_role;

-- Cash on Delivery: money collected by the courier.
create or replace function public.mark_cod_collected(p_order_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found or v_order.payment_provider is distinct from 'cod' then
    raise exception 'Order % is not a COD order', p_order_id;
  end if;
  if v_order.payment_status = 'paid' then
    return false;
  end if;
  if v_order.status::text not in ('shipped', 'delivered') then
    raise exception 'COD order % has not been shipped', p_order_id;
  end if;
  update public.orders set payment_status = 'paid', paid_at = now() where id = p_order_id;
  return true;
end;
$$;
revoke execute on function public.mark_cod_collected(uuid) from public, anon, authenticated;
grant  execute on function public.mark_cod_collected(uuid) to service_role;

-- ---------------------------------------------------------------------------
-- 6. Reviews (verified buyers only), newsletter, contact messages
-- ---------------------------------------------------------------------------
create table if not exists public.reviews (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references public.products (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  author_name  text not null check (length(author_name) between 1 and 60),
  rating       smallint not null check (rating between 1 and 5),
  title        text not null default '' check (length(title) <= 120),
  body         text not null check (length(body) between 10 and 2000),
  status       text not null default 'published' check (status in ('published', 'hidden')),
  created_at   timestamptz not null default now(),
  unique (product_id, user_id)
);
create index if not exists reviews_product_idx on public.reviews (product_id, created_at desc) where status = 'published';

-- Has the signed-in customer bought (and paid for / received) this product?
create or replace function public.has_purchased(p_product_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where o.user_id = (select auth.uid())
      and oi.product_id = p_product_id
      and (o.payment_status = 'paid' or o.status::text = 'delivered')
  );
$$;
grant execute on function public.has_purchased(uuid) to authenticated;

create table if not exists public.newsletter_subscribers (
  id          uuid primary key default gen_random_uuid(),
  email       text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(email) <= 254),
  source      text not null default 'footer',
  created_at  timestamptz not null default now()
);
create unique index if not exists newsletter_email_idx on public.newsletter_subscribers (lower(email));

create table if not exists public.contact_messages (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (length(name) between 1 and 80),
  email       text not null check (length(email) <= 254),
  phone       text check (phone is null or length(phone) <= 20),
  order_ref   text check (order_ref is null or length(order_ref) <= 40),
  message     text not null check (length(message) between 5 and 4000),
  handled     boolean not null default false,
  created_at  timestamptz not null default now()
);

-- RLS ------------------------------------------------------------------------
alter table public.product_variants       enable row level security;
alter table public.reviews                enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.contact_messages       enable row level security;

grant select on public.product_variants to anon, authenticated;
grant insert, update, delete on public.product_variants to authenticated;
grant select on public.reviews to anon, authenticated;
grant insert, update, delete on public.reviews to authenticated;
grant select, delete on public.newsletter_subscribers to authenticated;
grant select, update, delete on public.contact_messages to authenticated;
grant all on public.product_variants, public.reviews, public.newsletter_subscribers, public.contact_messages to service_role;

drop policy if exists "variants_select_active_or_admin" on public.product_variants;
create policy "variants_select_active_or_admin" on public.product_variants
  for select to anon, authenticated
  using (
    (is_active and exists (select 1 from public.products p where p.id = product_id and p.is_active))
    or (select public.is_admin())
  );
drop policy if exists "variants_admin_write" on public.product_variants;
create policy "variants_admin_write" on public.product_variants
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "reviews_select" on public.reviews;
create policy "reviews_select" on public.reviews
  for select to anon, authenticated
  using (status = 'published' or user_id = (select auth.uid()) or (select public.is_admin()));
drop policy if exists "reviews_insert_verified" on public.reviews;
create policy "reviews_insert_verified" on public.reviews
  for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'published' and public.has_purchased(product_id));
drop policy if exists "reviews_update_own_or_admin" on public.reviews;
create policy "reviews_update_own_or_admin" on public.reviews
  for update to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()))
  with check ((user_id = (select auth.uid()) and status = 'published') or (select public.is_admin()));
drop policy if exists "reviews_delete_own_or_admin" on public.reviews;
create policy "reviews_delete_own_or_admin" on public.reviews
  for delete to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

-- Newsletter + contact rows are inserted by the server (rate-limited); admins read them.
drop policy if exists "newsletter_admin_read" on public.newsletter_subscribers;
create policy "newsletter_admin_read" on public.newsletter_subscribers
  for select to authenticated using ((select public.is_admin()));
drop policy if exists "newsletter_admin_delete" on public.newsletter_subscribers;
create policy "newsletter_admin_delete" on public.newsletter_subscribers
  for delete to authenticated using ((select public.is_admin()));

drop policy if exists "contact_admin_read" on public.contact_messages;
create policy "contact_admin_read" on public.contact_messages
  for select to authenticated using ((select public.is_admin()));
drop policy if exists "contact_admin_update" on public.contact_messages;
create policy "contact_admin_update" on public.contact_messages
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "contact_admin_delete" on public.contact_messages;
create policy "contact_admin_delete" on public.contact_messages
  for delete to authenticated using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- 7. Categories: VÉRANE names, Work Bags replaces Backpacks
-- ---------------------------------------------------------------------------
update public.categories set slug = 'work-bags' where slug = 'backpacks'
  and not exists (select 1 from public.categories where slug = 'work-bags');

insert into public.categories (name, slug, description, image_url, sort_order) values
  ('Totes',      'totes',     'Structured and roomy, for the days that carry everything.',            '/products/heritage-leather-tote-1.webp', 1),
  ('Crossbody',  'crossbody', 'Light and hands-free, with only what matters close at hand.',           '/products/saddle-crossbody-1.webp',      2),
  ('Shoulder',   'shoulder',  'Soft silhouettes that sit naturally under the arm.',                    '/products/cherry-charm-shoulder-bag-1.webp', 3),
  ('Work Bags',  'work-bags', 'Briefcases and backpacks in genuine leather, made for the working week.', '/products/city-leather-backpack-2.webp',  4)
on conflict (slug) do update
set name        = excluded.name,
    description = excluded.description,
    image_url   = excluded.image_url,
    sort_order  = excluded.sort_order;

-- ---------------------------------------------------------------------------
-- 8. Sample products: VÉRANE copy, placeholder INR prices, details, WebP images
--    ⚠️ Prices, dimensions and materials below are SAMPLE DATA. Replace them in
--    Admin → Products with your real values before launch.
-- ---------------------------------------------------------------------------
update public.products p set
  name            = v.name,
  description     = v.description,
  price_inr_paise = v.price,
  style_ref       = v.ref,
  width_cm = v.w, height_cm = v.h, depth_cm = v.d, strap_drop_cm = v.strap,
  fits            = v.fits,
  leather         = v.leather,
  hardware        = v.hardware,
  lining          = 'Cotton twill, with an inner zip pocket'
from (values
  ('heritage-leather-tote', 'The Héritage Tote', 549000, '011',
   'An open tote in deep bordeaux leather that softens and darkens with every year you carry it. Long handles sit comfortably on the shoulder, and a detachable leather tag carries your initials if you wish.',
   38.0, 30.0, 14.0, 24.0, array['phone','tablet','laptop-14','bottle','a4'], 'Full-grain cowhide, vegetable-tanned', 'Antique-brass rivets'),
  ('buckle-slouch-tote', 'The Boucle Tote', 469000, '014',
   'A softer, slouchier tote in glossy bordeaux leather, with buckle details and zip side pockets. Spacious enough for a full day, light enough to forget you are carrying it.',
   36.0, 28.0, 12.0, 26.0, array['phone','tablet','laptop-13','bottle'], 'Nappa cowhide', 'Polished silver-tone buckles'),
  ('saddle-crossbody', 'The Selle Crossbody', 389000, '021',
   'A compact saddle bag in warm cognac leather, with a buckle flap, a front slip pocket and an adjustable strap. The bag you reach for every morning.',
   22.0, 17.0, 7.0, 55.0, array['phone'], 'Full-grain cowhide', 'Antique-brass buckle'),
  ('denim-satchel-crossbody', 'The Jean Satchel', 349000, '024',
   'Washed denim framed in chocolate leather: a small satchel with twin turn-locks, a top handle and a removable crossbody strap.',
   21.0, 16.0, 8.0, 52.0, array['phone'], 'Cotton denim with cowhide leather trim', 'Gold-tone turn-locks'),
  ('cherry-charm-shoulder-bag', 'The Cerise Shoulder Bag', 429000, '031',
   'A curved shoulder bag in high-shine cerise leather with a softly pleated front, gold-tone hardware and a small cherry charm tied with ribbon.',
   27.0, 16.0, 8.0, 22.0, array['phone'], 'Patent cowhide', 'Gold-tone hardware and charm'),
  ('blush-charm-shoulder-bag', 'The Poudre Shoulder Bag', 449000, '034',
   'A light baguette in crème leather, dressed with blush bows, pearls and a fine gold charm chain. Small, sweet, and made to be noticed.',
   25.0, 14.0, 7.0, 21.0, array['phone'], 'Smooth cowhide', 'Gold-tone chain with pearl charms'),
  ('city-leather-backpack', 'The Cité Backpack', 599000, '041',
   'A structured backpack in black pebbled leather with gold-tone zips. The main compartment opens wide, two front zip pockets keep small things close, and open side pockets hold a bottle or umbrella.',
   30.0, 40.0, 13.0, null, array['phone','tablet','laptop-14','bottle','a4'], 'Pebbled cowhide', 'Gold-tone YKK zips')
) as v(slug, name, price, ref, description, w, h, d, strap, fits, leather, hardware)
where p.slug = v.slug;

-- Replace the sample products' old JPG image rows with the optimised WebP files.
delete from public.product_images pi
using public.products p
where pi.product_id = p.id
  and pi.url like '/products/%.jpg'
  and p.slug in ('heritage-leather-tote','buckle-slouch-tote','saddle-crossbody','denim-satchel-crossbody',
                 'cherry-charm-shoulder-bag','blush-charm-shoulder-bag','city-leather-backpack');

insert into public.product_images (product_id, url, alt, sort_order)
select p.id, v.url, v.alt, v.sort_order
from public.products p
join (values
  ('heritage-leather-tote',     '/products/heritage-leather-tote-1.webp',     'The Héritage Tote in bordeaux leather', 0),
  ('buckle-slouch-tote',        '/products/buckle-slouch-tote-1.webp',        'The Boucle Tote in bordeaux leather', 0),
  ('saddle-crossbody',          '/products/saddle-crossbody-1.webp',          'The Selle Crossbody in cognac, worn', 0),
  ('denim-satchel-crossbody',   '/products/denim-satchel-crossbody-1.webp',   'The Jean Satchel in denim and leather', 0),
  ('cherry-charm-shoulder-bag', '/products/cherry-charm-shoulder-bag-1.webp', 'The Cerise Shoulder Bag with cherry charm', 0),
  ('blush-charm-shoulder-bag',  '/products/blush-charm-shoulder-bag-1.webp',  'The Poudre Shoulder Bag in crème', 0),
  ('city-leather-backpack',     '/products/city-leather-backpack-1.webp',     'The Cité Backpack in black leather, front', 0),
  ('city-leather-backpack',     '/products/city-leather-backpack-2.webp',     'The Cité Backpack worn over a trench coat', 1),
  ('city-leather-backpack',     '/products/city-leather-backpack-3.webp',     'Gold-tone zips on black pebbled leather', 2)
) as v(slug, url, alt, sort_order) on v.slug = p.slug
where not exists (select 1 from public.product_images pi where pi.product_id = p.id and pi.url = v.url);

-- Best-sellers on the home page (sample selection).
update public.products set is_featured = slug in
  ('heritage-leather-tote','saddle-crossbody','cherry-charm-shoulder-bag','city-leather-backpack');
