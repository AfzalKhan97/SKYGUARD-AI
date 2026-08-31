import React, { useState } from 'react';
import { useStation } from '../context/StationContext';
import { SimulationController } from './SimulationController';
import { SummaryCards } from './SummaryCards';
import { LiveWeatherTable } from './LiveWeatherTable';
import { TrendChart } from './TrendChart';
import { RecentAnomaliesFeed } from './RecentAnomaliesFeed';
import { IndiaStationMap } from './IndiaStationMap';
import { StationDetailsView } from './StationDetailsView';
import { AnomalyDetailsModal } from './AnomalyDetailsModal';

export const DashboardView: React.FC = () => {
  const { 
    currentTab, 
    setCurrentTab, 
    selectedStationId, 
    setSelectedStationId, 
    selectedAnomalyId, 
    setSelectedAnomalyId 
  } = useStation();

  const [tableFilter, setTableFilter] = useState<'all' | 'healthy' | 'attention' | 'critical'>('all');

  return (
    <div className="space-y-6">
      {/* 1. Developer / Evaluator Scenario Simulation Bar */}
      <SimulationController />

      {/* 2. Top Summary Metric Cards */}
      <SummaryCards 
        activeFilter={tableFilter} 
        onFilterChange={(filter) => setTableFilter(filter)} 
      />

      {/* 3. Main Operational Grid: Map & Trend Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Station Health Map (7 cols) */}
        <div className="lg:col-span-7">
          <IndiaStationMap />
        </div>

        {/* Right: Weather Trend Chart (5 cols) */}
        <div className="lg:col-span-5">
          <TrendChart />
        </div>
      </div>

      {/* 4. Secondary Grid: Recent Anomalies & Live Telemetry Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Recent Anomalies Feed (5 cols) */}
        <div className="lg:col-span-5">
          <RecentAnomaliesFeed 
            onInvestigate={(anomalyId) => {
              setSelectedAnomalyId(anomalyId);
              setCurrentTab('anomalies');
            }} 
          />
        </div>

        {/* Right: Live Weather Telemetry Table (7 cols) */}
        <div className="lg:col-span-7">
          <LiveWeatherTable 
            statusFilter={tableFilter} 
            limit={8} 
            showAllOption={true} 
          />
        </div>
      </div>
    </div>
  );
};
