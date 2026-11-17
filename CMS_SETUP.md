# ORCHIDS private CMS setup

The public website remains a static, safe fallback. The database can enhance it with published products, but an unavailable or empty catalogue never clears the original product cards.

## One-time database update

In Supabase SQL Editor, run the committed base migration `supabase/migrations/20261117_orchids_catalog.sql` first if it has not already been applied. Then run `supabase/migrations/20261117_210000_orchids_product_safety.sql` once. The incremental migration adds tags and an atomic save function; it does not drop, truncate, or recreate tables.

The function is executable only by Supabase's `service_role`. The browser never receives that key. The Vercel API verifies the logged-in user and email allowlist before it uses the service role.

## Required environment variables

Set these only in Vercel (or a local `.env` that is never committed):

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_EMAIL=mithinkrishnanns@gmail.com`
- `SUPABASE_STORAGE_BUCKET=product-images`

Disable public sign-up in Supabase Auth. Create only the authorised administrator account through the Supabase dashboard.

## Weekly New Arrivals workflow

1. Sign in at `/admin` with the authorised account.
2. Select **Add product**.
3. Choose **New Arrivals**, upload the main photograph, and optionally add extra photographs.
4. Save as **Draft** to keep it private, or **Published** to show it publicly.
5. To remove an older arrival from public view without deleting it, open it and set its status to **Hidden**. It remains restorable from the dashboard.

Replacing or removing product photographs is confirmed in the dashboard. New uploads receive unique storage paths. A database transaction updates the product and all of its image links together, so a failed save retains the previous relationship.

## Safety notes

- Do not run the static importer routinely. It is a one-time migration aid only.
- Database product deletion requires explicit confirmation. Storage files are deleted only after no product references them.
- Deploy only after running `npm run check` and `npm test` locally. This repository change does not deploy or change production Supabase data by itself.
