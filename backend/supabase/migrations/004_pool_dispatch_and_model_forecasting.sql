-- MySawari v3.0 operational hardening.
-- Adds shared-captain dispatch for multi-passenger pools, pooled ride lifecycle,
-- singleton pool fallback, stricter admin verification, and forecast model metadata.

alter table public.demand_forecasts
  add column if not exists model_metrics jsonb not null default '{}'::jsonb;

-- A suspended administrator must not be able to verify captains through a direct RPC call.
create or replace function public.set_captain_verification(p_captain_id uuid, p_verified boolean)
returns jsonb
language plpgsql security definer
set search_path = public, extensions
as $$
declare v public.captain_profiles;
begin
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and not is_suspended
  ) then raise exception 'Active administrator required'; end if;
  update public.captain_profiles
    set license_verified = p_verified, updated_at = now()
    where profile_id = p_captain_id returning * into v;
  if not found then raise exception 'Captain profile not found'; end if;
  insert into public.audit_logs(actor_id, action, entity_type, entity_id, metadata)
    values(auth.uid(), 'captain_verification_updated', 'captain', p_captain_id::text,
      jsonb_build_object('verified', p_verified));
  return jsonb_build_object('captainId', v.profile_id, 'licenseVerified', v.license_verified);
end;
$$;

-- Dispatch a compatible multi-rider pool to ONE captain. Every member ride receives
-- the same captain offer, and the captain accepts/starts/completes the pool as one unit.
create or replace function public.allocate_pool(p_pool_id uuid)
returns jsonb
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  p public.ride_pools;
  c record;
  chosen uuid;
  member_count integer;
  total_passengers integer;
  center_lat double precision;
  center_lng double precision;
  attempt integer;
  distance_m double precision;
  eta integer;
  workload_score numeric;
  fairness_score numeric;
  reliability_score numeric;
  score numeric;
  best_score numeric := -1;
  claimed integer;
  assigned_count integer;
  member_row record;
