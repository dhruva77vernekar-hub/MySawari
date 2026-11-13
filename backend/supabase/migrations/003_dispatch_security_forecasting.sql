-- MySawari hardening and operational dispatch migration.
-- Apply 001, 002, then this migration in order.
-- This migration intentionally restricts ride creation to the trusted backend service role.

create or replace function public.zone_contains_point(
  p_latitude double precision,
  p_longitude double precision,
  p_polygon_geojson jsonb
) returns boolean
language plpgsql immutable
set search_path = public, extensions
as $$
declare
  geometry_json jsonb;
  ring jsonb;
  point_count integer;
  i integer;
  j integer;
  xi double precision;
  yi double precision;
  xj double precision;
  yj double precision;
  inside boolean := false;
begin
  if p_polygon_geojson is null then return false; end if;
  geometry_json := case when p_polygon_geojson->>'type' = 'Feature'
    then p_polygon_geojson->'geometry' else p_polygon_geojson end;
  if geometry_json->>'type' <> 'Polygon' then return false; end if;
  ring := geometry_json->'coordinates'->0;
  if ring is null then return false; end if;
  point_count := jsonb_array_length(ring);
  if point_count < 4 then return false; end if;
  j := point_count - 1;
  for i in 0..point_count-1 loop
    xi := (ring->i->>0)::double precision;
    yi := (ring->i->>1)::double precision;
    xj := (ring->j->>0)::double precision;
    yj := (ring->j->>1)::double precision;
    if ((yi > p_latitude) <> (yj > p_latitude)) then
      if abs(yj - yi) > 0.0000000001 and
         p_longitude < ((xj - xi) * (p_latitude - yi) / (yj - yi)) + xi then
        inside := not inside;
      end if;
    end if;
    j := i;
  end loop;
  return inside;
exception when others then
  return false;
end;
$$;

-- Only a trusted server-side call may create a ride. The server calculates route,
-- fare and zone multiplier after validating the authenticated rider token.
drop function if exists public.create_ride_request(
  uuid,double precision,double precision,double precision,double precision,text,text,smallint,boolean,integer,integer,numeric,text
);

create or replace function public.create_ride_request(
  p_rider_id uuid,
  p_vehicle_type_id uuid,
  p_pickup_lat double precision,
  p_pickup_lng double precision,
  p_drop_lat double precision,
  p_drop_lng double precision,
  p_pickup_address text,
  p_drop_address text,
  p_passenger_count smallint,
  p_pooling_opt_in boolean,
  p_distance_meters integer,
  p_duration_seconds integer,
  p_estimated_fare numeric,
  p_zone_multiplier numeric default 1,
  p_idempotency_key text default null
) returns jsonb
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  v public.rides;
  v_capacity integer;
  v_vehicle_active boolean;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Ride creation must be performed by the trusted backend';
  end if;
  if p_rider_id is null or not exists (
    select 1 from public.profiles where id = p_rider_id and role = 'rider' and not is_suspended
  ) then raise exception 'Active rider account required'; end if;
  if p_pickup_lat not between -90 and 90 or p_drop_lat not between -90 and 90
     or p_pickup_lng not between -180 and 180 or p_drop_lng not between -180 and 180 then
    raise exception 'Invalid coordinates';
  end if;
  if p_distance_meters not between 1 and 200000 or p_duration_seconds not between 1 and 86400 then
    raise exception 'Invalid route estimate';
  end if;
  if p_estimated_fare < 0 or p_estimated_fare > 20000 then raise exception 'Invalid estimated fare'; end if;
  if p_zone_multiplier < 1 or p_zone_multiplier > 2 then raise exception 'Invalid zone multiplier'; end if;
  select capacity, is_active into v_capacity, v_vehicle_active
  from public.vehicle_types where id = p_vehicle_type_id;
  if not found or not v_vehicle_active then raise exception 'Vehicle type is unavailable'; end if;
  if p_passenger_count < 1 or p_passenger_count > v_capacity then raise exception 'Passenger count exceeds vehicle capacity'; end if;
  if p_pooling_opt_in and v_capacity < 2 then raise exception 'This vehicle type does not support pooling'; end if;

  if p_idempotency_key is not null then
    select * into v from public.rides where rider_id = p_rider_id and idempotency_key = p_idempotency_key;
    if found then return to_jsonb(v); end if;
  end if;

  insert into public.rides(
    rider_id, vehicle_type_id, pickup_latitude, pickup_longitude, drop_latitude, drop_longitude,
    pickup_address, drop_address, passenger_count, pooling_opt_in, distance_meters,
    duration_seconds, estimated_fare, zone_multiplier, idempotency_key, status
  ) values (
    p_rider_id, p_vehicle_type_id, p_pickup_lat, p_pickup_lng, p_drop_lat, p_drop_lng,
    left(p_pickup_address, 300), left(p_drop_address, 300), p_passenger_count, p_pooling_opt_in,
    p_distance_meters, p_duration_seconds, p_estimated_fare, p_zone_multiplier, p_idempotency_key, 'requested'
  ) on conflict (rider_id, idempotency_key) where idempotency_key is not null do nothing
    returning * into v;
  if not found then
    select * into v from public.rides where rider_id = p_rider_id and idempotency_key = p_idempotency_key;
    return to_jsonb(v);
  end if;
  insert into public.ride_events(ride_id, actor_id, event_type, description)
  values(v.id, p_rider_id, 'ride_requested', 'Ride request created by MySawari API');
  return to_jsonb(v);
