import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  Navigation, 
  ArrowUpDown, 
  Sparkles, 
  Mic, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Shield, 
  Clock, 
  ArrowRight,
  Info
} from 'lucide-react';
import { MOCK_LOCATIONS } from '../mock/mockData';
import { useVehicle } from '../context/VehicleContext';
import VehicleMorphCanvas from '../three/VehicleMorphCanvas';

export default function Book() {
  const navigate = useNavigate();
  const { vehicles, selectedVehicle, selectVehicleByCode } = useVehicle();

  // Booking locations state
  const [pickup, setPickup] = useState(MOCK_LOCATIONS[0].name);
  const [drop, setDrop] = useState(MOCK_LOCATIONS[1].name);
  const [isPickupDropdownOpen, setIsPickupDropdownOpen] = useState(false);
  const [isDropDropdownOpen, setIsDropDropdownOpen] = useState(false);

  // AI Booking Prompt
  const [isAiMode, setIsAiMode] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiParsed, setAiParsed] = useState(null);

  // Breakdown accordion
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Calculated route metrics for Belagavi KLE Tech -> Chennamma Circle
  const distanceKm = 2.4;
  const durationMin = 8.0;

  // Swap locations
  const handleSwap = () => {
    const temp = pickup;
    setPickup(drop);
    setDrop(temp);
  };

  // AI parser simulation
  const handleAiParse = () => {
    if (!aiPrompt.trim()) return;
    setAiParsed({
      pickup: 'KLE Technological University',
      drop: 'Rani Chennamma Circle',
      preference: 'Cheapest Ride'
    });
    setPickup('KLE Technological University Campus');
    setDrop('Rani Chennamma Circle');
    selectVehicleByCode('bike'); // Bike is cheapest
  };

  // Confirm booking
  const handleConfirmRide = () => {
    navigate('/ride/live-trip-demo');
  };

  // Fare calculations
  const calculateFare = (v) => {
    const raw = v.baseFare + v.perKm * distanceKm + v.perMin * durationMin;
    return Math.max(v.minFare, Math.round(raw));
  };

  const selectedFare = calculateFare(selectedVehicle);

  return (
    <div className="relative w-full min-h-screen pt-24 pb-12 px-4 md:px-8 flex flex-col md:flex-row gap-8 max-w-7xl mx-auto">
      {/* Left Panel: Booking Console */}
      <div className="w-full md:w-[460px] bg-white rounded-[28px] border border-[#DCDAF0] p-6 shadow-[0_20px_60px_-20px_rgba(58,77,255,0.18)] flex flex-col justify-between z-10">
        <div>
          {/* Header & AI Toggle */}
          <div className="flex items-center justify-between pb-4 border-b border-[#DCDAF0]">
            <div>
              <span className="hud text-[10px] text-[#3A4DFF] font-bold">RIDE DISPATCH · BELAGAVI</span>
              <h2 className="text-xl font-bold text-[#0A0A14]">Where to?</h2>
            </div>
            <button
              onClick={() => setIsAiMode(!isAiMode)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
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
                  className="px-3 py-2 bg-[#3A4DFF] text-white text-xs font-semibold rounded-xl hover:bg-[#2b3cee]"
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
            {/* Pickup */}
            <div className="relative">
              <div className="flex items-center bg-[#F1F0FA] rounded-[16px] px-3.5 py-3 border border-transparent focus-within:border-[#3A4DFF]">
                <span className="w-3 h-3 rounded-full bg-emerald-500 mr-3 flex-shrink-0" />
                <input
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  onFocus={() => setIsPickupDropdownOpen(true)}
                  placeholder="Pickup location"
                  className="w-full bg-transparent text-xs sm:text-sm font-medium outline-none text-[#0A0A14]"
                />
              </div>

              {/* Pickup Suggestions */}
              {isPickupDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl border border-[#DCDAF0] shadow-xl z-30 p-2 space-y-1">
                  {MOCK_LOCATIONS.map((loc) => (
                    <button
                      key={loc.id}
                      onClick={() => {
                        setPickup(loc.name);
                        setIsPickupDropdownOpen(false);
                      }}
                      className="w-full text-left p-2 hover:bg-[#F1F0FA] rounded-xl flex items-start gap-2"
                    >
                      <MapPin className="w-4 h-4 text-[#3A4DFF] mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-[#0A0A14]">{loc.name}</p>
                        <p className="text-[10px] text-[#5B5B73]">{loc.area}</p>
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
                className="w-7 h-7 rounded-full bg-white border border-[#DCDAF0] shadow-sm flex items-center justify-center hover:bg-[#F1F0FA] transition-colors"
                title="Swap locations"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-[#5B5B73]" />
              </button>
            </div>

            {/* Drop */}
            <div className="relative">
              <div className="flex items-center bg-[#F1F0FA] rounded-[16px] px-3.5 py-3 border border-transparent focus-within:border-[#3A4DFF]">
                <span className="w-3 h-3 rounded-full bg-[#EF2B3E] mr-3 flex-shrink-0" />
                <input
                  value={drop}
                  onChange={(e) => setDrop(e.target.value)}
                  onFocus={() => setIsDropDropdownOpen(true)}
                  placeholder="Destination in Belagavi"
                  className="w-full bg-transparent text-xs sm:text-sm font-medium outline-none text-[#0A0A14]"
                />
              </div>

              {/* Drop Suggestions */}
              {isDropDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl border border-[#DCDAF0] shadow-xl z-30 p-2 space-y-1">
                  {MOCK_LOCATIONS.map((loc) => (
                    <button
                      key={loc.id}
                      onClick={() => {
                        setDrop(loc.name);
                        setIsDropDropdownOpen(false);
                      }}
                      className="w-full text-left p-2 hover:bg-[#F1F0FA] rounded-xl flex items-start gap-2"
                    >
                      <MapPin className="w-4 h-4 text-[#EF2B3E] mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-[#0A0A14]">{loc.name}</p>
                        <p className="text-[10px] text-[#5B5B73]">{loc.area}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Distance and ETA row */}
          <div className="flex items-center justify-between px-2 py-1.5 text-xs text-[#5B5B73]">
            <span className="hud font-bold text-[#0A0A14]">ROUTE: {distanceKm} KM · ~{durationMin} MINS</span>
            <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Optimal Traffic
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
                    <div className="w-10 h-10 rounded-xl bg-white border border-[#DCDAF0] flex items-center justify-center font-bold text-xs text-[#3A4DFF]">
                      {v.code === 'cab' ? 'CAB' : v.code === 'bike' ? 'BIKE' : 'AUTO'}
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
                    <span className="block text-[9px] text-[#8E96A6]">FIXED PRICE</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Fare breakdown collapsible */}
          <div className="border-t border-[#DCDAF0] pt-3">
            <button
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="w-full flex items-center justify-between text-xs text-[#5B5B73] hover:text-[#0A0A14] py-1"
            >
              <span className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-[#3A4DFF]" /> View transparent fare breakdown
              </span>
              {showBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showBreakdown && (
              <div className="mt-2 p-3 bg-[#F1F0FA] rounded-xl text-xs space-y-1.5 text-[#5B5B73]">
                <div className="flex justify-between">
                  <span>Base fare ({selectedVehicle.label})</span>
                  <span>₹{selectedVehicle.baseFare}</span>
                </div>
                <div className="flex justify-between">
                  <span>Distance ({distanceKm} km × ₹{selectedVehicle.perKm}/km)</span>
                  <span>₹{(distanceKm * selectedVehicle.perKm).toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Time ({durationMin} min × ₹{selectedVehicle.perMin}/min)</span>
                  <span>₹{(durationMin * selectedVehicle.perMin).toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform safety fee</span>
                  <span>₹2.0</span>
                </div>
                <div className="flex justify-between font-bold text-[#0A0A14] pt-1 border-t border-[#DCDAF0]">
                  <span>Total Payable</span>
                  <span>₹{selectedFare}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Big Action Pill Button */}
        <div className="mt-6 pt-2">
          <button
            onClick={handleConfirmRide}
            className="w-full py-4 rounded-full bg-[#FFC21A] hover:bg-[#e6ad12] text-[#0A0A14] font-bold text-sm tracking-wide uppercase shadow-md hover:shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <span>CONFIRM {selectedVehicle.label.toUpperCase()} · ₹{selectedFare}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Right Area: Interactive Map & Live Synced 3D Vehicle Stage */}
      <div className="flex-1 flex flex-col gap-6">
        {/* Map Simulation Card */}
        <div className="relative w-full h-[360px] md:h-[420px] rounded-[28px] overflow-hidden border border-[#DCDAF0] bg-[#E9ECF2] shadow-sm flex flex-col justify-between p-6">
          {/* Muted OpenStreetMap style SVG canvas simulation */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#E9ECF2] via-[#F1F0FA] to-[#C9CFDA] opacity-80" />
          
          {/* Simulated Street Grid Lines */}
          <svg className="absolute inset-0 w-full h-full stroke-[#C9CFDA] opacity-40 pointer-events-none">
            <line x1="0" y1="120" x2="100%" y2="120" strokeWidth="6" />
            <line x1="0" y1="260" x2="100%" y2="260" strokeWidth="8" />
            <line x1="160" y1="0" x2="160" y2="100%" strokeWidth="6" />
            <line x1="380" y1="0" x2="380" y2="100%" strokeWidth="8" />
            
            {/* Thick Blue Route Line */}
            <path
              d="M 160 260 Q 280 220 380 120"
              fill="none"
              stroke="#3A4DFF"
              strokeWidth="6"
              strokeLinecap="round"
              className="drop-shadow-md"
            />
          </svg>

          {/* Map Top Status Pill */}
          <div className="relative z-10 flex items-center justify-between">
            <span className="hud bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[#0A0A14] border border-[#DCDAF0] shadow-sm font-bold text-[10px]">
              BELAGAVI ROAD NETWORK · OSRM ROUTING
            </span>
            <div className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-[#3A4DFF] border border-[#DCDAF0]">
              2.4 km fastest path
            </div>
          </div>

          {/* Map Route Pins */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="bg-white px-3 py-1.5 rounded-xl border border-[#DCDAF0] shadow-md flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-bold text-[#0A0A14]">{pickup.split(',')[0]}</span>
            </div>

            <div className="bg-white px-3 py-1.5 rounded-xl border border-[#DCDAF0] shadow-md flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EF2B3E]" />
              <span className="text-xs font-bold text-[#0A0A14]">{drop.split(',')[0]}</span>
            </div>
          </div>
        </div>

        {/* 3D Morph Stage synced with chosen vehicle */}
        <div className="w-full bg-white rounded-[28px] border border-[#DCDAF0] p-6 shadow-sm flex flex-col items-center">
          <div className="w-full flex items-center justify-between text-xs pb-2 border-b border-[#DCDAF0]">
            <span className="hud text-[#3A4DFF] font-bold">
              3D VEHICLE VIEW: {selectedVehicle.label.toUpperCase()}
            </span>
            <span className="hud text-[#8E96A6]">
              REAL-TIME PARTICLE MORPH ACTIVE
            </span>
          </div>
          <div className="w-full">
            <VehicleMorphCanvas compact={true} />
          </div>
        </div>
      </div>
    </div>
  );
}
