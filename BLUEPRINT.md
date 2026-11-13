# MySawari (RideMorph): Full Hackathon Build Blueprint

A Rapido-style ride-booking app with an Igloo + Lusion inspired 3D scroll interface, where a car rolls, then morphs into a bike, then a scooter as the user scrolls or touches.
**Team:** Polar Geeks (4 people) | **Format:** 24 hours | **Stack:** React + Vite + Three.js + Supabase + Express | **Budget:** free tools

---

## 0. Read this first
### Assumptions
- Ride-hailing problem: bike taxi, auto/scooter, cab (Rapido style).
- Demo city: Belagavi (map centre `15.8497, 74.4977`). Currency: `INR`.
- The one rule that decides whether you win: Build the ride flow (request, accept, track, complete) FIRST and make it work end to end. The 3D morph has a 4-level fallback ladder, so it can never block the demo.

---

## 1. Design References & Adaptation

### Reference A: Igloo Inc (igloo.inc)
- **Visuals:** Monochrome icy grey-white world, soft fog, almost no colour. Frost greys behind the 3D vehicle, one cold blue glow.
- **Particle morph:** Objects built from thousands of tiny particles assembling out of noise. A car assembles from particles; particles flow into a bike, then a scooter.
- **Portal & HUD:** Glowing ring portal transition; tiny monospace HUD text (`VEHICLE 02/03`, `ETA 4 MIN`, `FARE INR 62`).
- **Scroll timeline:** Scroll progress controls the morph.

### Reference B: Lusion (lusion.co)
- **Content aesthetic:** Off-white / lavender page (`#F1F0FA`), huge black grotesk headings.
- **Navigation:** Floating pill buttons top right (`BOOK NOW`, `MENU`).
- **Signature graphics:** Blue road-ribbon sweeping across sections ending at a pin.
- **Card styling:** White cards, radius 28px, title + tiny tag row in mono, arrow on hover.
- **Feel:** Smooth, eased scrolling (Lenis).

---

## 2. Problem & User Roles

- **Problem:** Urban and semi-urban commuters need quick, affordable, trustworthy rides.
- **User Roles:**
  - **Rider:** Register, book, see fare, track ride, cancel (before pickup), rate, view history, edit profile.
  - **Captain:** Register vehicle, go online/offline, see nearby requests, accept, update ride status, view earnings.
  - **Admin:** View all rides, users, captains, revenue; start demo captain simulator; suspend a user.

---

## 3. Solution Identity
- **Name:** MySawari (RideMorph)
- **Tagline:** One tap. Any ride.
- **Core concept:** The vehicle you choose is a living 3D object that transforms (car, bike, scooter) as you scroll or touch.
- **Differentiators:**
  1. Particle-morph vehicle selector
  2. Live fare comparison (Cab vs Bike vs Scooter)
  3. In-trip safety panel (share trip link + SOS button)
  4. Reliable demo mode with simulated captains

---

## 4. Ride Lifecycle
```
requested -> accepted -> arriving -> in_progress -> completed
     \-> cancelled (by rider or captain before in_progress)
```

- **Request:** Rider taps Confirm Ride -> Express validates and computes fare, inserts `rides` row (`status='requested'`).
- **Accept:** Captain taps Accept -> Express checks ride status and captain availability atomically (`WHERE status='requested'`), updates to `accepted`.
- **Progress:** Captain taps Arriving, Start, Complete -> Express updates `status`, logs `ride_events`.
- **Realtime:** Rider's UI listens via Supabase Realtime for instant updates.

---

## 5. Design System

### Colour Tokens
- `--bg`: `#F1F0FA` (Lusion lavender-white)
- `--surface`: `#FFFFFF`
- `--ink`: `#0A0A14` (Text, primary buttons)
- `--ink-2`: `#5B5B73` (Secondary text)
- `--line`: `#DCDAF0` (Borders)
- `--blue`: `#3A4DFF` (Primary accent, ribbon, links)
- `--cyan`: `#45E0F2` (Glow, particles at morph peak)
- `--amber`: `#FFC21A` (Price, live status dot)
- `--red`: `#EF2B3E` (SOS, cancel)
- `--frost-1` / `2` / `3`: `#E9ECF2` / `#C9CFDA` / `#8E96A6` (Igloo 3D stage and particles)
- `--night`: `#0B0D14` (Captain and admin dark panels)

### Typography
- Headings & Body: **Instrument Sans**
- HUD / Mono: **JetBrains Mono**

---

## 6. Architecture & Tech Stack

