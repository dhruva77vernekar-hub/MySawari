import React, { useState } from 'react';
import { 
  Users, 
  MapPin, 
  Navigation, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight,
  Sparkles,
  Zap,
  Clock,
  Car,
  AlertCircle,
  MessageSquare,
  Star,
  Check,
  X,
  CreditCard,
  Ticket,
  ChevronRight,
  Share2,
  Calendar,
  Lock
} from 'lucide-react';
import { MOCK_LOCATIONS } from '../../mock/mockData';

export default function RideBuddyPassView() {
  const [activeTab, setActiveTab] = useState('buddy'); // 'buddy' | 'my-rides' | 'pass'
  
  // Search Form State
  const [pickup, setPickup] = useState('KLE Technological University Campus');
  const [drop, setDrop] = useState('Rani Chennamma Circle');
  const [departureTime, setDepartureTime] = useState('Now (within 10 mins)');
  const [passengers, setPassengers] = useState(1);
  const [vehiclePref, setVehiclePref] = useState('all');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Workflow & Matching State
  const [selectedRide, setSelectedRide] = useState(null);
  const [consentModalOpen, setConsentModalOpen] = useState(false);
  const [pendingRide, setPendingRide] = useState(null);
  const [confirmedShare, setConfirmedShare] = useState(null);
  const [rejectedMessage, setRejectedMessage] = useState(null);

  // Pass Subscription State with Corridor Inputs & Dynamic Distance Pricing
  const [selectedPass, setSelectedPass] = useState('monthly');
  const [subscribedPlan, setSubscribedPlan] = useState(null);
  const [passPickup, setPassPickup] = useState('KLE Technological University Campus');
  const [passDrop, setPassDrop] = useState('Rani Chennamma Circle');
  const [passDistanceKm, setPassDistanceKm] = useState(4.8);

  const calculateCorridorDistance = (from, to) => {
    const key = `${from}|${to}`.toLowerCase();
    if (key.includes('kle') && key.includes('chennamma')) return 4.8;
    if (key.includes('station') && key.includes('bogarves')) return 2.1;
    if (key.includes('tilakwadi') && key.includes('kle')) return 3.6;
    if (key.includes('vtu') || key.includes('machhe')) return 7.5;
    if (key.includes('station') && key.includes('chennamma')) return 2.4;
    return 4.2;
  };

  const handlePassPickupChange = (val) => {
    setPassPickup(val);
    setPassDistanceKm(calculateCorridorDistance(val, passDrop));
  };

  const handlePassDropChange = (val) => {
    setPassDrop(val);
    setPassDistanceKm(calculateCorridorDistance(passPickup, val));
  };

  const handlePassSwap = () => {
    const temp = passPickup;
    setPassPickup(passDrop);
    setPassDrop(temp);
  };

  // Distance-scaled pricing
  const dailyPassPrice = Math.max(29, Math.round(20 + passDistanceKm * 6));
  const monthlyPassPrice = Math.max(399, Math.round(dailyPassPrice * 26 * 0.55)); // 45% discount on 26 commute days
  const annualPassPrice = Math.max(2499, Math.round(monthlyPassPrice * 10 * 0.65)); // 35% extra off annual

  // Mock Available Live Rides
  const [matchingRides] = useState([
    {
      id: 'rb-101',
      captainName: 'Basavaraj Marathe',
      captainRating: 4.92,
      trips: 2840,
      plate: 'KA-22-M-8891',
      vehicle: 'Cab Sedan',
      vehicleCode: 'cab',
      vehicleColor: '#3A4DFF',
      currentRoute: 'KLE Tech Campus ➔ Chennamma Circle',
      detourKm: 1.1,
      detourMin: 3,
      seatsAvailable: 2,
      totalSeats: 4,
      originalFare: 120,
      splitFare: 68,
      savings: 52,
      verifiedCaptain: true
    },
    {
      id: 'rb-102',
      captainName: 'Praveen Kulkarni',
      captainRating: 4.78,
      trips: 980,
      plate: 'KA-22-A-3210',
      vehicle: 'Auto Rickshaw',
      vehicleCode: 'auto',
      vehicleColor: '#F59E0B',
      currentRoute: 'CBT Circle ➔ Railway Station via Bogarves',
      detourKm: 0.6,
      detourMin: 2,
      seatsAvailable: 1,
      totalSeats: 3,
      originalFare: 70,
      splitFare: 38,
      savings: 32,
      verifiedCaptain: true
    },
    {
      id: 'rb-103',
      captainName: 'Anand Shinde',
      captainRating: 4.85,
      trips: 1650,
      plate: 'KA-22-EX-9900',
      vehicle: 'SUV / XL',
      vehicleCode: 'xl',
      vehicleColor: '#8B5CF6',
      currentRoute: 'VTU Campus ➔ Tilakwadi ➔ Station',
      detourKm: 1.8,
      detourMin: 5,
      seatsAvailable: 3,
      totalSeats: 6,
      originalFare: 180,
      splitFare: 98,
      savings: 82,
      verifiedCaptain: true
    }
  ]);

  const handleSearch = (e) => {
    e.preventDefault();
    setIsSearching(true);
    setConfirmedShare(null);
    setRejectedMessage(null);
    setTimeout(() => {
      setIsSearching(false);
      setHasSearched(true);
    }, 900);
  };

  const handleRequestShare = (ride) => {
    setPendingRide(ride);
    // Simulate real consent modal prompt from existing rider/captain
    setTimeout(() => {
      setConsentModalOpen(true);
    }, 400);
  };

  const handleAcceptConsent = () => {
    setConsentModalOpen(false);
    setConfirmedShare(pendingRide);
    setPendingRide(null);
    setRejectedMessage(null);
  };

  const handleRejectConsent = () => {
    setConsentModalOpen(false);
    setRejectedMessage(
      `Your request to share with ${pendingRide?.captainName} was not accepted by the existing passenger. You can search another matching corridor.`
    );
    setPendingRide(null);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 animate-fade-in space-y-6">
      {/* Sub-navigation Pill Toggle */}
      <div className="flex justify-center">
        <div className="bg-white p-1.5 rounded-full border border-[#DCDAF0] shadow-sm flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('buddy')}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'buddy'
                ? 'bg-[#3A4DFF] text-white shadow-xs'
                : 'text-[#5B5B73] hover:text-[#0A0A14]'
            }`}
          >
            Find a Ride Buddy
          </button>
          <button
            onClick={() => setActiveTab('my-rides')}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'my-rides'
                ? 'bg-[#3A4DFF] text-white shadow-xs'
                : 'text-[#5B5B73] hover:text-[#0A0A14]'
            }`}
          >
            My Savings & Shared Rides
          </button>
          <button
            onClick={() => setActiveTab('pass')}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'pass'
                ? 'bg-[#3A4DFF] text-white shadow-xs'
                : 'text-[#5B5B73] hover:text-[#0A0A14]'
            }`}
          >
            Commuter Passes
          </button>
        </div>
      </div>

      {/* TAB 1: RIDE BUDDY LIVE SEARCH & MATCHING */}
      {activeTab === 'buddy' && (
        <div className="space-y-6">
          {/* Hero Banner */}
          <div className="bg-gradient-to-r from-white via-[#F8F9FD] to-white rounded-[32px] border border-[#DCDAF0] p-6 sm:p-10 shadow-sm text-center relative overflow-hidden">
            <div className="inline-flex items-center gap-2 bg-[#3A4DFF]/10 text-[#3A4DFF] px-3.5 py-1 rounded-full text-xs font-bold mb-3 border border-[#3A4DFF]/20">
              <Users className="w-4 h-4" />
              <span>MYSAWARI RIDE BUDDY · SMART ROUTE SHARING</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#0A0A14] tracking-tight leading-tight">
              Your Route. Their Ride. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3A4DFF] via-[#7B2CBF] to-[#3A4DFF]">
                Shared Savings.
              </span>
            </h1>
            <p className="text-sm sm:text-base text-[#5B5B73] mt-2 max-w-xl mx-auto leading-relaxed">
              Find people travelling your way in Belagavi and split your ride fare with 100% consent-based matching.
            </p>

            {/* 3 Core Value Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 text-left">
              <div className="p-4 rounded-2xl bg-white border border-[#DCDAF0] shadow-xs space-y-1.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  🛣️
                </div>
                <h3 className="font-bold text-sm text-[#0A0A14]">Smart Route Matching</h3>
                <p className="text-xs text-[#5B5B73]">
                  OSRM engine matches rides passing within 1.5 km of your pickup corridor.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#DCDAF0] shadow-xs space-y-1.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  💰
                </div>
                <h3 className="font-bold text-sm text-[#0A0A14]">Proportional Shared Fare</h3>
                <p className="text-xs text-[#5B5B73]">
                  Split eligible fare dynamically. Save up to 45% on daily college and office commutes.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#DCDAF0] shadow-xs space-y-1.5">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  🛡️
                </div>
                <h3 className="font-bold text-sm text-[#0A0A14]">Safe & 100% Consent-Based</h3>
                <p className="text-xs text-[#5B5B73]">
                  Strangers are never automatically added. Both passengers approve before joining.
                </p>
              </div>
            </div>
          </div>

          {/* Search Form Card */}
          <div className="bg-white rounded-[32px] border border-[#DCDAF0] p-6 sm:p-8 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCDAF0]">
              <span className="hud text-xs text-[#3A4DFF] font-bold flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5" />
                FIND MATCHING SHARED RIDES
              </span>
              <span className="text-xs text-[#5B5B73]">Belagavi Live Corridor</span>
            </div>

            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pickup Location */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#0A0A14] flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    Pickup Location
                  </label>
                  <div className="flex items-center bg-[#F1F0FA] rounded-2xl px-4 py-3 border border-transparent focus-within:border-[#3A4DFF] focus-within:bg-white transition-all">
                    <input
                      type="text"
                      value={pickup}
                      onChange={(e) => setPickup(e.target.value)}
                      placeholder="Enter pickup point"
                      className="w-full bg-transparent text-xs sm:text-sm font-medium outline-none text-[#0A0A14]"
                      required
                    />
                  </div>
                </div>

                {/* Destination Location */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#0A0A14] flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#EF2B3E]" />
                    Destination Location
                  </label>
                  <div className="flex items-center bg-[#F1F0FA] rounded-2xl px-4 py-3 border border-transparent focus-within:border-[#3A4DFF] focus-within:bg-white transition-all">
                    <input
                      type="text"
                      value={drop}
                      onChange={(e) => setDrop(e.target.value)}
                      placeholder="Enter drop destination"
                      className="w-full bg-transparent text-xs sm:text-sm font-medium outline-none text-[#0A0A14]"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Quick Chips for Belagavi */}
              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                <span className="hud text-[10px] text-[#8E96A6]">QUICK CORRIDORS:</span>
                {MOCK_LOCATIONS.slice(0, 4).map((loc) => (
                  <button
                    type="button"
                    key={loc.id}
                    onClick={() => setDrop(loc.name)}
                    className="px-2.5 py-1 bg-[#F1F0FA] hover:bg-[#E9ECF2] text-[#0A0A14] rounded-full transition-colors cursor-pointer text-[11px]"
                  >
                    {loc.name.split(' ')[0]}
                  </button>
                ))}
              </div>

              {/* Preferences Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="text-[11px] font-bold text-[#5B5B73] block mb-1">DEPARTURE TIME</label>
                  <select
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#F1F0FA] rounded-xl text-xs font-medium text-[#0A0A14] outline-none"
                  >
                    <option value="Now (within 10 mins)">Now (within 10 mins)</option>
                    <option value="In 20 mins">In 20 mins</option>
                    <option value="In 45 mins">In 45 mins</option>
                    <option value="Evening Commute (5:00 PM)">Evening Commute (5:00 PM)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#5B5B73] block mb-1">PASSENGERS</label>
                  <select
                    value={passengers}
                    onChange={(e) => setPassengers(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-[#F1F0FA] rounded-xl text-xs font-medium text-[#0A0A14] outline-none"
                  >
                    <option value={1}>1 Seat (Solo Commuter)</option>
                    <option value={2}>2 Seats (Pair)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#5B5B73] block mb-1">VEHICLE PREFERENCE</label>
                  <select
                    value={vehiclePref}
                    onChange={(e) => setVehiclePref(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#F1F0FA] rounded-xl text-xs font-medium text-[#0A0A14] outline-none"
                  >
                    <option value="all">Any Vehicle (Fastest Match)</option>
                    <option value="cab">Cab Sedan Only</option>
                    <option value="auto">Auto Rickshaw Only</option>
                    <option value="xl">SUV / XL Only</option>
                  </select>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSearching}
                className="w-full py-4 rounded-2xl bg-[#0A0A14] hover:bg-[#3A4DFF] text-white font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {isSearching ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Analyzing Belagavi Routes & Corridor Overlaps...</span>
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4" />
                    <span>Find My Ride Buddy</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Rejection Notification if Rejected */}
          {rejectedMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3 animate-fade-in">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <p className="flex-1">{rejectedMessage}</p>
              <button
                onClick={() => setRejectedMessage(null)}
                className="text-xs font-bold underline cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* CONFIRMED SHARED RIDE JOURNEY CARD */}
          {confirmedShare && (
            <div className="p-6 sm:p-8 rounded-[32px] bg-gradient-to-r from-emerald-50 via-teal-50 to-white border-2 border-emerald-500 shadow-xl space-y-6 animate-scale-up">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-emerald-200 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-bold text-xl shadow-md">
                    ✓
                  </div>
                  <div>
                    <span className="hud text-[10px] text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                      RIDE BUDDY CONFIRMED & LOCKED
                    </span>
                    <h2 className="text-xl font-bold text-[#0A0A14] mt-0.5">
                      Shared Ride with {confirmedShare.captainName}
                    </h2>
                    <p className="text-xs text-[#5B5B73]">
                      {confirmedShare.vehicle} · Plate: {confirmedShare.plate}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="hud text-[10px] text-[#5B5B73] block">YOUR RECALCULATED FARE</span>
                  <p className="text-2xl font-bold font-mono text-emerald-700">₹{confirmedShare.splitFare}</p>
                  <span className="text-[11px] text-emerald-600 font-bold">Saved ₹{confirmedShare.savings} (43%)</span>
                </div>
              </div>

              {/* Route Itinerary Stops */}
              <div className="p-4 bg-white rounded-2xl border border-emerald-200 space-y-3 text-xs">
                <span className="hud text-[10px] text-[#5B5B73] font-bold block">
                  MULTI-STOP COMBINED ITINERARY
                </span>
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center mt-0.5 flex-shrink-0">
                      1
                    </span>
                    <div>
                      <p className="font-bold text-[#0A0A14]">Pickup 1 (Existing Rider): {pickup}</p>
                      <p className="text-[11px] text-[#5B5B73]">Captain arriving in ~3 mins</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-[#3A4DFF] text-white text-[10px] font-bold flex items-center justify-center mt-0.5 flex-shrink-0">
                      2
                    </span>
                    <div>
                      <p className="font-bold text-[#0A0A14]">Pickup 2 (Your Stop): On-Route Junction</p>
                      <p className="text-[11px] text-blue-700">Additional detour: {confirmedShare.detourKm} km (+{confirmedShare.detourMin} mins)</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-[#EF2B3E] text-white text-[10px] font-bold flex items-center justify-center mt-0.5 flex-shrink-0">
                      3
                    </span>
                    <div>
                      <p className="font-bold text-[#0A0A14]">Drop Destination: {drop}</p>
                      <p className="text-[11px] text-[#5B5B73]">Both passengers arrive together</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fare Division Engine Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-white rounded-xl border border-emerald-100">
                  <span className="hud text-[9px] text-[#8E96A6] block">SOLO FARE</span>
                  <span className="font-bold text-sm text-[#0A0A14] line-through">₹{confirmedShare.originalFare}</span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-emerald-100">
                  <span className="hud text-[9px] text-[#8E96A6] block">SHARED TOTAL</span>
                  <span className="font-bold text-sm text-[#0A0A14]">₹{confirmedShare.splitFare * 2 - 10}</span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-emerald-100">
                  <span className="hud text-[9px] text-emerald-700 block">YOUR CONTRIBUTION</span>
                  <span className="font-bold text-base text-emerald-700">₹{confirmedShare.splitFare}</span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-emerald-100">
                  <span className="hud text-[9px] text-emerald-700 block">YOUR SAVINGS</span>
                  <span className="font-bold text-base text-emerald-600">₹{confirmedShare.savings}</span>
                </div>
              </div>

              {/* Verification & Chat CTA */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => alert(`Starting shared chat with ${confirmedShare.captainName} and co-rider...`)}
                  className="flex-1 py-3.5 rounded-xl bg-white border border-[#DCDAF0] hover:border-[#3A4DFF] text-[#0A0A14] font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                >
                  <MessageSquare className="w-4 h-4 text-[#3A4DFF]" />
                  <span>Ride Buddy Group Chat</span>
                </button>

                <button
                  onClick={() => alert(`Shared Ride Verification Active! OTP: 4829`)}
                  className="flex-1 py-3.5 rounded-xl bg-[#0A0A14] hover:bg-[#3A4DFF] text-white font-bold text-xs uppercase flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify Trip with Captain (OTP 4829)</span>
                </button>
              </div>
            </div>
          )}

          {/* MATCHING RESULTS LIST */}
          {hasSearched && !confirmedShare && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#0A0A14]">
                  Active Matching Rides ({matchingRides.length} Found)
                </h3>
                <span className="hud text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  UP TO 46% FARE SAVINGS
                </span>
              </div>

              <div className="space-y-4">
                {matchingRides.map((ride) => (
                  <div
                    key={ride.id}
                    className="p-5 sm:p-6 rounded-3xl bg-white border border-[#DCDAF0] hover:border-[#3A4DFF] shadow-sm hover:shadow-[0_12px_35px_-10px_rgba(58,77,255,0.18)] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    {/* Left: Captain & Vehicle Details */}
                    <div className="flex items-start gap-4">
                      <div 
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-base shadow-xs flex-shrink-0"
                        style={{ backgroundColor: ride.vehicleColor }}
                      >
                        {ride.vehicleCode === 'cab' ? 'CAB' : ride.vehicleCode === 'auto' ? 'AUTO' : 'XL'}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-base text-[#0A0A14]">{ride.captainName}</h4>
                          <span className="hud text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.2 rounded-full font-bold flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            VERIFIED CAPTAIN
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[#5B5B73]">
                          <span className="flex items-center text-amber-500 font-bold">
                            <Star className="w-3.5 h-3.5 fill-amber-400 mr-0.5" />
                            {ride.captainRating}
                          </span>
                          <span>· {ride.trips} trips</span>
                          <span>· {ride.vehicle} ({ride.plate})</span>
                        </div>

                        <div className="pt-2 flex items-center gap-3 text-xs">
                          <span className="text-blue-700 font-semibold bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-100">
                            Detour: +{ride.detourKm} km (~{ride.detourMin} mins)
                          </span>
                          <span className="text-[#5B5B73]">
                            Seats: <strong className="text-[#0A0A14]">{ride.seatsAvailable} left</strong> of {ride.totalSeats}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Fare Comparison & Request CTA */}
                    <div className="flex items-center justify-between md:flex-col md:items-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-[#DCDAF0]">
                      <div className="text-left md:text-right">
                        <div className="flex items-center gap-2 md:justify-end">
                          <span className="text-xs text-[#8E96A6] line-through">₹{ride.originalFare}</span>
                          <span className="text-2xl font-black font-mono text-[#0A0A14]">₹{ride.splitFare}</span>
                        </div>
                        <span className="hud text-[10px] text-emerald-700 font-bold block">
                          YOU SAVE ₹{ride.savings}
                        </span>
                      </div>

                      <button
                        onClick={() => handleRequestShare(ride)}
                        className="px-6 py-3 rounded-full bg-[#3A4DFF] hover:bg-[#2B3BE5] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center gap-2"
                      >
                        <span>Request to Share</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY SAVINGS & SHARED RIDES (Customer Dashboard) */}
      {activeTab === 'my-rides' && (
        <div className="space-y-6 animate-fade-in">
          {/* Savings Summary Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-[#DCDAF0] shadow-xs text-center">
              <span className="hud text-[10px] text-[#5B5B73] font-bold block">TOTAL COMMUTE SAVED</span>
              <p className="text-3xl font-black font-mono text-emerald-600 mt-1">₹540</p>
              <span className="text-[11px] text-[#8E96A6]">Across 6 shared rides</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#DCDAF0] shadow-xs text-center">
              <span className="hud text-[10px] text-[#5B5B73] font-bold block">SHARED JOURNEYS</span>
              <p className="text-3xl font-black font-mono text-[#3A4DFF] mt-1">6</p>
              <span className="text-[11px] text-[#8E96A6]">100% On-time</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#DCDAF0] shadow-xs text-center">
              <span className="hud text-[10px] text-[#5B5B73] font-bold block">CO-RIDER RATING</span>
              <p className="text-3xl font-black font-mono text-amber-500 mt-1">4.9 ★</p>
              <span className="text-[11px] text-[#8E96A6]">Verified Student / Citizen</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#DCDAF0] shadow-xs text-center">
              <span className="hud text-[10px] text-[#5B5B73] font-bold block">CARBON OFFSET</span>
              <p className="text-3xl font-black font-mono text-purple-600 mt-1">42 kg</p>
              <span className="text-[11px] text-[#8E96A6]">Green Belagavi Initiative</span>
            </div>
          </div>

          {/* Past Shared Trips */}
          <div className="bg-white rounded-[32px] border border-[#DCDAF0] p-6 sm:p-8 shadow-sm space-y-4">
            <h3 className="font-bold text-lg text-[#0A0A14]">Recent Shared Journeys</h3>

            <div className="space-y-3">
              {[
                {
                  id: 'sh-1',
                  date: 'Yesterday, 5:30 PM',
                  route: 'KLE Tech Campus ➔ Bogarves Plaza',
                  captain: 'Basavaraj Marathe (Cab Sedan)',
                  coRider: 'Rohan (Student)',
                  paid: '₹55',
                  saved: '₹45'
                },
                {
                  id: 'sh-2',
                  date: '12 Nov, 9:15 AM',
                  route: 'Chennamma Circle ➔ Belagavi Railway Station',
                  captain: 'Praveen Kulkarni (Auto Rickshaw)',
                  coRider: 'Dr. Sneha',
                  paid: '₹35',
                  saved: '₹35'
                },
                {
                  id: 'sh-3',
                  date: '10 Nov, 2:00 PM',
                  route: 'VTU Campus ➔ Tilakwadi 2nd Gate',
                  captain: 'Anand Shinde (SUV / XL)',
                  coRider: 'Amit & Priya',
                  paid: '₹80',
                  saved: '₹65'
                }
              ].map((trip) => (
                <div key={trip.id} className="p-4 rounded-2xl bg-[#F8F9FD] border border-[#DCDAF0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="hud text-[10px] text-[#8E96A6]">{trip.date}</span>
                    <h4 className="font-bold text-sm text-[#0A0A14] mt-0.5">{trip.route}</h4>
                    <p className="text-[#5B5B73] mt-0.5">Captain: {trip.captain} · Co-Rider: {trip.coRider}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="font-bold text-sm text-[#0A0A14] block">Paid: {trip.paid}</span>
                    <span className="hud text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Saved {trip.saved}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: COMMUTER PASSES */}
      {activeTab === 'pass' && (
        <div className="bg-white rounded-[32px] border border-[#DCDAF0] p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in">
          <div>
            <span className="hud text-xs text-[#3A4DFF] font-bold">ROUTE SUBSCRIPTIONS</span>
            <h2 className="text-2xl font-bold text-[#0A0A14] mt-1">MySawari Commuter Pass</h2>
            <p className="text-xs text-[#5B5B73]">
              Prepaid passes for regular Belagavi corridors. Select your pickup and destination to dynamically calculate distance-based savings.
            </p>
          </div>

          {/* Interactive Corridor Inputs (Pickup & Destination) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#F8F9FD] border border-[#DCDAF0] space-y-3">
            <div className="flex items-center justify-between">
              <span className="hud text-[10px] text-[#3A4DFF] font-bold">COMMUTE ROUTE CORRIDOR</span>
              <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                Corridor Distance: {passDistanceKm} km
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-11 gap-2 items-center">
              {/* Pickup Input */}
              <div className="sm:col-span-5 relative">
                <label className="block text-[10px] hud text-[#8E96A6] mb-1">PICKUP CORRIDOR</label>
                <div className="flex items-center bg-white rounded-xl px-3 py-2.5 border border-[#DCDAF0] focus-within:border-[#3A4DFF]">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2 flex-shrink-0" />
                  <input
                    value={passPickup}
                    onChange={(e) => handlePassPickupChange(e.target.value)}
                    placeholder="Enter pickup point"
                    className="w-full text-xs font-semibold text-[#0A0A14] outline-none"
                  />
                </div>
              </div>

              {/* Swap Button */}
              <div className="sm:col-span-1 flex justify-center py-1 sm:py-0">
                <button
                  type="button"
                  onClick={handlePassSwap}
                  className="w-8 h-8 rounded-full bg-white border border-[#DCDAF0] shadow-xs flex items-center justify-center hover:bg-[#F1F0FA] text-[#5B5B73] transition-colors cursor-pointer"
                  title="Swap corridor direction"
                >
                  ⇄
                </button>
              </div>

              {/* Drop Input */}
              <div className="sm:col-span-5 relative">
                <label className="block text-[10px] hud text-[#8E96A6] mb-1">DESTINATION CORRIDOR</label>
                <div className="flex items-center bg-white rounded-xl px-3 py-2.5 border border-[#DCDAF0] focus-within:border-[#3A4DFF]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#EF2B3E] mr-2 flex-shrink-0" />
                  <input
                    value={passDrop}
                    onChange={(e) => handlePassDropChange(e.target.value)}
                    placeholder="Enter destination point"
                    className="w-full text-xs font-semibold text-[#0A0A14] outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-[#5B5B73]">
              <span className="hud text-[10px] text-[#8E96A6]">Popular Belagavi Corridors:</span>
              <button
                type="button"
                onClick={() => {
                  setPassPickup('KLE Technological University Campus');
                  setPassDrop('Rani Chennamma Circle');
                  setPassDistanceKm(4.8);
                }}
                className="hover:text-[#3A4DFF] underline cursor-pointer"
              >
                KLE Tech ⇄ Chennamma Circle (4.8 km)
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => {
                  setPassPickup('Belagavi Central Station');
                  setPassDrop('Bogarves Green Plaza');
                  setPassDistanceKm(2.1);
                }}
                className="hover:text-[#3A4DFF] underline cursor-pointer"
              >
                Station ⇄ Bogarves (2.1 km)
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => {
                  setPassPickup('VTU Machhe Campus');
                  setPassDrop('Tilakwadi 2nd Gate');
                  setPassDistanceKm(7.5);
                }}
                className="hover:text-[#3A4DFF] underline cursor-pointer"
              >
                VTU Machhe ⇄ Tilakwadi (7.5 km)
              </button>
            </div>
          </div>

          {/* Dynamic Pass Cards Adjusted by Distance */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Daily Pass */}
            <div className="p-5 rounded-2xl border border-[#DCDAF0] hover:border-[#3A4DFF] transition-all text-center space-y-3 bg-white">
              <span className="hud text-[10px] text-[#5B5B73] font-bold block">DAILY CORRIDOR PASS</span>
              <p className="text-3xl font-black font-mono text-[#0A0A14]">₹{dailyPassPrice}</p>
              <p className="text-xs text-[#5B5B73]">2 Rides / Day on {passDistanceKm} km corridor</p>
              <div className="text-[10px] text-emerald-700 bg-emerald-50 py-1 px-2 rounded-lg font-semibold">
                Saves ~₹{(passDistanceKm * 14 * 2 - dailyPassPrice)} per day
              </div>
              <button 
                onClick={() => {
                  setSelectedPass('daily');
                  setSubscribedPlan(`Daily Corridor Pass (₹${dailyPassPrice})`);
                  setTimeout(() => setSubscribedPlan(null), 3500);
                }}
                className="w-full py-2.5 rounded-xl bg-[#F1F0FA] hover:bg-[#3A4DFF] hover:text-white font-bold text-xs uppercase transition-colors cursor-pointer"
              >
                Choose Daily (₹{dailyPassPrice})
              </button>
            </div>

            {/* Monthly Pass */}
            <div className="p-5 rounded-2xl border-2 border-[#3A4DFF] bg-[#3A4DFF]/5 relative text-center space-y-3 shadow-md">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-[#3A4DFF] text-white text-[9px] font-bold rounded-full uppercase tracking-wider">
                Most Popular · 45% OFF
              </span>
              <span className="hud text-[10px] text-[#3A4DFF] font-bold block">MONTHLY CORRIDOR PASS</span>
              <p className="text-3xl font-black font-mono text-[#0A0A14]">₹{monthlyPassPrice}</p>
              <p className="text-xs text-[#5B5B73]">60 Rides · Zero surge & priority dispatch</p>
              <div className="text-[10px] text-[#3A4DFF] bg-blue-50 py-1 px-2 rounded-lg font-semibold">
                Effective cost: ₹{Math.round(monthlyPassPrice / 60)} / ride (vs ₹{Math.round(passDistanceKm * 14)})
              </div>
              <button 
                onClick={() => {
                  setSelectedPass('monthly');
                  setSubscribedPlan(`Monthly Corridor Pass (₹${monthlyPassPrice})`);
                  setTimeout(() => setSubscribedPlan(null), 3500);
                }}
                className="w-full py-2.5 rounded-xl bg-[#3A4DFF] hover:bg-[#2B3BE5] text-white font-bold text-xs uppercase transition-colors cursor-pointer shadow-sm"
              >
                Choose Monthly (₹{monthlyPassPrice})
              </button>
            </div>

            {/* Annual Pass */}
            <div className="p-5 rounded-2xl border border-[#DCDAF0] hover:border-[#3A4DFF] transition-all text-center space-y-3 bg-white">
              <span className="hud text-[10px] text-[#5B5B73] font-bold block">ANNUAL UNLIMITED PASS</span>
              <p className="text-3xl font-black font-mono text-[#0A0A14]">₹{annualPassPrice.toLocaleString()}</p>
              <p className="text-xs text-[#5B5B73]">Unlimited corridor rides for full 365 days</p>
              <div className="text-[10px] text-purple-700 bg-purple-50 py-1 px-2 rounded-lg font-semibold">
                Saves up to 60% on yearly Belagavi commute
              </div>
              <button 
                onClick={() => {
                  setSelectedPass('annual');
                  setSubscribedPlan(`Annual Corridor Pass (₹${annualPassPrice.toLocaleString()})`);
                  setTimeout(() => setSubscribedPlan(null), 3500);
                }}
                className="w-full py-2.5 rounded-xl bg-[#F1F0FA] hover:bg-[#3A4DFF] hover:text-white font-bold text-xs uppercase transition-colors cursor-pointer"
              >
                Choose Annual (₹{annualPassPrice.toLocaleString()})
              </button>
            </div>
          </div>

          {subscribedPlan && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold text-center animate-fade-in shadow-xs flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Activated {subscribedPlan} for {passPickup} ⇄ {passDrop}! 100 MySawari bonus coins credited.</span>
            </div>
          )}
        </div>
      )}

      {/* INTERACTIVE CONSENT NOTIFICATION MODAL */}
      {consentModalOpen && pendingRide && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] p-6 sm:p-8 max-w-lg w-full border-2 border-[#3A4DFF] shadow-2xl space-y-5 animate-scale-up text-[#0A0A14]">
            <div className="flex items-center gap-3 pb-3 border-b border-[#DCDAF0]">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#3A4DFF] flex items-center justify-center font-bold text-2xl shadow-xs">
                🔔
              </div>
              <div>
                <span className="hud text-[10px] text-[#3A4DFF] font-bold block tracking-wider">
                  CONSENT REQUIRED
                </span>
                <h3 className="font-extrabold text-lg text-[#0A0A14]">
                  Ride Buddy Share Request
                </h3>
              </div>
            </div>

            <p className="text-xs text-[#5B5B73] leading-relaxed">
              Someone travelling along a similar route in Belagavi wants to share your ride with Captain <strong>{pendingRide.captainName}</strong>!
            </p>

            {/* Request Summary Box */}
            <div className="p-4 rounded-2xl bg-[#F8F9FD] border border-[#DCDAF0] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#5B5B73]">Requested Pickup:</span>
                <span className="font-bold text-[#0A0A14]">Bogarves Junction (On-route)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5B5B73]">Requested Drop:</span>
                <span className="font-bold text-[#0A0A14]">{drop}</span>
              </div>
              <div className="flex justify-between text-blue-700">
                <span>Additional Detour:</span>
                <span className="font-bold">+{pendingRide.detourKm} km (~{pendingRide.detourMin} mins)</span>
              </div>
              <div className="pt-2 border-t border-[#DCDAF0] flex justify-between text-sm font-bold">
                <span className="text-emerald-700">Your Fare After Sharing: ₹{pendingRide.splitFare}</span>
                <span className="text-emerald-700">Their Share: ₹{pendingRide.splitFare}</span>
              </div>
            </div>

            <p className="text-[11px] text-[#8E96A6] text-center">
              Both passengers will split the fare equally. Would you like to accept this request?
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleRejectConsent}
                className="flex-1 py-3.5 rounded-2xl bg-[#F1F0FA] hover:bg-[#E2E8F0] text-[#0A0A14] font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Reject Request
              </button>
              <button
                onClick={handleAcceptConsent}
                className="flex-1 py-3.5 rounded-2xl bg-[#3A4DFF] hover:bg-[#2B3BE5] text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-md shadow-[#3A4DFF]/20"
              >
                Accept Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
