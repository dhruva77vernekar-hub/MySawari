import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck, 
  Send, 
  Layers, 
  Clock, 
  ArrowRight,
  Info
} from 'lucide-react';
import Card from '../ui/Card';
import BelagaviZoneMap from './BelagaviZoneMap';
import { api } from '../../services/api';

const SCENARIO_STEPS = [
  {
    step: 1,
    title: 'Baseline Equilibrium',
    timeLabel: '16:00 PM IST',
    tag: 'STABLE',
    tagColor: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
    description: 'All 5 Belagavi transit zones operate in demand-supply equilibrium. Zero surge applied across the city.',
    marketDemand: 18,
    marketSupply: 22,
    marketRatio: 0.82,
    marketSurge: 1.0,
    marketStatus: 'BALANCED',
    tilakwadiSupply: 28,
    repositionAdvisoriesActive: false,
    logMessage: 'Telemetry heartbeat: Market Area balanced. Wait ETA normal at 3.5 mins.'
  },
  {
    step: 2,
    title: 'Market Demand Surge Emerges',
    timeLabel: '17:30 PM IST',
    tag: 'DEMAND SURGE',
    tagColor: 'text-amber-400 bg-amber-500/20 border-amber-500/30',
    description: 'Evening retail & wholesale rush begins in Khade Bazar. Incoming booking requests spike rapidly from 18 to 48.',
    marketDemand: 48,
    marketSupply: 18,
    marketRatio: 2.67,
    marketSurge: 1.4,
    marketStatus: 'HIGH_DEMAND',
    tilakwadiSupply: 26,
    repositionAdvisoriesActive: false,
    logMessage: 'Demand surge detected in Market Area (ratio 2.67). Algorithmic surge calibrated to 1.4x.'
  },
  {
    step: 3,
    title: 'Critical Captain Shortage Detected',
    timeLabel: '18:15 PM IST',
    tag: 'DEFICIT ALERT',
    tagColor: 'text-red-400 bg-red-500/20 border-red-500/30',
    description: 'Riders book rapidly; active supply drops to 8 available captains. Wait times spike from 4m to 11m. Critical deficit triggered.',
    marketDemand: 54,
    marketSupply: 8,
    marketRatio: 6.75,
    marketSurge: 1.8,
    marketStatus: 'HIGH_DEMAND',
    tilakwadiSupply: 24,
    repositionAdvisoriesActive: true,
    logMessage: 'CRITICAL SHORTAGE: Market Area ratio 6.75:1. Safety surge capped at 1.8x. Proactive repositioning engine engaged.'
  },
  {
    step: 4,
    title: 'Voluntary Repositioning Broadcast',
    timeLabel: '18:25 PM IST',
    tag: 'DISPATCH ADVISORY',
    tagColor: 'text-[#45E0F2] bg-[#3A4DFF]/20 border-[#3A4DFF]/40',
    description: 'System identifies 9 idle captains in nearby Tilakwadi. Voluntary incentive (+â‚¹35/trip) broadcasted. 6 captains opt in and head to Khade Bazar.',
    marketDemand: 52,
    marketSupply: 12,
    marketRatio: 4.33,
    marketSurge: 1.6,
    marketStatus: 'HIGH_DEMAND',
    tilakwadiSupply: 18,
    repositionAdvisoriesActive: true,
    logMessage: 'Voluntary incentive broadcasted to Tilakwadi. 6 captains accepted transit via Congress Rd (~6 mins ETA).'
  },
  {
    step: 5,
    title: 'Supply Rebalanced & Surge Cooled',
    timeLabel: '18:45 PM IST',
    tag: 'REBALANCED',
    tagColor: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
    description: 'Repositioned captains arrive in Khade Bazar. Available supply climbs to 20, ratio drops to 1.4x, surge cools, and wait times drop to 4.2 mins.',
    marketDemand: 46,
    marketSupply: 20,
    marketRatio: 2.30,
    marketSurge: 1.2,
    marketStatus: 'BALANCED',
    tilakwadiSupply: 18,
    repositionAdvisoriesActive: false,
    logMessage: 'Rebalance complete: 6 captains entered Khade Bazar geofence. Surge cooled from 1.8x to 1.2x. Wait times normalized.'
  }
];

