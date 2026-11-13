import React, { useState } from 'react';
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
  Upload, 
  Plus, 
  Phone, 
  MapPin, 
  Clock, 
  Sparkles,
  Camera,
  Share2
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function MenuOverlay({ isOpen, onClose }) {
  const { lang, setLang, t } = useLanguage();
  const [activeModal, setActiveModal] = useState(null); // 'buddy' | 'route' | 'pass' | 'lang' | 'sos' | 'about' | null

  // Ride Buddy State
  const [buddyEnabled, setBuddyEnabled] = useState(true);
  const [buddyConfirmed, setBuddyConfirmed] = useState(false);

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
  const [emergencyPhone, setEmergencyPhone] = useState('+91 94481 23456');
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

  const menuItems = [
    {
      id: 'buddy',
      title: t('rideBuddy'),
      sub: 'Pool with Consent & Split Fare',
      desc: t('rideBuddyDesc'),
      icon: Users,
      badge: 'Split Fare',
      badgeColor: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
      iconBg: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    },
    {
      id: 'route',
      title: t('routeAssist'),
      sub: 'Crowdsourced Road & Closure Alerts',
      desc: t('routeAssistDesc'),
      icon: AlertTriangle,
      badge: 'Live Reports',
      badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      iconBg: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    },
    {
      id: 'pass',
      title: t('ridePass'),
      sub: 'Route Subscriptions & Passes',
      desc: t('ridePassDesc'),
      badge: 'Save 40%',
      badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      iconBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    },
    {
      id: 'lang',
      title: t('language'),
      sub: 'English · ಕನ್ನಡ · हिंदी',
      desc: t('languageDesc'),
      badge: lang.toUpperCase(),
      badgeColor: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
      iconBg: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
    },
    {
      id: 'sos',
      title: t('sosSetup'),
      sub: 'Pre-configure Contacts & Live GPS',
      desc: t('sosSetupDesc'),
      badge: 'Safety Pre-check',
      badgeColor: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      iconBg: 'bg-rose-500/20 text-rose-400 border-rose-500/30'
    },
    {
      id: 'about',
      title: t('aboutMySawari'),
      sub: 'Smart Mobility for Belagavi',
      desc: t('aboutDesc'),
      badge: 'Belagavi v3.0',
      badgeColor: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
      iconBg: 'bg-violet-500/20 text-violet-400 border-violet-500/30'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0A14]/96 backdrop-blur-2xl text-white flex flex-col justify-between p-4 sm:p-8 md:p-12 overflow-y-auto animate-fade-in">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-white/10 pb-5 max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-[#3A4DFF] animate-pulse" />
          <span className="hud text-xs text-[#C9CFDA] tracking-widest uppercase font-semibold">
            MYSAWARI · {t('menu')}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white cursor-pointer"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Menu: One Below One (Single Column Stack) */}
      <div className="max-w-2xl mx-auto w-full my-auto py-6 space-y-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveModal(item.id)}
              className="group w-full p-4 sm:p-5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-[#3A4DFF]/60 transition-all text-left flex items-center justify-between shadow-sm cursor-pointer hover:translate-x-1 duration-200"
            >
              <div className="flex items-center gap-4 min-w-0 pr-3">
                <div className={`p-3 rounded-xl border ${item.iconBg} flex-shrink-0 group-hover:scale-105 transition-transform`}>
                  {Icon && <Icon className="w-5 h-5 sm:w-6 sm:h-6" />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-[#45E0F2] transition-colors truncate">
                      {item.title}
                    </h3>
                    <span className={`hud text-[9px] px-2 py-0.5 rounded-full border ${item.badgeColor} font-semibold`}>
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-xs text-[#8E96A6] mt-0.5 truncate sm:whitespace-normal leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>

              <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-[#3A4DFF] group-hover:border-[#3A4DFF] transition-all flex-shrink-0">
                <ArrowRight className="w-4 h-4 text-[#8E96A6] group-hover:text-white" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="border-t border-white/10 pt-5 text-xs text-[#8E96A6] flex flex-col sm:flex-row items-center justify-between gap-3 max-w-2xl mx-auto w-full">
        <div>
          <span className="text-white font-medium">MySawari</span> · Belagavi Mobility Network
        </div>
        <div className="flex items-center gap-4">
          <span className="hover:text-white cursor-pointer" onClick={() => setActiveModal('lang')}>
            🌐 {lang === 'en' ? 'English' : lang === 'kn' ? 'ಕನ್ನಡ' : 'हिंदी'}
          </span>
          <span>Zero Commission Autos</span>
          <span>Verified Captains</span>
        </div>
      </div>

      {/* SUB-MODALS FOR EACH OF THE 6 FEATURES */}

      {/* 1. RIDE BUDDY MODAL */}
      {activeModal === 'buddy' && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121224] border border-[#3A4DFF]/40 rounded-3xl p-6 md:p-8 max-w-lg w-full text-white shadow-2xl relative animate-scale-up">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">Ride Buddy (Pool & Split)</h3>
                <span className="text-xs text-[#8E96A6]">Shared Commute with Rider Consent</span>
              </div>
            </div>

            <p className="text-sm text-[#C9CFDA] mb-6 leading-relaxed">
              If you are riding from <span className="text-white font-semibold">Place A</span> to <span className="text-white font-semibold">Place C</span>, another commuter at <span className="text-white font-semibold">Place B</span> headed to Place C can request to join. With your permission, the ride is shared and fare is split automatically.
            </p>

            <div className="bg-white/5 rounded-2xl p-4 border border-white/10 mb-6 space-y-3">
              <div className="flex items-center justify-between text-xs text-[#8E96A6]">
                <span>SAMPLE RIDE BUDDY MATCH</span>
                <span className="text-emerald-400 font-bold">SAVE 42% FARE</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Your Route (Place A ➔ C):</span>
                  <span className="font-semibold text-white">KLE Tech ➔ Chennamma Circle</span>
                </div>
                <div className="flex items-center justify-between text-xs text-blue-300">
                  <span>Buddy Pickup (Place B):</span>
                  <span>Bogarves Plaza (On Route)</span>
                </div>
                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-sm">
                  <span>Standard Fare: <span className="line-through text-[#8E96A6]">₹120</span></span>
                  <span className="text-emerald-400 font-bold text-base">Your Split: ₹68</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-white/[0.03] rounded-xl border border-white/10 mb-6">
              <span className="text-xs text-[#C9CFDA]">Accept Ride Buddy Requests</span>
              <button
                onClick={() => setBuddyEnabled(!buddyEnabled)}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${buddyEnabled ? 'bg-[#3A4DFF]' : 'bg-white/20'}`}
              >
                <span className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${buddyEnabled ? 'right-0.5' : 'left-0.5'}`} />
              </button>
            </div>

            <button
              onClick={() => {
                setBuddyConfirmed(true);
                setTimeout(() => {
                  setBuddyConfirmed(false);
                  setActiveModal(null);
                }, 1800);
              }}
              className="w-full py-3.5 rounded-xl bg-[#3A4DFF] hover:bg-[#3242E0] font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#3A4DFF]/30 cursor-pointer"
            >
              {buddyConfirmed ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Ride Buddy Active on Your Account</span>
                </>
              ) : (
                <>
                  <Users className="w-4 h-4" />
                  <span>Confirm Ride Buddy Preferences</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 2. ROUTE ASSIST MODAL */}
      {activeModal === 'route' && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121224] border border-amber-500/40 rounded-3xl p-6 md:p-8 max-w-lg w-full text-white shadow-2xl relative animate-scale-up max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">Route Assist</h3>
                <span className="text-xs text-[#8E96A6]">Road Closures & Community Detour Alerts</span>
              </div>
            </div>

            <p className="text-xs text-[#C9CFDA] mb-4">
              Upload photos of road blocks, waterlogging, or diversions in Belagavi so our smart router avoids those stretches for all riders and captains.
            </p>

            {/* Live active alerts */}
            <div className="space-y-2 mb-6">
              <span className="hud text-[10px] text-amber-400 font-bold block">LIVE BELAGAVI REPORTS</span>
              {reports.map((r) => (
                <div key={r.id} className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center gap-3">
                  <img src={r.image} alt={r.location} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">{r.location}</h4>
                    <p className="text-[11px] text-amber-300 truncate">{r.type}</p>
                    <span className="text-[10px] text-[#8E96A6]">{r.time} · Verified by MySawari</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Form to submit new route alert */}
            <form onSubmit={handleAddReport} className="bg-white/[0.04] p-4 rounded-2xl border border-white/10 space-y-3">
              <span className="hud text-[10px] text-white font-bold block">REPORT A ROAD PROBLEM</span>
              <input
                type="text"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="Street / Landmark (e.g. Khade Bazar Road)"
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-white placeholder-[#8E96A6] focus:outline-none focus:border-amber-400"
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-white focus:outline-none"
                >
                  <option value="Road Closure">Road Closure</option>
                  <option value="Pipeline Repair">Pipeline Repair</option>
                  <option value="Waterlogging">Waterlogging</option>
                  <option value="Heavy Traffic">Heavy Traffic Jam</option>
                </select>

                <label className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-xs cursor-pointer text-[#C9CFDA]">
                  <Camera className="w-3.5 h-3.5 text-amber-400" />
                  <span>{previewImage ? 'Photo Added' : 'Attach Photo'}</span>
                  <input type="file" accept="image/*" onChange={handleImagePick} className="hidden" />
                </label>
              </div>

              {previewImage && (
                <div className="relative w-full h-20 rounded-lg overflow-hidden border border-white/10">
                  <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setPreviewImage(null)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {reportSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-black" />
                    <span>Alert Published & Routes Updated!</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Publish Road Closure Alert</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. RIDE PASS MODAL */}
      {activeModal === 'pass' && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121224] border border-emerald-500/40 rounded-3xl p-6 md:p-8 max-w-lg w-full text-white shadow-2xl relative animate-scale-up">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">MySawari Ride Pass</h3>
                <span className="text-xs text-[#8E96A6]">Subscription Pass for Daily Commuters</span>
              </div>
            </div>

            <p className="text-xs text-[#C9CFDA] mb-4">
              Save up to 40% on daily office & student commutes in Belagavi. Select a pass tier for your regular route:
            </p>

            <div className="mb-4">
              <label className="text-[11px] text-[#8E96A6] block mb-1">SELECT YOUR PRIMARY COMMUTE ROUTE</label>
              <select
                value={passRoute}
                onChange={(e) => setPassRoute(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none"
              >
                <option value="KLE Tech ⇄ Rani Chennamma Circle">KLE Tech Campus ⇄ Rani Chennamma Circle</option>
                <option value="VTU Campus ⇄ Belagavi Railway Station">VTU Campus ⇄ Belagavi Railway Station</option>
                <option value="Bogarves Plaza ⇄ Camp & Cantonment">Bogarves Plaza ⇄ Camp & Cantonment</option>
                <option value="Udyambag Industrial ⇄ Khade Bazar">Udyambag Industrial ⇄ Khade Bazar</option>
              </select>
            </div>

            {/* Pass Tiers */}
            <div className="grid grid-cols-3 gap-2.5 mb-6">
              <button
                type="button"
                onClick={() => setSelectedPass('daily')}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                  selectedPass === 'daily'
                    ? 'bg-emerald-500/20 border-emerald-400 text-white'
                    : 'bg-white/5 border-white/10 text-[#8E96A6] hover:bg-white/10'
                }`}
              >
                <span className="hud text-[9px] block">DAILY</span>
                <span className="text-xl font-bold text-white block mt-1">₹49</span>
                <span className="text-[10px] text-emerald-300">2 Rides/day</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPass('monthly')}
                className={`p-3 rounded-2xl border text-center transition-all relative cursor-pointer ${
                  selectedPass === 'monthly'
                    ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-lg shadow-emerald-500/10'
                    : 'bg-white/5 border-white/10 text-[#8E96A6] hover:bg-white/10'
                }`}
              >
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full bg-emerald-500 text-[8px] font-bold text-black uppercase">
                  Best Value
                </span>
                <span className="hud text-[9px] block">MONTHLY</span>
                <span className="text-xl font-bold text-white block mt-1">₹799</span>
                <span className="text-[10px] text-emerald-300">60 Rides</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPass('yearly')}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                  selectedPass === 'yearly'
                    ? 'bg-emerald-500/20 border-emerald-400 text-white'
                    : 'bg-white/5 border-white/10 text-[#8E96A6] hover:bg-white/10'
                }`}
              >
                <span className="hud text-[9px] block">ANNUAL</span>
                <span className="text-xl font-bold text-white block mt-1">₹4999</span>
                <span className="text-[10px] text-emerald-300">Unlimited</span>
              </button>
            </div>

            <button
              onClick={() => {
                setPassSubscribed(true);
                setTimeout(() => {
                  setPassSubscribed(false);
                  setActiveModal(null);
                }, 1800);
              }}
              className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 font-bold text-sm text-black flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              {passSubscribed ? (
                <>
                  <Check className="w-4 h-4 text-black" />
                  <span>Pass Activated! Zero Fare applied</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Subscribe to {selectedPass.toUpperCase()} Pass</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 4. LANGUAGE MODAL */}
      {activeModal === 'lang' && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121224] border border-cyan-500/40 rounded-3xl p-6 md:p-8 max-w-md w-full text-white shadow-2xl relative animate-scale-up">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">Select Language / ಭಾಷೆ / भाषा</h3>
                <span className="text-xs text-[#8E96A6]">Change Interface Language</span>
              </div>
            </div>

            <div className="space-y-3 my-6">
              <button
                onClick={() => { setLang('en'); }}
                className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                  lang === 'en'
                    ? 'bg-cyan-500/20 border-cyan-400 text-white'
                    : 'bg-white/5 border-white/10 text-[#C9CFDA] hover:bg-white/10'
                }`}
              >
                <div className="text-left">
                  <span className="text-base font-bold block">English</span>
                  <span className="text-xs text-[#8E96A6]">Default platform interface</span>
                </div>
                {lang === 'en' && <Check className="w-5 h-5 text-cyan-400" />}
              </button>

              <button
                onClick={() => { setLang('kn'); }}
                className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                  lang === 'kn'
                    ? 'bg-cyan-500/20 border-cyan-400 text-white'
                    : 'bg-white/5 border-white/10 text-[#C9CFDA] hover:bg-white/10'
                }`}
              >
                <div className="text-left">
                  <span className="text-base font-bold block">ಕನ್ನಡ (Kannada)</span>
                  <span className="text-xs text-[#8E96A6]">ಕರ್ನಾಟಕದ ಅಧಿಕೃತ ಭಾಷೆ</span>
                </div>
                {lang === 'kn' && <Check className="w-5 h-5 text-cyan-400" />}
              </button>

              <button
                onClick={() => { setLang('hi'); }}
                className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                  lang === 'hi'
                    ? 'bg-cyan-500/20 border-cyan-400 text-white'
                    : 'bg-white/5 border-white/10 text-[#C9CFDA] hover:bg-white/10'
                }`}
              >
                <div className="text-left">
                  <span className="text-base font-bold block">हिंदी (Hindi)</span>
                  <span className="text-xs text-[#8E96A6]">सरल और सहज इंटरफ़ेस</span>
                </div>
                {lang === 'hi' && <Check className="w-5 h-5 text-cyan-400" />}
              </button>
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-sm transition-all shadow-lg shadow-cyan-500/20 cursor-pointer"
            >
              Apply Language ({lang.toUpperCase()})
            </button>
          </div>
        </div>
      )}

      {/* 5. SOS EMERGENCY SETUP MODAL */}
      {activeModal === 'sos' && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121224] border border-rose-500/40 rounded-3xl p-6 md:p-8 max-w-lg w-full text-white shadow-2xl relative animate-scale-up">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">Emergency SOS Pre-Setup</h3>
                <span className="text-xs text-[#8E96A6]">Early Emergency Contacts & Live Location Broadcast</span>
              </div>
            </div>

            <p className="text-xs text-[#C9CFDA] mb-4">
              Configure your emergency safety settings now. During any trip, 1-tap SOS alerts our Belagavi safety response center and broadcasts your live GPS map link.
            </p>

            <div className="space-y-3 mb-5">
              <div>
                <label className="text-[11px] text-[#8E96A6] block mb-1">PRIMARY EMERGENCY CONTACT</label>
                <input
                  type="tel"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-rose-400"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#8E96A6] block mb-1">SECONDARY CONTACT (OPTIONAL)</label>
                <input
                  type="tel"
                  value={secondaryPhone}
                  onChange={(e) => setSecondaryPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                <div>
                  <span className="text-xs font-bold text-white block">Auto Send Live GPS Location</span>
                  <span className="text-[10px] text-rose-300">Automatically SMS live ride tracking link on SOS trigger</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoShareGps(!autoShareGps)}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${autoShareGps ? 'bg-rose-500' : 'bg-white/20'}`}
                >
                  <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${autoShareGps ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                setSosSaved(true);
                setTimeout(() => {
                  setSosSaved(false);
                  setActiveModal(null);
                }, 1800);
              }}
              className="w-full py-3.5 rounded-xl bg-rose-500 hover:bg-rose-600 font-bold text-sm text-white flex items-center justify-center gap-2 transition-all shadow-lg shadow-rose-500/30 cursor-pointer"
            >
              {sosSaved ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Emergency Safety Preferences Saved!</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4" />
                  <span>Save Emergency SOS Details</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 6. ABOUT MYSAWARI MODAL */}
      {activeModal === 'about' && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121224] border border-violet-500/40 rounded-3xl p-6 md:p-8 max-w-lg w-full text-white shadow-2xl relative animate-scale-up">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-violet-500/20 text-violet-400">
                <Info className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">About MySawari</h3>
                <span className="text-xs text-[#8E96A6]">Belagavi's 3D Smart Mobility Network</span>
              </div>
            </div>

            <div className="space-y-4 text-xs text-[#C9CFDA] leading-relaxed">
              <p>
                <strong className="text-white">MySawari (ಮೈಸವಾರಿ / मायसवारी)</strong> is Belagavi's first intelligent 3D ride dispatch and commuter pooling platform, designed specifically to tackle the urban transit challenges of tier-2 cities.
              </p>

              <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-2">
                <h4 className="hud text-[10px] text-violet-400 font-bold uppercase">Our Core Pillars</h4>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Zero Commission Autos:</strong> 100% of auto fares go to local drivers with no predatory platform cuts.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>3D Vehicle Morph Engine:</strong> Real-time interactive vehicle preview powered by Three.js.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>MySawari Coins:</strong> Every ride earns 10 coins redeemable for discounts on future commutes.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Safety & SOS First:</strong> Built-in route diversion alerts and 1-tap live GPS tracking.</span>
                </div>
              </div>

              <div className="text-[11px] text-[#8E96A6] pt-2 border-t border-white/10 flex items-center justify-between">
                <span>Version: 3.0.0 (Hackathon Release)</span>
                <span>Team Polar Geeks · Belagavi</span>
              </div>
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="mt-6 w-full py-3 rounded-xl bg-violet-500 hover:bg-violet-600 text-white font-bold text-xs transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
