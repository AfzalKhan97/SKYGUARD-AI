import React, { useState } from 'react';
import { 
  AlertOctagon, 
  Search, 
  Filter, 
  ArrowUpDown, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  ShieldAlert, 
  Sparkles,
  Download,
  SlidersHorizontal
} from 'lucide-react';
import { AnomalyRecord, ParameterType, AnomalySeverity, AnomalyStatus } from '../types';
import { useStation } from '../context/StationContext';
import { AnomalyDetailsModal } from './AnomalyDetailsModal';

export const AnomaliesView: React.FC = () => {
  const { anomalies, selectedAnomalyId, setSelectedAnomalyId, setSelectedStationId } = useStation();

  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'time' | 'station' | 'confidence' | 'severity'>('time');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // If an anomaly is selected for deep dive, show the investigation view
  if (selectedAnomalyId) {
    return <AnomalyDetailsModal anomalyId={selectedAnomalyId} onBack={() => setSelectedAnomalyId(null)} />;
  }

  // Filter anomalies
  const filtered = anomalies.filter(anom => {
    let matchesFilter = true;
    if (activeFilter === 'Temperature') matchesFilter = anom.parameter === 'temperature';
    else if (activeFilter === 'Humidity') matchesFilter = anom.parameter === 'humidity';
    else if (activeFilter === 'Pressure') matchesFilter = anom.parameter === 'pressure';
    else if (activeFilter === 'Critical') matchesFilter = anom.severity === 'critical';
    else if (activeFilter === 'Warning') matchesFilter = anom.severity === 'warning';
    else if (activeFilter === 'Resolved') matchesFilter = anom.status === 'Resolved';

    const matchesSearch = 
      anom.stationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      anom.stationId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      anom.anomalyType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      anom.id.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const handleRowClick = (anomaly: AnomalyRecord) => {
    setSelectedAnomalyId(anomaly.id);
    setSelectedStationId(anomaly.stationId);
  };

  const toggleSort = (col: 'time' | 'station' | 'confidence' | 'severity') => {
    if (sortBy === col) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-700" />
              <span>Meteorological Data Quality & Anomaly Log</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Historical and active multi-sensor faults, telemetry dropouts, and verified weather anomalies
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-md border border-slate-200">
              Total Logged: {anomalies.length}
            </span>
          </div>
        </div>

        {/* Filter Pills and Search Bar */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {['All', 'Temperature', 'Humidity', 'Pressure', 'Critical', 'Warning', 'Resolved'].map((filter) => {
              const isSelected = activeFilter === filter;
              return (
                <button
                  key={filter}
                  id={`anomaly-filter-${filter.toLowerCase()}`}
                  onClick={() => setActiveFilter(filter)}
                  className={`
                    px-3 py-1 rounded-md font-medium transition
                    ${isSelected 
                      ? 'bg-blue-900 text-white font-semibold shadow-xs' 
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'}
                  `}
                >
                  {filter}
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by station, ID or type..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-700"
            />
          </div>

        </div>
      </div>

      {/* Anomaly Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 select-none">
              <tr>
                <th 
                  className="py-3 px-4 cursor-pointer hover:text-slate-900"
                  onClick={() => toggleSort('time')}
                >
                  <div className="flex items-center gap-1">
                    <span>Time</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th 
                  className="py-3 px-4 cursor-pointer hover:text-slate-900"
                  onClick={() => toggleSort('station')}
                >
                  <div className="flex items-center gap-1">
                    <span>Station</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4">Parameter</th>
                <th className="py-3 px-4">Anomaly Type</th>
                <th 
                  className="py-3 px-4 cursor-pointer hover:text-slate-900"
                  onClick={() => toggleSort('severity')}
                >
                  <div className="flex items-center gap-1">
                    <span>Severity</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th 
                  className="py-3 px-4 cursor-pointer hover:text-slate-900"
                  onClick={() => toggleSort('confidence')}
                >
                  <div className="flex items-center gap-1">
                    <span>Confidence</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No anomalies match the selected filters.
                  </td>
                </tr>
              ) : (
                filtered.map((anomaly) => {
                  const isCritical = anomaly.severity === 'critical';
                  const isWarning = anomaly.severity === 'warning';

                  return (
                    <tr
                      key={anomaly.id}
                      id={`anomaly-row-${anomaly.id}`}
                      onClick={() => handleRowClick(anomaly)}
                      className="hover:bg-slate-50 cursor-pointer transition-colors group"
                    >
                      {/* Time */}
                      <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                        {anomaly.timestamp}
                      </td>

                      {/* Station */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 group-hover:text-blue-700 transition">
                          {anomaly.stationName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {anomaly.stationId} • {anomaly.state}
                        </div>
                      </td>

                      {/* Parameter */}
                      <td className="py-3 px-4 capitalize font-medium">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {anomaly.parameter}
                        </span>
                      </td>

                      {/* Anomaly Type & Observed */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{anomaly.anomalyType}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Observed: <strong className="text-slate-700">{anomaly.observedValue}</strong> → Est: <strong className="text-emerald-700">{anomaly.estimatedValue}</strong>
                        </div>
                      </td>

                      {/* Severity */}
                      <td className="py-3 px-4">
                        <span className={`
                          inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase
                          ${isCritical ? 'bg-rose-100 text-rose-800' :
                            isWarning ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}
                        `}>
                          {anomaly.severity}
                        </span>
                      </td>

                      {/* Confidence */}
                      <td className="py-3 px-4 font-mono">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">{anomaly.confidence}%</span>
                          <div className="w-10 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${isCritical ? 'bg-rose-600' : 'bg-blue-800'}`}
                              style={{ width: `${anomaly.confidence}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span className={`
                          px-2 py-0.5 rounded text-[11px] font-semibold
                          ${anomaly.status === 'Active' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                            anomaly.status === 'Under Investigation' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-emerald-50 text-emerald-700 border border-emerald-200'}
                        `}>
                          {anomaly.status}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(anomaly);
                          }}
                          className="text-xs font-semibold text-blue-900 hover:text-blue-950 inline-flex items-center gap-1 group-hover:underline"
                        >
                          Investigate
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
      </div>
    </div>
  );
};
