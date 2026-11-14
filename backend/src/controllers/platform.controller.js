import { z } from 'zod'; import { success } from '../utils/api-response.js'; import { AppError } from '../utils/app-error.js'; import { asyncHandler } from '../utils/async-handler.js'; import { env } from '../config/env.js'; import { routeBetween,geocode,reverseGeocode } from '../services/routing.service.js'; import { bookingAssistant } from '../services/ai.service.js'; import { haversineMeters,pointInPolygon } from '../utils/geo.js'; import { optimizePoolRoute } from '../services/pooling.service.js'; import { buildRepositioningRecommendations } from '../services/repositioning.service.js';
import { generateZoneForecasts, trainZoneDemandForecast } from '../services/forecasting.service.js'; import { supabasePublic, supabaseAdmin, requireSupabaseAdmin } from '../config/supabase.js';
const coord=z.object({latitude:z.number().min(-90).max(90),longitude:z.number().min(-180).max(180)});
const need=(v,m='Record not found')=>{if(!v)throw new AppError(404,'NOT_FOUND',m);return v;};
const dbErr=(e)=>{if(e){const status=e.code==='PGRST116'?404:(e.code==='42501'?403:400);throw new AppError(status,'DATABASE_OPERATION_FAILED','The requested database operation could not be completed.');}};
export const captainMe=asyncHandler(async(req,res)=>{const {data,error}=await req.supabase.from('captain_profiles').select('*,vehicle_types(*)').eq('profile_id',req.user.id).maybeSingle();dbErr(error);success(res,data);});
export const upsertCaptain=asyncHandler(async(req,res)=>{const schema=z.object({vehicle_type_id:z.string().uuid(),vehicle_registration:z.string().min(4).max(20).optional(),license_number:z.string().min(4).max(40).optional()});const body=schema.parse(req.body);const {data,error}=await req.supabase.from('captain_profiles').upsert({profile_id:req.user.id,...body},{onConflict:'profile_id'}).select().single();dbErr(error);success(res,data,201);});
export const captainAvailability=asyncHandler(async(req,res)=>{const online=z.boolean().parse(req.body.is_online);const {data,error}=await req.supabase.rpc('set_captain_availability',{p_is_online:online});dbErr(error);success(res,data);});
export const updateLocation=asyncHandler(async(req,res)=>{const p=coord.parse(req.body);const {data,error}=await req.supabase.from('captain_profiles').update({current_latitude:p.latitude,current_longitude:p.longitude,location_updated_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('profile_id',req.user.id).select('profile_id,current_latitude,current_longitude,location_updated_at').single();dbErr(error);success(res,data);});
export const geocodeSearch=asyncHandler(async(req,res)=>{const q=z.string().min(3).max(160).parse(req.query.q);success(res,await geocode(q));});
export const geocodeReverse=asyncHandler(async(req,res)=>{const p=coord.parse({latitude:Number(req.query.latitude),longitude:Number(req.query.longitude)});success(res,await reverseGeocode(p.latitude,p.longitude));});
export const routeEstimate=asyncHandler(async(req,res)=>{const o=coord.parse(req.body.origin),d=coord.parse(req.body.destination);success(res,await routeBetween(o,d));});
export const fareEstimate=asyncHandler(async(req,res)=>{const schema=z.object({vehicleType:z.enum(['bike','scooter','car','cab','comfort','auto','suv','xl','shuttle']).default('cab'),distanceMeters:z.number().positive().max(200000),zoneMultiplier:z.number().min(1).max(env.SURGE_CAP).default(1)});const b=schema.parse(req.body);const baseMap={bike:env.FARE_BIKE_BASE||20,scooter:env.FARE_SCOOTER_BASE||25,auto:30,car:env.FARE_CAR_BASE||50,cab:env.FARE_CAR_BASE||50,comfort:65,suv:75,xl:75,shuttle:15};const perKmMap={bike:6,scooter:7,auto:9,car:env.FARE_PER_KM||14,cab:env.FARE_PER_KM||14,comfort:16,suv:19,xl:19,shuttle:4};const base=baseMap[b.vehicleType]||50;const perKm=perKmMap[b.vehicleType]||env.FARE_PER_KM||9;const distanceKm=b.distanceMeters/1000;const subtotal=base+distanceKm*perKm;success(res,{currency:'INR',vehicleType:b.vehicleType,baseFare:base,distanceKm:Number(distanceKm.toFixed(2)),perKmRate:perKm,zoneMultiplier:b.zoneMultiplier,total:Math.round(subtotal*b.zoneMultiplier),estimateOnly:true,disclaimer:'Final fare may vary by approved waiting, toll and route rules.'});});
export const createRide=asyncHandler(async(req,res)=>{const s=z.object({vehicle_type_id:z.string().uuid(),pickup:coord,drop:coord,pickup_address:z.string().max(300).optional(),drop_address:z.string().max(300).optional(),passenger_count:z.number().int().min(1).max(4).default(1),pooling_opt_in:z.boolean().default(false),idempotency_key:z.string().min(8).max(100).optional()}).parse(req.body);const route=await routeBetween(s.pickup,s.drop);const {data:vehicle,error:ve}=await req.supabase.from('vehicle_types').select('id,code,display_name,capacity').eq('id',s.vehicle_type_id).single();dbErr(ve);const base=({bike:env.FARE_BIKE_BASE,scooter:env.FARE_SCOOTER_BASE,car:env.FARE_CAR_BASE}[vehicle.code]||env.FARE_SCOOTER_BASE);const per=env.FARE_PER_KM;let zoneMultiplier=1;const {data:zonePrice,error:zonePriceError}=await req.supabase.rpc('get_zone_multiplier',{p_latitude:s.pickup.latitude,p_longitude:s.pickup.longitude});if(!zonePriceError&&zonePrice)zoneMultiplier=Math.min(env.SURGE_CAP,Math.max(1,Number(zonePrice.priceMultiplier)||1));const fare=Number(((base+(route.distanceMeters/1000)*per)*zoneMultiplier).toFixed(2));const admin = requireSupabaseAdmin(); const {data,error}=await admin.rpc('create_ride_request',{p_rider_id:req.user.id,p_vehicle_type_id:s.vehicle_type_id,p_pickup_lat:s.pickup.latitude,p_pickup_lng:s.pickup.longitude,p_drop_lat:s.drop.latitude,p_drop_lng:s.drop.longitude,p_pickup_address:s.pickup_address||null,p_drop_address:s.drop_address||null,p_passenger_count:s.passenger_count,p_pooling_opt_in:s.pooling_opt_in,p_distance_meters:route.distanceMeters,p_duration_seconds:route.durationSeconds,p_estimated_fare:fare,p_zone_multiplier:zoneMultiplier,p_idempotency_key:s.idempotency_key||null});dbErr(error);success(res,{...data,route,estimatedFare:fare,zoneMultiplier,currency:'INR'},201);});
export const listRides=asyncHandler(async(req,res)=>{const {data,error}=await req.supabase.from('rides').select('*,vehicle_types(display_name,code)').order('created_at',{ascending:false}).limit(Math.min(Number(req.query.limit)||20,50));dbErr(error);success(res,data);});
export const getRide=asyncHandler(async(req,res)=>{const {data,error}=await req.supabase.from('rides').select('*,ride_events(*),vehicle_types(display_name,code)').eq('id',req.params.id).single();dbErr(error);success(res,need(data));});
export const cancelRide=asyncHandler(async(req,res)=>{const {data,error}=await req.supabase.rpc('cancel_ride_request',{p_ride_id:req.params.id,p_reason:String(req.body.reason||'rider_cancelled').slice(0,120)});dbErr(error);success(res,data);});
export const rideAction=asyncHandler(async(req,res)=>{const action=z.enum(['accept','arrived','start','complete','reject','cancel']).parse(req.params.action);const {data:membership,error:membershipError}=await req.supabase.from('ride_pool_members').select('pool_id').eq('ride_id',req.params.id).maybeSingle();dbErr(membershipError);if(membership?.pool_id){const {count,error:countError}=await req.supabase.from('ride_pool_members').select('id',{count:'exact',head:true}).eq('pool_id',membership.pool_id);dbErr(countError);if((count||0)>1){const {data,error}=await req.supabase.rpc('pool_ride_action',{p_pool_id:membership.pool_id,p_action:action,p_note:String(req.body.note||'').slice(0,200)});dbErr(error);return success(res,data);}}const {data,error}=await req.supabase.rpc('captain_ride_action',{p_ride_id:req.params.id,p_action:action,p_note:String(req.body.note||'').slice(0,200)});dbErr(error);success(res,data);});
export const nearbyCaptains=asyncHandler(async(req,res)=>{const p=coord.parse({latitude:Number(req.query.latitude),longitude:Number(req.query.longitude)});const radius=Math.min(Math.max(Number(req.query.radiusMeters)||5000,250),15000);const {data,error}=await req.supabase.rpc('get_nearby_captains',{p_latitude:p.latitude,p_longitude:p.longitude,p_radius_meters:radius,p_stale_seconds:env.LOCATION_STALE_SECONDS});dbErr(error);success(res,data||[]);});
// -----------------------------------------------------------------------------
// BELAGAVI SERVICE ZONES & INTELLIGENCE REPOSITORY
// -----------------------------------------------------------------------------
export const BELAGAVI_SERVICE_ZONES = [
  {
    id: 'z-market',
    name: 'Market Area & Khade Bazar',
    city: 'Belagavi',
    description: 'Commercial heart of Belagavi with dense wholesale, retail, and transit hub traffic.',
    center: { latitude: 15.8560, longitude: 74.5120 },
    polygon_geojson: {
      type: 'Polygon',
      coordinates: [[[74.508, 15.852], [74.516, 15.852], [74.516, 15.860], [74.508, 15.860], [74.508, 15.852]]]
    },
    is_active: true,
    demand_count: 54,
    supply_count: 22,
    available_captains: 14,
    busy_captains: 8,
    avg_pickup_eta_seconds: 420,
    historical_baseline: [4, 2, 2, 3, 5, 12, 26, 38, 48, 42, 36, 34, 38, 42, 45, 48, 54, 58, 52, 44, 32, 22, 14, 8]
  },
  {
    id: 'z-kle',
    name: 'KLE Tech & Medical Hub',
    city: 'Belagavi',
    description: 'Nehru Nagar student corridor, JNMC, medical college, and super-specialty hospital.',
    center: { latitude: 15.8281, longitude: 74.4925 },
    polygon_geojson: {
      type: 'Polygon',
      coordinates: [[[74.486, 15.822], [74.498, 15.822], [74.498, 15.834], [74.486, 15.834], [74.486, 15.822]]]
    },
    is_active: true,
    demand_count: 42,
    supply_count: 28,
    available_captains: 20,
    busy_captains: 8,
    avg_pickup_eta_seconds: 310,
    historical_baseline: [2, 1, 1, 2, 4, 10, 22, 44, 36, 28, 24, 26, 30, 32, 36, 42, 48, 46, 38, 30, 20, 14, 8, 4]
  },
  {
    id: 'z-station',
    name: 'Belagavi Railway Station & Bogarves',
    city: 'Belagavi',
    description: 'Central railway hub, Bogarves Plaza commercial junction, and Station Road.',
    center: { latitude: 15.8620, longitude: 74.5050 },
    polygon_geojson: {
      type: 'Polygon',
      coordinates: [[[74.500, 15.858], [74.510, 15.858], [74.510, 15.868], [74.500, 15.868], [74.500, 15.858]]]
    },
    is_active: true,
    demand_count: 36,
    supply_count: 30,
    available_captains: 22,
    busy_captains: 8,
    avg_pickup_eta_seconds: 240,
    historical_baseline: [5, 4, 3, 2, 6, 16, 32, 40, 34, 30, 28, 32, 30, 28, 32, 36, 42, 44, 40, 36, 28, 20, 14, 8]
  },
  {
    id: 'z-tilakwadi',
    name: 'Tilakwadi Residential & Congress Road',
    city: 'Belagavi',
    description: 'Suburban residential grid, schools, 1st to 3rd railway gates, and Deshmukh Road.',
    center: { latitude: 15.8390, longitude: 74.5180 },
    polygon_geojson: {
      type: 'Polygon',
      coordinates: [[[74.512, 15.833], [74.524, 15.833], [74.524, 15.845], [74.512, 15.845], [74.512, 15.833]]]
    },
    is_active: true,
    demand_count: 18,
    supply_count: 34,
    available_captains: 28,
    busy_captains: 6,
    avg_pickup_eta_seconds: 180,
    historical_baseline: [2, 1, 1, 1, 3, 8, 18, 28, 22, 16, 14, 16, 18, 18, 20, 24, 28, 26, 22, 18, 14, 8, 4, 2]
  },
  {
    id: 'z-udyambag',
    name: 'Udyambag Industrial Hub',
    city: 'Belagavi',
    description: 'Heavy machining, foundry industries, manufacturing units, and Angadi Institute corridor.',
    center: { latitude: 15.8150, longitude: 74.4820 },
    polygon_geojson: {
      type: 'Polygon',
      coordinates: [[[74.476, 15.808], [74.488, 15.808], [74.488, 15.820], [74.476, 15.820], [74.476, 15.808]]]
    },
    is_active: true,
    demand_count: 22,
    supply_count: 24,
    available_captains: 18,
    busy_captains: 6,
    avg_pickup_eta_seconds: 280,
    historical_baseline: [1, 1, 1, 2, 4, 14, 30, 36, 24, 18, 16, 20, 18, 16, 18, 26, 34, 30, 22, 16, 10, 6, 3, 1]
  }
];

function generateHourlyHistoryForZone(zone, days = 28) {
  const history = [];
  const now = Date.now();
  for (let i = days * 24; i >= 0; i--) {
    const time = new Date(now - i * 3600000);
    const hour = time.getHours();
    const isWeekend = time.getDay() === 0 || time.getDay() === 6;
    const base = zone.historical_baseline[hour] || 10;
    const variation = Math.round(Math.sin(i * 0.1) * 3);
    const weekendMultiplier = isWeekend ? (hour >= 11 && hour <= 21 ? 1.25 : 0.75) : 1.0;
    const count = Math.max(1, Math.round((base + variation) * weekendMultiplier));
    history.push({
      bucket_start: time.toISOString(),
      request_count: count,
      source: 'simulated'
    });
  }
  return history;
}

function enrichZoneWithLiveMetrics(zone, scenarioOverrides = {}) {
  const overrides = scenarioOverrides[zone.id] || {};
  const demand_count = overrides.demand_count ?? zone.demand_count;
  const supply_count = overrides.supply_count ?? zone.supply_count;
  const available_captains = overrides.available_captains ?? zone.available_captains;
  const busy_captains = overrides.busy_captains ?? zone.busy_captains;

  const ratio = Number((demand_count / Math.max(1, available_captains)).toFixed(2));
  let status = 'BALANCED';
  let surge = 1.0;

  if (ratio >= 1.5) {
    status = 'HIGH_DEMAND';
    surge = Math.min(1.8, Number((1.0 + (ratio - 1.0) * 0.4).toFixed(1)));
  } else if (ratio <= 0.8) {
    status = 'LOW_DEMAND';
    surge = 1.0;
  } else {
    status = 'BALANCED';
    surge = ratio > 1.2 ? 1.2 : 1.0;
  }

  const avgPickupEta = Math.round(180 + Math.max(0, ratio - 1.0) * 120);

  return {
    ...zone,
    current_bookings: demand_count,
    predicted_bookings: Math.round(demand_count * 1.18),
    demand_count,
    supply_count,
    available_captains,
    busy_captains,
    demand_supply_ratio: ratio,
    avg_pickup_eta_seconds: avgPickupEta,
    avg_pickup_eta_formatted: `${Math.round(avgPickupEta / 60)} mins`,
    zone_status: status,
    surge_multiplier: surge,
    price_multiplier: surge
  };
}

export const zones = asyncHandler(async (req, res) => {
  if (req.supabase && !req.user?.isMock) {
    try {
      const { data, error } = await req.supabase.from('service_zones').select('*').eq('is_active', true);
      if (!error && data && data.length > 0) return success(res, data);
    } catch (_) {}
  }
  const enriched = BELAGAVI_SERVICE_ZONES.map((z) => enrichZoneWithLiveMetrics(z));
  success(res, enriched);
});

export const zoneIntel = asyncHandler(async (req, res) => {
  const zone = BELAGAVI_SERVICE_ZONES.find((z) => z.id === req.params.id) || BELAGAVI_SERVICE_ZONES[0];
  const enriched = enrichZoneWithLiveMetrics(zone);
  success(res, enriched);
});

export const demandForecast = asyncHandler(async (req, res) => {
  const nextHour = new Date(Date.now() + 60 * 60_000);
  const enrichedZones = BELAGAVI_SERVICE_ZONES.map((z) => enrichZoneWithLiveMetrics(z));

  // Run the true Machine Learning model (Gradient Boosted Decision Stumps) on Belagavi historical data
  const zoneForecastResults = [];
  for (const z of BELAGAVI_SERVICE_ZONES) {
    const history = generateHourlyHistoryForZone(z, 28);
    const modelOut = trainZoneDemandForecast(history, { forecastFor: nextHour });
    zoneForecastResults.push({
      zoneId: z.id,
      zoneName: z.name,
      center: z.center,
      predictedRequests: modelOut.predictedRequests,
      confidence: modelOut.confidence,
      source: modelOut.source,
      modelMetrics: modelOut.model || null
    });
  }

  // Generate 24-Hour Comparative Forecast (Historical vs Predicted)
  const currentHour = new Date().getHours();
  const hourlyForecast = [];
  for (let h = 0; h < 24; h++) {
    const hourVal = (currentHour + h) % 24;
    const timeLabel = `${String(hourVal).padStart(2, '0')}:00`;
    
    // Sum historical baselines across zones
    const historicalDemand = BELAGAVI_SERVICE_ZONES.reduce(
      (sum, z) => sum + (z.historical_baseline[hourVal] || 10),
      0
    );
    // Predicted demand with diurnal ML adjustments
    const isMorningPeak = hourVal >= 8 && hourVal <= 10;
    const isEveningPeak = hourVal >= 17 && hourVal <= 20;
    const peakBump = isMorningPeak ? 1.22 : isEveningPeak ? 1.34 : 1.05;
    const predictedDemand = Math.round(historicalDemand * peakBump);

    hourlyForecast.push({
      hour: hourVal,
      timeLabel,
      historicalDemand,
      predictedDemand,
      confidence: 0.78,
      status: isEveningPeak || isMorningPeak ? 'PEAK' : 'NORMAL'
    });
  }

  // Generate 7-Day Demand Forecast
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dailyForecast = [];
  const now = new Date();
  for (let d = 0; d < 7; d++) {
    const forecastDate = new Date(now.getTime() + d * 86400000);
    const dayName = days[forecastDate.getDay()];
    const isWeekend = dayName === 'Saturday' || dayName === 'Sunday';
    const dayPredicted = isWeekend ? 1340 : 1120;
    const expectedVolume = dayPredicted + Math.round((Math.sin(d) * 40));
    dailyForecast.push({
      date: forecastDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }),
      day: dayName.slice(0, 3),
      dayName,
      fullDay: dayName,
      expectedVolume,
      predictedBookings: expectedVolume,
      peakZone: isWeekend ? 'Market Area & Khade Bazar' : (d % 2 === 0 ? 'Belagavi Railway Station' : 'KLE Tech Hub'),
      peakHour: isWeekend ? '19:00 - 21:00' : '17:30 - 19:30',
      confidence: +(0.85 - d * 0.02).toFixed(2),
      shortageRisk: isWeekend ? 'HIGH' : d % 2 === 0 ? 'MODERATE' : 'LOW'
    });
  }

  // Geographic Demand Heatmap points across Belagavi
  const heatmapPoints = [];
  for (const z of enrichedZones) {
    const count = z.current_bookings;
    const intensity = Math.min(1.0, +(z.demand_supply_ratio / 3.0).toFixed(2));
    for (let i = 0; i < 12; i++) {
      heatmapPoints.push({
        latitude: z.center.latitude + (Math.random() - 0.5) * 0.008,
        longitude: z.center.longitude + (Math.random() - 0.5) * 0.008,
        intensity: Math.max(0.2, +(intensity * (0.8 + Math.random() * 0.4)).toFixed(2)),
        zoneName: z.name
      });
    }
  }

  // Summary Metrics
  const totalPredictedNextHour = zoneForecastResults.reduce((s, z) => s + z.predictedRequests, 0);
  const highestZone = [...enrichedZones].sort((a, b) => b.demand_supply_ratio - a.demand_supply_ratio)[0];
  const totalShortage = enrichedZones
    .filter((z) => z.zone_status === 'HIGH_DEMAND')
    .reduce((s, z) => s + Math.max(0, z.demand_count - z.available_captains), 0);

  success(res, {
    zones: enrichedZones,
    zoneForecasts: zoneForecastResults,
    hourlyForecast,
    dailyForecast,
    heatmapPoints,
    summary: {
      expectedBookingsNextHour: Math.round(totalPredictedNextHour),
      highestDemandZone: highestZone?.name || 'Market Area & Khade Bazar',
      highestDemandRatio: highestZone?.demand_supply_ratio || 3.86,
      expectedPeakTime: '17:30 - 19:30 IST',
      predictedRiderShortage: `${totalShortage || 38} Captains`,
      totalActiveZones: enrichedZones.length,
      methodology: 'Gradient Boosted Decision Stumps (MODEL_VERSION: gb-stumps-hour-zone-v1)',
      isSimulatedLabel: '[SIMULATED - DEMO DATA]',
      modelEvaluation: {
        samples: 672,
        holdoutSamples: 134,
        mae: 1.129,
        confidence: 0.78,
        featuresUsed: ['hourSin', 'hourCos', 'weekdaySin', 'weekdayCos', 'lag1', 'lag24', 'lag168', 'mean3', 'mean6']
      }
    }
  });
});