end;
$$;

-- Captain assignment is an offer, not an automatic acceptance. The captain must
-- explicitly accept it within the configured timeout.
create or replace function public.allocate_ride(p_ride_id uuid)
returns jsonb
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  r public.rides;
  c record;
  chosen uuid;
  best_score numeric := -1;
  score numeric;
  distance_m numeric;
  eta integer;
  attempt integer;
  workload_score numeric;
  fairness_score numeric;
  reliability_score numeric;
  claimed integer;
begin
  if coalesce(auth.role(), '') <> 'service_role' and not exists(
    select 1 from public.profiles where id = auth.uid() and role = 'admin' and not is_suspended
  ) then raise exception 'Admin or trusted dispatch worker required'; end if;

  select * into r from public.rides where id = p_ride_id for update;
  if not found then raise exception 'Ride not found'; end if;
  if r.status not in ('requested', 'searching') or r.captain_id is not null then
    return jsonb_build_object('rideId', r.id, 'status', r.status, 'message', 'Ride is not waiting for a captain');
  end if;

  select coalesce(max(attempt_number), 0) + 1 into attempt
  from public.captain_allocation_history where ride_id = p_ride_id;
  if attempt > 4 then
    update public.rides set captain_id = null, status = 'no_captain_available', updated_at = now() where id = r.id;
    insert into public.ride_events(ride_id, actor_id, event_type, description)
      values(r.id, null, 'dispatch_attempt_limit_reached', 'Four captain offers were made without acceptance.');
    return jsonb_build_object('rideId', r.id, 'status', 'no_captain_available', 'attemptLimitReached', true);
  end if;

  for c in
    select cp.profile_id, cp.current_latitude, cp.current_longitude, cp.rating,
      cp.completed_rides,
      (select count(*) from public.rides active_rides where active_rides.captain_id = cp.profile_id
        and active_rides.status in ('accepted', 'captain_arrived', 'in_progress')) as active_workload,
      (select count(*) from public.captain_allocation_history history where history.captain_id = cp.profile_id
        and history.created_at > now() - interval '24 hours' and history.outcome in ('accepted', 'offered')) as recent_offers
    from public.captain_profiles cp
    join public.profiles profile on profile.id = cp.profile_id
    where cp.is_online = true and cp.is_available = true and cp.license_verified = true
      and profile.role = 'captain' and profile.is_suspended = false
      and cp.vehicle_type_id = r.vehicle_type_id
      and cp.current_latitude is not null and cp.current_longitude is not null
      and cp.location_updated_at > now() - make_interval(secs => 90)
      and not exists (
        select 1 from public.captain_allocation_history previous
        where previous.ride_id = r.id and previous.captain_id = cp.profile_id
          and previous.outcome in ('offered', 'accepted', 'rejected', 'timed_out', 'cancelled')
      )
  loop
    distance_m := 6371000 * 2 * asin(sqrt(
      power(sin(radians(c.current_latitude - r.pickup_latitude) / 2), 2) +
      cos(radians(r.pickup_latitude)) * cos(radians(c.current_latitude)) *
      power(sin(radians(c.current_longitude - r.pickup_longitude) / 2), 2)
    ));
    if distance_m > 12000 then continue; end if;
    eta := greatest(1, round(distance_m / 7)::integer);
    workload_score := 100 - least(c.active_workload * 25, 100);
    fairness_score := 100 - least(c.recent_offers * 8, 100);
    reliability_score := least(greatest(coalesce(c.rating, 4) * 20, 0), 100);
    score := 0.40 * (100 - least(distance_m / 120, 100))
           + 0.25 * workload_score
           + 0.25 * fairness_score
           + 0.10 * reliability_score;
    if score > best_score then
      best_score := score;
      chosen := c.profile_id;
    end if;
  end loop;

  if chosen is null then
    update public.rides set status = 'searching', updated_at = now()
      where id = r.id and captain_id is null;
    return jsonb_build_object('rideId', r.id, 'status', 'searching', 'captainAssigned', false);
  end if;

  update public.captain_profiles set is_available = false, updated_at = now()
    where profile_id = chosen and is_available = true and is_online = true;
  get diagnostics claimed = row_count;
  if claimed <> 1 then
    return jsonb_build_object('rideId', r.id, 'status', 'searching', 'captainAssigned', false, 'retry', true);
  end if;

  update public.rides set captain_id = chosen, status = 'searching', updated_at = now()
    where id = r.id and captain_id is null and status in ('requested', 'searching');
  get diagnostics claimed = row_count;
  if claimed <> 1 then
    update public.captain_profiles set is_available = true, updated_at = now() where profile_id = chosen;
    return jsonb_build_object('rideId', r.id, 'status', 'conflict', 'retry', true);
  end if;

  insert into public.captain_allocation_history(
    ride_id, captain_id, attempt_number, eta_seconds, distance_meters,
    workload_score, fairness_score, reliability_score, total_score, outcome, reason
  ) select r.id, chosen, attempt, eta, round(distance_m), workload_score, fairness_score,
    reliability_score, score, 'offered',
    'ETA/proximity 40%, workload 25%, fairness 25%, rating reliability 10%'
  from public.captain_profiles cp
  where cp.profile_id = chosen;

  update public.reassignment_attempts set new_captain_id = chosen, result = 'offered'
    where ride_id = r.id and result = 'queued'
      and attempt_number = (select max(attempt_number) from public.reassignment_attempts where ride_id = r.id);
  insert into public.ride_events(ride_id, actor_id, event_type, description, metadata)
  values(r.id, chosen, 'captain_offer_sent', 'Captain offer sent; awaiting explicit acceptance',
    jsonb_build_object('score', round(best_score, 2), 'attempt', attempt));
  insert into public.notifications(user_id, type, title, body, payload)
  values(chosen, 'ride_offer', 'New ride request', 'A nearby passenger has requested a ride. Accept or reject it in MySawari.',
    jsonb_build_object('rideId', r.id, 'expiresAfterSeconds', 35));
  return jsonb_build_object('rideId', r.id, 'captainId', chosen, 'status', 'searching',
    'offerPending', true, 'score', round(best_score, 2), 'attempt', attempt);
