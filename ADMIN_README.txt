CETER Technology Admin Runbook
================================

Purpose
-------
Use this guide to run the admin area, verify that the core workflows work, and walk through every admin page without missing any operational section.

Quick Start
-----------
1. Install dependencies:
   npm install

2. Confirm environment variables are present:
   POSTGRES_PRISMA_URL
   POSTGRES_URL_NON_POOLING
   SUPABASE_URL
   SUPABASE_SERVICE_ROLE_KEY
   SUPABASE_PUBLISHABLE_KEY

3. Generate Prisma Client:
   npx prisma generate

4. Apply database migrations or confirm the Supabase database already has the current schema:
   npx prisma migrate dev

5. Seed baseline data if the database is empty:
   npm run seed

6. Create or confirm an admin user:
   npm run setup:admin

   To reset an existing admin password, run the same command with ADMIN_EMAIL,
   ADMIN_NAME, and ADMIN_PASSWORD supplied through the shell or Vercel CLI.
   The script updates Supabase Auth and grants the local Super Admin role.

7. Start the development server:
   npm run dev

8. Open the site:
   http://localhost:3000

9. Open admin login:
   http://localhost:3000/admin/login

Before Testing Admin
--------------------
Confirm these items first:
- The terminal does not show Prisma connection errors.
- The browser can open /, /products, /cart, and /admin/login.
- The admin account can sign in and reach /admin.
- Supabase Storage buckets exist if you plan to upload media:
  product-images
  website-media
  product-videos
- The product catalogue has at least one category before creating products.
- The database has current Phase 4 through Phase 9 tables if automation, imports, media, marketing, and analytics are being tested.

Known Error Notes
-----------------
1. Prisma P2028 on /admin/automation
   Symptom: "Transaction API error: Unable to start a transaction in the given time."
   Cause: the automation page was loading many dashboard reads inside one Prisma transaction. The page only needs independent read queries, so a transaction is unnecessary and can time out when the database or pool is busy.
   Fix in this codebase: /admin/automation now uses Promise.all for those read-only dashboard queries.

2. crypto.randomUUID is not a function
   Symptom: clicking marketplace sync throws an unhandled rejection from src/components/ui/toast.tsx.
   Cause: some browser or development contexts do not expose crypto.randomUUID.
   Fix in this codebase: toast IDs now use crypto.randomUUID when available and fall back to a local Date.now plus Math.random ID.

3. React hydration mismatch mentioning data-qb-installed or __processed_...
   Symptom: React warns that server HTML attributes do not match the client.
   Likely cause: browser extensions injected attributes into the page before hydration.
   Admin action: test in a clean browser profile or incognito window with extensions disabled. This is not usually an app code failure when the mismatch attributes are extension-generated.

4. Failed to fetch RSC payload
   Symptom: browser falls back to full page navigation.
   Likely causes: development server restart, network interruption, LAN IP access issue, or stale client bundle during active development.
   Admin action: refresh the page, confirm the dev server is still running, and prefer http://localhost:3000 on the same machine. If using a LAN IP, confirm firewall and host binding.

Full Admin Walkthrough
----------------------
Use this order when validating the admin area.

1. Admin Login - /admin/login
   - Sign in with an admin account.
   - Confirm wrong credentials stay on the login page.
   - Confirm successful login redirects into /admin.
   - Confirm Sign out from the admin header returns access to a signed-out state.

2. Dashboard - /admin
   - Check the top metrics: products, categories, orders, and customers.
   - Use Marketplace product sync only when data sources are ready.
   - Confirm the Automation and Data Sources buttons navigate correctly.
   - Review Recent orders and confirm order totals, item counts, status, and dates look correct.
   - Review Admin activity and confirm recent mutations are logged.

3. Analytics - /admin/analytics
   - Review total revenue, total orders, average order value, and customer count.
   - Check Sales analytics for daily, weekly, and monthly revenue.
   - Check Orders over time, Sales by category, and Sales by product.
   - Check Product analytics for add-to-cart events, checkout starts, low stock, out of stock, and most viewed products.
   - Check Customer analytics for new customers, returning customers, average order frequency, and locations.
   - In Inventory dashboard, update one low stock threshold and confirm it saves.
   - Review Stock movement history if orders or inventory events exist.

4. Automation - /admin/automation
   - Confirm the page loads without Prisma P2028 transaction errors.
   - Check product, image, pricing, and source metrics.
   - Review Product intelligence pipeline status and latest automation jobs.
   - Click Sync Marketplace only when public data sources are configured.
   - Confirm a toast appears and does not throw crypto.randomUUID errors.
   - Review Automation schedules and run a safe job if needed.
   - Use Manual emergency override for targeted reruns by job type and data source.
   - Review Pricing intelligence rules.
   - Create a price rule with the correct scope: GLOBAL, CATEGORY, BRAND, or PRODUCT.
   - Check System health dashboard for running jobs, failed jobs, API errors, and last sync.
   - Review Automation exceptions for missing images, quality checks, and failed jobs.