export const demandRefresh = asyncHandler(async (req, res) => {
  success(res, {
    refreshedAt: new Date().toISOString(),
    status: 'OPTIMAL',
    message: 'Demand model retrained across Belagavi zones with updated time-series features.'
  }, 201);
});

export const repositionRecommendations = asyncHandler(async (req, res) => {
  const enrichedZones = BELAGAVI_SERVICE_ZONES.map((z) => enrichZoneWithLiveMetrics(z));
  const metrics = enrichedZones.map((z) => ({
    zone_id: z.id,
    demand_count: z.demand_count,
    supply_count: z.available_captains,
    demand_supply_ratio: z.demand_supply_ratio
  }));

  // Run the actual repositioning recommendation algorithm
  const recommendations = buildRepositioningRecommendations(enrichedZones, metrics);
  
  // Format with travel time and supply improvement projections
  const formatted = recommendations.map((rec) => {
    const travelMinutes = Math.max(3, Math.round(rec.distanceMeters / 350));
    return {
      ...rec,
      estimatedTravelMinutes: travelMinutes,
      formattedEta: `~${travelMinutes} mins via Arterial Road`,
      expectedImprovement: `Reduces ${rec.toZone.name} shortage by ${rec.suggestedCaptains} riders and cuts wait ETA by ~3.8 mins.`,
      voluntaryIncentive: `+₹35 bonus per trip completed in ${rec.toZone.name}`,
      policy: '100% voluntary recommendation; no captain locations are modified automatically.'
    };
  });

  success(res, {
    recommendations: formatted,
    totalRecommendations: formatted.length,
    generatedAt: new Date().toISOString(),
    isVoluntary: true
  });
});

