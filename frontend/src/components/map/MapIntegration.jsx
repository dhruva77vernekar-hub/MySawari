import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, MapPin, Locate, AlertCircle, RefreshCw, Layers, ShieldAlert, AlertTriangle, Flame, Compass } from 'lucide-react';
import routingService from '../../services/routingService';
import { generateNearbyFleet, stepDriversPosition } from '../../services/nearbyDriversService';

const DEFAULT_BELAGAVI = { lng: 74.5089, lat: 15.8595, zoom: 14 };

/**
 * High-fidelity top-down vehicle SVG renders matching real ride-hailing maps
 */
function getAutoSvg(heading = 0, isHighlighted = false) {
  return `
    <div style="position: relative; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; transform: rotate(${heading}deg); transition: transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1); cursor: pointer;">
      ${isHighlighted ? '<div style="position: absolute; inset: -4px; border-radius: 50%; background: rgba(245, 158, 11, 0.35); border: 1.5px solid #F59E0B; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>' : ''}
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 3px 6px rgba(0,0,0,0.38));">
        <!-- Front Wheel -->
        <rect x="16.5" y="2" width="3" height="6" rx="1.5" fill="#0F172A"/>
        <!-- Front Fender -->
        <path d="M15 6L21 6L20 10L16 10Z" fill="#FBBF24"/>
        <!-- Chassis Frame -->
        <path d="M11 11C11 9.5 13 8 18 8C23 8 25 9.5 25 11L27 28C27 30 25.5 31.5 23 31.5H13C10.5 31.5 9 30 9 28L11 11Z" fill="#F59E0B" stroke="#B45309" stroke-width="0.8"/>
        <!-- Front Windshield -->
        <path d="M13.5 11.5H22.5L23.5 15H12.5L13.5 11.5Z" fill="#0F172A" opacity="0.85"/>
        <!-- Yellow Canopy Roof -->
        <rect x="11.5" y="15" width="13" height="15" rx="3" fill="#FBBF24"/>
        <rect x="12.5" y="16" width="11" height="13" rx="2" fill="#F59E0B"/>
        <!-- Star Badge on Canopy (matches screenshot) -->
        <polygon points="18,17.5 19.3,21 23,21 20,23 21.2,26.5 18,24.5 14.8,26.5 16,23 13,21 16.7,21" fill="#FFFFFF"/>
        <!-- Rear Wheels -->
        <rect x="8" y="24" width="2" height="6" rx="1" fill="#0F172A"/>
        <rect x="26" y="24" width="2" height="6" rx="1" fill="#0F172A"/>
      </svg>
    </div>
  `;
}

function getCabSvg(heading = 0, isHighlighted = false) {
  return `
    <div style="position: relative; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; transform: rotate(${heading}deg); transition: transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1); cursor: pointer;">
      ${isHighlighted ? '<div style="position: absolute; inset: -4px; border-radius: 50%; background: rgba(58, 77, 255, 0.35); border: 1.5px solid #3A4DFF; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>' : ''}
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 3px 6px rgba(0,0,0,0.38));">
        <!-- Wheels -->
        <rect x="7" y="6" width="2" height="5" rx="1" fill="#0F172A"/>
        <rect x="27" y="6" width="2" height="5" rx="1" fill="#0F172A"/>
        <rect x="7" y="25" width="2" height="5" rx="1" fill="#0F172A"/>
        <rect x="27" y="25" width="2" height="5" rx="1" fill="#0F172A"/>
        <!-- Car Body (Bright Yellow Taxi) -->
        <rect x="8.5" y="3" width="19" height="30" rx="5" fill="#FACC15" stroke="#CA8A04" stroke-width="0.8"/>
        <!-- Front Windshield -->
        <path d="M11 9H25L23.5 14H12.5L11 9Z" fill="#1E293B"/>
        <!-- Roof Strip -->
        <rect x="12" y="14" width="12" height="11" rx="1.5" fill="#EAB308"/>
        <!-- White Taxi Cab Sign Strip -->
        <rect x="14" y="17.5" width="8" height="3" rx="1" fill="#FFFFFF" stroke="#0F172A" stroke-width="0.5"/>
        <!-- Rear Windshield -->
        <path d="M12.5 25H23.5L25 28.5H11L12.5 25Z" fill="#1E293B"/>
        <!-- Headlights -->
        <circle cx="10.5" cy="4.5" r="1.2" fill="#FEF08A"/>
        <circle cx="25.5" cy="4.5" r="1.2" fill="#FEF08A"/>
        <!-- Taillights -->
        <rect x="10" y="32" width="3" height="0.8" fill="#EF4444"/>
        <rect x="23" y="32" width="3" height="0.8" fill="#EF4444"/>
      </svg>
    </div>
  `;
}

