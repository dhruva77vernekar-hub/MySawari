import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  X, 
  Coins, 
  Car, 
  CreditCard, 
  Gift, 
  Award, 
  HelpCircle, 
  Settings, 
  ChevronRight, 
  Share2, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import SettingsModal from './SettingsModal';

export default function ProfileDrawer({ isOpen, onClose }) {
  const { user, addCoins } = useAuth();
  const navigate = useNavigate();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'coins' | 'refer' | 'rewards' | 'payment' | 'help'
  const [copiedReferral, setCopiedReferral] = useState(false);
  const [redeemedCode, setRedeemedCode] = useState(false);

  if (!isOpen) return null;

  const handleCopyReferral = () => {
    navigator.clipboard?.writeText?.('MYSARI50');
    setCopiedReferral(true);
    setTimeout(() => setCopiedReferral(false), 2000);
  };

  const handleRedeemCoins = () => {
    setRedeemedCode(true);
    setTimeout(() => setRedeemedCode(false), 3000);
  };

  const menuItems = [
    {
      id: 'coins',
      label: 'MySawari Coins',
      badge: `${user?.coins || 120} Coins`,
      badgeColor: 'bg-[#FFC21A] text-[#0A0A14]',
      desc: 'Earn 10 coins every ride. Redeem for ₹20–₹50 discounts.',
      icon: Coins,
      action: () => setActiveModal('coins')
    },
    {
      id: 'my-rides',
      label: 'My Rides',
      desc: 'Trip history, driver ratings, and tax invoices.',
      icon: Car,
      action: () => {
        onClose();
        navigate('/history');
      }
    },
    {
      id: 'payment',
      label: 'Payment Methods',
      desc: 'UPI, Google Pay, Credit/Debit Cards, Cash.',
      icon: CreditCard,
      action: () => setActiveModal('payment')
    },
    {
      id: 'refer',
      label: 'Refer and Earn',
      badge: 'Get 50 Coins',
      badgeColor: 'bg-[#3A4DFF] text-white',
      desc: 'Invite friends in Belagavi & get free rides.',
      icon: Share2,
      action: () => setActiveModal('refer')
    },
    {
      id: 'rewards',
      label: 'My Rewards',
      badge: '2 Unlocked',
      badgeColor: 'bg-emerald-100 text-emerald-800',
      desc: 'Scratch cards, student passes & coupon vouchers.',
      icon: Award,
      action: () => setActiveModal('rewards')
    },
    {
      id: 'help',
      label: 'Help & Support',
      desc: '24/7 Safety hotline, lost items & trip assistance.',
      icon: HelpCircle,
      action: () => setActiveModal('help')
    },
    {
      id: 'settings',
      label: 'Settings',
      desc: 'Edit profile, saved shortcuts, about, logout & delete.',
      icon: Settings,
      action: () => setIsSettingsOpen(true)
    }
  ];

  return (
    <>
      <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-fade-in">
        {/* Backdrop click to close */}
        <div className="flex-1" onClick={onClose} />

        {/* Slide-out Drawer Container */}
        <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto border-l border-[#DCDAF0] p-6 space-y-6">
          
          {/* Top Bar with User Info */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-[#DCDAF0]">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="MySawari" className="w-6 h-6 rounded-lg object-contain shadow-xs" />
                <span className="hud text-xs text-[#3A4DFF] font-bold">MYSAWARI RIDER PROFILE</span>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-[#F1F0FA] hover:bg-[#E9ECF2] flex items-center justify-center text-[#5B5B73]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Profile Card */}
            <div className="p-4 bg-[#F1F0FA] rounded-2xl flex items-center gap-4 border border-[#DCDAF0]">
              <div className="w-14 h-14 rounded-full bg-[#0A0A14] text-white flex items-center justify-center text-lg font-bold shadow-md">
                {user?.fullName?.split(' ').map((n) => n[0]).join('').slice(0, 2) || 'DP'}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-[#0A0A14] truncate">{user?.fullName || 'Dhruv Patil'}</h3>
                  <span className="hud text-[9px] px-2 py-0.5 rounded-full bg-[#3A4DFF] text-white font-bold">
                    {user?.role?.toUpperCase() || 'RIDER'}
                  </span>
                </div>
                <p className="text-xs text-[#5B5B73] truncate">{user?.phone || '+91 98765 43210'}</p>
                <p className="text-[11px] text-[#8E96A6] truncate">{user?.email || 'dhruv@mysawari.app'}</p>
              </div>
            </div>

            {/* MySawari Coins Highlight Box */}
            <div
              onClick={() => setActiveModal('coins')}
              className="p-4 rounded-2xl bg-gradient-to-r from-[#FFC21A]/20 via-[#FFC21A]/10 to-[#F1F0FA] border-2 border-[#FFC21A] cursor-pointer hover:shadow-md transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-[#FFC21A] text-[#0A0A14] flex items-center justify-center font-bold text-lg shadow-sm">
                    🪙
                  </span>
                  <div>
                    <span className="hud text-[10px] text-[#0A0A14] font-bold block">MYSAWARI COINS BALANCE</span>
                    <span className="font-bold text-xl text-[#0A0A14] font-mono">{user?.coins || 120} Coins</span>
                  </div>
                </div>
                <span className="hud text-xs px-2.5 py-1 rounded-full bg-[#0A0A14] text-white font-bold">
                  REDEEM
                </span>
              </div>
              <p className="text-[11px] text-[#5B5B73]">
                Every completed ride adds <strong>+10 MySawari Coins</strong> to your wallet for instant discounts!
              </p>
            </div>
          </div>

          {/* Menu Options List */}
          <div className="space-y-2 flex-1 my-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  className="p-3.5 rounded-2xl border border-transparent hover:border-[#DCDAF0] hover:bg-[#F1F0FA] cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#F1F0FA] group-hover:bg-white text-[#3A4DFF] flex items-center justify-center transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#0A0A14]">{item.label}</span>
                        {item.badge && (
                          <span className={`hud text-[10px] px-2 py-0.5 rounded-full font-bold ${item.badgeColor}`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#5B5B73] line-clamp-1">{item.desc}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#8E96A6] group-hover:text-[#3A4DFF] group-hover:translate-x-1 transition-all" />
                </div>
              );
            })}
          </div>

          {/* Bottom Footer Info */}
          <div className="pt-4 border-t border-[#DCDAF0] text-center text-xs text-[#8E96A6]">
            <p>MySawari · Har Safar, Apna Safar</p>
            <p className="text-[11px] mt-0.5">Belagavi City Urban Mobility Platform</p>
          </div>
        </div>
      </div>

      {/* Sub-Modals for Coins, Refer, Rewards, Payment, Help */}
      {activeModal === 'coins' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[28px] max-w-md w-full p-6 space-y-4 border border-[#DCDAF0] shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#DCDAF0]">
              <span className="hud text-xs text-[#FFC21A] font-bold">COINS REWARDS HUB</span>
              <button onClick={() => setActiveModal(null)} className="p-1 text-[#8E96A6]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-center py-2 space-y-1">
              <span className="text-5xl block">🪙</span>
              <h3 className="text-2xl font-bold font-mono text-[#0A0A14]">{user?.coins || 120} MySawari Coins</h3>
              <p className="text-xs text-[#5B5B73]">Worth ₹{Math.floor((user?.coins || 120) / 2)} in fare discounts!</p>
            </div>

            <div className="p-3 bg-[#F1F0FA] rounded-2xl text-xs space-y-2">
              <div className="flex justify-between font-medium">
                <span>Rule: Every completed ride</span>
                <span className="text-emerald-700 font-bold">+10 Coins</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Rule: Friend referral signup</span>
                <span className="text-[#3A4DFF] font-bold">+50 Coins</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Redeem rate</span>
                <span>2 Coins = ₹1 Discount</span>
              </div>
            </div>

            <button
              onClick={handleRedeemCoins}
              className="w-full py-3.5 rounded-full bg-[#FFC21A] hover:bg-[#e6ad12] text-[#0A0A14] font-bold text-xs uppercase tracking-wider shadow-md transition-colors"
            >
              {redeemedCode ? 'VOUCHER APPLIED TO NEXT TRIP (₹50 OFF)' : 'REDEEM 100 COINS FOR ₹50 VOUCHER'}
            </button>
          </div>
        </div>
      )}

      {/* Refer & Earn Modal */}
      {activeModal === 'refer' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[28px] max-w-md w-full p-6 space-y-4 border border-[#DCDAF0] shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#DCDAF0]">
              <span className="hud text-xs text-[#3A4DFF] font-bold">REFER & EARN</span>
              <button onClick={() => setActiveModal(null)} className="p-1 text-[#8E96A6]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-center py-2 space-y-1">
              <span className="text-5xl block">🎁</span>
              <h3 className="text-2xl font-bold text-[#0A0A14]">Invite Friends, Earn Coins</h3>
              <p className="text-xs text-[#5B5B73]">
                Your friends get ₹50 off their first Belagavi ride. You get 50 MySawari Coins!
              </p>
            </div>

            <div className="p-4 bg-[#F1F0FA] rounded-2xl flex items-center justify-between border border-[#DCDAF0]">
              <div>
                <span className="hud text-[10px] text-[#8E96A6] block">YOUR REFERRAL CODE</span>
                <span className="font-mono text-xl font-bold text-[#3A4DFF]">MYSARI50</span>
              </div>
              <button
                onClick={handleCopyReferral}
                className="px-4 py-2 bg-[#0A0A14] text-white text-xs font-bold rounded-xl"
              >
                {copiedReferral ? 'COPIED!' : 'COPY CODE'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Methods Modal */}
      {activeModal === 'payment' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[28px] max-w-md w-full p-6 space-y-4 border border-[#DCDAF0] shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#DCDAF0]">
              <span className="hud text-xs text-[#3A4DFF] font-bold">PAYMENT PREFERENCES</span>
              <button onClick={() => setActiveModal(null)} className="p-1 text-[#8E96A6]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              <div className="p-3 bg-[#F1F0FA] rounded-2xl flex items-center justify-between border border-emerald-500">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="font-bold text-xs text-[#0A0A14]">UPI / Google Pay / PhonePe</p>
                    <p className="text-[10px] text-[#5B5B73]">Instant scan on captain arrival</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-600">Active</span>
              </div>
              <div className="p-3 bg-white rounded-2xl flex items-center justify-between border border-[#DCDAF0]">
                <div className="flex items-center gap-3">
                  <span className="text-lg">💵</span>
                  <div>
                    <p className="font-bold text-xs text-[#0A0A14]">Cash on Delivery</p>
                    <p className="text-[10px] text-[#5B5B73]">Pay directly to your captain</p>
                  </div>
                </div>
                <span className="text-xs text-[#8E96A6]">Enabled</span>
              </div>
            </div>
            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-3 bg-[#0A0A14] text-white text-xs font-bold rounded-full"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {activeModal === 'help' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[28px] max-w-md w-full p-6 space-y-4 border border-[#DCDAF0] shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#DCDAF0]">
              <span className="hud text-xs text-[#3A4DFF] font-bold">24/7 SUPPORT & SAFETY</span>
              <button onClick={() => setActiveModal(null)} className="p-1 text-[#8E96A6]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2 text-xs text-[#5B5B73]">
              <div className="p-3 bg-red-50 rounded-2xl border border-red-200">
                <span className="font-bold text-red-600 block">Belagavi Emergency Police Helpline</span>
                <span className="font-mono font-bold text-sm text-[#0A0A14]">Dial 112 / +91 831 2405200</span>
              </div>
              <div className="p-3 bg-[#F1F0FA] rounded-2xl border border-[#DCDAF0]">
                <span className="font-bold text-[#0A0A14] block">Lost Item in Ride</span>
                <span>Contact support with your Trip ID from the Ride History page.</span>
              </div>
              <div className="p-3 bg-[#F1F0FA] rounded-2xl border border-[#DCDAF0]">
                <span className="font-bold text-[#0A0A14] block">Email Support</span>
                <span>help@mysawari.app</span>
              </div>
            </div>
            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-3 bg-[#0A0A14] text-white text-xs font-bold rounded-full"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Rewards Modal */}
      {activeModal === 'rewards' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[28px] max-w-md w-full p-6 space-y-4 border border-[#DCDAF0] shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#DCDAF0]">
              <span className="hud text-xs text-emerald-600 font-bold">MY REWARDS</span>
              <button onClick={() => setActiveModal(null)} className="p-1 text-[#8E96A6]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="p-4 bg-gradient-to-r from-emerald-50 to-white rounded-2xl border border-emerald-300">
                <span className="hud text-[10px] text-emerald-700 font-bold">ACTIVE VOUCHER</span>
                <h4 className="font-bold text-sm text-[#0A0A14]">Student Commute Pass · 20% Off</h4>
                <p className="text-[11px] text-[#5B5B73]">Valid for rides starting or ending at KLE Tech Campus.</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-amber-50 to-white rounded-2xl border border-amber-300">
                <span className="hud text-[10px] text-amber-700 font-bold">MILESTONE REWARD</span>
                <h4 className="font-bold text-sm text-[#0A0A14]">Completed 10th Ride Badge</h4>
                <p className="text-[11px] text-[#5B5B73]">+100 MySawari Bonus Coins Credited!</p>
              </div>
            </div>
            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-3 bg-[#0A0A14] text-white text-xs font-bold rounded-full"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
}