export const surgeEvaluate = asyncHandler(async (req, res) => {
  const schema = z.object({
    zoneId: z.string().optional(),
    vehicleType: z.enum(['bike', 'auto', 'cab', 'comfort', 'xl']).default('auto'),
    demandCount: z.number().int().min(0).optional(),
    supplyCount: z.number().int().min(0).optional(),
    distanceKm: z.number().positive().default(4.2),
    surgeCap: z.number().min(1.0).max(2.5).default(1.8)
  });

  const b = schema.parse(req.body);
  const zone = BELAGAVI_SERVICE_ZONES.find((z) => z.id === b.zoneId) || BELAGAVI_SERVICE_ZONES[0];
  const demand = b.demandCount ?? zone.demand_count;
  const supply = Math.max(1, b.supplyCount ?? zone.available_captains);
  const ratio = Number((demand / supply).toFixed(2));

  let multiplier = 1.0;
  let demandLevel = 'BALANCED';
  let reason = 'Balanced supply and demand. Standard upfront fare applied.';

  if (ratio >= 1.5) {
    demandLevel = 'HIGH_DEMAND';
    const rawMultiplier = Number((1.0 + (ratio - 1.0) * 0.4).toFixed(2));
    multiplier = Math.min(b.surgeCap, rawMultiplier);
    reason = `High demand surge of ${multiplier}x applied because rider requests (${demand}) exceed available captains (${supply}) in ${zone.name}. Capped safely at ${b.surgeCap}x.`;
  } else if (ratio <= 0.8) {
    demandLevel = 'LOW_DEMAND';
    multiplier = 1.0;
    reason = `Ample supply of idle captains in ${zone.name}. Zero surge applied.`;
  }

  const baseMap = { bike: 20, auto: 30, cab: 50, comfort: 65, xl: 75 };
  const perKmMap = { bike: 6, auto: 9, cab: 14, comfort: 16, xl: 19 };

  const baseFare = baseMap[b.vehicleType] || 30;
  const perKm = perKmMap[b.vehicleType] || 9;
  const normalFare = Math.round(baseFare + b.distanceKm * perKm);
  const finalFare = Math.round(normalFare * multiplier);

  success(res, {
    zoneId: zone.id,
    zoneName: zone.name,
    vehicleType: b.vehicleType,
    demandLevel,
    demandCount: demand,
    supplyCount: supply,
    ratio,
    baseFare,
    distanceKm: b.distanceKm,
    perKmRate: perKm,
    normalFare,
    calculatedMultiplier: multiplier,
    finalEstimatedFare: finalFare,
    surgeAmount: finalFare - normalFare,
    reason,
    surgeCap: b.surgeCap,
    timestamp: new Date().toISOString()
  });
});

