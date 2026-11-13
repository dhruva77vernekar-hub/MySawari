import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, ShieldCheck, Zap } from 'lucide-react';
import VehicleMorphCanvas from '../../three/VehicleMorphCanvas';
import { useVehicle } from '../../context/VehicleContext';

export default function HeroStage() {
  const { vehicles, selectedVehicle, selectVehicleByCode, activeChapter } = useVehicle();

  return (
    <section className="relative min-h-[90vh] md:min-h-screen pt-28 pb-16 px-6 flex flex-col items-center justify-between overflow-hidden bg-gradient-to-b from-[#E9ECF2] via-[#F1F0FA] to-[#F1F0FA]">
      {/* Top HUD Row */}
      <div className="w-full max-w-7xl flex items-center justify-between text-xs text-[#5B5B73] z-10 pt-4">
        <div className="flex items-center gap-3">
          <span className="hud px-2.5 py-1 rounded-md bg-white/70 border border-[#DCDAF0] text-[#3A4DFF] font-semibold">
            {activeChapter === 'cab' ? 'MODEL 01/03' : activeChapter === 'bike' ? 'MODEL 02/03' : 'MODEL 03/03'}
          </span>
          <span className="hud hidden sm:inline text-[#8E96A6]">
            COORD: 15.8497° N, 74.4977° E (BELAGAVI)
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 bg-white/70 px-3 py-1 rounded-full border border-[#DCDAF0]">
            <span className="w-2 h-2 rounded-full bg-[#FFC21A] animate-ping" />
            <span className="hud font-bold text-[#0A0A14]">LIVE ETA: {selectedVehicle.etaMin} MIN</span>
          </div>
        </div>
      </div>

      {/* Main Center Stage with Particle Vehicle */}
      <div className="relative w-full max-w-5xl my-auto flex flex-col items-center justify-center text-center">
        {/* Igloo-style Headline */}
        <div className="space-y-2 mb-2 select-none">
          <span className="hud text-xs md:text-sm text-[#3A4DFF] tracking-[0.2em] font-semibold uppercase">
            PHYSICAL 3D RIDE SELECTOR
          </span>
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-bold tracking-[-0.04em] text-[#0A0A14] leading-[0.95]">
            One tap. <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0A0A14] via-[#3A4DFF] to-[#0A0A14]">
              Any ride.
            </span>
          </h1>
          <p className="text-sm md:text-base text-[#5B5B73] max-w-md mx-auto pt-2 font-medium">
            Touch or scroll to morph between Cab, Bike Taxi, and Scooter. Fares compared side-by-side before you book.
          </p>
        </div>

        {/* The 3D Morph Canvas Container */}
        <div className="w-full relative">
          <VehicleMorphCanvas />
        </div>

        {/* Vehicle Morph Selector Chips */}
        <div className="z-10 -mt-6 sm:-mt-8 flex items-center gap-2 p-1.5 bg-white/80 backdrop-blur-md rounded-full border border-[#DCDAF0] shadow-lg">
          {vehicles.map((v) => {
            const isActive = selectedVehicle.code === v.code;
            return (
              <button
                key={v.id}
                onClick={() => selectVehicleByCode(v.code)}
                className={`px-5 sm:px-8 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-semibold tracking-wider transition-all duration-300 flex items-center gap-2 ${
                  isActive
                    ? 'bg-[#0A0A14] text-white shadow-md scale-105'
                    : 'text-[#5B5B73] hover:text-[#0A0A14] hover:bg-black/5'
                }`}
              >
                <span>{v.label.toUpperCase()}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${isActive ? 'bg-[#3A4DFF] text-white' : 'bg-[#E9ECF2] text-[#5B5B73]'}`}>
                  {v.tag}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Floating Bar */}
      <div className="w-full max-w-7xl flex items-center justify-between text-xs text-[#5B5B73] z-10 pt-6">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#3A4DFF]" />
          <span className="hud text-[#0A0A14]">BELAGAVI CITY PILOT</span>
          <span className="text-[#8E96A6]">· KLE Tech to Chennamma Circle from ₹30</span>
        </div>

        <Link
          to="/book"
          className="group px-6 py-3 rounded-full bg-white hover:bg-[#3A4DFF] hover:text-white border border-[#DCDAF0] hover:border-[#3A4DFF] text-[#0A0A14] font-semibold text-xs tracking-wider uppercase transition-all shadow-sm flex items-center gap-2"
        >
          <span>SKIP TO BOOK</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  );
}
