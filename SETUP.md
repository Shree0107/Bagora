# HouseOfSV — Setup guide

This guide takes you from an empty computer to a live store. Follow the steps in order. Each step says **where to click** and **what to copy**.

You'll need about an hour the first time.

**What you'll set up:**

| Service | What it does | Cost |
|---|---|---|
| [Supabase](https://supabase.com) | Database, user accounts, image storage | Free tier is enough |
| [Stripe](https://stripe.com) | Card payments | Free in test mode; a fee per sale in live mode |
| [Vercel](https://vercel.com) | Hosts the website | Free "Hobby" plan is enough to start |

---

## Table of contents

1. [Install dependencies and run the project locally](#1-install-dependencies-and-run-the-project-locally)
2. [Create the Supabase project and run the SQL files](#2-create-the-supabase-project-and-run-the-sql-files)
3. [Set up Supabase Auth](#3-set-up-supabase-auth)
4. [Product images](#4-product-images)
5. [Make your own account an admin](#5-make-your-own-account-an-admin)
6. [Set up Stripe (test mode + webhooks)](#6-set-up-stripe-test-mode--webhooks)
7. [Fill in `.env.local`](#7-fill-in-envlocal)
8. [Test a full purchase](#8-test-a-full-purchase)
9. [Deploy to Vercel](#9-deploy-to-vercel)
10. [Switch Stripe to live mode](#10-switch-stripe-to-live-mode)
11. [Troubleshooting](#11-troubleshooting)
12. [France & India markets (Razorpay, prices, shipping)](#12-france--india-markets)

---

## 1. Install dependencies and run the project locally

1. Install **Node.js 20.9 or newer** (the LTS version) from <https://nodejs.org>. You can check it in a terminal with:
   ```bash
   node -v
   ```
2. Open the `bagora` folder in VS Code and open a terminal (**Terminal → New Terminal**).
3. Install the packages:
   ```bash
   npm install
   ```
4. Create your environment file by copying the example:
   ```bash
   # macOS / Linux / Git Bash
   cp .env.example .env.local
   # Windows PowerShell
   Copy-Item .env.example .env.local
   ```
   You'll fill in the values in steps 2, 6 and 7.
5. Start the development server:
   ```bash
   npm run dev
   ```
6. Open <http://localhost:3000>. Until you fill in the Supabase keys, you'll see a **"HouseOfSV is almost ready"** page. That's expected.

Useful commands:

| Command | What it does |
|---|---|
| `npm run dev` | Start the site locally with live reload |
| `npm run build` | Make a production build (run this before pushing to check for errors) |
| `npm run start` | Run the production build locally |
| `npm run lint` | Check the code for common mistakes |

> After changing `.env.local`, always **stop the server (Ctrl + C) and run `npm run dev` again**.

---

## 2. Create the Supabase project and run the SQL files

### 2a. Create the project

1. Go to <https://supabase.com/dashboard> and sign up or log in.
2. Click **New project**.
3. Choose a name (e.g. `bagora`) and a strong **database password**. Save the password in a password manager; you rarely need it, but it's hard to recover.
4. Pick the **region** closest to your customers (e.g. *Frankfurt* or *Ireland* for Europe).
5. Click **Create new project** and wait 1–2 minutes.

### 2b. Find your keys

You need three values. Paste them into `.env.local` as you go:

| Value | Where to find it | Goes into |
|---|---|---|
| **Project URL** (`https://abcd1234.supabase.co`) | Click the **Connect** button at the top of the dashboard, or **Project Settings → Data API** | `NEXT_PUBLIC_SUPABASE_URL` |
| **Publishable key** (`sb_publishable_…`) | **Project Settings → API Keys** | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
| **Secret key** (`sb_secret_…`) | **Project Settings → API Keys**. Under *Secret keys*, click to reveal it, or **Create new secret key** if none exists | `SUPABASE_SECRET_KEY` |

> **Older projects:** if you only see the **legacy** keys tab, use the `anon` key as the publishable key and the `service_role` key as the secret key. They work the same way.

> ⚠️ **The secret key bypasses all security rules.** Never put it in code, never share it, and never prefix its variable with `NEXT_PUBLIC_`.

### 2c. Run the SQL files (in this order!)

1. In the Supabase dashboard, open **SQL Editor** (left sidebar).
2. Click **New query** (the **+** button).
3. Open `supabase/01_schema.sql` in VS Code, select all (Ctrl + A), copy, paste it into the SQL Editor and click **Run**. You should see *"Success. No rows returned"*.
4. Repeat with a new query for each of the other files, **in order**:

| # | File | What it creates |
|---|---|---|
| 1 | `supabase/01_schema.sql` | Tables, indexes, triggers (auto-creates a profile on sign-up), and the payment function |
| 2 | `supabase/02_rls_policies.sql` | Row Level Security rules (who can read and change what) |
| 3 | `supabase/03_storage.sql` | The `product-images` storage bucket and its rules |
| 4 | `supabase/04_seed.sql` | The 3 categories and 6 sample products |
| 5 | `supabase/05_markets.sql` | France/India markets: INR prices, French texts, payment fields, order locks, rate limiting |
| 6 | `supabase/06_backpacks.sql` | The Backpacks category and the City Leather Backpack (3 photos) |

> **Upgrading an existing store?** Run `05_markets.sql` **before** deploying the code that uses it. It back-fills existing orders as France / EUR / Stripe.

All four files are safe to run again if something goes wrong halfway.

**Check it worked:** open **Table Editor**. You should see `categories` (3 rows) and `products` (6 rows), and each table should **not** show an "RLS disabled" warning.

---

## 3. Set up Supabase Auth

### 3a. URLs (required)

Supabase needs to know which website addresses its emails may link back to.

1. Go to **Authentication → URL Configuration**.
2. **Site URL**: for now, `http://localhost:3000`. You'll change it to your live domain in step 9.
3. Under **Redirect URLs**, click **Add URL** and add:
   ```
   http://localhost:3000/**
   ```
   After deploying (step 9) you'll also add `https://your-domain.vercel.app/**`.
4. Click **Save**.

### 3b. Email sign-up settings

1. Go to **Authentication → Sign In / Providers** (called *Providers* in some dashboards) and open **Email**.
2. Make sure **Enable Email provider** is on.
3. Keep **Confirm email** **on**. New customers then get a confirmation link before they can log in.
4. Optional: set **Minimum password length** to 8 (the site already requires 8).

### 3c. Email templates (recommended)

The site works with Supabase's default email templates. With the defaults, though, a confirmation or reset link only works in **the same browser** where the customer signed up. To make links work everywhere (e.g. sign up on a laptop, click the email on a phone), update two templates:

Go to **Authentication → Emails → Templates** (*Email Templates* in some dashboards):

- **Confirm signup**: replace the link with:
  ```html
  <h2>Confirm your email</h2>
  <p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Confirm my account</a></p>
  ```
- **Reset password**: replace the link with:
  ```html
  <h2>Reset your password</h2>
  <p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password">Choose a new password</a></p>
  ```

You can also change the subject lines and wording to match the HouseOfSV tone.

### 3d. Sending real emails (before going live)

Supabase's built-in email sender is for **testing only**. It sends just a few emails per hour, and it may only deliver to members of your Supabase team. Before launch:

1. Create an account with an email provider such as [Resend](https://resend.com), [Postmark](https://postmarkapp.com) or [Brevo](https://www.brevo.com), and verify your domain there.
2. In Supabase, go to **Authentication → Emails → SMTP Settings**, enable **Custom SMTP** and enter the host, port, username and password your provider gives you.
3. Set the **Sender email** to something like `hello@yourdomain.com` and the **Sender name** to `HouseOfSV`.

---

## 4. Product images

### Sample images: nothing to upload

The 6 sample photos are already copied into the project at `public/products/`, with clean names and no spaces, and the website serves them itself. `04_seed.sql` points each product at its image, e.g. `/products/heritage-leather-tote.jpg`. So **there is nothing to upload** for the sample products.

| Original file | Served as | Product |
|---|---|---|
| `images/totebags/tote1.jpg` | `/products/heritage-leather-tote.jpg` | Heritage Leather Tote |
| `images/totebags/tote2.jpg` | `/products/buckle-slouch-tote.jpg` | Buckle Slouch Tote |
| `images/crossbody bags/cross1.jpg` | `/products/saddle-crossbody.jpg` | Saddle Crossbody |
| `images/crossbody bags/cross2.avif` | `/products/denim-satchel-crossbody.jpg` (converted to JPG) | Denim Satchel Crossbody |
| `images/shoulderbags/pic1.jpg` | `/products/cherry-charm-shoulder-bag.jpg` | Cherry Charm Shoulder Bag |
| `images/shoulderbags/pic2.jpg` | `/products/blush-charm-shoulder-bag.jpg` | Blush Charm Shoulder Bag |

> ⚠️ **Replace the sample photos before going live.** Some of them are not yours to use commercially: `cross1.jpg` has a *"Bird in bag"* watermark, and `pic2.jpg` shows a **Coach** logo. Use your own product photography for the real store.

### New and replacement images: use the admin panel

Once you're an admin (step 5):

1. Go to **Admin → Products → Edit** for a product, or **Add product**.
2. Choose a file under **Add an image** (JPG, PNG, WebP or AVIF, max 4 MB; portrait 4:5 photos look best) and click **Save**.
3. The image is uploaded to the Supabase Storage bucket `product-images`, and its public URL is saved automatically.
4. To remove a sample image, click **Remove** under it on the edit page.

The first image in the list is the one shown on product cards.

---

## 5. Make your own account an admin

1. With the site running (`npm run dev`), go to <http://localhost:3000/signup> and create an account with your own email.
2. Click the confirmation link in the email. Check your spam folder too. Then log in.
3. In Supabase, open **SQL Editor → New query** and run this, using **your** email:
   ```sql
   update public.profiles
   set role = 'admin'
   where email = 'you@example.com';
   ```
   It should say *"Success. 1 row affected"*. If it says 0 rows, check the spelling of the email.
4. Refresh the website. An **Admin** link now appears in the header, and <http://localhost:3000/admin> opens the dashboard.

To remove admin rights later, run the same query with `role = 'customer'`.

> Customers can't make themselves admin: a database trigger blocks any role change that isn't made from the SQL Editor or with the secret key.

---

## 6. Set up Stripe (test mode + webhooks)

### 6a. Create an account and get the test key

1. Sign up at <https://dashboard.stripe.com/register>. You can use **test mode** right away, before giving any business details.
2. Make sure you're in **test mode**: look for the *"Test mode"* or *Sandbox* label at the top of the dashboard, and switch to it if needed.
3. Go to **Developers → API keys**.
4. Copy the **Secret key** (`sk_test_…`) into `STRIPE_SECRET_KEY` in `.env.local`. This store doesn't need the publishable key.

### 6b. Webhook for local development (Stripe CLI)

When someone pays, Stripe tells the store via a **webhook**. The webhook marks the order as paid and reduces stock. Stripe can't reach `localhost` directly, so locally you use the **Stripe CLI** to forward events.

1. **Install the Stripe CLI**
   - **Windows:** download the latest `stripe_X.X.X_windows_x86_64.zip` from <https://github.com/stripe/stripe-cli/releases/latest> and unzip it, e.g. to `C:\stripe`. Then run it from that folder as `C:\stripe\stripe.exe`, or add the folder to your PATH. If you use Scoop: `scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git` then `scoop install stripe`.
   - **macOS:** `brew install stripe/stripe-cli/stripe`
2. Log in (this opens your browser):
   ```bash
   stripe login
   ```
3. Start forwarding. Keep this running in a **second terminal** while you test:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
4. It prints `Your webhook signing secret is whsec_…`. Copy that value into `STRIPE_WEBHOOK_SECRET` in `.env.local`, then restart `npm run dev`.

> The `whsec_…` from `stripe listen` stays the same for your machine, but it's **different** from the production one in step 9.

### 6c. Webhook for production (set up after deploying in step 9)

1. In the Stripe dashboard (test mode), go to **Developers → Webhooks** (labelled *Event destinations* in newer dashboards) and click **Add endpoint** / **Add destination**.
2. **Endpoint URL**: `https://your-domain.vercel.app/api/stripe/webhook`
3. **Events to send**: select these 4:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
   - `checkout.session.expired`
4. Save, then open the endpoint and reveal its **Signing secret** (`whsec_…`). This goes into Vercel as `STRIPE_WEBHOOK_SECRET` (step 9).

---

## 7. Fill in `.env.local`

Open `.env.local` (created in step 1) and fill in every line:

```bash
# Local address of the site (no trailing slash)
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Supabase (step 2b)
NEXT_PUBLIC_SUPABASE_URL=https://abcd1234.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...

# Stripe (steps 6a and 6b)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Razorpay (India market, step 12)
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
```

| Variable | Secret? | Notes |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | No | Used for Stripe redirects and email links |
| `NEXT_PUBLIC_SUPABASE_URL` | No | Visible in the browser by design |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | No | Safe in the browser; Row Level Security protects the data |
| `SUPABASE_SECRET_KEY` | **Yes** | Server only. Used to create orders and handle webhooks |
| `STRIPE_SECRET_KEY` | **Yes** | Server only |
| `STRIPE_WEBHOOK_SECRET` | **Yes** | Server only. Proves webhook calls really come from Stripe |
| `RAZORPAY_KEY_ID` | No | Server variable; sent to the browser only to open Razorpay Checkout |
| `RAZORPAY_KEY_SECRET` | **Yes** | Server only. Creates Razorpay orders and verifies payment signatures |
| `RAZORPAY_WEBHOOK_SECRET` | **Yes** | Server only. The secret you typed when creating the Razorpay webhook |

> Checkout for a market stays switched off (with a friendly message) until that market's payment keys are set: France needs both Stripe keys, India all three Razorpay keys.

Then restart the server: press **Ctrl + C**, then run `npm run dev`.

> `.env.local` is listed in `.gitignore`, so it is **never committed** to GitHub. Only `.env.example` (with placeholder values) is.

---

## 8. Test a full purchase

You need **two terminals** running:

```bash
# Terminal 1
npm run dev

# Terminal 2
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Then:

1. Open <http://localhost:3000> in a **private/incognito window** (so you start as a guest).
2. Add a bag to your bag (cart) **while logged out**, then open **Bag** and click **Log in to checkout**.
3. Log in, or sign up and confirm your email. Your guest items are merged into your account's bag automatically.
4. Click **Checkout**. You're sent to the Stripe payment page.
5. Pay with a **test card**:

   | Card number | Result |
   |---|---|
   | `4242 4242 4242 4242` | Payment succeeds |
   | `4000 0025 0000 3155` | Asks for 3-D Secure authentication, then succeeds |
   | `4000 0000 0000 9995` | Declined (insufficient funds) |

   Use **any future expiry date** (e.g. `12/34`), **any 3-digit CVC** and any name and address.
6. You land on **"Your order is confirmed"**. It may say *"confirming your payment"* for a few seconds, then update itself.
7. Check that everything worked:
   - Terminal 2 shows `checkout.session.completed` with `[200]`.
   - **My account** lists the order as **paid**.
   - In Supabase **Table Editor → products**, the stock for that bag went down.
   - In **Admin → Orders**, the order is there. Open it, change the status to **shipped** and click **Update status**.
8. Also try clicking **Back** on the Stripe page: you land on the **"Checkout cancelled"** page and your bag is still there.

---

## 9. Deploy to Vercel

### 9a. Import the project

1. Make sure the code is on GitHub: <https://github.com/Shree0107/Bagora>.
2. Go to <https://vercel.com/new> and sign in with GitHub.
3. Find the **Bagora** repository and click **Import**. Vercel detects Next.js automatically; leave the build settings as they are.

### 9b. Add the environment variables

Before clicking **Deploy**, open **Environment Variables** and add all six:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://houseofsv.vercel.app` (your Vercel URL, or custom domain; no trailing slash). If you don't know it yet, deploy first, then update this and redeploy |
| `NEXT_PUBLIC_SUPABASE_URL` | same as `.env.local` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | same as `.env.local` |
| `SUPABASE_SECRET_KEY` | same as `.env.local` |
| `STRIPE_SECRET_KEY` | `sk_test_…` for now |
| `STRIPE_WEBHOOK_SECRET` | the **production** endpoint secret from step 6c (**not** the `stripe listen` one) |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET` | from step 12 (test keys first) |

Click **Deploy**.

### 9c. After the first deploy

1. **Stripe:** create the production webhook (step 6c) with your real URL, then put its `whsec_…` into Vercel's `STRIPE_WEBHOOK_SECRET`.
2. **Supabase → Authentication → URL Configuration:**
   - set **Site URL** to `https://your-domain.vercel.app`
   - add `https://your-domain.vercel.app/**` to **Redirect URLs** (keep the localhost one for development)
3. **Redeploy:** in Vercel, go to **Deployments**, open the **⋯** menu on the latest deployment and choose **Redeploy**.

> **Important:** variables starting with `NEXT_PUBLIC_` are baked in **when the site is built**. Whenever you change one in Vercel, you must **redeploy** for the change to take effect.

4. Repeat the test purchase from step 8 on the live URL. The webhook now goes straight from Stripe to Vercel; no `stripe listen` needed. You can check its deliveries in **Stripe → Developers → Webhooks → your endpoint**.

**Custom domain (optional):** in Vercel go to **Project → Settings → Domains** and add your domain. Then update `NEXT_PUBLIC_SITE_URL`, the Supabase URLs and the Stripe webhook URL to use it, and redeploy.

---

## 10. Switch Stripe to live mode

Only do this when you're ready to take real money.

1. **Activate your Stripe account:** in the dashboard, click **Activate payments** and enter your business details and bank account.
2. **Switch to live mode** (toggle off *Test mode* / leave the Sandbox).
3. **Developers → API keys:** copy the live **Secret key** (`sk_live_…`).
4. **Developers → Webhooks:** create a **new** endpoint in live mode, with the same URL and the same 4 events as step 6c, and copy its live **signing secret** (`whsec_…`). Test-mode and live-mode webhooks are separate.
5. In **Vercel → Settings → Environment Variables**, update:
   - `STRIPE_SECRET_KEY` → `sk_live_…`
   - `STRIPE_WEBHOOK_SECRET` → the live `whsec_…`
6. **Redeploy** on Vercel.
7. Make one real purchase with your own card, then refund it from the Stripe dashboard (**Payments → the payment → Refund**).

**Pre-launch checklist:**

- [ ] Sample photos replaced with your own (see step 4)
- [ ] Custom SMTP configured in Supabase (step 3d)
- [ ] Supabase Site URL and Redirect URLs point to the live domain
- [ ] Real product names, prices and stock entered in the admin panel
- [ ] Legal pages (terms, privacy, returns) added. They're required in the EU; ask a professional about your obligations

> Keep using **test mode** keys in your local `.env.local`, so you never accidentally charge a real card while developing.

---

## 11. Troubleshooting

| Problem | Likely cause and fix |
|---|---|
| **"HouseOfSV is almost ready"** page | The Supabase variables are missing. Fill in `.env.local` (step 7) and restart `npm run dev`. On Vercel: add the variables, then **redeploy**. |
| **"Something went wrong"** on every page | Wrong Supabase URL or key, or the SQL files weren't run. Check the terminal running `npm run dev` for the real error. Make sure `01`–`04` all ran successfully. |
| Shop is empty | `04_seed.sql` wasn't run, or the products are hidden (`is_active = false`). |
| `relation "public.profiles" does not exist` when running SQL | Run the files in order: `01_schema.sql` first. |
| Sign-up says it worked, but **no email arrives** | Check spam. The built-in Supabase mailer is very limited (step 3d): set up custom SMTP, or for testing, confirm the user manually in **Authentication → Users → ⋯ → Confirm email**. |
| **"Email rate limit exceeded"** | The built-in mailer's hourly limit was hit. Wait an hour or set up custom SMTP (step 3d). |
| Clicking the email link shows **"That link is invalid or has expired"** | The link was already used, is older than 1 hour, or was opened in a different browser with the default templates. Use the recommended templates (step 3c), and check that the site's URL is in **Redirect URLs** (step 3a). |
| Email link opens **localhost** on the live site | Supabase **Site URL** is still `http://localhost:3000`. Change it to your live domain (step 9c). |
| **"Please confirm your email first"** on login | Click the link in the confirmation email, or confirm the user manually in Supabase. |
| No **Admin** link after running the SQL | Log out and back in (or refresh), and check the email in the `update` query matched exactly. |
| `/admin` shows **"Page not found"** | You're logged in, but your profile's role isn't `admin` (step 5). |
| **Checkout** button does nothing or shows an error | Check the browser console and the `npm run dev` terminal. Common causes: `STRIPE_SECRET_KEY` missing or wrong; an item went out of stock; `SUPABASE_SECRET_KEY` is wrong. |
| Paid, but the order stays **"pending"** | The webhook isn't arriving. **Locally:** is `stripe listen` running, and is `STRIPE_WEBHOOK_SECRET` the `whsec_` it printed? Restart `npm run dev` after changing it. **Production:** check the endpoint's deliveries in Stripe for the error, and that Vercel's `STRIPE_WEBHOOK_SECRET` is that endpoint's secret. |
| Stripe CLI shows **`[400]`** for events | Signature mismatch: the `STRIPE_WEBHOOK_SECRET` doesn't belong to this `stripe listen` session or endpoint. Copy the right `whsec_…`, restart. |
| Stripe CLI shows **`[500]`** for events | The webhook reached the site but the database update failed. The `npm run dev` terminal shows why. Usually `SUPABASE_SECRET_KEY` is wrong or `01_schema.sql` wasn't fully run. Stripe retries automatically. |
| `stripe` is **not recognized** (Windows) | Run it with the full path (e.g. `C:\stripe\stripe.exe listen …`) or add its folder to your PATH and reopen the terminal. |
| Image upload fails in admin | The file must be JPG, PNG, WebP or AVIF and under 4 MB, and you must be an admin. Make sure `03_storage.sql` was run. |
| Uploaded image doesn't display (**"hostname is not configured"**) | Images must come from your `*.supabase.co` Storage. If you use a custom Supabase domain, add it to `images.remotePatterns` in `next.config.ts`. |
| Product images don't show on the Stripe page | Stripe can only show images from public `https://` URLs, so this is normal on localhost. It works after deploying. |
| Changed an env variable on Vercel but nothing changed | Redeploy. `NEXT_PUBLIC_` variables are only read at build time. |
| Checkout says "Online payment for India/France isn't available yet" | That market's payment keys are missing (steps 7 and 12). Add them, then restart or redeploy. |
| `column "price_inr_paise" does not exist` or `function confirm_order_payment does not exist` | Run `supabase/05_markets.sql` (step 2c). |
| A product doesn't appear in the India shop | It has no India price. Set one in **Admin → Products → Edit → India price**. |
| India: paid, but the order stays "pending" | Check **Razorpay Dashboard → Webhooks** for failed deliveries (URL, secret, events). The verify step and the webhook both confirm orders; either one is enough. |
| India: "This PIN code doesn't match the selected state" | The first digit of an Indian PIN code identifies its region. Check that the state matches the PIN. |
| France: postcode rejected | Only mainland France and Corsica (01000–95999) are delivered to. Overseas territories (97xxx/98xxx) are a different shipping zone. |
| Admin: "Status not changed: … has no confirmed payment" | An order can only be marked paid, shipped or delivered after the payment provider has confirmed the payment. This is intentional. |
| `npm run build` fails with a type error after changing the database | Update `src/types/database.ts` to match, or regenerate it with `npx supabase gen types typescript --project-id <your-ref> > src/types/database.ts`. |
| Port 3000 is already in use | Another server is running. Stop it, or run `npm run dev -- -p 3001` (and use that port in `NEXT_PUBLIC_SITE_URL` and `stripe listen`). |

---

## 12. France & India markets

The store sells to two **shopping destinations**:

| | France 🇫🇷 | India 🇮🇳 |
|---|---|---|
| Currency | EUR (€) | INR (₹) |
| Languages | French + English | English |
| Delivers to | Mainland France + Corsica only | India only |
| Payments | Stripe (cards, Apple Pay, Google Pay…) | Razorpay (UPI, cards, net banking, wallets) |

**How customers choose:**
- On their first visit, a banner asks them to pick a destination. Their location is only used to *suggest* one; nothing is saved until they click.
- They can change destination (and, for France, language) at any time from the flag in the header.
- Regional links also work: `https://your-domain/in/shop` opens the shop with India selected, and `https://your-domain/fr` opens it with France selected.
- Every order is locked to the market and currency it was paid in.

**Addresses are checked twice:** once on the checkout page and again on the server.
- A France order must have a French address: postcode 01000–95999 and a French phone number.
- An India order must have an Indian address: a valid state, a 6-digit PIN code that matches that state, and a 10-digit mobile number.
- To deliver elsewhere, a customer must change their destination first.

### 12a. Prices for each market

Each product has **two independent prices**. They are not converted with an exchange rate, so you decide each price and it never changes on its own:

- **France price (€, VAT included):** the existing price.
- **India price (₹, GST included):** set it in **Admin → Products → Edit**. Leave it empty to not sell that product in India.

> ⚠️ `05_markets.sql` gives the 6 sample products **placeholder** INR prices. Replace them with your real prices before launch.

### 12b. Shipping and delivery times

Shipping methods and rates live in `src/lib/shipping.ts`, one list per market.
- Both markets currently offer **free standard delivery**.
- To charge for shipping, set `amount` (in cents for EUR, paise for INR; e.g. `14900` = ₹149). Use `freeOver` to make shipping free above a subtotal.
- `estimate` is `null` on purpose. Customers then see "Delivery time confirmed when your order ships". Only add delivery times your carrier has confirmed.

The server always recalculates shipping. The browser never sends a shipping price.

### 12c. Taxes

Prices include tax, and each order records the tax portion: France VAT 20%, India GST 18%.
- The rates are in `src/lib/markets.ts` (`includedTaxRate`).
- ⚠️ **Confirm the GST rate for your products (by their HSN code) with your accountant.** Also check whether you need GST registration and invoicing before selling in India.

### 12d. Razorpay: eligibility (read this first)

To accept real payments with Razorpay you need:
- **an Indian business entity** (a sole proprietorship, partnership, LLP or company, registered in India) with a business **PAN**;
- **an Indian bank account** in the business's name, where payouts are sent;
- a **website** showing your business details, prices, and contact, terms, privacy, refund and shipping policies;
- to complete Razorpay's **KYC / account activation** in the dashboard.

A business registered only outside India (e.g. only in France) generally **cannot** open a standard Razorpay account. Check Razorpay's current requirements with their team before you rely on it. You **can** use **Test Mode** right away to build and test, before activation.

### 12e. Razorpay: keys and webhook

1. Sign up at <https://dashboard.razorpay.com/signup> and switch to **Test Mode** (toggle at the top).
2. **Account & Settings → API Keys → Generate Test Key.** Copy the **Key Id** (`rzp_test_…`) into `RAZORPAY_KEY_ID` and the **Key Secret** into `RAZORPAY_KEY_SECRET`. The secret is shown only once.
3. **Account & Settings → Webhooks → Add New Webhook:**
   - **Webhook URL:** `https://your-domain/api/razorpay/webhook`. Razorpay must be able to reach it, so for local testing use a tunnel such as `ngrok http 3000` and its https URL.
   - **Secret:** type a long random string, and put the same value in `RAZORPAY_WEBHOOK_SECRET`.
   - **Active events:** `payment.authorized`, `payment.captured`, `payment.failed`, `order.paid`.
4. **Payment capture:** the store captures authorised payments itself, so it works with either setting. Razorpay's default *automatic capture* setting is recommended.
5. Restart `npm run dev` (or redeploy on Vercel) after adding the keys.

**How an India payment is confirmed:** the server creates the Razorpay order with the amount from the database. After the customer pays, the browser sends Razorpay's response to `/api/razorpay/verify`. The server then:
1. checks the **signature** with your Key Secret;
2. **fetches the payment from Razorpay** and checks the amount, currency and order;
3. marks the order paid.

The webhook does the same independently, in case the customer closes the tab. Neither path trusts the browser, and confirming twice has no effect.

### 12f. Test an India purchase

1. Choose **India** in the header (or open `/in`), add a bag that has an India price, then **Checkout**.
2. Enter an Indian address, e.g. *12 MG Road, Bengaluru, Karnataka, 560001, mobile 9876543210*.
3. In the Razorpay window, pay with a test method:
   - **UPI:** `success@razorpay` (succeeds) or `failure@razorpay` (fails);
   - **Card:** use one of the test cards listed in Razorpay's docs (*Test Card Details*), any future expiry and any CVV.
4. You land on the confirmation page. In **Admin → Orders → 🇮🇳 India**, the order shows **Razorpay · paid** with the method used, and the stock has gone down.

### 12g. Razorpay live mode

Once your account is activated:
1. Generate **Live** keys.
2. Create a webhook **in Live mode** with the same URL and events, and a new secret.
3. Update the three `RAZORPAY_*` variables on Vercel and redeploy.
4. Make one small real purchase and refund it from the Razorpay dashboard.

---

## How it fits together (for reference)

- **Prices are never trusted from the browser.** The checkout only sends product IDs, quantities, the address and the chosen shipping method. `/api/checkout` checks that the market hasn't changed, validates the address for that market, loads the real prices and stock in the market's currency, creates a `pending` order, and only then creates the Stripe (France) or Razorpay (India) payment.
- **No duplicate orders.** Each checkout attempt has a unique key, so double clicks return the same order. Checkout and payment verification are also rate-limited.
- **Orders become paid only after server-side verification:** Stripe's signed webhook (plus a server check on the confirmation page), or Razorpay's signature + API check + signed webhook. Every path calls the `confirm_order_payment` database function. It re-checks the provider, amount and currency, then in one step marks the order paid, reduces stock and removes the bought items from the saved bag. Running it twice has no effect.
- **Paid orders are locked.** The database refuses changes to a paid order's market, currency, amounts or address. Admins can only change the fulfilment status.
- **Row Level Security** is on for every table. Visitors can only read active products; customers can only see their own cart and orders; only admins can change products and order statuses. Orders can't be created from the browser at all.
- **Guest carts** are stored in the browser (localStorage). After login they're merged into the `cart_items` table, so the bag follows the customer across devices.
