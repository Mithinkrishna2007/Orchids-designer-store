-- Incremental ORCHIDS CMS hardening. Safe to run once after 20261117_orchids_catalog.sql.
-- This migration only adds a column and a transactional save function. It never drops or clears data.
alter table public.products add column if not exists tags text[] not null default '{}'::text[];

create or replace function public.save_orchids_product(
  p_id uuid,
  p_legacy_id text,
  p_name text,
  p_category_id uuid,
  p_description text,
  p_main_image_path text,
  p_focal_x smallint,
  p_focal_y smallint,
  p_display_order integer,
  p_status text,
  p_tags text[],
  p_images jsonb
)
returns public.products
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  saved public.products%rowtype;
  image jsonb;
begin
  if p_name is null or char_length(trim(p_name)) = 0 then raise exception 'A product name is required'; end if;
  if p_category_id is null or not exists (select 1 from public.categories where id = p_category_id) then raise exception 'A valid category is required'; end if;
  if p_status not in ('draft', 'published', 'hidden') then raise exception 'Invalid product status'; end if;
  if p_status = 'published' and coalesce(trim(p_main_image_path), '') = '' then raise exception 'A main photograph is required before publishing'; end if;
  if p_images is null or jsonb_typeof(p_images) <> 'array' then raise exception 'Product images must be an array'; end if;
  if exists (select 1 from jsonb_array_elements(p_images) item where coalesce(trim(item ->> 'path'), '') = '') then raise exception 'Every additional image needs a storage path'; end if;
  if exists (select item ->> 'path' from jsonb_array_elements(p_images) item group by item ->> 'path' having count(*) > 1) then raise exception 'The same additional image cannot be added twice'; end if;
  if exists (select 1 from jsonb_array_elements(p_images) item where item ->> 'path' = p_main_image_path) then raise exception 'The main image cannot also be an additional image'; end if;

  if p_id is null then
    insert into public.products (legacy_id, name, category_id, description, main_image_path, focal_x, focal_y, display_order, status, tags)
    values (nullif(trim(p_legacy_id), ''), trim(p_name), p_category_id, nullif(trim(coalesce(p_description, '')), ''), nullif(trim(coalesce(p_main_image_path, '')), ''), p_focal_x, p_focal_y, p_display_order, p_status, coalesce(p_tags, '{}'::text[]))
    returning * into saved;
  else
    update public.products set legacy_id = coalesce(nullif(trim(p_legacy_id), ''), legacy_id), name = trim(p_name), category_id = p_category_id, description = nullif(trim(coalesce(p_description, '')), ''), main_image_path = nullif(trim(coalesce(p_main_image_path, '')), ''), focal_x = p_focal_x, focal_y = p_focal_y, display_order = p_display_order, status = p_status, tags = coalesce(p_tags, '{}'::text[])
    where id = p_id returning * into saved;
    if not found then raise exception 'Product not found'; end if;
  end if;

  delete from public.product_images where product_id = saved.id;
  for image in select * from jsonb_array_elements(p_images) loop
    insert into public.product_images (product_id, path, alt_text, focal_x, focal_y, display_order)
    values (saved.id, trim(image ->> 'path'), nullif(trim(coalesce(image ->> 'alt_text', '')), ''), greatest(0, least(100, coalesce((image ->> 'focal_x')::smallint, 50))), greatest(0, least(100, coalesce((image ->> 'focal_y')::smallint, 50))), coalesce((image ->> 'display_order')::integer, 0));
  end loop;
  return saved;
end;
$$;

revoke all on function public.save_orchids_product(uuid, text, text, uuid, text, text, smallint, smallint, integer, text, text[], jsonb) from public;
grant execute on function public.save_orchids_product(uuid, text, text, uuid, text, text, smallint, smallint, integer, text, text[], jsonb) to service_role;
