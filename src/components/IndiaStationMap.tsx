import React, { useState } from 'react';
import { Navigation, Info, ShieldCheck, Mountain } from 'lucide-react';
import { Station } from '../types';
import { useStation } from '../context/StationContext';

export const IndiaStationMap: React.FC = () => {
  const { stations, selectedStationId, setSelectedStationId, setCurrentTab } = useStation();
  const [hoveredStation, setHoveredStation] = useState<Station | null>(null);
  const [activeFilter, setActiveFilter] = useState<'All' | 'GHCNh' | 'North' | 'West'>('All');

  // GPS Projection Parameters
  const latMin = 24.0;
  const latMax = 32.0;
  const lngMin = 71.0;
  const lngMax = 81.0;

  const projectCoord = (lat: number, lng: number) => {
    const x = ((lng - lngMin) / (lngMax - lngMin)) * 380 + 60;
    const y = 490 - ((lat - latMin) / (latMax - latMin)) * 430;
    return { x, y };
  };

  const filteredStations = stations.filter(s => {
    if (activeFilter === 'GHCNh') return s.isPrimaryGhcnhStation;
    if (activeFilter === 'North') return s.region === 'North';
    if (activeFilter === 'West') return s.region === 'West';
    return true;
  });

  const handleStationClick = (station: Station) => {
    setSelectedStationId(station.id);
    setCurrentTab('stations');
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Navigation className="w-4 h-4 text-blue-800" />
            <span>GHCNh Station Network Map (Northern & Western India)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Geographic distribution of Safdarjung (VIDD), Jodhpur (VIJO), and Dehradun (42111) AWS nodes
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            <span className="text-slate-600 text-[11px]">Healthy</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
            <span className="text-slate-600 text-[11px]">Attention</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block animate-pulse"></span>
            <span className="text-slate-600 text-[11px]">Critical Fault</span>
          </div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex items-center gap-1.5 my-2.5 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'All', label: 'All AWS Stations (6)' },
          { id: 'GHCNh', label: 'GHCNh Verified (3 Primary)' },
          { id: 'North', label: 'Northern Zone (Delhi & Uttarakhand)' },
          { id: 'West', label: 'Western Zone (Rajasthan)' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveFilter(item.id as any)}
            className={`
              px-2.5 py-0.5 rounded text-[11px] font-medium whitespace-nowrap transition
              ${activeFilter === item.id 
                ? 'bg-blue-900 text-white font-semibold' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}
            `}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Map SVG Container */}
      <div className="relative w-full h-80 sm:h-96 bg-slate-50/70 rounded-md border border-slate-100 flex items-center justify-center overflow-hidden">
        
        <svg 
          viewBox="0 0 500 550" 
          className="w-full h-full max-h-[380px] select-none"
          aria-label="India Meteorological Station Network Map"
        >
          {/* Subtle Background Grid Lines */}
          <defs>
            <pattern id="grid" width="35" height="35" patternUnits="userSpaceOnUse">
              <path d="M 35 0 L 0 0 0 35" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="500" height="550" fill="url(#grid)" />

          {/* Regional Contour Outline for North/West India */}
          <path
            d="M 60 480
               L 80 340
               L 110 260
               L 180 180
               L 260 80
               L 360 60
               L 440 140
               L 410 240
               L 390 320
               L 340 450
               L 220 500
               Z"
            fill="#f8fafc"
            stroke="#cbd5e1"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />

          {/* Inter-station Spatial Cross-Validation Vectors */}
          {stations.map(st => {
            const p1 = projectCoord(st.lat, st.lng);
            return st.nearbyStationIds.map(nid => {
              const nst = stations.find(s => s.id === nid);
              if (!nst) return null;
              const p2 = projectCoord(nst.lat, nst.lng);
              return (
                <line
                  key={`${st.id}-${nid}`}
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke="#94a3b8"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  strokeOpacity="0.6"
                />
              );
            });
          })}

          {/* Station Markers */}
          {filteredStations.map((station) => {
            const { x, y } = projectCoord(station.lat, station.lng);
            const isHovered = hoveredStation?.id === station.id;
            const isSelected = selectedStationId === station.id;

            const colorClass = 
              station.status === 'healthy' ? '#10b981' :
              station.status === 'attention' ? '#f59e0b' : '#ef4444';

            return (
              <g 
                key={station.id}
                className="cursor-pointer transition-transform"
                onClick={() => handleStationClick(station)}
                onMouseEnter={() => setHoveredStation(station)}
                onMouseLeave={() => setHoveredStation(null)}
              >
                {/* Outer Ring on Hover/Select or Critical */}
                {(station.status === 'critical' || isSelected || isHovered) && (
                  <circle
                    cx={x}
                    cy={y}
                    r={isSelected ? 14 : 10}
                    fill={colorClass}
                    fillOpacity={0.25}
                    className={station.status === 'critical' ? 'animate-ping' : ''}
                  />
                )}

                {/* Primary Station Hexagon / Circle */}
                {station.isPrimaryGhcnhStation ? (
                  <rect
                    x={x - 6}
                    y={y - 6}
                    width={12}
                    height={12}
                    rx={3}
                    fill={colorClass}
                    stroke="#ffffff"
                    strokeWidth="2"
                    transform={`rotate(45 ${x} ${y})`}
                  />
                ) : (
                  <circle
                    cx={x}
                    cy={y}
                    r={isSelected ? 6 : 4.5}
                    fill={colorClass}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                )}

                {/* Station Label with Elevation Badge */}
                <text
                  x={x + 10}
                  y={y - 2}
                  fontSize="9.5"
                  fontWeight={isSelected || station.isPrimaryGhcnhStation ? 'bold' : 'normal'}
                  fill={isSelected ? '#1e3a8a' : '#1e293b'}
                  className="pointer-events-none font-sans"
                >
                  {station.name}
                </text>
                <text
                  x={x + 10}
                  y={y + 8}
                  fontSize="7.5"
                  fill="#64748b"
                  className="pointer-events-none font-mono"
                >
                  {station.id} ({station.elevation}m)
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredStation && (
          <div 
            className="absolute bottom-3 left-3 bg-slate-900 text-white p-3 rounded-md shadow-xl border border-slate-700 text-xs pointer-events-none z-20 max-w-xs transition-opacity"
          >
            <div className="flex items-center justify-between gap-3 border-b border-slate-700 pb-1.5 mb-1.5">
              <div>
                <span className="font-bold text-white text-sm block">{hoveredStation.name}</span>
                <span className="text-[10px] text-slate-400 font-mono">{hoveredStation.id} • {hoveredStation.source}</span>
              </div>
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                hoveredStation.status === 'healthy' ? 'bg-emerald-800 text-emerald-100' :
                hoveredStation.status === 'attention' ? 'bg-amber-800 text-amber-100' : 'bg-rose-800 text-rose-100'
              }`}>
                {hoveredStation.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
              <div className="text-slate-400">Elevation:</div>
              <div className="font-mono text-slate-200">{hoveredStation.elevation} m MSL</div>

              <div className="text-slate-400">Temperature:</div>
              <div className="font-mono font-bold text-slate-100">
                {hoveredStation.currentReadings.temperature !== null ? `${hoveredStation.currentReadings.temperature}°C` : 'NULL'}
              </div>

              <div className="text-slate-400">Humidity / Pressure:</div>
              <div className="font-mono text-slate-200">
                {hoveredStation.currentReadings.humidity}% • {hoveredStation.currentReadings.pressure} hPa
              </div>

              <div className="text-slate-400">Sensor Trust Score:</div>
              <div className="font-bold text-emerald-400 font-mono">{hoveredStation.sensorTrust.trust_score.toFixed(1)} / 100</div>
            </div>

            <p className="text-[10px] text-blue-300 mt-2 font-medium">Click marker to inspect full station telemetry →</p>
          </div>
        )}
      </div>

      {/* Footer Spatial Coherence Explanation */}
      <div className="pt-2 text-slate-500 text-[11px] flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-800" />
          <span>Dashed lines show inverse-distance spatial cross-validation baselines</span>
        </div>
        <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">GHCNh 2023 Benchmark</span>
      </div>
    </div>
  );
};