function getMotoSvg(heading = 0, isHighlighted = false) {
  return `
    <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; transform: rotate(${heading}deg); transition: transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1); cursor: pointer;">
      ${isHighlighted ? '<div style="position: absolute; inset: -3px; border-radius: 50%; background: rgba(16, 185, 129, 0.35); border: 1.5px solid #10B981; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>' : ''}
      <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 5px rgba(0,0,0,0.35));">
        <!-- Front Tire -->
        <rect x="15.5" y="2" width="3" height="6.5" rx="1.5" fill="#0F172A"/>
        <!-- Handlebars -->
        <line x1="8" y1="8.5" x2="26" y2="8.5" stroke="#0F172A" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="8" cy="8.5" r="1.4" fill="#FACC15"/>
        <circle cx="26" cy="8.5" r="1.4" fill="#FACC15"/>
        <!-- Bike Chassis Body -->
        <path d="M14 9H20L18.5 22H15.5L14 9Z" fill="#F59E0B" stroke="#B45309" stroke-width="0.8"/>
        <!-- Rider Body -->
        <ellipse cx="17" cy="16" rx="4.5" ry="3.2" fill="#2563EB"/>
        <!-- Rider Helmet with Visor -->
        <circle cx="17" cy="13" r="3.6" fill="#0F172A"/>
        <path d="M14.8 11.8C15.4 11.2 16.2 11 17 11C17.8 11 18.6 11.2 19.2 11.8" stroke="#60A5FA" stroke-width="1.2" stroke-linecap="round"/>
        <!-- Rear Tire -->
        <rect x="15.5" y="24" width="3" height="7.5" rx="1.5" fill="#0F172A"/>
      </svg>
    </div>
  `;
}

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
  showControls = true,
  showNearbyDrivers = true,
  selectedVehicleType = null,
  pickupPulse = true,
  onDriverClick = null,
  onRecenter = null
}) {
  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [selectionMode, setSelectionMode] = useState(interactiveSelection);
  const [nearbyFleet, setNearbyFleet] = useState([]);

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
    driverMarkers: new Map(), // driverId -> L.marker
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
      zoom: 14,
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

  // 2. Initialize and Seed Nearby Fleet around Pickup
  useEffect(() => {
    if (!mapLoaded) return;
    const centerLat = pickupLocation?.lat || DEFAULT_BELAGAVI.lat;
    const centerLng = pickupLocation?.lng || DEFAULT_BELAGAVI.lng;

    const fleet = generateNearbyFleet(centerLat, centerLng, 15);
    setNearbyFleet(fleet);
  }, [mapLoaded, pickupLocation?.lat, pickupLocation?.lng]);

  // 3. Smooth Micro-Roaming Driver Animation Loop
  useEffect(() => {
    if (!showNearbyDrivers || !mapLoaded || nearbyFleet.length === 0) return;

    const centerLat = pickupLocation?.lat || DEFAULT_BELAGAVI.lat;
    const centerLng = pickupLocation?.lng || DEFAULT_BELAGAVI.lng;

    const interval = setInterval(() => {
      setNearbyFleet((prevFleet) => {
        return stepDriversPosition(prevFleet, centerLat, centerLng);
      });
    }, 2400);

    return () => clearInterval(interval);
  }, [showNearbyDrivers, mapLoaded, pickupLocation?.lat, pickupLocation?.lng, nearbyFleet.length]);

  // 4. Render and Update Nearby Drivers on Leaflet Map
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map || !mapLoaded) return;

    const driverMarkers = layersRef.current.driverMarkers;

    if (!showNearbyDrivers) {
      driverMarkers.forEach((marker) => map.removeLayer(marker));
      driverMarkers.clear();
      return;
    }

    nearbyFleet.forEach((driver) => {
      const isHighlighted = selectedVehicleType ? driver.type === selectedVehicleType : false;
      
      let html = '';
      if (driver.type === 'auto') {
        html = getAutoSvg(driver.heading, isHighlighted);
      } else if (driver.type === 'cab') {
        html = getCabSvg(driver.heading, isHighlighted);
      } else {
        html = getMotoSvg(driver.heading, isHighlighted);
      }

      const icon = L.divIcon({
        className: `mysawari-driver-${driver.type}`,
        html,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      if (driverMarkers.has(driver.id)) {
        const marker = driverMarkers.get(driver.id);
        marker.setLatLng([driver.lat, driver.lng]);
        marker.setIcon(icon);
      } else {
        const marker = L.marker([driver.lat, driver.lng], { icon }).addTo(map);
        
        marker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 11px; padding: 4px; line-height: 1.4;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
              <b style="color: #0A0A14;">${driver.label}</b>
              <span style="background: #10B981; color: #fff; font-size: 9px; font-weight: bold; padding: 1px 5px; border-radius: 8px;">${driver.rating} ★</span>
            </div>
            <div style="color: #5B5B73; margin-top: 2px;">Captain: <b>${driver.name}</b></div>
            <div style="font-family: monospace; font-size: 10px; color: #3A4DFF; font-weight: bold;">${driver.plate}</div>
            <div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid #E5E7EB; color: #10B981; font-weight: bold; font-size: 10px;">
              ⚡ ~${driver.etaMin} min pickup arrival
            </div>
          </div>
        `);

        marker.on('click', () => {
          onDriverClick?.(driver);
        });

        driverMarkers.set(driver.id, marker);
      }
    });

    // Remove any markers no longer in fleet
    const activeIds = new Set(nearbyFleet.map((d) => d.id));
    driverMarkers.forEach((marker, id) => {
      if (!activeIds.has(id)) {
        map.removeLayer(marker);
        driverMarkers.delete(id);
      }
    });
  }, [mapLoaded, showNearbyDrivers, nearbyFleet, selectedVehicleType, onDriverClick]);

  // 5. Handle Map Clicks for Interactive Pickup / Drop Selection
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

  // 6. Render Route Polylines (Fastest, Shortest, Hazard-Free)
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
      map.fitBounds(bounds, { padding: [55, 55], maxZoom: 15 });
    }
  }, [mapLoaded, routeCoordinates, allRoutes, onSelectRouteType]);

  // 7. Pickup Marker with Green Radar Pulse Ring (matching user's screenshot)
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map || !mapLoaded) return;

    const layers = layersRef.current;

    if (pickupLocation?.lat && pickupLocation?.lng) {
      const pickupIcon = L.divIcon({
        className: 'mysawari-pickup-radar-icon',
        html: `
          <div style="position: relative; width: 44px; height: 54px; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; transform: translate(-50%, -100%); pointer-events: auto;">
            <!-- Radar Pulsing Circle (matching screenshot) -->
            <div style="position: absolute; top: 2px; width: 36px; height: 36px; border-radius: 50%; background: rgba(16, 185, 129, 0.28); border: 1.5px solid rgba(16, 185, 129, 0.6); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            
            <!-- Green Central Target Pin -->
            <div style="position: relative; z-index: 2; width: 22px; height: 22px; border-radius: 50%; background: #10B981; border: 3px solid #FFFFFF; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
              <div style="width: 6px; height: 6px; border-radius: 50%; background: #FFFFFF;"></div>
            </div>
            
            <!-- Dark Ground Stem -->
            <div style="width: 2px; height: 16px; background: #0A0A14; border-radius: 1px; z-index: 1;"></div>
            <div style="width: 6px; height: 2px; background: rgba(0,0,0,0.4); border-radius: 50%; filter: blur(0.5px);"></div>
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

  // 8. Drop Marker (Draggable)
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

  // 9. Crowdsourced Hazard Incident Markers
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

  // 10. Recenter Map
  const handleRecenter = () => {
    const map = leafletMapRef.current;
    if (!map) return;

    if (pickupLocation?.lat && pickupLocation?.lng) {
      map.setView([pickupLocation.lat, pickupLocation.lng], 14, { animate: true });
    } else if (userLocation) {
      map.setView([userLocation.lat, userLocation.lng], 14, { animate: true });
    } else {
      map.setView([DEFAULT_BELAGAVI.lat, DEFAULT_BELAGAVI.lng], 14, { animate: true });
    }
    onRecenter?.();
  };

  const autoCount = nearbyFleet.filter((d) => d.type === 'auto').length;
  const cabCount = nearbyFleet.filter((d) => d.type === 'cab').length;
  const motoCount = nearbyFleet.filter((d) => d.type === 'moto').length;

  return (
    <div
      className={`relative w-full rounded-[28px] overflow-hidden border border-[#DCDAF0] shadow-sm bg-[#E9ECF2] ${className}`}
      style={{ height }}
    >
      {/* Map Leaflet Container */}
      <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: height }} />

      {/* Floating Status & Multi-Route Switcher Bar */}
      <div className="absolute top-3 left-3 right-3 z-[400] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto flex-wrap">
          <span className="hud px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-[#DCDAF0] text-[#0A0A14] font-bold shadow-sm flex items-center gap-1.5 text-[10px]">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <span>BELAGAVI LIVE FLEET · {nearbyFleet.length} SAWARIS NEARBY</span>
          </span>

          <span className="hud hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-[#DCDAF0] text-[9px] font-bold text-[#5B5B73]">
            <span>🛺 {autoCount} Autos</span>
            <span>·</span>
            <span>🚗 {cabCount} Cabs</span>
            <span>·</span>
            <span>🛵 {motoCount} Bikes</span>
          </span>

          {incidents && incidents.length > 0 && (
            <span className="hud px-2.5 py-1.5 rounded-full bg-amber-50 border border-amber-300 text-amber-900 font-bold text-[9px] shadow-sm flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-600" />
              <span>{incidents.filter((i) => i.status === 'VERIFIED').length} HAZARDS</span>
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

      {/* Floating Recenter in bottom corner matching screenshot style */}
      <div className="absolute bottom-4 right-4 z-[400] flex flex-col gap-2">
        <button
          type="button"
          onClick={handleRecenter}
          title="Return to My Location"
          className="w-11 h-11 rounded-full bg-white hover:bg-[#F8F9FD] text-[#0A0A14] border border-[#DCDAF0] shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <div className="w-6 h-6 rounded-full border-2 border-[#3A4DFF] flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-[#3A4DFF]" />
          </div>
        </button>
      </div>
    </div>
  );
}
