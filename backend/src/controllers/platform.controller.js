import { z } from 'zod'; import { success } from '../utils/api-response.js'; import { AppError } from '../utils/app-error.js'; import { asyncHandler } from '../utils/async-handler.js'; import { env } from '../config/env.js'; import { routeBetween,geocode,reverseGeocode } from '../services/routing.service.js'; import { bookingAssistant } from '../services/ai.service.js'; import { haversineMeters,pointInPolygon } from '../utils/geo.js'; import { optimizePoolRoute } from '../services/pooling.service.js'; import { buildRepositioningRecommendations } from '../services/repositioning.service.js';
import { generateZoneForecasts } from '../services/forecasting.service.js'; import { supabasePublic, supabaseAdmin, requireSupabaseAdmin } from '../config/supabase.js';
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
export const fareEstimate=asyncHandler(async(req,res)=>{const schema=z.object({vehicleType:z.enum(['bike','scooter','car','cab','auto','suv','shuttle']).default('cab'),distanceMeters:z.number().positive().max(200000),zoneMultiplier:z.number().min(1).max(env.SURGE_CAP).default(1)});const b=schema.parse(req.body);const baseMap={bike:env.FARE_BIKE_BASE||20,scooter:env.FARE_SCOOTER_BASE||25,auto:30,car:env.FARE_CAR_BASE||50,cab:env.FARE_CAR_BASE||50,suv:70,shuttle:15};const perKmMap={bike:6,scooter:7,auto:9,car:env.FARE_PER_KM||14,cab:env.FARE_PER_KM||14,suv:18,shuttle:4};const base=baseMap[b.vehicleType]||50;const perKm=perKmMap[b.vehicleType]||env.FARE_PER_KM||9;const distanceKm=b.distanceMeters/1000;const subtotal=base+distanceKm*perKm;success(res,{currency:'INR',vehicleType:b.vehicleType,baseFare:base,distanceKm:Number(distanceKm.toFixed(2)),perKmRate:perKm,zoneMultiplier:b.zoneMultiplier,total:Math.round(subtotal*b.zoneMultiplier),estimateOnly:true,disclaimer:'Final fare may vary by approved waiting, toll and route rules.'});});
export const createRide=asyncHandler(async(req,res)=>{const s=z.object({vehicle_type_id:z.string().uuid(),pickup:coord,drop:coord,pickup_address:z.string().max(300).optional(),drop_address:z.string().max(300).optional(),passenger_count:z.number().int().min(1).max(4).default(1),pooling_opt_in:z.boolean().default(false),idempotency_key:z.string().min(8).max(100).optional()}).parse(req.body);const route=await routeBetween(s.pickup,s.drop);const {data:vehicle,error:ve}=await req.supabase.from('vehicle_types').select('id,code,display_name,capacity').eq('id',s.vehicle_type_id).single();dbErr(ve);const base=({bike:env.FARE_BIKE_BASE,scooter:env.FARE_SCOOTER_BASE,car:env.FARE_CAR_BASE}[vehicle.code]||env.FARE_SCOOTER_BASE);const per=env.FARE_PER_KM;let zoneMultiplier=1;const {data:zonePrice,error:zonePriceError}=await req.supabase.rpc('get_zone_multiplier',{p_latitude:s.pickup.latitude,p_longitude:s.pickup.longitude});if(!zonePriceError&&zonePrice)zoneMultiplier=Math.min(env.SURGE_CAP,Math.max(1,Number(zonePrice.priceMultiplier)||1));const fare=Number(((base+(route.distanceMeters/1000)*per)*zoneMultiplier).toFixed(2));const admin = requireSupabaseAdmin(); const {data,error}=await admin.rpc('create_ride_request',{p_rider_id:req.user.id,p_vehicle_type_id:s.vehicle_type_id,p_pickup_lat:s.pickup.latitude,p_pickup_lng:s.pickup.longitude,p_drop_lat:s.drop.latitude,p_drop_lng:s.drop.longitude,p_pickup_address:s.pickup_address||null,p_drop_address:s.drop_address||null,p_passenger_count:s.passenger_count,p_pooling_opt_in:s.pooling_opt_in,p_distance_meters:route.distanceMeters,p_duration_seconds:route.durationSeconds,p_estimated_fare:fare,p_zone_multiplier:zoneMultiplier,p_idempotency_key:s.idempotency_key||null});dbErr(error);success(res,{...data,route,estimatedFare:fare,zoneMultiplier,currency:'INR'},201);});
export const listRides=asyncHandler(async(req,res)=>{const {data,error}=await req.supabase.from('rides').select('*,vehicle_types(display_name,code)').order('created_at',{ascending:false}).limit(Math.min(Number(req.query.limit)||20,50));dbErr(error);success(res,data);});
export const getRide=asyncHandler(async(req,res)=>{const {data,error}=await req.supabase.from('rides').select('*,ride_events(*),vehicle_types(display_name,code)').eq('id',req.params.id).single();dbErr(error);success(res,need(data));});
export const cancelRide=asyncHandler(async(req,res)=>{const {data,error}=await req.supabase.rpc('cancel_ride_request',{p_ride_id:req.params.id,p_reason:String(req.body.reason||'rider_cancelled').slice(0,120)});dbErr(error);success(res,data);});
export const rideAction=asyncHandler(async(req,res)=>{const action=z.enum(['accept','arrived','start','complete','reject','cancel']).parse(req.params.action);const {data:membership,error:membershipError}=await req.supabase.from('ride_pool_members').select('pool_id').eq('ride_id',req.params.id).maybeSingle();dbErr(membershipError);if(membership?.pool_id){const {count,error:countError}=await req.supabase.from('ride_pool_members').select('id',{count:'exact',head:true}).eq('pool_id',membership.pool_id);dbErr(countError);if((count||0)>1){const {data,error}=await req.supabase.rpc('pool_ride_action',{p_pool_id:membership.pool_id,p_action:action,p_note:String(req.body.note||'').slice(0,200)});dbErr(error);return success(res,data);}}const {data,error}=await req.supabase.rpc('captain_ride_action',{p_ride_id:req.params.id,p_action:action,p_note:String(req.body.note||'').slice(0,200)});dbErr(error);success(res,data);});
export const nearbyCaptains=asyncHandler(async(req,res)=>{const p=coord.parse({latitude:Number(req.query.latitude),longitude:Number(req.query.longitude)});const radius=Math.min(Math.max(Number(req.query.radiusMeters)||5000,250),15000);const {data,error}=await req.supabase.rpc('get_nearby_captains',{p_latitude:p.latitude,p_longitude:p.longitude,p_radius_meters:radius,p_stale_seconds:env.LOCATION_STALE_SECONDS});dbErr(error);success(res,data||[]);});
export const zones=asyncHandler(async(req,res)=>{const {data,error}=await req.supabase.from('service_zones').select('id,name,city,polygon_geojson,is_active').eq('is_active',true);dbErr(error);success(res,data);});
export const zoneIntel=asyncHandler(async(req,res)=>{const {data,error}=await req.supabase.from('zone_metrics').select('*').eq('zone_id',req.params.id).order('created_at',{ascending:false}).limit(1).maybeSingle();dbErr(error);success(res,data);});
export const demandForecast=asyncHandler(async(req,res)=>{const {data,error}=await req.supabase.from('demand_forecasts').select('*,service_zones(name)').order('generated_at',{ascending:false}).limit(100);dbErr(error);success(res,data);});
export const demandRefresh=asyncHandler(async(req,res)=>{const {data,error}=await req.supabase.rpc('refresh_zone_intelligence');dbErr(error);const forecasts=await generateZoneForecasts(requireSupabaseAdmin(),{horizonMinutes:30});success(res,{zoneIntelligence:data,forecasting:forecasts},201);});
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


export const repositionRecommendations=asyncHandler(async(req,res)=>{
 const db=requireSupabaseAdmin();
 const {data:zonesData,error:zonesError}=await db.from('service_zones').select('id,name,polygon_geojson').eq('is_active',true);
 dbErr(zonesError);
 const {data:metricsData,error:metricsError}=await db.from('zone_metrics').select('zone_id,demand_count,supply_count,demand_supply_ratio,created_at').order('created_at',{ascending:false}).limit(500);
 dbErr(metricsError);
 const recommendations=buildRepositioningRecommendations(zonesData||[],metricsData||[]);
 success(res,{recommendations,generatedAt:new Date().toISOString(),note:'Suggestions only; captains are not moved automatically.'});
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
