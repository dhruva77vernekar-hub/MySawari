import React, { useState } from 'react';
import { 
  User, 
  Phone, 
  Mail, 
  ShieldCheck, 
  Coins, 
  Car, 
  MapPin, 
  CreditCard, 
  Edit3, 
  Check, 
  Award,
  AlertTriangle,
  Bell,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function ProfileView() {
  const { user, logout, addCoins } = useAuth();

  const [emergencyPhone, setEmergencyPhone] = useState(
    () => localStorage.getItem('mysawari_emergency_contact') || '+91 91122 33445'
  );
  const [emergencyName, setEmergencyName] = useState(
    () => localStorage.getItem('mysawari_emergency_name') || 'Family Contact (Dad)'
  );
  const [autoGpsSharing, setAutoGpsSharing] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [redeemSuccess, setRedeemSuccess] = useState(null);

  const coins = user?.coins || 120;

  const handleSaveEmergency = (e) => {
    e.preventDefault();
    localStorage.setItem('mysawari_emergency_contact', emergencyPhone);
    localStorage.setItem('mysawari_emergency_name', emergencyName);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleRedeem = (amount, cost) => {
    if (coins < cost) {
      alert(`You need at least ${cost} coins to redeem this coupon.`);
      return;
    }
    setRedeemSuccess(`Coupon ₹${amount} OFF applied to your next Belagavi ride!`);
    setTimeout(() => setRedeemSuccess(null), 3500);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 animate-fade-in space-y-6">
      {/* Top Profile Summary Card */}
      <div className="bg-white rounded-[32px] border border-[#DCDAF0] p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <div className="relative w-20 h-20 rounded-full bg-[#0A0A14] text-white flex items-center justify-center text-2xl font-bold shadow-md">
            {user?.fullName ? user.fullName.slice(0, 2).toUpperCase() : 'DV'}
            <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-[10px]">
              ✓
            </span>
          </div>

          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-[#0A0A14]">
                {user?.fullName || 'Dhruv Vernekar'}
              </h2>
              <span className="hud text-[9px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                VERIFIED RIDER
              </span>
            </div>
            <p className="text-xs text-[#5B5B73] mt-0.5">Tier 2 Urban Mobility · Belagavi City</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-[#5B5B73] mt-2">
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-[#3A4DFF]" />
                {user?.phone || '+91 98450 12345'}
              </span>
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-[#3A4DFF]" />
                {user?.email || 'dhruv@mysawari.in'}
              </span>
            </div>
          </div>
        </div>

        {/* Coins Badge Box */}
        <div className="bg-[#FFC21A]/15 border border-[#FFC21A]/40 rounded-2xl p-4 text-center sm:text-right w-full sm:w-auto">
          <span className="hud text-[9px] font-bold text-[#A67800] block">MYSAWARI REWARD COINS</span>
          <div className="flex items-center justify-center sm:justify-end gap-1.5 text-2xl font-bold font-mono text-[#0A0A14] mt-0.5">
            <span>🪙</span>
            <span>{coins}</span>
          </div>
          <span className="text-[10px] text-[#5B5B73] block mt-0.5">Worth ₹50 in ride credits</span>
        </div>
      </div>

      {/* Grid: Emergency SOS Setup & Reward Redemption */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Emergency SOS Contact Configuration */}
        <div className="bg-white rounded-[28px] border border-[#DCDAF0] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#DCDAF0]">
            <div className="flex items-center gap-2 text-[#EF2B3E]">
              <ShieldCheck className="w-5 h-5" />
              <h3 className="font-bold text-sm text-[#0A0A14]">Emergency SOS Setup</h3>
            </div>
            <span className="hud text-[9px] bg-red-100 text-[#EF2B3E] font-bold px-2 py-0.5 rounded-full">
              BELAGAVI 112 READY
            </span>
          </div>

          <p className="text-xs text-[#5B5B73]">
            When you activate SOS on the front page or during a trip, your live GPS location and distress message are instantly broadcasted to this contact and emergency services.
          </p>

          <form onSubmit={handleSaveEmergency} className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-[#5B5B73] uppercase block mb-1">
                Contact Name / Relationship
              </label>
              <input
                type="text"
                value={emergencyName}
                onChange={(e) => setEmergencyName(e.target.value)}
                className="w-full bg-[#F1F0FA] rounded-xl px-3 py-2 text-xs text-[#0A0A14] border border-[#DCDAF0] outline-none focus:border-[#EF2B3E]"
                placeholder="e.g. Dad, Sister, Friend"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-[#5B5B73] uppercase block mb-1">
                Emergency Phone Number
              </label>
              <input
                type="tel"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                className="w-full bg-[#F1F0FA] rounded-xl px-3 py-2 text-xs text-[#0A0A14] border border-[#DCDAF0] outline-none focus:border-[#EF2B3E]"
                placeholder="+91 91122 33445"
                required
              />
            </div>

            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-[#5B5B73]">Auto-broadcast Live Location</span>
              <button
                type="button"
                onClick={() => setAutoGpsSharing(!autoGpsSharing)}
                className={`w-11 h-6 rounded-full transition-colors p-0.5 cursor-pointer ${autoGpsSharing ? 'bg-[#10B981]' : 'bg-[#DCDAF0]'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${autoGpsSharing ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#0A0A14] hover:bg-black text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {isSaved ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Edit3 className="w-3.5 h-3.5" />}
              <span>{isSaved ? 'Emergency Contact Saved!' : 'Save Emergency Setup'}</span>
            </button>
          </form>
        </div>

        {/* MySawari Coins & Coupon Store */}
        <div className="bg-white rounded-[28px] border border-[#DCDAF0] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#DCDAF0]">
            <div className="flex items-center gap-2 text-[#FFC21A]">
              <Coins className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-sm text-[#0A0A14]">Coin Redemption</h3>
            </div>
            <span className="hud text-[9px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
              INSTANT COUPONS
            </span>
          </div>

          <p className="text-xs text-[#5B5B73]">
            Earn 10 coins on every completed ride in Belagavi. Redeem them directly for upfront discounts on Auto, Bike, or Cab!
          </p>

          {redeemSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{redeemSuccess}</span>
            </div>
          )}

          <div className="space-y-2.5">
            <div className="p-3 rounded-2xl bg-[#F1F0FA] border border-[#DCDAF0] flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-[#0A0A14] block">₹20 OFF Ride Discount</span>
                <span className="text-[10px] text-[#5B5B73]">Cost: 50 Coins · Valid for 30 days</span>
              </div>
              <button
                onClick={() => handleRedeem(20, 50)}
                className="px-3 py-1.5 bg-[#FFC21A] hover:bg-[#e6ad12] text-[#0A0A14] font-bold text-xs rounded-xl cursor-pointer"
              >
                Redeem
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-[#F1F0FA] border border-[#DCDAF0] flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-[#0A0A14] block">₹50 OFF Ride Discount</span>
                <span className="text-[10px] text-[#5B5B73]">Cost: 100 Coins · Valid on Cab/Comfort</span>
              </div>
              <button
                onClick={() => handleRedeem(50, 100)}
                className="px-3 py-1.5 bg-[#FFC21A] hover:bg-[#e6ad12] text-[#0A0A14] font-bold text-xs rounded-xl cursor-pointer"
              >
                Redeem
              </button>
            </div>
          </div>

          {/* Saved Addresses */}
          <div className="pt-2 border-t border-[#DCDAF0] space-y-2 text-xs">
            <span className="text-[10px] font-bold text-[#5B5B73] uppercase block">Saved Shortcuts</span>
            <div className="flex items-center justify-between text-[11px] text-[#0A0A14]">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Home: Camp, Belagavi
              </span>
              <span className="text-[10px] text-[#8E96A6]">PRIMARY</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#0A0A14]">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#3A4DFF]" /> Campus: KLE Tech, Udyambag
              </span>
              <span className="text-[10px] text-[#8E96A6]">SAVED</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