begin
  if coalesce(auth.role(), '') <> 'service_role' and not exists(
    select 1 from public.profiles where id = auth.uid() and role = 'admin' and not is_suspended
  ) then raise exception 'Trusted dispatch worker or active administrator required'; end if;

  select * into p from public.ride_pools where id = p_pool_id for update;
  if not found then raise exception 'Pool not found'; end if;
  if p.status <> 'open' then
    return jsonb_build_object('poolId', p.id, 'status', p.status, 'message', 'Pool is not open for dispatch');
  end if;

  select count(*)::integer, coalesce(sum(m.passenger_count), 0)::integer,
         avg(r.pickup_latitude), avg(r.pickup_longitude)
    into member_count, total_passengers, center_lat, center_lng
    from public.ride_pool_members m join public.rides r on r.id = m.ride_id
    where m.pool_id = p.id and m.status = 'active';

  if member_count < 2 then
    return jsonb_build_object('poolId', p.id, 'status', 'waiting_for_pool_members', 'memberCount', member_count);
  end if;
  if total_passengers > p.capacity then raise exception 'Pool passenger count exceeds vehicle capacity'; end if;
  if exists(
    select 1 from public.ride_pool_members m join public.rides r on r.id = m.ride_id
    where m.pool_id = p.id and (r.status not in ('requested', 'searching') or r.captain_id is not null)
  ) then
    return jsonb_build_object('poolId', p.id, 'status', 'not_dispatchable', 'message', 'A pool member ride is no longer waiting');
  end if;

  select coalesce(max(h.attempt_number), 0) + 1 into attempt
    from public.captain_allocation_history h
    join public.ride_pool_members m on m.ride_id = h.ride_id
    where m.pool_id = p.id;
  if attempt > 4 then
    update public.ride_pools set status = 'cancelled', updated_at = now() where id = p.id;
    update public.rides r set status = 'no_captain_available', captain_id = null, updated_at = now()
      where r.id in (select ride_id from public.ride_pool_members where pool_id = p.id);
    insert into public.ride_events(ride_id, actor_id, event_type, description)
      select ride_id, null, 'pool_dispatch_attempt_limit', 'No captain accepted the shared ride after four offers.'
      from public.ride_pool_members where pool_id = p.id;
    return jsonb_build_object('poolId', p.id, 'status', 'no_captain_available', 'attemptLimitReached', true);
  end if;

  for c in
    select cp.profile_id, cp.current_latitude, cp.current_longitude, cp.rating,
      (select count(*) from public.rides ar where ar.captain_id = cp.profile_id
        and ar.status in ('accepted', 'captain_arrived', 'in_progress')) as active_workload,
      (select count(*) from public.captain_allocation_history h
        where h.captain_id = cp.profile_id and h.created_at > now() - interval '24 hours'
          and h.outcome in ('offered', 'accepted')) as recent_offers
    from public.captain_profiles cp
    join public.profiles pr on pr.id = cp.profile_id
    where cp.is_online and cp.is_available and cp.license_verified
      and cp.vehicle_type_id = p.vehicle_type_id
      and cp.current_latitude is not null and cp.current_longitude is not null
      and cp.location_updated_at > now() - interval '90 seconds'
      and pr.role = 'captain' and not pr.is_suspended
      and not exists (
        select 1 from public.captain_allocation_history previous
        join public.ride_pool_members pm on pm.ride_id = previous.ride_id
        where pm.pool_id = p.id and previous.captain_id = cp.profile_id
          and previous.outcome in ('offered', 'accepted', 'rejected', 'timed_out', 'cancelled')
      )
  loop
    distance_m := 6371000 * 2 * asin(sqrt(
      power(sin(radians(c.current_latitude - center_lat) / 2), 2)
      + cos(radians(center_lat)) * cos(radians(c.current_latitude))
      * power(sin(radians(c.current_longitude - center_lng) / 2), 2)
    ));
    if distance_m > 12000 then continue; end if;
    eta := greatest(1, round(distance_m / 7)::integer);
    workload_score := 100 - least(c.active_workload * 25, 100);
    fairness_score := 100 - least(c.recent_offers * 8, 100);
    reliability_score := least(greatest(coalesce(c.rating, 4) * 20, 0), 100);
    score := 0.40 * (100 - least(distance_m / 120, 100))
      + 0.25 * workload_score + 0.25 * fairness_score + 0.10 * reliability_score;
    if score > best_score then best_score := score; chosen := c.profile_id; end if;
  end loop;

  if chosen is null then
    return jsonb_build_object('poolId', p.id, 'status', 'open', 'captainAssigned', false, 'message', 'No eligible captain currently available');
  end if;

  update public.captain_profiles set is_available = false, updated_at = now()
    where profile_id = chosen and is_online and is_available;
  get diagnostics claimed = row_count;
  if claimed <> 1 then
    return jsonb_build_object('poolId', p.id, 'status', 'open', 'captainAssigned', false, 'retry', true);
  end if;

  update public.ride_pools set captain_id = chosen, status = 'locked', updated_at = now() where id = p.id;
  update public.rides r set captain_id = chosen, status = 'searching', updated_at = now()
    where r.id in (select ride_id from public.ride_pool_members where pool_id = p.id)
      and r.captain_id is null and r.status in ('requested', 'searching');
  get diagnostics assigned_count = row_count;
  if assigned_count <> member_count then raise exception 'Pool assignment conflict; transaction rolled back'; end if;

  update public.reassignment_attempts set new_captain_id = chosen, result = 'offered'
    where result = 'queued' and ride_id in (select ride_id from public.ride_pool_members where pool_id = p.id);

  for member_row in
    select r.id, r.rider_id, r.pickup_latitude, r.pickup_longitude
    from public.ride_pool_members m join public.rides r on r.id = m.ride_id
    where m.pool_id = p.id
  loop
    distance_m := 6371000 * 2 * asin(sqrt(
      power(sin(radians((select current_latitude from public.captain_profiles where profile_id = chosen) - member_row.pickup_latitude) / 2), 2)
      + cos(radians(member_row.pickup_latitude))
      * cos(radians((select current_latitude from public.captain_profiles where profile_id = chosen)))
      * power(sin(radians((select current_longitude from public.captain_profiles where profile_id = chosen) - member_row.pickup_longitude) / 2), 2)
    ));
    insert into public.captain_allocation_history(
      ride_id, captain_id, attempt_number, eta_seconds, distance_meters,
      workload_score, fairness_score, reliability_score, total_score, outcome, reason
    ) values(member_row.id, chosen, attempt, greatest(1, round(distance_m / 7)::integer), round(distance_m),
      workload_score, fairness_score, reliability_score, best_score, 'offered',
      'Shared-pool dispatch; proximity/ETA 40%, workload 25%, fairness 25%, rating 10%');
    insert into public.ride_events(ride_id, actor_id, event_type, description, metadata)
      values(member_row.id, chosen, 'pool_captain_offer_sent', 'A captain was offered the shared ride.',
        jsonb_build_object('poolId', p.id, 'score', round(best_score, 2), 'attempt', attempt));
    insert into public.notifications(user_id, type, title, body, payload)
      values(member_row.rider_id, 'ride_offer', 'Shared ride is being assigned',
        'A captain has been offered your shared ride. The captain must accept before pickup.',
        jsonb_build_object('rideId', member_row.id, 'poolId', p.id, 'expiresAfterSeconds', 35));
  end loop;

  return jsonb_build_object('poolId', p.id, 'captainId', chosen, 'status', 'locked',
    'offerPending', true, 'memberCount', member_count, 'score', round(best_score, 2), 'attempt', attempt);
