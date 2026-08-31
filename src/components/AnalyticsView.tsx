import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line, 
  Legend 
} from 'recharts';
import { 
  BarChart3, 
  Activity, 
  AlertTriangle, 
  Thermometer, 
  Droplets, 
  Gauge, 
  TrendingUp, 
  ShieldCheck, 
  Calendar,
  Layers
} from 'lucide-react';
import { useStation } from '../context/StationContext';

export const AnalyticsView: React.FC = () => {
  const { stations, counts } = useStation();

  // 1. Anomalies by Sensor
  const sensorData = [
    { name: 'Temperature', count: 14, color: '#1e40af', icon: Thermometer },
    { name: 'Humidity', count: 7, color: '#0284c7', icon: Droplets },
    { name: 'Pressure', count: 3, color: '#475569', icon: Gauge },
    { name: 'Telemetry / Comm', count: 5, color: '#9333ea', icon: Activity },
  ];

  // 2. Anomalies Over Time (Past 7 days)
  const timeSeriesData = [
    { day: '25 Aug', spikes: 2, drifts: 1, frozen: 0, missing: 1 },
    { day: '26 Aug', spikes: 3, drifts: 2, frozen: 1, missing: 0 },
    { day: '27 Aug', spikes: 1, drifts: 2, frozen: 0, missing: 1 },
    { day: '28 Aug', spikes: 4, drifts: 3, frozen: 1, missing: 2 },
    { day: '29 Aug', spikes: 2, drifts: 1, frozen: 2, missing: 0 },
    { day: '30 Aug', spikes: 5, drifts: 3, frozen: 1, missing: 1 },
    { day: '31 Aug (Today)', spikes: 3, drifts: 2, frozen: 1, missing: 1 },
  ];

  // 3. Station Health Distribution
  const healthDistributionData = [
    { name: '90% - 100% (Optimal)', value: 19, color: '#10b981' },
    { name: '70% - 89% (Attention)', value: 3, color: '#f59e0b' },
    { name: '< 70% (Critical)', value: 2, color: '#ef4444' },
  ];

  // 4. Fault Type Distribution
  const faultTypeData = [
    { type: 'Sensor Spike', count: 12, percentage: '41%' },
    { type: 'Sensor Drift', count: 8, percentage: '28%' },
    { type: 'Frozen Sensor', count: 4, percentage: '14%' },
    { type: 'Missing Data / Comm', count: 3, percentage: '10%' },
    { type: 'Genuine Weather Events', count: 2, percentage: '7%' },
  ];

  // 5. Most Frequently Affected Stations
  const affectedStations = [
    { station: 'Vijayawada (AWS-031)', state: 'Andhra Pradesh', faults: 6, primaryFault: 'Temperature Spike' },
    { station: 'Visakhapatnam (AWS-027)', state: 'Andhra Pradesh', faults: 4, primaryFault: 'Sensor Drift' },
    { station: 'Jaipur (AWS-042)', state: 'Rajasthan', faults: 4, primaryFault: 'Telemetry Dropout' },
    { station: 'Pune (AWS-019)', state: 'Maharashtra', faults: 3, primaryFault: 'Transducer Latch-Up' },
    { station: 'Nagpur (AWS-022)', state: 'Maharashtra', faults: 2, primaryFault: 'RH Hygrometer Saturation' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-800" />
              <span>Meteorological Data Quality & Anomaly Analytics</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Statistical reliability patterns, sensor degradation trends, and spatial failure distributions
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 bg-slate-100 rounded text-slate-600 font-medium">
              Timeframe: Last 7 Days
            </span>
          </div>
        </div>
      </div>

      {/* Grid of Analytical Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 1. Anomalies Over Time (Bar Chart) */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Anomalies Detected Over Time (Past 7 Days)
              </h3>
              <p className="text-[11px] text-slate-500">Categorized daily detection volume</p>
            </div>
            <span className="text-[10px] font-mono bg-blue-50 text-blue-800 px-2 py-0.5 rounded font-bold">
              29 Incidents Total
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '6px', fontSize: '11px', color: '#fff', border: 'none' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="spikes" name="Spikes" fill="#e11d48" stackId="a" />
                <Bar dataKey="drifts" name="Drifts" fill="#f59e0b" stackId="a" />
                <Bar dataKey="frozen" name="Frozen" fill="#06b6d4" stackId="a" />
                <Bar dataKey="missing" name="Missing / Comm" fill="#9333ea" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Anomalies by Sensor Channel */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Anomalies By Sensor Channel
              </h3>
              <p className="text-[11px] text-slate-500">Distribution across measured meteorological parameters</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-2">
            {sensorData.map((s) => (
              <div key={s.name} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">{s.name}</span>
                  <span className="font-mono font-bold text-sm" style={{ color: s.color }}>{s.count}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div 
                    className="h-full rounded-full" 
                    style={{ width: `${(s.count / 29) * 100}%`, backgroundColor: s.color }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {Math.round((s.count / 29) * 100)}% of total flagged anomalies
                </span>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-slate-500 mt-4 leading-relaxed bg-blue-50/50 p-2.5 rounded border border-blue-100">
            * Temperature channels exhibit highest susceptibility to transient electrical spikes and radiation shield aging.
          </p>
        </div>

        {/* 3. Station Health Distribution (Donut Chart) */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Station Health Distribution
              </h3>
              <p className="text-[11px] text-slate-500">Overall fleet score classification</p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              79.2% Nominal
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-around gap-4 h-56">
            <div className="w-48 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={healthDistributionData}
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {healthDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '6px', fontSize: '11px', color: '#fff', border: 'none' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 text-xs">
              {healthDistributionData.map((d) => (
                <div key={d.name} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="text-slate-700 font-medium">{d.name}:</span>
                  <span className="font-mono font-bold text-slate-900">{d.value} Stations</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 4. Most Frequently Affected Stations Table */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Top Flagged Stations for Maintenance
              </h3>
              <p className="text-[11px] text-slate-500">Stations with highest cumulative anomaly occurrences</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-2 px-3">Station</th>
                  <th className="py-2 px-3">State</th>
                  <th className="py-2 px-3">Primary Fault</th>
                  <th className="py-2 px-3 text-right">Incidents</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {affectedStations.map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-semibold text-slate-900">{s.station}</td>
                    <td className="py-2 px-3 text-slate-500">{s.state}</td>
                    <td className="py-2 px-3">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px]">
                        {s.primaryFault}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-rose-700">
                      {s.faults}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};