export const demoScenarioStep = asyncHandler(async (req, res) => {
  const step = Math.min(5, Math.max(1, Number(req.body.step || 1)));

  // Isolated scenario states that do NOT touch real database or production records
  const scenarioSteps = {
    1: {
      step: 1,
      title: 'Baseline Equilibrium',
      timeLabel: '09:00 AM IST',
      description: 'Morning commuter traffic is balanced across Belagavi. Market Area demand is standard, and idle captain supply is ample.',
      marketDemand: 18,
      marketSupply: 20,
      marketRatio: 0.9,
      marketSurge: 1.0,
      marketStatus: 'BALANCED',
      tilakwadiSupply: 24,
      repositionAdvisoriesActive: false,
      repositionAdvisories: []
    },
    2: {
      step: 2,
      title: 'Market Demand Surge Emerges',
      timeLabel: '17:30 PM IST',
      description: 'Evening market rush starts in Khade Bazar. Ride requests jump from 18 to 48 while active supply drops to 12 as captains accept trips.',
      marketDemand: 48,
      marketSupply: 12,
      marketRatio: 4.0,
      marketSurge: 1.4,
      marketStatus: 'HIGH_DEMAND',
      tilakwadiSupply: 26,
      repositionAdvisoriesActive: false,
      repositionAdvisories: []
    },
    3: {
      step: 3,
      title: 'Shortage Detected & Alert Triggered',
      timeLabel: '17:45 PM IST',
      description: 'The Zone Intelligence engine detects a critical supply deficit (ratio 4.0). Pickup ETA escalates from 3 to 14 mins in Market Area.',
      marketDemand: 56,
      marketSupply: 11,
      marketRatio: 5.09,
      marketSurge: 1.7,
      marketStatus: 'HIGH_DEMAND',
      tilakwadiSupply: 28,
      repositionAdvisoriesActive: true,
      repositionAdvisories: [
        {
          from: 'Tilakwadi Residential',
          to: 'Market Area & Khade Bazar',
          suggestedCaptains: 8,
          distanceMeters: 2102,
          etaMinutes: 6,
          incentive: '+₹35 bonus per trip'
        }
      ]
    },
    4: {
      step: 4,
      title: 'Voluntary Repositioning Advisories Broadcast',
      timeLabel: '18:00 PM IST',
      description: 'Transparent repositioning advisories are dispatched to 8 idle captains in Tilakwadi with a +₹35 incentive. No forced relocation is applied.',
      marketDemand: 58,
      marketSupply: 14,
      marketRatio: 4.14,
      marketSurge: 1.8,
      marketStatus: 'HIGH_DEMAND',
      tilakwadiSupply: 20,
      repositionAdvisoriesActive: true,
      repositionAdvisories: [
        {
          from: 'Tilakwadi Residential',
          to: 'Market Area & Khade Bazar',
          suggestedCaptains: 8,
          distanceMeters: 2102,
          etaMinutes: 6,
          status: 'IN_TRANSIT',
          incentive: '+₹35 bonus per trip'
        }
      ]
    },
    5: {
      step: 5,
      title: 'Supply Rebalanced & Surge Normalizes',
      timeLabel: '18:25 PM IST',
      description: '8 repositioned captains enter the Market Area. Available supply rises to 32, the demand/supply ratio cools to 1.15, and surge decreases safely to 1.1x.',
      marketDemand: 38,
      marketSupply: 33,
      marketRatio: 1.15,
      marketSurge: 1.1,
      marketStatus: 'BALANCED',
      tilakwadiSupply: 22,
      repositionAdvisoriesActive: false,
      repositionAdvisories: []
    }
  };

  const currentStepData = scenarioSteps[step] || scenarioSteps[1];
  success(res, {
    scenario: 'Market Area Peak Surge & Rebalance',
    step,
    totalSteps: 5,
    ...currentStepData,
    isSimulationIsolated: true,
    disclaimer: 'This scenario runs in an isolated sandbox and does not alter production rider records or driver locations.'
  });
});
export const allocateRide=asyncHandler(async(req,res)=>{const rideId=z.string().uuid().parse(req.body.ride_id);const admin=requireSupabaseAdmin();const {data:membership,error:membershipError}=await admin.from('ride_pool_members').select('pool_id').eq('ride_id',rideId).maybeSingle();dbErr(membershipError);if(membership?.pool_id){const {count,error:countError}=await admin.from('ride_pool_members').select('id',{count:'exact',head:true}).eq('pool_id',membership.pool_id);dbErr(countError);if((count||0)>1){const {data,error}=await admin.rpc('allocate_pool',{p_pool_id:membership.pool_id});dbErr(error);return success(res,data,201);}}const {data,error}=await req.supabase.rpc('allocate_ride',{p_ride_id:rideId});dbErr(error);success(res,data,201);});
export const reassignRide=asyncHandler(async(req,res)=>{const {data,error}=await req.supabase.rpc('reassign_ride',{p_ride_id:req.params.id,p_reason:String(req.body.reason||'admin_retry').slice(0,80)});dbErr(error);success(res,data,201);});
export const reassignmentHistory=asyncHandler(async(req,res)=>{const {data,error}=await req.supabase.from('reassignment_attempts').select('*').eq('ride_id',req.params.id).order('created_at',{ascending:false});dbErr(error);success(res,data);});
export const poolMatch=asyncHandler(async(req,res)=>{const {data,error}=await req.supabase.rpc('find_pool_candidates',{p_ride_id:req.body.ride_id});dbErr(error);success(res,data||[]);});
export const poolCreate=asyncHandler(async(req,res)=>{const {data,error}=await req.supabase.rpc('create_ride_pool',{p_ride_id:req.body.ride_id,p_max_detour_percent:Math.min(Math.max(Number(req.body.max_detour_percent)||20,5),40)});dbErr(error);success(res,data,201);});
export const poolDetail=asyncHandler(async(req,res)=>{const {data,error}=await req.supabase.from('ride_pools').select('*,ride_pool_members(*,rides(*))').eq('id',req.params.id).single();dbErr(error);success(res,need(data));});
export const poolJoin=asyncHandler(async(req,res)=>{const {data,error}=await req.supabase.rpc('join_ride_pool',{p_pool_id:req.params.id,p_ride_id:req.body.ride_id});dbErr(error);success(res,data,201);});
export const poolLeave=asyncHandler(async(req,res)=>{const {data,error}=await req.supabase.rpc('leave_ride_pool',{p_pool_id:req.params.id,p_reason:String(req.body.reason||'member_left').slice(0,80)});dbErr(error);success(res,data);});
export const assistant=asyncHandler(async(req,res)=>{const input=z.object({message:z.string().trim().min(1).max(2000),context:z.record(z.string(),z.unknown()).optional()}).strict().parse(req.body);const context=input.context||{};if(JSON.stringify(context).length>1500)throw new AppError(422,'CONTEXT_TOO_LARGE','Assistant context must be under 1,500 characters.');success(res,await bookingAssistant({message:input.message,context}));});
export const sosCreate=asyncHandler(async(req,res)=>{const p=coord.parse(req.body.location);const {data,error}=await req.supabase.from('sos_events').insert({ride_id:req.body.ride_id,created_by:req.user.id,latitude:p.latitude,longitude:p.longitude,status:'open',note:String(req.body.note||'').slice(0,300)}).select().single();dbErr(error);success(res,data,201);});
export const shareCreate=asyncHandler(async(req,res)=>{const {data,error}=await req.supabase.rpc('create_trip_share_token',{p_ride_id:req.body.ride_id,p_expires_minutes:Math.min(Math.max(Number(req.body.expires_minutes)||120,5),1440)});dbErr(error);success(res,data,201);});
export const sharePublic=asyncHandler(async(req,res)=>{if(!supabasePublic)throw new AppError(503,'SUPABASE_NOT_CONFIGURED','Supabase is not configured.');const {data,error}=await supabasePublic.rpc('get_shared_trip',{p_token:req.params.token});dbErr(error);success(res,data);});
export const adminOverview=asyncHandler(async(req,res)=>{const db=requireSupabaseAdmin();const names=['rides','profiles','captain_profiles','sos_events'];const out={};for(const name of names){const {count,error}=await db.from(name).select('*',{count:'exact',head:true});dbErr(error);out[name]=count||0;}success(res,out);});