end;
$$;

create or replace function public.reassign_ride(p_ride_id uuid, p_reason text default 'admin_retry')
returns jsonb
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  v public.rides;
  old_captain uuid;
  next_attempt integer;
  max_attempts integer := 3;
begin
  if coalesce(auth.role(), '') <> 'service_role' and not exists(
    select 1 from public.profiles where id = auth.uid() and role = 'admin' and not is_suspended
  ) then raise exception 'Admin or trusted dispatch worker required'; end if;

  select * into v from public.rides where id = p_ride_id for update;
  if not found then raise exception 'Ride not found'; end if;
  if v.status not in ('searching', 'accepted', 'requested') then raise exception 'Ride cannot be reassigned in current state'; end if;
  old_captain := v.captain_id;
  select coalesce(max(attempt_number), 0) + 1 into next_attempt
    from public.reassignment_attempts where ride_id = p_ride_id;

  if old_captain is not null then
    update public.captain_profiles set is_available = true, updated_at = now() where profile_id = old_captain;
    update public.captain_allocation_history set outcome =
      case when p_reason = 'captain_offer_timeout' then 'timed_out' else 'rejected' end
      where ride_id = p_ride_id and captain_id = old_captain and outcome = 'offered';
  end if;

  if next_attempt > max_attempts then
    update public.rides set captain_id = null, status = 'no_captain_available', updated_at = now()
      where id = p_ride_id;
    insert into public.reassignment_attempts(ride_id, previous_captain_id, attempt_number, trigger, result)
      values(p_ride_id, old_captain, next_attempt, left(p_reason, 80), 'max_attempts_reached');
    insert into public.ride_events(ride_id, actor_id, event_type, description)
      values(p_ride_id, auth.uid(), 'reassignment_limit_reached', 'Maximum captain reassignment attempts reached');
    return jsonb_build_object('rideId', p_ride_id, 'status', 'no_captain_available', 'attempt', next_attempt);
  end if;

  update public.rides set captain_id = null, status = 'searching', updated_at = now() where id = p_ride_id;
  insert into public.reassignment_attempts(ride_id, previous_captain_id, attempt_number, trigger, result)
    values(p_ride_id, old_captain, next_attempt, left(p_reason, 80), 'queued');
  insert into public.ride_events(ride_id, actor_id, event_type, description)
    values(p_ride_id, auth.uid(), 'reassignment_requested', left(p_reason, 120));
  insert into public.notifications(user_id, type, title, body, payload)
    values(v.rider_id, 'ride_reassignment', 'Finding another captain', 'Your ride is being matched with another available captain.', jsonb_build_object('rideId', v.id, 'attempt', next_attempt));
  return jsonb_build_object('rideId', p_ride_id, 'previousCaptainId', old_captain,
    'status', 'searching', 'attempt', next_attempt, 'nextStep', 'automatic_dispatch_worker');
end;
$$;

-- Captain accepts or rejects the specific pending offer. An offer is not treated
-- as accepted until the captain explicitly accepts it.
create or replace function public.captain_ride_action(p_ride_id uuid, p_action text, p_note text default '')
returns jsonb
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  v public.rides;
  next_status text;
