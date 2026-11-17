# ORCHIDS private collection manager

The private dashboard is available at `/admin`. It is deliberately not linked from the public navigation and is marked `noindex`.

## What was added

- Supabase Auth sign-in, restricted to `mithinkrishnanns@gmail.com`
- Categories, product status, ordering, main/additional images and focal-point controls
- Product draft, publish, hide/restore, individual and bulk delete flows
- Explicit confirmation before permanent product/image deletion
- Supabase Storage uploads for JPG, PNG and WebP files up to 10 MB
- Supabase RLS and Vercel server-side checks for all mutations
- Public collections that read published database content without a Git commit or Vercel redeploy
- Existing `assets/js/data.js` content remains the automatic public fallback until setup/import is complete

## 1. Create/configure Supabase

1. Create a Supabase project in the region closest to Coimbatore.
2. In **Authentication → Providers → Email**, enable email/password sign-in only if it is required for the authorised account. In **Authentication → Settings**, disable new-user sign-ups.
3. Create the authorised user manually in **Authentication → Users** with the exact email `mithinkrishnanns@gmail.com`. Set its password in Supabase; it is never stored in this repository.
4. Open the SQL Editor and run [`supabase/migrations/20261117_orchids_catalog.sql`](supabase/migrations/20261117_orchids_catalog.sql) in full.
5. Confirm that the `product-images` Storage bucket exists and is public. The SQL migration creates it and makes all write/delete actions administrator-only. Public read access is needed because product photographs appear on the public website.

## 2. Configure Vercel environment variables

Add these in **Vercel → Project → Settings → Environment Variables** for Production and Preview. Use the exact values from Supabase; do not add them to Git.

| Variable | Purpose |
| --- | --- |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Public client key, safely supplied to the dashboard by `/api/public-config` |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only Vercel API key — never expose it in the browser |
| `ADMIN_EMAIL` | `mithinkrishnanns@gmail.com` |
| `SUPABASE_STORAGE_BUCKET` | `product-images` |

Use [`.env.example`](.env.example) as the names-only local template. Never commit `.env` files.

## 3. Preserve and optionally import the current collection

All existing HTML, images and `assets/js/data.js` entries stay untouched. The public site continues to use them if Supabase is empty or unavailable.

To copy the existing static products into Supabase Storage/database after the migration:

```powershell
$env:SUPABASE_URL = "https://YOUR_PROJECT.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY = "YOUR_SERVICE_ROLE_KEY"
$env:SUPABASE_STORAGE_BUCKET = "product-images"
npm install
npm run import:catalog
```

The importer only uploads/copies; it never deletes current local image files. Run it once. It maps the current five collection groups: Exclusive Collection, New Arrivals, Designer Sarees, Premium Kurtis and Ethnic Wear.

## 4. Admin operation

1. Go to `https://orchidsstudio.in/admin`.
2. Sign in with the authorised Supabase account.
3. Add/edit a product, upload a main photograph, select a category and publish it when ready.
4. Use **Hide** or **Draft** to remove a product from the public website while keeping it recoverable.
5. Use **Delete** only after reviewing the confirmation. The optional image checkbox removes only images that are no longer referenced by another product.
6. To delete a category with products, the dashboard requires you to choose another category first. It never silently deletes those products.

Published changes are fetched by the public collections page from `/api/public-catalog` and are CDN-cached for up to 45 seconds. No GitHub push or Vercel redeploy is required for ordinary catalog changes.

## 5. Vercel deployment

1. Commit the added source files to the existing `main` branch and push normally.
2. Vercel will install the root dependency from `package.json` and deploy `/api/*` as serverless functions.
3. Add the environment variables above, then redeploy once so Vercel can make them available.
4. Confirm `/api/public-config` returns `{ "configured": true }` and then use `/admin`.

## Security and verification checklist

- A non-authorised Supabase user is rejected both in the dashboard and in every `/api/admin/*` endpoint.
- RLS allows public reads only for visible/published catalog records.
- Storage modification policies allow only the authorised email.
- Service-role credentials are used only inside Vercel API functions.
- Product images are validated to JPG/PNG/WebP and 10 MB per file in the dashboard.
- Public product cards preserve the existing frame styling and support an adjustable focal position.
- Test login, logout, create, publish, edit, hide, restore, delete, bulk delete, category reassignment and image upload in a Supabase Preview environment before production use.

## Remaining owner action

Supabase project creation, the authorised account password, SQL execution, Vercel environment variables and the first deployment require access to the owner’s Supabase/Vercel accounts, so they cannot be completed safely from this workspace.
