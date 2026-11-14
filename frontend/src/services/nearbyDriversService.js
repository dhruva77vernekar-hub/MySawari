/**
 * nearbyDriversService.js
 * Generates and manages dynamic live fleets of nearby drivers
 * (Auto Rickshaws, Cabs/Sedans, and Bikes) around any pickup coordinates.
 */

const DRIVER_NAMES = [
  'Ramesh K.', 'Suresh M.', 'Manjunath S.', 'Anand B.', 
  'Praveen P.', 'Santosh G.', 'Vijay D.', 'Kiran N.', 
  'Basavaraj H.', 'Sachin T.', 'Mahesh R.', 'Deepak J.',
  'Chetan V.', 'Ganesh M.', 'Raju B.'
];

const VEHICLE_TYPES = [
  { type: 'auto', label: 'Auto Rickshaw', code: 'auto', speed: 0.00015 },
  { type: 'cab', label: 'Cab Sedan', code: 'cab', speed: 0.00022 },
  { type: 'moto', label: 'Moto Bike', code: 'moto', speed: 0.00028 }
];

/**
 * Generate a realistic initial fleet of nearby drivers around a coordinate
 */
export function generateNearbyFleet(centerLat, centerLng, count = 14) {
  const drivers = [];
  
  // Deterministic yet varied distribution around roads
  for (let i = 0; i < count; i++) {
    const vType = VEHICLE_TYPES[i % VEHICLE_TYPES.length];
    
    // Distribute in radial angles (in radians) with road-like offsets
    const angle = (i * (360 / count) + (i * 17) % 35) * (Math.PI / 180);
    // Distance between 250m and 1100m (~0.0025 to 0.0095 degrees)
    const distance = 0.0025 + ((i * 7) % 11) * 0.0007;
    
    const lat = centerLat + Math.cos(angle) * distance;
    const lng = centerLng + Math.sin(angle) * distance * 1.05; // longitudinal adjustment
    
    // Heading aligned somewhat tangentially or towards radial corridors
    const heading = Math.round((angle * (180 / Math.PI) + 90 + ((i % 2 === 0) ? 0 : 180) + (i * 13) % 40) % 360);
    
    const distanceKm = Math.max(0.3, Number((distance * 111).toFixed(1)));
    const etaMin = Math.max(1, Math.round(distanceKm * (vType.type === 'moto' ? 1.5 : vType.type === 'auto' ? 2 : 2.5)));

    drivers.push({
      id: `driver_${vType.type}_${i + 1}`,
      type: vType.type,
      label: vType.label,
      name: DRIVER_NAMES[i % DRIVER_NAMES.length],
      rating: (4.7 + ((i * 3) % 4) * 0.1).toFixed(1),
      plate: `KA-22-${String.fromCharCode(65 + (i % 26))}${String.fromCharCode(65 + ((i * 3) % 26))}-${1000 + ((i * 473) % 8999)}`,
      lat,
      lng,
      heading,
      speed: vType.speed,
      etaMin,
      distanceKm,
      isAvailable: true
    });
  }

  return drivers;
}

/**
 * Step nearby drivers forward by a subtle distance along their headings
 * to simulate realistic live cruising and waiting behavior.
 */
export function stepDriversPosition(drivers, centerLat, centerLng, maxRadius = 0.015) {
  return drivers.map((driver) => {
    // Slight random heading wobble (-8 to +8 degrees)
    const wobble = (Math.random() - 0.5) * 12;
    let newHeading = (driver.heading + wobble + 360) % 360;
    
    const rad = (newHeading * Math.PI) / 180;
    // Micro step in lat/lng
    const stepSize = driver.speed * (0.4 + Math.random() * 0.5);
    let newLat = driver.lat + Math.cos(rad) * stepSize;
    let newLng = driver.lng + Math.sin(rad) * stepSize;

    // Check if drifted too far from center pickup point
    const distFromCenter = Math.hypot(newLat - centerLat, newLng - centerLng);
    if (distFromCenter > maxRadius) {
      // Turn around back toward center
      const angleToCenter = Math.atan2(centerLng - newLng, centerLat - newLat) * (180 / Math.PI);
      newHeading = (angleToCenter + 360) % 360;
      newLat = driver.lat + Math.cos((newHeading * Math.PI) / 180) * stepSize;
      newLng = driver.lng + Math.sin((newHeading * Math.PI) / 180) * stepSize;
    }

    return {
      ...driver,
      lat: newLat,
      lng: newLng,
      heading: Math.round(newHeading)
    };
  });
}

export default {
  generateNearbyFleet,
  stepDriversPosition
};
