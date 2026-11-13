import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowUpRight, Menu, Zap, Shield, Compass, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function FloatingNav({ onOpenMenu }) {
  const { role, switchRole } = useAuth();
  const location = useLocation();

  return (
    <header className="fixed top-6 left-0 right-0 z-40 px-6 max-w-7xl mx-auto flex items-center justify-between pointer-events-none">
      {/* Brand logo */}
      <Link
        to="/"
        className="pointer-events-auto group flex items-center gap-3 bg-white/80 backdrop-blur-md px-5 py-3 rounded-full border border-[#DCDAF0] shadow-sm hover:border-[#3A4DFF] transition-all"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-[#3A4DFF] animate-pulse" />
        <span className="font-semibold text-sm tracking-tight text-[#0A0A14] group-hover:text-[#3A4DFF] transition-colors">
          MYSAWARI
        </span>
        <span className="hud text-[10px] bg-[#E9ECF2] text-[#5B5B73] px-2 py-0.5 rounded-full">
          BELAGAVI
        </span>
      </Link>

      {/* Center Role Toggle for easy hackathon demo */}
      <div className="pointer-events-auto hidden md:flex items-center gap-1 bg-white/70 backdrop-blur-md p-1.5 rounded-full border border-[#DCDAF0] text-xs">
        <span className="hud px-2 text-[#8E96A6]">VIEW AS:</span>
        <button
          onClick={() => switchRole('rider')}
          className={`px-3 py-1.5 rounded-full font-medium transition-all ${
            role === 'rider' ? 'bg-[#0A0A14] text-white shadow-sm' : 'text-[#5B5B73] hover:text-[#0A0A14]'
          }`}
        >
          Rider
        </button>
        <button
          onClick={() => switchRole('captain')}
          className={`px-3 py-1.5 rounded-full font-medium transition-all ${
            role === 'captain' ? 'bg-[#3A4DFF] text-white shadow-sm' : 'text-[#5B5B73] hover:text-[#0A0A14]'
          }`}
        >
          Captain
        </button>
        <button
          onClick={() => switchRole('admin')}
          className={`px-3 py-1.5 rounded-full font-medium transition-all ${
            role === 'admin' ? 'bg-[#0B0D14] text-[#45E0F2] shadow-sm' : 'text-[#5B5B73] hover:text-[#0A0A14]'
          }`}
        >
          Admin
        </button>
      </div>

      {/* Floating Action Pills */}
      <div className="pointer-events-auto flex items-center gap-2">
        {location.pathname !== '/book' && (
          <Link
            to="/book"
            className="group px-6 py-3 bg-[#0A0A14] hover:bg-[#3A4DFF] text-white rounded-full text-xs font-semibold tracking-wider uppercase transition-all duration-300 shadow-sm flex items-center gap-2 hover:shadow-[0_10px_30px_-10px_rgba(58,77,255,0.5)]"
          >
            <span>BOOK NOW</span>
            <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center transition-transform group-hover:rotate-45">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        )}

        <button
          onClick={onOpenMenu}
          aria-label="Open menu"
          className="px-5 py-3 bg-white/80 backdrop-blur-md hover:bg-white text-[#0A0A14] rounded-full text-xs font-semibold uppercase tracking-wider border border-[#DCDAF0] hover:border-[#3A4DFF] transition-all flex items-center gap-2 shadow-sm"
        >
          <Menu className="w-4 h-4 text-[#3A4DFF]" />
          <span>MENU</span>
        </button>
      </div>
    </header>
  );
}
