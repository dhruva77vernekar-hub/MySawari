import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Compass, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import ProfileDrawer from '../profile/ProfileDrawer';
import LiquidNavbar from '../ui/liquid-glass-navbar';

export default function FloatingNav({ onOpenMenu, activeTab, onTabChange }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const userInitial = user?.fullName
    ? user.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)
    : 'U';

  const isLanding = location.pathname === '/';

  return (
    <>
      <header className="fixed top-3 left-0 right-0 z-40 px-3 sm:px-6 max-w-7xl mx-auto flex items-center justify-between pointer-events-none">
        {/* Brand logo & City Location */}
        <Link
          to="/"
          className="pointer-events-auto group flex items-center gap-3 bg-white/90 hover:bg-white backdrop-blur-xl px-3.5 py-2 rounded-2xl border border-[#DCDAF0] hover:border-[#3A4DFF] shadow-[0_4px_20px_-4px_rgba(58,77,255,0.15)] transition-all flex-shrink-0"
        >
          <img 
            src="/logo.png" 
            alt="MySawari Logo" 
            className="w-8 h-8 rounded-xl object-contain shadow-xs group-hover:scale-105 transition-transform" 
          />
          <div className="flex flex-col text-left leading-none">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-[13px] tracking-tight text-[#0A0A14] group-hover:text-[#3A4DFF] transition-colors">
                MySawari
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <span className="hud text-[8.5px] font-bold text-[#3A4DFF] tracking-wider uppercase mt-1">
              BELAGAVI CITY
            </span>
          </div>
        </Link>

        {/* CENTER: Liquid Water Navbar capsule — visible on Landing */}
        {isLanding && onTabChange && (
          <div className="pointer-events-auto hidden md:flex items-center justify-center mx-auto">
            <LiquidNavbar
              activeTab={activeTab || 'normal'}
              onChange={onTabChange}
              tone="light"
              sound={false}
            />
          </div>
        )}

        {/* Right Corner: Profile + Menu */}
        <div className="pointer-events-auto flex items-center gap-2 flex-shrink-0">
          {/* PROFILE BUTTON */}
          {user ? (
            <button
              onClick={() => setIsProfileOpen(true)}
              className="group flex items-center gap-2 bg-white/90 backdrop-blur-xl hover:bg-white px-3 py-1.5 rounded-2xl border border-[#DCDAF0] hover:border-[#3A4DFF] transition-all shadow-sm cursor-pointer"
              title="Open Profile Menu"
            >
              <div className="w-7 h-7 rounded-xl bg-[#0A0A14] text-white flex items-center justify-center text-xs font-bold shadow-xs">
                {userInitial}
              </div>
              <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#FFC21A]/15 border border-[#FFC21A]/30">
                <span className="text-xs">🪙</span>
                <span className="text-xs font-bold font-mono text-[#0A0A14]">{user.coins || 120}</span>
              </div>
            </button>
          ) : (
            <Link
              to="/login"
              className="px-3.5 py-2 bg-white/90 backdrop-blur-xl hover:bg-white text-[#0A0A14] rounded-2xl text-xs font-bold uppercase tracking-wider border border-[#DCDAF0] hover:border-[#3A4DFF] transition-all flex items-center gap-1.5 shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5 text-[#3A4DFF]" />
              <span className="hidden sm:inline">Log in</span>
            </Link>
          )}

          {/* Explore Button with Compass Icon */}
          <button
            onClick={onOpenMenu}
            aria-label="Explore MySawari"
            title="Explore Belagavi Mobility Services"
            className="px-3.5 py-2 bg-white/90 backdrop-blur-xl hover:bg-white text-[#0A0A14] rounded-2xl text-xs font-semibold uppercase tracking-wider border border-[#DCDAF0] hover:border-[#3A4DFF] hover:shadow-[0_4px_20px_-4px_rgba(58,77,255,0.2)] transition-all flex items-center gap-2 shadow-sm cursor-pointer group"
          >
            <Compass className="w-4 h-4 text-[#3A4DFF] group-hover:rotate-45 transition-transform duration-300" />
            <span className="font-bold text-[11px] tracking-wide">EXPLORE</span>
          </button>
        </div>
      </header>

      {/* Mobile Liquid Navbar below header on smaller screens */}
      {isLanding && onTabChange && (
        <div className="fixed top-16 left-0 right-0 z-35 flex md:hidden justify-center px-2 pointer-events-none">
          <div className="pointer-events-auto">
            <LiquidNavbar
              activeTab={activeTab || 'normal'}
              onChange={onTabChange}
              tone="light"
              compact={false}
              sound={false}
            />
          </div>
        </div>
      )}

      {/* Profile Drawer */}
      <ProfileDrawer
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </>
  );
}
