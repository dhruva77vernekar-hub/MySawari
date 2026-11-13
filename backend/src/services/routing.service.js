import { env } from '../config/env.js'; import { haversineMeters } from '../utils/geo.js';
export async function routeBetween(origin,destination){const coords=`${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;try{const r=await fetch(`${env.OSRM_BASE_URL}/route/v1/driving/${coords}?overview=false&steps=false`,{signal:AbortSignal.timeout(7000)});if(!r.ok)throw new Error(`OSRM ${r.status}`);const j=await r.json();if(j.code!=='Ok'||!j.routes?.[0])throw new Error('No route');return {distanceMeters:Math.round(j.routes[0].distance),durationSeconds:Math.round(j.routes[0].duration),source:'osrm',approximate:false};}catch{return {distanceMeters:Math.round(haversineMeters(origin,destination)*1.25),durationSeconds:Math.round(haversineMeters(origin,destination)*1.25/7),source:'haversine_fallback',approximate:true};}}
export async function geocode(query){const url=new URL('/search',env.NOMINATIM_BASE_URL);url.search=new URLSearchParams({q:query,format:'jsonv2',limit:'5',countrycodes:'in'}).toString();const r=await fetch(url,{headers:{'User-Agent':env.NOMINATIM_USER_AGENT,'Accept-Language':'en'},signal:AbortSignal.timeout(8000)});if(!r.ok)throw new Error(`Geocoding provider returned ${r.status}`);return (await r.json()).map(x=>({displayName:x.display_name,latitude:Number(x.lat),longitude:Number(x.lon),type:x.type}));}
export async function reverseGeocode(latitude,longitude){const url=new URL('/reverse',env.NOMINATIM_BASE_URL);url.search=new URLSearchParams({lat:String(latitude),lon:String(longitude),format:'jsonv2'}).toString();const r=await fetch(url,{headers:{'User-Agent':env.NOMINATIM_USER_AGENT},signal:AbortSignal.timeout(8000)});if(!r.ok)throw new Error(`Reverse geocoding provider returned ${r.status}`);const x=await r.json();return {displayName:x.display_name||null,address:x.address||{}};}


export async function routeThrough(points) {
  if (!Array.isArray(points) || points.length < 2 || points.length > 8) {
    throw new Error('A route must contain between 2 and 8 points.');
  }
  const coordinates = points.map((point) => `${point.longitude},${point.latitude}`).join(';');
  try {
    const response = await fetch(`${env.OSRM_BASE_URL}/route/v1/driving/${coordinates}?overview=false&steps=false`, {
      signal: AbortSignal.timeout(9000)
    });
    if (!response.ok) throw new Error(`OSRM ${response.status}`);
    const payload = await response.json();
    if (payload.code !== 'Ok' || !payload.routes?.[0]) throw new Error('No route found');
    return {
      distanceMeters: Math.round(payload.routes[0].distance),
      durationSeconds: Math.round(payload.routes[0].duration),
      source: 'osrm',
      approximate: false
    };
  } catch {
    let distanceMeters = 0;
    for (let index = 1; index < points.length; index += 1) {
      distanceMeters += haversineMeters(points[index - 1], points[index]) * 1.25;
    }
    return {
      distanceMeters: Math.round(distanceMeters),
      durationSeconds: Math.round(distanceMeters / 7),
      source: 'haversine_fallback',
      approximate: true
    };
  }
}
