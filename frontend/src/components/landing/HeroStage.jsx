import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, MapPin, Navigation, Clock, ShieldCheck, Zap } from 'lucide-react';
import VehicleMorphCanvas from '../../three/VehicleMorphCanvas';
import DotGrid from '../ui/DotGrid';
import { useVehicle } from '../../context/VehicleContext';

export default function HeroStage() {
  const navigate = useNavigate();
  const { vehicles, selectedVehicle, selectVehicleByCode } = useVehicle();

  const currentIndex = vehicles.findIndex((v) => v.code === selectedVehicle.code) + 1;

  // Estimated fare for Belagavi local trip (KLE Tech to Chennamma Circle 2.4 km)
  const estFare = Math.max(
    selectedVehicle.minFare,
    Math.round(selectedVehicle.baseFare + selectedVehicle.perKm * 2.4 + selectedVehicle.perMin * 8)
  );

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

        {/* RAPIDO-STYLE CENTRAL HIGHLIGHTED BOOKING BAR */}
        <div className="w-full max-w-2xl mt-8 z-20">
          <div className="p-4 sm:p-5 rounded-[26px] bg-white border-2 border-[#FFC21A] shadow-[0_20px_60px_-15px_rgba(255,194,26,0.35)] flex flex-col sm:flex-row items-center justify-between gap-4 transition-all hover:scale-[1.01]">
            {/* Left: Route & Vehicle snapshot */}
            <div className="flex items-center gap-3 text-left w-full sm:w-auto">
              <div className="w-12 h-12 rounded-2xl bg-[#F1F0FA] flex items-center justify-center font-bold text-sm text-[#3A4DFF] flex-shrink-0 border border-[#DCDAF0]">
                {selectedVehicle.code.toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base text-[#0A0A14]">{selectedVehicle.label}</span>
                  <span className="text-xs px-2 py-0.5 bg-[#FFC21A]/20 text-[#0A0A14] font-bold rounded-full">
                    {selectedVehicle.tag}
                  </span>
                </div>
                <p className="text-xs text-[#5B5B73] flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> KLE Tech Campus → Chennamma Circle
                </p>
              </div>
            </div>

            {/* Right: Giant Highlighted Rapido Amber Action Button */}
            <button
              onClick={() => navigate('/book')}
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#FFC21A] hover:bg-[#f0b207] text-[#0A0A14] font-black text-sm tracking-wider uppercase shadow-[0_10px_25px_-5px_rgba(255,194,26,0.6)] hover:shadow-[0_15px_35px_-5px_rgba(255,194,26,0.8)] transition-all transform active:scale-95 flex items-center justify-center gap-3 select-none cursor-pointer flex-shrink-0"
            >
              <span>BOOK NOW · ₹{estFare}</span>
              <span className="w-6 h-6 rounded-full bg-black/10 flex items-center justify-center">
                <ArrowRight className="w-4 h-4 text-[#0A0A14]" />
              </span>
            </button>
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
          <span>CUSTOM ROUTE PICKER</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  );
}