end;
$$;

-- A single pool captain drives every member ride through the same state transition.
create or replace function public.pool_ride_action(p_pool_id uuid, p_action text, p_note text default '')
returns jsonb
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  p public.ride_pools;
  member_count integer;
  changed_count integer;
  next_status text;
  history_outcome text;
begin
  if auth.uid() is null or not exists(
    select 1 from public.profiles where id = auth.uid() and role = 'captain' and not is_suspended
  ) then raise exception 'Active captain account required'; end if;
  if p_action not in ('accept', 'reject', 'arrived', 'start', 'complete', 'cancel') then
    raise exception 'Invalid pool action';
  end if;

  select * into p from public.ride_pools where id = p_pool_id and captain_id = auth.uid() for update;
  if not found then raise exception 'Pool offer not found for this captain'; end if;
  select count(*)::integer into member_count from public.ride_pool_members where pool_id = p.id and status = 'active';

  if p_action = 'accept' then
    update public.rides set status = 'accepted', accepted_at = now(), updated_at = now()
      where id in (select ride_id from public.ride_pool_members where pool_id = p.id)
        and captain_id = auth.uid() and status = 'searching';
    get diagnostics changed_count = row_count;
    if changed_count <> member_count then raise exception 'Not all pool rides have a pending offer'; end if;
    update public.captain_allocation_history set outcome = 'accepted'
      where captain_id = auth.uid() and outcome = 'offered'
        and ride_id in (select ride_id from public.ride_pool_members where pool_id = p.id);
    update public.ride_pools set updated_at = now() where id = p.id;
    next_status := 'accepted';
  elsif p_action in ('reject', 'cancel') then
    if p_action = 'reject' and p.status <> 'locked' then raise exception 'Only a pending pool offer can be rejected'; end if;
    if p_action = 'cancel' and p.status not in ('locked') then raise exception 'Pool can no longer be cancelled by this action'; end if;
    update public.rides set captain_id = null, status = 'searching', updated_at = now()
      where id in (select ride_id from public.ride_pool_members where pool_id = p.id)
        and captain_id = auth.uid() and status in ('searching', 'accepted', 'captain_arrived');
    update public.captain_profiles set is_available = true, updated_at = now() where profile_id = auth.uid();
    history_outcome := case when p_action = 'reject' then 'rejected' else 'cancelled' end;
    update public.captain_allocation_history set outcome = history_outcome
      where captain_id = auth.uid() and outcome in ('offered', 'accepted')
        and ride_id in (select ride_id from public.ride_pool_members where pool_id = p.id);
    update public.ride_pools set captain_id = null, status = 'open', updated_at = now() where id = p.id;
    insert into public.reassignment_attempts(ride_id, previous_captain_id, attempt_number, trigger, result)
      select m.ride_id, auth.uid(), coalesce((select max(a.attempt_number) from public.reassignment_attempts a where a.ride_id = m.ride_id), 0) + 1,
        p_action, 'queued'
      from public.ride_pool_members m where m.pool_id = p.id
      on conflict (ride_id, attempt_number) do nothing;
    insert into public.notifications(user_id, type, title, body, payload)
      select m.rider_id, 'ride_reassignment', 'Finding another captain',
        'Your shared-ride captain is unavailable. MySawari is finding another captain.',
        jsonb_build_object('poolId', p.id, 'reason', p_action)
      from public.ride_pool_members m where m.pool_id = p.id;
    next_status := 'open';
  else
    next_status := case p_action when 'arrived' then 'captain_arrived'
      when 'start' then 'in_progress' when 'complete' then 'completed' end;
    update public.rides set status = next_status,
      started_at = case when p_action = 'start' then now() else started_at end,
      completed_at = case when p_action = 'complete' then now() else completed_at end,
      updated_at = now()
      where id in (select ride_id from public.ride_pool_members where pool_id = p.id)
        and captain_id = auth.uid()
        and ((p_action = 'arrived' and status = 'accepted')
          or (p_action = 'start' and status = 'captain_arrived')
          or (p_action = 'complete' and status = 'in_progress'));
    get diagnostics changed_count = row_count;
    if changed_count <> member_count then raise exception 'Pool state transition is not valid for every member ride'; end if;
    if p_action = 'complete' then
      update public.captain_profiles set is_available = true,
        completed_rides = completed_rides + member_count, updated_at = now()
        where profile_id = auth.uid();
      update public.ride_pools set status = 'completed', updated_at = now() where id = p.id;
    elsif p_action = 'start' then
      update public.ride_pools set status = 'in_progress', updated_at = now() where id = p.id;
    end if;
  end if;

  insert into public.ride_events(ride_id, actor_id, event_type, description, metadata)
    select m.ride_id, auth.uid(), 'pool_captain_' || p_action,
      coalesce(nullif(p_note, ''), 'Shared ride ' || p_action), jsonb_build_object('poolId', p.id)
    from public.ride_pool_members m where m.pool_id = p.id;
  insert into public.notifications(user_id, type, title, body, payload)
    select m.rider_id, 'ride_update', 'Shared ride updated',
      'Your shared ride status is now ' || next_status || '.',
      jsonb_build_object('poolId', p.id, 'status', next_status)
    from public.ride_pool_members m where m.pool_id = p.id;

  return jsonb_build_object('poolId', p.id, 'status', next_status, 'action', p_action, 'memberCount', member_count);
