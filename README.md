# Bagora

An online handbag store built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS v4**, **Supabase** (database, auth and storage) and **Stripe Checkout**.

👉 **First time? Follow [SETUP.md](./SETUP.md)** for step-by-step setup, deployment and going live.

## Features

- Home page, all-products page and category pages, with price/stock filters and sorting
- Product pages with gallery and stock levels
- A cart that works for guests and syncs to the account after login
- Stripe Checkout with server-side price checks, plus a webhook that marks orders paid and reduces stock
- Sign up, log in, log out, forgot/reset password, and an account page with order history
- Admin area (role-based): add, edit and delete products, upload images, view orders and update their status
- Row Level Security on every table

## Quick start

```bash
npm install
cp .env.example .env.local   # then fill in the values (see SETUP.md)
npm run dev
```

## Project structure

```
supabase/                 SQL to run in the Supabase SQL Editor (01 → 04)
public/products/          Sample product images (served by the app)
src/
  proxy.ts                Refreshes the auth session, protects /account and /admin
  app/                    Pages and routes (App Router)
    api/checkout/         Creates the order + Stripe Checkout session
    api/stripe/webhook/   Confirms payments from Stripe
    admin/                Admin pages (role-guarded)
  components/             UI components (layout, product, cart, order, admin, ui)
  lib/
    supabase/             Supabase clients (server, admin/secret, proxy)
    cart/                 Guest cart store + cart Server Actions
    data/catalog.ts       Product and category queries
    auth.ts               getCurrentUser / requireUser / requireAdmin
    auth-actions.ts       Login, sign-up, password Server Actions
    admin-actions.ts      Admin Server Actions
    config.ts             Store settings (currency, shipping countries…)
  types/database.ts       Database types
```

## Theme

Colours are Tailwind theme tokens in [`src/app/globals.css`](./src/app/globals.css) (`cream`, `ivory`, `sand`, `tan`, `cognac`, `saddle`, `espresso`, `muted`). Change a hex value there and the whole site updates.