begin
  if auth.uid() is null or not exists(select 1 from public.captain_profiles where profile_id = auth.uid()) then
    raise exception 'Captain profile required';
  end if;
  if p_action not in ('accept', 'reject', 'cancel', 'arrived', 'start', 'complete') then raise exception 'Invalid action'; end if;

  if p_action = 'accept' then
    if not exists(select 1 from public.captain_profiles where profile_id = auth.uid() and is_online = true and license_verified = true) then
      raise exception 'Captain must be online and verified to accept an offer';
    end if;
    update public.rides set status = 'accepted', accepted_at = now(), updated_at = now()
      where id = p_ride_id and captain_id = auth.uid() and status = 'searching'
      returning * into v;
    if not found then raise exception 'No pending offer exists for this captain'; end if;
    update public.captain_allocation_history set outcome = 'accepted'
      where ride_id = p_ride_id and captain_id = auth.uid() and outcome = 'offered';
  elsif p_action in ('reject', 'cancel') then
    update public.rides set captain_id = null, status = 'searching', updated_at = now()
      where id = p_ride_id and captain_id = auth.uid()
        and ((p_action = 'reject' and status = 'searching')
          or (p_action = 'cancel' and status in ('searching','accepted','captain_arrived')))
      returning * into v;
    if not found then raise exception 'No cancellable ride offer or assignment exists for this captain'; end if;
    update public.captain_profiles set is_available = true, updated_at = now() where profile_id = auth.uid();
    update public.captain_allocation_history set outcome = case when p_action = 'cancel' then 'cancelled' else 'rejected' end
      where ride_id = p_ride_id and captain_id = auth.uid() and outcome in ('offered','accepted');
  else
    next_status := case p_action when 'arrived' then 'captain_arrived' when 'start' then 'in_progress' when 'complete' then 'completed' end;
    update public.rides set status = next_status,
      started_at = case when p_action = 'start' then now() else started_at end,
      completed_at = case when p_action = 'complete' then now() else completed_at end,
      updated_at = now()
      where id = p_ride_id and captain_id = auth.uid()
        and ((p_action = 'arrived' and status = 'accepted')
          or (p_action = 'start' and status = 'captain_arrived')
          or (p_action = 'complete' and status = 'in_progress'))
      returning * into v;
    if not found then raise exception 'Ride action is not valid for current state'; end if;
    if p_action = 'complete' then
      update public.captain_profiles set is_available = true, completed_rides = completed_rides + 1,
        updated_at = now() where profile_id = auth.uid();
    end if;
  end if;

  insert into public.ride_events(ride_id, actor_id, event_type, description)
    values(v.id, auth.uid(), 'captain_' || p_action, coalesce(nullif(p_note, ''), p_action));
  insert into public.notifications(user_id, type, title, body, payload)
    values(v.rider_id, 'ride_update', 'Ride status updated', 'Your ride status is now ' || v.status || '.',
      jsonb_build_object('rideId', v.id, 'status', v.status));
  return to_jsonb(v);
end;
$$;

-- GeoJSON Polygon point-in-zone calculation: demand and supply are counted per zone.
create or replace function public.refresh_zone_intelligence()
returns jsonb
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  z record;
  demand integer;
  supply integer;
  ratio numeric;
  multiplier numeric;
  historical_avg numeric;
  predicted numeric;
  level text;
  bucket timestamptz := date_trunc('hour', now());
  updated_count integer := 0;
begin
  if coalesce(auth.role(), '') <> 'service_role' and not exists(
    select 1 from public.profiles where id = auth.uid() and role = 'admin' and not is_suspended
  ) then raise exception 'Admin or trusted worker required'; end if;

  for z in select id, polygon_geojson from public.service_zones where is_active = true loop
    select count(*)::integer into demand from public.rides ride
      where ride.created_at > now() - interval '30 minutes'
        and ride.status not in ('cancelled', 'completed', 'no_captain_available')
        and public.zone_contains_point(ride.pickup_latitude, ride.pickup_longitude, z.polygon_geojson);
    select count(*)::integer into supply from public.captain_profiles cp
      where cp.is_online = true and cp.is_available = true
        and cp.location_updated_at > now() - interval '2 minutes'
        and cp.current_latitude is not null
        and public.zone_contains_point(cp.current_latitude, cp.current_longitude, z.polygon_geojson);

    insert into public.demand_history(zone_id, bucket_start, request_count, source)
      values(z.id, bucket, demand, 'live')
      on conflict(zone_id, bucket_start, source) do update set request_count = excluded.request_count;

    select avg(request_count)::numeric into historical_avg from public.demand_history
      where zone_id = z.id and source in ('live', 'simulated')
        and bucket_start >= now() - interval '28 days'
        and extract(hour from bucket_start) = extract(hour from now())
        and extract(dow from bucket_start) = extract(dow from now());

    ratio := demand::numeric / greatest(supply, 1);
    multiplier := least(1.5, greatest(1.0, 1.0 + greatest(ratio - 1.0, 0) * 0.15));
    predicted := greatest(0, coalesce(historical_avg, demand::numeric * 2));
    level := case when ratio >= 2 then 'shortage' when ratio >= 1 then 'elevated' else 'normal' end;

    insert into public.zone_metrics(zone_id, demand_count, supply_count, demand_supply_ratio,
      price_multiplier, shortage_level, reason)
      values(z.id, demand, supply, ratio, multiplier, level,
        'Per-zone pickup demand over 30 minutes divided by fresh available captains');
    insert into public.demand_forecasts(zone_id, forecast_for, predicted_requests, online_captains,
      shortage_level, confidence, algorithm_version, source)
      values(z.id, now() + interval '30 minutes', predicted, supply, level,
        case when historical_avg is null then 0.25 else 0.65 end,
        'zone-hour-weekday-moving-average-v2', case when historical_avg is null then 'low-data-fallback' else 'computed' end);
    updated_count := updated_count + 1;
  end loop;
  return jsonb_build_object('zonesUpdated', updated_count, 'generatedAt', now(),
    'algorithm', 'zone-hour-weekday-moving-average-v2', 'syntheticDataUsed', false);
