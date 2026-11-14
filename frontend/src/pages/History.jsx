import React from 'react';
import { Clock, MapPin, Receipt, Star, ArrowUpRight } from 'lucide-react';
import Card from '../components/ui/Card';
import { MOCK_RIDE_HISTORY } from '../mock/mockData';

export default function History() {
  return (
    <div className="min-h-screen pt-24 pb-16 px-4 md:px-8 max-w-4xl mx-auto space-y-6">
      <div className="pb-4 border-b border-[#DCDAF0]">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="MySawari" className="w-9 h-9 rounded-xl object-contain shadow-xs" />
          <div>
            <span className="hud text-xs text-[#3A4DFF] font-bold">RIDER ACTIVITY</span>
            <h1 className="text-3xl font-bold text-[#0A0A14]">Your Ride History</h1>
          </div>
        </div>
        <p className="text-xs text-[#5B5B73] mt-1">Review your recent Belagavi commutes, receipts, and ratings.</p>
      </div>

      <div className="space-y-4">
        {MOCK_RIDE_HISTORY.map((ride) => (
          <Card key={ride.id} className="p-6 hover:border-[#3A4DFF]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#DCDAF0] gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#F1F0FA] text-[#3A4DFF] flex items-center justify-center font-bold text-xs">
                  {ride.vehicleCode.toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#0A0A14]">{ride.vehicle}</h3>
                  <p className="text-xs text-[#5B5B73]">{ride.date}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    ride.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-red-100 text-[#EF2B3E]'
                  }`}
                >
                  {ride.status}
                </span>
                <span className="text-xl font-bold font-mono text-[#0A0A14]">₹{ride.fare}</span>
              </div>
            </div>

            <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[#5B5B73]">
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] text-[#8E96A6] block uppercase font-mono">Pickup</span>
                    <span className="font-medium text-[#0A0A14]">{ride.pickup}</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#EF2B3E] mt-1 flex-shrink-0" />
                  <div>
                    <span className="text-[10px] text-[#8E96A6] block uppercase font-mono">Drop</span>
                    <span className="font-medium text-[#0A0A14]">{ride.drop}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-between items-start md:items-end">
                <p className="text-xs">
                  Captain: <strong>{ride.captain || 'None (Cancelled)'}</strong>
                </p>
                <button className="mt-3 text-[#3A4DFF] hover:underline font-semibold text-xs flex items-center gap-1">
                  <Receipt className="w-3.5 h-3.5" /> Download Tax Invoice (PDF)
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
