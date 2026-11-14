import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  Users, 
  AlertTriangle, 
  CreditCard, 
  Globe, 
  ShieldAlert, 
  Info, 
  ArrowRight, 
  Check, 
  Camera, 
  Car,
  Phone,
  MapPin,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Compass
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import EmergencyContactsModal from '../safety/EmergencyContactsModal';

export default function MenuOverlay({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { lang, setLang, t } = useLanguage();
  const { user, updateEmergencyContact } = useAuth();
  const [activeModal, setActiveModal] = useState(null); // 'buddy' | 'route' | 'pass' | 'lang' | 'sos' | 'about' | null

  // Route Assist State
  const [reports, setReports] = useState([
    {
      id: 1,
      location: 'Khade Bazar Main Road',
      type: 'Road Closure / Pipeline Work',
      time: '12 mins ago',
      verified: true,
      image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=300&auto=format&fit=crop&q=60'
    },
    {
      id: 2,
      location: 'CBT Circle to Station Flyover',
      type: 'Heavy Congestion & Repair',
      time: '28 mins ago',
      verified: true,
      image: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=300&auto=format&fit=crop&q=60'
    }
  ]);
  const [newLocation, setNewLocation] = useState('');
  const [newType, setNewType] = useState('Road Closure');
  const [previewImage, setPreviewImage] = useState(null);
  const [reportSuccess, setReportSuccess] = useState(false);

  // Ride Pass State
  const [selectedPass, setSelectedPass] = useState('monthly');
  const [passRoute, setPassRoute] = useState('KLE Tech ⇄ Rani Chennamma Circle');
  const [passSubscribed, setPassSubscribed] = useState(false);

  // SOS Setup State
  const [emergencyPhone, setEmergencyPhone] = useState(
    () => user?.emergencyContact || localStorage.getItem('mysawari_emergency_contact') || '+91 94481 23456'
  );
  const [secondaryPhone, setSecondaryPhone] = useState('+91 98450 98765');
  const [autoShareGps, setAutoShareGps] = useState(true);
  const [sosSaved, setSosSaved] = useState(false);

  if (!isOpen) return null;

  const handleImagePick = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleAddReport = (e) => {
    e.preventDefault();
    if (!newLocation.trim()) return;
    const newEntry = {
      id: Date.now(),
      location: newLocation,
      type: newType,
      time: 'Just now',
      verified: false,
      image: previewImage || 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=300&auto=format&fit=crop&q=60'
    };
    setReports([newEntry, ...reports]);
    setNewLocation('');
    setPreviewImage(null);
    setReportSuccess(true);
    setTimeout(() => setReportSuccess(false), 3000);
  };

  const menuSections = [
    {
      id: 'book',
      title: 'Book a Ride',
      desc: 'Instant auto, cab, bike & comfort booking',
      badge: 'Zero Surge',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      iconBg: 'bg-emerald-500/10 text-emerald-600',
      icon: Car,
      onClick: () => {
        onClose();
        navigate('/book');
      }
    },
    {
      id: 'rider-portal',
      title: 'Rider / Captain Portal',
      desc: 'Online toggle, ride offers & enter passenger OTP',
      badge: 'Driver Mode',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      iconBg: 'bg-indigo-500/10 text-indigo-600',
      icon: Car,
      onClick: () => {
        onClose();
        navigate('/rider/dashboard');
      }
    },
    {
      id: 'rider-register',
      title: 'Drive with MySawari',
      desc: 'Register as a rider with DL & vehicle RC verification',
      badge: 'Earn Rewards',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      iconBg: 'bg-emerald-500/10 text-emerald-600',
      icon: Sparkles,
      onClick: () => {
        onClose();
        navigate('/rider/register');
      }
    },
    {
      id: 'admin-console',
      title: 'Admin Operations Hub',
      desc: 'Smart dispatch, driver approvals & auto-reassignment simulation',
      badge: 'Console',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      iconBg: 'bg-purple-500/10 text-purple-600',
      icon: ShieldCheck,
      onClick: () => {
        onClose();
        navigate('/admin');
      }
    },
    {
      id: 'login-switch',
      title: 'Sign In / Switch Role',
      desc: 'Switch between Customer, Rider & Admin accounts',
      badge: '3-Role Login',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      iconBg: 'bg-blue-500/10 text-blue-600',
      icon: Users,
      onClick: () => {
        onClose();
        navigate('/login');
      }
    },
    {
      id: 'buddy',
      title: 'Ride Buddy (Pool & Split)',
      desc: 'Share rides with on-route passengers and split fares',
      badge: 'Save 45%',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      iconBg: 'bg-blue-500/10 text-blue-600',
      icon: Users,
      onClick: () => setActiveModal('buddy')
    },
    {
      id: 'sos',
      title: 'Safety & Emergency SOS',
      desc: 'Set emergency contacts & live GPS beacon',
      badge: '24/7 Rapid',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
      iconBg: 'bg-rose-500/10 text-rose-600',
      icon: ShieldAlert,
      onClick: () => setActiveModal('sos')
    },
    {
      id: 'pass',
      title: 'Ride Pass & Passes',
      desc: 'Daily, monthly passes for commuters & students',
      badge: 'Up to 40% Off',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
      iconBg: 'bg-amber-500/10 text-amber-600',
      icon: CreditCard,
      onClick: () => setActiveModal('pass')
    },
    {
      id: 'route',
      title: 'Route Assist & Road Alerts',
      desc: 'Crowdsourced road closure & detour warnings',
      badge: 'Live Traffic',
      badgeColor: 'bg-orange-50 text-orange-800 border-orange-200',
      iconBg: 'bg-orange-500/10 text-orange-600',
      icon: AlertTriangle,
      onClick: () => setActiveModal('route')
    },
    {
      id: 'lang',
      title: 'Language / ಭಾಷೆ / भाषा',
      desc: 'Switch to English, Kannada or Hindi',
      badge: lang.toUpperCase(),
      badgeColor: 'bg-cyan-50 text-cyan-800 border-cyan-200',
      iconBg: 'bg-cyan-500/10 text-cyan-600',
      icon: Globe,
      onClick: () => setActiveModal('lang')
    },
    {
      id: 'about',
      title: 'About MySawari',
      desc: 'Belagavi smart mobility & zero-commission autos',
      badge: 'Belagavi v3.0',
      badgeColor: 'bg-purple-50 text-purple-800 border-purple-200',
      iconBg: 'bg-purple-500/10 text-purple-600',
      icon: Info,
      onClick: () => setActiveModal('about')
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#F1F0FA]/80 backdrop-blur-2xl text-[#0A0A14] flex flex-col justify-between p-4 sm:p-8 overflow-y-auto animate-fade-in">
      {/* Top Header Bar */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between pb-4 border-b border-[#DCDAF0]">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="MySawari" className="w-9 h-9 rounded-xl object-contain shadow-xs" />
          <div>
            <div className="flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-[#3A4DFF]" />
              <h2 className="font-extrabold text-base text-[#0A0A14] tracking-tight">
                MySawari Explore
              </h2>
            </div>
            <p className="text-[11px] text-[#5B5B73] font-medium">
              Belagavi City Smart Mobility & Ride Dispatch
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white hover:bg-[#E9ECF2] border border-[#DCDAF0] flex items-center justify-center text-[#0A0A14] shadow-xs cursor-pointer transition-all hover:scale-105 active:scale-95"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Grid of Pleasant, User-Friendly Cards */}
      <div className="max-w-4xl mx-auto w-full my-auto py-6 grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {menuSections.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={item.onClick}
              className="group p-4 sm:p-5 rounded-2xl bg-white hover:bg-white/95 border border-[#DCDAF0] hover:border-[#3A4DFF] hover:shadow-[0_8px_25px_-5px_rgba(58,77,255,0.14)] transition-all text-left flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-3.5 min-w-0 pr-2">
                <div className={`w-11 h-11 rounded-2xl ${item.iconBg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-sm sm:text-base text-[#0A0A14] group-hover:text-[#3A4DFF] transition-colors truncate">
                      {item.title}
                    </h3>
                    <span className={`hud text-[9px] px-2 py-0.5 rounded-full border ${item.badgeColor} font-bold`}>
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-xs text-[#5B5B73] mt-0.5 truncate leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>

              <div className="w-8 h-8 rounded-full bg-[#F1F0FA] group-hover:bg-[#3A4DFF] group-hover:text-white flex items-center justify-center transition-all flex-shrink-0">
                <ChevronRight className="w-4 h-4 text-[#5B5B73] group-hover:text-white" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="max-w-4xl mx-auto w-full pt-4 border-t border-[#DCDAF0] flex flex-col sm:flex-row items-center justify-between text-xs text-[#5B5B73] gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="font-bold text-[#0A0A14]">MySawari Belagavi Network</span>
          <span>· Zero Surge Commission</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setActiveModal('lang')}
            className="hover:text-[#3A4DFF] font-medium cursor-pointer"
          >
            🌐 {lang === 'en' ? 'English' : lang === 'kn' ? 'ಕನ್ನಡ' : 'हिंदी'}
          </button>
          <span>Verified Captains</span>
          <span>24/7 SOS Ready</span>
        </div>
      </div>

      {/* SUB-MODALS (Bright, Pleasant, Card-based) */}

      {/* 1. RIDE BUDDY MODAL */}
      {activeModal === 'buddy' && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-[#DCDAF0] rounded-3xl p-6 md:p-8 max-w-lg w-full text-[#0A0A14] shadow-2xl relative animate-scale-up">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#F1F0FA] hover:bg-[#E2E8F0] flex items-center justify-center text-[#5B5B73] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#0A0A14]">Ride Buddy · Pool & Split</h3>
                <span className="text-xs text-[#5B5B73]">Shared Commute with 100% Rider Consent</span>
              </div>
            </div>

            <p className="text-xs text-[#5B5B73] mb-5 leading-relaxed">
              If an active ride is passing your pickup and heading in your direction, you can request to share. Once approved by the passenger and captain, the route combines and your fare is automatically split!
            </p>

            <div className="bg-[#F8F9FD] rounded-2xl p-4 border border-[#DCDAF0] mb-5 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="hud text-[#3A4DFF] font-bold">ROUTE SHARING CORRIDOR</span>
                <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full text-[10px]">
                  SAVE UP TO 45%
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-[#5B5B73]">
                <div className="flex justify-between">
                  <span>Primary Route:</span>
                  <span className="font-bold text-[#0A0A14]">KLE Tech Campus ➔ Chennamma Circle</span>
                </div>
                <div className="flex justify-between text-blue-700">
                  <span>Buddy Pickup on-way:</span>
                  <span className="font-semibold">Bogarves Plaza (+1.2 km detour)</span>
                </div>
                <div className="pt-2 border-t border-[#DCDAF0] flex justify-between font-bold text-sm">
                  <span>Single Rider: ₹120</span>
                  <span className="text-emerald-600">Your Split: ₹68</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setActiveModal(null);
                onClose();
              }}
              className="w-full py-3.5 rounded-2xl bg-[#3A4DFF] hover:bg-[#2B3BE5] font-bold text-sm text-white flex items-center justify-center gap-2 transition-all shadow-md shadow-[#3A4DFF]/20 cursor-pointer"
            >
              <span>Explore Ride Buddy in Main Tab</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. ROUTE ASSIST MODAL */}
      {activeModal === 'route' && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-[#DCDAF0] rounded-3xl p-6 md:p-8 max-w-lg w-full text-[#0A0A14] shadow-2xl relative animate-scale-up max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#F1F0FA] hover:bg-[#E2E8F0] flex items-center justify-center text-[#5B5B73] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#0A0A14]">Route Assist & Road Alerts</h3>
                <span className="text-xs text-[#5B5B73]">Community Warnings for Belagavi Streets</span>
              </div>
            </div>

            {/* Active alerts */}
            <div className="space-y-2 mb-5">
              <span className="hud text-[10px] text-[#5B5B73] font-bold block">LIVE ROAD REPORTS</span>
              {reports.map((r) => (
                <div key={r.id} className="p-3 bg-[#F8F9FD] rounded-xl border border-[#DCDAF0] flex items-center gap-3">
                  <img src={r.image} alt={r.location} className="w-11 h-11 rounded-lg object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-[#0A0A14] truncate">{r.location}</h4>
                    <p className="text-[11px] text-amber-700 truncate">{r.type}</p>
                    <span className="text-[10px] text-[#8E96A6]">{r.time} · Verified</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Submit form */}
            <form onSubmit={handleAddReport} className="bg-[#F8F9FD] p-4 rounded-2xl border border-[#DCDAF0] space-y-3">
              <span className="hud text-[10px] text-[#0A0A14] font-bold block">REPORT A ROAD PROBLEM</span>
              <input
                type="text"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="Street / Landmark (e.g. Khade Bazar Road)"
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#DCDAF0] text-xs text-[#0A0A14] placeholder-[#8E96A6] outline-none focus:border-[#3A4DFF]"
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-white border border-[#DCDAF0] text-xs text-[#0A0A14] outline-none"
                >
                  <option value="Road Closure">Road Closure</option>
                  <option value="Pipeline Repair">Pipeline Repair</option>
                  <option value="Waterlogging">Waterlogging</option>
                  <option value="Heavy Traffic">Heavy Traffic Jam</option>
                </select>

                <label className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#DCDAF0] text-xs cursor-pointer text-[#5B5B73] hover:bg-[#F1F0FA]">
                  <Camera className="w-3.5 h-3.5 text-amber-500" />
                  <span>{previewImage ? 'Photo Attached' : 'Attach Photo'}</span>
                  <input type="file" accept="image/*" onChange={handleImagePick} className="hidden" />
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {reportSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Report Published & Routing Updated!</span>
                  </>
                ) : (
                  <span>Publish Alert</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. RIDE PASS MODAL */}
      {activeModal === 'pass' && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-[#DCDAF0] rounded-3xl p-6 md:p-8 max-w-lg w-full text-[#0A0A14] shadow-2xl relative animate-scale-up">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#F1F0FA] hover:bg-[#E2E8F0] flex items-center justify-center text-[#5B5B73] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#0A0A14]">Commuter Passes</h3>
                <span className="text-xs text-[#5B5B73]">Save up to 40% on Regular Routes</span>
              </div>
            </div>

            <div className="mb-4">
              <label className="text-[11px] text-[#5B5B73] block mb-1 font-semibold">SELECT ROUTE</label>
              <select
                value={passRoute}
                onChange={(e) => setPassRoute(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#F8F9FD] border border-[#DCDAF0] text-xs text-[#0A0A14] outline-none"
              >
                <option value="KLE Tech ⇄ Rani Chennamma Circle">KLE Tech Campus ⇄ Rani Chennamma Circle</option>
                <option value="VTU Campus ⇄ Belagavi Railway Station">VTU Campus ⇄ Belagavi Railway Station</option>
                <option value="Bogarves Plaza ⇄ Camp & Cantonment">Bogarves Plaza ⇄ Camp & Cantonment</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2.5 mb-5">
              <button
                type="button"
                onClick={() => setSelectedPass('daily')}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                  selectedPass === 'daily'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20'
                    : 'bg-[#F8F9FD] border-[#DCDAF0] text-[#5B5B73] hover:bg-white'
                }`}
              >
                <span className="hud text-[9px] block">DAILY</span>
                <span className="text-lg font-bold text-[#0A0A14] block mt-0.5">₹49</span>
                <span className="text-[10px] text-emerald-700">2 Rides</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPass('monthly')}
                className={`p-3 rounded-2xl border text-center transition-all relative cursor-pointer ${
                  selectedPass === 'monthly'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20'
                    : 'bg-[#F8F9FD] border-[#DCDAF0] text-[#5B5B73] hover:bg-white'
                }`}
              >
                <span className="hud text-[9px] block">MONTHLY</span>
                <span className="text-lg font-bold text-[#0A0A14] block mt-0.5">₹799</span>
                <span className="text-[10px] text-emerald-700">60 Rides</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPass('yearly')}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                  selectedPass === 'yearly'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20'
                    : 'bg-[#F8F9FD] border-[#DCDAF0] text-[#5B5B73] hover:bg-white'
                }`}
              >
                <span className="hud text-[9px] block">ANNUAL</span>
                <span className="text-lg font-bold text-[#0A0A14] block mt-0.5">₹4999</span>
                <span className="text-[10px] text-emerald-700">Unlimited</span>
              </button>
            </div>

            <button
              onClick={() => {
                setPassSubscribed(true);
                setTimeout(() => {
                  setPassSubscribed(false);
                  setActiveModal(null);
                }, 1600);
              }}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-bold text-sm text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
            >
              {passSubscribed ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Pass Activated!</span>
                </>
              ) : (
                <span>Subscribe to {selectedPass.toUpperCase()} Pass</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 4. LANGUAGE MODAL */}
      {activeModal === 'lang' && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-[#DCDAF0] rounded-3xl p-6 md:p-8 max-w-md w-full text-[#0A0A14] shadow-2xl relative animate-scale-up">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#F1F0FA] hover:bg-[#E2E8F0] flex items-center justify-center text-[#5B5B73] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-cyan-50 text-cyan-600">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#0A0A14]">Select Language / ಭಾಷೆ / भाषा</h3>
                <span className="text-xs text-[#5B5B73]">Choose Your Preferred Interface</span>
              </div>
            </div>

            <div className="space-y-2.5 my-5">
              <button
                onClick={() => setLang('en')}
                className={`w-full p-3.5 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                  lang === 'en'
                    ? 'bg-cyan-50 border-cyan-500 text-cyan-950 font-bold ring-2 ring-cyan-500/20'
                    : 'bg-[#F8F9FD] border-[#DCDAF0] text-[#0A0A14] hover:bg-white'
                }`}
              >
                <span>English (Default)</span>
                {lang === 'en' && <Check className="w-4 h-4 text-cyan-600" />}
              </button>

              <button
                onClick={() => setLang('kn')}
                className={`w-full p-3.5 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                  lang === 'kn'
                    ? 'bg-cyan-50 border-cyan-500 text-cyan-950 font-bold ring-2 ring-cyan-500/20'
                    : 'bg-[#F8F9FD] border-[#DCDAF0] text-[#0A0A14] hover:bg-white'
                }`}
              >
                <span>ಕನ್ನಡ (Kannada)</span>
                {lang === 'kn' && <Check className="w-4 h-4 text-cyan-600" />}
              </button>

              <button
                onClick={() => setLang('hi')}
                className={`w-full p-3.5 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                  lang === 'hi'
                    ? 'bg-cyan-50 border-cyan-500 text-cyan-950 font-bold ring-2 ring-cyan-500/20'
                    : 'bg-[#F8F9FD] border-[#DCDAF0] text-[#0A0A14] hover:bg-white'
                }`}
              >
                <span>हिंदी (Hindi)</span>
                {lang === 'hi' && <Check className="w-4 h-4 text-cyan-600" />}
              </button>
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-3.5 rounded-2xl bg-[#0A0A14] hover:bg-[#3A4DFF] text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              Apply Language ({lang.toUpperCase()})
            </button>
          </div>
        </div>
      )}

      {/* 5. SOS EMERGENCY CONTACTS MODAL */}
      <EmergencyContactsModal
        isOpen={activeModal === 'sos'}
        onClose={() => setActiveModal(null)}
      />

      {/* 6. ABOUT MODAL */}
      {activeModal === 'about' && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-[#DCDAF0] rounded-3xl p-6 md:p-8 max-w-lg w-full text-[#0A0A14] shadow-2xl relative animate-scale-up">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#F1F0FA] hover:bg-[#E2E8F0] flex items-center justify-center text-[#5B5B73] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <img src="/logo.png" alt="MySawari" className="w-10 h-10 rounded-xl object-contain shadow-xs" />
              <div>
                <h3 className="text-xl font-bold text-[#0A0A14]">About MySawari</h3>
                <span className="text-xs text-[#5B5B73]">Belagavi Smart Mobility Platform</span>
              </div>
            </div>

            <div className="space-y-3 text-xs text-[#5B5B73] leading-relaxed mb-5">
              <p>
                <strong className="text-[#0A0A14]">MySawari</strong> is Belagavi's homegrown smart mobility network with 3D fleet dispatch, commuter pooling (Ride Buddy), and zero-surge upfront pricing.
              </p>
              <div className="p-3.5 bg-[#F8F9FD] rounded-2xl border border-[#DCDAF0] space-y-1.5 text-[11px]">
                <p>✓ <strong>Zero Commission:</strong> 100% of metered fares go directly to local auto drivers.</p>
                <p>✓ <strong>Ride Buddy:</strong> Pool rides with on-route commuters with explicit consent.</p>
                <p>✓ <strong>3D Fleet Preview:</strong> Real-time WebGL vehicle showroom.</p>
                <p>✓ <strong>Safety First:</strong> Live GPS beacon & 1-tap rapid dispatch.</p>
              </div>
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-3.5 rounded-2xl bg-[#0A0A14] text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
