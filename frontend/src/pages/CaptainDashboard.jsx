import React, { useState } from 'react';
import { 
  Power, 
  MapPin, 
  DollarSign, 
  Award, 
  Clock, 
  Check, 
  X, 
  Navigation, 
  Shield, 
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import Card from '../components/ui/Card';

export default function CaptainDashboard() {
  const [isOnline, setIsOnline] = useState(true);
  const [activeTab, setActiveTab] = useState('requests');
  const [acceptedRide, setAcceptedRide] = useState(null);

  // Incoming ride request queue
  const [incomingRequests, setIncomingRequests] = useState([
    {
      id: 'req-101',
      riderName: 'Priya Sharma',
      pickup: 'KLE Tech University, Main Gate',
      drop: 'Rani Chennamma Circle',
      distanceKm: 2.4,
      durationMin: 8,
      fare: 35,
      vehicle: 'Bike Taxi'
    },
    {
      id: 'req-102',
      riderName: 'Rohan Deshmukh',
      pickup: 'Belagavi Railway Station',
      drop: 'Bogarves Green Plaza',
      distanceKm: 1.8,
      durationMin: 6,
      fare: 30,
      vehicle: 'Bike Taxi'
    }
  ]);

  const handleAccept = (req) => {
    setAcceptedRide(req);
    setIncomingRequests((prev) => prev.filter((r) => r.id !== req.id));
  };

  const handleSkip = (id) => {
    setIncomingRequests((prev) => prev.filter((r) => r.id !== id));
  };

  const handleCompleteRide = () => {
    setAcceptedRide(null);
  };

  return (
    <div className="min-h-screen bg-[#0B0D14] text-white pt-24 pb-16 px-4 md:px-8 max-w-7xl mx-auto space-y-8">
      {/* Top Banner with Online/Offline Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-white/10 gap-4">
        <div>
          <span className="hud text-xs text-[#45E0F2] tracking-widest font-bold">
            CAPTAIN PORTAL · BELAGAVI SECTOR
          </span>
          <h1 className="text-3xl font-bold tracking-tight">Captain Suresh Patil</h1>
          <p className="text-xs text-[#8E96A6] mt-0.5">Hero Splendor Plus · KA-22-EX-4912</p>
        </div>

        {/* Online / Offline Toggle */}
        <button
          onClick={() => setIsOnline(!isOnline)}
          className={`px-6 py-3 rounded-full font-bold text-xs uppercase tracking-wider flex items-center gap-2.5 transition-all shadow-lg ${
            isOnline
              ? 'bg-[#3A4DFF] hover:bg-[#2c3ee0] text-white ring-4 ring-[#3A4DFF]/20'
              : 'bg-white/10 hover:bg-white/20 text-[#8E96A6]'
          }`}
        >
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isOnline ? 'bg-[#45E0F2] animate-ping' : 'bg-red-500'
            }`}
          />
          <span>{isOnline ? 'YOU ARE ONLINE (RECEIVING RIDES)' : 'GO ONLINE'}</span>
        </button>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card dark={true} className="p-6 space-y-2">
          <div className="flex items-center justify-between text-[#8E96A6]">
            <span className="hud text-xs">TODAY'S EARNINGS</span>
            <DollarSign className="w-4 h-4 text-[#FFC21A]" />
          </div>
          <p className="text-3xl font-bold font-mono text-white">₹840.00</p>
          <p className="text-[11px] text-emerald-400 font-semibold">+18% vs yesterday</p>
        </Card>

        <Card dark={true} className="p-6 space-y-2">
          <div className="flex items-center justify-between text-[#8E96A6]">
            <span className="hud text-xs">TRIPS COMPLETED</span>
            <TrendingUp className="w-4 h-4 text-[#45E0F2]" />
          </div>
          <p className="text-3xl font-bold font-mono text-white">14</p>
          <p className="text-[11px] text-[#8E96A6]">Target: 18 trips for bonus</p>
        </Card>

        <Card dark={true} className="p-6 space-y-2">
          <div className="flex items-center justify-between text-[#8E96A6]">
            <span className="hud text-xs">RATING</span>
            <Award className="w-4 h-4 text-[#FFC21A]" />
          </div>
          <p className="text-3xl font-bold font-mono text-white">4.88 ★</p>
          <p className="text-[11px] text-[#8E96A6]">Top 5% Captain in Belagavi</p>
        </Card>
      </div>

      {/* Active Trip Banner if Accepted */}
      {acceptedRide && (
        <div className="p-6 bg-gradient-to-r from-[#3A4DFF]/20 to-[#0A0A14] border-2 border-[#3A4DFF] rounded-[28px] space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="hud text-xs text-[#45E0F2] font-bold">ACTIVE ASSIGNED RIDE</span>
            <span className="text-xs bg-[#3A4DFF] px-3 py-1 rounded-full font-bold">IN PROGRESS</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-[#8E96A6]">Rider Name</p>
              <h3 className="text-xl font-bold text-white">{acceptedRide.riderName}</h3>
              <p className="text-xs text-[#C9CFDA] mt-2">
                <strong>Pickup:</strong> {acceptedRide.pickup}
              </p>
              <p className="text-xs text-[#C9CFDA]">
                <strong>Drop:</strong> {acceptedRide.drop}
              </p>
            </div>

            <div className="flex flex-col justify-between items-end">
              <div className="text-right">
                <span className="hud text-xs text-[#8E96A6]">FARE TO COLLECT</span>
                <p className="text-3xl font-bold font-mono text-[#FFC21A]">₹{acceptedRide.fare}</p>
              </div>

              <div className="flex gap-3 w-full sm:w-auto mt-4">
                <button
                  onClick={handleCompleteRide}
                  className="px-6 py-3 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs uppercase transition-all shadow-md"
                >
                  Complete Trip & Collect Cash
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Incoming Requests Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Nearby Ride Requests</h2>
          <span className="hud text-xs text-[#8E96A6]">
            {incomingRequests.length} REQUESTS WAITING
          </span>
        </div>

        {!isOnline ? (
          <div className="p-12 text-center border border-white/10 rounded-[28px] bg-white/5 space-y-2">
            <Power className="w-8 h-8 text-[#8E96A6] mx-auto" />
            <h3 className="text-lg font-bold">You are currently offline</h3>
            <p className="text-xs text-[#8E96A6]">Turn your status online above to receive live requests in Belagavi.</p>
          </div>
        ) : incomingRequests.length === 0 ? (
          <div className="p-12 text-center border border-white/10 rounded-[28px] bg-white/5 space-y-2">
            <Clock className="w-8 h-8 text-[#45E0F2] mx-auto animate-spin" />
            <h3 className="text-lg font-bold">Searching for rider requests...</h3>
            <p className="text-xs text-[#8E96A6]">Radar active around KLE Tech, Chennamma Circle, Bogarves.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {incomingRequests.map((req) => (
              <Card key={req.id} dark={true} className="p-6 space-y-4 border-white/10 hover:border-[#3A4DFF]">
                <div className="flex items-center justify-between">
                  <span className="hud text-xs text-[#3A4DFF] bg-[#3A4DFF]/10 px-2.5 py-1 rounded font-bold">
                    {req.vehicle}
                  </span>
                  <span className="font-mono text-xl font-bold text-[#FFC21A]">
                    ₹{req.fare}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 flex-shrink-0" />
                    <div>
                      <span className="text-[#8E96A6] block text-[10px]">PICKUP</span>
                      <span className="font-semibold text-white">{req.pickup}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#EF2B3E] mt-1 flex-shrink-0" />
                    <div>
                      <span className="text-[#8E96A6] block text-[10px]">DROP</span>
                      <span className="font-semibold text-white">{req.drop}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs text-[#8E96A6]">
                  <span>{req.distanceKm} km · ~{req.durationMin} mins</span>
                  <span>Rider: {req.riderName}</span>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => handleSkip(req.id)}
                    className="flex-1 py-3 rounded-full border border-white/20 hover:bg-white/10 text-white font-semibold text-xs transition-colors"
                  >
                    Skip
                  </button>
                  <button
                    onClick={() => handleAccept(req)}
                    className="flex-1 py-3 rounded-full bg-[#3A4DFF] hover:bg-[#2b3cee] text-white font-bold text-xs uppercase transition-colors shadow-md"
                  >
                    Accept Ride
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
