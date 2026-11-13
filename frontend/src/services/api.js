/**
 * MySawari API Client
 * Connects frontend directly to the Express backend (v3.0) on port 4000.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('mysawari_token') || 'demo-rider-token';
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = json?.error?.message || `HTTP ${response.status}: Request failed`;
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = json;
    throw err;
  }

  return json?.data ?? json;
}

export const api = {
  // Backend Health
  async checkHealth() {
    try {
      return await request('/api/health');
    } catch (e) {
      console.warn('Backend health check failed, using fallback:', e.message);
      return { status: 'offline', error: e.message };
    }
  },

  // Vehicle catalog
  async getVehicleTypes() {
    try {
      const data = await request('/api/vehicle-types');
      return data?.items || [];
    } catch (e) {
      console.warn('Failed to load vehicle types from API, using defaults:', e.message);
      return [];
    }
  },

  // Live fare estimate
  async getFareEstimate(vehicleType, distanceMeters = 3000, zoneMultiplier = 1) {
    try {
      return await request('/api/fares/estimate', {
        method: 'POST',
        body: JSON.stringify({
          vehicleType,
          distanceMeters,
          zoneMultiplier
        })
      });
    } catch (e) {
      console.warn('Failed to get fare estimate from API, falling back to client formula:', e.message);
      return null;
    }
  },

  // Geocoding & Place Search
  async searchLocations(query) {
    try {
      if (!query || query.length < 3) return [];
      return await request(`/api/locations/search?q=${encodeURIComponent(query)}`);
    } catch (e) {
      console.warn('Geocoding search failed, using local list:', e.message);
      return [];
    }
  },

  // Route distance and duration estimation
  async estimateRoute(origin, destination) {
    try {
      return await request('/api/routing/estimate', {
        method: 'POST',
        body: JSON.stringify({ origin, destination })
      });
    } catch (e) {
      console.warn('Route estimation failed:', e.message);
      return null;
    }
  },

  // Ride Booking
  async createRide(rideData) {
    return await request('/api/rides', {
      method: 'POST',
      body: JSON.stringify(rideData)
    });
  },

  // Ride Details
  async getRide(rideId) {
    return await request(`/api/rides/${rideId}`);
  },

  // Cancel Ride
  async cancelRide(rideId, reason = 'rider_cancelled') {
    return await request(`/api/rides/${rideId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  },

  // Safety & SOS
  async triggerSos(rideId, location, note = 'Emergency SOS triggered by rider') {
    return await request('/api/safety/sos', {
      method: 'POST',
      body: JSON.stringify({
        ride_id: rideId,
        location,
        note
      })
    });
  },

  // Share ride trip
  async createShareLink(rideId) {
    return await request('/api/trips/share', {
      method: 'POST',
      body: JSON.stringify({
        ride_id: rideId,
        expires_minutes: 180
      })
    });
  },

  // Nearby captains
  async getNearbyCaptains(latitude, longitude, radiusMeters = 5000) {
    try {
      return await request(`/api/captains/nearby?latitude=${latitude}&longitude=${longitude}&radiusMeters=${radiusMeters}`);
    } catch (e) {
      console.warn('Failed to load nearby captains:', e.message);
      return [];
    }
  }
};

export default api;
