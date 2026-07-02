# Book My Ride

A cab booking website for fixed routes out of **Hisar**, with the core promise:
**we pick you up from home.** Customers book a private car or shared seats on a
fixed daily departure, enter a home pickup address (validated within the Hisar
service area), verify by email OTP, and pay **online (Razorpay)** or by
**cash on pickup (COD)**. Everyone gets an email confirmation, and there's an
admin dashboard to run the business.

## Features

- Attractive, mobile-first landing page with route search
- 3 seeded routes: Hisar → Chandigarh, Peeragarhi (Delhi), Delhi IGI Airport
- Private car (₹4000) and shared seat (₹500/seat) bookings
- **Home pickup** with Google Maps address check, rejected if outside the
  Hisar radius (default 10 km, editable in admin)
- Passwordless **email OTP** login
- **Online payment (Razorpay)** and **Cash on pickup (COD)**
- Automatic **seat tracking** (trip marks full / private-booked automatically)
- **Booking history** for logged-in users (upcoming + past)
- **Confirmation emails** with route, date, time, pickup and amount
- **Admin dashboard**: manage routes, cars, schedules, service radius, generate
  trips, and confirm/cancel bookings

## Tech stack

- Next.js 16 (App Router) + TypeScript
- Prisma ORM + **PostgreSQL** (Neon/Supabase — works locally and on serverless)
- Tailwind CSS v4
- Razorpay (payments), Google Maps (geocoding), Nodemailer (email), jose (auth)

## Getting started

You need a Postgres connection string. The easiest free option is a
[Neon](https://neon.tech) database — create one and copy its connection string
into `DATABASE_URL`. The same URL works locally and in production.

```bash
npm install                 # also runs `prisma generate`
cp .env.example .env        # paste your DATABASE_URL + set SESSION_SECRET
npm run db:push             # creates the tables in your Postgres
npm run db:seed             # seeds routes, cars, schedules, admin, service area
npm run dev                 # http://localhost:3000
```

### Dev mode conveniences

With no external keys configured, the app is still fully usable:

- **Email/OTP**: printed to the server console (the login screen also shows the
  code in dev).
- **Payments**: run in mock mode and auto-confirm.
- **Geocoding**: a built-in fallback accepts addresses containing "Hisar" and
  rejects everything else.

### Admin access

Log in with the `ADMIN_EMAIL` from your `.env` (default
`admin@bookmyride.local`). That account is granted admin on first login and can
reach `/admin`.

## Deploy for free (Vercel + Neon)

This app runs great on Vercel's free Hobby plan with a free Neon Postgres
database. No paid services required.

### 1. Create a free Postgres (Neon)
1. Sign up at [neon.tech](https://neon.tech) and create a project.
2. Copy the **connection string** (it looks like
   `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require`).

### 2. Create the schema + seed data
From your machine, with `DATABASE_URL` in `.env` set to the Neon string:

```bash
npm run db:push     # create all tables in Neon
npm run db:seed     # add routes, Baleno cars, schedules, admin user
```

### 3. Push the code to GitHub
Create a repo and push this project (Vercel deploys from Git).

### 4. Deploy on Vercel
1. Sign up at [vercel.com](https://vercel.com) and **Import** your GitHub repo.
   Vercel auto-detects Next.js — no build config needed.
2. Before the first deploy, add these **Environment Variables** in the Vercel
   project settings:

   | Key | Value |
   | --- | --- |
   | `DATABASE_URL` | your Neon connection string |
   | `SESSION_SECRET` | a long random string (`openssl rand -base64 32`) |
   | `ADMIN_EMAIL` | the email you'll use as admin |
   | `NEXT_PUBLIC_BASE_URL` | your Vercel URL, e.g. `https://your-app.vercel.app` |

3. Click **Deploy**. Your site is live at `https://<project>.vercel.app`. 🎉

`prisma generate` runs automatically on install (via the `postinstall` script),
so the client is built with the correct engine for Vercel's runtime.

### What works without any API keys (deferred setup)
The app is designed to run without external services configured:

- **Payments (Razorpay not set):** online payment runs in *mock* mode and
  auto-confirms — fine for a demo. **Cash on pickup (COD) works fully.** Don't
  accept real online payments until you add real keys.
- **Maps (Google key not set):** the pickup check uses a built-in fallback that
  accepts addresses containing "Hisar" and rejects others.
- **Email/OTP (SMTP not set):** ⚠️ login codes are printed to the **server logs**
  (Vercel → your project → *Logs*) instead of being emailed. You can log in as
  admin this way, but **real visitors can't receive their OTP**, so set up email
  before promoting the site (see below).

### Enabling the real services later
When you're ready, just add the env vars in Vercel (no code changes needed) and
redeploy:

1. **Email** (needed for real logins): a free sender like
   [Resend](https://resend.com) or a Gmail app password. Set `SMTP_HOST`,
   `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`.
2. **Payments**: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`,
   `NEXT_PUBLIC_RAZORPAY_KEY_ID`.
3. **Maps**: `GOOGLE_MAPS_SERVER_KEY` (Geocoding) and
   `NEXT_PUBLIC_GOOGLE_MAPS_KEY` (Places autocomplete).

### Updating the schema later
After changing `prisma/schema.prisma`, run `npm run db:push` against your Neon
DB to apply the changes. (This project uses `db push` rather than migration
files for simplicity.)

## Key scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run db:push` | Create/update tables from the schema |
| `npm run db:seed` | Seed sample data |
| `npm run db:reset` | Wipe DB and reseed |

## Project layout

```
app/            Pages (landing, search, book, account, login) + admin + API routes
components/     UI primitives, navbar/footer, search & booking forms
lib/            prisma, session, otp, email, geo, pickup, razorpay, trips helpers
prisma/         schema + seed
```

## Roadmap (deferred)

- SMS OTP + SMS notifications (MSG91/Twilio + DLT)
- Return-trip scheduling
- Driver assignment / live tracking / ratings
- Coupons, refunds and cancellation policy
