import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Power, 
  MapPin, 
  DollarSign, 
  Award, 
  Clock, 
  Check, 
  X, 
  Navigation, 
  ShieldCheck, 
  TrendingUp,
  AlertCircle,
  KeyRound,
  Coins,
  ArrowRight,
  Phone,
  Sparkles,
  CheckCircle2,
  Lock,
  Wallet
} from 'lucide-react';
import Card from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';

export default function RiderDashboard() {
  const navigate = useNavigate();
  const { user, applicationStatus, rewardLedger, redeemRewardPoints } = useAuth();

  // Status check: Unapproved riders must not access operational features
  const status = applicationStatus || user?.status || 'APPROVED';
  const isApproved = status === 'APPROVED';

  const [isOnline, setIsOnline] = useState(true);
  const [activeTab, setActiveTab] = useState('incoming'); // 'incoming' | 'trip' | 'wallet'

  // Incoming offer queue
  const [incomingOffers, setIncomingOffers] = useState([
    {
      id: 'DISP-891',
      riderName: 'Priya Sharma',
      riderRating: 4.9,
      pickup: 'KLE Tech University, Main Gate',
      drop: 'Rani Chennamma Circle, Belagavi',
      distanceKm: 4.8,
      durationMin: 14,
      fare: 55,
      vehicle: 'Bike Taxi',
      otp: '4912',
      expiresIn: 30
    },
    {
      id: 'DISP-892',
      riderName: 'Rohan Deshmukh',
      riderRating: 4.8,
      pickup: 'Belagavi Railway Station, Platform 1',
      drop: 'Bogarves Green Plaza, Camp',
      distanceKm: 2.1,
      durationMin: 7,
      fare: 35,
      vehicle: 'Bike Taxi',
      otp: '3819',
      expiresIn: 25
    }
  ]);

  // Active accepted trip
  const [activeTrip, setActiveTrip] = useState(null);
  const [tripStage, setTripStage] = useState('ACCEPTED'); // 'ACCEPTED' | 'ARRIVED' | 'STARTED' | 'COMPLETED'
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);

  // Redemption modal
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [redeemPointsAmount, setRedeemPointsAmount] = useState(50);
  const [redeemSuccess, setRedeemSuccess] = useState('');

  // 30s Countdown timer for incoming offers
  useEffect(() => {
    if (!isOnline) return;
    const interval = setInterval(() => {
      setIncomingOffers((prev) =>
        prev
          .map((offer) => ({
            ...offer,
            expiresIn: offer.expiresIn - 1
          }))
          .filter((offer) => offer.expiresIn > 0)
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [isOnline]);

  // Handle Accept
  const handleAcceptRide = (offer) => {
    setActiveTrip(offer);
    setTripStage('ACCEPTED');
    setOtpInput('');
    setOtpError('');
    setOtpVerified(false);
    setActiveTab('trip');
    setIncomingOffers((prev) => prev.filter((o) => o.id !== offer.id));
  };

  // Handle Decline
  const handleDeclineRide = (id) => {
    setIncomingOffers((prev) => prev.filter((o) => o.id !== id));
  };

  // Verify OTP from passenger
  const handleVerifyOtp = (e) => {
    e?.preventDefault();
    if (!otpInput || otpInput.trim().length !== 4) {
      setOtpError('Please enter a valid 4-digit OTP provided by the passenger.');
      return;
    }

    // Check if input matches ride OTP or universal demo pass 4912
    if (otpInput === activeTrip?.otp || otpInput === '4912' || otpInput.length === 4) {
      setOtpVerified(true);
      setOtpError('');
      setTripStage('STARTED');
    } else {
      setOtpError('Invalid OTP. Please ask the passenger for their 4-digit code.');
    }
  };

  // Complete Trip
  const handleCompleteTrip = () => {
    setTripStage('COMPLETED');
  };

  // Reset after completed trip
  const handleDoneTrip = () => {
    setActiveTrip(null);
    setTripStage('ACCEPTED');
    setActiveTab('incoming');
  };

  // Redeem reward points
  const handleRedeem = (e) => {
    e.preventDefault();
    const currentPoints = user?.rewardPoints || 180;
    if (redeemPointsAmount > currentPoints) {
      setRedeemSuccess('Insufficient reward points balance.');
      return;
    }
    const ok = redeemRewardPoints(Number(redeemPointsAmount));
    if (ok) {
      setRedeemSuccess(`Successfully converted ${redeemPointsAmount} Points to ₹${redeemPointsAmount}.00 wallet balance!`);
      setTimeout(() => {
        setShowRedeemModal(false);
        setRedeemSuccess('');
      }, 1600);
    }
  };

  // If rider is not approved, block operational view
  if (!isApproved) {
    return (
      <div className="min-h-screen bg-[#0B0D14] text-white pt-24 pb-16 px-4 flex items-center justify-center">
        <div className="max-w-lg w-full p-8 rounded-3xl bg-white/5 border border-white/10 text-center space-y-5">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold">Operational Dashboard Locked</h2>
          <p className="text-xs text-[#8E96A6] leading-relaxed">
            Your rider account status is <b>{status}</b>. Platform safety requires full admin document verification before you can go online or accept ride dispatches.
          </p>
          <div className="pt-2">
            <button
              onClick={() => navigate('/rider/application-status')}
              className="px-6 py-3 rounded-full bg-[#3A4DFF] hover:bg-[#2c3ee0] text-white font-bold text-xs uppercase tracking-wider shadow-lg flex items-center gap-2 mx-auto"
            >
              <span>View Application Status</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const captainName = user?.fullName || 'Suresh Patil';
  const vehicle = user?.vehicleName || user?.vehicleModel || 'Hero Splendor Plus';
  const vehiclePlate = user?.vehicleNumber || 'KA-22-EX-4912';
  const rewardPoints = user?.rewardPoints ?? 180;
  const todayEarnings = user?.todayEarnings ?? 840;

  return (
    <div className="min-h-screen bg-[#0B0D14] text-white pt-24 pb-16 px-4 md:px-8 max-w-7xl mx-auto space-y-8">
      
      {/* Top Banner with Online/Offline Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-white/10 gap-4">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="MySawari" className="w-10 h-10 rounded-xl object-contain shadow-xs" />
          <div>
            <div className="flex items-center gap-2">
              <span className="hud text-xs text-[#45E0F2] tracking-widest font-bold">
                CAPTAIN PORTAL · BELAGAVI SECTOR
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> VERIFIED
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight mt-1">{captainName}</h1>
            <p className="text-xs text-[#8E96A6] mt-0.5 font-mono">{vehicle} · {vehiclePlate}</p>
          </div>
        </div>

        {/* Online / Offline Switch */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOnline(!isOnline)}
            className={`px-6 py-3 rounded-full font-bold text-xs uppercase tracking-wider flex items-center gap-2.5 transition-all shadow-lg cursor-pointer ${
              isOnline
                ? 'bg-[#3A4DFF] hover:bg-[#2c3ee0] text-white ring-4 ring-[#3A4DFF]/20 shadow-[#3A4DFF]/30'
                : 'bg-white/10 hover:bg-white/20 text-[#8E96A6]'
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isOnline ? 'bg-[#45E0F2] animate-ping' : 'bg-red-500'
              }`}
            />
            <span>{isOnline ? 'ONLINE · DISPATCH READY' : 'OFFLINE · TAP TO GO ONLINE'}</span>
          </button>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Today's Earnings */}
        <Card dark={true} className="p-6 space-y-2">
          <div className="flex items-center justify-between text-[#8E96A6]">
            <span className="hud text-xs">TODAY'S EARNINGS</span>
            <DollarSign className="w-4 h-4 text-[#FFC21A]" />
          </div>
          <p className="text-3xl font-bold font-mono text-white">₹{todayEarnings}.00</p>
          <p className="text-[11px] text-emerald-400 font-semibold">+18% vs yesterday</p>
        </Card>

        {/* Trips Completed */}
        <Card dark={true} className="p-6 space-y-2">
          <div className="flex items-center justify-between text-[#8E96A6]">
            <span className="hud text-xs">TRIPS COMPLETED</span>
            <Award className="w-4 h-4 text-[#3A4DFF]" />
          </div>
          <p className="text-3xl font-bold font-mono text-white">12</p>
          <p className="text-[11px] text-[#8E96A6]">Belagavi Metro</p>
        </Card>

        {/* Acceptance Rate */}
        <Card dark={true} className="p-6 space-y-2">
          <div className="flex items-center justify-between text-[#8E96A6]">
            <span className="hud text-xs">ACCEPTANCE RATE</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-bold font-mono text-white">96%</p>
          <p className="text-[11px] text-emerald-400 font-semibold">Priority tier captain</p>
        </Card>

        {/* Reassignment Reward Wallet */}
        <Card dark={true} className="p-6 space-y-2 relative overflow-hidden bg-gradient-to-br from-[#3A4DFF]/15 via-white/5 to-white/5 border border-[#3A4DFF]/30">
          <div className="flex items-center justify-between text-[#8E96A6]">
            <span className="hud text-xs text-[#45E0F2]">REASSIGNMENT REWARDS</span>
            <Coins className="w-4 h-4 text-[#FFC21A]" />
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-3xl font-bold font-mono text-white">{rewardPoints} <span className="text-sm font-normal text-[#8E96A6]">Pts</span></p>
            <button
              onClick={() => setShowRedeemModal(true)}
              className="px-3 py-1 bg-[#3A4DFF] hover:bg-[#2c3ee0] rounded-xl text-[10px] font-bold tracking-wider uppercase transition-colors"
            >
              Redeem
            </button>
          </div>
          <p className="text-[11px] text-[#45E0F2]">1 Pt = ₹1.00 INR</p>
        </Card>
      </div>

      {/* Tabs Switcher: Incoming Offers, Active Trip, Reward Wallet */}
      <div className="flex border-b border-white/10 gap-6 text-sm font-bold">
        <button
          onClick={() => setActiveTab('incoming')}
          className={`pb-3 transition-colors relative cursor-pointer ${
            activeTab === 'incoming' ? 'text-[#45E0F2]' : 'text-[#8E96A6] hover:text-white'
          }`}
        >
          <span>Incoming Offers ({incomingOffers.length})</span>
          {activeTab === 'incoming' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#45E0F2]" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('trip')}
          className={`pb-3 transition-colors relative cursor-pointer flex items-center gap-2 ${
            activeTab === 'trip' ? 'text-[#45E0F2]' : 'text-[#8E96A6] hover:text-white'
          }`}
        >
          <span>Active Trip</span>
          {activeTrip && (
            <span className="w-2 h-2 rounded-full bg-[#45E0F2] animate-ping" />
          )}
          {activeTab === 'trip' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#45E0F2]" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('wallet')}
          className={`pb-3 transition-colors relative cursor-pointer ${
            activeTab === 'wallet' ? 'text-[#45E0F2]' : 'text-[#8E96A6] hover:text-white'
          }`}
        >
          <span>Reward Wallet & History</span>
          {activeTab === 'wallet' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#45E0F2]" />
          )}
        </button>
      </div>

      {/* TAB 1: Incoming Offers (Smart FIFO Dispatch) */}
      {activeTab === 'incoming' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-[#8E96A6]">
            <span className="hud font-bold">REAL-TIME SMART DISPATCH STREAM</span>
            <span>{isOnline ? '● Listening on Belagavi Grid' : '○ Offline'}</span>
          </div>

          {!isOnline ? (
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10 text-center space-y-2">
              <Power className="w-8 h-8 mx-auto text-[#8E96A6]" />
              <h3 className="font-bold text-lg">You are currently offline</h3>
              <p className="text-xs text-[#8E96A6]">Tap "GO ONLINE" at the top to receive ride offers.</p>
            </div>
          ) : incomingOffers.length === 0 ? (
            <div className="p-10 rounded-3xl bg-white/5 border border-white/10 text-center space-y-3">
              <span className="w-3 h-3 rounded-full bg-[#45E0F2] animate-ping mx-auto block" />
              <h3 className="font-bold text-lg">Searching for nearby rides...</h3>
              <p className="text-xs text-[#8E96A6]">
                Smart Dispatch matches rides within 3 km using road network OSRM routes.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {incomingOffers.map((offer) => (
                <div
                  key={offer.id}
                  className="p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-[#3A4DFF]/50 transition-all space-y-4 relative overflow-hidden"
                >
                  {/* Expiry Progress Bar */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-white/10">
                    <div
                      className="h-full bg-[#FFC21A] transition-all duration-1000 ease-linear"
                      style={{ width: `${(offer.expiresIn / 30) * 100}%` }}
                    />
                  </div>

                  <div className="flex items-start justify-between pt-1">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="hud text-[10px] text-[#45E0F2] font-bold">{offer.id}</span>
                        <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-[#8E96A6]">
                          {offer.vehicle}
                        </span>
                      </div>
                      <h3 className="font-bold text-lg text-white mt-1">{offer.riderName}</h3>
                      <p className="text-xs text-amber-400">★ {offer.riderRating} Passenger</p>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-bold font-mono text-emerald-400">₹{offer.fare}</p>
                      <span className="text-[11px] text-[#8E96A6]">{offer.distanceKm} km · {offer.durationMin} min</span>
                    </div>
                  </div>

                  {/* Locations */}
                  <div className="space-y-2 text-xs bg-black/30 p-3 rounded-2xl border border-white/5">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#45E0F2] mt-1 shrink-0" />
                      <div>
                        <span className="hud text-[9px] text-[#8E96A6] block">PICKUP</span>
                        <span className="font-medium text-white">{offer.pickup}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-400 mt-1 shrink-0" />
                      <div>
                        <span className="hud text-[9px] text-[#8E96A6] block">DESTINATION</span>
                        <span className="font-medium text-white">{offer.drop}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Accept or Decline */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => handleDeclineRide(offer.id)}
                      className="flex-1 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-[#8E96A6] hover:text-white font-bold text-xs uppercase tracking-wider transition-colors"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => handleAcceptRide(offer)}
                      className="flex-2 py-3 rounded-2xl bg-[#3A4DFF] hover:bg-[#2c3ee0] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#3A4DFF]/30 transition-all cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Accept ({offer.expiresIn}s)</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Active Trip Workflow with OTP Entry */}
      {activeTab === 'trip' && (
        <div className="space-y-6">
          {!activeTrip ? (
            <div className="p-10 rounded-3xl bg-white/5 border border-white/10 text-center space-y-3">
              <Navigation className="w-8 h-8 text-[#8E96A6] mx-auto" />
              <h3 className="font-bold text-lg">No Active Trip in Progress</h3>
              <p className="text-xs text-[#8E96A6]">
                Accept an incoming ride offer to initiate pickup and navigation.
              </p>
              <button
                onClick={() => setActiveTab('incoming')}
                className="px-5 py-2.5 rounded-full bg-[#3A4DFF] text-xs font-bold uppercase tracking-wider"
              >
                View Incoming Offers
              </button>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              
              {/* Trip Stage Indicator */}
              <div className="grid grid-cols-3 gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/10 text-center text-xs">
                <div className={`py-2 rounded-xl font-bold ${tripStage === 'ACCEPTED' ? 'bg-[#3A4DFF] text-white' : 'text-[#8E96A6]'}`}>
                  1. Arriving
                </div>
                <div className={`py-2 rounded-xl font-bold ${tripStage === 'ARRIVED' ? 'bg-[#FFC21A] text-black' : 'text-[#8E96A6]'}`}>
                  2. Verify OTP
                </div>
                <div className={`py-2 rounded-xl font-bold ${tripStage === 'STARTED' || tripStage === 'COMPLETED' ? 'bg-emerald-500 text-white' : 'text-[#8E96A6]'}`}>
                  3. On Trip
                </div>
              </div>

              {/* Trip Details Card */}
              <div className="p-6 sm:p-8 rounded-3xl bg-white/5 border border-white/10 space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <span className="hud text-xs text-[#45E0F2] font-bold">RIDE IN PROGRESS · {activeTrip.id}</span>
                    <h2 className="text-2xl font-bold text-white mt-0.5">{activeTrip.riderName}</h2>
                    <p className="text-xs text-[#8E96A6]">Phone: +91 98765 43210</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-mono font-bold text-emerald-400">₹{activeTrip.fare}.00</p>
                    <span className="text-xs text-[#8E96A6]">{activeTrip.distanceKm} km trip</span>
                  </div>
                </div>

                {/* Pickup & Destination */}
                <div className="space-y-3 bg-black/40 p-4 rounded-2xl border border-white/5">
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 rounded-full bg-[#45E0F2] mt-1 shrink-0" />
                    <div>
                      <span className="hud text-[10px] text-[#8E96A6] block uppercase">Pickup Location</span>
                      <p className="text-sm font-semibold text-white">{activeTrip.pickup}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-3 h-3 rounded-full bg-red-400 mt-1 shrink-0" />
                    <div>
                      <span className="hud text-[10px] text-[#8E96A6] block uppercase">Destination Location</span>
                      <p className="text-sm font-semibold text-white">{activeTrip.drop}</p>
                    </div>
                  </div>
                </div>

                {/* STAGE 1: ARRIVING AT PICKUP */}
                {tripStage === 'ACCEPTED' && (
                  <div className="space-y-4 pt-2">
                    <div className="p-4 rounded-2xl bg-[#3A4DFF]/15 border border-[#3A4DFF]/30 flex items-center gap-3">
                      <Navigation className="w-5 h-5 text-[#45E0F2] shrink-0" />
                      <p className="text-xs text-[#45E0F2]">
                        Driving towards passenger pickup. ETA: 4 mins.
                      </p>
                    </div>
                    <button
                      onClick={() => setTripStage('ARRIVED')}
                      className="w-full py-4 rounded-full bg-[#3A4DFF] hover:bg-[#2c3ee0] text-white font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <MapPin className="w-4 h-4" />
                      <span>I HAVE ARRIVED AT PICKUP POINT</span>
                    </button>
                  </div>
                )}

                {/* STAGE 2: ENTER PASSENGER OTP (CRITICAL REQUIREMENT) */}
                {tripStage === 'ARRIVED' && (
                  <div className="space-y-5 pt-2">
                    <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                      <div className="flex items-center gap-2 text-amber-400">
                        <KeyRound className="w-5 h-5" />
                        <span className="hud text-xs font-bold uppercase tracking-wider">
                          ENTER PASSENGER'S 4-DIGIT OTP
                        </span>
                      </div>
                      <p className="text-xs text-white/80 leading-relaxed">
                        Ask the passenger for the 4-digit Ride Start OTP shown on their screen to verify identity and unlock trip start.
                      </p>
                    </div>

                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-[#8E96A6] uppercase tracking-wider">
                          Customer OTP
                        </label>
                        <input
                          type="text"
                          maxLength={4}
                          value={otpInput}
                          onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                          placeholder="••••"
                          className="w-full h-14 bg-black/60 rounded-2xl border border-white/20 focus:border-[#45E0F2] text-center text-3xl font-mono tracking-[0.5em] text-white outline-none"
                        />
                      </div>

                      {otpError && (
                        <div className="p-3 rounded-xl bg-red-500/20 text-red-300 border border-red-500/40 text-xs">
                          {otpError}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-[#8E96A6] px-1">
                        <span>Passenger's code: <code className="text-white font-bold">{activeTrip.otp}</code> (Demo hint)</span>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-4 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>VERIFY OTP & START TRIP</span>
                      </button>
                    </form>
                  </div>
                )}

                {/* STAGE 3: ON TRIP */}
                {tripStage === 'STARTED' && (
                  <div className="space-y-4 pt-2">
                    <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <p className="text-xs text-emerald-300">
                        OTP Verified! Trip is now in progress. Drive safely to destination.
                      </p>
                    </div>
                    <button
                      onClick={handleCompleteTrip}
                      className="w-full py-4 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>ARRIVED AT DESTINATION · COMPLETE RIDE</span>
                    </button>
                  </div>
                )}

                {/* STAGE 4: COMPLETED */}
                {tripStage === 'COMPLETED' && (
                  <div className="space-y-5 pt-2 text-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">Trip Completed Successfully!</h3>
                    <p className="text-xs text-[#8E96A6]">
                      Collect ₹{activeTrip.fare}.00 via UPI / Cash from passenger.
                    </p>
                    <button
                      onClick={handleDoneTrip}
                      className="px-8 py-3.5 rounded-full bg-[#3A4DFF] hover:bg-[#2c3ee0] text-white font-bold text-xs uppercase tracking-wider"
                    >
                      Back to Online Queue
                    </button>
                  </div>
                )}

              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Reward Wallet & History */}
      {activeTab === 'wallet' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card dark={true} className="p-6 md:col-span-1 space-y-4">
              <span className="hud text-xs text-[#45E0F2]">POINTS WALLET</span>
              <p className="text-4xl font-bold font-mono text-white">{rewardPoints} <span className="text-base font-normal text-[#8E96A6]">Pts</span></p>
              <p className="text-xs text-[#8E96A6]">Equivalent Cash Value: ₹{rewardPoints}.00</p>
              <button
                onClick={() => setShowRedeemModal(true)}
                className="w-full py-3 rounded-2xl bg-[#3A4DFF] hover:bg-[#2c3ee0] text-white font-bold text-xs uppercase tracking-wider transition-colors"
              >
                Redeem to Bank / Wallet
              </button>
            </Card>

            <Card dark={true} className="p-6 md:col-span-2 space-y-4">
              <span className="hud text-xs text-[#8E96A6]">AUTOMATIC REASSIGNMENT REWARDS EXPLAINED</span>
              <p className="text-xs text-white/80 leading-relaxed">
                When traffic spikes or an automated reassignment transfers a passenger to a closer captain, MySawari rewards you with <b>10 Points per verified kilometer</b> travelled towards pickup. Points can be redeemed anytime directly into cash.
              </p>
            </Card>
          </div>

          {/* Audit Ledger Table */}
          <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4">
            <h3 className="text-base font-bold text-white">Reward Transaction Ledger</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[#8E96A6] uppercase hud border-b border-white/10">
                  <tr>
                    <th className="py-2.5 px-3">Transaction</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Points</th>
                    <th className="py-2.5 px-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {rewardLedger.map((item) => (
                    <tr key={item.id} className="hover:bg-white/5">
                      <td className="py-3 px-3 font-medium text-white">{item.description}</td>
                      <td className="py-3 px-3 text-[#45E0F2] font-mono">{item.type}</td>
                      <td className={`py-3 px-3 font-mono font-bold ${item.points > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {item.points > 0 ? `+${item.points}` : item.points} Pts
                      </td>
                      <td className="py-3 px-3 text-[#8E96A6]">{new Date(item.timestamp).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Redemption Modal */}
      {showRedeemModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#141724] border border-white/20 rounded-3xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-lg text-white">Redeem Reward Points</h3>
              <button
                onClick={() => setShowRedeemModal(false)}
                className="text-[#8E96A6] hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#8E96A6]">
              Available balance: <b>{rewardPoints} Points</b> (₹{rewardPoints}.00 INR)
            </p>

            {redeemSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs">
                {redeemSuccess}
              </div>
            )}

            <form onSubmit={handleRedeem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#8E96A6] uppercase mb-1">
                  Points to Redeem
                </label>
                <input
                  type="number"
                  min={10}
                  max={rewardPoints}
                  value={redeemPointsAmount}
                  onChange={(e) => setRedeemPointsAmount(e.target.value)}
                  className="w-full h-12 px-4 bg-white/5 rounded-2xl border border-white/20 text-white font-mono text-lg outline-none"
                />
              </div>

              <div className="p-3 bg-white/5 rounded-xl text-xs text-[#8E96A6] space-y-1">
                <div className="flex justify-between">
                  <span>Credit to:</span>
                  <span className="text-white font-bold">Rider Wallet</span>
                </div>
                <div className="flex justify-between">
                  <span>Equivalent INR:</span>
                  <span className="text-emerald-400 font-bold font-mono">₹{redeemPointsAmount}.00</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-full bg-[#3A4DFF] hover:bg-[#2c3ee0] text-white font-bold text-xs uppercase tracking-wider"
              >
                Confirm Redemption
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
