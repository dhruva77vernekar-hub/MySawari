import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Phone, 
  Share2, 
  AlertTriangle, 
  Star, 
  ShieldCheck, 
  ArrowLeft,
  X,
  Play,
  Coins
} from 'lucide-react';
import Card from '../components/ui/Card';
import { MOCK_CAPTAINS } from '../mock/mockData';
import { useVehicle } from '../context/VehicleContext';
import { useAuth } from '../context/AuthContext';

export default function RideTracking() {
  const navigate = useNavigate();
  const { selectedVehicle } = useVehicle();
  const { addCoins } = useAuth();
  const captain = MOCK_CAPTAINS[0]; // Suresh Patil (Bike Captain)

  // Ride lifecycle state: 'requested' | 'accepted' | 'arriving' | 'in_progress' | 'completed' | 'cancelled'
  const [status, setStatus] = useState('accepted');
  const [eta, setEta] = useState(3);
  const [shareCopied, setShareCopied] = useState(false);
  const [sosActive, setSosActive] = useState(false);
  const [rating, setRating] = useState(5);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  // Simulation steps for demo
  const steps = [
    { key: 'requested', label: 'Requested' },
    { key: 'accepted', label: 'Captain Assigned' },
    { key: 'arriving', label: 'Arriving' },
    { key: 'in_progress', label: 'In Ride' },
    { key: 'completed', label: 'Completed' }
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === status);

  const handleNextStep = () => {
    if (status === 'requested') setStatus('accepted');
    else if (status === 'accepted') setStatus('arriving');
    else if (status === 'arriving') {
      setStatus('in_progress');
      setEta(8);
    } else if (status === 'in_progress') {
      setStatus('completed');
      addCoins?.(10);
    }
  };

  const handleShareTrip = () => {
    navigator.clipboard?.writeText?.(window.location.href);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  const handleTriggerSos = () => {
    setSosActive(true);
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 md:px-8 max-w-5xl mx-auto space-y-6">
      {/* Top Bar with Demo Controller */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#DCDAF0] gap-4">
        <button
          onClick={() => navigate('/book')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#5B5B73] hover:text-[#0A0A14]"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Booking
        </button>

        {/* Hackathon Demo Lifecycle Step Advancer */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-[#DCDAF0] shadow-sm text-xs">
          <span className="hud text-[#3A4DFF] font-bold">DEMO SIMULATOR:</span>
          {status !== 'completed' && status !== 'cancelled' ? (
            <button
              onClick={handleNextStep}
              className="px-3 py-1 bg-[#3A4DFF] text-white font-semibold rounded-full hover:bg-[#2c3be0] flex items-center gap-1 transition-colors"
            >
              <Play className="w-3 h-3 fill-white" />
              <span>Advance to Next Step</span>
            </button>
          ) : (
            <button
              onClick={() => setStatus('accepted')}
              className="px-3 py-1 bg-[#0A0A14] text-white font-semibold rounded-full"
            >
              Reset Ride
            </button>
          )}
        </div>
      </div>

      {/* SOS Alert Banner if Active */}
      {sosActive && (
        <div className="p-4 bg-[#EF2B3E] text-white rounded-2xl flex items-center justify-between animate-bounce shadow-lg">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-white" />
            <div>
              <p className="font-bold text-sm">EMERGENCY SOS SIGNAL BROADCASTED</p>
              <p className="text-xs text-white/90">Belagavi City Police & Emergency Contacts notified with live GPS coordinates.</p>
            </div>
          </div>
          <button
            onClick={() => setSosActive(false)}
            className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Tracking Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 Cols: Map & Route */}
        <div className="md:col-span-2 space-y-6">
          {/* Simulated Live Route Map */}
          <div className="w-full h-80 rounded-[28px] overflow-hidden border border-[#DCDAF0] bg-[#E9ECF2] relative flex flex-col justify-between p-6">
            <div className="absolute inset-0 bg-gradient-to-br from-[#E9ECF2] to-[#C9CFDA] opacity-80" />
            
            {/* Live GPS Beacon Marker */}
            <div className="relative z-10 flex items-center justify-between">
              <span className="hud bg-white/90 px-3 py-1 rounded-full text-xs font-bold text-[#0A0A14] shadow-sm">
                LIVE GPS TRACKING · BELAGAVI
              </span>
              <span className="bg-[#3A4DFF] text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-md">
                <Clock className="w-3.5 h-3.5" /> ETA {eta} MIN
              </span>
            </div>

            {/* Route illustration */}
            <div className="relative z-10 my-auto text-center space-y-1">
              <span className="w-4 h-4 rounded-full bg-[#3A4DFF] inline-block animate-ping" />
              <p className="hud text-xs text-[#0A0A14] font-bold">
                {status === 'accepted' ? 'CAPTAIN ON THE WAY TO KLE TECH' : status === 'in_progress' ? 'EN ROUTE TO CHENNAMMA CIRCLE' : 'TRIP COMPLETED'}
              </p>
            </div>

            {/* Bottom Pickup to Drop bar */}
            <div className="relative z-10 bg-white/90 backdrop-blur-md p-3 rounded-2xl border border-[#DCDAF0] flex items-center justify-between text-xs">
              <span className="font-medium text-[#0A0A14]">KLE Tech Campus</span>
              <span className="text-[#3A4DFF] font-bold">→</span>
              <span className="font-medium text-[#0A0A14]">Rani Chennamma Circle</span>
            </div>
          </div>

          {/* Status Timeline Progress */}
          <Card className="p-6">
            <span className="hud text-xs text-[#3A4DFF] font-bold block mb-4">
              RIDE LIFECYCLE TIMELINE
            </span>
            <div className="flex items-center justify-between relative">
              {/* Connecting line */}
              <div className="absolute top-4 left-4 right-4 h-[2px] bg-[#DCDAF0] -z-0" />

              {steps.map((s, idx) => {
                const isPassed = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;

                return (
                  <div key={s.key} className="relative z-10 flex flex-col items-center text-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isCurrent
                          ? 'bg-[#3A4DFF] text-white ring-4 ring-[#3A4DFF]/20 scale-110'
                          : isPassed
                          ? 'bg-[#0A0A14] text-white'
                          : 'bg-white border-2 border-[#DCDAF0] text-[#8E96A6]'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <span className={`text-[11px] mt-2 font-medium ${isCurrent ? 'text-[#3A4DFF] font-bold' : isPassed ? 'text-[#0A0A14]' : 'text-[#8E96A6]'}`}>
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right Col: Captain Card, Safety Panel, Completion Rating */}
        <div className="space-y-6">
          {/* Captain Profile Card */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="hud text-xs text-[#5B5B73]">ASSIGNED CAPTAIN</span>
              <span className="hud text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold">
                VERIFIED
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#E9ECF2] border border-[#DCDAF0] flex items-center justify-center font-bold text-lg text-[#0A0A14]">
                SP
              </div>
              <div>
                <h4 className="font-bold text-base text-[#0A0A14]">{captain.name}</h4>
                <div className="flex items-center gap-1 text-xs text-[#5B5B73]">
                  <Star className="w-3.5 h-3.5 fill-[#FFC21A] text-[#FFC21A]" />
                  <span className="font-bold text-[#0A0A14]">{captain.rating}</span>
                  <span>({captain.trips} trips)</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#F1F0FA] rounded-2xl text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-[#5B5B73]">Vehicle</span>
                <span className="font-semibold text-[#0A0A14]">{captain.vehicleModel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5B5B73]">Registration</span>
                <span className="font-mono font-bold text-[#3A4DFF]">{captain.plateNumber}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <a
                href={`tel:${captain.phone}`}
                className="flex-1 py-3 rounded-full bg-[#0A0A14] hover:bg-[#3A4DFF] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" /> Call Captain
              </a>
            </div>
          </Card>

          {/* Safety Panel (Section 4 & 10) */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#3A4DFF]" />
              <span className="hud text-xs text-[#0A0A14] font-bold">IN-TRIP SAFETY PANEL</span>
            </div>
            <p className="text-xs text-[#5B5B73]">
              Share live trip GPS tracking with family or friends for peace of mind.
            </p>

            <div className="space-y-2">
              <button
                onClick={handleShareTrip}
                className="w-full py-2.5 rounded-xl border border-[#DCDAF0] hover:bg-[#F1F0FA] text-[#0A0A14] text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Share2 className="w-3.5 h-3.5 text-[#3A4DFF]" />
                <span>{shareCopied ? 'Link Copied to Clipboard!' : 'Share Live Tracking Link'}</span>
              </button>

              <button
                onClick={handleTriggerSos}
                className="w-full py-2.5 rounded-xl bg-[#EF2B3E] hover:bg-[#d41c2e] text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>EMERGENCY SOS</span>
              </button>
            </div>
          </Card>

          {/* Completed State Rating Box */}
          {status === 'completed' && (
            <Card className="p-6 bg-white border-[#3A4DFF] ring-2 ring-[#3A4DFF]/20 space-y-4 animate-fade-in">
              <div className="text-center space-y-1">
                <span className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </span>
                <h4 className="font-bold text-lg text-[#0A0A14]">Ride Completed!</h4>
                <p className="text-2xl font-bold font-mono text-[#0A0A14]">₹35.00</p>
                <span className="hud text-[10px] text-[#5B5B73]">PAID VIA CASH / UPI</span>

                {/* Coins reward badge */}
                <div className="mt-2 p-2 bg-[#FFC21A]/20 border border-[#FFC21A] rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold text-[#0A0A14]">
                  <span>🪙</span>
                  <span>+10 MySawari Coins Credited!</span>
                </div>
              </div>

              {!ratingSubmitted ? (
                <div className="space-y-3 pt-2">
                  <p className="text-xs text-center text-[#5B5B73]">Rate Captain Suresh</p>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className="p-1 hover:scale-125 transition-transform"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= rating ? 'fill-[#FFC21A] text-[#FFC21A]' : 'text-[#DCDAF0]'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setRatingSubmitted(true)}
                    className="w-full py-2.5 rounded-full bg-[#0A0A14] text-white text-xs font-bold"
                  >
                    Submit Rating
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs text-center font-medium">
                  Thank you! Rating recorded.
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
