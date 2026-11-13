import { haversineMeters } from '../utils/geo.js';
import { AppError } from '../utils/app-error.js';

function permutationsWithPrecedence(items, pickupToDrop) {
  const output = [];
  const used = new Set();
  const path = [];
  function visit() {
    if (path.length === items.length) { output.push([...path]); return; }
    for (const item of items) {
      if (used.has(item.key)) continue;
      if (item.kind === 'drop' && !used.has(pickupToDrop.get(item.rideId))) continue;
      used.add(item.key); path.push(item); visit(); path.pop(); used.delete(item.key);
    }
  }
  visit();
  return output;
}

export function calculatePoolStopSequence(rides, { maxDetourPercent = 20 } = {}) {
  if (!Array.isArray(rides) || rides.length < 1 || rides.length > 4) {
    throw new AppError(422, 'POOL_SIZE_UNSUPPORTED', 'Route optimization supports pools containing one to four rides.');
  }
  const stops = [];
  const pickupToDrop = new Map();
  for (const ride of rides) {
    const pickup = { key: `${ride.id}:pickup`, rideId: ride.id, kind: 'pickup', latitude: Number(ride.pickup_latitude), longitude: Number(ride.pickup_longitude) };
    const drop = { key: `${ride.id}:drop`, rideId: ride.id, kind: 'drop', latitude: Number(ride.drop_latitude), longitude: Number(ride.drop_longitude) };
    if (![pickup.latitude, pickup.longitude, drop.latitude, drop.longitude].every(Number.isFinite)) {
      throw new AppError(422, 'POOL_COORDINATES_INVALID', 'A pool member has invalid route coordinates.');
    }
    stops.push(pickup, drop); pickupToDrop.set(ride.id, pickup.key);
  }
  const candidates = permutationsWithPrecedence(stops, pickupToDrop);
  let best = null;
  for (const candidate of candidates) {
    // A pooled ride must contain overlapping passenger legs; sequentially
    // serving unrelated rides is dispatch batching, not passenger pooling.
    let hasSharedSegment = false;
    for (let a = 0; a < rides.length; a += 1) {
      const aPickup = candidate.findIndex((stop) => stop.rideId === rides[a].id && stop.kind === 'pickup');
      const aDrop = candidate.findIndex((stop) => stop.rideId === rides[a].id && stop.kind === 'drop');
      for (let b = a + 1; b < rides.length; b += 1) {
        const bPickup = candidate.findIndex((stop) => stop.rideId === rides[b].id && stop.kind === 'pickup');
        const bDrop = candidate.findIndex((stop) => stop.rideId === rides[b].id && stop.kind === 'drop');
        if (Math.max(aPickup, bPickup) < Math.min(aDrop, bDrop)) hasSharedSegment = true;
      }
    }
    if (rides.length > 1 && !hasSharedSegment) continue;
    let distance = 0;
    for (let i = 1; i < candidate.length; i += 1) distance += haversineMeters(candidate[i - 1], candidate[i]);
    let withinDetour = true;
    for (const ride of rides) {
      const pickupIndex = candidate.findIndex((stop) => stop.rideId === ride.id && stop.kind === 'pickup');
      const dropIndex = candidate.findIndex((stop) => stop.rideId === ride.id && stop.kind === 'drop');
      let memberDistance = 0;
      for (let i = pickupIndex + 1; i <= dropIndex; i += 1) memberDistance += haversineMeters(candidate[i - 1], candidate[i]);
      const directDistance = haversineMeters(
        { latitude: Number(ride.pickup_latitude), longitude: Number(ride.pickup_longitude) },
        { latitude: Number(ride.drop_latitude), longitude: Number(ride.drop_longitude) }
      );
      const detour = directDistance > 0 ? ((memberDistance - directDistance) / directDistance) * 100 : 0;
      if (detour > maxDetourPercent) { withinDetour = false; break; }
    }
    if (withinDetour && (!best || distance < best.distance)) best = { sequence: candidate, distance };
  }
  if (!best) throw new AppError(422, 'POOL_ROUTE_INCOMPATIBLE', 'No pickup/drop sequence satisfies the configured detour limit.');
  return best;
}