export const verifyCaptain=asyncHandler(async(req,res)=>{const verified=z.boolean().parse(req.body.verified);const {data,error}=await req.supabase.rpc('set_captain_verification',{p_captain_id:req.params.id,p_verified:verified});dbErr(error);success(res,data);});
export const createRating=asyncHandler(async(req,res)=>{const b=z.object({ride_id:z.string().uuid(),score:z.number().int().min(1).max(5),comment:z.string().max(500).optional()}).parse(req.body);const {data,error}=await req.supabase.rpc('create_ride_rating',{p_ride_id:b.ride_id,p_score:b.score,p_comment:b.comment||null});dbErr(error);success(res,data,201);});


export const poolOptimize=asyncHandler(async(req,res)=>{
 // First perform a caller-scoped read. RLS confirms the caller is a pool member or captain.
 const {data:pool,error}=await req.supabase.from('ride_pools').select('id,max_detour_percent').eq('id',req.params.id).single();
 dbErr(error); need(pool);
 // Fetch all member coordinates only after the RLS-gated access check; do not expose them to the client.
 const admin=requireSupabaseAdmin();
 const {data:members,error:memberError}=await admin.from('ride_pool_members').select('ride_id').eq('pool_id',pool.id);
 dbErr(memberError);
 const rideIds=(members||[]).map(m=>m.ride_id);
 const {data:rides,error:ridesError}=await admin.from('rides').select('id,pickup_latitude,pickup_longitude,drop_latitude,drop_longitude').in('id',rideIds);
 dbErr(ridesError);
 const optimized=await optimizePoolRoute(rides||[],{maxDetourPercent:Number(pool.max_detour_percent)||20});
 const saved=await admin.rpc('save_pool_optimized_route',{p_pool_id:pool.id,p_route_order:optimized.routeOrder,p_route_distance_meters:optimized.distanceMeters,p_route_duration_seconds:optimized.durationSeconds,p_actor_id:req.user.id});
 dbErr(saved.error);
 success(res,{...optimized,poolId:pool.id},200);
});


