-- MySawari Phase 1 foundation migration.
-- Review and run in Supabase SQL Editor only after confirming the target project.
-- This migration does not create Auth users or set any account to captain/admin.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default 'MySawari User'
    check (char_length(full_name) between 1 and 120),
  phone text unique,
  avatar_url text,
  role text not null default 'rider'
    check (role in ('rider', 'captain', 'admin')),
  is_suspended boolean not null default false,
  is_demo boolean not null default false,
  demo_session_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vehicle_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code in ('bike', 'scooter', 'car')),
  display_name text not null,
  capacity smallint not null check (capacity between 1 and 8),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists vehicle_types_set_updated_at on public.vehicle_types;
create trigger vehicle_types_set_updated_at
before update on public.vehicle_types
for each row execute function public.set_updated_at();

-- New Auth users get a rider profile by default. Role metadata supplied by the
-- browser is deliberately ignored; captain/admin promotion is an admin operation.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), 'MySawari User'),
    'rider'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_mysawari on auth.users;
create trigger on_auth_user_created_mysawari
after insert on auth.users
for each row execute procedure public.handle_new_auth_user();

alter table public.profiles enable row level security;
alter table public.vehicle_types enable row level security;

-- Authenticated users can read their own profile only.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
to authenticated
using (auth.uid() = id);

-- Users may update only their own row. Column-level grants below restrict fields.
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- Active vehicle catalog is readable by authenticated clients.
drop policy if exists "vehicle_types_read_active" on public.vehicle_types;
create policy "vehicle_types_read_active"
on public.vehicle_types for select
to authenticated
using (is_active = true);

-- Remove broad update rights, then grant only editable profile columns.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, phone, avatar_url) on public.profiles to authenticated;

revoke all on public.vehicle_types from anon, authenticated;
grant select on public.vehicle_types to authenticated;

-- Seed catalog records only if not already present. Capacities are demo defaults
-- and must be confirmed by the MySawari team before launch.
insert into public.vehicle_types (code, display_name, capacity, is_active)
values
  ('bike', 'Bike', 1, true),
  ('scooter', 'Scooter', 1, true),
  ('car', 'Car', 4, true)
on conflict (code) do nothing;

create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists profiles_demo_idx on public.profiles(is_demo, demo_session_id);
create index if not exists vehicle_types_active_idx on public.vehicle_types(is_active);
