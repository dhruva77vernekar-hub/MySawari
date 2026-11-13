import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowUpRight, Menu, User, Coins, LogIn, Globe } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import ProfileDrawer from '../profile/ProfileDrawer';

export default function FloatingNav({ onOpenMenu }) {
  const { user } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const location = useLocation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const userInitial = user?.fullName
    ? user.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)
    : 'U';

  const toggleLanguage = () => {
    if (lang === 'en') setLang('kn');
    else if (lang === 'kn') setLang('hi');
    else setLang('en');
  };

  return (
    <>
      <header className="fixed top-6 left-0 right-0 z-40 px-4 sm:px-6 max-w-7xl mx-auto flex items-center justify-between pointer-events-none">
        {/* Brand logo */}
        <Link
          to="/"
          className="pointer-events-auto group flex items-center gap-3 bg-white/80 backdrop-blur-md px-5 py-3 rounded-full border border-[#DCDAF0] shadow-sm hover:border-[#3A4DFF] transition-all"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-[#3A4DFF] animate-pulse" />
          <span className="font-semibold text-sm tracking-tight text-[#0A0A14] group-hover:text-[#3A4DFF] transition-colors">
            {t('appName').toUpperCase()}
          </span>
          <span className="hud text-[10px] bg-[#E9ECF2] text-[#5B5B73] px-2 py-0.5 rounded-full">
            BELAGAVI
          </span>
        </Link>

        {/* Right Corner: Language Switcher + Profile Corner + Book Now + Menu */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Quick Language Toggle */}
          <button
            onClick={toggleLanguage}
            title="Switch Language (English / ಕನ್ನಡ / हिंदी)"
            className="px-3 py-2 bg-white/85 backdrop-blur-md hover:bg-white text-[#0A0A14] rounded-full text-xs font-bold border border-[#DCDAF0] hover:border-[#3A4DFF] transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Globe className="w-3.5 h-3.5 text-[#3A4DFF]" />
            <span className="uppercase text-[11px]">{lang}</span>
          </button>

          {/* PROFILE CORNER BUTTON */}
          {user ? (
            <button
              onClick={() => setIsProfileOpen(true)}
              className="group flex items-center gap-2 bg-white/85 backdrop-blur-md hover:bg-white px-3 py-1.5 rounded-full border border-[#DCDAF0] hover:border-[#3A4DFF] transition-all shadow-sm cursor-pointer"
              title="Open Profile Menu"
            >
              <div className="w-8 h-8 rounded-full bg-[#0A0A14] text-white flex items-center justify-center text-xs font-bold shadow-xs">
                {userInitial}
              </div>
              <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#FFC21A]/15 border border-[#FFC21A]/30">
                <span className="text-xs">🪙</span>
                <span className="text-xs font-bold font-mono text-[#0A0A14]">{user.coins || 120}</span>
              </div>
            </button>
          ) : (
            <Link
              to="/login"
              className="px-4 py-2.5 bg-white/85 backdrop-blur-md hover:bg-white text-[#0A0A14] rounded-full text-xs font-bold uppercase tracking-wider border border-[#DCDAF0] hover:border-[#3A4DFF] transition-all flex items-center gap-1.5 shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5 text-[#3A4DFF]" />
              <span>Log in</span>
            </Link>
          )}

          {/* Book Now Button */}
          {location.pathname !== '/book' && (
            <Link
              to="/book"
              className="hidden sm:flex group px-5 py-3 bg-[#0A0A14] hover:bg-[#3A4DFF] text-white rounded-full text-xs font-semibold tracking-wider uppercase transition-all duration-300 shadow-sm items-center gap-2 hover:shadow-[0_10px_30px_-10px_rgba(58,77,255,0.5)]"
            >
              <span>{t('bookNow').toUpperCase()}</span>
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center transition-transform group-hover:rotate-45">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          )}

          {/* Menu Button */}
          <button
            onClick={onOpenMenu}
            aria-label="Open menu"
            className="px-4 py-3 bg-white/80 backdrop-blur-md hover:bg-white text-[#0A0A14] rounded-full text-xs font-semibold uppercase tracking-wider border border-[#DCDAF0] hover:border-[#3A4DFF] transition-all flex items-center gap-2 shadow-sm"
          >
            <Menu className="w-4 h-4 text-[#3A4DFF]" />
            <span>{t('menu').toUpperCase()}</span>
          </button>
        </div>
      </header>

      {/* Profile Drawer */}
      <ProfileDrawer
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </>
  );
}