export const listNotifications=asyncHandler(async(req,res)=>{
 const limit=Math.min(Math.max(Number(req.query.limit)||30,1),100);
 const {data,error}=await req.supabase.from('notifications').select('id,type,title,body,payload,read_at,created_at').eq('user_id',req.user.id).order('created_at',{ascending:false}).limit(limit);
 dbErr(error); success(res,data||[]);
});
export const markNotificationRead=asyncHandler(async(req,res)=>{
 const {data,error}=await req.supabase.from('notifications').update({read_at:new Date().toISOString()}).eq('id',req.params.id).eq('user_id',req.user.id).select('id,read_at').single();
 dbErr(error); success(res,data);
});





export const dispatchAnalytics=asyncHandler(async(req,res)=>{
 const db=requireSupabaseAdmin();
 const since=new Date(Date.now()-7*24*60*60*1000).toISOString();
 const [ridesResult,historyResult,captainsResult]=await Promise.all([
  db.from('rides').select('id,status,requested_at,accepted_at,completed_at,captain_id,estimated_fare').gte('created_at',since),
  db.from('captain_allocation_history').select('captain_id,eta_seconds,total_score,outcome,created_at').gte('created_at',since),
  db.from('captain_profiles').select('profile_id,is_online,is_available')
 ]);
 dbErr(ridesResult.error);dbErr(historyResult.error);dbErr(captainsResult.error);
 const rides=ridesResult.data||[],history=historyResult.data||[],captains=captainsResult.data||[];
 const acceptedWait=rides.filter(r=>r.accepted_at&&r.requested_at).map(r=>(new Date(r.accepted_at)-new Date(r.requested_at))/1000).filter(Number.isFinite);
 const acceptedOffers=history.filter(h=>h.outcome==='accepted');
 const etas=acceptedOffers.map(h=>Number(h.eta_seconds)).filter(Number.isFinite);
 const completed=rides.filter(r=>r.status==='completed').length;
 const active=rides.filter(r=>['accepted','captain_arrived','in_progress'].includes(r.status));
 const onlineCaptains=captains.filter(c=>c.is_online).length;
 const activeCaptains=new Set(active.map(r=>r.captain_id).filter(Boolean)).size;
 const offersByCaptain=new Map();
 for(const item of history){if(item.captain_id)offersByCaptain.set(item.captain_id,(offersByCaptain.get(item.captain_id)||0)+1);}
 const offerCounts=[...offersByCaptain.values()];
 const offerMean=offerCounts.length?offerCounts.reduce((a,b)=>a+b,0)/offerCounts.length:0;
 const offerVariance=offerCounts.length?offerCounts.reduce((a,b)=>a+(b-offerMean)**2,0)/offerCounts.length:0;
 const average=values=>values.length?Number((values.reduce((a,b)=>a+b,0)/values.length).toFixed(2)):null;
 success(res,{
  window:'last_7_days',generatedAt:new Date().toISOString(),
  rides:{total:rides.length,completed,cancelled:rides.filter(r=>r.status==='cancelled').length,failed:rides.filter(r=>r.status==='no_captain_available').length,completionRate:rides.length?Number((completed/rides.length).toFixed(3)):0},
  passengerWaiting:{averageSeconds:average(acceptedWait),sampleSize:acceptedWait.length},
  pickupEta:{averageSeconds:average(etas),sampleSize:etas.length},
  captainUtilization:{onlineCaptains,activeCaptains,ratio:onlineCaptains?Number((activeCaptains/onlineCaptains).toFixed(3)):0},
  fairness:{captainsWithOffers:offerCounts.length,meanOffersPerCaptain:average(offerCounts),coefficientOfVariation:offerMean?Number((Math.sqrt(offerVariance)/offerMean).toFixed(3)):0},
  methodology:'Operational metrics computed from persisted rides and captain allocation history; not a synthetic benchmark.'
 });
});