end;
$$;

-- Expired pool offers are released and re-queued as one unit, never one rider at a time.
create or replace function public.reassign_pool(p_pool_id uuid, p_reason text default 'captain_offer_timeout')
returns jsonb
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  p public.ride_pools;
  old_captain uuid;
  next_attempt integer;
  member_count integer;
begin
  if coalesce(auth.role(), '') <> 'service_role' and not exists(
    select 1 from public.profiles where id = auth.uid() and role = 'admin' and not is_suspended
  ) then raise exception 'Trusted dispatch worker or active administrator required'; end if;
  select * into p from public.ride_pools where id = p_pool_id for update;
  if not found then raise exception 'Pool not found'; end if;
  if p.status <> 'locked' or p.captain_id is null then
    return jsonb_build_object('poolId', p.id, 'status', p.status, 'message', 'Pool has no pending captain offer');
  end if;
  if exists (select 1 from public.ride_pool_members m join public.rides r on r.id = m.ride_id
      where m.pool_id = p.id and r.status <> 'searching') then
    return jsonb_build_object('poolId', p.id, 'status', 'active', 'message', 'Captain already accepted or started this pool');
  end if;
  old_captain := p.captain_id;
  select count(*)::integer into member_count from public.ride_pool_members where pool_id = p.id and status = 'active';
  select coalesce(max(a.attempt_number), 0) + 1 into next_attempt
    from public.reassignment_attempts a
    join public.ride_pool_members m on m.ride_id = a.ride_id
    where m.pool_id = p.id;

  update public.captain_profiles set is_available = true, updated_at = now()
    where profile_id = old_captain and is_online;
  update public.captain_allocation_history set outcome = 'timed_out'
    where captain_id = old_captain and outcome = 'offered'
      and ride_id in (select ride_id from public.ride_pool_members where pool_id = p.id);

  if next_attempt > 3 then
    update public.ride_pools set captain_id = null, status = 'cancelled', updated_at = now() where id = p.id;
    update public.rides set captain_id = null, status = 'no_captain_available', updated_at = now()
      where id in (select ride_id from public.ride_pool_members where pool_id = p.id);
    insert into public.reassignment_attempts(ride_id, previous_captain_id, attempt_number, trigger, result)
      select m.ride_id, old_captain, next_attempt, left(p_reason, 80), 'max_attempts_reached'
      from public.ride_pool_members m where m.pool_id = p.id
      on conflict (ride_id, attempt_number) do nothing;
    insert into public.notifications(user_id, type, title, body, payload)
      select m.rider_id, 'ride_failed', 'No captain available',
        'We could not find a captain for the shared ride. Please request another ride.',
        jsonb_build_object('poolId', p.id)
      from public.ride_pool_members m where m.pool_id = p.id;
    return jsonb_build_object('poolId', p.id, 'status', 'no_captain_available', 'attempt', next_attempt);
  end if;

  update public.ride_pools set captain_id = null, status = 'open', updated_at = now() where id = p.id;
  update public.rides set captain_id = null, status = 'searching', updated_at = now()
    where id in (select ride_id from public.ride_pool_members where pool_id = p.id);
  insert into public.reassignment_attempts(ride_id, previous_captain_id, attempt_number, trigger, result)
    select m.ride_id, old_captain, next_attempt, left(p_reason, 80), 'queued'
    from public.ride_pool_members m where m.pool_id = p.id
    on conflict (ride_id, attempt_number) do nothing;
  insert into public.ride_events(ride_id, actor_id, event_type, description, metadata)
    select m.ride_id, null, 'pool_reassignment_requested', left(p_reason, 120), jsonb_build_object('poolId', p.id)
    from public.ride_pool_members m where m.pool_id = p.id;
  insert into public.notifications(user_id, type, title, body, payload)
    select m.rider_id, 'ride_reassignment', 'Finding another captain',
      'Your shared-ride captain did not respond. MySawari is finding another captain.',
      jsonb_build_object('poolId', p.id, 'attempt', next_attempt)
    from public.ride_pool_members m where m.pool_id = p.id;
  return jsonb_build_object('poolId', p.id, 'status', 'open', 'previousCaptainId', old_captain,
    'attempt', next_attempt, 'memberCount', member_count);
