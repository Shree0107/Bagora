# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Women aged 25–40 in India who want a genuine leather handbag that feels like a high-end leather house at an attainable price. Most of them browse and buy on their phones, often in short sessions (commute, evening scroll, an Instagram link). They compare finish, size ("will my laptop fit?") and trust signals (returns, secure payment, COD) before buying.

## Product Purpose
VÉRANE is a direct-to-consumer online store for its own genuine-leather handbags. Visitors discover the brand, browse by category (Tote, Crossbody, Shoulder, Work Bags), choose a colour, and buy with Razorpay (UPI, cards, netbanking, wallets) or Cash on Delivery. Success means a visitor quickly believes the bags are genuinely premium and checks out confidently on mobile.

## Positioning
Quiet, affordable luxury: genuine leather handbags crafted in India, priced ₹3,000–6,000 (inclusive of GST). The name comes from the French "véritable" (genuine), and the tagline is "Véritablement vôtre" (Truly yours). Genuine leather and honest craft at this price, told with restraint, is the position.

## Operating Context
- Market: India only. Prices in INR, GST-inclusive. English only.
- Payments: Razorpay (UPI, cards, netbanking, wallets), with 5% off prepaid orders. Cash on Delivery with no fee.
- Customers find the brand through Instagram (@laveraneparis). WhatsApp chat is planned, but the number is not set yet.
- Orders, accounts and auth run on Supabase. Admins manage products, colour variants, orders and reviews in /admin.

## Capabilities and Constraints
- The stack is Next.js 16 (App Router) + Supabase + Tailwind v4 + Razorpay. Stripe and the earlier France/EUR market are being removed.
- Products have true colour variants (stock per variant). Product details include dimensions, what fits (phone, laptop, bottle), leather, hardware and care.
- Reviews come only from verified buyers. No reviews exist yet.
- The app itself sends no transactional email. Supabase sends the auth emails and Razorpay sends payment receipts.
- Undecided: the WhatsApp number, the GSTIN, legal name and business address for invoices, final prices, and legal text for the privacy and terms pages.

## Brand Commitments
- Name **VÉRANE**, written in uppercase with the accent. The wordmark is "VÉRANE" alone, in Cormorant Garamond. **No "Paris" anywhere**: not in the logo, signage, story or sections (owner decision, 2026-11-24). The Instagram handle @laveraneparis is the only exception, because it is the real account name.
- Tagline: "Véritablement vôtre" (Truly yours).
- Colours made binding by the owner: deep forest green #1F3A2E, champagne gold #C9A96E, warm ivory #F5F1EB, and espresso #3B2A20 for text.
- Fonts: Cormorant Garamond for headings and the logo (uppercase, wide tracking), with a clean, refined sans for body text.
- Feel: calm, elegant and editorial, like a high-end leather house (a French name and tagline, but no Paris claims). Not flashy, not a generic template. Lots of whitespace, large product images, and only subtle motion (fades, slow zoom on hover). No loud gradients and no cluttered cards.
- Product photography uses a consistent 4:5 ratio on a warm ivory background.

## Evidence on Hand
- Product photos are in `images/`: totes (2), crossbody (2), shoulder bags (2) and a black leather backpack (front, worn and detail shots). Most are small and on mixed backgrounds, and only the backpack shots are high resolution.
- There is no hero landscape shot, no briefcase photo and no colour-variant photos yet. Placeholders are used until the owner supplies them.
- There are no customer reviews, testimonials, press or sales figures. Never fabricate any.
- Instagram handle: @laveraneparis.

## Product Principles
1. Prove the quality with photography and honest detail (leather, hardware, dimensions, what fits), not with claims.
2. Mobile checkout must feel fast and safe: clear ₹ prices with GST included, the prepaid saving, COD, and easy returns.
3. Quiet over loud: every element earns its place, and nothing shouts discounts.
4. Never invent social proof, reviews or commercial claims.

## Accessibility & Inclusion
WCAG 2.2 AA: text contrast, keyboard access, visible focus, labelled controls (including colour swatches), and respect for reduced-motion settings.
