import React, { useState } from 'react';
import { Layers, Flame, Navigation, AlertTriangle, ShieldCheck, Info } from 'lucide-react';

const MIN_LNG = 74.465;
const MAX_LNG = 74.535;
const MIN_LAT = 15.802;
const MAX_LAT = 15.875;

export function projectGeoToSvg(lng, lat, width = 800, height = 480) {
  const x = ((lng - MIN_LNG) / (MAX_LNG - MIN_LNG)) * (width - 80) + 40;
  const y = ((MAX_LAT - lat) / (MAX_LAT - MIN_LAT)) * (height - 80) + 40;
  return [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
}

export default function BelagaviZoneMap({
  zones = [],
  selectedZoneId = null,
  onSelectZone = null,
  showHeatmap = true,
  heatmapPoints = [],
  showRepositionArrows = true,
  repositionRecommendations = [],
  height = '480px'
}) {
  const [hoveredZone, setHoveredZone] = useState(null);
  const [mapMode, setMapMode] = useState('all'); // 'all', 'zones', 'heatmap'

  // Determine status color styling
  const getZoneColors = (status) => {
    switch (status) {
      case 'HIGH_DEMAND':
        return {
          fill: 'rgba(239, 68, 68, 0.22)',
          stroke: '#EF4444',
          glow: 'rgba(239, 68, 68, 0.4)',
          badgeBg: 'bg-red-500/20 text-red-400 border-red-500/30'
        };
      case 'BALANCED':
        return {
          fill: 'rgba(245, 158, 11, 0.18)',
          stroke: '#F59E0B',
          glow: 'rgba(245, 158, 11, 0.35)',
          badgeBg: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
        };
      case 'LOW_DEMAND':
      default:
        return {
          fill: 'rgba(16, 185, 129, 0.18)',
          stroke: '#10B981',
          glow: 'rgba(16, 185, 129, 0.35)',
          badgeBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
        };
    }
  };

  return (
    <div className="relative w-full rounded-3xl bg-[#090C15] border border-white/10 overflow-hidden shadow-2xl flex flex-col">
      {/* Map Header Toolbar */}
      <div className="p-4 bg-[#0B0F1D]/80 backdrop-blur-md border-b border-white/10 flex flex-wrap items-center justify-between gap-3 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#45E0F2] animate-ping" />
          <div>
            <h4 className="text-xs font-bold text-white tracking-wider flex items-center gap-1.5 font-mono">
              BELAGAVI MOBILITY SECTOR GIS
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#3A4DFF]/20 text-[#45E0F2] border border-[#3A4DFF]/30">
                LIVE TELEMETRY
              </span>
            </h4>
            <span className="text-[10px] text-[#8E96A6]">
              Covers Central Railway Hub, Khade Bazar, Tilakwadi, KLE Medical & Udyambag
            </span>
          </div>
        </div>

        {/* View Mode Controls */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex bg-black/40 rounded-xl p-1 border border-white/10">
            <button
              onClick={() => setMapMode('all')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                mapMode === 'all' ? 'bg-[#3A4DFF] text-white shadow-md' : 'text-[#8E96A6] hover:text-white'
              }`}
            >
              All Layers
            </button>
            <button
              onClick={() => setMapMode('zones')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                mapMode === 'zones' ? 'bg-[#3A4DFF] text-white shadow-md' : 'text-[#8E96A6] hover:text-white'
              }`}
            >
              Polygons Only
            </button>
            <button
              onClick={() => setMapMode('heatmap')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                mapMode === 'heatmap' ? 'bg-[#3A4DFF] text-white shadow-md' : 'text-[#8E96A6] hover:text-white'
              }`}
            >
              Demand Heatmap
            </button>
          </div>
        </div>
      </div>

      {/* SVG Canvas Map */}
      <div className="relative w-full bg-[#07090F] flex-1 overflow-hidden" style={{ minHeight: height }}>
        <svg
          viewBox="0 0 800 480"
          className="w-full h-full select-none"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Grid Pattern */}
            <pattern id="radarGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="1" />
            </pattern>

            {/* Glowing marker filter */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Repositioning arrow marker */}
            <marker
              id="arrowhead"
              markerWidth="8"
              markerHeight="6"
              refX="7"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#45E0F2" />
            </marker>

            {/* Heatmap blur filter */}
            <filter id="heatBlur" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="14" />
            </filter>
          </defs>

          {/* Background Grid */}
          <rect width="800" height="480" fill="url(#radarGrid)" />

          {/* City Geographic Compass & Waterlines/Road Axis Reference */}
          <g opacity="0.15">
            {/* National Highway 4 / Pune-Bangalore Corridor */}
            <line x1="120" y1="460" x2="680" y2="40" stroke="#3A4DFF" strokeWidth="2" strokeDasharray="4 4" />
            <text x="690" y="55" fill="#45E0F2" fontSize="9" fontFamily="monospace">NH-4 Bypass</text>

            {/* Khanapur Road Arterial */}
            <line x1="240" y1="420" x2="520" y2="160" stroke="#8E96A6" strokeWidth="1.5" strokeDasharray="2 2" />
            <text x="210" y="435" fill="#8E96A6" fontSize="9" fontFamily="monospace">Khanapur Rd</text>
          </g>

          {/* HEATMAP LAYER */}
          {(mapMode === 'all' || mapMode === 'heatmap') && showHeatmap && (
            <g className="heatmap-layer pointer-events-none" filter="url(#heatBlur)">
              {heatmapPoints.map((pt, idx) => {
                const [cx, cy] = projectGeoToSvg(pt.longitude, pt.latitude);
                const radius = 22 + pt.intensity * 28;
                const fill =
                  pt.intensity > 0.65
                    ? 'rgba(239, 68, 68, 0.45)'
                    : pt.intensity > 0.45
                    ? 'rgba(245, 158, 11, 0.35)'
                    : 'rgba(58, 77, 255, 0.3)';
                return <circle key={`heat-${idx}`} cx={cx} cy={cy} r={radius} fill={fill} />;
              })}
            </g>
          )}

          {/* ZONE POLYGONS LAYER */}
          {(mapMode === 'all' || mapMode === 'zones') && (
            <g className="zones-layer">
              {zones.map((zone) => {
                const colors = getZoneColors(zone.zone_status);
                const isSelected = selectedZoneId === zone.id;
                const isHovered = hoveredZone === zone.id;

                let pathData = '';
                if (zone.polygon_geojson && zone.polygon_geojson.coordinates && zone.polygon_geojson.coordinates[0]) {
                  pathData = zone.polygon_geojson.coordinates[0]
                    .map((coord, i) => {
                      const [x, y] = projectGeoToSvg(coord[0], coord[1]);
                      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                    })
                    .join(' ') + ' Z';
                }

                const [cx, cy] = projectGeoToSvg(zone.center.longitude, zone.center.latitude);

                return (
                  <g key={zone.id}>
                    {/* Zone Boundary Polygon */}
                    {pathData && (
                      <path
                        d={pathData}
                        fill={isSelected ? colors.fill.replace('0.18', '0.35').replace('0.22', '0.4') : colors.fill}
                        stroke={colors.stroke}
                        strokeWidth={isSelected ? 3 : isHovered ? 2.5 : 1.5}
                        strokeDasharray={isSelected ? 'none' : isHovered ? '4 2' : 'none'}
                        className="transition-all duration-200 cursor-pointer"
                        onMouseEnter={() => setHoveredZone(zone.id)}
                        onMouseLeave={() => setHoveredZone(null)}
                        onClick={() => onSelectZone && onSelectZone(zone)}
                      />
                    )}

                    {/* Zone Centroid Pulse & Node */}
                    <g
                      transform={`translate(${cx}, ${cy})`}
                      className="cursor-pointer"
                      onClick={() => onSelectZone && onSelectZone(zone)}
                    >
                      {/* Outer pulse */}
                      <circle
                        r={zone.zone_status === 'HIGH_DEMAND' ? 18 : 12}
                        fill="none"
                        stroke={colors.stroke}
                        strokeWidth="1"
                        opacity="0.6"
                        className={zone.zone_status === 'HIGH_DEMAND' ? 'animate-ping' : ''}
                      />
                      {/* Core circle */}
                      <circle
                        r={isSelected ? 7 : 5}
                        fill={colors.stroke}
                        stroke="#FFFFFF"
                        strokeWidth="1.5"
                        filter="url(#glow)"
                      />

                      {/* Zone Name Label & Surge Badge */}
                      <g transform="translate(10, -8)">
                        <rect
                          x="0"
                          y="-14"
                          width={zone.name.length * 6.5 + 46}
                          height="22"
                          rx="6"
                          fill="rgba(11, 15, 29, 0.88)"
                          stroke={colors.stroke}
                          strokeWidth="1"
                        />
                        <text
                          x="8"
                          y="1"
                          fill="#FFFFFF"
                          fontSize="10"
                          fontWeight="700"
                          fontFamily="sans-serif"
                        >
                          {zone.name.split('&')[0].trim()}
                        </text>
                        <text
                          x={zone.name.length * 6.5 + 14}
                          y="1"
                          fill={colors.stroke}
                          fontSize="9.5"
                          fontWeight="800"
                          fontFamily="monospace"
                        >
                          {zone.surge_multiplier || 1.0}x
                        </text>
                      </g>
                    </g>
                  </g>
                );
              })}
            </g>
          )}

          {/* REPOSITIONING ARROWS LAYER */}
          {(mapMode === 'all' || mapMode === 'zones') && showRepositionArrows && (
            <g className="reposition-arrows-layer pointer-events-none">
              {repositionRecommendations.map((rec, index) => {
                if (!rec.fromZone?.center || !rec.toZone?.center) return null;
                const [x1, y1] = projectGeoToSvg(rec.fromZone.center.longitude, rec.fromZone.center.latitude);
                const [x2, y2] = projectGeoToSvg(rec.toZone.center.longitude, rec.toZone.center.latitude);

                // Calculate midpoint for badge
                const midX = (x1 + x2) / 2;
                const midY = (y1 + y2) / 2;

                return (
                  <g key={`arrow-${index}`}>
                    {/* Animated dashed trajectory line */}
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="#45E0F2"
                      strokeWidth="2.5"
                      strokeDasharray="6 4"
                      markerEnd="url(#arrowhead)"
                      className="animate-pulse"
                    />

                    {/* Transfer time & captain badge */}
                    <g transform={`translate(${midX - 45}, ${midY - 12})`}>
                      <rect
                        width="90"
                        height="20"
                        rx="5"
                        fill="#0B0D14"
                        stroke="#45E0F2"
                        strokeWidth="1"
                      />
                      <text
                        x="45"
                        y="13"
                        fill="#45E0F2"
                        fontSize="9"
                        fontWeight="bold"
                        textAnchor="middle"
                        fontFamily="monospace"
                      >
                        +{rec.suggestedCaptains} Caps â€¢ {rec.estimatedTravelMinutes}m
                      </text>
                    </g>
                  </g>
                );
              })}
            </g>
          )}
        </svg>

        {/* Legend Overlay at Bottom Right */}
        <div className="absolute bottom-4 right-4 bg-[#0B0F1D]/90 backdrop-blur-md p-3 rounded-2xl border border-white/10 text-[11px] space-y-1.5 shadow-xl">
          <div className="font-bold text-white text-[10px] tracking-wider uppercase">Zone Intelligence Legend</div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/50" />
            <span className="text-[#8E96A6]">High Demand / Deficit (Surge &gt; 1.3x)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-[#8E96A6]">Balanced Demand (1.0x - 1.2x)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-[#8E96A6]">Low Demand / Surplus (1.0x)</span>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-white/10">
            <span className="w-4 h-0.5 border-t border-dashed border-[#45E0F2]" />
            <span className="text-[#45E0F2] font-mono">Voluntary Reposition Route</span>
          </div>
        </div>
      </div>
    </div>
  );
}
