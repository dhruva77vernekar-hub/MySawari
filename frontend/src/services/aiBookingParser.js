/**
 * aiBookingParser.js
 * Comprehensive Natural Language & Voice Intent Parser for Sawari AI.
 * Parses spoken and typed queries like:
 * "book a ride from kle to belgavi railway station"
 * "auto from kle tech to railway station"
 * "cab to chennamma circle from railway station"
 */

export const BELAGAVI_LANDMARKS = [
  {
    id: 'kle',
    name: 'KLE Technological University Campus',
    area: 'Udyambag, Belagavi',
    lat: 15.8281,
    lng: 74.4925,
    keywords: ['kle', 'kle tech', 'kletech', 'bvb', 'udyambag', 'engineering college']
  },
  {
    id: 'railway_station',
    name: 'Belagavi Railway Station',
    area: 'Camp / Station Road, Belagavi',
    lat: 15.8672,
    lng: 74.5126,
    keywords: ['railway station', 'belgavi railway station', 'belgaum railway station', 'railway', 'train station', 'station', 'junction']
  },
  {
    id: 'chennamma_circle',
    name: 'Rani Chennamma Circle',
    area: 'Central Belagavi',
    lat: 15.8595,
    lng: 74.5089,
    keywords: ['chennamma', 'chennamma circle', 'rani chennamma', 'cbt', 'central circle', 'circle']
  },
  {
    id: 'bogarves',
    name: 'Bogarves Green Plaza',
    area: 'Khade Bazar, Belagavi',
    lat: 15.8542,
    lng: 74.5054,
    keywords: ['bogarves', 'khade bazar', 'bazar', 'green plaza', 'bogarves plaza']
  },
  {
    id: 'vtu',
    name: 'VTU Main Campus',
    area: 'Santi Bastawad Road, Machhe, Belagavi',
    lat: 15.7982,
    lng: 74.5381,
    keywords: ['vtu', 'vtu campus', 'visvesvaraya', 'machhe', 'santi bastawad']
  },
  {
    id: 'tilakwadi',
    name: 'Tilakwadi 3rd Gate',
    area: 'Congress Road, Belagavi',
    lat: 15.8450,
    lng: 74.5010,
    keywords: ['tilakwadi', '3rd gate', 'third gate', '1st gate', '2nd gate', 'congress road']
  },
  {
    id: 'camp',
    name: 'Camp Cantonment',
    area: 'Camp, Belagavi',
    lat: 15.8510,
    lng: 74.5150,
    keywords: ['camp', 'cantt', 'cantonment', 'military camp', 'st mary']
  },
  {
    id: 'airport',
    name: 'Sambra Airport',
    area: 'Sambra, Belagavi',
    lat: 15.8590,
    lng: 74.6180,
    keywords: ['airport', 'sambra', 'aerodrome', 'ixg', 'flight']
  },
  {
    id: 'rpd',
    name: 'RPD College Cross',
    area: 'Khanapur Road, Belagavi',
    lat: 15.8360,
    lng: 74.5050,
    keywords: ['rpd', 'rpd cross', 'rpd college', 'khanapur road']
  },
  {
    id: 'mandoli',
    name: 'Mandoli Road',
    area: 'Hindwadi, Belagavi',
    lat: 15.8390,
    lng: 74.4920,
    keywords: ['mandoli', 'mandoli road', 'hindwadi']
  }
];

export const VEHICLE_CONFIGS = {
  auto: { code: 'auto', label: 'Auto Rickshaw', baseFare: 30, perKm: 9, minFare: 45, etaMin: 2 },
  cab: { code: 'cab', label: 'Cab Sedan', baseFare: 50, perKm: 14, minFare: 80, etaMin: 4 },
  bike: { code: 'bike', label: 'Bike Taxi', baseFare: 20, perKm: 6, minFare: 30, etaMin: 2 },
  comfort: { code: 'comfort', label: 'Comfort Sedan', baseFare: 65, perKm: 16, minFare: 100, etaMin: 3 },
  xl: { code: 'xl', label: 'SUV / XL', baseFare: 75, perKm: 19, minFare: 130, etaMin: 5 }
};