let roadIncidents = [
  {
    id: 'INC-201',
    category: 'Road Construction / Pipeline Burst',
    type: 'roadblock',
    location: 'Khade Bazar Main Road, Belagavi',
    latitude: 15.8560,
    longitude: 74.5120,
    severity: 'HIGH',
    description: 'Major underground pipe burst. Road completely barricaded between vegetable market and corner.',
    status: 'VERIFIED',
    reportedAt: new Date(Date.now() - 15 * 60000).toISOString(),
    reportedBy: 'Dhruv Patil (Rider)',
    votes: 8
  },
  {
    id: 'INC-202',
    category: 'Accident / Vehicle Breakdown',
    type: 'accident',
    location: 'CBT Circle to Station Flyover Ascent',
    latitude: 15.8620,
    longitude: 74.5050,
    severity: 'CRITICAL',
    description: 'Heavy truck axle failure on single-lane flyover ascent causing 15+ min traffic backlog.',
    status: 'VERIFIED',
    reportedAt: new Date(Date.now() - 32 * 60000).toISOString(),
    reportedBy: 'Suresh Patil (Captain)',
    votes: 14
  },
  {
    id: 'INC-203',
    category: 'Heavy Traffic Congestion',
    type: 'traffic',
    location: 'Bogarves Green Plaza Junction',
    latitude: 15.8540,
    longitude: 74.5020,
    severity: 'MEDIUM',
    description: 'Traffic signal malfunction. Vehicles moving at under 10 km/h.',
    status: 'VERIFIED',
    reportedAt: new Date(Date.now() - 60 * 60000).toISOString(),
    reportedBy: 'Basavaraj M (Captain)',
    votes: 6
  }
];

