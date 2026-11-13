const MODEL_VERSION = 'gb-stumps-hour-zone-v1';
const FEATURE_NAMES = ['hourSin', 'hourCos', 'weekdaySin', 'weekdayCos', 'lag1', 'lag24', 'lag168', 'mean3', 'mean6'];

function finite(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function toFeatureVector(date, history) {
  const hour = date.getUTCHours();
  const weekday = date.getUTCDay();
  const values = history.map((row) => Math.max(0, finite(row.request_count)));
  const tail = (n) => values.slice(Math.max(0, values.length - n));
  const average = (items) => items.length ? items.reduce((a, b) => a + b, 0) / items.length : 0;
  return [
    Math.sin((2 * Math.PI * hour) / 24),
    Math.cos((2 * Math.PI * hour) / 24),
    Math.sin((2 * Math.PI * weekday) / 7),
    Math.cos((2 * Math.PI * weekday) / 7),
    values.at(-1) ?? 0,
    values.at(-24) ?? average(tail(24)),
    values.at(-168) ?? average(tail(168)),
    average(tail(3)),
    average(tail(6))
  ];
}

function buildExamples(rows) {
  const sorted = [...rows].sort((a, b) => new Date(a.bucket_start) - new Date(b.bucket_start));
  const examples = [];
  for (let index = 6; index < sorted.length; index += 1) {
    const history = sorted.slice(0, index);
    examples.push({
      x: toFeatureVector(new Date(sorted[index].bucket_start), history),
      y: Math.max(0, finite(sorted[index].request_count))
    });
  }
  return examples;
}

function mean(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function fitStumps(examples, rounds = 24, learningRate = 0.12) {
  const base = mean(examples.map((item) => item.y));
  const predictions = examples.map(() => base);
  const stumps = [];

  for (let round = 0; round < rounds; round += 1) {
    const residuals = examples.map((item, index) => item.y - predictions[index]);
    let best = null;
    let bestLoss = Infinity;

    for (let feature = 0; feature < FEATURE_NAMES.length; feature += 1) {
      const sorted = [...new Set(examples.map((item) => item.x[feature]))].sort((a, b) => a - b);
      if (sorted.length < 2) continue;
      const step = Math.max(1, Math.floor(sorted.length / 24));
      const thresholds = [];
      for (let i = 0; i < sorted.length - 1; i += step) thresholds.push((sorted[i] + sorted[Math.min(i + step, sorted.length - 1)]) / 2);
      for (const threshold of thresholds) {
        const left = [], right = [];
        examples.forEach((item, index) => (item.x[feature] <= threshold ? left : right).push(residuals[index]));
        if (left.length < 3 || right.length < 3) continue;
        const leftValue = mean(left), rightValue = mean(right);
        const loss = left.reduce((sum, value) => sum + (value - leftValue) ** 2, 0)
          + right.reduce((sum, value) => sum + (value - rightValue) ** 2, 0);
        if (loss < bestLoss) {
          bestLoss = loss;
          best = { feature, threshold, leftValue, rightValue };
        }
      }
    }
    if (!best) break;
    stumps.push(best);
    examples.forEach((item, index) => {
      predictions[index] += learningRate * (item.x[best.feature] <= best.threshold ? best.leftValue : best.rightValue);
    });
  }
  return { base, stumps, learningRate };
}

function predict(model, features) {
  let result = model.base;
  for (const stump of model.stumps) {
    result += model.learningRate * (features[stump.feature] <= stump.threshold ? stump.leftValue : stump.rightValue);
  }
  return Math.max(0, result);
}

function sameHourWeekdayAverage(rows, targetDate) {
  const matching = rows.filter((row) => {
    const date = new Date(row.bucket_start);
    return date.getUTCHours() === targetDate.getUTCHours() && date.getUTCDay() === targetDate.getUTCDay();
  }).map((row) => Math.max(0, finite(row.request_count)));
  if (matching.length) return mean(matching);
  return mean(rows.slice(-6).map((row) => Math.max(0, finite(row.request_count))));
}

export function trainZoneDemandForecast(rows, { forecastFor = new Date(Date.now() + 30 * 60_000) } = {}) {
  const usable = [...(rows ?? [])]
    .filter((row) => row?.bucket_start && Number.isFinite(Number(row.request_count)))
    .sort((a, b) => new Date(a.bucket_start) - new Date(b.bucket_start));
  const examples = buildExamples(usable);
  const targetDate = new Date(forecastFor);

  if (examples.length < 24) {
    const prediction = sameHourWeekdayAverage(usable, targetDate);
    return {
      predictedRequests: Number(prediction.toFixed(2)),
      confidence: usable.length >= 12 ? 0.35 : 0.2,
      algorithmVersion: `${MODEL_VERSION}-fallback`,
      source: usable.some((row) => row.source === 'simulated') ? 'simulated-low-data-fallback' : 'low-data-fallback',
      evaluation: { samples: examples.length, mae: null },
      features: FEATURE_NAMES
    };
  }

  const split = Math.max(12, Math.floor(examples.length * 0.8));
  const train = examples.slice(0, split);
  const holdout = examples.slice(split);
  const evaluationModel = fitStumps(train);
  const mae = holdout.length
    ? mean(holdout.map((item) => Math.abs(item.y - predict(evaluationModel, item.x))))
    : null;
  const finalModel = fitStumps(examples);
  const prediction = predict(finalModel, toFeatureVector(targetDate, usable));
  const confidence = usable.length >= 500 ? 0.78 : usable.length >= 168 ? 0.68 : 0.52;

  return {
    predictedRequests: Number(prediction.toFixed(2)),
    confidence,
    algorithmVersion: MODEL_VERSION,
    source: usable.some((row) => row.source === 'simulated') ? 'trained-with-simulated-history' : 'trained-with-history',
    evaluation: { samples: examples.length, holdoutSamples: holdout.length, mae: mae === null ? null : Number(mae.toFixed(3)) },
    features: FEATURE_NAMES,
    model: { base: Number(finalModel.base.toFixed(4)), estimators: finalModel.stumps.length, learningRate: finalModel.learningRate }
  };
}

export async function generateZoneForecasts(adminClient, { horizonMinutes = 30 } = {}) {
  const { data: zones, error: zonesError } = await adminClient.from('service_zones')
    .select('id,name').eq('is_active', true);
  if (zonesError) throw new Error(`Unable to load service zones: ${zonesError.message}`);
  const output = [];
  const forecastFor = new Date(Date.now() + horizonMinutes * 60_000);

  for (const zone of zones ?? []) {
    const since = new Date(Date.now() - 28 * 24 * 60 * 60_000).toISOString();
    const { data: history, error: historyError } = await adminClient.from('demand_history')
      .select('bucket_start,request_count,source').eq('zone_id', zone.id)
      .gte('bucket_start', since).order('bucket_start', { ascending: true }).limit(1000);
    if (historyError) throw new Error(`Unable to load demand history for ${zone.name}: ${historyError.message}`);
    const forecast = trainZoneDemandForecast(history ?? [], { forecastFor });
    const { data: metric, error: metricError } = await adminClient.from('zone_metrics')
      .select('supply_count,shortage_level').eq('zone_id', zone.id)
      .order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (metricError) throw new Error(`Unable to load zone metrics for ${zone.name}: ${metricError.message}`);
    const row = {
      zone_id: zone.id,
      forecast_for: forecastFor.toISOString(),
      predicted_requests: forecast.predictedRequests,
      online_captains: metric?.supply_count ?? 0,
      shortage_level: metric?.shortage_level ?? 'unknown',
      confidence: forecast.confidence,
      algorithm_version: forecast.algorithmVersion,
      source: forecast.source,
      model_metrics: { evaluation: forecast.evaluation, features: forecast.features, model: forecast.model ?? null }
    };
    const { error: insertError } = await adminClient.from('demand_forecasts').insert(row);
    if (insertError) throw new Error(`Unable to save forecast for ${zone.name}: ${insertError.message}`);
    output.push({ zoneId: zone.id, zoneName: zone.name, ...row });
  }
  return { forecasts: output, forecastFor: forecastFor.toISOString(), horizonMinutes, algorithm: MODEL_VERSION };
}
