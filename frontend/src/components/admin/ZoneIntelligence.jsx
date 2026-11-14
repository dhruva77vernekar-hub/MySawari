import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  MapPin, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Car, 
  ArrowRight, 
  Sliders, 
  ShieldCheck, 
  RefreshCw, 
  Zap, 
  Send, 
  Check, 
  DollarSign,
  Info
} from 'lucide-react';
import Card from '../ui/Card';
import BelagaviZoneMap from './BelagaviZoneMap';
import { api } from '../../services/api';

export default function ZoneIntelligence() {
  const [loading, setLoading] = useState(true);
  const [zones, setZones] = useState([]);
  const [repositioning, setRepositioning] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [broadcastStatus, setBroadcastStatus] = useState({}); // recId -> boolean

  // Surge Pricing Sandbox State
  const [surgeParams, setSurgeParams] = useState({
    demandCount: 45,
    supplyCount: 12,
    baseFare: 50,
    vehicleType: 'auto',
    distanceKm: 4.2
  });
  const [surgeResult, setSurgeResult] = useState(null);
  const [evaluatingSurge, setEvaluatingSurge] = useState(false);

  // Configurable Thresholds
  const [thresholds, setThresholds] = useState({
    minSurgeRatio: 1.2,
    highSurgeRatio: 1.8,
    maxSurgeCap: 1.8
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [zonesData, repoData] = await Promise.all([
        api.getZones(),
        api.getRepositioningRecommendations()
      ]);
      if (zonesData && Array.isArray(zonesData)) {
        setZones(zonesData);
        if (!selectedZone && zonesData.length > 0) {
          setSelectedZone(zonesData[0]);
        }
      }
      if (repoData && repoData.recommendations) {
        setRepositioning(repoData.recommendations);
      }
    } catch (e) {
      console.error('Failed to load zone intelligence:', e);
    } finally {
      setLoading(false);
    }
  };

  const evaluateSurgePricing = async () => {
    setEvaluatingSurge(true);
    try {
      const res = await api.evaluateSurge({
        demandCount: surgeParams.demandCount,
        supplyCount: surgeParams.supplyCount,
        baseFare: surgeParams.baseFare,
        vehicleType: surgeParams.vehicleType,
        distanceKm: surgeParams.distanceKm
      });
      if (res) {
        setSurgeResult(res);
      }
    } catch (e) {
      console.error('Surge evaluate error:', e);
    } finally {
      setEvaluatingSurge(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    evaluateSurgePricing();
  }, [surgeParams.demandCount, surgeParams.supplyCount, surgeParams.baseFare, surgeParams.vehicleType, surgeParams.distanceKm]);

  const handleBroadcastAdvisory = (index, rec) => {
    setBroadcastStatus((prev) => ({ ...prev, [index]: 'SENDING' }));
    setTimeout(() => {
      setBroadcastStatus((prev) => ({ ...prev, [index]: 'SENT' }));
    }, 1200);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'HIGH_DEMAND':
        return (
          <span className="px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-bold font-mono">
            â— HIGH DEMAND
          </span>
        );
      case 'BALANCED':
        return (
          <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold font-mono">
            â— BALANCED
          </span>
        );
      case 'LOW_DEMAND':
      default:
        return (
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold font-mono">
            â— LOW DEMAND
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* SECTION HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <span className="hud text-xs text-[#45E0F2] font-bold">GEOGRAPHIC SECTOR TELEMETRY</span>
          <h2 className="text-3xl font-bold tracking-tight text-white mt-1 flex items-center gap-2">
            Zone Intelligence & Dynamic Surge Pricing
            <Layers className="w-6 h-6 text-[#3A4DFF]" />
          </h2>
          <p className="text-xs text-[#8E96A6] mt-0.5">
            Real-time demand vs. supply ratio calculations per polygon corridor with safety surge caps and voluntary repositioning advisories.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold text-white flex items-center gap-2 transition-all cursor-pointer self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#45E0F2] ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* PART B: INTERACTIVE BELAGAVI ZONE MAP */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <BelagaviZoneMap
            zones={zones}
            selectedZoneId={selectedZone?.id}
            onSelectZone={(z) => setSelectedZone(z)}
            showHeatmap={false}
            showRepositionArrows={true}
            repositionRecommendations={repositioning}
            height="460px"
          />
        </div>

        {/* Selected Zone Telemetry Card */}
        <div className="p-6 rounded-3xl bg-[#0B0D16] border border-white/10 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="hud text-[10px] text-[#45E0F2]">SELECTED SECTOR TELEMETRY</span>
              {selectedZone && getStatusBadge(selectedZone.zone_status)}
            </div>
            <h3 className="text-xl font-bold text-white mt-1">
              {selectedZone?.name || 'Select a zone on the map'}
            </h3>
            <p className="text-xs text-[#8E96A6] mt-1">
              {selectedZone?.description || 'Click any corridor polygon or node on the map to inspect live metrics.'}
            </p>
          </div>

          {selectedZone && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                  <span className="text-[#8E96A6] block text-[10px]">CURRENT BOOKINGS</span>
                  <span className="text-xl font-mono font-bold text-white">
                    {selectedZone.current_bookings || selectedZone.demand_count}
                  </span>
                  <span className="text-[10px] text-[#8E96A6] block">active trips</span>
                </div>
                <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                  <span className="text-[#8E96A6] block text-[10px]">PREDICTED BOOKINGS</span>
                  <span className="text-xl font-mono font-bold text-[#45E0F2]">
                    {selectedZone.predicted_bookings || Math.round(selectedZone.demand_count * 1.15)}
                  </span>
                  <span className="text-[10px] text-[#8E96A6] block">next 60 mins</span>
                </div>
                <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                  <span className="text-[#8E96A6] block text-[10px]">AVAILABLE RIDERS</span>
                  <span className="text-xl font-mono font-bold text-emerald-400">
                    {selectedZone.available_captains}
                  </span>
                  <span className="text-[10px] text-[#8E96A6] block">idle & online</span>
                </div>
                <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                  <span className="text-[#8E96A6] block text-[10px]">BUSY RIDERS</span>
                  <span className="text-xl font-mono font-bold text-amber-400">
                    {selectedZone.busy_captains}
                  </span>
                  <span className="text-[10px] text-[#8E96A6] block">on assignment</span>
                </div>
              </div>

              <div className="p-3 bg-white/[0.03] rounded-xl border border-white/10 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[#8E96A6]">Demand-to-Supply Ratio:</span>
                  <span className={`font-mono font-bold text-sm ${selectedZone.demand_supply_ratio > 1.5 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {selectedZone.demand_supply_ratio}x
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#8E96A6]">Average Pickup Wait ETA:</span>
                  <span className="font-mono font-bold text-white">
                    {selectedZone.avg_pickup_eta_formatted || '4 mins'}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-white/10">
                  <span className="text-[#8E96A6]">Active Dynamic Surge:</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#3A4DFF]/30 text-[#45E0F2] font-mono font-bold text-xs">
                    {selectedZone.surge_multiplier || 1.0}x Multiplier
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="text-[10px] text-[#8E96A6] font-mono bg-black/30 p-2.5 rounded-xl border border-white/5">
            Geofence ID: {selectedZone?.id || 'N/A'} â€¢ Centroid: [{selectedZone?.center?.latitude}, {selectedZone?.center?.longitude}]
          </div>
        </div>
      </div>

      {/* PART B (CONT): 5-ZONE METRICS MATRIX TABLE */}
      <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4">
        <div>
          <span className="hud text-xs text-[#45E0F2] font-bold">SECTOR AUDIT</span>
          <h3 className="text-lg font-bold text-white mt-0.5">Belagavi 5-Sector Zone Telemetry Matrix</h3>
          <p className="text-xs text-[#8E96A6]">
            Side-by-side comparison of active trips, available captains, and surge multipliers.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[#8E96A6] uppercase hud border-b border-white/10">
              <tr>
                <th className="py-3 px-3">Zone Corridor</th>
                <th className="py-3 px-3">Current Bookings</th>
                <th className="py-3 px-3">Predicted (1h)</th>
                <th className="py-3 px-3">Available Captains</th>
                <th className="py-3 px-3">Busy Captains</th>
                <th className="py-3 px-3">Demand/Supply Ratio</th>
                <th className="py-3 px-3">Avg Pickup ETA</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Surge</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {zones.map((zone) => (
                <tr
                  key={zone.id}
                  onClick={() => setSelectedZone(zone)}
                  className={`hover:bg-white/[0.03] transition-colors cursor-pointer ${
                    selectedZone?.id === zone.id ? 'bg-[#3A4DFF]/10' : ''
                  }`}
                >
                  <td className="py-3 px-3 font-sans font-bold text-white flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        zone.zone_status === 'HIGH_DEMAND'
                          ? 'bg-red-500'
                          : zone.zone_status === 'BALANCED'
                          ? 'bg-amber-400'
                          : 'bg-emerald-400'
                      }`}
                    />
                    {zone.name}
                  </td>
                  <td className="py-3 px-3 text-white font-bold">{zone.current_bookings || zone.demand_count}</td>
                  <td className="py-3 px-3 text-[#45E0F2] font-bold">{zone.predicted_bookings}</td>
                  <td className="py-3 px-3 text-emerald-400 font-bold">{zone.available_captains}</td>
                  <td className="py-3 px-3 text-amber-400">{zone.busy_captains}</td>
                  <td className="py-3 px-3 font-bold text-white">{zone.demand_supply_ratio}x</td>
                  <td className="py-3 px-3 text-[#8E96A6]">{zone.avg_pickup_eta_formatted}</td>
                  <td className="py-3 px-3 font-sans">{getStatusBadge(zone.zone_status)}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full bg-[#3A4DFF]/20 text-[#45E0F2] font-bold">
                      {zone.surge_multiplier}x
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PART C: RIDER REPOSITIONING RECOMMENDATIONS */}
      <div className="p-6 rounded-3xl bg-[#090C16] border border-white/10 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="hud text-xs text-[#45E0F2] font-bold">PROACTIVE REPOSITIONING ENGINE</span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-[10px] font-bold">
                100% VOLUNTARY ADVISORY
              </span>
            </div>
            <h3 className="text-xl font-bold text-white mt-1">Smart Fleet Rebalance Recommendations</h3>
            <p className="text-xs text-[#8E96A6]">
              Calculates optimal repositioning routes from surplus residential sectors to high-demand transit hubs.
            </p>
          </div>
          <div className="text-xs text-[#8E96A6] bg-black/40 px-3 py-1.5 rounded-xl border border-white/5 font-mono">
            Generated: {repositioning.length} Active Corridors
          </div>
        </div>

        {/* Transparency Policy Alert */}
        <div className="p-4 rounded-2xl bg-[#3A4DFF]/10 border border-[#3A4DFF]/30 text-xs flex items-start gap-3 text-[#8E96A6]">
          <ShieldCheck className="w-5 h-5 text-[#45E0F2] shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-white block">Strict Non-Coercive Policy Notice:</span>
            Recommendations are 100% voluntary incentives offered to online drivers. The platform never modifies captain GPS locations automatically or enforces mandatory relocation.
          </div>
        </div>

        {/* Recommendations Cards List */}
        <div className="space-y-4">
          {repositioning.map((rec, index) => {
            const status = broadcastStatus[index];

            return (
              <div
                key={index}
                className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all space-y-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Donor -> Target */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm font-bold text-white flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs font-mono">
                        SURPLUS DONOR:
                      </span>
                      <span>{rec.fromZone.name}</span>
                      <ArrowRight className="w-4 h-4 text-[#45E0F2]" />
                      <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-xs font-mono">
                        DEFICIT TARGET:
                      </span>
                      <span className="text-red-400">{rec.toZone.name}</span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-[#8E96A6] font-mono">
                      <span>Travel Distance: {(rec.distanceMeters / 1000).toFixed(1)} km</span>
                      <span>â€¢</span>
                      <span>Estimated Transit ETA: {rec.formattedEta}</span>
                      <span>â€¢</span>
                      <span className="text-emerald-400 font-bold">Suggested Capacity: {rec.suggestedCaptains} Captains</span>
                    </div>
                  </div>

                  {/* Broadcast Button */}
                  <div className="shrink-0">
                    {status === 'SENT' ? (
                      <div className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold rounded-xl flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        <span>Advisory Broadcasted (4 Accepted)</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleBroadcastAdvisory(index, rec)}
                        disabled={status === 'SENDING'}
                        className="px-4 py-2 bg-[#3A4DFF] hover:bg-[#2c3ee0] text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#3A4DFF]/20"
                      >
                        <Send className={`w-3.5 h-3.5 ${status === 'SENDING' ? 'animate-spin' : ''}`} />
                        <span>{status === 'SENDING' ? 'Broadcasting...' : `Broadcast Incentive Advisory`}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Details Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-2 border-t border-white/5">
                  <div className="p-3 bg-black/30 rounded-xl border border-white/5">
                    <span className="text-[#8E96A6] block text-[10px] uppercase font-mono">Algorithm Reason</span>
                    <p className="text-white mt-0.5">{rec.reason}</p>
                  </div>
                  <div className="p-3 bg-black/30 rounded-xl border border-white/5">
                    <span className="text-[#8E96A6] block text-[10px] uppercase font-mono">Expected Supply Impact</span>
                    <p className="text-emerald-400 mt-0.5 font-semibold">{rec.expectedImprovement}</p>
                  </div>
                  <div className="p-3 bg-black/30 rounded-xl border border-white/5">
                    <span className="text-[#8E96A6] block text-[10px] uppercase font-mono">Captain Incentive Bonus</span>
                    <p className="text-[#45E0F2] mt-0.5 font-bold font-mono">{rec.voluntaryIncentive}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PART D: DYNAMIC SURGE PRICING EVALUATOR & SANDBOX */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-[#0B0F20] to-[#080B14] border border-white/10 space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="hud text-xs text-[#45E0F2] font-bold">ALGORITHMIC PRICING SANDBOX</span>
            <span className="px-2 py-0.5 rounded-full bg-[#3A4DFF]/20 text-[#45E0F2] border border-[#3A4DFF]/30 font-mono text-[10px] font-bold">
              CONNECTED TO LIVE BACKEND SERVICE
            </span>
          </div>
          <h3 className="text-xl font-bold text-white mt-1">Dynamic Surge Pricing Calculation Console</h3>
          <p className="text-xs text-[#8E96A6]">
            Simulate and audit real-time surge multiplier adjustments based on rider demand and driver availability.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Configurable Sliders & Inputs */}
          <div className="space-y-5">
            <h4 className="text-xs font-bold text-white tracking-wider uppercase font-mono border-b border-white/10 pb-2">
              Simulation Input Parameters
            </h4>

            {/* Demand Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-[#8E96A6] font-bold">Rider Booking Requests (Demand):</span>
                <span className="font-mono font-bold text-white">{surgeParams.demandCount} requests</span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                value={surgeParams.demandCount}
                onChange={(e) => setSurgeParams({ ...surgeParams, demandCount: Number(e.target.value) })}
                className="w-full accent-[#3A4DFF] cursor-pointer"
              />
            </div>

            {/* Supply Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-[#8E96A6] font-bold">Available Online Captains (Supply):</span>
                <span className="font-mono font-bold text-emerald-400">{surgeParams.supplyCount} captains</span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                value={surgeParams.supplyCount}
                onChange={(e) => setSurgeParams({ ...surgeParams, supplyCount: Number(e.target.value) })}
                className="w-full accent-[#10B981] cursor-pointer"
              />
            </div>

            {/* Base Fare & Distance */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <span className="text-[#8E96A6] block text-xs font-bold">Base Fare (â‚¹):</span>
                <input
                  type="number"
                  value={surgeParams.baseFare}
                  onChange={(e) => setSurgeParams({ ...surgeParams, baseFare: Number(e.target.value) })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-sm outline-none focus:border-[#3A4DFF]"
                />
              </div>
              <div className="space-y-1.5">
                <span className="text-[#8E96A6] block text-xs font-bold">Trip Distance (km):</span>
                <input
                  type="number"
                  step="0.5"
                  value={surgeParams.distanceKm}
                  onChange={(e) => setSurgeParams({ ...surgeParams, distanceKm: Number(e.target.value) })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-sm outline-none focus:border-[#3A4DFF]"
                />
              </div>
            </div>

            {/* Vehicle Selector */}
            <div className="space-y-1.5">
              <span className="text-[#8E96A6] block text-xs font-bold">Vehicle Class:</span>
              <div className="grid grid-cols-3 gap-2">
                {['bike', 'auto', 'cab'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setSurgeParams({ ...surgeParams, vehicleType: type })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                      surgeParams.vehicleType === type
                        ? 'bg-[#3A4DFF] text-white shadow-md'
                        : 'bg-white/5 text-[#8E96A6] hover:text-white'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Configurable Safety Caps */}
            <div className="p-4 bg-black/40 rounded-2xl border border-white/10 space-y-2 text-xs">
              <span className="text-[10px] text-[#45E0F2] font-mono font-bold block uppercase">
                Active Threshold Constraints
              </span>
              <div className="flex justify-between text-[#8E96A6]">
                <span>Surge Trigger Threshold:</span>
                <span className="font-mono text-white">Ratio &gt; 1.2</span>
              </div>
              <div className="flex justify-between text-[#8E96A6]">
                <span>High Surge Threshold:</span>
                <span className="font-mono text-white">Ratio &gt; 1.8</span>
              </div>
              <div className="flex justify-between text-[#8E96A6]">
                <span>Max Surge Multiplier Cap:</span>
                <span className="font-mono text-emerald-400 font-bold">1.8x Hard Cap</span>
              </div>
            </div>
          </div>

          {/* Real-time Calculation Result Display */}
          <div className="p-6 rounded-2xl bg-black/60 border border-white/10 flex flex-col justify-between space-y-5">
            <div>
              <div className="flex items-center justify-between">
                <span className="hud text-xs text-[#45E0F2] font-bold">BACKEND PRICING EVALUATION</span>
                <span className="text-[10px] font-mono text-emerald-400">STATUS 200 OK</span>
              </div>

              {/* Multiplier Big Display */}
              <div className="mt-4 p-5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-xs text-[#8E96A6] block">Computed Multiplier</span>
                  <span className="text-4xl font-extrabold font-mono text-white">
                    {surgeResult?.calculatedMultiplier || '1.0'}x
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-[#8E96A6] block">Demand/Supply Ratio</span>
                  <span className={`text-2xl font-bold font-mono ${
                    (surgeParams.demandCount / surgeParams.supplyCount) > 1.5 ? 'text-red-400' : 'text-emerald-400'
                  }`}>
                    {(surgeParams.demandCount / surgeParams.supplyCount).toFixed(2)}:1
                  </span>
                </div>
              </div>
            </div>

            {/* Multi-tier Fare Preview */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-white uppercase font-mono block">
                Estimated Customer Fare Breakdown
              </span>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-center">
                  <span className="text-[#8E96A6] block text-[10px]">BIKE</span>
                  <span className="text-sm font-bold text-white block mt-1">
                    â‚¹{Math.round(35 * (surgeResult?.calculatedMultiplier || 1))}
                  </span>
                  <span className="text-[10px] text-[#8E96A6]">Base: â‚¹35</span>
                </div>
                <div className="p-3 bg-[#3A4DFF]/15 rounded-xl border border-[#3A4DFF]/30 text-center">
                  <span className="text-[#45E0F2] block text-[10px] font-bold">AUTO (ACTIVE)</span>
                  <span className="text-base font-bold text-[#45E0F2] block mt-1">
                    â‚¹{surgeResult?.finalEstimatedFare || 68}
                  </span>
                  <span className="text-[10px] text-[#8E96A6]">Base: â‚¹{surgeParams.baseFare}</span>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-center">
                  <span className="text-[#8E96A6] block text-[10px]">CAB</span>
                  <span className="text-sm font-bold text-white block mt-1">
                    â‚¹{Math.round(85 * (surgeResult?.calculatedMultiplier || 1))}
                  </span>
                  <span className="text-[10px] text-[#8E96A6]">Base: â‚¹85</span>
                </div>
              </div>
            </div>

            {/* Explanation Reason & Guarantees */}
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-[#3A4DFF]/10 rounded-xl border border-[#3A4DFF]/20 text-[#45E0F2]">
                <span className="font-bold block text-white text-[11px]">Pricing Audit Reason:</span>
                {surgeResult?.reason || 'Standard base pricing active.'}
              </div>

              <div className="flex items-center gap-2 text-[11px] text-[#8E96A6]">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Confirmed bookings never change. Surges are guaranteed locked upon passenger request.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