/**
 * Match a raw text phrase to the best Belagavi landmark
 */
export function matchLandmark(phrase) {
  if (!phrase || typeof phrase !== 'string') return null;
  const clean = phrase.toLowerCase().trim();

  // 1. Exact or keyword match (longest keyword first to prevent "station" shadowing "railway station")
  const allMatches = [];
  for (const landmark of BELAGAVI_LANDMARKS) {
    for (const kw of landmark.keywords) {
      if (clean.includes(kw)) {
        allMatches.push({ landmark, kwLength: kw.length });
      }
    }
  }

  if (allMatches.length > 0) {
    allMatches.sort((a, b) => b.kwLength - a.kwLength);
    return allMatches[0].landmark;
  }

  // 2. Fallback: custom location object with capitalized name
  const formattedName = phrase
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

  return {
    id: `custom_${Date.now()}`,
    name: `${formattedName}, Belagavi`,
    area: 'Belagavi Urban',
    lat: 15.8495 + (Math.random() - 0.5) * 0.02,
    lng: 74.5050 + (Math.random() - 0.5) * 0.02
  };
}

/**
 * Detect vehicle type from text
 */
export function detectVehicleType(text) {
  const clean = (text || '').toLowerCase();
  if (clean.includes('auto') || clean.includes('rickshaw') || clean.includes('three wheeler') || clean.includes('tuk')) {
    return 'auto';
  }
  if (clean.includes('bike') || clean.includes('motorcycle') || clean.includes('scooter') || clean.includes('moto') || clean.includes('two wheeler')) {
    return 'bike';
  }
  if (clean.includes('xl') || clean.includes('suv') || clean.includes('ertiga') || clean.includes('innova') || clean.includes('7 seater') || clean.includes('large cab')) {
    return 'xl';
  }
  if (clean.includes('comfort') || clean.includes('luxury') || clean.includes('ac cab') || clean.includes('premium')) {
    return 'comfort';
  }
  if (clean.includes('cab') || clean.includes('car') || clean.includes('taxi') || clean.includes('sedan')) {
    return 'cab';
  }
  return 'auto'; // Default Belagavi choice
}

/**
 * Main parser: extracts pickup, drop, and vehicle type accurately from spoken input
 */
