-- =============================================================================
-- VÉRANE — 06_backpacks.sql
-- Adds the "Backpacks" category and the City Leather Backpack (3 photos).
-- Run AFTER 01–05. Safe to re-run (rows with the same slug/url are updated
-- or skipped).
--
-- Images are served by the Next.js app from /public/products:
--   city-leather-backpack.jpg         (front, main photo)
--   city-leather-backpack-worn.jpg    (worn, lifestyle)
--   city-leather-backpack-detail.jpg  (zip & leather close-up)
-- =============================================================================

-- Category --------------------------------------------------------------------
insert into public.categories (name, slug, description, image_url, sort_order, name_fr, description_fr) values
  ('Backpacks', 'backpacks',
   'Polished leather backpacks that carry the whole day, hands-free.',
   '/products/city-leather-backpack-worn.jpg', 4,
   'Sacs à dos',
   'Des sacs à dos en cuir soigné qui portent toute votre journée, mains libres.')
on conflict (slug) do update
set name           = excluded.name,
    description    = excluded.description,
    image_url      = excluded.image_url,
    sort_order     = excluded.sort_order,
    name_fr        = coalesce(public.categories.name_fr, excluded.name_fr),
    description_fr = coalesce(public.categories.description_fr, excluded.description_fr);

-- Product ---------------------------------------------------------------------
-- price_cents = EUR cents (19900 = €199.00)
-- price_inr_paise = INR paise (1699900 = ₹16,999) ⚠️ placeholder, edit in Admin.
insert into public.products
  (category_id, name, slug, description, price_cents, price_inr_paise, stock, is_active, is_featured, name_fr, description_fr)
select c.id,
  'City Leather Backpack', 'city-leather-backpack',
  'A structured backpack in black pebbled leather with gold-tone zips. A wraparound main compartment opens wide, two zip pockets on the front keep the small things in reach, and open side pockets hold a bottle or umbrella. Padded leather straps and a top handle. Fits a 14" laptop.',
  19900, 1699900, 10, true, true,
  'Sac à dos City en cuir',
  'Un sac à dos structuré en cuir grainé noir, aux zips dorés. Le compartiment principal s''ouvre largement, deux poches zippées à l''avant gardent l''essentiel à portée de main et des poches latérales ouvertes accueillent une gourde ou un parapluie. Bretelles en cuir rembourrées et poignée. Accueille un ordinateur 14".'
from public.categories c
where c.slug = 'backpacks'
on conflict (slug) do update
set category_id     = excluded.category_id,
    name            = excluded.name,
    description     = excluded.description,
    price_cents     = excluded.price_cents,
    price_inr_paise = coalesce(public.products.price_inr_paise, excluded.price_inr_paise),
    stock           = excluded.stock,
    is_featured     = excluded.is_featured,
    name_fr         = coalesce(public.products.name_fr, excluded.name_fr),
    description_fr  = coalesce(public.products.description_fr, excluded.description_fr);

-- Product images --------------------------------------------------------------
insert into public.product_images (product_id, url, alt, sort_order)
select pr.id, v.url, v.alt, v.sort_order
from public.products pr
cross join (values
  ('/products/city-leather-backpack.jpg',        'City Leather Backpack, front view',            0),
  ('/products/city-leather-backpack-worn.jpg',   'City Leather Backpack worn over a trench coat', 1),
  ('/products/city-leather-backpack-detail.jpg', 'Close-up of the gold-tone zips and pebbled leather', 2)
) as v(url, alt, sort_order)
where pr.slug = 'city-leather-backpack'
and not exists (
  select 1 from public.product_images pi
  where pi.product_id = pr.id and pi.url = v.url
);