- **Monorepo:** `/frontend` and `/backend`
- **Frontend:** React + Vite + Tailwind CSS + Three.js / React Three Fiber + GSAP + Lenis + Leaflet
- **Backend:** Node.js + Express (ES Modules)
- **Database / Auth / Realtime:** Supabase (PostgreSQL)
- **Routing & Geocoding:** OSRM & Nominatim via Express API proxy

---

## 7. Database Schema (Supabase SQL)

```sql
create extension if not exists pgcrypto;

create type user_role as enum ('rider','captain','admin');
create type ride_status as enum ('requested','accepted','arriving','in_progress','completed','cancelled');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  role user_role not null default 'rider',
  is_suspended boolean not null default false,
  created_at timestamptz not null default now()
);

create table vehicle_types (
  id smallint primary key,
  code text unique not null,
  label text not null,
  seats smallint not null,
  base_fare numeric(8,2) not null,
  per_km numeric(8,2) not null,
  per_min numeric(8,2) not null,
  min_fare numeric(8,2) not null
);
insert into vehicle_types values
  (1,'cab','Cab',4,50,14,1.5,80),
  (2,'bike','Bike Taxi',1,20,6,0.5,30),
  (3,'scooter','Scooter / Auto',2,30,9,0.8,45);

create table captain_profiles (
  user_id uuid primary key references profiles(id) on delete cascade,
  vehicle_type_id smallint not null references vehicle_types(id),
  plate_number text not null,
  vehicle_model text,
  is_online boolean not null default false,
  is_simulated boolean not null default false,
  lat double precision,
  lng double precision,
  rating_avg numeric(3,2) not null default 5.00,
  rating_count int not null default 0
);

create table rides (
  id uuid primary key default gen_random_uuid(),
  rider_id uuid not null references profiles(id),
  captain_id uuid references profiles(id),
  vehicle_type_id smallint not null references vehicle_types(id),
  pickup_label text not null,
  pickup_lat double precision not null,
  pickup_lng double precision not null,
  drop_label text not null,
  drop_lat double precision not null,
  drop_lng double precision not null,
  distance_km numeric(6,2) not null,
  duration_min numeric(6,1) not null,
  fare numeric(8,2) not null,
  status ride_status not null default 'requested',
  cancel_reason text,
  captain_lat double precision,
  captain_lng double precision,
  share_token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz
);

create table ride_events (
  id bigint generated always as identity primary key,
  ride_id uuid not null references rides(id) on delete cascade,
  actor_id uuid references profiles(id),
  event_type text not null,
  note text,
  created_at timestamptz not null default now()
);

create table ratings (
  ride_id uuid primary key references rides(id) on delete cascade,
  rider_id uuid not null references profiles(id),
  captain_id uuid not null references profiles(id),
  stars smallint not null check (stars between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

-- indexes
create index rides_rider_idx on rides (rider_id, created_at desc);
create index rides_captain_idx on rides (captain_id, created_at desc);
create index rides_open_idx on rides (vehicle_type_id) where status = 'requested';
create index ride_events_ride_idx on ride_events (ride_id);
create index captain_online_idx on captain_profiles (vehicle_type_id) where is_online;

-- auto-create a profile when someone signs up
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'User'),
    new.raw_user_meta_data->>'phone',
    case when new.raw_user_meta_data->>'role' = 'captain' then 'captain'::user_role else 'rider'::user_role end
  );
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- helper functions
create or replace function my_role() returns user_role
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid()
$$;
create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'admin' from profiles where id = auth.uid()), false)
$$;

-- RLS
alter table profiles enable row level security;
alter table vehicle_types enable row level security;
alter table captain_profiles enable row level security;
alter table rides enable row level security;
alter table ride_events enable row level security;
alter table ratings enable row level security;

create policy vt_read on vehicle_types for select using (true);

create policy profiles_read on profiles for select using (id = auth.uid() or is_admin());
create policy profiles_update on profiles for update
  using (id = auth.uid()) with check (id = auth.uid() and role = my_role());

create policy cp_read on captain_profiles for select using (user_id = auth.uid() or is_admin());

create policy rides_read on rides for select using (
  rider_id = auth.uid()
  or captain_id = auth.uid()
  or is_admin()
  or (status = 'requested' and exists (
        select 1 from captain_profiles cp
        where cp.user_id = auth.uid() and cp.is_online and cp.vehicle_type_id = rides.vehicle_type_id))
);

create policy events_read on ride_events for select using (
  exists (select 1 from rides r where r.id = ride_events.ride_id
          and (r.rider_id = auth.uid() or r.captain_id = auth.uid() or is_admin()))
);

create policy ratings_read on ratings for select using (rider_id = auth.uid() or captain_id = auth.uid() or is_admin());

alter publication supabase_realtime add table rides;
```
