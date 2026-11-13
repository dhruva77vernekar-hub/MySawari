import test from 'node:test'; import assert from 'node:assert/strict'; import {haversineMeters,pointInPolygon} from '../src/utils/geo.js';
test('haversine distance is zero for identical points',()=>assert.equal(haversineMeters({latitude:15,longitude:74},{latitude:15,longitude:74}),0));
test('haversine distance is positive for distinct points',()=>assert.ok(haversineMeters({latitude:15,longitude:74},{latitude:15.01,longitude:74.01})>1000));
test('point in polygon identifies Belagavi-like point inside square',()=>assert.equal(pointInPolygon({latitude:15,longitude:74},[[73.9,14.9],[74.1,14.9],[74.1,15.1],[73.9,15.1]]),true));
