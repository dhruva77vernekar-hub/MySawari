import test from 'node:test';
import assert from 'node:assert/strict';
import { trainZoneDemandForecast } from '../src/services/forecasting.service.js';

function hourlyHistory(days = 21) {
  const rows = [];
  const start = Date.UTC(2026, 9, 1, 0, 0, 0);
  for (let index = 0; index < days * 24; index += 1) {
    const date = new Date(start + index * 60 * 60 * 1000);
    const hour = date.getUTCHours();
    const weekday = date.getUTCDay();
    const peak = hour >= 8 && hour <= 10 ? 18 : hour >= 17 && hour <= 20 ? 22 : 4;
    rows.push({ bucket_start: date.toISOString(), request_count: peak + (weekday === 0 ? -2 : 3), source: 'simulated' });
  }
  return rows;
}

test('forecast model trains on sufficient hourly history and reports holdout MAE', () => {
  const result = trainZoneDemandForecast(hourlyHistory(), { forecastFor: new Date('2026-11-13T18:30:00Z') });
  assert.ok(result.predictedRequests > 0);
  assert.equal(result.algorithmVersion, 'gb-stumps-hour-zone-v1');
  assert.ok(result.evaluation.samples > 100);
  assert.ok(result.evaluation.mae >= 0);
  assert.equal(result.source, 'trained-with-simulated-history');
});

test('forecast fallback is explicit when history is insufficient', () => {
  const result = trainZoneDemandForecast([
    { bucket_start: '2026-11-13T12:00:00Z', request_count: 4, source: 'simulated' },
    { bucket_start: '2026-11-13T13:00:00Z', request_count: 8, source: 'simulated' }
  ], { forecastFor: new Date('2026-11-13T14:00:00Z') });
  assert.equal(result.source, 'simulated-low-data-fallback');
  assert.equal(result.confidence, 0.2);
  assert.equal(result.predictedRequests, 6);
});

test('forecast clamps negative model predictions to zero', () => {
  const result = trainZoneDemandForecast(hourlyHistory(5));
  assert.ok(result.predictedRequests >= 0);
});
