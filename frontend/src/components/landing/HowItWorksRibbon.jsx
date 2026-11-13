import React from 'react';
import { ShieldCheck, Share2, AlertCircle, Phone } from 'lucide-react';
import Card from '../ui/Card';

export default function HowItWorksRibbon() {
  const steps = [
    {
      num: '01',
      title: 'Morph & Choose',
      desc: 'Watch the physical 3D vehicle adapt in real-time. Pick Cab for comfort, Bike Taxi for speed, or Scooter for savings.'
    },
    {
      num: '02',
      title: 'Instant Belagavi Captain',
      desc: 'Nearby verified drivers accept in seconds. Track their approach with live GPS and vehicle plate confirmation.'
    },
    {
      num: '03',
      title: 'Ride & SOS Guarded',
      desc: 'Share live trip tracking link with family in one tap. Dedicated emergency SOS button logs and broadcasts immediately.'
    }
  ];

  return (
    <section className="py-20 px-6 max-w-7xl mx-auto border-t border-[#DCDAF0]">
      <div className="mb-16">
        <span className="hud text-xs text-[#3A4DFF] tracking-widest block mb-2 font-semibold">
          02 / SEAMLESS FLOW
        </span>
        <h2 className="text-3xl sm:text-5xl font-semibold tracking-[-0.03em] text-[#0A0A14]">
          How MySawari works.
        </h2>
      </div>

      {/* 3 Numbered Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative mb-20">
        {/* Ribbon line connecting steps on desktop */}
        <div className="hidden md:block absolute top-12 left-12 right-12 h-[2px] bg-gradient-to-r from-[#3A4DFF] via-[#45E0F2] to-[#3A4DFF]/30 -z-0" />

        {steps.map((s, idx) => (
          <div key={s.num} className="relative z-10 bg-[#F1F0FA] md:bg-transparent pt-4">
            <span className="text-6xl md:text-8xl font-black tracking-tighter text-[#3A4DFF]/20 block mb-2 font-mono">
              {s.num}
            </span>
            <h3 className="text-2xl font-bold text-[#0A0A14] mb-2">{s.title}</h3>
            <p className="text-sm text-[#5B5B73] leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>

      {/* Big Feature Card: SAFE BY DESIGN (Igloo / Lusion inspiration) */}
      <div className="rounded-[28px] bg-[#EF2B3E] text-white p-8 md:p-14 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-8 shadow-2xl">
        <div className="max-w-xl space-y-3 z-10">
          <div className="flex items-center gap-2">
            <span className="hud px-3 py-1 rounded-full bg-white/20 text-white font-bold text-[10px]">
              WOMEN & CAMPUS SAFETY FIRST
            </span>
          </div>
          <h3 className="text-3xl sm:text-5xl font-bold tracking-tight">
            Safe by design. Every single ride.
          </h3>
          <p className="text-white/80 text-sm sm:text-base">
            Trip sharing with one click, instant simulated SOS dispatch, and verified local captain profiles with plate numbers.
          </p>
        </div>

        <div className="z-10 flex flex-wrap items-center gap-4">
          <div className="px-5 py-3 rounded-full bg-white text-[#EF2B3E] font-semibold text-xs flex items-center gap-2 shadow-lg">
            <Share2 className="w-4 h-4" /> Live Web Share Link
          </div>
          <div className="px-5 py-3 rounded-full bg-black/40 border border-white/20 text-white font-semibold text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#FFC21A]" /> 1-Tap SOS Beacon
          </div>
        </div>

        {/* Decorative circle */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      </div>
    </section>
  );
}
