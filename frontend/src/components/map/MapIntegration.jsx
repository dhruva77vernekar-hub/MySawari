import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
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
  const mapRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [selectionMode, setSelectionMode] = useState(interactiveSelection);

  // Markers refs
  const userMarkerRef = useRef(null);
  const pickupMarkerRef = useRef(null);
  const dropMarkerRef = useRef(null);
  const captainMarkerRef = useRef(null);
  const captainAnimRef = useRef(null);
  const prevCaptainPosRef = useRef(null);
  const incidentMarkersRef = useRef([]);

  // Sync external selection mode prop
  useEffect(() => {
    setSelectionMode(interactiveSelection);
  }, [interactiveSelection]);

  // 1. Initialize Mapbox GL instance
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!MAPBOX_TOKEN) {
      setMapError('VITE_MAPBOX_ACCESS_TOKEN is not configured.');
      return;
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const initialCenter = pickupLocation?.lng && pickupLocation?.lat
      ? [pickupLocation.lng, pickupLocation.lat]
      : [DEFAULT_BELAGAVI.lng, DEFAULT_BELAGAVI.lat];

    let map = null;
    try {
      map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: initialCenter,
        zoom: DEFAULT_BELAGAVI.zoom,
        pitch: 28,
        bearing: -5,
        attributionControl: false
      });
    } catch (err) {
      console.error('Failed to initialize Mapbox map:', err);
      setMapError(`Mapbox initialization error: ${err.message}`);
      return;
    }

    mapRef.current = map;

    // Add navigation controls (zoom, compass)
    if (showControls) {
      map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right');
    }

    map.on('load', () => {
      setMapLoaded(true);

      // 1. Alternate Route 1 Source & Layer (Shortest - Emerald dashed)
      if (!map.getSource('alt-shortest-source')) {
        map.addSource('alt-shortest-source', {
          type: 'geojson',
          data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } }
        });
        map.addLayer({
          id: 'alt-shortest-line',
          type: 'line',
          source: 'alt-shortest-source',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': '#10B981',
            'line-width': 4.5,
            'line-opacity': 0.65,
            'line-dasharray': [2, 1.5]
          }
        });
      }

      // 2. Alternate Route 2 Source & Layer (Hazard-Free Bypass - Amber dashed)
      if (!map.getSource('alt-alternate-source')) {
        map.addSource('alt-alternate-source', {
          type: 'geojson',
          data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } }
        });
        map.addLayer({
          id: 'alt-alternate-line',
          type: 'line',
          source: 'alt-alternate-source',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': '#F59E0B',
            'line-width': 4.5,
            'line-opacity': 0.7,
            'line-dasharray': [2, 1.5]
          }
        });
      }

      // 3. Primary Active Route Source & Layers
      if (!map.getSource('route-source')) {
        map.addSource('route-source', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: []
            }
          }
        });

        // Route Casing layer (dark border)
        map.addLayer({
          id: 'route-casing',
          type: 'line',
          source: 'route-source',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#0A0A14',
            'line-width': 8,
            'line-opacity': 0.8
          }
        });

        // Route Line layer
        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route-source',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#3A4DFF',
            'line-width': 5.5,
            'line-opacity': 0.95
          }
        });
      }

      // Interactive Click to Switch Route directly on map lines
      map.on('click', 'alt-shortest-line', () => onSelectRouteType?.('shortest'));
      map.on('click', 'alt-alternate-line', () => onSelectRouteType?.('alternate'));
      map.on('mouseenter', 'alt-shortest-line', () => (map.getCanvas().style.cursor = 'pointer'));
      map.on('mouseleave', 'alt-shortest-line', () => (map.getCanvas().style.cursor = ''));
      map.on('mouseenter', 'alt-alternate-line', () => (map.getCanvas().style.cursor = 'pointer'));
      map.on('mouseleave', 'alt-alternate-line', () => (map.getCanvas().style.cursor = ''));
    });

    map.on('error', (e) => {
      console.warn('Mapbox map runtime warning:', e.error?.message || e);
    });

    // Detect User Location initially
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const userCoords = {
            lng: pos.coords.longitude,
            lat: pos.coords.latitude
          };
          setUserLocation(userCoords);
        },
        (err) => {
          console.warn('Browser geolocation declined or unavailable, using Belagavi default:', err.message);
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }

    // ResizeObserver for responsive rendering
    const resizeObserver = new ResizeObserver(() => {
      if (map) {
        map.resize();
      }
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (captainAnimRef.current) cancelAnimationFrame(captainAnimRef.current);
      if (userMarkerRef.current) userMarkerRef.current.remove();
      if (pickupMarkerRef.current) pickupMarkerRef.current.remove();
      if (dropMarkerRef.current) dropMarkerRef.current.remove();
      if (captainMarkerRef.current) captainMarkerRef.current.remove();
      incidentMarkersRef.current.forEach((m) => m.remove());
      incidentMarkersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // 2. Map-Click Handler for manual location selection
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const handleMapClick = async (e) => {
      if (!selectionMode) return;
      const { lng, lat } = e.lngLat;

      const address = await routingService.reverseGeocode(lat, lng);
      const selected = {
        type: selectionMode,
        lat: +lat.toFixed(6),
        lng: +lng.toFixed(6),
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

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [mapLoaded, selectionMode, onPickupChange, onDropChange, onLocationSelect]);

  // 3. User Location Marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !userLocation) return;

    if (!userMarkerRef.current) {
      const el = document.createElement('div');
      el.className = 'mysawari-user-marker';
      el.innerHTML = `
        <div style="position: relative; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 22px; height: 22px; border-radius: 50%; background: rgba(58, 77, 255, 0.25); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 13px; height: 13px; border-radius: 50%; background: #3A4DFF; border: 2.5px solid #FFFFFF; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>
        </div>
      `;

      userMarkerRef.current = new mapboxgl.Marker({ element: el })
        .setLngLat([userLocation.lng, userLocation.lat])
        .setPopup(new mapboxgl.Popup({ offset: 12 }).setText('Your Location'))
        .addTo(map);
    } else {
      userMarkerRef.current.setLngLat([userLocation.lng, userLocation.lat]);
    }
  }, [mapLoaded, userLocation]);

  // 4. Pickup Marker (Draggable)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    if (pickupLocation && pickupLocation.lng && pickupLocation.lat) {
      if (!pickupMarkerRef.current) {
        const el = document.createElement('div');
        el.className = 'mysawari-pickup-marker cursor-pointer';
        el.innerHTML = `
          <div style="display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 4px 10px rgba(16, 185, 129, 0.45));">
            <div style="background: #10B981; color: #FFFFFF; font-weight: 800; font-size: 11px; padding: 4px 8px; border-radius: 20px; border: 2px solid #FFFFFF; display: flex; align-items: center; gap: 4px; box-shadow: 0 3px 10px rgba(0,0,0,0.25);">
              <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #FFFFFF;"></span>
              PICKUP
            </div>
            <div style="width: 2px; height: 8px; background: #10B981;"></div>
          </div>
        `;

        const marker = new mapboxgl.Marker({ element: el, draggable: true })
          .setLngLat([pickupLocation.lng, pickupLocation.lat])
          .setPopup(new mapboxgl.Popup({ offset: 25 }).setText(pickupLocation.name || 'Pickup Location'))
          .addTo(map);

        marker.on('dragend', async () => {
          const { lng, lat } = marker.getLngLat();
          const address = await routingService.reverseGeocode(lat, lng);
          if (onPickupChange) {
            onPickupChange({
              lat: +lat.toFixed(6),
              lng: +lng.toFixed(6),
              name: address
            });
          }
        });

        pickupMarkerRef.current = marker;
      } else {
        pickupMarkerRef.current.setLngLat([pickupLocation.lng, pickupLocation.lat]);
      }
    } else if (pickupMarkerRef.current) {
      pickupMarkerRef.current.remove();
      pickupMarkerRef.current = null;
    }
  }, [mapLoaded, pickupLocation, onPickupChange]);

  // 5. Drop Destination Marker (Draggable)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    if (dropLocation && dropLocation.lng && dropLocation.lat) {
      if (!dropMarkerRef.current) {
        const el = document.createElement('div');
        el.className = 'mysawari-drop-marker cursor-pointer';
        el.innerHTML = `
          <div style="display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 4px 10px rgba(239, 43, 62, 0.45));">
            <div style="background: #EF2B3E; color: #FFFFFF; font-weight: 800; font-size: 11px; padding: 4px 8px; border-radius: 20px; border: 2px solid #FFFFFF; display: flex; align-items: center; gap: 4px; box-shadow: 0 3px 10px rgba(0,0,0,0.25);">
              <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #FFFFFF;"></span>
              DROP
            </div>
            <div style="width: 2px; height: 8px; background: #EF2B3E;"></div>
          </div>
        `;

        const marker = new mapboxgl.Marker({ element: el, draggable: true })
          .setLngLat([dropLocation.lng, dropLocation.lat])
          .setPopup(new mapboxgl.Popup({ offset: 25 }).setText(dropLocation.name || 'Destination'))
          .addTo(map);

        marker.on('dragend', async () => {
          const { lng, lat } = marker.getLngLat();
          const address = await routingService.reverseGeocode(lat, lng);
          if (onDropChange) {
            onDropChange({
              lat: +lat.toFixed(6),
              lng: +lng.toFixed(6),
              name: address
            });
          }
        });

        dropMarkerRef.current = marker;
      } else {
        dropMarkerRef.current.setLngLat([dropLocation.lng, dropLocation.lat]);
      }
    } else if (dropMarkerRef.current) {
      dropMarkerRef.current.remove();
      dropMarkerRef.current = null;
    }
  }, [mapLoaded, dropLocation, onDropChange]);

  // 6. Captain Live Tracking Marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    if (captainLocation && captainLocation.lat && captainLocation.lng) {
      const targetPos = [captainLocation.lng, captainLocation.lat];
      const vehicleIcon = captainLocation.vehicleCode === 'auto' ? '🛺' : captainLocation.vehicleCode === 'bike' ? '🛵' : '🚕';
      const captainName = captainLocation.name || 'Captain Suresh';

      if (!captainMarkerRef.current) {
        const el = document.createElement('div');
        el.className = 'mysawari-captain-marker';
        el.innerHTML = `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
            <div style="position: absolute; top: -6px; width: 44px; height: 44px; border-radius: 50%; background: rgba(245, 158, 11, 0.25); animation: ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 36px; height: 36px; border-radius: 50%; background: #0A0A14; border: 2.5px solid #FFC21A; display: flex; align-items: center; justify-content: center; font-size: 18px; box-shadow: 0 4px 14px rgba(0,0,0,0.4); z-index: 2;">
              ${vehicleIcon}
            </div>
            <div style="background: #0A0A14; color: #FFC21A; font-size: 9px; font-weight: 800; padding: 1px 5px; border-radius: 8px; margin-top: -3px; z-index: 3; font-family: monospace;">
              CAPTAIN
            </div>
          </div>
        `;

        captainMarkerRef.current = new mapboxgl.Marker({ element: el })
          .setLngLat(targetPos)
          .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`<strong>${captainName}</strong><br/>Live Location`))
          .addTo(map);

        prevCaptainPosRef.current = targetPos;
      } else {
        const startPos = prevCaptainPosRef.current || targetPos;
        const startTime = performance.now();
        const duration = 1200;

        const animateMarker = (now) => {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 3);

          const currentLng = startPos[0] + (targetPos[0] - startPos[0]) * ease;
          const currentLat = startPos[1] + (targetPos[1] - startPos[1]) * ease;

          if (captainMarkerRef.current) {
            captainMarkerRef.current.setLngLat([currentLng, currentLat]);
          }

          if (progress < 1) {
            captainAnimRef.current = requestAnimationFrame(animateMarker);
          } else {
            prevCaptainPosRef.current = targetPos;
          }
        };

        if (captainAnimRef.current) cancelAnimationFrame(captainAnimRef.current);
        captainAnimRef.current = requestAnimationFrame(animateMarker);
      }
    }
  }, [mapLoaded, captainLocation]);

  // 7. Crowdsourced Road Incident Markers (Accidents, Roadblocks, Traffic Congestion)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    // Remove existing incident markers
    incidentMarkersRef.current.forEach((m) => m.remove());
    incidentMarkersRef.current = [];

    if (!incidents || incidents.length === 0) return;

    incidents.forEach((inc) => {
      if (!inc.latitude || !inc.longitude) return;
      if (inc.status === 'REJECTED' || inc.status === 'RESOLVED') return;

      const isCritical = inc.severity === 'CRITICAL';
      const isHigh = inc.severity === 'HIGH';
      const badgeBg = isCritical ? '#EF2B3E' : isHigh ? '#F59E0B' : '#EAB308';
      const icon = inc.type === 'accident' ? '🚨' : inc.type === 'roadblock' ? '🚧' : '🚦';

      const el = document.createElement('div');
      el.className = 'mysawari-incident-marker cursor-pointer';
      el.innerHTML = `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));">
          <div style="position: absolute; -inset: 4px; border-radius: 50%; background: ${badgeBg}; opacity: 0.4; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 32px; height: 32px; border-radius: 50%; background: #FFFFFF; border: 2.5px solid ${badgeBg}; display: flex; align-items: center; justify-content: center; font-size: 14px; box-shadow: 0 3px 10px rgba(0,0,0,0.25); z-index: 2;">
            ${icon}
          </div>
          <div style="background: ${badgeBg}; color: #FFFFFF; font-size: 8px; font-weight: 800; padding: 1px 5px; border-radius: 6px; margin-top: -3px; z-index: 3; font-family: monospace; text-transform: uppercase;">
            ${inc.severity}
          </div>
        </div>
      `;

      const popupHtml = `
        <div style="font-family: sans-serif; padding: 4px; max-width: 220px;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
            <span style="font-size: 14px;">${icon}</span>
            <strong style="font-size: 12px; color: #0A0A14;">${inc.category}</strong>
          </div>
          <div style="font-size: 11px; color: #5B5B73; margin-bottom: 6px; line-height: 1.3;">
            ${inc.description}
          </div>
          <div style="font-size: 9px; color: #8E96A6; margin-bottom: 8px;">
            📍 ${inc.location}<br/>
            👤 ${inc.reportedBy || 'User'} · Status: <span style="color: ${badgeBg}; font-weight: bold;">${inc.status}</span>
          </div>
          <button id="avoid-hazard-btn-${inc.id}" style="width: 100%; background: #F59E0B; color: #0A0A14; font-weight: bold; font-size: 10px; padding: 5px 8px; border-radius: 8px; border: none; cursor: pointer;">
            🛡️ Avoid (Take Alternate Route)
          </button>
        </div>
      `;

      const popup = new mapboxgl.Popup({ offset: 20 }).setHTML(popupHtml);
      popup.on('open', () => {
        setTimeout(() => {
          const btn = document.getElementById(`avoid-hazard-btn-${inc.id}`);
          if (btn && onSelectRouteType) {
            btn.onclick = () => {
              onSelectRouteType('alternate');
              popup.remove();
            };
          }
        }, 50);
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([inc.longitude, inc.latitude])
        .setPopup(popup)
        .addTo(map);

      incidentMarkersRef.current.push(marker);
    });
  }, [mapLoaded, incidents, onSelectRouteType]);

  // 8. Route Visualization Polyline (All Available Routes & Active Route Casing)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    // 1. Update Alternate Route 1 (Shortest - Emerald dashed)
    const shortestSource = map.getSource('alt-shortest-source');
    if (shortestSource && allRoutes?.shortest?.coordinates) {
      shortestSource.setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: activeRouteType === 'shortest' ? [] : allRoutes.shortest.coordinates
        }
      });
    }

    // 2. Update Alternate Route 2 (Hazard-Free Bypass - Amber dashed)
    const alternateSource = map.getSource('alt-alternate-source');
    if (alternateSource && allRoutes?.alternate?.coordinates) {
      alternateSource.setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: activeRouteType === 'alternate' ? [] : allRoutes.alternate.coordinates
        }
      });
    }

    // 3. Update Primary Active Route
    const activeCoords = (allRoutes && allRoutes[activeRouteType]?.coordinates) || routeCoordinates;
    const activeColor =
      activeRouteType === 'shortest' ? '#10B981' : activeRouteType === 'alternate' ? '#F59E0B' : '#3A4DFF';

    const mainSource = map.getSource('route-source');
    if (mainSource) {
      if (activeCoords && activeCoords.length > 1) {
        mainSource.setData({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: activeCoords
          }
        });

        if (map.getLayer('route-line')) {
          map.setPaintProperty('route-line', 'line-color', activeColor);
        }

        // Fit map bounds to show complete corridor
        const bounds = activeCoords.reduce(
          (b, coord) => b.extend(coord),
          new mapboxgl.LngLatBounds(activeCoords[0], activeCoords[0])
        );

        map.fitBounds(bounds, {
          padding: { top: 75, bottom: 75, left: 75, right: 75 },
          duration: 1200,
          maxZoom: 15.5
        });
      } else {
        mainSource.setData({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: []
          }
        });
      }
    }
  }, [mapLoaded, routeCoordinates, allRoutes, activeRouteType]);

  // Recenter on user / pickup
  const handleRecenter = () => {
    const map = mapRef.current;
    if (!map) return;

    if (userLocation) {
      map.flyTo({ center: [userLocation.lng, userLocation.lat], zoom: 15, duration: 1000 });
    } else if (pickupLocation?.lng && pickupLocation?.lat) {
      map.flyTo({ center: [pickupLocation.lng, pickupLocation.lat], zoom: 15, duration: 1000 });
    } else {
      map.flyTo({ center: [DEFAULT_BELAGAVI.lng, DEFAULT_BELAGAVI.lat], zoom: 14, duration: 1000 });
    }
  };

  // If token is missing, show fallback error card
  if (mapError) {
    return (
      <div 
        className={`w-full rounded-[24px] border border-amber-300 bg-amber-50/70 p-6 flex flex-col items-center justify-center text-center space-y-3 ${className}`}
        style={{ minHeight: height }}
      >
        <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-amber-900">Mapbox Setup Required</h4>
        <p className="text-xs text-amber-700 max-w-md">
          {mapError}
        </p>
        <p className="text-[11px] text-amber-600 font-mono">
          Ensure VITE_MAPBOX_ACCESS_TOKEN is configured in frontend/.env.
        </p>
      </div>
    );
  }

  return (
    <div className={`relative w-full rounded-[28px] overflow-hidden border border-[#DCDAF0] shadow-sm bg-[#E9ECF2] ${className}`} style={{ height }}>
      {/* Mapbox Canvas */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Status & Multi-Route Switcher Bar */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <span className="hud px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-[#DCDAF0] text-[#0A0A14] font-bold shadow-sm flex items-center gap-1.5 text-[10px]">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <span>BELAGAVI MAPBOX LIVE</span>
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
              onClick={() => onSelectRouteType('fastest')}
              className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeRouteType === 'fastest'
                  ? 'bg-[#3A4DFF] text-white shadow-xs'
                  : 'text-[#5B5B73] hover:text-[#0A0A14]'
              }`}
            >
              <span>⚡ Fastest</span>
              <span className="font-mono text-[9px] opacity-80">{allRoutes.fastest?.durationMin}m</span>
            </button>

            <button
              onClick={() => onSelectRouteType('shortest')}
              className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeRouteType === 'shortest'
                  ? 'bg-[#10B981] text-white shadow-xs'
                  : 'text-[#5B5B73] hover:text-[#0A0A14]'
              }`}
            >
              <span>🌿 Shortest</span>
              <span className="font-mono text-[9px] opacity-80">{allRoutes.shortest?.distanceKm}k</span>
            </button>

            <button
              onClick={() => onSelectRouteType('alternate')}
              className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeRouteType === 'alternate'
                  ? 'bg-[#F59E0B] text-[#0A0A14] shadow-xs font-extrabold'
                  : 'text-[#5B5B73] hover:text-[#0A0A14]'
              }`}
            >
              <span>🛡️ Hazard-Free</span>
              <span className="font-mono text-[9px] opacity-80">{allRoutes.alternate?.durationMin}m</span>
            </button>
          </div>
        )}
      </div>

      {selectionMode && (
        <div className="absolute top-12 left-3 z-10">
          <span className="hud px-3 py-1.5 rounded-full bg-[#3A4DFF] text-white font-bold text-[10px] shadow-sm animate-bounce">
            CLICK MAP TO SET {selectionMode.toUpperCase()}
          </span>
        </div>
      )}

      {/* Floating Recenter in bottom corner */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
        <button
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