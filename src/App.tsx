/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { StationProvider, useStation } from './context/StationContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { StationsListView } from './components/StationsListView';
import { AnomaliesView } from './components/AnomaliesView';
import { AnalyticsView } from './components/AnalyticsView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { LoginView } from './components/LoginView';
import { ControlledAnomalyModal } from './components/ControlledAnomalyModal';

const MainLayout: React.FC = () => {
  const { currentTab, isAuthenticated } = useStation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!isAuthenticated) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      {/* Top Application Header */}
      <Header 
        isMobileMenuOpen={isMobileMenuOpen}
        onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      {/* Main Content Body */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        
        {/* Navigation Sidebar */}
        <Sidebar 
          isOpen={isMobileMenuOpen} 
          onClose={() => setIsMobileMenuOpen(false)} 
        />

        {/* Dynamic Route Content */}
        <main className="flex-1 lg:pl-64 p-4 sm:p-6 lg:p-8 min-w-0">
          {currentTab === 'dashboard' && <DashboardView />}
          {currentTab === 'stations' && <StationsListView />}
          {currentTab === 'anomalies' && <AnomaliesView />}
          {currentTab === 'analytics' && <AnalyticsView />}
          {currentTab === 'reports' && <ReportsView />}
          {currentTab === 'settings' && <SettingsView />}
        </main>

      </div>

      {/* Global Controlled Anomaly Simulation Modal */}
      <ControlledAnomalyModal />
    </div>
  );
};

export default function App() {
  return (
    <StationProvider>
      <MainLayout />
    </StationProvider>
  );
}
