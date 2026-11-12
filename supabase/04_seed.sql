-- =============================================================================
-- Bagora — 04_seed.sql
-- The 3 categories + 6 sample products matching the images in /images.
-- Run LAST. Safe to re-run (existing rows with the same slug are updated).
--
-- Sample images are served by the Next.js app itself from /public/products,
-- so no upload is needed. Paths below like "/products/heritage-leather-tote.jpg"
-- map to public/products/heritage-leather-tote.jpg in the project.
-- =============================================================================

-- Categories ------------------------------------------------------------------
insert into public.categories (name, slug, description, image_url, sort_order) values
  ('Tote Bags',      'totes',     'Roomy, structured totes for work, travel and everything in between.', '/products/heritage-leather-tote.jpg', 1),
  ('Crossbody Bags', 'crossbody', 'Hands-free and compact — the essentials, close at hand.',             '/products/saddle-crossbody.jpg',     2),
  ('Shoulder Bags',  'shoulder',  'Soft silhouettes that sit effortlessly under the arm.',               '/products/cherry-charm-shoulder-bag.jpg', 3)
on conflict (slug) do update
set name        = excluded.name,
    description = excluded.description,
    image_url   = excluded.image_url,
    sort_order  = excluded.sort_order;

-- Products --------------------------------------------------------------------
-- price_cents is in EUR cents: 18900 = €189.00
insert into public.products (category_id, name, slug, description, price_cents, stock, is_active, is_featured)
select c.id, p.name, p.slug, p.description, p.price_cents, p.stock, true, p.is_featured
from (values
  ('totes', 'Heritage Leather Tote', 'heritage-leather-tote',
   'A timeless open tote cut from full-grain oxblood leather that deepens beautifully with age. Brass rivets, a detachable leather tag and long handles that sit comfortably on the shoulder. Fits a 13" laptop.',
   18900, 12, true),
  ('totes', 'Buckle Slouch Tote', 'buckle-slouch-tote',
   'Soft, glossy burgundy leather with buckle details, silver-tone hardware and zip side pockets. Slouchy and spacious, with a single adjustable strap.',
   15900, 8, false),
  ('crossbody', 'Saddle Crossbody', 'saddle-crossbody',
   'A compact saddle bag in warm cognac vegan leather with a buckle flap, front slip pocket and an adjustable crossbody strap. Your everyday companion.',
   11900, 15, true),
  ('crossbody', 'Denim Satchel Crossbody', 'denim-satchel-crossbody',
   'Washed denim meets chocolate-brown leather trim on this mini satchel. Twin turn-lock straps, a top handle and a removable crossbody strap.',
   9900, 10, false),
  ('shoulder', 'Cherry Charm Shoulder Bag', 'cherry-charm-shoulder-bag',
   'A curved shoulder bag in high-shine burgundy with a pleated front, gold-tone hardware and a playful cherry charm with ribbon tie.',
   13900, 9, true),
  ('shoulder', 'Blush Charm Shoulder Bag', 'blush-charm-shoulder-bag',
   'A light, cream baguette-style shoulder bag dressed with blush-pink bows, pearls and a gold charm chain. Sweet, small and made to be seen.',
   14900, 6, false)
) as p(category_slug, name, slug, description, price_cents, stock, is_featured)
join public.categories c on c.slug = p.category_slug
on conflict (slug) do update
set category_id = excluded.category_id,
    name        = excluded.name,
    description = excluded.description,
    price_cents = excluded.price_cents,
    stock       = excluded.stock,
    is_featured = excluded.is_featured;

-- Product images (one per product) ---------------------------------------------
insert into public.product_images (product_id, url, alt, sort_order)
select pr.id, '/products/' || pr.slug || '.jpg', pr.name, 0
from public.products pr
where pr.slug in (
  'heritage-leather-tote', 'buckle-slouch-tote',
  'saddle-crossbody', 'denim-satchel-crossbody',
  'cherry-charm-shoulder-bag', 'blush-charm-shoulder-bag'
)
and not exists (
  select 1 from public.product_images pi
  where pi.product_id = pr.id and pi.url = '/products/' || pr.slug || '.jpg'
);
