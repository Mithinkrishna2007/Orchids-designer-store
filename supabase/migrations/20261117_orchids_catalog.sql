-- ORCHIDS private catalog CMS. Run in Supabase SQL Editor as a project owner.
-- The only allowed administrator is configured here and is also checked by Vercel.
create extension if not exists pgcrypto;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null check (char_length(trim(name)) between 1 and 80),
  display_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  name text not null check (char_length(trim(name)) between 1 and 160),
  category_id uuid not null references public.categories(id) on delete restrict,
  description text,
  main_image_path text,
  focal_x smallint not null default 50 check (focal_x between 0 and 100),
  focal_y smallint not null default 50 check (focal_y between 0 and 100),
  display_order integer not null default 0,
  status text not null default 'draft' check (status in ('draft', 'published', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.products add column if not exists legacy_id text;
create unique index if not exists products_legacy_id_unique on public.products (legacy_id) where legacy_id is not null;

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  path text not null unique,
  alt_text text,
  focal_x smallint not null default 50 check (focal_x between 0 and 100),
  focal_y smallint not null default 50 check (focal_y between 0 and 100),
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists categories_visible_order_idx on public.categories (is_visible, display_order);
create index if not exists products_public_order_idx on public.products (status, category_id, display_order);
create index if not exists product_images_product_order_idx on public.product_images (product_id, display_order);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at before update on public.categories for each row execute function public.set_updated_at();
drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at before update on public.products for each row execute function public.set_updated_at();

create or replace function public.is_orchids_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(lower(auth.jwt() ->> 'email') = 'mithinkrishnanns@gmail.com', false);
$$;
grant execute on function public.is_orchids_admin() to anon, authenticated;

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;

drop policy if exists "Public reads visible categories" on public.categories;
create policy "Public reads visible categories" on public.categories for select using (is_visible = true);
drop policy if exists "Admin manages categories" on public.categories;
create policy "Admin manages categories" on public.categories for all to authenticated using (public.is_orchids_admin()) with check (public.is_orchids_admin());

drop policy if exists "Public reads published products" on public.products;
create policy "Public reads published products" on public.products for select using (status = 'published');
drop policy if exists "Admin manages products" on public.products;
create policy "Admin manages products" on public.products for all to authenticated using (public.is_orchids_admin()) with check (public.is_orchids_admin());

drop policy if exists "Public reads published product images" on public.product_images;
create policy "Public reads published product images" on public.product_images for select using (
  exists (select 1 from public.products p where p.id = product_images.product_id and p.status = 'published')
);
drop policy if exists "Admin manages product images" on public.product_images;
create policy "Admin manages product images" on public.product_images for all to authenticated using (public.is_orchids_admin()) with check (public.is_orchids_admin());

-- Product photography uses public URLs; write and delete access remains administrator-only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 10485760, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists "Admin manages ORCHIDS product files" on storage.objects;
create policy "Admin manages ORCHIDS product files" on storage.objects for all to authenticated
using (bucket_id = 'product-images' and public.is_orchids_admin())
with check (bucket_id = 'product-images' and public.is_orchids_admin());

-- Seed the five collections only when they do not exist. This never removes legacy files/products.
insert into public.categories (slug, name, display_order) values
  ('exclusive', 'Exclusive Collection', 1),
  ('new', 'New Arrivals', 2),
  ('sarees', 'Designer Sarees', 3),
  ('kurtis', 'Premium Kurtis', 4),
  ('ethnic', 'Ethnic Wear', 5)
on conflict (slug) do nothing;