end;
$$;

-- A pool containing only its creator gets a short pooling window, then falls back to a solo ride.
create or replace function public.close_singleton_pool(p_pool_id uuid, p_wait_seconds integer default 60)
returns jsonb
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  p public.ride_pools;
  member_count integer;
  solo_ride_id uuid;
begin
  if coalesce(auth.role(), '') <> 'service_role' then raise exception 'Trusted dispatch worker required'; end if;
  select * into p from public.ride_pools where id = p_pool_id for update;
  if not found or p.status <> 'open' then return jsonb_build_object('closed', false); end if;
  if p.created_at > now() - make_interval(secs => least(greatest(p_wait_seconds, 15), 300)) then
    return jsonb_build_object('closed', false, 'reason', 'pooling_window_active');
  end if;
  select count(*)::integer, (array_agg(ride_id))[1] into member_count, solo_ride_id
    from public.ride_pool_members where pool_id = p.id and status = 'active';
  if member_count = 1 then
    update public.ride_pools set status = 'cancelled', updated_at = now() where id = p.id;
    return jsonb_build_object('closed', true, 'rideId', solo_ride_id, 'reason', 'singleton_pool_fallback');
  elsif member_count = 0 then
    update public.ride_pools set status = 'cancelled', updated_at = now() where id = p.id;
    return jsonb_build_object('closed', true, 'rideId', null, 'reason', 'empty_pool');
  end if;
  return jsonb_build_object('closed', false, 'reason', 'pool_has_multiple_members');
