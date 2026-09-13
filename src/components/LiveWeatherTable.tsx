import React, { useState } from 'react';
import { 
  ArrowUpDown, 
  ExternalLink, 
  Search, 
  Filter, 
  ShieldCheck, 
  AlertTriangle, 
  AlertOctagon,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { Station, StationStatus } from '../types';
import { useStation } from '../context/StationContext';

interface LiveWeatherTableProps {
  statusFilter?: string;
  limit?: number;
  showAllOption?: boolean;
}

export const LiveWeatherTable: React.FC<LiveWeatherTableProps> = ({ 
  statusFilter = 'all', 
  limit, 
  showAllOption = true 
}) => {
  const { stations, setSelectedStationId, setCurrentTab } = useStation();
  const [localSearch, setLocalSearch] = useState('');
  const [sortBy, setSortBy] = useState<'id' | 'name' | 'temp' | 'status'>('status');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedFilter, setSelectedFilter] = useState<string>(statusFilter);

  // Filter stations
  let filtered = stations.filter(s => {
    const matchesFilter = 
      selectedFilter === 'all' ? true :
      s.status === selectedFilter;

    const matchesSearch = 
      s.name.toLowerCase().includes(localSearch.toLowerCase()) ||
      s.id.toLowerCase().includes(localSearch.toLowerCase()) ||
      s.state.toLowerCase().includes(localSearch.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  // Sort stations
  filtered.sort((a, b) => {
    if (sortBy === 'id') {
      return sortOrder === 'asc' ? a.id.localeCompare(b.id) : b.id.localeCompare(a.id);
    }
    if (sortBy === 'name') {
      return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    }
    if (sortBy === 'temp') {
      const aTemp = a.currentReadings.temperature ?? -999;
      const bTemp = b.currentReadings.temperature ?? -999;
      return sortOrder === 'asc' ? aTemp - bTemp : bTemp - aTemp;
    }
    if (sortBy === 'status') {
      const priority: Record<StationStatus, number> = { critical: 3, attention: 2, healthy: 1 };
      return sortOrder === 'asc' ? priority[a.status] - priority[b.status] : priority[b.status] - priority[a.status];
    }
    return 0;
  });

  if (limit) {
    filtered = filtered.slice(0, limit);
  }

  const handleStationClick = (stationId: string) => {
    setSelectedStationId(stationId);
    setCurrentTab('stations');
  };

  const toggleSort = (column: 'id' | 'name' | 'temp' | 'status') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
      {/* Table Header & Controls */}
      <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Live Automatic Weather Station Telemetry</span>
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
              {filtered.length} Stations
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time sensory ingest across Temperature, Relative Humidity & Barometric Pressure
          </p>
        </div>

        {/* Filter Pills & Search */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Filter list..."
              className="pl-8 pr-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div className="inline-flex rounded-md border border-slate-200 p-0.5 bg-slate-50 text-xs">
            {['all', 'healthy', 'attention', 'critical'].map((f) => (
              <button
                key={f}
                id={`filter-pill-${f}`}
                onClick={() => setSelectedFilter(f)}
                className={`
                  px-2.5 py-1 rounded text-xs font-medium capitalize transition
                  ${selectedFilter === f 
                    ? 'bg-white text-slate-900 shadow-xs font-semibold' 
                    : 'text-slate-600 hover:text-slate-900'}
                `}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table Container with horizontal scroll on small screens */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 select-none">
            <tr>
              <th 
                className="py-3 px-4 cursor-pointer hover:text-slate-900"
                onClick={() => toggleSort('id')}
              >
                <div className="flex items-center gap-1">
                  <span>Station</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th 
                className="py-3 px-4 cursor-pointer hover:text-slate-900"
                onClick={() => toggleSort('name')}
              >
                <div className="flex items-center gap-1">
                  <span>Location</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th 
                className="py-3 px-4 cursor-pointer hover:text-slate-900"
                onClick={() => toggleSort('temp')}
              >
                <div className="flex items-center gap-1">
                  <span>Temperature</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-4">Humidity</th>
              <th className="py-3 px-4">Pressure</th>
              <th 
                className="py-3 px-4 cursor-pointer hover:text-slate-900"
                onClick={() => toggleSort('status')}
              >
                <div className="flex items-center gap-1">
                  <span>Status</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                  No automatic weather stations match the current filter criteria.
                </td>
              </tr>
            ) : (
              filtered.map((station) => {
                const isCritical = station.status === 'critical';
                const isAttention = station.status === 'attention';

                return (
                  <tr 
                    key={station.id}
                    id={`station-row-${station.id}`}
                    onClick={() => handleStationClick(station.id)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    {/* Station ID */}
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <span className="group-hover:text-blue-700 transition-colors">{station.id}</span>
                        {station.transmissionType === 'INSAT / Satellite' && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-slate-100 text-slate-500 font-sans hidden sm:inline" title="INSAT-3DR Uplink">
                            SAT
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Location */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{station.name}</div>
                      <div className="text-[11px] text-slate-500">{station.state}</div>
                    </td>

                    {/* Temperature */}
                    <td className="py-3 px-4 font-mono">
                      {station.currentReadings.temperature !== null ? (
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-semibold ${
                            station.currentReadings.temperature > 42 ? 'text-rose-700 font-bold bg-rose-50 px-1 rounded' :
                            station.currentReadings.temperature > 35 ? 'text-amber-700' : 'text-slate-800'
                          }`}>
                            {station.currentReadings.temperature.toFixed(1)}°C
                          </span>
                          {station.currentReadings.temperature > 42 && (
                            <span className="text-[10px] text-rose-600 font-sans uppercase font-bold tracking-tight">
                              Spike
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-rose-600 font-medium text-xs bg-rose-50 px-1.5 py-0.5 rounded">
                          NULL / Timeout
                        </span>
                      )}
                    </td>

                    {/* Humidity */}
                    <td className="py-3 px-4 font-mono">
                      {station.currentReadings.humidity !== null ? (
                        <span className="text-slate-800 font-medium">
                          {station.currentReadings.humidity}%
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Pressure */}
                    <td className="py-3 px-4 font-mono">
                      {station.currentReadings.pressure !== null ? (
                        <span className="text-slate-800 font-medium">
                          {station.currentReadings.pressure} hPa
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4">
                      <span className={`
                        inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold
                        ${station.status === 'healthy' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : station.status === 'attention'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse'}
                      `}>
                        {station.status === 'healthy' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                        {station.status === 'attention' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                        {station.status === 'critical' && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
                        <span className="capitalize">{station.status}</span>
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStationClick(station.id);
                        }}
                        className="text-xs font-semibold text-blue-900 hover:text-blue-950 inline-flex items-center gap-1 group-hover:underline"
                      >
                        Inspect
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showAllOption && limit && limit < stations.length && (
        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
          <button
            onClick={() => setCurrentTab('stations')}
            className="text-xs font-semibold text-blue-900 hover:text-blue-950 inline-flex items-center gap-1"
          >
            View all 24 Automatic Weather Stations in network
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