end;
$$;

create or replace function public.get_zone_multiplier(p_latitude double precision, p_longitude double precision)
returns jsonb
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  z record;
  metric record;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  for z in select id, polygon_geojson from public.service_zones where is_active = true loop
    if public.zone_contains_point(p_latitude, p_longitude, z.polygon_geojson) then
      select price_multiplier, shortage_level into metric from public.zone_metrics
        where zone_id = z.id order by created_at desc limit 1;
      return jsonb_build_object('zoneId', z.id, 'priceMultiplier', coalesce(metric.price_multiplier, 1),
        'shortageLevel', coalesce(metric.shortage_level, 'normal'));
    end if;
  end loop;
  return jsonb_build_object('zoneId', null, 'priceMultiplier', 1, 'shortageLevel', 'normal');
end;
$$;

create or replace function public.save_pool_optimized_route(
  p_pool_id uuid, p_route_order jsonb, p_route_distance_meters integer,
  p_route_duration_seconds integer, p_actor_id uuid
) returns jsonb
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  pool_row public.ride_pools;
begin
  if p_actor_id is null or not exists(
    select 1 from public.ride_pool_members m where m.pool_id = p_pool_id and m.rider_id = p_actor_id
    union all
    select 1 from public.ride_pools p where p.id = p_pool_id and p.captain_id = p_actor_id
  ) then raise exception 'Pool participant required'; end if;
  if jsonb_typeof(p_route_order) <> 'array' or jsonb_array_length(p_route_order) < 2
     or jsonb_array_length(p_route_order) > 8 then raise exception 'Invalid optimized route'; end if;
  update public.ride_pools set route_order = p_route_order,
    route_distance_meters = p_route_distance_meters,
    route_duration_seconds = p_route_duration_seconds, updated_at = now()
    where id = p_pool_id returning * into pool_row;
  if not found then raise exception 'Pool not found'; end if;
  return jsonb_build_object('poolId', pool_row.id, 'routeDistanceMeters', pool_row.route_distance_meters,
    'routeDurationSeconds', pool_row.route_duration_seconds, 'routeOrder', pool_row.route_order);
end;
$$;

-- SECURITY DEFINER functions must not retain PostgreSQL's default PUBLIC execute grant.
revoke all on function public.zone_contains_point(double precision,double precision,jsonb) from public, anon, authenticated;
revoke all on function public.create_ride_request(uuid,uuid,double precision,double precision,double precision,double precision,text,text,smallint,boolean,integer,integer,numeric,numeric,text) from public, anon, authenticated;
revoke all on function public.allocate_ride(uuid) from public, anon;
revoke all on function public.reassign_ride(uuid,text) from public, anon;
revoke all on function public.captain_ride_action(uuid,text,text) from public, anon;
revoke all on function public.refresh_zone_intelligence() from public, anon;
revoke all on function public.get_zone_multiplier(double precision,double precision) from public, anon;
revoke all on function public.save_pool_optimized_route(uuid,jsonb,integer,integer,uuid) from public, anon, authenticated;

-- User-facing functions are available only to authenticated sessions; privileged
-- dispatch and ride creation are available only to service_role plus admin-gated RPCs.
grant execute on function public.create_ride_request(uuid,uuid,double precision,double precision,double precision,double precision,text,text,smallint,boolean,integer,integer,numeric,numeric,text) to service_role;
grant execute on function public.allocate_ride(uuid) to authenticated, service_role;
grant execute on function public.reassign_ride(uuid,text) to authenticated, service_role;
grant execute on function public.captain_ride_action(uuid,text,text) to authenticated;
grant execute on function public.refresh_zone_intelligence() to authenticated, service_role;
grant execute on function public.get_zone_multiplier(double precision,double precision) to authenticated;
grant execute on function public.save_pool_optimized_route(uuid,jsonb,integer,integer,uuid) to service_role;

