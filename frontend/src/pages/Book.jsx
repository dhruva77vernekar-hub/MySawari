import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  MapPin, 
  Navigation, 
  ArrowUpDown, 
  Sparkles, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  ArrowRight,
  Info,
  Locate,
  Search,
  MousePointer,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2
} from 'lucide-react';
import { MOCK_LOCATIONS } from '../mock/mockData';
import { useVehicle } from '../context/VehicleContext';
import { useLanguage } from '../context/LanguageContext';
import VehicleMorphCanvas from '../three/VehicleMorphCanvas';
import MapIntegration from '../components/map/MapIntegration';
import routingService from '../services/routingService';
import api from '../services/api';
import PaymentModal from '../components/payment/PaymentModal';
import incidentService from '../services/incidentService';
import ReportIncidentModal from '../components/modals/ReportIncidentModal';
import AppDispatchView from '../components/booking/AppDispatchView';

export default function Book() {
  const navigate = useNavigate();
  const location = useLocation();
  const { vehicles, selectedVehicle, selectVehicleByCode } = useVehicle();
  const { t } = useLanguage();

  // Initial Coordinates based on state or Belagavi defaults
  const defaultPickup = location.state?.pickupCoords || {
    lat: MOCK_LOCATIONS[0].lat,
    lng: MOCK_LOCATIONS[0].lng,
    name: location.state?.pickup || MOCK_LOCATIONS[0].name
  };

  const defaultDrop = location.state?.dropCoords || {
    lat: MOCK_LOCATIONS[1].lat,
    lng: MOCK_LOCATIONS[1].lng,
    name: location.state?.drop || MOCK_LOCATIONS[1].name
  };

  const [pickup, setPickup] = useState(defaultPickup.name);
  const [drop, setDrop] = useState(defaultDrop.name);
  const [pickupCoords, setPickupCoords] = useState(defaultPickup);
  const [dropCoords, setDropCoords] = useState(defaultDrop);

  // Autocomplete suggestions
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [dropSuggestions, setDropSuggestions] = useState([]);
  const [isPickupDropdownOpen, setIsPickupDropdownOpen] = useState(false);
  const [isDropDropdownOpen, setIsDropDropdownOpen] = useState(false);
  const [isSearchingPickup, setIsSearchingPickup] = useState(false);
  const [isSearchingDrop, setIsSearchingDrop] = useState(false);

  // Map click interaction mode: 'pickup' | 'drop' | null
  const [interactiveMapMode, setInteractiveMapMode] = useState(null);

  // Route metrics & multi-route intelligence
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [allRoutes, setAllRoutes] = useState(null);
  const [distanceKm, setDistanceKm] = useState(2.4);
  const [durationMin, setDurationMin] = useState(8);
  const [routeSource, setRouteSource] = useState('mapbox');
  const [routeType, setRouteType] = useState('fastest'); // 'fastest' | 'shortest' | 'alternate'
  const [hasRainSurge, setHasRainSurge] = useState(true);

  // Incidents & Hazard Moderation
  const [incidents, setIncidents] = useState([]);
  const [detectedHazards, setDetectedHazards] = useState([]);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // AI Booking Prompt
  const [isAiMode, setIsAiMode] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiParsed, setAiParsed] = useState(null);

  // Breakdown accordion & detailed modal
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showDetailedBreakdownModal, setShowDetailedBreakdownModal] = useState(false);
  const [backendFare, setBackendFare] = useState(null);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('app'); // 'app' (mobile dispatch map from screenshot) | 'studio'

  // Hydrate vehicle from navigation state
  useEffect(() => {
    const code = location.state?.vehicleCode || localStorage.getItem('mysawari_selected_vehicle');
    if (code) {
      selectVehicleByCode(code);
    }
  }, [location.state, selectVehicleByCode]);

  // Load crowdsourced road incidents
  useEffect(() => {
    incidentService.getIncidents().then((data) => {
      if (data && data.length > 0) setIncidents(data);
    });
    const unsub = incidentService.subscribe((data) => {
      if (data && data.length > 0) setIncidents(data);
    });
    return unsub;
  }, []);

  // Check live backend API health
  useEffect(() => {
    let mounted = true;
    api.checkHealth().then((health) => {
      if (mounted) {
        setBackendStatus(health?.status === 'ok' ? 'online' : 'fallback');
      }
    });
    return () => { mounted = false; };
  }, []);

  // Recalculate all available routes whenever pickupCoords or dropCoords change
  useEffect(() => {
    let isMounted = true;
    if (!pickupCoords || !dropCoords) return;

    routingService.getAllRoutes(pickupCoords, dropCoords).then((all) => {
      if (!isMounted || !all) return;
      setAllRoutes(all);
      const active = all[routeType] || all.fastest;
      setRouteCoordinates(active.coordinates || []);
      setDistanceKm(active.distanceKm);
      setDurationMin(active.durationMin);
      setRouteSource('mapbox');

      // Check for hazards along the active route
      const hazards = incidentService.detectRouteHazards(active.coordinates, incidents);
      setDetectedHazards(hazards);

      // Update backend fare estimate with new distance
      const code = selectedVehicle?.code || 'cab';
      api.getFareEstimate(code, Math.round(active.distanceKm * 1000)).then((fareRes) => {
        if (isMounted && fareRes?.total) {
          setBackendFare(fareRes.total);
        }
      });
    });

    return () => { isMounted = false; };
  }, [pickupCoords, dropCoords, selectedVehicle, incidents]);

  // Autocomplete search handlers
  const handlePickupSearch = async (val) => {
    setPickup(val);
    setIsPickupDropdownOpen(true);
    if (val.trim().length >= 2) {
      setIsSearchingPickup(true);
      const results = await routingService.searchLocations(val);
      setPickupSuggestions(results);
      setIsSearchingPickup(false);
    } else {
      setPickupSuggestions(MOCK_LOCATIONS);
    }
  };

  const handleDropSearch = async (val) => {
    setDrop(val);
    setIsDropDropdownOpen(true);
    if (val.trim().length >= 2) {
      setIsSearchingDrop(true);
      const results = await routingService.searchLocations(val);
      setDropSuggestions(results);
      setIsSearchingDrop(false);
    } else {
      setDropSuggestions(MOCK_LOCATIONS);
    }
  };

  const selectPickupLocation = (loc) => {
    setPickup(loc.name);
    setPickupCoords({ lat: loc.lat, lng: loc.lng, name: loc.name });
    setIsPickupDropdownOpen(false);
  };

  const selectDropLocation = (loc) => {
    setDrop(loc.name);
    setDropCoords({ lat: loc.lat, lng: loc.lng, name: loc.name });
    setIsDropDropdownOpen(false);
  };

  // Map pin drag and map click handlers
  const handleMapPickupChange = (loc) => {
    setPickup(loc.name);
    setPickupCoords(loc);
    setInteractiveMapMode(null);
  };

  const handleMapDropChange = (loc) => {
    setDrop(loc.name);
    setDropCoords(loc);
    setInteractiveMapMode(null);
  };

  // Swap pickup & drop
  const handleSwap = () => {
    const tempName = pickup;
    const tempCoords = pickupCoords;
    setPickup(drop);
    setPickupCoords(dropCoords);
    setDrop(tempName);
    setDropCoords(tempCoords);
  };

  // AI prompt simulation
  const handleAiParse = () => {
    if (!aiPrompt.trim()) return;
    setAiParsed({
      pickup: 'KLE Technological University',
      drop: 'Rani Chennamma Circle',
      preference: 'Cheapest Ride'
    });
    setPickup('KLE Technological University Campus');
    setPickupCoords(MOCK_LOCATIONS[0]);
    setDrop('Rani Chennamma Circle');
    setDropCoords(MOCK_LOCATIONS[1]);
    selectVehicleByCode('bike');
  };

  // Confirm booking - opens Razorpay payment modal
  const handleConfirmRide = () => {
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = (paymentResult) => {
    // Generate secure 4-digit Ride Start OTP
    const rideOtp = Math.floor(1000 + Math.random() * 9000).toString();
    localStorage.setItem('mysawari_active_otp', rideOtp);

    navigate('/ride/live-trip-demo', {
      state: {
        pickup,
        drop,
        pickupCoords,
        dropCoords,
        routeCoordinates,
        distanceKm,
        durationMin,
        selectedVehicle,
        fare: selectedFare,
        paymentData: paymentResult,
        paymentStatus: paymentResult.status === 'captured' ? 'paid' : 'cash',
        otp: rideOtp
      }
    });
  };

  // Calculate fare with transparent formula and itemized breakdown
  const calculateFareDetails = (v) => {
    const base = v.baseFare;
    const distCharge = Math.round(v.perKm * distanceKm);
    const timeCharge = Math.round(v.perMin * durationMin);
    const rainSurgeCharge = hasRainSurge ? 12 : 0;
    const handlingFee = 4;
    const safetyInsurance = 2;
    const subtotal = base + distCharge + timeCharge + rainSurgeCharge + handlingFee + safetyInsurance;
    const gstTax = Math.max(2, Math.round(subtotal * 0.05));
    const total = Math.max(v.minFare, subtotal + gstTax);

    return {
      base,
      distCharge,
      timeCharge,
      rainSurgeCharge,
      handlingFee,
      safetyInsurance,
      gstTax,
      total
    };
  };

  const calculateFare = (v) => calculateFareDetails(v).total;

  const fareDetails = calculateFareDetails(selectedVehicle);
  const selectedFare = backendFare || fareDetails.total;

  const handleRouteTypeChange = (type) => {
    setRouteType(type);
    if (allRoutes && allRoutes[type]) {
      const active = allRoutes[type];
      setRouteCoordinates(active.coordinates || []);
      setDistanceKm(active.distanceKm);
      setDurationMin(active.durationMin);
      const hazards = incidentService.detectRouteHazards(active.coordinates, incidents);
      setDetectedHazards(hazards);
    } else {
      if (type === 'shortest') {
        setDistanceKm((prev) => Math.max(1.2, +(prev * 0.85).toFixed(1)));
        setDurationMin((prev) => Math.round(prev * 1.25));
      } else if (type === 'alternate') {
        setDistanceKm((prev) => +(prev * 1.1).toFixed(1));
        setDurationMin((prev) => Math.max(2, Math.round(prev * 0.95)));
      } else {
        setDistanceKm(2.4);
        setDurationMin(8);
      }
    }
  };

  return (
    <div className="relative w-full min-h-screen pt-20 pb-12 px-3 sm:px-6 md:px-8 max-w-7xl mx-auto flex flex-col items-center">
      {/* Top Experience View Switcher Bar */}
      <div className="w-full flex items-center justify-between pb-4 max-w-4xl">
        <div className="flex items-center gap-2">
          <span className="hud text-[10px] text-[#3A4DFF] font-bold">BELAGAVI RIDE DISPATCH</span>
          <span className="hud text-[9px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
            <span>15 SAWARIS ROAMING</span>
          </span>
        </div>

        {/* View Toggle */}
        <div className="flex items-center bg-[#F1F0FA] p-1 rounded-full border border-[#DCDAF0] text-xs font-bold">
          <button
            type="button"
            onClick={() => setViewMode('app')}
            className={`px-3 py-1 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'app' ? 'bg-[#3A4DFF] text-white shadow-xs' : 'text-[#5B5B73] hover:text-[#0A0A14]'
            }`}
          >
            <span>📱 App Dispatch</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('studio')}
            className={`px-3 py-1 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'studio' ? 'bg-[#3A4DFF] text-white shadow-xs' : 'text-[#5B5B73] hover:text-[#0A0A14]'
            }`}
          >
            <span>💻 Studio 3D</span>
          </button>
        </div>
      </div>

      {viewMode === 'app' ? (
        <div className="w-full max-w-4xl">
          <AppDispatchView
            pickup={pickup}
            setPickup={setPickup}
            pickupCoords={pickupCoords}
            setPickupCoords={setPickupCoords}
            drop={drop}
            setDrop={setDrop}
            dropCoords={dropCoords}
            setDropCoords={setDropCoords}
            routeCoordinates={routeCoordinates}
            allRoutes={allRoutes}
            routeType={routeType}
            onSelectRouteType={handleRouteTypeChange}
            distanceKm={distanceKm}
            durationMin={durationMin}
            vehicles={vehicles}
            selectedVehicle={selectedVehicle}
            onSelectVehicle={(v) => selectVehicleByCode(v.code)}
            selectedFare={selectedFare}
            incidents={incidents}
            onConfirmRide={handleConfirmRide}
            onOpenMenu={() => navigate('/rider')}
            onToggleView={() => setViewMode('studio')}
            onOpenAiBooking={() => setIsAiMode(true)}
          />
        </div>
      ) : (
        <div className="w-full flex flex-col md:flex-row gap-8">
          {/* Left Panel: Booking Console */}
          <div className="w-full md:w-[460px] bg-white rounded-[28px] border border-[#DCDAF0] p-6 shadow-[0_20px_60px_-20px_rgba(58,77,255,0.18)] flex flex-col justify-between z-10">
        <div>
          {/* Header & AI Toggle */}
          <div className="flex items-center justify-between pb-4 border-b border-[#DCDAF0]">
            <div>
              <div className="flex items-center gap-2">
                <span className="hud text-[10px] text-[#3A4DFF] font-bold">RIDE DISPATCH · BELAGAVI</span>
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${backendStatus === 'online' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${backendStatus === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                  {backendStatus === 'online' ? 'API v3.0 Live' : 'Demo Mode'}
                </span>
              </div>
              <h2 className="text-xl font-bold text-[#0A0A14]">Where to?</h2>
            </div>
            <button
              onClick={() => setIsAiMode(!isAiMode)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isAiMode
                  ? 'bg-[#3A4DFF] text-white shadow-sm'
                  : 'bg-[#F1F0FA] text-[#0A0A14] hover:bg-[#E9ECF2]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FFC21A]" />
              <span>AI Booking</span>
            </button>
          </div>

          {/* AI Bar */}
          {isAiMode && (
            <div className="my-3 p-3.5 bg-[#F1F0FA] rounded-2xl border border-[#3A4DFF]/30 space-y-2 animate-fade-in">
              <span className="hud text-[9px] text-[#3A4DFF] font-bold">NATURAL LANGUAGE BOOKING</span>
              <div className="flex items-center gap-2">
                <input
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g. KLE to Chennamma Circle cheapest ride"
                  className="w-full bg-white px-3 py-2 text-xs rounded-xl border border-[#DCDAF0] outline-none focus:border-[#3A4DFF]"
                />
                <button
                  onClick={handleAiParse}
                  className="px-3 py-2 bg-[#3A4DFF] text-white text-xs font-semibold rounded-xl hover:bg-[#2b3cee] cursor-pointer"
                >
                  Parse
                </button>
              </div>
              {aiParsed && (
                <div className="text-[11px] text-[#5B5B73] flex items-center gap-1.5 pt-1">
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>Parsed: <strong>{aiParsed.preference}</strong> ({selectedVehicle.label})</span>
                </div>
              )}
            </div>
          )}

          {/* Pickup and Drop Inputs */}
          <div className="relative my-4 space-y-2">
            {/* Pickup Input */}
            <div className="relative">
              <div className="flex items-center bg-[#F1F0FA] rounded-[16px] px-3.5 py-3 border border-transparent focus-within:border-[#3A4DFF] focus-within:bg-white transition-all shadow-xs">
                <span className="w-3 h-3 rounded-full bg-emerald-500 mr-3 flex-shrink-0" />
                <input
                  value={pickup}
                  onChange={(e) => handlePickupSearch(e.target.value)}
                  onFocus={() => {
                    setIsPickupDropdownOpen(true);
                    if (pickupSuggestions.length === 0) setPickupSuggestions(MOCK_LOCATIONS);
                  }}
                  placeholder="Enter pickup in Belagavi"
                  className="w-full bg-transparent text-xs sm:text-sm font-medium outline-none text-[#0A0A14]"
                />
                <button
                  type="button"
                  onClick={() => setInteractiveMapMode(interactiveMapMode === 'pickup' ? null : 'pickup')}
                  title="Click on Map to set Pickup"
                  className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                    interactiveMapMode === 'pickup' ? 'bg-[#3A4DFF] text-white' : 'text-[#5B5B73] hover:bg-white'
                  }`}
                >
                  <MousePointer className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Pickup Suggestions Dropdown */}
              {isPickupDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl border border-[#DCDAF0] shadow-xl z-30 p-2 space-y-1 max-h-56 overflow-y-auto">
                  <span className="hud text-[9px] text-[#8E96A6] px-2 py-0.5 block">
                    {isSearchingPickup ? 'SEARCHING MAPBOX...' : 'SUGGESTED BELAGAVI LOCATIONS'}
                  </span>
                  {(pickupSuggestions.length > 0 ? pickupSuggestions : MOCK_LOCATIONS).map((loc) => (
                    <button
                      key={loc.id}
                      onClick={() => selectPickupLocation(loc)}
                      className="w-full text-left p-2 hover:bg-[#F1F0FA] rounded-xl flex items-start gap-2 cursor-pointer transition-colors"
                    >
                      <MapPin className="w-4 h-4 text-[#10B981] mt-0.5 flex-shrink-0" />
                      <div className="overflow-hidden">
                        <p className="text-xs font-semibold text-[#0A0A14] truncate">{loc.name}</p>
                        <p className="text-[10px] text-[#5B5B73] truncate">{loc.area}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Swap Button */}
            <div className="flex justify-end pr-4 -my-2 relative z-10">
              <button
                onClick={handleSwap}
                className="w-7 h-7 rounded-full bg-white border border-[#DCDAF0] shadow-sm flex items-center justify-center hover:bg-[#F1F0FA] transition-colors cursor-pointer"
                title="Swap pickup and destination"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-[#5B5B73]" />
              </button>
            </div>

            {/* Drop Input */}
            <div className="relative">
              <div className="flex items-center bg-[#F1F0FA] rounded-[16px] px-3.5 py-3 border border-transparent focus-within:border-[#3A4DFF] focus-within:bg-white transition-all shadow-xs">
                <span className="w-3 h-3 rounded-full bg-[#EF2B3E] mr-3 flex-shrink-0" />
                <input
                  value={drop}
                  onChange={(e) => handleDropSearch(e.target.value)}
                  onFocus={() => {
                    setIsDropDropdownOpen(true);
                    if (dropSuggestions.length === 0) setDropSuggestions(MOCK_LOCATIONS);
                  }}
                  placeholder="Enter destination in Belagavi"
                  className="w-full bg-transparent text-xs sm:text-sm font-medium outline-none text-[#0A0A14]"
                />
                <button
                  type="button"
                  onClick={() => setInteractiveMapMode(interactiveMapMode === 'drop' ? null : 'drop')}
                  title="Click on Map to set Destination"
                  className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                    interactiveMapMode === 'drop' ? 'bg-[#EF2B3E] text-white' : 'text-[#5B5B73] hover:bg-white'
                  }`}
                >
                  <MousePointer className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Drop Suggestions Dropdown */}
              {isDropDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl border border-[#DCDAF0] shadow-xl z-30 p-2 space-y-1 max-h-56 overflow-y-auto">
                  <span className="hud text-[9px] text-[#8E96A6] px-2 py-0.5 block">
                    {isSearchingDrop ? 'SEARCHING MAPBOX...' : 'SUGGESTED BELAGAVI LOCATIONS'}
                  </span>
                  {(dropSuggestions.length > 0 ? dropSuggestions : MOCK_LOCATIONS).map((loc) => (
                    <button
                      key={loc.id}
                      onClick={() => selectDropLocation(loc)}
                      className="w-full text-left p-2 hover:bg-[#F1F0FA] rounded-xl flex items-start gap-2 cursor-pointer transition-colors"
                    >
                      <MapPin className="w-4 h-4 text-[#EF2B3E] mt-0.5 flex-shrink-0" />
                      <div className="overflow-hidden">
                        <p className="text-xs font-semibold text-[#0A0A14] truncate">{loc.name}</p>
                        <p className="text-[10px] text-[#5B5B73] truncate">{loc.area}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Smart Route Intelligence Selection (Shortest, Fastest, Alternate) */}
            <div className="pt-1 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-[#5B5B73]">
                <div className="flex items-center gap-1.5">
                  <span className="hud font-bold text-[#3A4DFF]">SMART ROUTE INTELLIGENCE</span>
                  <span className="text-[10px] text-[#8E96A6]">· All Routes</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(true)}
                  className="px-2.5 py-1 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                >
                  <AlertTriangle className="w-3 h-3 text-red-600" />
                  <span>Report Hazard</span>
                </button>
              </div>

              {/* 3 Interactive Multi-Route Corridor Selection Pills */}
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#F1F0FA] rounded-2xl border border-[#DCDAF0]">
                <button
                  type="button"
                  onClick={() => handleRouteTypeChange('fastest')}
                  className={`py-2 px-1 rounded-xl text-center transition-all cursor-pointer ${
                    routeType === 'fastest'
                      ? 'bg-white text-[#3A4DFF] font-bold shadow-xs border border-[#DCDAF0]/50'
                      : 'text-[#5B5B73] hover:text-[#0A0A14] font-medium'
                  }`}
                >
                  <span className="hud text-[9px] block uppercase text-[#3A4DFF]">⚡ Fastest</span>
                  <span className="text-xs font-mono font-bold block">{allRoutes?.fastest?.durationMin || durationMin} min</span>
                  <span className="text-[9px] text-[#8E96A6] block">{allRoutes?.fastest?.distanceKm || distanceKm} km</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRouteTypeChange('shortest')}
                  className={`py-2 px-1 rounded-xl text-center transition-all cursor-pointer ${
                    routeType === 'shortest'
                      ? 'bg-white text-emerald-600 font-bold shadow-xs border border-[#DCDAF0]/50'
                      : 'text-[#5B5B73] hover:text-[#0A0A14] font-medium'
                  }`}
                >
                  <span className="hud text-[9px] block uppercase text-emerald-600">🌿 Shortest</span>
                  <span className="text-xs font-mono font-bold block">{allRoutes?.shortest?.durationMin || durationMin} min</span>
                  <span className="text-[9px] text-[#8E96A6] block">{allRoutes?.shortest?.distanceKm || distanceKm} km</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRouteTypeChange('alternate')}
                  className={`py-2 px-1 rounded-xl text-center transition-all cursor-pointer ${
                    routeType === 'alternate'
                      ? 'bg-white text-amber-700 font-bold shadow-xs border border-[#DCDAF0]/50'
                      : 'text-[#5B5B73] hover:text-[#0A0A14] font-medium'
                  }`}
                >
                  <span className="hud text-[9px] block uppercase text-amber-600">🛡️ Hazard-Free</span>
                  <span className="text-xs font-mono font-bold block">{allRoutes?.alternate?.durationMin || durationMin} min</span>
                  <span className="text-[9px] text-[#8E96A6] block">{allRoutes?.alternate?.distanceKm || distanceKm} km</span>
                </button>
              </div>

              {/* Shortest vs Fastest Calculation & Comparison Card */}
              {allRoutes && (
                <div className="p-2.5 bg-gradient-to-r from-blue-50/80 to-emerald-50/60 border border-blue-200/70 rounded-2xl text-[11px] space-y-1.5 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="hud text-[9px] font-bold text-[#3A4DFF] uppercase flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#3A4DFF]" />
                      Route Metric Comparison
                    </span>
                    <span className="text-[9px] text-[#5B5B73] font-mono">
                      Fastest vs Shortest
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-0.5 text-[10px]">
                    <div className="p-1.5 bg-white/80 rounded-xl border border-blue-100 flex items-center justify-between">
                      <span className="text-[#5B5B73]">⚡ Fastest ETA:</span>
                      <span className="font-bold text-[#3A4DFF]">
                        Saves {Math.max(1, (allRoutes.shortest?.durationMin || 16) - (allRoutes.fastest?.durationMin || 12))} mins
                      </span>
                    </div>
                    <div className="p-1.5 bg-white/80 rounded-xl border border-emerald-100 flex items-center justify-between">
                      <span className="text-[#5B5B73]">🌿 Shortest Dist:</span>
                      <span className="font-bold text-emerald-700">
                        Saves {+Math.max(0.4, (allRoutes.fastest?.distanceKm || 4.2) - (allRoutes.shortest?.distanceKm || 3.5)).toFixed(1)} km
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Proactive Hazard Detection Alert Banner */}
              {detectedHazards.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-red-900 animate-fade-in shadow-2xs">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-red-800">
                        ⚠️ Road Disruption on Route: {detectedHazards[0].category}
                      </span>
                      <span className="text-[11px] text-red-700">
                        Near {detectedHazards[0].location}. High delay expected.
                      </span>
                    </div>
                  </div>
                  {routeType !== 'alternate' ? (
                    <button
                      type="button"
                      onClick={() => handleRouteTypeChange('alternate')}
                      className="px-3 py-1.5 bg-[#F59E0B] hover:bg-[#d98b0a] text-[#0A0A14] font-bold rounded-xl text-[10px] uppercase tracking-wide flex items-center gap-1 shadow-xs cursor-pointer whitespace-nowrap self-end sm:self-center"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Take Hazard-Free Bypass</span>
                    </button>
                  ) : (
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-xl font-bold text-[10px] uppercase flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Bypassing Hazard</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Distance and ETA row */}
          <div className="flex items-center justify-between px-2 py-1.5 text-xs text-[#5B5B73]">
            <span className="hud font-bold text-[#0A0A14]">
              SELECTED ROUTE: {distanceKm} KM · ~{durationMin} MINS
            </span>
            <span className="text-[11px] text-[#3A4DFF] font-semibold flex items-center gap-1 font-mono uppercase">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              {routeSource} mapbox routing
            </span>
          </div>

          {/* Stacked Vehicle Selection Cards */}
          <div className="my-4 space-y-2.5">
            {vehicles.map((v) => {
              const isSelected = selectedVehicle.code === v.code;
              const fare = calculateFare(v);

              return (
                <div
                  key={v.id}
                  onClick={() => selectVehicleByCode(v.code)}
                  className={`p-3.5 rounded-[20px] border cursor-pointer transition-all duration-200 flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#F1F0FA] border-[#3A4DFF] shadow-sm ring-1 ring-[#3A4DFF]'
                      : 'bg-white border-[#DCDAF0] hover:border-black/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-[#DCDAF0] flex items-center justify-center font-bold text-xs text-[#3A4DFF] shadow-xs">
                      {v.code === 'cab' ? 'CAB' : v.code === 'bike' ? 'BIKE' : v.code === 'auto' ? 'AUTO' : v.code === 'comfort' ? 'CMFT' : 'XL'}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-[#0A0A14]">{v.label}</span>
                        <span className="hud text-[9px] bg-white border border-[#DCDAF0] px-1.5 py-0.2 rounded text-[#5B5B73]">
                          {v.tag}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#5B5B73]">{v.etaMin} min away · {v.seats} seats</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono text-base font-bold text-[#0A0A14]">
                      ₹{fare}
                    </span>
                    <span className="block text-[9px] text-[#8E96A6]">UPFRONT</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Comprehensive Fare Price Breakdown */}
          <div className="border-t border-[#DCDAF0] pt-3">
            <button
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="w-full flex items-center justify-between text-xs text-[#5B5B73] hover:text-[#0A0A14] py-1 cursor-pointer font-medium"
            >
              <span className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-[#3A4DFF]" /> View itemized fare breakdown
              </span>
              <div className="flex items-center gap-2">
                <span className="hud text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  100% Transparent
                </span>
                {showBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {showBreakdown && (
              <div className="mt-2 p-3.5 bg-[#F8F8FC] border border-[#DCDAF0] rounded-2xl text-xs space-y-2 text-[#5B5B73] animate-fade-in">
                {/* 1. Base Fare */}
                <div className="flex justify-between items-center py-0.5">
                  <div>
                    <span className="font-semibold text-[#0A0A14] block">Base Vehicle Fare</span>
                    <span className="text-[10px] text-[#8E96A6]">Initial flag-down fee for {selectedVehicle.label}</span>
                  </div>
                  <span className="font-mono font-semibold text-[#0A0A14]">₹{fareDetails.base}.00</span>
                </div>

                {/* 2. Distance Charge */}
                <div className="flex justify-between items-center py-0.5">
                  <div>
                    <span className="font-semibold text-[#0A0A14] block">Distance Charge</span>
                    <span className="text-[10px] text-[#8E96A6]">{distanceKm} km × ₹{selectedVehicle.perKm}/km</span>
                  </div>
                  <span className="font-mono font-semibold text-[#0A0A14]">₹{fareDetails.distCharge}.00</span>
                </div>

                {/* 3. Time / Traffic Charge */}
                <div className="flex justify-between items-center py-0.5">
                  <div>
                    <span className="font-semibold text-[#0A0A14] block">Traffic & Travel Time</span>
                    <span className="text-[10px] text-[#8E96A6]">~{durationMin} mins duration</span>
                  </div>
                  <span className="font-mono font-semibold text-[#0A0A14]">₹{fareDetails.timeCharge}.00</span>
                </div>

                {/* 4. Weather / Rain Surge */}
                <div className="flex justify-between items-center py-0.5 bg-blue-50/70 p-2 rounded-xl border border-blue-200/60">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-blue-900 block">Rain / Weather Surge</span>
                      <span className="hud text-[9px] bg-blue-200/80 text-blue-800 px-1.5 py-0.2 rounded font-bold">
                        {hasRainSurge ? 'Active Surge' : 'Fair Weather'}
                      </span>
                    </div>
                    <span className="text-[10px] text-blue-700">Monsoon road conditions compensation for captain</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-blue-900">
                      {hasRainSurge ? `+₹${fareDetails.rainSurgeCharge}.00` : '₹0.00'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setHasRainSurge(!hasRainSurge)}
                      className="text-[9px] hud text-[#3A4DFF] hover:underline cursor-pointer"
                      title="Toggle Rain Surge for Demo"
                    >
                      {hasRainSurge ? '[Off]' : '[On]'}
                    </button>
                  </div>
                </div>

                {/* 5. Platform Tech & Handling Fee */}
                <div className="flex justify-between items-center py-0.5">
                  <div>
                    <span className="font-semibold text-[#0A0A14] block">Platform & Handling Fee</span>
                    <span className="text-[10px] text-[#8E96A6]">Realtime dispatch, server hosting & payment gateway</span>
                  </div>
                  <span className="font-mono font-semibold text-[#0A0A14]">₹{fareDetails.handlingFee}.00</span>
                </div>

                {/* 6. Safety & 24/7 SOS Levy */}
                <div className="flex justify-between items-center py-0.5">
                  <div>
                    <span className="font-semibold text-[#0A0A14] block">Safety & SOS Insurance</span>
                    <span className="text-[10px] text-[#8E96A6]">24/7 live location beacon & emergency response</span>
                  </div>
                  <span className="font-mono font-semibold text-[#0A0A14]">₹{fareDetails.safetyInsurance}.00</span>
                </div>

                {/* 7. GST / Regulatory Taxes */}
                <div className="flex justify-between items-center py-0.5">
                  <div>
                    <span className="font-semibold text-[#0A0A14] block">GST / Transport Taxes (5%)</span>
                    <span className="text-[10px] text-[#8E96A6]">Govt. mandated mobility tax</span>
                  </div>
                  <span className="font-mono font-semibold text-[#0A0A14]">₹{fareDetails.gstTax}.00</span>
                </div>

                {/* Final Total */}
                <div className="flex justify-between items-center font-bold text-sm text-[#0A0A14] pt-2 border-t border-[#DCDAF0]">
                  <span>Total Upfront Fare</span>
                  <span className="text-base font-mono text-[#3A4DFF]">₹{selectedFare}.00</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Big Action Pill Button */}
        <div className="mt-6 pt-2">
          <button
            onClick={handleConfirmRide}
            className="w-full py-4 rounded-full bg-[#FFC21A] hover:bg-[#e6ad12] text-[#0A0A14] font-bold text-sm tracking-wide uppercase shadow-md hover:shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>CONFIRM {selectedVehicle.label.toUpperCase()} · ₹{selectedFare}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Right Area: Interactive Mapbox Integration & Live Synced 3D Vehicle Stage */}
      <div className="flex-1 flex flex-col gap-6">
        {/* Mapbox Route & Location Card */}
        <div className="relative w-full">
          <MapIntegration
            pickupLocation={pickupCoords}
            dropLocation={dropCoords}
            routeCoordinates={routeCoordinates}
            allRoutes={allRoutes}
            activeRouteType={routeType}
            incidents={incidents}
            onSelectRouteType={handleRouteTypeChange}
            interactiveSelection={interactiveMapMode}
            onPickupChange={handleMapPickupChange}
            onDropChange={handleMapDropChange}
            height="420px"
            showNearbyDrivers={true}
            selectedVehicleType={selectedVehicle?.code}
          />
        </div>

        {/* 3D Morph Stage synced with chosen vehicle */}
        <div className="w-full bg-white rounded-[28px] border border-[#DCDAF0] p-6 shadow-sm flex flex-col items-center">
          <div className="w-full flex items-center justify-between text-xs pb-2 border-b border-[#DCDAF0]">
            <span className="hud text-[#3A4DFF] font-bold">
              3D VEHICLE VIEW: {selectedVehicle.label.toUpperCase()}
            </span>
            <span className="hud text-[#8E96A6]">
              REAL-TIME 3D SELECTOR
            </span>
          </div>
          <div className="w-full">
            <VehicleMorphCanvas compact={true} />
          </div>
        </div>
      </div>
    </div>
  )}

      {/* Razorpay Payment Gateway Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        amount={selectedFare}
        rideDetails={{ pickup, drop }}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Crowdsourced Hazard & Incident Reporting Modal */}
      <ReportIncidentModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        defaultLocation={pickup || 'Chennamma Circle, Belagavi'}
        onIncidentReported={(newInc) => {
          setIncidents((prev) => [newInc, ...prev]);
        }}
      />
    </div>
  );
}