5. Data Sources - /admin/data-sources
   - Review supported public source types.
   - Use Start sync only after sources are active and valid.
   - Create data sources for manufacturer, supplier, distributor, retailer, catalogue, or feed inputs.
   - Set connection type: API, EXCEL, CSV, XML, JSON, or WEB_CATALOGUE.
   - Set country, frequency, status, base URL, manufacturer, supplier, contact email, and notes.
   - Bootstrap priority brands to seed manufacturer connectors.
   - Add future suppliers before their live feed is available.
   - Review Source registry counts for product sources, supplier SKUs, imports, and jobs.
   - Edit a source and confirm changes persist.
   - Delete only sources that are safe to remove.

6. Marketing - /admin/marketing
   - Create a discount campaign with name, percentage, status, start date, end date, and selected products.
   - Create a coupon with code, discount, minimum order, expiry date, optional usage limit, and active status.
   - Review Featured product flags. These are set from the product edit screen.
   - Review Campaigns and Coupons lists.
   - Review Newsletter subscribers for export to Mailchimp, Brevo, or SendGrid.

7. Products - /admin/products
   - Confirm categories exist before creating a product.
   - Create a product with name, optional slug, description, category, brand, price, discount price, stock, low stock threshold, status, image URL or upload, gallery images or URLs, and technical specifications.
   - Use badges for Featured, New arrival, Best seller, and Promotion labels.
   - Review the Product list for image, name, category, price, stock, threshold, status, edit, and delete controls.
   - Open Edit product and update key fields.
   - Confirm image upload or image URL renders on the public product page.
   - Delete only test products or products that should be removed permanently.
   - Use Product automation link to inspect automated import processing.

8. Product AI - /admin/product-ai
   - Review processing queue, new products found, products enriched, products published, and needs attention metrics.
   - Run Sync marketplace only when sources are ready.
   - Review Discovery feed for detected product, brand, category, source, status, and date.
   - Review Recently enriched records.
   - Review Quality gate for issues blocking publication.
   - Open Automation from this page for deeper sync controls.

9. Bulk Import - /admin/import
   - Use this for Excel or CSV imports when public source automation is not enough.
   - Preview files before confirm.
   - Confirm successful records and failed records.
   - Download or inspect error reports when imports fail.
   - Review Recent imports for file name, type, imported records, failed records, admin, and date.

10. Product Import Automation - /admin/products/import-automation
   - Review detected source products, duplicate matches, missing images, and missing specifications.
   - Use the import automation client to preview and process product intelligence files.
   - Review Recent catalogue imports for file, source, detected, created, matched, and status.
   - Review Processing workflow from raw data to database product creation.
   - Review Background jobs and Latest automation jobs.

11. Media - /admin/media
   - Upload images or videos to the correct destination bucket and folder.
   - Optionally assign uploaded media to a product during upload.
   - Review storage bucket rules:
     product-images: printers, accessories, office-equipment
     website-media: banners, brands, promotions
     product-videos: products
   - Search media by filename, type, URL, or product.
   - Filter by all, images, or videos.
   - Assign or unassign media to products.
   - Copy media URLs and open media links to verify public access.
   - Delete only media that is not needed by a product or page.

12. Categories - /admin/categories
   - Create top-level categories and subcategories.
   - Use slugs only when a custom URL slug is required; otherwise let the app generate one.
   - Add descriptions for customer-facing category context.
   - Review product and child category counts.
   - Edit category name, slug, parent, and description.
   - Delete only empty categories with no products and no subcategories.

13. Orders - /admin/orders
   - Review each customer order number, date, customer name, phone, email, items, total, payment method, and payment status.
   - Update order status through PENDING, PROCESSING, SHIPPED, DELIVERED, or CANCELLED.
   - Open Details to confirm the public order confirmation page renders correctly.
   - Confirm stock movement and analytics update after order activity where applicable.

14. Customers - /admin/customers
   - Review names, emails, order counts, total spent, join dates, and roles.
   - Promote only trusted users to ADMIN.
   - Confirm the current admin is marked "You".
   - Do not remove your own admin access; the server action blocks this.

15. Settings - /admin/settings
   - Confirm Admin protection is described as active.
   - Confirm Supabase Storage environment is detected.
   - Review Admin logs for create, update, delete, sync, upload, and role-change actions.

Final Smoke Test
----------------
Run this after admin changes:
1. Sign in at /admin/login.
2. Visit every admin route in the walkthrough above.
3. Create or update one harmless record, such as a test category or low stock threshold.
4. Confirm the Admin logs page records the action.
5. Visit /products and one product detail page.
6. Confirm no server terminal errors repeat for Prisma P2028 or crypto.randomUUID.
7. Run:
   npm run lint
8. Run:
   npm run build

Operational Notes
-----------------
- Prefer public source automation for catalogue growth, and use Excel or CSV import as a fallback.
- Keep products in DRAFT until image, category, specifications, pricing, and stock are correct.
- Use NEEDS_ATTENTION for products requiring review.
- Use ACTIVE only when a product is ready for customers.
- Use OUT_OF_STOCK instead of deleting products that should remain visible but unavailable.
- Review automation exceptions after every marketplace sync.
- Review failed jobs before rerunning a sync repeatedly.
- Browser-extension hydration warnings should be checked in a clean profile before treating them as app defects.
