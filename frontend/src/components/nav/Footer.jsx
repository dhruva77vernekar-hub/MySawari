import React from 'react';
import { ArrowUp } from 'lucide-react';

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative bg-[#0B0D14] text-white pt-20 pb-12 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-16">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pb-12 border-b border-white/10">
          <div>
            <span className="hud text-xs text-[#45E0F2] tracking-widest block mb-2">
              MYSAWARI URBAN MOBILITY
            </span>
            <p className="text-xl md:text-2xl text-[#C9CFDA] max-w-lg">
              One tap. Any ride. Transforming short commutes across Tier 2 & 3 cities with instant visual choice.
            </p>
          </div>

          <button
            onClick={scrollToTop}
            className="group px-6 py-4 rounded-full border border-white/20 hover:border-white hover:bg-white/10 transition-all flex items-center gap-3"
          >
            <span className="text-xs uppercase font-mono tracking-wider">BACK TO TOP</span>
            <ArrowUp className="w-4 h-4 text-[#45E0F2] group-hover:-translate-y-1 transition-transform" />
          </button>
        </div>

        {/* Giant wordmark like Lusion */}
        <div className="select-none text-center">
          <h1 className="text-[13vw] font-bold tracking-tighter leading-none text-white/10 hover:text-white/20 transition-colors">
            MYSAWARI
          </h1>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-[#8E96A6] pt-6 border-t border-white/5 gap-4">
          <p>© 2026 MySawari. Built for Belagavi Hackathon by Polar Geeks.</p>
          <div className="flex gap-6">
            <span>React + Vite</span>
            <span>Three.js Morph</span>
            <span>OSRM Maps</span>
            <span>Supabase</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