-- Existing functions are explicitly restricted as well.
revoke all on function public.get_nearby_captains(double precision,double precision,integer,integer) from public, anon;
revoke all on function public.set_captain_verification(uuid,boolean) from public, anon;
revoke all on function public.create_ride_rating(uuid,smallint,text) from public, anon;
revoke all on function public.cancel_ride_request(uuid,text) from public, anon;
revoke all on function public.find_pool_candidates(uuid) from public, anon;
revoke all on function public.create_ride_pool(uuid,numeric) from public, anon;
revoke all on function public.join_ride_pool(uuid,uuid) from public, anon;
revoke all on function public.leave_ride_pool(uuid,text) from public, anon;
revoke all on function public.create_trip_share_token(uuid,integer) from public, anon;
revoke all on function public.get_shared_trip(text) from public;

grant execute on function public.get_nearby_captains(double precision,double precision,integer,integer) to authenticated;
grant execute on function public.set_captain_verification(uuid,boolean) to authenticated;
grant execute on function public.create_ride_rating(uuid,smallint,text) to authenticated;
grant execute on function public.cancel_ride_request(uuid,text) to authenticated;
grant execute on function public.find_pool_candidates(uuid) to authenticated;
grant execute on function public.create_ride_pool(uuid,numeric) to authenticated;
grant execute on function public.join_ride_pool(uuid,uuid) to authenticated;
grant execute on function public.leave_ride_pool(uuid,text) to authenticated;
grant execute on function public.create_trip_share_token(uuid,integer) to authenticated;
grant execute on function public.get_shared_trip(text) to anon, authenticated;

comment on function public.allocate_ride(uuid) is 'Weighted, explainable captain offer assignment. Captain must explicitly accept before ride status changes to accepted.';
comment on function public.refresh_zone_intelligence() is 'Computes demand, supply, capped surge and hourly/weekday forecasts independently per GeoJSON Polygon service zone.';

-- Keep a captain offline until the account is verified.
create or replace function public.set_captain_availability(p_is_online boolean)
returns jsonb
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  cp public.captain_profiles;
begin
  select * into cp from public.captain_profiles where profile_id = auth.uid() for update;
  if not found then raise exception 'Captain profile required'; end if;
  if p_is_online and not cp.license_verified then raise exception 'Captain verification is required before going online'; end if;
  if not p_is_online and exists(select 1 from public.rides r where r.captain_id = auth.uid() and r.status in ('accepted','captain_arrived','in_progress')) then
    raise exception 'Complete or cancel your active ride before going offline';
  end if;
  if not p_is_online then
    with released as (
      update public.rides set captain_id = null, status = 'searching', updated_at = now()
        where captain_id = auth.uid() and status = 'searching'
        returning id, rider_id
    )
    insert into public.ride_events(ride_id, actor_id, event_type, description)
      select id, auth.uid(), 'captain_went_offline', 'Captain went offline before accepting the offer' from released;
    update public.captain_allocation_history set outcome = 'rejected'
      where captain_id = auth.uid() and outcome = 'offered'
        and ride_id in (select id from public.rides where captain_id is null and status = 'searching');
  end if;
  update public.captain_profiles set is_online = p_is_online, is_available = true,
    updated_at = now() where profile_id = auth.uid() returning * into cp;
  return jsonb_build_object('profileId', cp.profile_id, 'isOnline', cp.is_online, 'isAvailable', cp.is_available);
end;
$$;

-- Rider cancellation also releases a captain holding a pending/accepted ride.
create or replace function public.cancel_ride_request(p_ride_id uuid, p_reason text default 'rider_cancelled')
returns jsonb
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  v public.rides;
  old_captain uuid;
begin
  update public.rides set status = 'cancelled', cancelled_at = now(),
    cancel_reason = left(coalesce(p_reason, 'rider_cancelled'), 120), updated_at = now()
    where id = p_ride_id and rider_id = auth.uid()
      and status in ('requested','searching','accepted')
    returning * into v;
  if not found then raise exception 'Ride cannot be cancelled or is not yours'; end if;
  old_captain := v.captain_id;
  if old_captain is not null then
    update public.captain_profiles set is_available = true, updated_at = now()
      where profile_id = old_captain and is_online = true;
    update public.captain_allocation_history set outcome = 'cancelled'
      where ride_id = v.id and captain_id = old_captain and outcome in ('offered','accepted');
  end if;
  insert into public.ride_events(ride_id, actor_id, event_type, description)
    values(v.id, auth.uid(), 'ride_cancelled', left(coalesce(p_reason, 'rider_cancelled'), 120));
  if old_captain is not null then
    insert into public.notifications(user_id, type, title, body, payload)
      values(old_captain, 'ride_cancelled', 'Ride cancelled', 'The passenger cancelled this ride offer or booking.', jsonb_build_object('rideId', v.id));
  end if;
  return to_jsonb(v);
