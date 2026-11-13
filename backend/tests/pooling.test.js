import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePoolStopSequence } from '../src/services/pooling-algorithm.js';

const ride = (id, pickupLongitude, dropLongitude, pickupLatitude = 15, dropLatitude = 15) => ({
  id,
  pickup_latitude: pickupLatitude,
  pickup_longitude: pickupLongitude,
  drop_latitude: dropLatitude,
  drop_longitude: dropLongitude
});

test('pool optimizer keeps every pickup before its own drop', () => {
  const result = calculatePoolStopSequence([ride('a', 74.5, 74.6), ride('b', 74.501, 74.601)], { maxDetourPercent: 25 });
  const index = (id, type) => result.sequence.findIndex((stop) => stop.rideId === id && stop.kind === type);
  assert.ok(index('a', 'pickup') < index('a', 'drop'));
  assert.ok(index('b', 'pickup') < index('b', 'drop'));
});

test('pool optimizer rejects crossing routes over a strict detour limit', () => {
  assert.throws(() => calculatePoolStopSequence([
    ride('a', 74.4, 74.6, 15, 15),
    ride('b', 74.5, 74.5, 14.9, 15.1)
  ], { maxDetourPercent: 1 }), /No pickup\/drop sequence/);
});

test('pool optimizer rejects more than four rides', () => {
  assert.throws(() => calculatePoolStopSequence([1,2,3,4,5].map((n) => ride(String(n), 74.5, 74.6))), /one to four rides/);
});
