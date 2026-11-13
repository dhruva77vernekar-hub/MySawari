-- MySawari complete platform schema. Review and apply in Supabase SQL editor after backup.
create extension if not exists pgcrypto;

alter table public.profiles add column if not exists is_suspended boolean not null default false;
create table if not exists public.captain_profiles (
 profile_id uuid primary key references public.profiles(id) on delete cascade,
 vehicle_type_id uuid references public.vehicle_types(id), vehicle_registration text, license_number text, license_verified boolean not null default false,
 is_online boolean not null default false, is_available boolean not null default true,
 current_latitude double precision, current_longitude double precision, location_updated_at timestamptz,
 rating numeric(3,2) not null default 5 check(rating between 0 and 5), completed_rides integer not null default 0,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(current_latitude is null or current_latitude between -90 and 90), check(current_longitude is null or current_longitude between -180 and 180)
);
create table if not exists public.service_zones (
 id uuid primary key default gen_random_uuid(), name text not null, city text not null default 'Belagavi', polygon_geojson jsonb,
 is_active boolean not null default true, created_at timestamptz not null default now()
);
create table if not exists public.rides (
 id uuid primary key default gen_random_uuid(), rider_id uuid not null references public.profiles(id), captain_id uuid references public.profiles(id), vehicle_type_id uuid not null references public.vehicle_types(id),
 status text not null default 'requested' check(status in ('requested','searching','accepted','captain_arrived','in_progress','completed','cancelled','no_captain_available')),
 pickup_latitude double precision not null, pickup_longitude double precision not null, drop_latitude double precision not null, drop_longitude double precision not null,
 pickup_address text, drop_address text, passenger_count smallint not null default 1 check(passenger_count between 1 and 4), pooling_opt_in boolean not null default false,
 distance_meters integer, duration_seconds integer, estimated_fare numeric(10,2) not null check(estimated_fare>=0), final_fare numeric(10,2), currency text not null default 'INR', zone_multiplier numeric(4,2) not null default 1,
 idempotency_key text, requested_at timestamptz not null default now(), accepted_at timestamptz, started_at timestamptz, completed_at timestamptz, cancelled_at timestamptz, cancel_reason text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(pickup_latitude between -90 and 90 and drop_latitude between -90 and 90), check(pickup_longitude between -180 and 180 and drop_longitude between -180 and 180)
);
create unique index if not exists rides_rider_idempotency_uq on public.rides(rider_id,idempotency_key) where idempotency_key is not null;
create index if not exists rides_rider_created_idx on public.rides(rider_id,created_at desc); create index if not exists rides_captain_status_idx on public.rides(captain_id,status);
create table if not exists public.ride_events(id uuid primary key default gen_random_uuid(),ride_id uuid not null references public.rides(id) on delete cascade,actor_id uuid references public.profiles(id),event_type text not null,description text,metadata jsonb not null default '{}',created_at timestamptz not null default now());
create index if not exists ride_events_ride_created_idx on public.ride_events(ride_id,created_at);
create table if not exists public.captain_allocation_history(id uuid primary key default gen_random_uuid(),ride_id uuid not null references public.rides(id) on delete cascade,captain_id uuid references public.profiles(id),attempt_number integer not null,eta_seconds integer,distance_meters integer,workload_score numeric(5,2),fairness_score numeric(5,2),reliability_score numeric(5,2),total_score numeric(5,2),outcome text not null,reason text,created_at timestamptz not null default now(),unique(ride_id,attempt_number,captain_id));
create table if not exists public.reassignment_attempts(id uuid primary key default gen_random_uuid(),ride_id uuid not null references public.rides(id) on delete cascade,previous_captain_id uuid references public.profiles(id),new_captain_id uuid references public.profiles(id),attempt_number integer not null,trigger text not null,result text not null,error_code text,created_at timestamptz not null default now(),unique(ride_id,attempt_number));
create table if not exists public.ride_pools(id uuid primary key default gen_random_uuid(),status text not null default 'open' check(status in ('open','locked','in_progress','completed','cancelled')),vehicle_type_id uuid not null references public.vehicle_types(id),captain_id uuid references public.profiles(id),capacity smallint not null check(capacity>0),seats_reserved smallint not null default 0 check(seats_reserved>=0 and seats_reserved<=capacity),max_detour_percent numeric(5,2) not null default 20,route_order jsonb not null default '[]',route_distance_meters integer,route_duration_seconds integer,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table if not exists public.ride_pool_members(id uuid primary key default gen_random_uuid(),pool_id uuid not null references public.ride_pools(id) on delete cascade,ride_id uuid not null unique references public.rides(id) on delete cascade,rider_id uuid not null references public.profiles(id),passenger_count smallint not null check(passenger_count>0),pickup_sequence smallint not null default 1,drop_sequence smallint not null default 2,fare_share numeric(10,2) not null default 0,status text not null default 'active',created_at timestamptz not null default now(),unique(pool_id,ride_id),check(pickup_sequence<drop_sequence));
create table if not exists public.demand_history(id uuid primary key default gen_random_uuid(),zone_id uuid references public.service_zones(id),bucket_start timestamptz not null,request_count integer not null default 0,source text not null default 'live',created_at timestamptz not null default now(),unique(zone_id,bucket_start,source));
create table if not exists public.demand_forecasts(id uuid primary key default gen_random_uuid(),zone_id uuid references public.service_zones(id),forecast_for timestamptz not null,predicted_requests numeric(10,2) not null,online_captains integer not null default 0,shortage_level text not null,confidence numeric(4,3) not null default 0.25,algorithm_version text not null default 'weighted-moving-average-v1',source text not null default 'computed',generated_at timestamptz not null default now());
create table if not exists public.zone_metrics(id uuid primary key default gen_random_uuid(),zone_id uuid not null references public.service_zones(id),demand_count integer not null default 0,supply_count integer not null default 0,demand_supply_ratio numeric(10,3) not null default 0,price_multiplier numeric(4,2) not null default 1,shortage_level text not null default 'normal',reason text,created_at timestamptz not null default now());
create index if not exists zone_metrics_latest_idx on public.zone_metrics(zone_id,created_at desc); create index if not exists demand_forecasts_latest_idx on public.demand_forecasts(generated_at desc);
create table if not exists public.notifications(id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles(id),type text not null,title text not null,body text,payload jsonb not null default '{}',read_at timestamptz,created_at timestamptz not null default now());
create table if not exists public.trip_share_tokens(id uuid primary key default gen_random_uuid(),ride_id uuid not null references public.rides(id) on delete cascade,created_by uuid not null references public.profiles(id),token_hash text not null unique,expires_at timestamptz not null,revoked_at timestamptz,created_at timestamptz not null default now());
create table if not exists public.sos_events(id uuid primary key default gen_random_uuid(),ride_id uuid references public.rides(id),created_by uuid not null references public.profiles(id),latitude double precision not null,longitude double precision not null,status text not null default 'open',note text,created_at timestamptz not null default now(),resolved_at timestamptz);
create table if not exists public.ratings(id uuid primary key default gen_random_uuid(),ride_id uuid not null references public.rides(id),rider_id uuid not null references public.profiles(id),captain_id uuid not null references public.profiles(id),score smallint not null check(score between 1 and 5),comment text,created_at timestamptz not null default now(),unique(ride_id,rider_id));
create table if not exists public.audit_logs(id bigserial primary key,actor_id uuid,action text not null,entity_type text not null,entity_id text,request_id text,metadata jsonb not null default '{}',created_at timestamptz not null default now());

-- RLS: all operational tables are protected; service operations use security-definer RPCs.
do $$ declare t text; begin foreach t in array array['captain_profiles','service_zones','rides','ride_events','captain_allocation_history','reassignment_attempts','ride_pools','ride_pool_members','demand_history','demand_forecasts','zone_metrics','notifications','trip_share_tokens','sos_events','ratings','audit_logs'] loop execute format('alter table public.%I enable row level security',t); end loop; end $$;
drop policy if exists captain_self_select on public.captain_profiles;
drop policy if exists captain_self_insert on public.captain_profiles;
drop policy if exists captain_self_update on public.captain_profiles;
drop policy if exists zones_authenticated_read on public.service_zones;
drop policy if exists rides_participant_read on public.rides;
drop policy if exists ride_events_participant_read on public.ride_events;
drop policy if exists notifications_owner_read on public.notifications;
drop policy if exists sos_participant_read on public.sos_events;
drop policy if exists sos_self_insert on public.sos_events;
drop policy if exists ratings_participant_read on public.ratings;
drop policy if exists pool_member_read on public.ride_pools;
drop policy if exists pool_members_self_read on public.ride_pool_members;
drop policy if exists demand_admin_read on public.demand_forecasts;
drop policy if exists metrics_admin_read on public.zone_metrics;
create policy captain_self_select on public.captain_profiles for select to authenticated using(profile_id=auth.uid());
create policy captain_self_insert on public.captain_profiles for insert to authenticated with check(profile_id=auth.uid());
create policy captain_self_update on public.captain_profiles for update to authenticated using(profile_id=auth.uid()) with check(profile_id=auth.uid());
create policy zones_authenticated_read on public.service_zones for select to authenticated using(is_active=true);
create policy rides_participant_read on public.rides for select to authenticated using(rider_id=auth.uid() or captain_id=auth.uid());
create policy ride_events_participant_read on public.ride_events for select to authenticated using(exists(select 1 from public.rides r where r.id=ride_id and (r.rider_id=auth.uid() or r.captain_id=auth.uid())));
create policy notifications_owner_read on public.notifications for select to authenticated using(user_id=auth.uid());
create policy sos_participant_read on public.sos_events for select to authenticated using(created_by=auth.uid() or exists(select 1 from public.rides r where r.id=ride_id and (r.rider_id=auth.uid() or r.captain_id=auth.uid())));
create policy ratings_participant_read on public.ratings for select to authenticated using(rider_id=auth.uid() or captain_id=auth.uid());
create policy pool_member_read on public.ride_pools for select to authenticated using(exists(select 1 from public.ride_pool_members m join public.rides r on r.id=m.ride_id where m.pool_id=id and r.rider_id=auth.uid()) or captain_id=auth.uid());
create policy pool_members_self_read on public.ride_pool_members for select to authenticated using(rider_id=auth.uid() or exists(select 1 from public.ride_pools p where p.id=pool_id and p.captain_id=auth.uid()));

-- Create ride atomically. RLS identity is auth.uid(); role must be rider.
create or replace function public.create_ride_request(p_vehicle_type_id uuid,p_pickup_lat double precision,p_pickup_lng double precision,p_drop_lat double precision,p_drop_lng double precision,p_pickup_address text,p_drop_address text,p_passenger_count smallint,p_pooling_opt_in boolean,p_distance_meters integer,p_duration_seconds integer,p_estimated_fare numeric,p_idempotency_key text default null)
returns jsonb language plpgsql security definer set search_path=public as $$ declare v public.rides; begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if not exists(select 1 from profiles where id=auth.uid() and role='rider' and not is_suspended) then raise exception 'Rider account required'; end if;
 if p_passenger_count<1 or p_passenger_count>4 then raise exception 'Invalid passenger count'; end if;
 if p_idempotency_key is not null then select * into v from rides where rider_id=auth.uid() and idempotency_key=p_idempotency_key; if found then return to_jsonb(v); end if; end if;
 insert into rides(rider_id,vehicle_type_id,pickup_latitude,pickup_longitude,drop_latitude,drop_longitude,pickup_address,drop_address,passenger_count,pooling_opt_in,distance_meters,duration_seconds,estimated_fare,idempotency_key,status)
 values(auth.uid(),p_vehicle_type_id,p_pickup_lat,p_pickup_lng,p_drop_lat,p_drop_lng,p_pickup_address,p_drop_address,p_passenger_count,p_pooling_opt_in,p_distance_meters,p_duration_seconds,p_estimated_fare,p_idempotency_key,'requested') returning * into v;
 insert into ride_events(ride_id,actor_id,event_type,description) values(v.id,auth.uid(),'ride_requested','Ride request created'); return to_jsonb(v); end $$;

create or replace function public.cancel_ride_request(p_ride_id uuid,p_reason text default 'rider_cancelled') returns jsonb language plpgsql security definer set search_path=public as $$ declare v rides; begin
 update rides set status='cancelled',cancelled_at=now(),cancel_reason=p_reason,updated_at=now() where id=p_ride_id and rider_id=auth.uid() and status in ('requested','searching','accepted') returning * into v;
 if not found then raise exception 'Ride cannot be cancelled or is not yours'; end if;
 insert into ride_events(ride_id,actor_id,event_type,description) values(v.id,auth.uid(),'ride_cancelled',p_reason); return to_jsonb(v); end $$;

create or replace function public.captain_ride_action(p_ride_id uuid,p_action text,p_note text default '') returns jsonb language plpgsql security definer set search_path=public as $$ declare v rides; new_status text; begin
 if not exists(select 1 from captain_profiles where profile_id=auth.uid()) then raise exception 'Captain profile required'; end if;
 new_status:=case p_action when 'accept' then 'accepted' when 'arrived' then 'captain_arrived' when 'start' then 'in_progress' when 'complete' then 'completed' when 'reject' then 'searching' else null end;
 if new_status is null then raise exception 'Invalid action'; end if;
 if p_action='accept' then if not exists(select 1 from captain_profiles cp where cp.profile_id=auth.uid() and cp.vehicle_type_id=(select vehicle_type_id from rides where id=p_ride_id) and cp.is_online and cp.is_available and cp.license_verified) then raise exception 'Captain is not verified, available, or vehicle-compatible'; end if; update rides set captain_id=auth.uid(),status='accepted',accepted_at=now(),updated_at=now() where id=p_ride_id and status in ('requested','searching') and captain_id is null returning * into v; if found then update captain_profiles set is_available=false,updated_at=now() where profile_id=auth.uid(); end if;
 elsif p_action='reject' then update rides set captain_id=null,status='searching',updated_at=now() where id=p_ride_id and captain_id=auth.uid() and status='accepted' returning * into v; if found then update captain_profiles set is_available=true,updated_at=now() where profile_id=auth.uid(); end if;
 else update rides set status=new_status,started_at=case when p_action='start' then now() else started_at end,completed_at=case when p_action='complete' then now() else completed_at end,updated_at=now() where id=p_ride_id and captain_id=auth.uid() and ((p_action='arrived' and status='accepted') or (p_action='start' and status='captain_arrived') or (p_action='complete' and status='in_progress')) returning * into v; end if;
 if not found then raise exception 'Ride action is not valid for current state'; end if;
 if p_action='complete' then update captain_profiles set is_available=true,completed_rides=completed_rides+1,updated_at=now() where profile_id=auth.uid(); end if;
 insert into ride_events(ride_id,actor_id,event_type,description) values(v.id,auth.uid(),'captain_'||p_action,coalesce(p_note,p_action)); return to_jsonb(v); end $$;

-- Weighted recent demand baseline and transparent, capped surge multiplier.
create or replace function public.refresh_zone_intelligence() returns jsonb language plpgsql security definer set search_path=public as $$ declare z record; d integer; s integer; ratio numeric; mult numeric; pred numeric; lvl text; n integer:=0; begin
 if not exists(select 1 from profiles where id=auth.uid() and role='admin') then raise exception 'Admin required'; end if;
 for z in select * from service_zones where is_active loop
 select count(*) into d from rides where created_at>now()-interval '30 minutes' and status not in ('cancelled');
 select count(*) into s from captain_profiles where is_online and is_available and location_updated_at>now()-interval '2 minutes';
 ratio:=d::numeric/greatest(s,1); mult:=least(1.5,greatest(1.0,1+(ratio-1)*0.15)); lvl:=case when ratio>=2 then 'shortage' when ratio>=1 then 'elevated' else 'normal' end;
 select coalesce(avg(request_count),0) into pred from demand_history where zone_id=z.id and bucket_start>now()-interval '3 hours';
 insert into zone_metrics(zone_id,demand_count,supply_count,demand_supply_ratio,price_multiplier,shortage_level,reason) values(z.id,d,s,ratio,mult,lvl,'30-minute demand divided by fresh online supply');
 insert into demand_forecasts(zone_id,forecast_for,predicted_requests,online_captains,shortage_level,confidence,source) values(z.id,now()+interval '30 minutes',greatest(pred,d),s,lvl,case when pred>0 then 0.65 else 0.25 end,case when pred>0 then 'computed' else 'low-data-fallback' end); n:=n+1;
 end loop; return jsonb_build_object('zonesUpdated',n,'generatedAt',now(),'algorithm','weighted-moving-average-v1'); end $$;

-- Allocation uses explainable weighted scoring; one captain is claimed by conditional update.
create or replace function public.allocate_ride(p_ride_id uuid) returns jsonb language plpgsql security definer set search_path=public as $$ declare r rides; c record; chosen uuid; dist numeric; best numeric:=-1; score numeric; eta integer; attempt integer; begin
 if not exists(select 1 from profiles where id=auth.uid() and role='admin') then raise exception 'Admin required'; end if;
 select * into r from rides where id=p_ride_id for update; if not found or r.status not in ('requested','searching') then raise exception 'Ride is not allocatable'; end if;
 select coalesce(max(attempt_number),0)+1 into attempt from captain_allocation_history where ride_id=p_ride_id;
 for c in select cp.*,(select count(*) from rides x where x.captain_id=cp.profile_id and x.status in ('accepted','captain_arrived','in_progress')) workload,(select count(*) from captain_allocation_history h where h.captain_id=cp.profile_id and h.created_at>now()-interval '24 hours' and h.outcome='accepted') recent from captain_profiles cp join profiles p on p.id=cp.profile_id where cp.is_online and cp.is_available and p.is_suspended=false and cp.vehicle_type_id=r.vehicle_type_id and cp.current_latitude is not null and cp.location_updated_at>now()-interval '90 seconds' loop
 dist:=6371000*2*asin(sqrt(power(sin(radians(c.current_latitude-r.pickup_latitude)/2),2)+cos(radians(r.pickup_latitude))*cos(radians(c.current_latitude))*power(sin(radians(c.current_longitude-r.pickup_longitude)/2),2)));
 if dist>12000 then continue; end if; eta:=round(dist/7); score:=0.4*(100-least(dist/120,100))+0.2*(100-least(c.workload*25,100))+0.25*(100-least(c.recent*10,100))+0.15*80;
 insert into captain_allocation_history(ride_id,captain_id,attempt_number,eta_seconds,distance_meters,workload_score,fairness_score,reliability_score,total_score,outcome,reason) values(r.id,c.profile_id,attempt,eta,round(dist),100-least(c.workload*25,100),100-least(c.recent*10,100),80,score,'offered','ETA 40%, workload 20%, fairness 25%, neutral reliability 15%');
 if score>best then best:=score;chosen:=c.profile_id;end if;
 end loop;
 if chosen is null then update rides set status='no_captain_available',updated_at=now() where id=r.id; return jsonb_build_object('rideId',r.id,'status','no_captain_available'); end if;
 update rides set captain_id=chosen,status='accepted',accepted_at=now(),updated_at=now() where id=r.id and status in ('requested','searching') and captain_id is null;
 if not found then raise exception 'Ride allocation conflict; retry'; end if;
 update captain_allocation_history set outcome='accepted' where ride_id=r.id and captain_id=chosen and attempt_number=attempt;
 insert into ride_events(ride_id,actor_id,event_type,description,metadata) values(r.id,chosen,'captain_allocated','Captain allocated by intelligent matching',jsonb_build_object('score',best)); return jsonb_build_object('rideId',r.id,'captainId',chosen,'score',round(best,2),'attempt',attempt); end $$;

create or replace function public.reassign_ride(p_ride_id uuid,p_reason text default 'admin_retry') returns jsonb language plpgsql security definer set search_path=public as $$ declare old uuid; v rides; n integer; begin
 if not exists(select 1 from profiles where id=auth.uid() and role='admin') then raise exception 'Admin required'; end if;
 select * into v from rides where id=p_ride_id for update; if not found then raise exception 'Ride not found'; end if; old:=v.captain_id; if v.status not in ('accepted','searching','requested') then raise exception 'Ride cannot be reassigned in current state'; end if;
 update rides set captain_id=null,status='searching',updated_at=now() where id=p_ride_id;
 select coalesce(max(attempt_number),0)+1 into n from reassignment_attempts where ride_id=p_ride_id;
 insert into reassignment_attempts(ride_id,previous_captain_id,attempt_number,trigger,result) values(p_ride_id,old,n,p_reason,'queued');
 insert into ride_events(ride_id,actor_id,event_type,description) values(p_ride_id,auth.uid(),'reassignment_requested',p_reason);
 return jsonb_build_object('rideId',p_ride_id,'previousCaptainId',old,'status','searching','attempt',n,'nextStep','admin should invoke allocate_ride'); end $$;

create or replace function public.find_pool_candidates(p_ride_id uuid) returns setof jsonb language plpgsql security definer set search_path=public as $$ declare r rides; begin select * into r from rides where id=p_ride_id and rider_id=auth.uid() and pooling_opt_in and status='requested'; if not found then raise exception 'Eligible pooling ride not found'; end if; return query select jsonb_build_object('poolId',p.id,'availableSeats',p.capacity-p.seats_reserved,'vehicleTypeId',p.vehicle_type_id,'maxDetourPercent',p.max_detour_percent) from ride_pools p where p.status='open' and p.vehicle_type_id=r.vehicle_type_id and p.capacity-p.seats_reserved>=r.passenger_count order by p.created_at asc limit 10; end $$;
create or replace function public.create_ride_pool(p_ride_id uuid,p_max_detour_percent numeric default 20) returns jsonb language plpgsql security definer set search_path=public as $$ declare r rides; p ride_pools; cap integer; begin select * into r from rides where id=p_ride_id and rider_id=auth.uid() and pooling_opt_in and status='requested' for update; if not found then raise exception 'Eligible pooling ride not found'; end if; select capacity into cap from vehicle_types where id=r.vehicle_type_id; insert into ride_pools(vehicle_type_id,capacity,seats_reserved,max_detour_percent,route_order) values(r.vehicle_type_id,coalesce(cap,4),r.passenger_count,least(greatest(p_max_detour_percent,5),40),jsonb_build_array(jsonb_build_object('rideId',r.id,'pickup',jsonb_build_array(r.pickup_longitude,r.pickup_latitude),'drop',jsonb_build_array(r.drop_longitude,r.drop_latitude)))) returning * into p; insert into ride_pool_members(pool_id,ride_id,rider_id,passenger_count,fare_share) values(p.id,r.id,r.rider_id,r.passenger_count,r.estimated_fare); return to_jsonb(p); end $$;
create or replace function public.join_ride_pool(p_pool_id uuid,p_ride_id uuid) returns jsonb language plpgsql security definer set search_path=public as $$ declare p ride_pools; r rides; begin select * into p from ride_pools where id=p_pool_id for update; select * into r from rides where id=p_ride_id and rider_id=auth.uid() and pooling_opt_in and status='requested' for update; if not found or p.status<>'open' or p.vehicle_type_id<>r.vehicle_type_id or p.seats_reserved+r.passenger_count>p.capacity then raise exception 'Pool is not compatible or has no seats'; end if; insert into ride_pool_members(pool_id,ride_id,rider_id,passenger_count,fare_share) values(p.id,r.id,r.rider_id,r.passenger_count,r.estimated_fare); update ride_pools set seats_reserved=seats_reserved+r.passenger_count,updated_at=now() where id=p.id; return jsonb_build_object('poolId',p.id,'rideId',r.id,'seatsReserved',p.seats_reserved+r.passenger_count); end $$;
create or replace function public.leave_ride_pool(p_pool_id uuid,p_reason text default 'member_left') returns jsonb language plpgsql security definer set search_path=public as $$ declare m ride_pool_members; begin delete from ride_pool_members where pool_id=p_pool_id and rider_id=auth.uid() returning * into m; if not found then raise exception 'Pool membership not found'; end if; update ride_pools set seats_reserved=greatest(0,seats_reserved-m.passenger_count),updated_at=now() where id=p_pool_id; return jsonb_build_object('poolId',p_pool_id,'left',true,'reason',p_reason); end $$;

create or replace function public.create_trip_share_token(p_ride_id uuid,p_expires_minutes integer default 120) returns jsonb language plpgsql security definer set search_path=public as $$ declare raw text; begin if not exists(select 1 from rides where id=p_ride_id and (rider_id=auth.uid() or captain_id=auth.uid())) then raise exception 'Ride not found or not accessible'; end if; raw:=encode(gen_random_bytes(32),'hex'); insert into trip_share_tokens(ride_id,created_by,token_hash,expires_at) values(p_ride_id,auth.uid(),encode(digest(raw,'sha256'),'hex'),now()+make_interval(mins=>least(greatest(p_expires_minutes,5),1440))); return jsonb_build_object('token',raw,'expiresInMinutes',least(greatest(p_expires_minutes,5),1440)); end $$;
create or replace function public.get_shared_trip(p_token text) returns jsonb language plpgsql security definer set search_path=public as $$ declare v jsonb; begin select jsonb_build_object('rideId',r.id,'status',r.status,'pickupAddress',r.pickup_address,'dropAddress',r.drop_address,'requestedAt',r.requested_at,'updatedAt',r.updated_at) into v from trip_share_tokens t join rides r on r.id=t.ride_id where t.token_hash=encode(digest(p_token,'sha256'),'hex') and t.revoked_at is null and t.expires_at>now(); if v is null then raise exception 'Share link is invalid or expired'; end if; return v; end $$;


create policy sos_self_insert on public.sos_events for insert to authenticated with check(created_by=auth.uid() and (ride_id is null or exists(select 1 from public.rides r where r.id=ride_id and (r.rider_id=auth.uid() or r.captain_id=auth.uid()))));
drop policy if exists captain_admin_read on public.captain_profiles;
create policy captain_admin_read on public.captain_profiles for select to authenticated using(exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
drop policy if exists admin_rides_read on public.rides;
create policy admin_rides_read on public.rides for select to authenticated using(exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
drop policy if exists reassignment_participant_read on public.reassignment_attempts;
create policy reassignment_participant_read on public.reassignment_attempts for select to authenticated using(exists(select 1 from public.rides r where r.id=ride_id and (r.rider_id=auth.uid() or r.captain_id=auth.uid())) or exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
create policy demand_admin_read on public.demand_forecasts for select to authenticated using(exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
create policy metrics_admin_read on public.zone_metrics for select to authenticated using(exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
-- Prevent captains from self-verifying their documents through direct table updates.
revoke all on public.captain_profiles from anon,authenticated;
grant select on public.captain_profiles to authenticated;
grant insert(profile_id,vehicle_type_id,vehicle_registration,license_number) on public.captain_profiles to authenticated;
grant update(vehicle_type_id,vehicle_registration,license_number,is_online,current_latitude,current_longitude,location_updated_at,updated_at) on public.captain_profiles to authenticated;

create or replace function public.get_nearby_captains(p_latitude double precision,p_longitude double precision,p_radius_meters integer default 5000,p_stale_seconds integer default 90)
returns table(profile_id uuid,latitude double precision,longitude double precision,vehicle_type_id uuid,distance_meters integer)
language sql security definer set search_path=public as $$
 select cp.profile_id,cp.current_latitude,cp.current_longitude,cp.vehicle_type_id,
 round(6371000*2*asin(sqrt(power(sin(radians(cp.current_latitude-p_latitude)/2),2)+cos(radians(p_latitude))*cos(radians(cp.current_latitude))*power(sin(radians(cp.current_longitude-p_longitude)/2),2))))::integer
 from captain_profiles cp join profiles pr on pr.id=cp.profile_id
 where cp.is_online and cp.is_available and not pr.is_suspended and cp.current_latitude is not null and cp.location_updated_at>now()-make_interval(secs=>least(greatest(p_stale_seconds,30),300))
 and 6371000*2*asin(sqrt(power(sin(radians(cp.current_latitude-p_latitude)/2),2)+cos(radians(p_latitude))*cos(radians(cp.current_latitude))*power(sin(radians(cp.current_longitude-p_longitude)/2),2)))<=least(greatest(p_radius_meters,250),15000)
 order by 5 asc limit 50;
$$;


create or replace function public.set_captain_verification(p_captain_id uuid,p_verified boolean) returns jsonb language plpgsql security definer set search_path=public as $$ declare v captain_profiles; begin
 if not exists(select 1 from profiles where id=auth.uid() and role='admin') then raise exception 'Admin required'; end if;
 update captain_profiles set license_verified=p_verified,updated_at=now() where profile_id=p_captain_id returning * into v; if not found then raise exception 'Captain profile not found'; end if;
 insert into audit_logs(actor_id,action,entity_type,entity_id,metadata) values(auth.uid(),'captain_verification_updated','captain',p_captain_id::text,jsonb_build_object('verified',p_verified)); return jsonb_build_object('captainId',v.profile_id,'licenseVerified',v.license_verified); end $$;
create or replace function public.create_ride_rating(p_ride_id uuid,p_score smallint,p_comment text default null) returns jsonb language plpgsql security definer set search_path=public as $$ declare v ratings; r rides; begin
 if p_score<1 or p_score>5 then raise exception 'Score must be 1 to 5'; end if;
 select * into r from rides where id=p_ride_id and rider_id=auth.uid() and status='completed'; if not found then raise exception 'Only your completed rides can be rated'; end if;
 if r.captain_id is null then raise exception 'Ride has no captain to rate'; end if;
 insert into ratings(ride_id,rider_id,captain_id,score,comment) values(r.id,auth.uid(),r.captain_id,p_score,left(p_comment,500)) returning * into v;
 update captain_profiles set rating=(select round(avg(score)::numeric,2) from ratings where captain_id=r.captain_id),updated_at=now() where profile_id=r.captain_id;
 return to_jsonb(v); end $$;

-- Restrict function execution; authenticated users may invoke only functions that enforce auth.uid/role.
grant execute on function public.set_captain_verification(uuid,boolean) to authenticated;
grant execute on function public.create_ride_rating(uuid,smallint,text) to authenticated;
grant execute on function public.get_nearby_captains(double precision,double precision,integer,integer) to authenticated;
grant execute on function public.create_ride_request(uuid,double precision,double precision,double precision,double precision,text,text,smallint,boolean,integer,integer,numeric,text) to authenticated;
grant execute on function public.cancel_ride_request(uuid,text) to authenticated;
grant execute on function public.captain_ride_action(uuid,text,text) to authenticated;
grant execute on function public.refresh_zone_intelligence() to authenticated;
grant execute on function public.allocate_ride(uuid) to authenticated;
grant execute on function public.reassign_ride(uuid,text) to authenticated;
grant execute on function public.find_pool_candidates(uuid) to authenticated;
grant execute on function public.create_ride_pool(uuid,numeric) to authenticated;
grant execute on function public.join_ride_pool(uuid,uuid) to authenticated;
grant execute on function public.leave_ride_pool(uuid,text) to authenticated;
grant execute on function public.create_trip_share_token(uuid,integer) to authenticated;
grant execute on function public.get_shared_trip(text) to anon,authenticated;
