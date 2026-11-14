import React, { useState, useEffect, useRef } from 'react';
import { 
  Menu, 
  Heart, 
  Search, 
  MapPin, 
  Navigation, 
  ArrowRight, 
  Check, 
  X, 
  ChevronUp, 
  ChevronDown, 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  Layers, 
  AlertTriangle,
  Locate,
  Zap,
  SlidersHorizontal
} from 'lucide-react';
import MapIntegration from '../map/MapIntegration';
import { MOCK_LOCATIONS } from '../../mock/mockData';

export default function AppDispatchView({
  pickup,
  setPickup,
  pickupCoords,
  setPickupCoords,
  drop,
  setDrop,
  dropCoords,
  setDropCoords,
  routeCoordinates = [],
  allRoutes = null,
  routeType = 'fastest',
  onSelectRouteType = null,
  distanceKm = 0,
  durationMin = 0,
  vehicles = [],
  selectedVehicle = null,
  onSelectVehicle = null,
  selectedFare = 0,
  incidents = [],
  onConfirmRide = null,
  onOpenMenu = null,
  onToggleView = null,
  onOpenAiBooking = null
}) {
  const [isDropSearchOpen, setIsDropSearchOpen] = useState(false);
  const [isPickupSearchOpen, setIsPickupSearchOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDrawerExpanded, setIsDrawerExpanded] = useState(Boolean(drop && dropCoords?.lat));
  const [activeDriverPopup, setActiveDriverPopup] = useState(null);

  // Auto-expand vehicle bottom drawer when drop location is set
  useEffect(() => {
    if (drop && dropCoords?.lat) {
      setIsDrawerExpanded(true);
    }
  }, [drop, dropCoords]);

  // Filter Belagavi locations for search autocomplete
  const filteredLocations = searchQuery.trim().length > 0
    ? MOCK_LOCATIONS.filter((loc) =>
        loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.area.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : MOCK_LOCATIONS;

  const handleSelectDrop = (loc) => {
    setDrop(loc.name);
    setDropCoords({ lat: loc.lat, lng: loc.lng, name: loc.name });
    setIsDropSearchOpen(false);
    setSearchQuery('');
    setIsDrawerExpanded(true);
  };

  const handleSelectPickup = (loc) => {
    setPickup(loc.name);
    setPickupCoords({ lat: loc.lat, lng: loc.lng, name: loc.name });
    setIsPickupSearchOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="relative w-full h-[calc(100vh-80px)] min-h-[580px] max-h-[860px] rounded-[32px] overflow-hidden border border-[#DCDAF0] shadow-xl bg-[#E9ECF2] flex flex-col select-none">
      
      {/* 1. Full-Bleed Map Canvas with Live Fleet */}
      <div className="absolute inset-0 w-full h-full z-0">
        <MapIntegration
          pickupLocation={pickupCoords}
          dropLocation={dropCoords}
          routeCoordinates={routeCoordinates}
          allRoutes={allRoutes}
          activeRouteType={routeType}
          incidents={incidents}
          onSelectRouteType={onSelectRouteType}
          interactiveSelection={null}
          onPickupChange={(p) => {
            setPickup(p.name);
            setPickupCoords(p);
          }}
          onDropChange={(d) => {
            setDrop(d.name);
            setDropCoords(d);
          }}
          height="100%"
          showControls={false}
          showNearbyDrivers={true}
          selectedVehicleType={selectedVehicle?.code}
          onDriverClick={(driver) => setActiveDriverPopup(driver)}
        />
      </div>

      {/* 2. Top Floating Navigation Bar (Matches screenshot directly) */}
      <div className="relative z-30 pt-4 px-4 w-full flex items-center justify-between gap-3 pointer-events-none">
        {/* Hamburger Menu with Red Alert Dot */}
        <button
          type="button"
          onClick={() => onOpenMenu?.()}
          className="w-12 h-12 rounded-full bg-white/95 backdrop-blur-md shadow-lg border border-[#DCDAF0] flex items-center justify-center text-[#0A0A14] hover:bg-white active:scale-95 transition-all cursor-pointer pointer-events-auto relative flex-shrink-0"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
          <span className="absolute top-2.5 left-2.5 w-2.5 h-2.5 rounded-full bg-[#EF2B3E] ring-2 ring-white" />
        </button>

        {/* Pickup Location Pill with Green Dot & Heart (Matches screenshot) */}
        <div 
          onClick={() => {
            setSearchQuery('');
            setIsPickupSearchOpen(true);
          }}
          className="flex-1 max-w-xl h-12 px-4 rounded-full bg-white/95 backdrop-blur-md shadow-lg border border-[#DCDAF0] flex items-center justify-between gap-3 cursor-pointer pointer-events-auto hover:bg-white transition-all group"
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] flex-shrink-0 animate-pulse" />
            <span className="text-xs font-bold text-[#0A0A14] truncate font-sans">
              {pickup || 'Dr. B.R. Ambedkar Station ...'}
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsFavorite(!isFavorite);
            }}
            className="p-1 rounded-full text-[#8E96A6] hover:text-[#EF2B3E] transition-colors cursor-pointer flex-shrink-0"
            title="Save location to favorites"
          >
            <Heart 
              className={`w-4 h-4 transition-transform ${isFavorite ? 'fill-[#EF2B3E] text-[#EF2B3E] scale-110' : ''}`} 
            />
          </button>
        </div>

        {/* Studio View Switcher / AI Assistant Pill */}
        <div className="flex items-center gap-2 pointer-events-auto flex-shrink-0">
          {onOpenAiBooking && (
            <button
              type="button"
              onClick={onOpenAiBooking}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2.5 rounded-full bg-[#3A4DFF] hover:bg-[#2A3DE8] text-white text-[11px] font-bold shadow-md transition-all cursor-pointer"
              title="Book with AI Voice or Natural Language"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>AI Booking</span>
            </button>
          )}

          {onToggleView && (
            <button
              type="button"
              onClick={onToggleView}
              className="p-2.5 rounded-full bg-white/95 backdrop-blur-md hover:bg-white text-[#5B5B73] hover:text-[#0A0A14] border border-[#DCDAF0] shadow-md transition-all cursor-pointer"
              title="Switch to Detailed Dashboard / 3D Stage View"
            >
              <SlidersHorizontal className="w-4 h-4 text-[#3A4DFF]" />
            </button>
          )}
        </div>
      </div>

      {/* Floating Active Driver Card (if user tapped a vehicle on map) */}
      {activeDriverPopup && (
        <div className="relative z-30 mx-4 mt-3 max-w-sm rounded-2xl bg-white/95 backdrop-blur-md p-3 border border-[#DCDAF0] shadow-xl flex items-center justify-between gap-3 animate-fade-in pointer-events-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#3A4DFF]/10 text-[#3A4DFF] flex items-center justify-center font-bold text-sm">
              {activeDriverPopup.type === 'auto' ? '🛺' : activeDriverPopup.type === 'cab' ? '🚗' : '🛵'}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs text-[#0A0A14]">{activeDriverPopup.name}</span>
                <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-full">
                  {activeDriverPopup.rating} ★
                </span>
              </div>
              <div className="text-[10px] text-[#5B5B73] font-mono">
                {activeDriverPopup.plate} · <b className="text-[#10B981]">~{activeDriverPopup.etaMin} min pickup</b>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveDriverPopup(null)}
            className="p-1 rounded-full text-[#8E96A6] hover:bg-black/5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 3. Bottom Area: Floating Drop Pill & Interactive Vehicle Selection Drawer */}
      <div className="relative z-30 mt-auto p-4 w-full flex flex-col gap-2.5 pointer-events-none">
        
        {/* Floating Drop Pill (Matches screenshot directly when not expanded) */}
        {!isDrawerExpanded && (
          <div className="w-full flex justify-center pointer-events-auto">
            <div
              onClick={() => {
                setSearchQuery('');
                setIsDropSearchOpen(true);
              }}
              className="w-full max-w-lg h-14 px-5 rounded-full bg-white shadow-2xl border border-[#DCDAF0] flex items-center gap-3.5 cursor-pointer hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all group"
            >
              <span className="w-3 h-3 rounded-full bg-[#EF2B3E] flex-shrink-0 animate-pulse" />
              <span className="text-sm font-medium text-[#5B5B73] group-hover:text-[#0A0A14] flex-1">
                {drop || 'Enter Drop Location'}
              </span>
              <Search className="w-4 h-4 text-[#8E96A6] group-hover:text-[#3A4DFF] transition-colors" />
            </div>
          </div>
        )}

        {/* Sliding Bottom Drawer for Ride Selection & Confirmation */}
        {isDrawerExpanded && (
          <div className="w-full max-w-2xl mx-auto rounded-[28px] bg-white/98 backdrop-blur-md p-4 sm:p-5 border border-[#DCDAF0] shadow-2xl pointer-events-auto animate-slide-up space-y-4">
            
            {/* Drawer Header: Destination Pill & Toggle */}
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#E9ECF2]">
              <div 
                onClick={() => {
                  setSearchQuery('');
                  setIsDropSearchOpen(true);
                }}
                className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity flex-1 min-w-0"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-[#EF2B3E] flex-shrink-0" />
                <div className="truncate">
                  <span className="text-[10px] text-[#8E96A6] uppercase font-bold block">DESTINATION</span>
                  <span className="text-xs font-bold text-[#0A0A14] truncate block">
                    {drop || 'Tap to set destination'}
                  </span>
                </div>
              </div>

              {/* Distance / ETA Pill */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="hud text-[10px] font-bold text-[#3A4DFF] bg-[#3A4DFF]/10 px-2.5 py-1 rounded-full">
                  {distanceKm} km · {durationMin} min
                </span>

                <button
                  type="button"
                  onClick={() => setIsDrawerExpanded(false)}
                  className="p-1.5 rounded-full hover:bg-[#F1F0FA] text-[#5B5B73]"
                  title="Minimize"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Vehicle Options Grid / Carousel */}
            <div>
              <div className="flex items-center justify-between text-[10px] font-bold text-[#8E96A6] uppercase mb-2">
                <span>SELECT SAWARI CATEGORY</span>
                <span className="text-emerald-600">15 LIVE CAPTAINS AVAILABLE</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {vehicles.map((v) => {
                  const isSelected = selectedVehicle?.code === v.code;
                  const fare = Math.round(v.baseFare + distanceKm * v.perKm);

                  return (
                    <div
                      key={v.id}
                      onClick={() => onSelectVehicle?.(v)}
                      className={`relative p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#3A4DFF] bg-[#3A4DFF]/5 shadow-sm ring-2 ring-[#3A4DFF]'
                          : 'border-[#DCDAF0] bg-white hover:border-[#8E96A6]'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-2xl">
                          {v.code === 'auto' ? '🛺' : v.code === 'cab' ? '🚗' : v.code === 'xl' ? '🚙' : '🛵'}
                        </span>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-[#3A4DFF] text-white flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </div>

                      <div className="mt-2">
                        <div className="font-bold text-xs text-[#0A0A14] truncate">{v.label}</div>
                        <div className="text-[10px] text-[#5B5B73] flex items-center gap-1 mt-0.5">
                          <Clock className="w-2.5 h-2.5 text-emerald-600" />
                          <span>{v.etaMin || 2}m away</span>
                        </div>
                        <div className="text-sm font-black font-mono text-[#0A0A14] mt-1.5">
                          ₹{fare}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Confirm Ride Big Button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={onConfirmRide}
                className="w-full py-4 rounded-full bg-[#FFC21A] hover:bg-[#e6ad12] text-[#0A0A14] font-bold text-xs sm:text-sm tracking-wide uppercase shadow-lg hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>CONFIRM {selectedVehicle?.label.toUpperCase() || 'RIDE'} · ₹{selectedFare}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Drop Location Search Modal / Drawer */}
      {isDropSearchOpen && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm p-4 flex items-end sm:items-center justify-center animate-fade-in pointer-events-auto">
          <div className="w-full max-w-lg bg-white rounded-[28px] border border-[#DCDAF0] p-5 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#E9ECF2]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EF2B3E]" />
                <h3 className="font-bold text-sm text-[#0A0A14]">Where are you going?</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDropSearchOpen(false)}
                className="p-1.5 rounded-full hover:bg-[#F1F0FA] text-[#5B5B73]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="mt-3 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Belagavi destination (e.g. Chennamma Circle)..."
                autoFocus
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#F8F9FD] border border-[#DCDAF0] text-xs font-semibold text-[#0A0A14] focus:outline-none focus:border-[#3A4DFF]"
              />
              <Search className="w-4 h-4 text-[#8E96A6] absolute left-3.5 top-3.5" />
            </div>

            {/* Quick Suggestions List */}
            <div className="mt-3 overflow-y-auto space-y-1.5 flex-1 pr-1">
              <span className="text-[10px] font-bold text-[#8E96A6] uppercase px-1 block">
                POPULAR BELAGAVI DESTINATIONS
              </span>
              {filteredLocations.map((loc) => (
                <div
                  key={loc.id}
                  onClick={() => handleSelectDrop(loc)}
                  className="p-3 rounded-xl hover:bg-[#F1F0FA] cursor-pointer flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-red-100 text-[#EF2B3E] flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#0A0A14]">{loc.name}</div>
                      <div className="text-[10px] text-[#5B5B73]">{loc.area}</div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#8E96A6]" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. Pickup Location Search Modal / Drawer */}
      {isPickupSearchOpen && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm p-4 flex items-end sm:items-center justify-center animate-fade-in pointer-events-auto">
          <div className="w-full max-w-lg bg-white rounded-[28px] border border-[#DCDAF0] p-5 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#E9ECF2]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                <h3 className="font-bold text-sm text-[#0A0A14]">Change Pickup Location</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPickupSearchOpen(false)}
                className="p-1.5 rounded-full hover:bg-[#F1F0FA] text-[#5B5B73]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="mt-3 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search pickup location in Belagavi..."
                autoFocus
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#F8F9FD] border border-[#DCDAF0] text-xs font-semibold text-[#0A0A14] focus:outline-none focus:border-[#3A4DFF]"
              />
              <Search className="w-4 h-4 text-[#8E96A6] absolute left-3.5 top-3.5" />
            </div>

            {/* Suggestions List */}
            <div className="mt-3 overflow-y-auto space-y-1.5 flex-1 pr-1">
              <span className="text-[10px] font-bold text-[#8E96A6] uppercase px-1 block">
                LOCATIONS
              </span>
              {filteredLocations.map((loc) => (
                <div
                  key={loc.id}
                  onClick={() => handleSelectPickup(loc)}
                  className="p-3 rounded-xl hover:bg-[#F1F0FA] cursor-pointer flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#0A0A14]">{loc.name}</div>
                      <div className="text-[10px] text-[#5B5B73]">{loc.area}</div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#8E96A6]" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
