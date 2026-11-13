import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  MapPin, 
  ArrowUpDown, 
  Clock, 
  Sparkles,
  Zap,
  ShieldCheck
} from 'lucide-react';
import VehicleMorphCanvas from '../../three/VehicleMorphCanvas';
import DotGrid from '../ui/DotGrid';
import { useVehicle } from '../../context/VehicleContext';
import { useLanguage } from '../../context/LanguageContext';
import { MOCK_LOCATIONS } from '../../mock/mockData';

export default function HeroStage() {
  const navigate = useNavigate();
  const { vehicles, selectedVehicle, selectVehicleByCode } = useVehicle();
  const { t, lang } = useLanguage();

  // Central location inputs state
  const [pickup, setPickup] = useState('KLE Technological University Campus');
  const [drop, setDrop] = useState('Rani Chennamma Circle');
  const [isPickupOpen, setIsPickupOpen] = useState(false);
  const [isDropOpen, setIsDropOpen] = useState(false);

  const currentIndex = vehicles.findIndex((v) => v.code === selectedVehicle?.code) + 1;
  const isRickshaw = selectedVehicle?.code === 'auto';

  // Swap pickup & destination
  const handleSwap = () => {
    const temp = pickup;
    setPickup(drop);
    setDrop(temp);
  };

  // Launch into booking: save selected vehicle & navigate to booking screen
  const handleProceed = () => {
    const code = selectedVehicle?.code || 'auto';
    localStorage.setItem('mysawari_selected_vehicle', code);
    navigate('/book', {
      state: {
        pickup,
        drop,
        vehicleCode: code
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

      {/* Top HUD Row - Coordinates and backend tag removed per user request */}
      <div className="w-full max-w-7xl flex items-center justify-between text-xs text-[#5B5B73] z-10 pt-4">
        <div className="flex items-center gap-3">
          <span className="hud px-2.5 py-1 rounded-md bg-white/70 backdrop-blur-md border border-[#DCDAF0] text-[#3A4DFF] font-semibold">
            VEHICLE 0{currentIndex || 1}/0{vehicles.length} · {selectedVehicle?.label?.toUpperCase() || 'RIDE'}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 bg-white/70 backdrop-blur-md px-3 py-1 rounded-full border border-[#DCDAF0]">
            <span className="w-2 h-2 rounded-full bg-[#FFC21A] animate-ping" />
            <span className="hud font-bold text-[#0A0A14]">{t('liveEta')}: {selectedVehicle?.etaMin || 3} {t('min')}</span>
          </div>
        </div>
      </div>

      {/* Main Center Stage with 3D Vehicle Slider */}
      <div className="relative w-full max-w-5xl my-auto flex flex-col items-center justify-center text-center z-10">
        {/* Headline */}
        <div className="space-y-2 mb-1 select-none">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-[-0.04em] text-[#0A0A14] leading-[0.98]">
            One tap. <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0A0A14] via-[#3A4DFF] to-[#0A0A14]">
              Any ride.
            </span>
          </h1>
        </div>

        {/* The Three.js Vehicle Slider Stage (cab, xl, auto, bike) */}
        <div className="w-full relative">
          <VehicleMorphCanvas />
        </div>

        {/* If user slides and rickshaw comes (or for active vehicle), put enter pickup and destination input below that */}
        <div className="w-full max-w-2xl mt-4 z-20">
          {/* Rickshaw Special Alert Banner */}
          {isRickshaw && (
            <div className="mb-3 p-3 rounded-2xl bg-gradient-to-r from-[#F59E0B]/20 via-[#FFC21A]/15 to-transparent border border-[#F59E0B]/30 flex items-center justify-between text-left animate-fade-in shadow-sm">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">🛺</span>
                <div>
                  <h4 className="text-xs font-bold text-[#0A0A14]">{t('autoActiveBanner')}</h4>
                  <p className="text-[10px] text-[#5B5B73]">{t('autoTagline')}</p>
                </div>
              </div>
              <span className="hud text-[10px] px-2 py-0.5 rounded-full bg-[#F59E0B] text-black font-bold">
                ₹30 BASE
              </span>
            </div>
          )}

          {/* Pickup and Destination Input Card directly below the 3D slider */}
          <div className={`p-4 sm:p-6 rounded-[28px] bg-white border shadow-[0_25px_70px_-20px_rgba(58,77,255,0.22)] text-left space-y-4 transition-all ${
            isRickshaw ? 'border-[#F59E0B]/50 ring-2 ring-[#F59E0B]/20' : 'border-[#DCDAF0]'
          }`}>
            <div className="flex items-center justify-between pb-2 border-b border-[#DCDAF0]">
              <span className="hud text-[11px] text-[#3A4DFF] font-bold flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>{t('whereTo').toUpperCase()}</span>
              </span>
              <span className="text-xs text-[#5B5B73] font-medium">
                Selected: <strong className="text-[#0A0A14]">{selectedVehicle?.label}</strong> ({selectedVehicle?.tag})
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
                    placeholder={t('pickupPlaceholder')}
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
                  className="w-7 h-7 rounded-full bg-white border border-[#DCDAF0] shadow-sm flex items-center justify-center hover:bg-[#F1F0FA] transition-colors cursor-pointer"
                  title={t('swap')}
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
                    placeholder={t('dropPlaceholder')}
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

            {/* Quick Chips & Book Now CTA */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] hud text-[#8E96A6] mr-1">QUICK:</span>
                {MOCK_LOCATIONS.slice(0, 3).map((loc) => (
                  <button
                    key={loc.id}
                    onClick={() => setDrop(loc.name)}
                    className="text-[11px] px-2.5 py-1 bg-[#F1F0FA] hover:bg-[#E9ECF2] text-[#0A0A14] rounded-full transition-colors cursor-pointer"
                  >
                    {loc.name.split(' ')[0]}
                  </button>
                ))}
              </div>

              <button
                onClick={handleProceed}
                className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-[#0A0A14] hover:bg-[#3A4DFF] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <span>{t('bookNow')} ({selectedVehicle?.label})</span>
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
