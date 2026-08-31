import React, { useState } from 'react';
import { Radio, Search, Filter, MapPin, Activity, ChevronRight, ArrowLeft } from 'lucide-react';
import { useStation } from '../context/StationContext';
import { Station } from '../types';
import { StationDetailsView } from './StationDetailsView';

export const StationsListView: React.FC = () => {
  const { stations, selectedStationId, setSelectedStationId } = useStation();
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [search, setSearch] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'details'>(selectedStationId ? 'details' : 'grid');

  const filteredStations = stations.filter(s => {
    const matchesRegion = selectedRegion === 'All' || s.region === selectedRegion;
    const matchesStatus = selectedStatus === 'All' || s.status === selectedStatus.toLowerCase();
    const matchesSearch = 
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.id.toLowerCase().includes(search.toLowerCase()) ||
      s.state.toLowerCase().includes(search.toLowerCase());

    return matchesRegion && matchesStatus && matchesSearch;
  });

  const handleSelectStation = (stationId: string) => {
    setSelectedStationId(stationId);
    setViewMode('details');
  };

  if (viewMode === 'details' && selectedStationId) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setViewMode('grid')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-md shadow-xs transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Station Fleet List
        </button>

        <StationDetailsView onBack={() => setViewMode('grid')} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Radio className="w-5 h-5 text-blue-800" />
              <span>National Automatic Weather Station Fleet ({stations.length} Nodes)</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Live meteorological sensors, transmission health, and continuous quality assurance
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <div className="inline-flex rounded-md border border-slate-200 p-0.5 bg-slate-50">
              {['All', 'Healthy', 'Attention', 'Critical'].map(status => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`px-3 py-1 rounded font-medium transition ${
                    selectedStatus === status ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'text-slate-600'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Region Filter */}
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-slate-700 font-medium"
            >
              <option value="All">All Regions</option>
              <option value="North">North India</option>
              <option value="South">South India</option>
              <option value="West">West India</option>
              <option value="East">East India</option>
              <option value="Central">Central India</option>
              <option value="North-East">North-East India</option>
            </select>
          </div>

          {/* Search */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search station or state..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-700"
            />
          </div>
        </div>
      </div>

      {/* Stations Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStations.map((station) => {
          const isCritical = station.status === 'critical';
          const isAttention = station.status === 'attention';

          return (
            <div
              key={station.id}
              onClick={() => handleSelectStation(station.id)}
              className={`
                bg-white p-4 rounded-lg border transition-all cursor-pointer hover:shadow-md flex flex-col justify-between
                ${isCritical ? 'border-rose-200 hover:border-rose-300' :
                  isAttention ? 'border-amber-200 hover:border-amber-300' :
                  'border-slate-200 hover:border-slate-300'}
              `}
            >
              <div>
                {/* Card Top */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                      {station.id}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {station.transmissionType}
                    </span>
                  </div>

                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    station.status === 'healthy' ? 'bg-emerald-50 text-emerald-700' :
                    station.status === 'attention' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                  }`}>
                    {station.status}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 leading-tight">
                  {station.name}
                </h3>
                <p className="text-xs text-slate-500 mb-3">
                  {station.district}, {station.state}
                </p>

                {/* Sensor Readings Matrix */}
                <div className="grid grid-cols-3 gap-1.5 p-2 bg-slate-50 rounded border border-slate-100 text-center text-xs mb-3">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Temp</span>
                    <span className={`font-mono font-bold ${
                      station.currentReadings.temperature && station.currentReadings.temperature > 40 ? 'text-rose-700' : 'text-slate-800'
                    }`}>
                      {station.currentReadings.temperature !== null ? `${station.currentReadings.temperature}°C` : 'NULL'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block">Humidity</span>
                    <span className="font-mono font-bold text-slate-800">
                      {station.currentReadings.humidity !== null ? `${station.currentReadings.humidity}%` : '—'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block">Pressure</span>
                    <span className="font-mono font-bold text-slate-800">
                      {station.currentReadings.pressure !== null ? `${station.currentReadings.pressure}` : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-500 text-[11px]">Health:</span>
                  <span className={`font-bold font-mono ${
                    station.overallHealthScore >= 90 ? 'text-emerald-700' :
                    station.overallHealthScore >= 70 ? 'text-amber-700' : 'text-rose-700'
                  }`}>
                    {station.overallHealthScore}%
                  </span>
                </div>

                <span className="text-blue-900 font-semibold text-[11px] inline-flex items-center gap-0.5 hover:underline">
                  Inspect
                  <ChevronRight className="w-3 h-3" />
                </span>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};
