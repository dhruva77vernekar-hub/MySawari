import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Users, Zap, Clock } from 'lucide-react';
import Card from '../ui/Card';
import { useVehicle } from '../../context/VehicleContext';

export default function VehicleComparisonCards() {
  const { vehicles, selectVehicleByCode } = useVehicle();
  const navigate = useNavigate();

  const handleSelectAndBook = (code) => {
    selectVehicleByCode(code);
    navigate('/book');
  };

  return (
    <section className="py-24 px-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <span className="hud text-xs text-[#3A4DFF] tracking-widest block mb-2 font-semibold">
            01 / LIVE MULTI-MODAL FLEET
          </span>
          <h2 className="text-3xl sm:text-5xl font-semibold tracking-[-0.03em] text-[#0A0A14]">
            Compare 6 urban vehicle choices.
          </h2>
        </div>
        <p className="text-sm sm:text-base text-[#5B5B73] max-w-md">
          Transparent, upfront fares with zero surge surprises. Select any vehicle to trigger the physical particle morph.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {vehicles.map((v) => (
          <Card
            key={v.id}
            onClick={() => handleSelectAndBook(v.code)}
            className="p-8 cursor-pointer group flex flex-col justify-between hover:border-[#3A4DFF] transition-all"
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="hud text-xs text-[#3A4DFF] bg-[#F1F0FA] px-3 py-1 rounded-full font-bold">
                  {v.tag}
                </span>
                <span className="w-10 h-10 rounded-full border border-[#DCDAF0] flex items-center justify-center group-hover:bg-[#3A4DFF] group-hover:text-white group-hover:border-[#3A4DFF] transition-all">
                  <ArrowUpRight className="w-5 h-5" />
                </span>
              </div>

              <h3 className="text-2xl font-bold text-[#0A0A14] tracking-tight mb-1">
                {v.label}
              </h3>
              <p className="text-sm text-[#5B5B73] mb-6">{v.tagline}</p>

              <div className="space-y-3 py-4 border-y border-[#DCDAF0] text-xs text-[#5B5B73]">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#8E96A6]" /> Capacity
                  </span>
                  <span className="font-semibold text-[#0A0A14]">{v.seats} Passenger{v.seats > 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#8E96A6]" /> Pickup ETA
                  </span>
                  <span className="font-semibold text-[#0A0A14]">~{v.etaMin} mins</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#8E96A6]" /> Base Fare
                  </span>
                  <span className="font-semibold text-[#0A0A14]">₹{v.baseFare}</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 flex items-center justify-between">
              <div>
                <span className="hud text-[10px] text-[#8E96A6] block">SAMPLE 2.4 KM TRIP</span>
                <span className="text-2xl font-bold text-[#0A0A14]">
                  ₹{Math.max(v.minFare, Math.round(v.baseFare + v.perKm * 2.4 + v.perMin * 8))}
                </span>
              </div>

              <button className="px-5 py-2.5 rounded-full bg-[#0A0A14] text-white text-xs font-semibold group-hover:bg-[#3A4DFF] transition-colors">
                Select {v.label}
              </button>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
