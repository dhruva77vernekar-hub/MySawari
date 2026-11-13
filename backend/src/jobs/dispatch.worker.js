import { supabaseAdmin } from '../config/supabase.js';
import { env } from '../config/env.js';

let timer;
let running = false;

async function isPoolMember(rideId) {
  const { data, error } = await supabaseAdmin.from('ride_pool_members')
    .select('pool_id').eq('ride_id', rideId).maybeSingle();
  if (error) throw error;
  return Boolean(data?.pool_id);
}

async function dispatchPools() {
  const { data: expiredPools, error: expiredError } = await supabaseAdmin
    .from('ride_pools').select('id').eq('status', 'locked')
    .lt('updated_at', new Date(Date.now() - env.CAPTAIN_OFFER_TIMEOUT_SECONDS * 1000).toISOString())
    .limit(20);
  if (expiredError) throw expiredError;

  for (const pool of expiredPools ?? []) {
    const { data: result, error } = await supabaseAdmin.rpc('reassign_pool', {
      p_pool_id: pool.id,
      p_reason: 'captain_offer_timeout'
    });
    if (error) {
      console.error('[dispatch] pool reassignment failed', pool.id, error.message);
      continue;
    }
    if (result?.status === 'open') {
      const { error: allocationError } = await supabaseAdmin.rpc('allocate_pool', { p_pool_id: pool.id });
      if (allocationError) console.error('[dispatch] pool re-allocation failed', pool.id, allocationError.message);
    }
  }

  const { data: openPools, error: openError } = await supabaseAdmin
    .from('ride_pools').select('id').eq('status', 'open')
    .order('created_at', { ascending: true }).limit(30);
  if (openError) throw openError;

  for (const pool of openPools ?? []) {
    const { data: members, error: membersError } = await supabaseAdmin
      .from('ride_pool_members').select('ride_id').eq('pool_id', pool.id).eq('status', 'active');
    if (membersError) throw membersError;
    if ((members ?? []).length >= 2) {
      const { error } = await supabaseAdmin.rpc('allocate_pool', { p_pool_id: pool.id });
      if (error) console.error('[dispatch] pool allocation failed', pool.id, error.message);
      continue;
    }
    if ((members ?? []).length === 1) {
      const { data: closed, error } = await supabaseAdmin.rpc('close_singleton_pool', {
        p_pool_id: pool.id,
        p_wait_seconds: env.POOL_WAIT_SECONDS
      });
      if (error) {
        console.error('[dispatch] singleton pool close failed', pool.id, error.message);
      } else if (closed?.closed && closed.rideId) {
        const { error: allocationError } = await supabaseAdmin.rpc('allocate_ride', { p_ride_id: closed.rideId });
        if (allocationError) console.error('[dispatch] solo fallback allocation failed', closed.rideId, allocationError.message);
      }
    } else {
      await supabaseAdmin.from('ride_pools').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', pool.id);
    }
  }
}

async function dispatchIndividualRides() {
  const cutoff = new Date(Date.now() - env.CAPTAIN_OFFER_TIMEOUT_SECONDS * 1000).toISOString();
  const { data: expired, error: expiredError } = await supabaseAdmin
    .from('rides').select('id').eq('status', 'searching').not('captain_id', 'is', null)
    .lt('updated_at', cutoff).limit(30);
  if (expiredError) throw expiredError;

  for (const ride of expired ?? []) {
    if (await isPoolMember(ride.id)) continue;
    const { error: reassignError } = await supabaseAdmin.rpc('reassign_ride', {
      p_ride_id: ride.id,
      p_reason: 'captain_offer_timeout'
    });
    if (reassignError) {
      console.error('[dispatch] reassignment failed', ride.id, reassignError.message);
      continue;
    }
    const { error: allocationError } = await supabaseAdmin.rpc('allocate_ride', { p_ride_id: ride.id });
    if (allocationError) console.error('[dispatch] re-allocation failed', ride.id, allocationError.message);
  }

  const { data: waiting, error: waitingError } = await supabaseAdmin
    .from('rides').select('id,pooling_opt_in,created_at').in('status', ['requested', 'searching'])
    .is('captain_id', null).order('created_at', { ascending: true }).limit(30);
  if (waitingError) throw waitingError;

  for (const ride of waiting ?? []) {
    if (await isPoolMember(ride.id)) continue;
    if (ride.pooling_opt_in && Date.now() - new Date(ride.created_at).getTime() < env.POOL_WAIT_SECONDS * 1000) continue;
    const { error } = await supabaseAdmin.rpc('allocate_ride', { p_ride_id: ride.id });
    if (error) console.error('[dispatch] allocation failed', ride.id, error.message);
  }
}

async function dispatchTick() {
  if (!supabaseAdmin || running) return;
  running = true;
  try {
    await dispatchPools();
    await dispatchIndividualRides();
  } catch (error) {
    console.error('[dispatch] worker tick failed:', error.message);
  } finally {
    running = false;
  }
}

export function startDispatchWorker() {
  if (!supabaseAdmin || !env.dispatchEnabled || timer) return;
  console.log(`[dispatch] worker enabled; interval=${env.DISPATCH_INTERVAL_MS}ms, offerTimeout=${env.CAPTAIN_OFFER_TIMEOUT_SECONDS}s, poolWait=${env.POOL_WAIT_SECONDS}s`);
  timer = setInterval(dispatchTick, env.DISPATCH_INTERVAL_MS);
  timer.unref?.();
  void dispatchTick();
}

export function stopDispatchWorker() {
  if (timer) clearInterval(timer);
  timer = undefined;
}