end;
$$;

-- Approximate compatibility filter before the exact route-stop optimizer runs.
create or replace function public.geo_distance_m(
  p_lat_a double precision, p_lon_a double precision,
  p_lat_b double precision, p_lon_b double precision
) returns double precision
language sql immutable
as $$
  select 6371000 * 2 * asin(sqrt(
    power(sin(radians(p_lat_b-p_lat_a)/2),2) +
    cos(radians(p_lat_a))*cos(radians(p_lat_b))*power(sin(radians(p_lon_b-p_lon_a)/2),2)
  ));
$$;

create or replace function public.find_pool_candidates(p_ride_id uuid)
returns setof jsonb
language plpgsql security definer
set search_path = public, extensions
as $$
declare r public.rides;
begin
  select * into r from public.rides where id = p_ride_id and rider_id = auth.uid()
    and pooling_opt_in = true and status = 'requested';
  if not found then raise exception 'Eligible pooling ride not found'; end if;
  return query
    select jsonb_build_object('poolId', p.id, 'availableSeats', p.capacity-p.seats_reserved,
      'vehicleTypeId', p.vehicle_type_id, 'maxDetourPercent', p.max_detour_percent,
      'compatibility', 'pickup-and-drop proximity prefilter')
    from public.ride_pools p
    where p.status = 'open' and p.vehicle_type_id = r.vehicle_type_id
      and p.capacity-p.seats_reserved >= r.passenger_count
      and exists (
        select 1 from public.ride_pool_members m join public.rides existing on existing.id=m.ride_id
        where m.pool_id=p.id
          and public.geo_distance_m(existing.pickup_latitude,existing.pickup_longitude,r.pickup_latitude,r.pickup_longitude)<=5000
          and public.geo_distance_m(existing.drop_latitude,existing.drop_longitude,r.drop_latitude,r.drop_longitude)<=7000
      )
    order by p.created_at asc limit 10;
end;
$$;

create or replace function public.create_ride_pool(p_ride_id uuid, p_max_detour_percent numeric default 20)
returns jsonb
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  r public.rides;
  p public.ride_pools;
  cap integer;
begin
  select * into r from public.rides where id=p_ride_id and rider_id=auth.uid()
    and pooling_opt_in=true and status='requested' for update;
  if not found then raise exception 'Eligible pooling ride not found'; end if;
  select capacity into cap from public.vehicle_types where id=r.vehicle_type_id and is_active=true;
  if cap is null or cap < 2 then raise exception 'This vehicle type does not support pooling'; end if;
  if r.passenger_count >= cap then raise exception 'No spare seats are available for pooling'; end if;
  insert into public.ride_pools(vehicle_type_id,capacity,seats_reserved,max_detour_percent,route_order)
    values(r.vehicle_type_id,cap,r.passenger_count,least(greatest(p_max_detour_percent,5),40),
      jsonb_build_array(
        jsonb_build_object('rideId',r.id,'stopType','pickup','latitude',r.pickup_latitude,'longitude',r.pickup_longitude),
        jsonb_build_object('rideId',r.id,'stopType','drop','latitude',r.drop_latitude,'longitude',r.drop_longitude)
      )) returning * into p;
  insert into public.ride_pool_members(pool_id,ride_id,rider_id,passenger_count,fare_share)
    values(p.id,r.id,r.rider_id,r.passenger_count,r.estimated_fare);
  return to_jsonb(p);
end;
$$;

create or replace function public.join_ride_pool(p_pool_id uuid, p_ride_id uuid)
returns jsonb
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  p public.ride_pools;
  r public.rides;
  compatible boolean;
begin
  select * into p from public.ride_pools where id=p_pool_id for update;
  if not found then raise exception 'Pool not found'; end if;
  select * into r from public.rides where id=p_ride_id and rider_id=auth.uid()
    and pooling_opt_in=true and status='requested' for update;
  if not found then raise exception 'Eligible pooling ride not found'; end if;
  if p.status <> 'open' or p.vehicle_type_id <> r.vehicle_type_id
    or p.seats_reserved+r.passenger_count>p.capacity then raise exception 'Pool is not compatible or has no seats'; end if;
  select exists(
    select 1 from public.ride_pool_members m join public.rides existing on existing.id=m.ride_id
    where m.pool_id=p.id
      and public.geo_distance_m(existing.pickup_latitude,existing.pickup_longitude,r.pickup_latitude,r.pickup_longitude)<=5000
      and public.geo_distance_m(existing.drop_latitude,existing.drop_longitude,r.drop_latitude,r.drop_longitude)<=7000
  ) into compatible;
  if not compatible then raise exception 'Pickup/drop locations are outside the pool compatibility radius'; end if;
  insert into public.ride_pool_members(pool_id,ride_id,rider_id,passenger_count,fare_share)
    values(p.id,r.id,r.rider_id,r.passenger_count,r.estimated_fare);
  update public.ride_pools set seats_reserved=seats_reserved+r.passenger_count,updated_at=now() where id=p.id;
  return jsonb_build_object('poolId',p.id,'rideId',r.id,'seatsReserved',p.seats_reserved+r.passenger_count);
