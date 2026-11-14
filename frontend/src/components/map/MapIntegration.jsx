import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, MapPin, Locate, AlertCircle, RefreshCw, Layers, ShieldAlert, AlertTriangle, Flame } from 'lucide-react';
import routingService from '../../services/routingService';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';
const DEFAULT_BELAGAVI = { lng: 74.5089, lat: 15.8595, zoom: 13.5 };

export default function MapIntegration({
  pickupLocation = null,
  dropLocation = null,
  routeCoordinates = null,
  allRoutes = null, // { fastest, shortest, alternate }
  activeRouteType = 'fastest',
  incidents = [], // crowdsourced road incidents
  onSelectRouteType = null,
  captainLocation = null,
  interactiveSelection = null, // 'pickup' | 'drop' | null
  onLocationSelect = null,
  onPickupChange = null,
  onDropChange = null,
  className = '',
  height = '420px',
  showControls = true
}) {
  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [selectionMode, setSelectionMode] = useState(interactiveSelection);

  // Leaflet Layer / Marker References
  const layersRef = useRef({
    primaryRouteCasing: null,
    primaryRoute: null,
    shortestRoute: null,
    alternateRoute: null,
    pickupMarker: null,
    dropMarker: null,
    userMarker: null,
    captainMarker: null,
    incidentMarkers: []
  });

  // Sync external selection mode prop
  useEffect(() => {
    setSelectionMode(interactiveSelection);
  }, [interactiveSelection]);

  // 1. Initialize Leaflet / OpenStreetMap Instance (100% token-free & reliable)
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (leafletMapRef.current) return; // Prevent double init

    const initialLat = pickupLocation?.lat || DEFAULT_BELAGAVI.lat;
    const initialLng = pickupLocation?.lng || DEFAULT_BELAGAVI.lng;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 13,
      zoomControl: false,
      attributionControl: false
    });

    if (showControls) {
      L.control.zoom({ position: 'topright' }).addTo(map);
    }

    // High performance, free OpenStreetMap raster tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      subdomains: ['a', 'b', 'c']
    }).addTo(map);

    leafletMapRef.current = map;
    setMapLoaded(true);

    // Initial Geolocation
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        },
        () => {},
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }

    // Resize observer
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      leafletMapRef.current = null;
    };
  }, []);

  // 2. Handle Map Clicks for Interactive Pickup / Drop Selection
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map || !mapLoaded) return;

    const handleClick = async (e) => {
      if (!selectionMode) return;
      const { lat, lng } = e.latlng;

      const address = await routingService.reverseGeocode(lat, lng);
      const selected = {
        type: selectionMode,
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6)),
        name: address
      };

      if (selectionMode === 'pickup' && onPickupChange) {
        onPickupChange(selected);
      } else if (selectionMode === 'drop' && onDropChange) {
        onDropChange(selected);
      }

      if (onLocationSelect) {
        onLocationSelect(selected);
      }
    };

    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [mapLoaded, selectionMode, onPickupChange, onDropChange, onLocationSelect]);

  // 3. Render Route Polylines (Fastest, Shortest, Hazard-Free)
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map || !mapLoaded) return;

    const layers = layersRef.current;

    // Helper to clear existing polylines
    if (layers.primaryRouteCasing) map.removeLayer(layers.primaryRouteCasing);
    if (layers.primaryRoute) map.removeLayer(layers.primaryRoute);
    if (layers.shortestRoute) map.removeLayer(layers.shortestRoute);
    if (layers.alternateRoute) map.removeLayer(layers.alternateRoute);

    // Draw Shortest Route (Emerald dashed)
    if (allRoutes?.shortest?.geometry?.coordinates?.length) {
      const coords = allRoutes.shortest.geometry.coordinates.map((c) => [c[1], c[0]]);
      layers.shortestRoute = L.polyline(coords, {
        color: '#10B981',
        weight: 4,
        opacity: 0.65,
        dashArray: '6, 6'
      }).addTo(map);
      layers.shortestRoute.on('click', () => onSelectRouteType?.('shortest'));
    }

    // Draw Hazard-Free Route (Amber dashed)
    if (allRoutes?.alternate?.geometry?.coordinates?.length) {
      const coords = allRoutes.alternate.geometry.coordinates.map((c) => [c[1], c[0]]);
      layers.alternateRoute = L.polyline(coords, {
        color: '#F59E0B',
        weight: 4,
        opacity: 0.7,
        dashArray: '6, 6'
      }).addTo(map);
      layers.alternateRoute.on('click', () => onSelectRouteType?.('alternate'));
    }

    // Draw Primary Active Route (Indigo with dark border)
    if (routeCoordinates && routeCoordinates.length > 0) {
      const latLngs = routeCoordinates.map((c) => [c[1], c[0]]);

      layers.primaryRouteCasing = L.polyline(latLngs, {
        color: '#0A0A14',
        weight: 8,
        opacity: 0.85,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);

      layers.primaryRoute = L.polyline(latLngs, {
        color: '#3A4DFF',
        weight: 5,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);

      // Fit map bounds to show complete route
      const bounds = L.latLngBounds(latLngs);
      map.fitBounds(bounds, { padding: [45, 45], maxZoom: 15 });
    }
  }, [mapLoaded, routeCoordinates, allRoutes, onSelectRouteType]);

  // 4. Pickup Marker (Draggable)
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map || !mapLoaded) return;

    const layers = layersRef.current;

    if (pickupLocation?.lat && pickupLocation?.lng) {
      const pickupIcon = L.divIcon({
        className: 'mysawari-pickup-icon',
        html: `
          <div style="display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 4px 10px rgba(16, 185, 129, 0.45)); transform: translate(-50%, -100%);">
            <div style="background: #10B981; color: #FFFFFF; font-weight: 800; font-size: 11px; padding: 4px 8px; border-radius: 20px; border: 2px solid #FFFFFF; display: flex; align-items: center; gap: 4px; box-shadow: 0 3px 10px rgba(0,0,0,0.25); white-space: nowrap;">
              <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #FFFFFF;"></span>
              PICKUP
            </div>
            <div style="width: 2px; height: 8px; background: #10B981;"></div>
          </div>
        `,
        iconSize: [0, 0]
      });

      if (!layers.pickupMarker) {
        layers.pickupMarker = L.marker([pickupLocation.lat, pickupLocation.lng], {
          icon: pickupIcon,
          draggable: true
        }).addTo(map);

        layers.pickupMarker.on('dragend', async () => {
          const { lat, lng } = layers.pickupMarker.getLatLng();
          const address = await routingService.reverseGeocode(lat, lng);
          if (onPickupChange) {
            onPickupChange({
              lat: Number(lat.toFixed(6)),
              lng: Number(lng.toFixed(6)),
              name: address
            });
          }
        });
      } else {
        layers.pickupMarker.setLatLng([pickupLocation.lat, pickupLocation.lng]);
      }
    } else if (layers.pickupMarker) {
      map.removeLayer(layers.pickupMarker);
      layers.pickupMarker = null;
    }
  }, [mapLoaded, pickupLocation, onPickupChange]);

  // 5. Drop Marker (Draggable)
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map || !mapLoaded) return;

    const layers = layersRef.current;

    if (dropLocation?.lat && dropLocation?.lng) {
      const dropIcon = L.divIcon({
        className: 'mysawari-drop-icon',
        html: `
          <div style="display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 4px 10px rgba(239, 43, 62, 0.45)); transform: translate(-50%, -100%);">
            <div style="background: #EF2B3E; color: #FFFFFF; font-weight: 800; font-size: 11px; padding: 4px 8px; border-radius: 20px; border: 2px solid #FFFFFF; display: flex; align-items: center; gap: 4px; box-shadow: 0 3px 10px rgba(0,0,0,0.25); white-space: nowrap;">
              <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #FFFFFF;"></span>
              DROP
            </div>
            <div style="width: 2px; height: 8px; background: #EF2B3E;"></div>
          </div>
        `,
        iconSize: [0, 0]
      });

      if (!layers.dropMarker) {
        layers.dropMarker = L.marker([dropLocation.lat, dropLocation.lng], {
          icon: dropIcon,
          draggable: true
        }).addTo(map);

        layers.dropMarker.on('dragend', async () => {
          const { lat, lng } = layers.dropMarker.getLatLng();
          const address = await routingService.reverseGeocode(lat, lng);
          if (onDropChange) {
            onDropChange({
              lat: Number(lat.toFixed(6)),
              lng: Number(lng.toFixed(6)),
              name: address
            });
          }
        });
      } else {
        layers.dropMarker.setLatLng([dropLocation.lat, dropLocation.lng]);
      }
    } else if (layers.dropMarker) {
      map.removeLayer(layers.dropMarker);
      layers.dropMarker = null;
    }
  }, [mapLoaded, dropLocation, onDropChange]);

  // 6. Crowdsourced Hazard Incident Markers
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map || !mapLoaded) return;

    const layers = layersRef.current;
    layers.incidentMarkers.forEach((m) => map.removeLayer(m));
    layers.incidentMarkers = [];

    if (incidents && incidents.length > 0) {
      incidents.forEach((inc) => {
        if (!inc.latitude || !inc.longitude) return;

        const isVerified = inc.status === 'VERIFIED';
        const hazardIcon = L.divIcon({
          className: 'mysawari-hazard-icon',
          html: `
            <div style="display: flex; align-items: center; gap: 3px; background: ${isVerified ? '#FEF2F2' : '#FFFBEB'}; color: ${isVerified ? '#991B1B' : '#92400E'}; border: 1.5px solid ${isVerified ? '#EF4444' : '#F59E0B'}; border-radius: 12px; padding: 2px 6px; font-size: 9px; font-weight: 800; box-shadow: 0 2px 6px rgba(0,0,0,0.15); transform: translate(-50%, -50%); white-space: nowrap;">
              <span>${isVerified ? '⛔' : '⚠️'}</span>
              <span>${inc.type ? inc.type.toUpperCase() : 'ALERT'}</span>
            </div>
          `,
          iconSize: [0, 0]
        });

        const marker = L.marker([inc.latitude, inc.longitude], { icon: hazardIcon })
          .bindPopup(`<b>${inc.category || 'Road Hazard'}</b><br>${inc.description || inc.location}`)
          .addTo(map);

        layers.incidentMarkers.push(marker);
      });
    }
  }, [mapLoaded, incidents]);

  // 7. Recenter Map
  const handleRecenter = () => {
    const map = leafletMapRef.current;
    if (!map) return;

    if (pickupLocation?.lat && pickupLocation?.lng) {
      map.setView([pickupLocation.lat, pickupLocation.lng], 14, { animate: true });
    } else if (userLocation) {
      map.setView([userLocation.lat, userLocation.lng], 14, { animate: true });
    } else {
      map.setView([DEFAULT_BELAGAVI.lat, DEFAULT_BELAGAVI.lng], 13.5, { animate: true });
    }
  };

  return (
    <div
      className={`relative w-full rounded-[28px] overflow-hidden border border-[#DCDAF0] shadow-sm bg-[#E9ECF2] ${className}`}
      style={{ height }}
    >
      {/* Map Leaflet Container */}
      <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: height }} />

      {/* Floating Status & Multi-Route Switcher Bar */}
      <div className="absolute top-3 left-3 right-3 z-[400] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <span className="hud px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-[#DCDAF0] text-[#0A0A14] font-bold shadow-sm flex items-center gap-1.5 text-[10px]">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <span>BELAGAVI LIVE ROUTING · OPENSTREETMAP</span>
          </span>

          {incidents && incidents.length > 0 && (
            <span className="hud px-2.5 py-1.5 rounded-full bg-amber-50 border border-amber-300 text-amber-900 font-bold text-[9px] shadow-sm flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-600" />
              <span>{incidents.filter((i) => i.status === 'VERIFIED').length} ROAD HAZARDS</span>
            </span>
          )}
        </div>

        {/* Live Multi-Route Switcher Tabs on Map */}
        {allRoutes && onSelectRouteType && (
          <div className="flex items-center gap-1 bg-white/95 backdrop-blur-md p-1 rounded-2xl border border-[#DCDAF0] shadow-md pointer-events-auto">
            <button
              type="button"
              onClick={() => onSelectRouteType('fastest')}
              className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeRouteType === 'fastest'
                  ? 'bg-[#3A4DFF] text-white shadow-xs'
                  : 'text-[#5B5B73] hover:text-[#0A0A14]'
              }`}
            >
              <span>⚡ Fastest</span>
              <span className="font-mono text-[9px] opacity-80">{allRoutes.fastest?.durationMin || 12}m</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectRouteType('shortest')}
              className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeRouteType === 'shortest'
                  ? 'bg-[#10B981] text-white shadow-xs'
                  : 'text-[#5B5B73] hover:text-[#0A0A14]'
              }`}
            >
              <span>🌿 Shortest</span>
              <span className="font-mono text-[9px] opacity-80">{allRoutes.shortest?.distanceKm || 4.3}k</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectRouteType('alternate')}
              className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeRouteType === 'alternate'
                  ? 'bg-[#F59E0B] text-[#0A0A14] shadow-xs font-extrabold'
                  : 'text-[#5B5B73] hover:text-[#0A0A14]'
              }`}
            >
              <span>🛡️ Hazard-Free</span>
              <span className="font-mono text-[9px] opacity-80">{allRoutes.alternate?.durationMin || 13}m</span>
            </button>
          </div>
        )}
      </div>

      {selectionMode && (
        <div className="absolute top-12 left-3 z-[400]">
          <span className="hud px-3 py-1.5 rounded-full bg-[#3A4DFF] text-white font-bold text-[10px] shadow-sm animate-bounce">
            CLICK MAP TO SET {selectionMode.toUpperCase()}
          </span>
        </div>
      )}

      {/* Floating Recenter in bottom corner */}
      <div className="absolute bottom-4 right-4 z-[400] flex flex-col gap-2">
        <button
          type="button"
          onClick={handleRecenter}
          title="Return to My Location"
          className="w-10 h-10 rounded-full bg-white/95 hover:bg-white text-[#0A0A14] border border-[#DCDAF0] shadow-md flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <Locate className="w-5 h-5 text-[#3A4DFF]" />
        </button>
      </div>
    </div>
  );
}