end;
$$;

-- Rider cancellation of one pooled booking releases the shared captain and re-queues
-- remaining passengers so the route and captain assignment can be recomputed safely.
create or replace function public.cancel_ride_request(p_ride_id uuid, p_reason text default 'rider_cancelled')
returns jsonb
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  v public.rides;
  old_captain uuid;
  pool_id_value uuid;
  pool_captain uuid;
  passenger_count_value integer;
  remaining_count integer;
begin
  select * into v from public.rides where id = p_ride_id and rider_id = auth.uid()
    and status in ('requested', 'searching', 'accepted') for update;
  if not found then raise exception 'Ride cannot be cancelled or is not yours'; end if;
  old_captain := v.captain_id;

  select m.pool_id into pool_id_value from public.ride_pool_members m where m.ride_id = v.id;
  if pool_id_value is not null then
    select captain_id into pool_captain from public.ride_pools where id = pool_id_value for update;
    if pool_captain is not null then
      update public.captain_profiles set is_available = true, updated_at = now()
        where profile_id = pool_captain and is_online;
      update public.rides r set captain_id = null, status = 'searching', updated_at = now()
        where r.id in (select ride_id from public.ride_pool_members where pool_id = pool_id_value)
          and r.id <> v.id and r.status in ('searching', 'accepted', 'captain_arrived');
      update public.captain_allocation_history set outcome = 'cancelled'
        where captain_id = pool_captain and outcome in ('offered', 'accepted')
          and ride_id in (select ride_id from public.ride_pool_members where pool_id = pool_id_value);
      update public.ride_pools set captain_id = null, status = 'open', updated_at = now()
        where id = pool_id_value;
      insert into public.notifications(user_id, type, title, body, payload)
        select m.rider_id, 'ride_reassignment', 'Shared ride updated',
          'A passenger cancelled. MySawari is recalculating the shared ride and captain assignment.',
          jsonb_build_object('poolId', pool_id_value)
        from public.ride_pool_members m where m.pool_id = pool_id_value and m.ride_id <> v.id;
    end if;
    delete from public.ride_pool_members where pool_id = pool_id_value and ride_id = v.id;
    select count(*)::integer into remaining_count from public.ride_pool_members where pool_id = pool_id_value;
    select coalesce(sum(passenger_count), 0)::integer into passenger_count_value
      from public.ride_pool_members where pool_id = pool_id_value;
    update public.ride_pools set seats_reserved = least(capacity, passenger_count_value),
      status = case when remaining_count = 0 then 'cancelled' else 'open' end,
      updated_at = now() where id = pool_id_value;
  end if;

  update public.rides set status = 'cancelled', cancelled_at = now(),
    cancel_reason = left(coalesce(p_reason, 'rider_cancelled'), 120), updated_at = now()
    where id = v.id returning * into v;
  if old_captain is not null and pool_id_value is null then
    update public.captain_profiles set is_available = true, updated_at = now()
      where profile_id = old_captain and is_online;
    update public.captain_allocation_history set outcome = 'cancelled'
      where ride_id = v.id and captain_id = old_captain and outcome in ('offered', 'accepted');
    insert into public.notifications(user_id, type, title, body, payload)
      values(old_captain, 'ride_cancelled', 'Ride cancelled',
        'The passenger cancelled this ride.', jsonb_build_object('rideId', v.id));
  end if;
  insert into public.ride_events(ride_id, actor_id, event_type, description)
    values(v.id, auth.uid(), 'ride_cancelled', left(coalesce(p_reason, 'rider_cancelled'), 120));
  return to_jsonb(v);
