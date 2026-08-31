import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ReferenceLine,
  ReferenceDot,
  ReferenceArea
} from 'recharts';
import { ParameterType, Station } from '../types';
import { Thermometer, Droplets, Gauge, AlertCircle, Info, Sparkles } from 'lucide-react';
import { useStation } from '../context/StationContext';

interface TrendChartProps {
  station?: Station;
  title?: string;
  showStationSelector?: boolean;
}

export const TrendChart: React.FC<TrendChartProps> = ({ 
  station: propStation, 
  title, 
  showStationSelector = true 
}) => {
  const { selectedStation, stations, setSelectedStationId } = useStation();
  const activeStation = propStation || selectedStation || stations[0];

  const [activeParam, setActiveParam] = useState<ParameterType>('temperature');
  const [showEstimatedOverlay, setShowEstimatedOverlay] = useState<boolean>(true);

  const history = activeStation.history || [];

  // Configuration for parameters
  const paramConfig = {
    temperature: {
      label: 'Temperature',
      unit: '°C',
      color: '#1e40af', // Blue 800
      anomalyColor: '#e11d48', // Rose 600
      normalMin: 22,
      normalMax: 38,
      yDomain: [15, 52],
      icon: Thermometer,
    },
    humidity: {
      label: 'Relative Humidity',
      unit: '%',
      color: '#0284c7', // Sky 600
      anomalyColor: '#e11d48',
      normalMin: 40,
      normalMax: 90,
      yDomain: [10, 100],
      icon: Droplets,
    },
    pressure: {
      label: 'Barometric Pressure',
      unit: 'hPa',
      color: '#475569', // Slate 600
      anomalyColor: '#e11d48',
      normalMin: 995,
      normalMax: 1018,
      yDomain: [900, 1025],
      icon: Gauge,
    },
    communication: {
      label: 'Signal Completeness',
      unit: '%',
      color: '#6366f1',
      anomalyColor: '#e11d48',
      normalMin: 90,
      normalMax: 100,
      yDomain: [0, 100],
      icon: Gauge,
    },
  };

  const currentCfg = paramConfig[activeParam];

  // Find anomalous point if any
  const anomalyPoint = history.find(h => h.isAnomaly);

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const val = data[activeParam];
      const isAnom = data.isAnomaly;

      return (
        <div className="bg-slate-900 text-white p-3 rounded-md shadow-lg text-xs border border-slate-700 min-w-[160px]">
          <p className="font-semibold text-slate-300 mb-1 border-b border-slate-700 pb-1">
            {data.timeLabel} IST • {data.timestamp?.split('T')[0]}
          </p>
          <div className="flex items-center justify-between gap-3 mt-1">
            <span className="text-slate-400 capitalize">{activeParam}:</span>
            <span className="font-mono font-bold text-sm">
              {val !== null ? `${val} ${currentCfg.unit}` : 'NULL (Dropout)'}
            </span>
          </div>

          {data.estimatedTemp && activeParam === 'temperature' && isAnom && (
            <div className="flex items-center justify-between gap-3 mt-1 text-emerald-400">
              <span>Estimated Value:</span>
              <span className="font-mono font-semibold">{data.estimatedTemp} °C</span>
            </div>
          )}

          {isAnom && (
            <div className="mt-2 pt-1 border-t border-rose-800/80 text-rose-300 text-[11px] font-medium">
              <p className="font-bold flex items-center gap-1 text-rose-400">
                <AlertCircle className="w-3 h-3" />
                {data.anomalyType || 'Anomaly Flagged'}
              </p>
              {data.flagNote && <p className="text-[10px] text-slate-300 mt-0.5">{data.flagNote}</p>}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              {title || `Weather Trend Analysis — ${activeStation.name} (${activeStation.id})`}
            </h3>
            {activeStation.status === 'critical' && (
              <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                Anomaly Active
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            24-hour diurnal sensor profile with ML anomaly boundary envelope
          </p>
        </div>

        {/* Station switcher if allowed */}
        {showStationSelector && (
          <div className="flex items-center gap-2">
            <label htmlFor="station-trend-select" className="text-xs text-slate-500 font-medium">Station:</label>
            <select
              id="station-trend-select"
              value={activeStation.id}
              onChange={(e) => setSelectedStationId(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-md px-2 py-1 font-semibold text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-700"
            >
              {stations.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.id}) {s.status === 'critical' ? '🔴' : s.status === 'attention' ? '🟡' : '🟢'}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Parameter Switcher Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 my-3">
        <div className="inline-flex rounded-md border border-slate-200 p-0.5 bg-slate-50 text-xs">
          {(['temperature', 'humidity', 'pressure'] as ParameterType[]).map((param) => {
            const isCurrent = activeParam === param;
            const cfg = paramConfig[param];
            const Icon = cfg.icon;

            return (
              <button
                key={param}
                id={`chart-param-${param}`}
                onClick={() => setActiveParam(param)}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium capitalize transition
                  ${isCurrent 
                    ? 'bg-blue-900 text-white font-semibold shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}
                `}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cfg.label}</span>
                <span className={`text-[10px] font-mono ${isCurrent ? 'text-blue-200' : 'text-slate-400'}`}>
                  ({cfg.unit})
                </span>
              </button>
            );
          })}
        </div>

        {/* Legend / Overlay info */}
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-blue-800 inline-block"></span>
            <span>Observed Reading</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block"></span>
            <span className="text-rose-700 font-medium">Flagged Anomaly</span>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="w-full h-64 sm:h-72 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={history} margin={{ top: 15, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            
            <XAxis 
              dataKey="timeLabel" 
              tick={{ fontSize: 11, fill: '#64748b' }} 
              axisLine={{ stroke: '#cbd5e1' }}
              tickLine={false}
            />
            
            <YAxis 
              domain={currentCfg.yDomain as any}
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={{ stroke: '#cbd5e1' }}
              tickLine={false}
              unit={activeParam === 'temperature' ? '°C' : activeParam === 'humidity' ? '%' : ''}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Normal Climatological Bounds (Reference lines) */}
            <ReferenceLine
              y={currentCfg.normalMax}
              stroke="#94a3b8"
              strokeDasharray="3 3"
            />
            <ReferenceLine
              y={currentCfg.normalMin}
              stroke="#94a3b8"
              strokeDasharray="3 3"
            />

            {/* Primary Sensor Curve */}
            <Line
              type="monotone"
              dataKey={activeParam}
              stroke={currentCfg.color}
              strokeWidth={2.5}
              dot={{ r: 3, fill: currentCfg.color }}
              activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
              connectNulls={false}
            />

            {/* If anomalous point exists, highlight it */}
            {anomalyPoint && anomalyPoint[activeParam] !== null && (
              <ReferenceDot
                x={anomalyPoint.timeLabel}
                y={anomalyPoint[activeParam] as number}
                r={7}
                fill="#e11d48"
                stroke="#ffffff"
                strokeWidth={2.5}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Diagnostic Note */}
      {anomalyPoint && (
        <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded-md flex items-start gap-2 text-xs text-rose-900">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">{anomalyPoint.anomalyType || 'Anomaly Flagged'}:</span>{' '}
            <span>{anomalyPoint.flagNote}</span>
            {anomalyPoint.estimatedTemp && activeParam === 'temperature' && (
              <span className="block mt-0.5 text-rose-800 font-mono text-[11px]">
                Observed: <strong>{anomalyPoint.temperature}°C</strong> | ML Estimated Target: <strong>{anomalyPoint.estimatedTemp}°C</strong>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
