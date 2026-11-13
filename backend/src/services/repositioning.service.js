import { haversineMeters } from '../utils/geo.js';

function polygonCentroid(geojson) {
  const geometry = geojson?.type === 'Feature' ? geojson.geometry : geojson;
  if (geometry?.type !== 'Polygon' || !Array.isArray(geometry.coordinates?.[0])) return null;
  const ring = geometry.coordinates[0].slice(0, -1);
  if (ring.length < 3) return null;
  const longitude = ring.reduce((sum, point) => sum + Number(point[0]), 0) / ring.length;
  const latitude = ring.reduce((sum, point) => sum + Number(point[1]), 0) / ring.length;
  return Number.isFinite(latitude) && Number.isFinite(longitude) ? { latitude, longitude } : null;
}

export function buildRepositioningRecommendations(zones, latestMetrics) {
  const metricsByZone = new Map();
  for (const metric of latestMetrics) {
    if (!metricsByZone.has(metric.zone_id)) metricsByZone.set(metric.zone_id, metric);
  }
  const enriched = zones.map((zone) => ({
    ...zone,
    center: polygonCentroid(zone.polygon_geojson),
    metric: metricsByZone.get(zone.id)
  })).filter((zone) => zone.center && zone.metric);

  const targets = enriched.filter((zone) => Number(zone.metric.demand_supply_ratio) >= 1.5)
    .sort((a, b) => Number(b.metric.demand_supply_ratio) - Number(a.metric.demand_supply_ratio));
  const donors = enriched.filter((zone) => Number(zone.metric.supply_count) - Number(zone.metric.demand_count) >= 2);
  const recommendations = [];

  for (const target of targets) {
    for (const donor of donors) {
      if (donor.id === target.id) continue;
      const surplus = Math.max(0, Number(donor.metric.supply_count) - Number(donor.metric.demand_count) - 1);
      const deficit = Math.max(0, Number(target.metric.demand_count) - Number(target.metric.supply_count));
      const suggestedCaptains = Math.min(surplus, Math.max(1, deficit));
      if (suggestedCaptains < 1) continue;
      recommendations.push({
        fromZone: { id: donor.id, name: donor.name, center: donor.center },
        toZone: { id: target.id, name: target.name, center: target.center },
        suggestedCaptains,
        distanceMeters: Math.round(haversineMeters(donor.center, target.center)),
        reason: `${target.name} has demand/supply ratio ${Number(target.metric.demand_supply_ratio).toFixed(2)} while ${donor.name} has ${surplus} estimated surplus captains.`,
        action: 'suggestion_only'
      });
    }
  }
  return recommendations.sort((a, b) => b.suggestedCaptains - a.suggestedCaptains || a.distanceMeters - b.distanceMeters).slice(0, 20);
}
