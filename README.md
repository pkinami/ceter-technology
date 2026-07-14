# CETER Technology Platform

Production-ready e-commerce platform for CETER Technology, built with Next.js App Router, Supabase, Prisma, admin operations, checkout, analytics, marketing tools, SEO, and WhatsApp ordering.

## Required Environment

Set these in Vercel and locally:

```bash
POSTGRES_PRISMA_URL=
POSTGRES_URL_NON_POOLING=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_PUBLISHABLE_KEY=
```

Recommended production variables:

```bash
NEXT_PUBLIC_WHATSAPP_NUMBER=254700000000
ADMIN_WHATSAPP_NUMBER=254700000000
PAYMENT_CALLBACK_SECRET=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_GA_ID=
SENTRY_DSN=
```

## Local Development

```bash
npm install
npx prisma generate
npm run dev
```

## Database

Prisma is configured for Supabase PostgreSQL. After schema changes:

```bash
npx prisma migrate dev
npx prisma generate
```

For production, run the generated migration against Supabase before deploying the app.

Production runtime audit:

```bash
npm run audit:prod
```

If baseline catalogue and RBAC data are missing:

```bash
set CONFIRM_PRODUCTION_SETUP=seed
npm run setup:prod
```

Create or reset an admin account without hardcoded credentials:

```bash
set ADMIN_EMAIL=admin@example.com
set ADMIN_NAME=CETER Admin
set ADMIN_PASSWORD=
npm run setup:admin
```

If `ADMIN_PASSWORD` is not set, the script prompts for it. Existing Supabase Auth users have their password reset and their local user is granted the Super Admin role.

## Production Build

```bash
npm run build
```

Verify:

- Website renders on desktop and mobile.
- Product pages use `/products/[slug]` URLs.
- `/robots.txt` and `/sitemap.xml` respond.
- Admin analytics and marketing pages require admin access.
- Checkout creates orders and records purchase analytics.
- WhatsApp buttons open with populated order messages.

## Deployment

Recommended stack:

- Frontend: Vercel
- Database: Supabase PostgreSQL
- Storage: Supabase Storage
- Domain: `cetertechnology.com`

Deployment steps:

1. Create the Supabase production project and storage buckets.
2. Add all required environment variables in Vercel.
3. Apply Prisma migrations to Supabase.
4. Deploy the main branch to Vercel.
5. Configure `cetertechnology.com` DNS in Vercel.
6. Submit `https://cetertechnology.com/sitemap.xml` in Google Search Console.

## Monitoring Integrations

The platform is prepared for:

- Sentry through `SENTRY_DSN`
- Google Analytics through `NEXT_PUBLIC_GA_ID`
- Google Search Console through the sitemap and domain verification
- WhatsApp Business API by replacing notification placeholders in `src/lib/notifications.ts`
- Mailchimp, Brevo, or SendGrid by exporting or syncing `NewsletterSubscriber`