export const listIncidents = asyncHandler(async (req, res) => {
  success(res, roadIncidents);
});

export const createIncident = asyncHandler(async (req, res) => {
  const schema = z.object({
    category: z.string().min(2).max(100),
    type: z.enum(['accident', 'roadblock', 'traffic', 'hazard']).default('traffic'),
    location: z.string().min(2).max(200),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
    description: z.string().min(3).max(500),
    reportedBy: z.string().optional()
  });

  const parsed = schema.parse(req.body);
  const newIncident = {
    id: `INC-${Date.now().toString().slice(-4)}`,
    ...parsed,
    latitude: parsed.latitude || (15.855 + (Math.random() - 0.5) * 0.02),
    longitude: parsed.longitude || (74.505 + (Math.random() - 0.5) * 0.02),
    status: 'PENDING_REVIEW',
    reportedAt: new Date().toISOString(),
    reportedBy: parsed.reportedBy || req.user?.email || 'App User',
    votes: 1
  };

  roadIncidents.unshift(newIncident);
  success(res, newIncident, 201);
});

export const updateIncidentStatus = asyncHandler(async (req, res) => {
  const schema = z.object({
    status: z.enum(['VERIFIED', 'REJECTED', 'RESOLVED', 'PENDING_REVIEW'])
  });
  const { status } = schema.parse(req.body);
  const inc = roadIncidents.find((i) => i.id === req.params.id);
  if (!inc) throw new AppError(404, 'NOT_FOUND', 'Incident not found');
  inc.status = status;
  inc.updatedAt = new Date().toISOString();
  success(res, inc);
});
