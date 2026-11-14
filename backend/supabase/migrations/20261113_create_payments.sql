-- ============================================================================
-- MySawari - Razorpay Payment Integration Migration
-- Technology: Supabase PostgreSQL (Strictly NO MongoDB/Mongoose)
-- ============================================================================

-- 1. Create payment status enum if it does not already exist
do $$
begin
  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type payment_status as enum ('created', 'authorized', 'captured', 'refunded', 'failed');
  end if;
end $$;

-- 2. Create payments table
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  ride_id uuid references public.rides(id) on delete set null,
  user_id uuid references public.profiles(id) on delete cascade,
  razorpay_order_id text not null unique,
  razorpay_payment_id text,
  razorpay_signature text,
  amount numeric(10, 2) not null check (amount >= 0),
  currency text not null default 'INR',
  status payment_status not null default 'created',
  payment_method text,
  vpa text,
  bank text,
  wallet text,
  email text,
  contact text,
  error_code text,
  error_description text,
  raw_response jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Add payment tracking columns to rides table if missing
alter table public.rides add column if not exists payment_status text default 'unpaid';
alter table public.rides add column if not exists payment_id uuid references public.payments(id) on delete set null;

-- 4. Create performance and idempotency indexes
create index if not exists payments_order_id_idx on public.payments (razorpay_order_id);
create index if not exists payments_ride_id_idx on public.payments (ride_id);
create index if not exists payments_user_id_idx on public.payments (user_id);
create index if not exists payments_status_idx on public.payments (status);
create index if not exists payments_created_at_idx on public.payments (created_at desc);

-- 5. Enable Row Level Security (RLS)
alter table public.payments enable row level security;

-- Policy: Users can view their own payments
drop policy if exists "Users can view their own payments" on public.payments;
create policy "Users can view their own payments"
  on public.payments for select
  using (auth.uid() = user_id);

-- Policy: Captains can view payment details for rides assigned to them
drop policy if exists "Captains can view payments for their assigned rides" on public.payments;
create policy "Captains can view payments for their assigned rides"
  on public.payments for select
  using (
    exists (
      select 1 from public.rides
      where public.rides.id = public.payments.ride_id
      and public.rides.captain_id = auth.uid()
    )
  );

-- Policy: Authenticated users can insert their own payment requests
drop policy if exists "Users can initiate payment records" on public.payments;
create policy "Users can initiate payment records"
  on public.payments for insert
  with check (auth.uid() = user_id);

-- Policy: Service role or Admins have full access
drop policy if exists "Admins have full access to payments" on public.payments;
create policy "Admins have full access to payments"
  on public.payments for all
  using (
    coalesce(
      (select role = 'admin' from public.profiles where id = auth.uid()),
      false
    )
  );

-- 6. Trigger to automatically keep updated_at in sync
create or replace function public.set_payments_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_payments_updated_at on public.payments;
create trigger trg_payments_updated_at
  before update on public.payments
  for each row execute function public.set_payments_updated_at();
