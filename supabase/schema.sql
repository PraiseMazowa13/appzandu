-- =====================================================================
-- CODES PROMO + colonnes de remise sur les commandes
-- =====================================================================
create table if not exists public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  percent integer not null default 0 check (percent >= 0 and percent <= 100),
  is_active boolean not null default true,
  expires_at timestamptz,
  min_order_cents integer,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.promo_codes to authenticated;
grant all on public.promo_codes to service_role;

alter table public.promo_codes enable row level security;

create policy promo_admin_all on public.promo_codes
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

alter table public.orders add column if not exists promo_code text;
alter table public.orders add column if not exists discount_cents integer not null default 0;

-- =====================================================================
-- Zandu — Schéma Supabase complet
-- À coller dans SQL Editor d'un nouveau projet Supabase, puis Run.
-- =====================================================================

-- ---------- Extensions ----------
create extension if not exists "pgcrypto";

-- ---------- Enum des rôles ----------
do $$ begin
  create type public.app_role as enum ('admin', 'customer');
exception when duplicate_object then null; end $$;

-- =====================================================================
-- TABLES
-- =====================================================================

-- ---------- profiles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create policy profiles_select_own on public.profiles
  for select to authenticated using (auth.uid() = id);
create policy profiles_insert_own on public.profiles
  for insert to authenticated with check (auth.uid() = id);
create policy profiles_update_own on public.profiles
  for update to authenticated using (auth.uid() = id);

-- ---------- user_roles ----------
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create policy roles_select_own on public.user_roles
  for select to authenticated using (auth.uid() = user_id);

-- Fonction sécurisée pour vérifier un rôle (évite la récursion RLS)
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

-- ---------- products ----------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text,
  price_cents integer not null,
  compare_at_price_cents integer,
  discount_percent integer not null default 0,
  stock integer not null default 0,
  image_url text,
  badge text,
  free_shipping boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.products to anon;
grant select, insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;

create policy products_public_read on public.products
  for select to public using (is_active = true);
create policy products_admin_all on public.products
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ---------- orders ----------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  total_cents integer not null,
  status text not null default 'pending',
  customer_name text,
  customer_phone text,
  customer_address text,
  customer_city text,
  created_at timestamptz not null default now()
);
grant select, insert on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;

create policy orders_insert_own on public.orders
  for insert to authenticated with check (auth.uid() = user_id);
create policy orders_select_own on public.orders
  for select to authenticated using (auth.uid() = user_id);
create policy orders_admin_select on public.orders
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));

-- ---------- order_items ----------
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null,
  product_name text not null,
  unit_price_cents integer not null,
  quantity integer not null
);
grant select, insert on public.order_items to authenticated;
grant all on public.order_items to service_role;
alter table public.order_items enable row level security;

create policy items_insert_own on public.order_items
  for insert to authenticated
  with check (exists (
    select 1 from public.orders o
    where o.id = order_items.order_id and o.user_id = auth.uid()
  ));
create policy items_select_own on public.order_items
  for select to authenticated
  using (exists (
    select 1 from public.orders o
    where o.id = order_items.order_id
      and (o.user_id = auth.uid() or public.has_role(auth.uid(), 'admin'))
  ));

-- ---------- favorites ----------
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);
grant select, insert, delete on public.favorites to authenticated;
grant all on public.favorites to service_role;
alter table public.favorites enable row level security;

create policy favorites_select_own on public.favorites
  for select to authenticated using (auth.uid() = user_id);
create policy favorites_insert_own on public.favorites
  for insert to authenticated with check (auth.uid() = user_id);
create policy favorites_delete_own on public.favorites
  for delete to authenticated using (auth.uid() = user_id);

-- =====================================================================
-- Trigger: création automatique du profil + rôle à l'inscription
-- Promotion auto de pmazowa@gmail.com en admin
-- =====================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_admin_email boolean := lower(coalesce(new.email, '')) = 'pmazowa@gmail.com';
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, case when is_admin_email then 'admin'::app_role else 'customer'::app_role end)
  on conflict (user_id, role) do nothing;

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- Storage bucket pour les images produits (privé + URLs signées)
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', false)
on conflict (id) do nothing;

-- =====================================================================
-- FIN
-- =====================================================================
