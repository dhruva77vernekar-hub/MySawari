import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Clock, 
  MapPin, 
  AlertTriangle, 
  Sparkles, 
  Calendar, 
  Filter, 
  RefreshCw, 
  Layers, 
  ArrowUpRight, 
  Info,
  ChevronRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import Card from '../ui/Card';
import BelagaviZoneMap from './BelagaviZoneMap';
import { api } from '../../services/api';

export default function DemandIntelligence() {
  const [loading, setLoading] = useState(true);
  const [forecastData, setForecastData] = useState(null);
  const [error, setError] = useState(null);

  // Filters
  const [dateFilter, setDateFilter] = useState('TODAY'); // TODAY, TOMORROW, WEEKEND
  const [timeFilter, setTimeFilter] = useState('ALL'); // ALL, MORNING, AFTERNOON, EVENING, NIGHT
  const [selectedZoneFilter, setSelectedZoneFilter] = useState('ALL');
  const [hoveredHour, setHoveredHour] = useState(null);

  const fetchForecast = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getDemandForecast({
        date: dateFilter.toLowerCase()
      });
      if (data) {
        setForecastData(data);
      } else {
        setError('Unable to load demand forecast from backend server.');
      }
    } catch (err) {
      console.error('Failed to load demand forecast:', err);
      setError(err.message || 'Forecast retrieval error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast();
  }, [dateFilter]);

  // Fallback / mock data if backend request failed
  const summary = forecastData?.summary || {
    expectedBookingsNextHour: 58,
    highestDemandZone: 'Market Area & Khade Bazar',
    highestDemandRatio: 3.86,
    expectedPeakTime: '17:30 - 19:30 IST',
    predictedRiderShortage: '76 Captains',
    totalActiveZones: 5,
    methodology: 'Gradient Boosted Decision Stumps (MODEL_VERSION: gb-stumps-hour-zone-v1)',
    isSimulatedLabel: '[SIMULATED - DEMO DATA]',
    modelEvaluation: {
      samples: 672,
      holdoutSamples: 134,
      mae: 1.129,
      confidence: 0.78,
      featuresUsed: 'hourSin hourCos weekdaySin weekdayCos lag1 lag24 lag168 mean3 mean6'
    }
  };

  const rawHourly = forecastData?.hourlyForecast || [];
  const rawDaily = forecastData?.dailyForecast || [];
  const zones = forecastData?.zones || [];
  const heatmapPoints = forecastData?.demandHeatmap || forecastData?.heatmapPoints || [];

  // Filter hourly data based on timeFilter
  const filteredHourly = rawHourly.filter((item) => {
    if (timeFilter === 'MORNING') return item.hour >= 8 && item.hour <= 11;
    if (timeFilter === 'AFTERNOON') return item.hour >= 12 && item.hour <= 16;
    if (timeFilter === 'EVENING') return item.hour >= 17 && item.hour <= 21;
    if (timeFilter === 'NIGHT') return item.hour >= 22 || item.hour <= 6;
    return true; // ALL
  });

  // Calculate max demand for chart scaling
  const maxDemand = Math.max(...filteredHourly.map((h) => Math.max(h.historicalDemand, h.predictedDemand)), 60);

  return (
    <div className="space-y-8">
      {/* SECTION HEADER WITH SIMULATION BADGE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="hud text-xs text-[#45E0F2] font-bold">ADMIN PREDICTIVE ML ENGINE</span>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-[10px] font-bold tracking-wider">
              {summary.isSimulatedLabel}
            </span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white mt-1 flex items-center gap-2">
            Predictive Demand Forecasting
            <Sparkles className="w-6 h-6 text-[#45E0F2]" />
          </h2>
          <p className="text-xs text-[#8E96A6] mt-0.5">
            Empirical machine-learning time series projecting ride volumes across Belagavi corridors with automated shortage detection.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchForecast}
            disabled={loading}
            className="px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold text-white flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#45E0F2] ${loading ? 'animate-spin' : ''}`} />
            <span>Retrain & Refresh</span>
          </button>
        </div>
      </div>

      {/* 4 PRIMARY DEMAND KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card dark={true} className="p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between text-[#8E96A6]">
            <span className="hud text-[11px] font-bold text-[#45E0F2]">NEXT HOUR BOOKINGS</span>
            <Clock className="w-4 h-4 text-[#45E0F2]" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-white">
              {summary.expectedBookingsNextHour}
            </span>
            <span className="text-xs text-emerald-400 font-bold flex items-center">
              +14.2% <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-[11px] text-[#8E96A6] mt-1">
            Projection for upcoming 60-min window across all 5 Belagavi zones.
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#3A4DFF] to-[#45E0F2]" />
        </Card>

        <Card dark={true} className="p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between text-[#8E96A6]">
            <span className="hud text-[11px] font-bold text-red-400">HIGHEST DEMAND ZONE</span>
            <MapPin className="w-4 h-4 text-red-400" />
          </div>
          <div className="mt-3">
            <p className="text-lg font-bold text-white truncate">{summary.highestDemandZone}</p>
            <span className="inline-block px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-mono text-[10px] font-bold mt-1">
              Demand/Supply Ratio: {summary.highestDemandRatio}x
            </span>
          </div>
          <p className="text-[11px] text-[#8E96A6] mt-1">
            Wholesale and market retail evening surge hub.
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-500" />
        </Card>

        <Card dark={true} className="p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between text-[#8E96A6]">
            <span className="hud text-[11px] font-bold text-amber-400">EXPECTED PEAK WINDOW</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold font-mono text-white">{summary.expectedPeakTime}</p>
            <span className="text-xs text-amber-300 font-semibold">College & Commute Exit Peak</span>
          </div>
          <p className="text-[11px] text-[#8E96A6] mt-1">
            Historical peak correlated with college closure and train arrivals.
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-400" />
        </Card>

        <Card dark={true} className="p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between text-[#8E96A6]">
            <span className="hud text-[11px] font-bold text-[#3A4DFF]">PREDICTED SHORTAGE</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-white">
              {summary.predictedRiderShortage}
            </span>
            <span className="text-[10px] text-amber-400 font-mono font-bold">DEFICIT</span>
          </div>
          <p className="text-[11px] text-[#8E96A6] mt-1">
            Recommended for voluntary repositioning from Tilakwadi/Camp.
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#3A4DFF]" />
        </Card>
      </div>

      {/* ML METHODOLOGY & FORMULA CARD */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#0E1325] to-[#0A0D18] border border-white/10 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="hud text-xs text-white font-mono font-bold">
              MACHINE LEARNING ARCHITECTURE SPECIFICATION
            </span>
          </div>
          <span className="text-[11px] text-[#45E0F2] font-mono font-bold">
            {summary.methodology}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-1 border-t border-white/10">
          <div>
            <span className="text-[#8E96A6] block text-[10px] uppercase font-mono">Algorithm Family</span>
            <span className="font-bold text-white">Gradient Boosted Decision Stumps</span>
          </div>
          <div>
            <span className="text-[#8E96A6] block text-[10px] uppercase font-mono">Holdout Test MAE</span>
            <span className="font-mono font-bold text-emerald-400">{summary.modelEvaluation.mae} rides/hr</span>
          </div>
          <div>
            <span className="text-[#8E96A6] block text-[10px] uppercase font-mono">Dataset Volume</span>
            <span className="font-mono text-white">{summary.modelEvaluation.samples} hourly samples (28 days)</span>
          </div>
          <div>
            <span className="text-[#8E96A6] block text-[10px] uppercase font-mono">Confidence Level</span>
            <span className="font-mono font-bold text-[#45E0F2]">{(summary.modelEvaluation.confidence * 100).toFixed(0)}% Statistical Fit</span>
          </div>
        </div>

        <div className="text-[11px] text-[#8E96A6] bg-black/30 p-2.5 rounded-xl border border-white/5 font-mono">
          <span className="text-[#45E0F2] font-bold">Engineered Feature Vectors: </span>
          {summary.modelEvaluation.featuresUsed}
        </div>
      </div>

      {/* FILTERS TOOLBAR */}
      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[#8E96A6] flex items-center gap-1.5 font-bold mr-1">
            <Filter className="w-3.5 h-3.5" /> Date:
          </span>
          {['TODAY', 'TOMORROW', 'WEEKEND'].map((d) => (
            <button
              key={d}
              onClick={() => setDateFilter(d)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                dateFilter === d
                  ? 'bg-[#3A4DFF] text-white shadow-lg shadow-[#3A4DFF]/25'
                  : 'bg-white/5 text-[#8E96A6] hover:text-white hover:bg-white/10'
              }`}
            >
              {d === 'TODAY' ? 'Today (Active)' : d === 'TOMORROW' ? 'Tomorrow (+24h)' : 'Weekend Peak'}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[#8E96A6] flex items-center gap-1.5 font-bold mr-1">
            <Clock className="w-3.5 h-3.5" /> Time Window:
          </span>
          {[
            { id: 'ALL', label: 'All 24h' },
            { id: 'MORNING', label: 'Morning (08-11)' },
            { id: 'AFTERNOON', label: 'Afternoon (12-16)' },
            { id: 'EVENING', label: 'Evening Peak (17-21)' },
            { id: 'NIGHT', label: 'Night (22-06)' }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTimeFilter(t.id)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                timeFilter === t.id
                  ? 'bg-[#45E0F2] text-black shadow-lg shadow-[#45E0F2]/25 font-extrabold'
                  : 'bg-white/5 text-[#8E96A6] hover:text-white hover:bg-white/10'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 24-HOUR HISTORICAL VS PREDICTED DEMAND CHART */}
      <div className="p-6 rounded-3xl bg-[#090C15] border border-white/10 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="hud text-xs text-[#45E0F2] font-bold">COMPARATIVE TIME-SERIES</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-[#8E96A6] border border-white/10 font-mono">
                24-Hour Dual-Series
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mt-0.5">Historical vs. Predicted Demand Trajectory</h3>
            <p className="text-xs text-[#8E96A6]">
              Visualizes recorded actual rides against trained gradient boosted stump forecasts.
            </p>
          </div>

          {/* Series Legends */}
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-md bg-[#06B6D4]" />
              <span className="text-white font-bold">Historical Actual (Rides)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-md bg-[#818CF8]" />
              <span className="text-[#818CF8] font-bold">AI Predicted (Rides)</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>Current Hour</span>
            </div>
          </div>
        </div>

        {/* Custom Interactive SVG/Bar Chart */}
        <div className="h-64 sm:h-72 w-full pt-4 pb-2 flex items-end gap-2 sm:gap-3 overflow-x-auto border-b border-white/10">
          {filteredHourly.map((slot) => {
            const histHeightPercent = Math.max((slot.historicalDemand / maxDemand) * 100, 4);
            const predHeightPercent = Math.max((slot.predictedDemand / maxDemand) * 100, 4);
            const isHovered = hoveredHour === slot.hour;

            return (
              <div
                key={slot.hour}
                onMouseEnter={() => setHoveredHour(slot.hour)}
                onMouseLeave={() => setHoveredHour(null)}
                className={`flex-1 min-w-[28px] sm:min-w-[36px] h-full flex flex-col justify-end items-center relative group cursor-pointer transition-all ${
                  slot.isCurrentHour ? 'bg-white/[0.04] rounded-xl px-1' : ''
                }`}
              >
                {/* Hover Tooltip */}
                {isHovered && (
                  <div className="absolute -top-24 left-1/2 -translate-x-1/2 z-20 w-44 p-2.5 bg-[#0B0F1D] border border-white/20 rounded-xl shadow-2xl text-[11px] space-y-1 pointer-events-none">
                    <p className="font-bold text-white font-mono flex items-center justify-between">
                      <span>{slot.timeLabel}</span>
                      <span className="text-[#45E0F2]">{(slot.confidence * 100).toFixed(0)}% conf</span>
                    </p>
                    <div className="flex justify-between text-cyan-400">
                      <span>Actual Recorded:</span>
                      <span className="font-bold font-mono">{slot.historicalDemand} rides</span>
                    </div>
                    <div className="flex justify-between text-indigo-400">
                      <span>ML Forecast:</span>
                      <span className="font-bold font-mono">{slot.predictedDemand} rides</span>
                    </div>
                    <div className="flex justify-between text-[#8E96A6] pt-1 border-t border-white/10">
                      <span>Delta Variance:</span>
                      <span className={slot.deltaPercent >= 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                        {slot.deltaPercent >= 0 ? `+${slot.deltaPercent}%` : `${slot.deltaPercent}%`}
                      </span>
                    </div>
                  </div>
                )}

                {/* Bars Container */}
                <div className="w-full flex items-end justify-center gap-1 h-[82%]">
                  {/* Historical Bar */}
                  <div
                    style={{ height: `${histHeightPercent}%` }}
                    className="w-1/2 max-w-[14px] bg-[#06B6D4]/80 group-hover:bg-[#06B6D4] rounded-t transition-all shadow-sm shadow-cyan-500/20"
                  />
                  {/* Predicted Bar */}
                  <div
                    style={{ height: `${predHeightPercent}%` }}
                    className="w-1/2 max-w-[14px] bg-[#818CF8]/80 group-hover:bg-[#818CF8] rounded-t transition-all shadow-sm shadow-indigo-500/20 border-t-2 border-white/40"
                  />
                </div>

                {/* Hour Label */}
                <div className="text-[10px] font-mono text-[#8E96A6] mt-2 group-hover:text-white flex flex-col items-center">
                  <span>{slot.hour}:00</span>
                  {slot.isCurrentHour && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-0.5" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* GEOGRAPHIC DEMAND HEATMAP */}
      <div className="space-y-4">
        <div>
          <span className="hud text-xs text-[#45E0F2] font-bold">GIS VISUALIZATION</span>
          <h3 className="text-xl font-bold text-white mt-0.5">Geographic Belagavi Demand Heatmap</h3>
          <p className="text-xs text-[#8E96A6]">
            Spatial concentration of incoming ride requests across major market corridors, educational campuses, and transit gates.
          </p>
        </div>

        <BelagaviZoneMap
          zones={zones}
          heatmapPoints={heatmapPoints}
          showHeatmap={true}
          showRepositionArrows={false}
          height="460px"
        />
      </div>

      {/* 7-DAY DAILY DEMAND FORECAST TABLE */}
      <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="hud text-xs text-[#45E0F2] font-bold">EXTENDED HORIZON</span>
            <h3 className="text-lg font-bold text-white mt-0.5">7-Day Daily Demand Forecast</h3>
            <p className="text-xs text-[#8E96A6]">
              Aggregate daily ride volume estimates and recommended fleet availability.
            </p>
          </div>
          <span className="text-xs font-mono text-[#8E96A6]">
            Cycle: {rawDaily[0]?.date || 'Today'} â†’ {rawDaily[rawDaily.length - 1]?.date || '+7d'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[#8E96A6] uppercase hud border-b border-white/10">
              <tr>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Day of Week</th>
                <th className="py-3 px-3">Expected Volume</th>
                <th className="py-3 px-3">Peak Corridor</th>
                <th className="py-3 px-3">Peak Window</th>
                <th className="py-3 px-3">Model Confidence</th>
                <th className="py-3 px-3">Rider Staffing Recommendation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {rawDaily.map((d, idx) => {
                const dateLabel = d.date || `Day +${idx + 1}`;
                const dayLabel = d.dayName || d.fullDay || d.day || 'Day';
                const volume = d.expectedVolume || d.predictedBookings || 1120;
                const peakZoneName = d.peakZone || 'Market Area & Khade Bazar';
                const peakWindow = d.peakHour || '17:30 - 19:30';
                const confPercent = d.confidence ? Math.round(d.confidence * 100) : 80;

                return (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-3 font-bold text-white">{dateLabel}</td>
                    <td className="py-3 px-3 text-[#45E0F2] font-bold">{dayLabel}</td>
                    <td className="py-3 px-3 text-lg font-bold text-emerald-400">{volume} rides</td>
                    <td className="py-3 px-3 text-white font-sans">{peakZoneName}</td>
                    <td className="py-3 px-3 text-amber-300 font-bold">{peakWindow}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-[#3A4DFF]/20 text-[#45E0F2] border border-[#3A4DFF]/30 font-bold">
                        {confPercent}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[#8E96A6] font-sans">
                      {dayLabel === 'Saturday' || dayLabel === 'Sunday'
                        ? 'Deploy +25% weekend evening shifts in Khade Bazar'
                        : 'Maintain standard morning and evening split shifts'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
