import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  Coins,
  Navigation,
  CreditCard,
  Lock,
  ShieldAlert
} from 'lucide-react';
import Card from '../components/ui/Card';
import MapIntegration from '../components/map/MapIntegration';
import PaymentModal from '../components/payment/PaymentModal';
import SosActivationModal from '../components/safety/SosActivationModal';
import EmergencyContactsModal from '../components/safety/EmergencyContactsModal';
import realtimeService from '../services/realtimeService';
import routingService from '../services/routingService';
import { MOCK_CAPTAINS, MOCK_LOCATIONS } from '../mock/mockData';
import { useVehicle } from '../context/VehicleContext';
import { useAuth } from '../context/AuthContext';

export default function RideTracking() {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedVehicle: contextVehicle } = useVehicle();
  const { addCoins } = useAuth();
  const captain = MOCK_CAPTAINS[0]; // Suresh Patil

  // Read location state passed from booking
  const pickupName = location.state?.pickup || MOCK_LOCATIONS[0].name;
  const dropName = location.state?.drop || MOCK_LOCATIONS[1].name;
  const pickupCoords = location.state?.pickupCoords || {
    lat: MOCK_LOCATIONS[0].lat,
    lng: MOCK_LOCATIONS[0].lng,
    name: pickupName
  };
  const dropCoords = location.state?.dropCoords || {
    lat: MOCK_LOCATIONS[1].lat,
    lng: MOCK_LOCATIONS[1].lng,
    name: dropName
  };

  const initialRouteCoords = location.state?.routeCoordinates || [];
  const chosenVehicle = location.state?.selectedVehicle || contextVehicle;
  const initialFare = location.state?.fare || 65;
  const initialPaymentData = location.state?.paymentData || null;
  const initialPaymentStatus = location.state?.paymentStatus || (initialPaymentData?.status === 'captured' ? 'paid' : 'cash');
  const rideOtp = location.state?.otp || localStorage.getItem('mysawari_active_otp') || '4829';

  // Active state
  const [routeCoordinates, setRouteCoordinates] = useState(initialRouteCoords);
  const [status, setStatus] = useState('accepted');
  const [eta, setEta] = useState(3);
  const [shareCopied, setShareCopied] = useState(false);
  const [sosActive, setSosActive] = useState(false);
  const [rating, setRating] = useState(5);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [paymentData, setPaymentData] = useState(initialPaymentData);
  const [paymentStatus, setPaymentStatus] = useState(initialPaymentStatus);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [showSosModal, setShowSosModal] = useState(false);
  const [showContactsModal, setShowContactsModal] = useState(false);
  const fare = initialFare;

  // Captain Live GPS coordinates
  const [captainLocation, setCaptainLocation] = useState({
    lat: pickupCoords.lat - 0.004,
    lng: pickupCoords.lng - 0.003,
    heading: 45,
    name: captain.name,
    vehicleCode: chosenVehicle?.code || 'auto'
  });

  // Fetch route coordinates if not already passed
  useEffect(() => {
    let mounted = true;
    if (routeCoordinates.length === 0) {
      routingService.getRoute(pickupCoords, dropCoords).then((res) => {
        if (mounted && res?.coordinates) {
          setRouteCoordinates(res.coordinates);
        }
      });
    }
    return () => { mounted = false; };
  }, [pickupCoords, dropCoords, routeCoordinates.length]);

  // Realtime Supabase Subscription & Simulated GPS Movement
  useEffect(() => {
    const sub = realtimeService.subscribeToRide(
      'live-trip-demo',
      routeCoordinates,
      (newLoc) => {
        setCaptainLocation((prev) => ({
          ...prev,
          ...newLoc,
          vehicleCode: chosenVehicle?.code || 'auto'
        }));
      },
      (newStatus) => {
        setStatus(newStatus);
      }
    );

    return () => {
      sub.unsubscribe();
    };
  }, [routeCoordinates, chosenVehicle]);

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
    else if (status === 'accepted') {
      setStatus('arriving');
      setEta(2);
    } else if (status === 'arriving') {
      setStatus('in_progress');
      setEta(7);
      // Teleport captain along the main route
      if (routeCoordinates.length > 2) {
        const midPoint = routeCoordinates[Math.floor(routeCoordinates.length / 2)];
        setCaptainLocation((prev) => ({
          ...prev,
          lng: midPoint[0],
          lat: midPoint[1],
          heading: 65
        }));
      }
    } else if (status === 'in_progress') {
      setStatus('completed');
      setEta(0);
      addCoins?.(10);
      if (dropCoords) {
        setCaptainLocation((prev) => ({
          ...prev,
          lng: dropCoords.lng,
          lat: dropCoords.lat
        }));
      }
    }
  };

  const handleShareTrip = () => {
    navigator.clipboard?.writeText?.(window.location.href);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  const handleTriggerSos = () => {
    setShowSosModal(true);
    setSosActive(true);
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 md:px-8 max-w-5xl mx-auto space-y-6">
      {/* Top Bar with Demo Controller */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#DCDAF0] gap-4">
        <button
          onClick={() => navigate('/book')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#5B5B73] hover:text-[#0A0A14] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Booking
        </button>

        {/* Hackathon Demo Lifecycle Step Advancer */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-[#DCDAF0] shadow-sm text-xs">
          <span className="hud text-[#3A4DFF] font-bold">DEMO SIMULATOR:</span>
          {status !== 'completed' && status !== 'cancelled' ? (
            <button
              onClick={handleNextStep}
              className="px-3 py-1 bg-[#3A4DFF] text-white font-semibold rounded-full hover:bg-[#2c3be0] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Play className="w-3 h-3 fill-white" />
              <span>Advance to Next Step</span>
            </button>
          ) : (
            <button
              onClick={() => setStatus('accepted')}
              className="px-3 py-1 bg-[#0A0A14] text-white font-semibold rounded-full cursor-pointer"
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
            className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Tracking Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Mapbox Tracking & Timeline */}
        <div className="md:col-span-2 space-y-6">
          {/* Live Mapbox Map with Captain Movement */}
          <div className="relative w-full rounded-[28px] overflow-hidden border border-[#DCDAF0] shadow-sm">
            <MapIntegration
              pickupLocation={pickupCoords}
              dropLocation={dropCoords}
              routeCoordinates={routeCoordinates}
              captainLocation={captainLocation}
              height="380px"
            />

            {/* Live GPS Status Overlay Badge */}
            <div className="absolute bottom-4 left-4 z-10 bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-[#DCDAF0] shadow-md flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <div>
                <p className="hud text-[10px] font-bold text-[#0A0A14]">
                  {status === 'accepted' ? 'CAPTAIN DISPATCHED' : status === 'arriving' ? 'CAPTAIN ARRIVING' : status === 'in_progress' ? 'EN ROUTE TO DESTINATION' : 'TRIP COMPLETED'}
                </p>
                <p className="text-[10px] text-[#5B5B73]">
                  ETA ~{eta} MIN · Speed ~{captainLocation.speed || 32} km/h
                </p>
              </div>
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
          {/* RIDE START OTP CARD */}
          <div className="p-4 bg-gradient-to-r from-[#3A4DFF]/10 via-[#3A4DFF]/5 to-white border border-[#3A4DFF]/30 rounded-2xl flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#3A4DFF] text-white flex items-center justify-center font-bold shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="hud text-[10px] text-[#3A4DFF] font-bold block tracking-wider">
                  RIDE START OTP
                </span>
                <p className="text-xs text-[#5B5B73]">
                  Share with Captain {captain.name.split(' ')[0]} to verify ride
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-white px-3.5 py-1.5 rounded-xl border border-[#3A4DFF]/40 shadow-xs">
              <span className="font-mono text-xl font-black tracking-widest text-[#0A0A14]">{rideOtp}</span>
            </div>
          </div>

          {/* Captain Profile Card */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="hud text-xs text-[#5B5B73]">ASSIGNED CAPTAIN</span>
              <span className="hud text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold">
                VERIFIED
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#0A0A14] text-white flex items-center justify-center text-xl font-bold shadow-md">
                SP
              </div>
              <div>
                <h3 className="font-bold text-lg text-[#0A0A14]">{captain.name}</h3>
                <div className="flex items-center gap-1.5 text-xs text-[#5B5B73]">
                  <span className="flex items-center text-amber-500 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 mr-1" />
                    {captain.rating}
                  </span>
                  <span>· {captain.trips} trips</span>
                </div>
                <p className="text-xs font-mono font-semibold text-[#3A4DFF] mt-0.5">
                  {captain.plate}
                </p>
              </div>
            </div>

            <div className="p-3 bg-[#F1F0FA] rounded-2xl flex items-center justify-between text-xs">
              <div>
                <span className="text-[#5B5B73] block text-[10px]">VEHICLE</span>
                <span className="font-bold text-[#0A0A14]">{chosenVehicle?.label || captain.vehicleModel}</span>
              </div>
              <div className="text-right">
                <span className="text-[#5B5B73] block text-[10px]">VERIFICATION CODE</span>
                <span className="hud font-bold text-sm text-[#3A4DFF] bg-white px-2.5 py-0.5 rounded-lg border border-[#DCDAF0]">
                  OTP: {rideOtp}
                </span>
              </div>
            </div>

            {/* Payment Status & Pay Now Online for COD */}
            <div className="p-3.5 bg-white border border-[#DCDAF0] rounded-2xl text-xs space-y-2.5 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#3A4DFF]" />
                  <div>
                    <span className="text-[#5B5B73] block text-[10px]">PAYMENT METHOD</span>
                    <span className="font-bold text-[#0A0A14]">
                      {paymentStatus === 'paid' ? 'Paid Online via Razorpay' : 'Cash on Arrival (COD)'}
                    </span>
                  </div>
                </div>
                <span className={`hud text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                  {paymentStatus === 'paid' ? 'CAPTURED' : `₹${fare} DUE`}
                </span>
              </div>

              {/* Pay Now Online Option for COD users during ride */}
              {paymentStatus !== 'paid' && (
                <div className="p-3 bg-gradient-to-r from-[#3A4DFF]/10 via-[#3A4DFF]/5 to-transparent border border-[#3A4DFF]/25 rounded-xl space-y-1.5 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold text-[#0A0A14]">Want to switch to online payment?</p>
                    <span className="hud text-[9px] text-[#3A4DFF] font-bold">UPI · GPay · Cards</span>
                  </div>
                  <p className="text-[10px] text-[#5B5B73]">
                    Pay the ₹{fare} fare digitally right now and skip cash change hassle at destination.
                  </p>
                  <button
                    onClick={() => setIsPaymentModalOpen(true)}
                    className="w-full py-2 bg-[#3A4DFF] hover:bg-[#2b3cee] text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-98"
                  >
                    <Lock className="w-3.5 h-3.5 text-white" />
                    <span>Pay ₹{fare} Online Now</span>
                  </button>
                </div>
              )}
            </div>

            <div className="pt-2 flex gap-3">
              <a
                href={`tel:${captain.phone}`}
                className="flex-1 py-3 bg-[#0A0A14] hover:bg-black text-white rounded-full text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Call Captain</span>
              </a>

              <button
                onClick={handleShareTrip}
                className="px-4 py-3 bg-white hover:bg-[#F1F0FA] text-[#0A0A14] border border-[#DCDAF0] rounded-full text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                title="Share Trip Link"
              >
                <Share2 className="w-4 h-4 text-[#3A4DFF]" />
                <span>{shareCopied ? 'Copied!' : 'Share'}</span>
              </button>
            </div>
          </Card>

          {/* Safety & SOS Module */}
          <Card className="p-6 space-y-4 border-l-4 border-l-[#EF2B3E]">
            <div className="flex items-center gap-2 text-[#EF2B3E]">
              <ShieldCheck className="w-5 h-5" />
              <h4 className="font-bold text-sm text-[#0A0A14]">Belagavi Ride Guard</h4>
            </div>
            <p className="text-xs text-[#5B5B73] leading-relaxed">
              Your route is actively GPS monitored by MySawari safety algorithms. In case of unexpected detour or emergency, tap SOS immediately.
            </p>
            <button
              onClick={handleTriggerSos}
              className="w-full py-3 bg-[#EF2B3E] hover:bg-[#d82234] text-white rounded-full text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <AlertTriangle className="w-4 h-4 fill-white" />
              <span>TRIGGER EMERGENCY SOS</span>
            </button>

            <button
              onClick={() => setShowContactsModal(true)}
              className="w-full py-2 bg-white hover:bg-[#F1F0FA] text-[#3A4DFF] border border-[#DCDAF0] rounded-full text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-[#3A4DFF]" />
              <span>Manage Emergency Contacts (SMS & WhatsApp)</span>
            </button>
          </Card>

          {/* Post-Ride Rating Card when Completed */}
          {status === 'completed' && (
            <Card className="p-6 space-y-4 bg-gradient-to-br from-emerald-50 to-white border-emerald-200 animate-fade-in">
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="w-5 h-5" />
                <h4 className="font-bold text-sm">Trip Completed Successfully!</h4>
              </div>

              {/* Coins Earned Banner */}
              <div className="p-3 bg-amber-100/70 border border-amber-300 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🪙</span>
                  <div>
                    <h5 className="text-xs font-bold text-amber-900">+10 MySawari Coins Earned!</h5>
                    <p className="text-[10px] text-amber-700">Usable for next ride discount</p>
                  </div>
                </div>
                <span className="hud text-xs font-bold text-amber-800 bg-amber-200 px-2 py-0.5 rounded-full">
                  REWARD
                </span>
              </div>

              {/* Payment Receipt / Pay Online via Razorpay */}
              {paymentStatus === 'paid' ? (
                <div className="p-3.5 bg-white border border-emerald-200 rounded-2xl space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="hud text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> RAZORPAY PAYMENT CAPTURED
                    </span>
                    <span className="font-mono font-bold text-[#0A0A14]">₹{fare}</span>
                  </div>
                  <div className="font-mono text-[10px] text-[#5B5B73] space-y-0.5">
                    <p>Payment ID: <span className="text-[#0A0A14] font-semibold">{paymentData?.paymentId || 'pay_rzp_live'}</span></p>
                    <p>Order ID: <span className="truncate block">{paymentData?.orderId || 'order_rzp_live'}</span></p>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#0A0A14] font-bold">Fare Payable: ₹{fare}</span>
                    <span className="hud text-[9px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-bold">CASH PENDING</span>
                  </div>
                  <p className="text-[11px] text-[#5B5B73]">Pay effortlessly online using UPI, Google Pay or Card via Razorpay.</p>
                  <button
                    onClick={() => setIsPaymentModalOpen(true)}
                    className="w-full py-2.5 bg-[#3A4DFF] hover:bg-[#2b3cee] text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Lock className="w-3.5 h-3.5 text-white" />
                    <span>Pay ₹{fare} Online via Razorpay</span>
                  </button>
                </div>
              )}

              {!ratingSubmitted ? (
                <div className="space-y-3">
                  <p className="text-xs text-[#5B5B73]">How was your ride with {captain.name}?</p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className="p-1 cursor-pointer"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setRatingSubmitted(true)}
                    className="w-full py-2.5 bg-[#0A0A14] text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Submit Rating
                  </button>
                </div>
              ) : (
                <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Thank you for rating {rating} stars!
                </p>
              )}
            </Card>
          )}
        </div>
      </div>

      {/* Razorpay Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        amount={fare}
        rideDetails={{ pickup: pickupName, drop: dropName }}
        onPaymentSuccess={(data) => {
          setPaymentStatus('paid');
          setPaymentData(data);
        }}
      />

      {/* Real SOS Emergency Activation Modal (SMS & WhatsApp ONLY) */}
      <SosActivationModal
        isOpen={showSosModal}
        onClose={() => setShowSosModal(false)}
        ride={{
          id: 'RIDE-BEL-802',
          pickupLocation: { name: pickupName },
          dropLocation: { name: dropName },
          customerName: 'Dhruv Patil',
          captain: { name: captain.name, vehicleNumber: captain.vehicleNumber || 'KA-22-EZ-4091' }
        }}
        currentLocation={{ latitude: pickupCoords.lat, longitude: pickupCoords.lng }}
      />

      {/* Emergency Contacts Management Modal */}
      <EmergencyContactsModal
        isOpen={showContactsModal}
        onClose={() => setShowContactsModal(false)}
      />
    </div>
  );
}
