import React from 'react';
import { Link } from 'react-router-dom';
import { X, ArrowRight, Shield, MapPin, Radio, Key, Award, PhoneCall } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function MenuOverlay({ isOpen, onClose }) {
  const { role, switchRole } = useAuth();

  if (!isOpen) return null;

  const links = [
    { to: '/', label: 'HOME / 3D MORPH', desc: 'Interactive vehicle selector' },
    { to: '/book', label: 'BOOK A RIDE', desc: 'AI booking & side-by-side fare comparison' },
    { to: '/ride/demo', label: 'LIVE RIDE TRACKER', desc: 'Realtime map, captain details & SOS' },
    { to: '/history', label: 'RIDE HISTORY', desc: 'Past receipts & Belagavi commutes' },
    { to: '/captain', label: 'CAPTAIN DASHBOARD', desc: 'Accept requests & earn per trip' },
    { to: '/admin', label: 'ADMIN CONSOLE', desc: 'Fleet stats, simulator & revenue' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0A14]/95 backdrop-blur-xl text-white flex flex-col justify-between p-8 md:p-16 transition-opacity animate-fade-in">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-white/10 pb-6">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-[#45E0F2] animate-ping" />
          <span className="hud text-xs text-[#C9CFDA] tracking-widest">
            MYSAWARI · HACKATHON EDITION
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main navigation list */}
      <div className="my-auto py-8 space-y-4 max-w-4xl">
        <span className="hud text-xs text-[#8E96A6] tracking-widest block mb-4">
          EXPLORE PLATFORM
        </span>
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            onClick={onClose}
            className="group flex flex-col md:flex-row md:items-center justify-between py-3 border-b border-white/5 hover:border-[#3A4DFF] transition-all"
          >
            <div>
              <h2 className="text-3xl md:text-5xl font-semibold tracking-[-0.03em] group-hover:text-[#45E0F2] group-hover:translate-x-2 transition-all">
                {link.label}
              </h2>
              <p className="text-sm text-[#8E96A6] mt-1">{link.desc}</p>
            </div>
            <span className="mt-2 md:mt-0 w-10 h-10 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-[#3A4DFF] group-hover:border-[#3A4DFF] transition-all">
              <ArrowRight className="w-4 h-4 text-white" />
            </span>
          </Link>
        ))}
      </div>

      {/* Bottom info */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pt-6 border-t border-white/10 text-xs text-[#8E96A6] gap-4">
        <div>
          <span className="text-white font-medium">Polar Geeks Team</span> · Belagavi, Karnataka
        </div>
        <div className="flex gap-4">
          <span>OSRM + OpenStreetMap</span>
          <span>Supabase Realtime</span>
          <span>Three.js Engine</span>
        </div>
      </div>
    </div>
  );
}
