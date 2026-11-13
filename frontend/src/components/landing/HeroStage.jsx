import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  MapPin, 
  Navigation, 
  ArrowUpDown, 
  Clock, 
  Search,
  Check
} from 'lucide-react';
import VehicleMorphCanvas from '../../three/VehicleMorphCanvas';
import DotGrid from '../ui/DotGrid';
import { useVehicle } from '../../context/VehicleContext';
import { MOCK_LOCATIONS } from '../../mock/mockData';

export default function HeroStage() {
  const navigate = useNavigate();
  const { vehicles, selectedVehicle, selectVehicleByCode } = useVehicle();

  // Central location inputs state
  const [pickup, setPickup] = useState('KLE Technological University Campus');
  const [drop, setDrop] = useState('Rani Chennamma Circle');
  const [isPickupOpen, setIsPickupOpen] = useState(false);
  const [isDropOpen, setIsDropOpen] = useState(false);

  const currentIndex = vehicles.findIndex((v) => v.code === selectedVehicle.code) + 1;

  // Swap pickup & destination
  const handleSwap = () => {
    const temp = pickup;
    setPickup(drop);
    setDrop(temp);
  };

  // Launch into booking with current locations & vehicle
  const handleProceed = () => {
    navigate('/book', {
      state: {
        pickup,
        drop,
        vehicleCode: selectedVehicle.code
      }
    });
  };

  return (
    <section className="relative min-h-[95vh] md:min-h-screen pt-28 pb-16 px-4 md:px-6 flex flex-col items-center justify-between overflow-hidden bg-gradient-to-b from-[#E9ECF2] via-[#F1F0FA] to-[#F1F0FA]">
      {/* Interactive DotGrid Background (React Bits) */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-60">
        <DotGrid
          baseColor="#C9CFDA"
          activeColor="#3A4DFF"
          shape="circle"
          dotSize={4}
          gap={24}
          proximity={140}
          strength={1.2}
          bounce={0.5}
          tension={0.35}
          returnDuration={0.7}
          shockRadius={320}
          shockStrength={4.5}
          swell={0.8}
          stretch={0.4}
          glow={0.5}
          fade={0.25}
          intro={true}
          mouseInteraction={true}
          clickShock={true}
        />
      </div>

      {/* Top HUD Row */}
      <div className="w-full max-w-7xl flex items-center justify-between text-xs text-[#5B5B73] z-10 pt-4">
        <div className="flex items-center gap-3">
          <span className="hud px-2.5 py-1 rounded-md bg-white/70 backdrop-blur-md border border-[#DCDAF0] text-[#3A4DFF] font-semibold">
            VEHICLE 0{currentIndex}/0{vehicles.length} · {selectedVehicle.label.toUpperCase()}
          </span>
          <span className="hud hidden sm:inline text-[#8E96A6]">
            COORD: 15.8497° N, 74.4977° E (BELAGAVI)
          </span>
          <span className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            BACKEND v3.0 LIVE :4000
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 bg-white/70 backdrop-blur-md px-3 py-1 rounded-full border border-[#DCDAF0]">
            <span className="w-2 h-2 rounded-full bg-[#FFC21A] animate-ping" />
            <span className="hud font-bold text-[#0A0A14]">LIVE ETA: {selectedVehicle.etaMin} MIN</span>
          </div>
        </div>
      </div>

      {/* Main Center Stage with Particle Vehicle */}
      <div className="relative w-full max-w-5xl my-auto flex flex-col items-center justify-center text-center z-10">
        {/* Igloo-style Headline */}
        <div className="space-y-2 mb-2 select-none">
          <span className="hud text-xs md:text-sm text-[#3A4DFF] tracking-[0.2em] font-semibold uppercase">
            BELAGAVI'S FIRST 3D RIDE PLATFORM
          </span>
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-bold tracking-[-0.04em] text-[#0A0A14] leading-[0.95]">
            One tap. <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0A0A14] via-[#3A4DFF] to-[#0A0A14]">
              Any ride.
            </span>
          </h1>
          <p className="text-sm md:text-base text-[#5B5B73] max-w-lg mx-auto pt-2 font-medium">
            Touch or select any vehicle below to watch the live particle transformation.
          </p>
        </div>

        {/* The 3D Morph Canvas Container */}
        <div className="w-full relative">
          <VehicleMorphCanvas />
        </div>

        {/* 6-Vehicle Morph Selector Chips (Scrollable) */}
        <div className="z-10 -mt-6 sm:-mt-8 flex items-center gap-2 p-2 bg-white/85 backdrop-blur-md rounded-full border border-[#DCDAF0] shadow-xl max-w-full overflow-x-auto scrollbar-none">
          {vehicles.map((v) => {
            const isActive = selectedVehicle.code === v.code;
            return (
              <button
                key={v.id}
                onClick={() => selectVehicleByCode(v.code)}
                className={`px-4 sm:px-6 py-2.5 rounded-full text-xs sm:text-sm font-semibold tracking-wider whitespace-nowrap transition-all duration-300 flex items-center gap-2 ${
                  isActive
                    ? 'bg-[#0A0A14] text-white shadow-md scale-105'
                    : 'text-[#5B5B73] hover:text-[#0A0A14] hover:bg-black/5'
                }`}
              >
                <span>{v.label.toUpperCase()}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${isActive ? 'bg-[#3A4DFF] text-white' : 'bg-[#E9ECF2] text-[#5B5B73]'}`}>
                  {v.tag}
                </span>
              </button>
            );
          })}
        </div>

        {/* MAIN THING: FRONT & CENTER PICKUP & DESTINATION INPUT CARD */}
        <div className="w-full max-w-2xl mt-8 z-20">
          <div className="p-4 sm:p-6 rounded-[28px] bg-white border border-[#DCDAF0] shadow-[0_25px_70px_-20px_rgba(58,77,255,0.22)] text-left space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#DCDAF0]">
              <span className="hud text-[11px] text-[#3A4DFF] font-bold">
                ENTER PICKUP & DESTINATION
              </span>
              <span className="text-xs text-[#5B5B73] font-medium">
                Active Ride: <strong className="text-[#0A0A14]">{selectedVehicle.label}</strong>
              </span>
            </div>

            {/* Inputs Container */}
            <div className="relative space-y-2">
              {/* Pickup Input */}
              <div className="relative">
                <div className="flex items-center bg-[#F1F0FA] rounded-[18px] px-4 py-3.5 border border-transparent focus-within:border-[#3A4DFF] focus-within:bg-white transition-all shadow-sm">
                  <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 mr-3 flex-shrink-0" />
                  <input
                    value={pickup}
                    onChange={(e) => setPickup(e.target.value)}
                    onFocus={() => setIsPickupOpen(true)}
                    placeholder="Enter pickup location (Starting point)"
                    className="w-full bg-transparent text-sm font-medium outline-none text-[#0A0A14] placeholder:text-[#8E96A6]"
                  />
                </div>

                {isPickupOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl border border-[#DCDAF0] shadow-2xl z-30 p-2 space-y-1">
                    <span className="hud text-[10px] text-[#8E96A6] px-2 py-1 block">BELAGAVI LANDMARKS</span>
                    {MOCK_LOCATIONS.map((loc) => (
                      <button
                        key={loc.id}
                        onClick={() => {
                          setPickup(loc.name);
                          setIsPickupOpen(false);
                        }}
                        className="w-full text-left p-2.5 hover:bg-[#F1F0FA] rounded-xl flex items-start gap-2.5 transition-colors"
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
              <div className="flex justify-end pr-5 -my-2.5 relative z-10">
                <button
                  onClick={handleSwap}
                  className="w-7 h-7 rounded-full bg-white border border-[#DCDAF0] shadow-sm flex items-center justify-center hover:bg-[#F1F0FA] transition-colors"
                  title="Swap locations"
                >
                  <ArrowUpDown className="w-3.5 h-3.5 text-[#5B5B73]" />
                </button>
              </div>

              {/* Destination Input */}
              <div className="relative">
                <div className="flex items-center bg-[#F1F0FA] rounded-[18px] px-4 py-3.5 border border-transparent focus-within:border-[#3A4DFF] focus-within:bg-white transition-all shadow-sm">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#EF2B3E] mr-3 flex-shrink-0" />
                  <input
                    value={drop}
                    onChange={(e) => setDrop(e.target.value)}
                    onFocus={() => setIsDropOpen(true)}
                    placeholder="Enter drop destination"
                    className="w-full bg-transparent text-sm font-medium outline-none text-[#0A0A14] placeholder:text-[#8E96A6]"
                  />
                </div>

                {isDropOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl border border-[#DCDAF0] shadow-2xl z-30 p-2 space-y-1">
                    <span className="hud text-[10px] text-[#8E96A6] px-2 py-1 block">BELAGAVI LANDMARKS</span>
                    {MOCK_LOCATIONS.map((loc) => (
                      <button
                        key={loc.id}
                        onClick={() => {
                          setDrop(loc.name);
                          setIsDropOpen(false);
                        }}
                        className="w-full text-left p-2.5 hover:bg-[#F1F0FA] rounded-xl flex items-start gap-2.5 transition-colors"
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

            {/* Quick chips & Action Button */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] hud text-[#8E96A6] mr-1">QUICK:</span>
                {MOCK_LOCATIONS.slice(0, 3).map((loc) => (
                  <button
                    key={loc.id}
                    onClick={() => setDrop(loc.name)}
                    className="text-[11px] px-2.5 py-1 bg-[#F1F0FA] hover:bg-[#E9ECF2] text-[#0A0A14] rounded-full transition-colors"
                  >
                    {loc.name.split(' ')[0]}
                  </button>
                ))}
              </div>

              <button
                onClick={handleProceed}
                className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-[#0A0A14] hover:bg-[#3A4DFF] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
              >
                <span>Find {selectedVehicle.label}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Floating Bar */}
      <div className="w-full max-w-7xl flex items-center justify-between text-xs text-[#5B5B73] z-10 pt-6">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#3A4DFF]" />
          <span className="hud text-[#0A0A14]">BELAGAVI CITY NETWORK</span>
          <span className="text-[#8E96A6]">· Zero Surge Upfront Pricing</span>
        </div>

        <Link
          to="/book"
          className="group px-6 py-3 rounded-full bg-white hover:bg-[#3A4DFF] hover:text-white border border-[#DCDAF0] hover:border-[#3A4DFF] text-[#0A0A14] font-semibold text-xs tracking-wider uppercase transition-all shadow-sm flex items-center gap-2"
        >
          <span>FULL MAP VIEW</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  );
}