export default function DemandZoneDemo() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverStepData, setServerStepData] = useState(null);
  const [eventLogs, setEventLogs] = useState([
    { time: '16:00:00', text: 'Scenario sandbox initialized. Belagavi dispatch engine online.' }
  ]);
  const timerRef = useRef(null);

  const activeStepConfig = SCENARIO_STEPS[currentStep - 1];

  const fetchStepData = async (stepNum) => {
    setLoading(true);
    try {
      const res = await api.stepDemoScenario(stepNum);
      if (res) {
        setServerStepData(res);
      }
    } catch (e) {
      console.warn('Using local scenario config:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStepData(currentStep);

    // Append log
    const stepObj = SCENARIO_STEPS[currentStep - 1];
    setEventLogs((prev) => [
      { time: stepObj.timeLabel, text: stepObj.logMessage },
      ...prev.slice(0, 7)
    ]);
  }, [currentStep]);

  // Auto-play timer
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= 5) {
            setIsPlaying(false);
            return 5;
          }
          return prev + 1;
        });
      }, 4000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying]);

  const handleNext = () => {
    if (currentStep < 5) setCurrentStep((prev) => prev + 1);
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStep(1);
    setEventLogs([
      { time: '16:00:00', text: 'Scenario reset to Step 1: Baseline Equilibrium.' }
    ]);
  };

  // Mock zones representing this scenario step
  const demoZones = [
    {
      id: 'z-market',
      name: 'Market Area & Khade Bazar',
      center: { latitude: 15.8560, longitude: 74.5120 },
      polygon_geojson: {
        type: 'Polygon',
        coordinates: [[[74.5050, 15.8600], [74.5180, 15.8620], [74.5200, 15.8500], [74.5070, 15.8490], [74.5050, 15.8600]]]
      },
      demand_count: activeStepConfig.marketDemand,
      available_captains: activeStepConfig.marketSupply,
      busy_captains: 6,
      demand_supply_ratio: activeStepConfig.marketRatio,
      zone_status: activeStepConfig.marketStatus,
      surge_multiplier: activeStepConfig.marketSurge
    },
    {
      id: 'z-tilakwadi',
      name: 'Tilakwadi Residential',
      center: { latitude: 15.8390, longitude: 74.5180 },
      polygon_geojson: {
        type: 'Polygon',
        coordinates: [[[74.5100, 15.8450], [74.5260, 15.8440], [74.5250, 15.8330], [74.5090, 15.8340], [74.5100, 15.8450]]]
      },
      demand_count: 16,
      available_captains: activeStepConfig.tilakwadiSupply,
      busy_captains: 4,
      demand_supply_ratio: 0.65,
      zone_status: 'LOW_DEMAND',
      surge_multiplier: 1.0
    },
    {
      id: 'z-station',
      name: 'Belagavi Railway Station',
      center: { latitude: 15.8620, longitude: 74.5050 },
      polygon_geojson: {
        type: 'Polygon',
        coordinates: [[[74.4980, 15.8680], [74.5120, 15.8690], [74.5110, 15.8570], [74.4970, 15.8560], [74.4980, 15.8680]]]
      },
      demand_count: 24,
      available_captains: 20,
      busy_captains: 5,
      demand_supply_ratio: 1.2,
      zone_status: 'BALANCED',
      surge_multiplier: 1.1
    },
    {
      id: 'z-kle',
      name: 'KLE Tech Campus',
      center: { latitude: 15.8281, longitude: 74.4925 },
      polygon_geojson: {
        type: 'Polygon',
        coordinates: [[[74.4850, 15.8340], [74.5000, 15.8350], [74.5010, 15.8220], [74.4860, 15.8210], [74.4850, 15.8340]]]
      },
      demand_count: 28,
      available_captains: 22,
      busy_captains: 6,
      demand_supply_ratio: 1.27,
      zone_status: 'BALANCED',
      surge_multiplier: 1.2
    },
    {
      id: 'z-udyambag',
      name: 'Udyambag Industrial Hub',
      center: { latitude: 15.8150, longitude: 74.4820 },
      polygon_geojson: {
        type: 'Polygon',
        coordinates: [[[74.4740, 15.8210], [74.4900, 15.8200], [74.4890, 15.8090], [74.4730, 15.8100], [74.4740, 15.8210]]]
      },
      demand_count: 18,
      available_captains: 20,
      busy_captains: 4,
      demand_supply_ratio: 0.9,
      zone_status: 'LOW_DEMAND',
      surge_multiplier: 1.0
    }
  ];

  const demoRecommendations = activeStepConfig.repositionAdvisoriesActive
    ? [
        {
          fromZone: {
            name: 'Tilakwadi Residential',
            center: { latitude: 15.8390, longitude: 74.5180 }
          },
          toZone: {
            name: 'Market Area & Khade Bazar',
            center: { latitude: 15.8560, longitude: 74.5120 }
          },
          suggestedCaptains: 6,
          distanceMeters: 2000,
          estimatedTravelMinutes: 6,
          formattedEta: '~6 mins',
          action: 'active'
        }
      ]
    : [];

  return (
    <div className="space-y-8">
      {/* SECTION HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="hud text-xs text-[#45E0F2] font-bold">END-TO-END DEMO</span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#3A4DFF]/20 border border-[#3A4DFF]/40 text-[#45E0F2] font-mono text-[10px] font-bold">
              [ISOLATED SANDBOX - NO PRODUCTION DATA MODIFIED]
            </span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white mt-1 flex items-center gap-2">
            Demand & Zone Intelligence Interactive Demo
            <Sparkles className="w-6 h-6 text-[#45E0F2]" />
          </h2>
          <p className="text-xs text-[#8E96A6] mt-0.5">
            Step through a live 5-phase Belagavi mobility lifecycle: Baseline â†’ Peak Rush â†’ Shortage Detection â†’ Voluntary Repositioning â†’ Rebalance.
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-600 text-black shadow-amber-500/25'
                : 'bg-[#3A4DFF] hover:bg-[#2c3ee0] text-white shadow-[#3A4DFF]/25'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isPlaying ? 'Pause Demo' : 'Auto-Play Scenario'}</span>
          </button>

          <button
            onClick={handleReset}
            className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white transition-all cursor-pointer"
            title="Reset to Step 1"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 5-STEP INTERACTIVE PROGRESS STEPPER */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {SCENARIO_STEPS.map((s) => {
          const isCurrent = currentStep === s.step;
          const isCompleted = currentStep > s.step;

          return (
            <button
              key={s.step}
              onClick={() => {
                setIsPlaying(false);
                setCurrentStep(s.step);
              }}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                isCurrent
                  ? 'bg-[#3A4DFF]/20 border-[#3A4DFF] shadow-lg shadow-[#3A4DFF]/20'
                  : isCompleted
                  ? 'bg-white/[0.04] border-white/20 hover:border-white/40'
                  : 'bg-white/[0.02] border-white/5 opacity-60 hover:opacity-100'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                <span className={isCurrent ? 'text-[#45E0F2] font-bold' : 'text-[#8E96A6]'}>
                  STAGE 0{s.step}
                </span>
                <span className="text-[#8E96A6]">{s.timeLabel.split(' ')[0]}</span>
              </div>
              <h4 className="text-xs font-bold text-white leading-tight truncate">{s.title}</h4>
              <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded mt-2 font-mono font-bold border ${s.tagColor}`}>
                {s.tag}
              </span>
            </button>
          );
        })}
      </div>

      {/* ACTIVE STAGE SHOWCASE CARD */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#0C1021] to-[#080B15] border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-[#3A4DFF] text-white font-mono font-bold flex items-center justify-center text-sm shadow-md">
              {currentStep}
            </span>
            <div>
              <span className="hud text-xs text-[#45E0F2] font-bold">STAGE {currentStep} OF 5</span>
              <h3 className="text-2xl font-bold text-white tracking-tight">{activeStepConfig.title}</h3>
            </div>
          </div>

          {/* Stepper Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={currentStep === 1}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <button
              onClick={handleNext}
              disabled={currentStep === 5}
              className="px-3 py-1.5 bg-[#3A4DFF] hover:bg-[#2c3ee0] text-white rounded-xl text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer shadow-md"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed max-w-4xl">
          {activeStepConfig.description}
        </p>

        {/* Live Stage Telemetry Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-white/10 text-xs">
          <div className="p-3 bg-black/40 rounded-xl border border-white/5">
            <span className="text-[#8E96A6] block text-[10px] font-mono">MARKET DEMAND</span>
            <span className="text-2xl font-bold font-mono text-white">{activeStepConfig.marketDemand}</span>
            <span className="text-[10px] text-[#8E96A6] block">booking requests</span>
          </div>
          <div className="p-3 bg-black/40 rounded-xl border border-white/5">
            <span className="text-[#8E96A6] block text-[10px] font-mono">MARKET SUPPLY</span>
            <span className={`text-2xl font-bold font-mono ${activeStepConfig.marketSupply < 10 ? 'text-red-400' : 'text-emerald-400'}`}>
              {activeStepConfig.marketSupply}
            </span>
            <span className="text-[10px] text-[#8E96A6] block">available captains</span>
          </div>
          <div className="p-3 bg-black/40 rounded-xl border border-white/5">
            <span className="text-[#8E96A6] block text-[10px] font-mono">DEMAND/SUPPLY RATIO</span>
            <span className={`text-2xl font-bold font-mono ${activeStepConfig.marketRatio > 2.0 ? 'text-red-400' : 'text-white'}`}>
              {activeStepConfig.marketRatio}x
            </span>
            <span className="text-[10px] text-[#8E96A6] block">threshold &gt; 1.5</span>
          </div>
          <div className="p-3 bg-black/40 rounded-xl border border-white/5">
            <span className="text-[#8E96A6] block text-[10px] font-mono">ACTIVE SURGE</span>
            <span className="text-2xl font-bold font-mono text-[#45E0F2]">{activeStepConfig.marketSurge}x</span>
            <span className="text-[10px] text-[#8E96A6] block">capped at 1.8x max</span>
          </div>
        </div>
      </div>

      {/* MAP & EVENT LOG GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dynamic Scenario Map */}
        <div className="lg:col-span-2 space-y-2">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="text-[#8E96A6] font-mono">Live Stage GIS Vector View</span>
            {activeStepConfig.repositionAdvisoriesActive && (
              <span className="text-[#45E0F2] font-mono font-bold animate-pulse">
                â†’ 6 Captains In Transit: Tilakwadi â†’ Khade Bazar
              </span>
            )}
          </div>
          <BelagaviZoneMap
            zones={demoZones}
            selectedZoneId={'z-market'}
            showHeatmap={false}
            showRepositionArrows={activeStepConfig.repositionAdvisoriesActive}
            repositionRecommendations={demoRecommendations}
            height="420px"
          />
        </div>

        {/* Real-time Event Log */}
        <div className="p-6 rounded-3xl bg-[#090C16] border border-white/10 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="hud text-xs text-[#45E0F2] font-bold">SYSTEM AUDIT LEDGER</span>
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                LIVE
              </span>
            </div>
            <h4 className="text-base font-bold text-white mt-1">Autonomous Dispatch Log</h4>
            <p className="text-xs text-[#8E96A6]">
              Real-time audit trail of state transitions, surge calibrations, and driver broadcasts.
            </p>
          </div>

          {/* Event Stream */}
          <div className="space-y-2.5 overflow-y-auto max-h-64 font-mono text-xs">
            {eventLogs.map((log, i) => (
              <div key={i} className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                <span className="text-[10px] text-[#45E0F2] block font-bold">{log.time}</span>
                <p className="text-slate-300 text-[11px] leading-snug">{log.text}</p>
              </div>
            ))}
          </div>

          {/* Sandbox Security Notice */}
          <div className="p-3 bg-black/40 rounded-xl border border-white/5 text-[11px] text-[#8E96A6] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Simulation isolation verified. Customer ride tables protected.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
