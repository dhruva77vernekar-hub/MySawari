import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRepositioningRecommendations } from '../src/services/repositioning.service.js';

const polygon = (west, south, east, north) => ({
  type: 'Polygon',
  coordinates: [[[west,south],[east,south],[east,north],[west,north],[west,south]]]
});

test('zone intelligence suggests moving surplus captains toward shortage zones', () => {
  const zones = [
    { id: 'donor', name: 'Supply Zone', polygon_geojson: polygon(74.4,15,74.5,15.1) },
    { id: 'target', name: 'Demand Zone', polygon_geojson: polygon(74.6,15,74.7,15.1) }
  ];
  const metrics = [
    { zone_id: 'donor', demand_count: 1, supply_count: 5, demand_supply_ratio: 0.2, created_at: '2026-11-13T10:00:00Z' },
    { zone_id: 'target', demand_count: 8, supply_count: 2, demand_supply_ratio: 4, created_at: '2026-11-13T10:00:00Z' }
  ];
  const recommendations = buildRepositioningRecommendations(zones, metrics);
  assert.equal(recommendations.length, 1);
  assert.equal(recommendations[0].fromZone.id, 'donor');
  assert.equal(recommendations[0].toZone.id, 'target');
  assert.ok(recommendations[0].suggestedCaptains > 0);
});
