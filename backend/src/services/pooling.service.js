import { routeThrough } from './routing.service.js';
import { calculatePoolStopSequence } from './pooling-algorithm.js';

export { calculatePoolStopSequence };

export async function optimizePoolRoute(rides, { maxDetourPercent = 20 } = {}) {
  const best = calculatePoolStopSequence(rides, { maxDetourPercent });
  const routePoints = best.sequence.map(({ latitude, longitude }) => ({ latitude, longitude }));
  const route = await routeThrough(routePoints);
  return {
    routeOrder: best.sequence.map(({ rideId, kind, latitude, longitude }, index) => ({
      sequence: index + 1, rideId, stopType: kind, latitude, longitude
    })),
    distanceMeters: route.distanceMeters,
    durationSeconds: route.durationSeconds,
    source: route.source,
    approximate: route.approximate,
    algorithm: 'pickup-before-drop-topological-permutation-v1',
    maxDetourPercent
  };
}
