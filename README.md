# CETER Technology

Simple ecommerce catalogue management for CETER Technology.

## Operating Model

Admin uploads the approved Excel template, the system validates rows against existing categories, products import as drafts, admin reviews and publishes products, and customers view the published catalogue.

## Required Environment

```bash
POSTGRES_PRISMA_URL=
POSTGRES_URL_NON_POOLING=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_WHATSAPP_NUMBER=
ADMIN_WHATSAPP_NUMBER=
PAYMENT_CALLBACK_SECRET=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_GA_ID=
SENTRY_DSN=
PRISMA_PG_POOL_MAX=5
PRISMA_PG_IDLE_TIMEOUT_MS=30000
PRISMA_PG_CONNECTION_TIMEOUT_MS=15000
NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=
```

## Local Development

```bash
npm install
npx prisma generate
npm run dev
```

## Database

```bash
npx prisma migrate dev
npx prisma generate
```

## Tests

```bash
npm run lint
npx tsc --noEmit
npm run build
npm run test:catalogue
```
