/**
 * incidentService.js
 * Unified Road Incident & Hazard Service for MySawari.
 * Handles crowdsourced reporting, map visualization, hazard detection,
 * and admin verification across Belagavi.
 */

const API_BASE = 'http://localhost:4000/api';

const DEFAULT_INCIDENTS = [
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

class IncidentService {
  constructor() {
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(incidents) {
    this.listeners.forEach((l) => l(incidents));
  }

  getLocalIncidents() {
    try {
      const stored = localStorage.getItem('mysawari_incidents');
      if (stored) return JSON.parse(stored);
    } catch (_) {}
    return DEFAULT_INCIDENTS;
  }

  saveLocalIncidents(incidents) {
    try {
      localStorage.setItem('mysawari_incidents', JSON.stringify(incidents));
    } catch (_) {}
  }

  async getIncidents() {
    try {
      const res = await fetch(`${API_BASE}/incidents`);
      if (res.ok) {
        const json = await res.json();
        const data = json.data || json;
        if (Array.isArray(data) && data.length > 0) {
          this.saveLocalIncidents(data);
          this.notify(data);
          return data;
        }
      }
    } catch (err) {
      console.warn('Failed to fetch incidents from backend, using local cache:', err);
    }
    const local = this.getLocalIncidents();
    this.notify(local);
    return local;
  }

  async reportIncident(reportData) {
    const payload = {
      category: reportData.category || 'Road Hazard',
      type: reportData.type || 'traffic',
      location: reportData.location || 'Belagavi Central',
      latitude: reportData.latitude || (15.855 + (Math.random() - 0.5) * 0.015),
      longitude: reportData.longitude || (74.505 + (Math.random() - 0.5) * 0.015),
      severity: reportData.severity || 'MEDIUM',
      description: reportData.description || 'Reported road disruption',
      reportedBy: reportData.reportedBy || 'You (Rider)'
    };

    try {
      const token = localStorage.getItem('mysawari_token') || 'demo-rider-token';
      const res = await fetch(`${API_BASE}/incidents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const json = await res.json();
        const created = json.data || json;
        const current = this.getLocalIncidents();
        const updated = [created, ...current.filter((i) => i.id !== created.id)];
        this.saveLocalIncidents(updated);
        this.notify(updated);
        return created;
      }
    } catch (err) {
      console.warn('Backend report incident failed, storing locally:', err);
    }

    const localCreated = {
      id: `INC-${Date.now().toString().slice(-4)}`,
      ...payload,
      status: 'PENDING_REVIEW',
      reportedAt: new Date().toISOString(),
      votes: 1
    };
    const current = this.getLocalIncidents();
    const updated = [localCreated, ...current];
    this.saveLocalIncidents(updated);
    this.notify(updated);
    return localCreated;
  }

  async updateIncidentStatus(id, status) {
    try {
      const token = localStorage.getItem('mysawari_token') || 'demo-admin-token';
      const res = await fetch(`${API_BASE}/incidents/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        const json = await res.json();
        const updatedInc = json.data || json;
        const current = this.getLocalIncidents();
        const updated = current.map((i) => (i.id === id ? { ...i, status: updatedInc.status } : i));
        this.saveLocalIncidents(updated);
        this.notify(updated);
        return updatedInc;
      }
    } catch (err) {
      console.warn('Backend incident status update failed, saving locally:', err);
    }

    const current = this.getLocalIncidents();
    const updated = current.map((i) => (i.id === id ? { ...i, status } : i));
    this.saveLocalIncidents(updated);
    this.notify(updated);
    return updated.find((i) => i.id === id);
  }

  /**
   * Detect whether any coordinates along a route pass close to active incidents.
   * Distance threshold in kilometers (~0.35 km / 350 meters).
   */
  detectRouteHazards(routeCoords, incidents, thresholdKm = 0.45) {
    if (!routeCoords || routeCoords.length === 0 || !incidents || incidents.length === 0) {
      return [];
    }

    const activeIncidents = incidents.filter(
      (inc) => inc.status === 'VERIFIED' || inc.status === 'PENDING_REVIEW'
    );

    const detectedHazards = [];

    for (const inc of activeIncidents) {
      if (!inc.latitude || !inc.longitude) continue;
      
      let isNear = false;
      for (const coord of routeCoords) {
        const [cLng, cLat] = coord;
        const dist = Math.hypot(cLat - inc.latitude, cLng - inc.longitude) * 111; // ~111km per deg
        if (dist <= thresholdKm) {
          isNear = true;
          break;
        }
      }

      if (isNear) {
        detectedHazards.push(inc);
      }
    }

    return detectedHazards;
  }
}

export const incidentService = new IncidentService();
export default incidentService;