export function parseBookingIntent(inputPrompt, defaultPickup = null) {
  if (!inputPrompt || typeof inputPrompt !== 'string') return null;

  const raw = inputPrompt.trim();
  const lower = raw.toLowerCase();

  // Strip noise words e.g. "please", "can you", "i want to", "hey sawari", "book a ride"
  const clean = lower
    .replace(/^(hey\s+sawari|sawari|alexa|siri|google|please|can\s+you|kindly|i\s+want\s+to|i\s+need\s+to|book\s+a\s+ride|book\s+me\s+a\s+ride|book\s+a|book)\s+/gi, '')
    .trim();

  const vehicleCode = detectVehicleType(raw);
  const vehicle = VEHICLE_CONFIGS[vehicleCode] || VEHICLE_CONFIGS.auto;

  let pickupResult = null;
  let dropResult = null;

  // Pattern 1: "from <X> to <Y>"
  const fromToMatch = clean.match(/(?:from|pickup\s+at|pick\s+up\s+from|starting\s+at)\s+(.+?)\s+(?:to|drop\s+at|destination|heading\s+to)\s+(.+)/i);
  if (fromToMatch) {
    pickupResult = matchLandmark(fromToMatch[1]);
    dropResult = matchLandmark(fromToMatch[2]);
  }

  // Pattern 2: "to <Y> from <X>"
  if (!pickupResult || !dropResult) {
    const toFromMatch = clean.match(/(?:to|drop\s+at|heading\s+to)\s+(.+?)\s+(?:from|pickup\s+at|pick\s+up\s+from|starting\s+at)\s+(.+)/i);
    if (toFromMatch) {
      dropResult = matchLandmark(toFromMatch[1]);
      pickupResult = matchLandmark(toFromMatch[2]);
    }
  }

  // Pattern 3: "<X> to <Y>" (e.g. "kle to belgavi railway station")
  if (!pickupResult || !dropResult) {
    const directMatch = clean.match(/(.+?)\s+(?:to|->|--)\s+(.+)/i);
    if (directMatch) {
      // Remove any leading vehicle names e.g. "auto kle" -> "kle"
      const pCandidate = directMatch[1].replace(/^(auto|cab|bike|car|taxi)\s+/i, '').trim();
      const dCandidate = directMatch[2].trim();
      pickupResult = matchLandmark(pCandidate);
      dropResult = matchLandmark(dCandidate);
    }
  }

  // Pattern 4: Multiple landmarks found in text ordered by appearance
  if (!pickupResult || !dropResult) {
    const found = [];
    for (const lm of BELAGAVI_LANDMARKS) {
      for (const kw of lm.keywords) {
        const idx = lower.indexOf(kw);
        if (idx !== -1) {
          found.push({ landmark: lm, index: idx, kwLen: kw.length });
        }
      }
    }

    // Sort by position in string
    found.sort((a, b) => a.index - b.index);

    // Filter duplicates of same landmark
    const unique = [];
    const seen = new Set();
    for (const item of found) {
      if (!seen.has(item.landmark.id)) {
        seen.add(item.landmark.id);
        unique.push(item);
      }
    }

    if (unique.length >= 2) {
      pickupResult = unique[0].landmark;
      dropResult = unique[1].landmark;
    } else if (unique.length === 1) {
      dropResult = unique[0].landmark;
      pickupResult = defaultPickup || BELAGAVI_LANDMARKS[0]; // Default pickup: KLE Tech Campus
    }
  }

  // If still no drop found, check if entire phrase matches a single landmark
  if (!dropResult) {
    dropResult = matchLandmark(clean);
    pickupResult = defaultPickup || BELAGAVI_LANDMARKS[0];
  }

  // Ensure pickup and drop are distinct
  if (pickupResult && dropResult && pickupResult.id === dropResult.id) {
    // If user said something like "from KLE", set drop to Chennamma Circle
    dropResult = BELAGAVI_LANDMARKS[1];
  }

  if (!pickupResult) {
    pickupResult = defaultPickup || BELAGAVI_LANDMARKS[0];
  }

  // Approximate distance (Haversine formula in km)
  const dLat = (dropResult.lat - pickupResult.lat) * (Math.PI / 180);
  const dLng = (dropResult.lng - pickupResult.lng) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(pickupResult.lat * (Math.PI / 180)) *
      Math.cos(dropResult.lat * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const rawDist = 6371 * c;
  // Road network factor (~1.25x straight-line distance)
  const distanceKm = Math.max(1.2, Number((rawDist * 1.28).toFixed(1)));
  const durationMin = Math.max(3, Math.round(distanceKm * 2.2));

  // Compute upfront fare
  const fare = Math.max(vehicle.minFare, Math.round(vehicle.baseFare + distanceKm * vehicle.perKm));

  return {
    pickup: pickupResult.name,
    drop: dropResult.name,
    pickupCoords: {
      lat: pickupResult.lat,
      lng: pickupResult.lng,
      name: pickupResult.name,
      area: pickupResult.area
    },
    dropCoords: {
      lat: dropResult.lat,
      lng: dropResult.lng,
      name: dropResult.name,
      area: dropResult.area
    },
    vehicleCode,
    vehicleLabel: vehicle.label,
    fare,
    distanceKm,
    durationMin,
    reply: `I've planned your ride from ${pickupResult.name} to ${dropResult.name}. Total distance is ${distanceKm} km (~${durationMin} mins). The estimated fare for ${vehicle.label} is ₹${fare}. Would you like to confirm?`
  };
}

export default {
  BELAGAVI_LANDMARKS,
  VEHICLE_CONFIGS,
  matchLandmark,
  detectVehicleType,
  parseBookingIntent
};