end;
$$;

revoke all on function public.allocate_pool(uuid) from public, anon, authenticated;
revoke all on function public.pool_ride_action(uuid, text, text) from public, anon;
revoke all on function public.reassign_pool(uuid, text) from public, anon, authenticated;
revoke all on function public.close_singleton_pool(uuid, integer) from public, anon, authenticated;
revoke all on function public.set_captain_verification(uuid, boolean) from public, anon;
revoke all on function public.cancel_ride_request(uuid, text) from public, anon;
grant execute on function public.allocate_pool(uuid) to service_role;
grant execute on function public.pool_ride_action(uuid, text, text) to authenticated;
grant execute on function public.reassign_pool(uuid, text) to service_role;
grant execute on function public.close_singleton_pool(uuid, integer) to service_role;
grant execute on function public.set_captain_verification(uuid, boolean) to authenticated;
grant execute on function public.cancel_ride_request(uuid, text) to authenticated;

comment on function public.allocate_pool(uuid) is 'Atomically offers one shared pool to one captain; all member rides share the same captain and lifecycle.';
comment on function public.pool_ride_action(uuid, text, text) is 'Captain lifecycle transition for all rides in a shared pool.';
comment on column public.demand_forecasts.model_metrics is 'Evaluation and model metadata; simulated training history must remain explicitly labelled.';

-- Pool membership is editable only while the pool is open. Once a captain has
-- received an offer, riders must use ride cancellation so the pool can be requeued atomically.
create or replace function public.leave_ride_pool(p_pool_id uuid, p_reason text default 'member_left')
returns jsonb
language plpgsql security definer
set search_path = public, extensions
as $$
declare
  p public.ride_pools;
  m public.ride_pool_members;
  remaining_count integer;
  seats integer;
begin
  select * into p from public.ride_pools where id = p_pool_id for update;
  if not found or p.status <> 'open' then raise exception 'Pool membership is locked; cancel the ride request to leave safely'; end if;
  delete from public.ride_pool_members
    where pool_id = p_pool_id and rider_id = auth.uid()
    returning * into m;
  if not found then raise exception 'Pool membership not found'; end if;
  select count(*)::integer, coalesce(sum(passenger_count), 0)::integer
    into remaining_count, seats from public.ride_pool_members where pool_id = p_pool_id;
  update public.ride_pools set seats_reserved = least(capacity, seats),
    status = case when remaining_count = 0 then 'cancelled' else 'open' end,
    updated_at = now() where id = p_pool_id;
  return jsonb_build_object('poolId', p_pool_id, 'rideId', m.ride_id, 'left', true,
    'remainingMembers', remaining_count, 'reason', left(coalesce(p_reason, 'member_left'), 80));
end;
$$;

revoke all on function public.leave_ride_pool(uuid, text) from public, anon;
grant execute on function public.leave_ride_pool(uuid, text) to authenticated;