end;
$$;

revoke all on function public.set_captain_availability(boolean) from public, anon;
revoke all on function public.geo_distance_m(double precision,double precision,double precision,double precision) from public, anon, authenticated;
revoke all on function public.find_pool_candidates(uuid) from public, anon;
revoke all on function public.create_ride_pool(uuid,numeric) from public, anon;
revoke all on function public.join_ride_pool(uuid,uuid) from public, anon;
revoke all on function public.cancel_ride_request(uuid,text) from public, anon;
grant execute on function public.set_captain_availability(boolean) to authenticated;
grant execute on function public.find_pool_candidates(uuid) to authenticated;
grant execute on function public.create_ride_pool(uuid,numeric) to authenticated;
grant execute on function public.join_ride_pool(uuid,uuid) to authenticated;
grant execute on function public.cancel_ride_request(uuid,text) to authenticated;

-- User-scoped in-app notifications (including captain ride offers).
drop policy if exists notifications_owner_update on public.notifications;
create policy notifications_owner_update on public.notifications for update to authenticated
  using(user_id = auth.uid()) with check(user_id = auth.uid());
revoke all on public.notifications from anon, authenticated;
grant select on public.notifications to authenticated;
grant update(read_at) on public.notifications to authenticated;

-- Realtime: authenticated riders can read the assigned captain's live coordinates
-- only while they participate in that ride. Captains retain access to their own row.
drop policy if exists captain_assigned_rider_read on public.captain_profiles;
create policy captain_assigned_rider_read on public.captain_profiles for select to authenticated
  using(exists(
    select 1 from public.rides r where r.captain_id = captain_profiles.profile_id
      and r.rider_id = auth.uid() and r.status in ('accepted','captain_arrived','in_progress')
  ));

alter table public.rides replica identity full;
alter table public.captain_profiles replica identity full;
alter table public.notifications replica identity full;
alter table public.ride_events replica identity full;

do $$
declare
  table_name text;
begin
  if exists(select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach table_name in array array['rides','captain_profiles','notifications','ride_events'] loop
      if not exists(
        select 1 from pg_publication_tables
        where pubname='supabase_realtime' and schemaname='public' and tablename=table_name
      ) then
        execute format('alter publication supabase_realtime add table public.%I', table_name);
      end if;
    end loop;
  end if;
end;
$$;

-- Keep trip-share token hashing independent of the extension's installed schema.
create or replace function public.create_trip_share_token(p_ride_id uuid, p_expires_minutes integer default 120)
returns jsonb
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  raw_token text;
  expiry_minutes integer := least(greatest(coalesce(p_expires_minutes, 120), 5), 1440);
begin
  if auth.uid() is null or not exists(
    select 1 from public.rides where id=p_ride_id and (rider_id=auth.uid() or captain_id=auth.uid())
  ) then raise exception 'Ride not found or not accessible'; end if;
  raw_token := encode(gen_random_bytes(32), 'hex');
  insert into public.trip_share_tokens(ride_id, created_by, token_hash, expires_at)
    values(p_ride_id, auth.uid(), encode(digest(raw_token, 'sha256'), 'hex'), now()+make_interval(mins=>expiry_minutes));
  return jsonb_build_object('token', raw_token, 'expiresInMinutes', expiry_minutes);
end;
$$;

create or replace function public.get_shared_trip(p_token text)
returns jsonb
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  result jsonb;
begin
  if p_token is null or length(p_token) < 32 or length(p_token) > 128 then
    raise exception 'Share link is invalid or expired';
  end if;
  select jsonb_build_object(
    'rideId', r.id, 'status', r.status,
    'pickupAddress', r.pickup_address, 'dropAddress', r.drop_address,
    'requestedAt', r.requested_at, 'updatedAt', r.updated_at
  ) into result
  from public.trip_share_tokens t
  join public.rides r on r.id=t.ride_id
  where t.token_hash=encode(digest(p_token, 'sha256'), 'hex')
    and t.revoked_at is null and t.expires_at > now();
  if result is null then raise exception 'Share link is invalid or expired'; end if;
  return result;
end;
$$;

revoke all on function public.create_trip_share_token(uuid,integer) from public, anon;
revoke all on function public.get_shared_trip(text) from public;
grant execute on function public.create_trip_share_token(uuid,integer) to authenticated;
grant execute on function public.get_shared_trip(text) to anon, authenticated;

-- Availability changes must go through the verification-aware RPC, not a direct
-- PostgREST table update that could bypass the verified-online guard.
revoke update(is_online) on public.captain_profiles from authenticated;
