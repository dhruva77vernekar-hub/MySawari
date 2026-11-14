import React, { useRef } from 'react';
import { 
  Car, 
  Sparkles, 
  User, 
  Users, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  Zap
} from 'lucide-react';

export const CAROUSEL_TABS = [
  {
    id: 'normal',
    title: 'Ride Dispatch',
    subtitle: '3D Visual Choice',
    tag: 'DEFAULT',
    icon: Car,
    color: '#3A4DFF',
    badgeColor: 'bg-[#3A4DFF]/10 text-[#3A4DFF]'
  },
  {
    id: 'ai',
    title: 'Sawari AI Assistant',
    subtitle: 'Talk & Auto-Book',
    tag: 'VOICE AI',
    icon: Sparkles,
    color: '#FFC21A',
    badgeColor: 'bg-[#FFC21A]/20 text-[#A67800]'
  },
  {
    id: 'profile',
    title: 'User Profile',
    subtitle: 'SOS & 120 Coins',
    tag: 'VERIFIED',
    icon: User,
    color: '#10B981',
    badgeColor: 'bg-emerald-100 text-emerald-800'
  },
  {
    id: 'pass',
    title: 'Ride Buddy & Pass',
    subtitle: 'Split Fare · 40% Off',
    tag: 'COMMUTE',
    icon: Users,
    color: '#8B5CF6',
    badgeColor: 'bg-purple-100 text-purple-800'
  }
];

export default function TopSlidingCarousel({ activeTab, onSelectTab }) {
  const scrollContainerRef = useRef(null);

  const handleScroll = (direction) => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 260;
    scrollContainerRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pt-28 pb-3 z-30">
      <div className="relative bg-white/90 backdrop-blur-md rounded-[28px] border border-[#DCDAF0] p-2 shadow-[0_15px_35px_-10px_rgba(58,77,255,0.12)]">
        {/* Left Arrow Button */}
        <button
          onClick={() => handleScroll('left')}
          aria-label="Previous slide"
          className="absolute left-1.5 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white border border-[#DCDAF0] shadow-sm flex items-center justify-center text-[#5B5B73] hover:text-[#0A0A14] hover:bg-[#F1F0FA] transition-all cursor-pointer hidden sm:flex"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Right Arrow Button */}
        <button
          onClick={() => handleScroll('right')}
          aria-label="Next slide"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white border border-[#DCDAF0] shadow-sm flex items-center justify-center text-[#5B5B73] hover:text-[#0A0A14] hover:bg-[#F1F0FA] transition-all cursor-pointer hidden sm:flex"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Horizontal Sliding Carousel Track */}
        <div
          ref={scrollContainerRef}
          className="flex items-center gap-2 overflow-x-auto scrollbar-none px-2 sm:px-8 py-1 scroll-smooth snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {CAROUSEL_TABS.map((tab, idx) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex-1 min-w-[190px] sm:min-w-[210px] snap-center px-4 py-3 rounded-[22px] transition-all duration-300 flex items-center gap-3 cursor-pointer select-none text-left border ${
                  isActive
                    ? 'bg-[#0A0A14] text-white border-[#0A0A14] shadow-md scale-[1.02]'
                    : 'bg-white/60 hover:bg-white text-[#0A0A14] border-transparent hover:border-[#DCDAF0]'
                }`}
              >
                {/* Icon Circle */}
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors ${
                    isActive
                      ? 'bg-white/15 text-white'
                      : 'bg-[#F1F0FA] text-[#3A4DFF]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                {/* Text & Badge */}
                <div className="overflow-hidden flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs truncate">
                      {tab.title}
                    </span>
                    <span
                      className={`hud text-[8px] font-bold px-1.5 py-0.5 rounded-full ${
                        isActive ? 'bg-white/20 text-white' : tab.badgeColor
                      }`}
                    >
                      {tab.tag}
                    </span>
                  </div>
                  <p
                    className={`text-[10px] truncate mt-0.5 ${
                      isActive ? 'text-white/80' : 'text-[#5B5B73]'
                    }`}
                  >
                    {tab.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Small Active Indicators Bar */}
        <div className="flex items-center justify-center gap-1.5 pt-2 pb-0.5">
          {CAROUSEL_TABS.map((tab) => (
            <span
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                activeTab === tab.id
                  ? 'w-6 bg-[#3A4DFF]'
                  : 'w-1.5 bg-[#DCDAF0] hover:bg-[#8E96A6]'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
