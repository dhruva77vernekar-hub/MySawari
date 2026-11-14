/**
 * realtimeService.js
 * Supabase Realtime & GPS Movement Manager for MySawari.
 * Listens for live captain coordinates and ride updates, with realistic
 * demo simulation along route waypoints when running locally.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabase = null;
if (SUPABASE_URL && !SUPABASE_URL.includes('placeholder') && SUPABASE_ANON_KEY) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (err) {
    console.warn('Supabase client initialization skipped:', err.message);
  }
}

export const realtimeService = {
  /**
   * Subscribe to live location and status updates for a specific ride
   * @param {string} rideId - The active ride ID
   * @param {Array<[number, number]>} routeCoordinates - Optional route polyline for dead-reckoning simulation
   * @param {Function} onLocationUpdate - Callback({ lat, lng, heading, speed })
   * @param {Function} onStatusUpdate - Callback(statusString)
   * @returns {Object} { unsubscribe: Function }
   */
  subscribeToRide(rideId, routeCoordinates = [], onLocationUpdate, onStatusUpdate) {
    let channel = null;
    let simInterval = null;

    // 1. If live Supabase connection is active, subscribe to Realtime channel
    if (supabase) {
      channel = supabase
        .channel(`ride-live-${rideId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'rides',
            filter: `id=eq.${rideId}`
          },
          (payload) => {
            if (payload.new?.status && onStatusUpdate) {
              onStatusUpdate(payload.new.status);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'captain_locations',
            filter: `ride_id=eq.${rideId}`
          },
          (payload) => {
            if (payload.new && onLocationUpdate) {
              onLocationUpdate({
                lat: payload.new.latitude,
                lng: payload.new.longitude,
                heading: payload.new.heading || 0,
                speed: payload.new.speed || 30
              });
            }
          }
        )
        .subscribe();
    }

    // 2. Realistic Simulated GPS Movement along route waypoints for demo & offline testing
    if (routeCoordinates && routeCoordinates.length > 1) {
      let currentIndex = 0;
      const totalPoints = routeCoordinates.length;

      // Start captain slightly before the first waypoint or at start
      const firstCoord = routeCoordinates[0];
      if (onLocationUpdate) {
        onLocationUpdate({
          lng: firstCoord[0],
          lat: firstCoord[1],
          heading: 45
        });
      }

      simInterval = setInterval(() => {
        currentIndex = (currentIndex + 1) % totalPoints;
        const currentCoord = routeCoordinates[currentIndex];
        const nextCoord = routeCoordinates[(currentIndex + 1) % totalPoints];

        // Calculate heading bearing
        const dLng = nextCoord[0] - currentCoord[0];
        const dLat = nextCoord[1] - currentCoord[1];
        const heading = (Math.atan2(dLng, dLat) * 180) / Math.PI;

        if (onLocationUpdate) {
          onLocationUpdate({
            lng: currentCoord[0],
            lat: currentCoord[1],
            heading: Math.round(heading),
            speed: 28 + Math.round(Math.random() * 8)
          });
        }
      }, 2400);
    }

    return {
      unsubscribe() {
        if (simInterval) {
          clearInterval(simInterval);
          simInterval = null;
        }
        if (channel && supabase) {
          supabase.removeChannel(channel);
          channel = null;
        }
      }
    };
  }
};

export default realtimeService;
