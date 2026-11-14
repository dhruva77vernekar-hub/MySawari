-- MySawari SOS Emergency System: SMS & WhatsApp Only
-- Migration: 20261114_create_emergency_sos.sql

create table if not exists public.emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  contact_name text not null,
  phone_number text not null, -- E.164 format, e.g. +919876543210
  relationship text not null,
  is_primary boolean not null default false,
  is_verified boolean not null default false,
  verification_otp text,
  otp_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sos_incidents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  ride_id uuid references public.rides(id),
  rider_id uuid references public.captain_profiles(id),
  latitude double precision not null,
  longitude double precision not null,
  address text,
  status text not null default 'OPEN' check (status in ('OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'FALSE_ALARM')),
  resolution_notes text,
  acknowledged_by uuid references public.profiles(id),
  acknowledged_at timestamptz,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists public.sos_notifications (
  id uuid primary key default gen_random_uuid(),
  sos_incident_id uuid not null references public.sos_incidents(id) on delete cascade,
  emergency_contact_id uuid references public.emergency_contacts(id) on delete set null,
  contact_name text not null,
  phone_number text not null,
  channel text not null check (channel in ('SMS', 'WHATSAPP')),
  provider text not null default 'MSG91',
  provider_message_id text,
  status text not null default 'PENDING' check (status in ('PENDING', 'ACCEPTED_BY_PROVIDER', 'SENT', 'DELIVERED', 'FAILED')),
  error_message text,
  sent_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);

-- Indexes for performance
create index if not exists idx_emergency_contacts_user on public.emergency_contacts(user_id);
create index if not exists idx_sos_incidents_user on public.sos_incidents(user_id);
create index if not exists idx_sos_incidents_ride on public.sos_incidents(ride_id);
create index if not exists idx_sos_incidents_status on public.sos_incidents(status);
create index if not exists idx_sos_notifications_incident on public.sos_notifications(sos_incident_id);
create index if not exists idx_sos_notifications_status on public.sos_notifications(status);

-- Enable RLS
alter table public.emergency_contacts enable row level security;
alter table public.sos_incidents enable row level security;
alter table public.sos_notifications enable row level security;

-- Policies for emergency_contacts
create policy emergency_contacts_owner_all on public.emergency_contacts
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Policies for sos_incidents
create policy sos_incidents_owner_select on public.sos_incidents
  for select to authenticated
  using (
    user_id = auth.uid() or 
    exists(select 1 from public.rides r where r.id = ride_id and (r.rider_id = auth.uid() or r.captain_id = auth.uid()))
  );

create policy sos_incidents_owner_insert on public.sos_incidents
  for insert to authenticated
  with check (user_id = auth.uid());

-- Policies for sos_notifications
create policy sos_notifications_participant_select on public.sos_notifications
  for select to authenticated
  using (
    exists(select 1 from public.sos_incidents i where i.id = sos_incident_id and i.user_id = auth.uid())
  );
