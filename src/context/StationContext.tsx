import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Station, 
  AnomalyRecord, 
  SimulationScenario, 
  NavigationTab, 
  AnomalyStatus,
  DatasetValidationMetadata,
  UserProfile
} from '../types';
import { DataAccessLayer } from '../services/dataAccessLayer';

export const DEFAULT_USER_PROFILE: UserProfile = {
  name: 'Dr. Rajesh Sharma',
  role: 'Senior Meteorological Officer',
  badge: 'IMD-QC-9842',
  email: 'r.sharma@imd.gov.in',
  phone: '+91 11 2461 8241',
  organization: 'India Meteorological Department',
  division: 'Surface Instruments & AWS Quality Division',
  regionalCenter: 'RMC New Delhi (Mausam Bhawan)',
  shift: '06:00 - 14:00 IST (Morning Operations)',
  alertEmailEnabled: true,
  alertSmsEnabled: true,
  soundAlertsEnabled: false,
  bio: 'Lead Meteorological Quality Analyst overseeing Northern & Western sector Automatic Weather Station telemetry networks and automated sensor drift algorithms.'
};

interface StationContextType {
  stations: Station[];
  anomalies: AnomalyRecord[];
  selectedStationId: string | null;
  selectedAnomalyId: string | null;
  currentTab: NavigationTab;
  currentScenario: SimulationScenario;
  isAuthenticated: boolean;
  currentUser: UserProfile;
  isProfileModalOpen: boolean;
  isLiveUpdating: boolean;
  searchQuery: string;
  datasetReport: DatasetValidationMetadata;
  setSearchQuery: (q: string) => void;
  setCurrentTab: (tab: NavigationTab) => void;
  setSelectedStationId: (id: string | null) => void;
  setSelectedAnomalyId: (id: string | null) => void;
  setScenario: (scenario: SimulationScenario) => void;
  setIsProfileModalOpen: (open: boolean) => void;
  updateUserProfile: (updatedFields: Partial<UserProfile>) => void;
  resetUserProfile: () => void;
  toggleLiveUpdating: () => void;
  login: () => void;
  logout: () => void;
  resolveAnomaly: (id: string, status: AnomalyStatus, notes?: string) => void;
  selectedStation: Station | null;
  selectedAnomaly: AnomalyRecord | null;
  selectedStationAnomaly: AnomalyRecord | null;
  counts: {
    total: number;
    healthy: number;
    attention: number;
    critical: number;
    totalDatasetRows: number;
    sensorFaultsCount: number;
    genuineEventsCount: number;
  };
}

const StationContext = createContext<StationContextType | undefined>(undefined);

export const StationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stations, setStations] = useState<Station[]>(DataAccessLayer.getStations());
  const [anomalies, setAnomalies] = useState<AnomalyRecord[]>(DataAccessLayer.getAnomalies());
  const [selectedStationId, setSelectedStationId] = useState<string | null>('INI0000VIDD');
  const [selectedAnomalyId, setSelectedAnomalyId] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [currentScenario, setCurrentScenario] = useState<SimulationScenario>('TEMPERATURE_SPIKE');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [isLiveUpdating, setIsLiveUpdating] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  // Initialize profile from localStorage or default
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('skyguard_user_profile');
      if (saved) {
        return { ...DEFAULT_USER_PROFILE, ...JSON.parse(saved) };
      }
    } catch {
      // ignore
    }
    return DEFAULT_USER_PROFILE;
  });

  const datasetReport = DataAccessLayer.getDatasetValidationReport();

  const updateUserProfile = (updatedFields: Partial<UserProfile>) => {
    setCurrentUser(prev => {
      const updated = { ...prev, ...updatedFields };
      try {
        localStorage.setItem('skyguard_user_profile', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const resetUserProfile = () => {
    setCurrentUser(DEFAULT_USER_PROFILE);
    try {
      localStorage.setItem('skyguard_user_profile', JSON.stringify(DEFAULT_USER_PROFILE));
    } catch {
      // ignore
    }
  };

  // Switch simulation scenario using DataAccessLayer
  const setScenario = (scenario: SimulationScenario) => {
    setCurrentScenario(scenario);
    const result = DataAccessLayer.simulateScenario(scenario);
    setStations(result.stations);
    setAnomalies(result.anomalies);
    setSelectedStationId(result.targetStationId);
  };

  // Subtle live update simulation preserving exact GHCNh base records
  useEffect(() => {
    if (!isLiveUpdating) return;

    const interval = setInterval(() => {
      setStations(prev => {
        return prev.map(s => {
          // If sensor is missing or frozen, preserve its state
          if (s.currentReadings.temperature === null || (s.id === 'INM00042111' && currentScenario === 'FROZEN_SENSOR')) {
            return s;
          }
          // Don't modify the exact 55.0 spike on INI0000VIDD if spike scenario active
          if (s.id === 'INI0000VIDD' && currentScenario === 'TEMPERATURE_SPIKE') {
            return s;
          }

          const tempDelta = (Math.random() - 0.5) * 0.1;
          const humDelta = Math.random() > 0.6 ? (Math.random() > 0.5 ? 1 : -1) : 0;
          const currentT = s.currentReadings.temperature;
          const currentRH = s.currentReadings.humidity;

          return {
            ...s,
            lastUpdated: 'Just now (14:30Z)',
            currentReadings: {
              ...s.currentReadings,
              temperature: currentT !== null ? Number((currentT + tempDelta).toFixed(1)) : null,
              humidity: currentRH !== null ? Math.min(100, Math.max(10, currentRH + humDelta)) : null,
            },
          };
        });
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [isLiveUpdating, currentScenario]);

  const login = () => setIsAuthenticated(true);
  const logout = () => setIsAuthenticated(false);
  const toggleLiveUpdating = () => setIsLiveUpdating(prev => !prev);

  const resolveAnomaly = (id: string, newStatus: AnomalyStatus, notes?: string) => {
    DataAccessLayer.resolveAnomaly(id, newStatus, notes, currentUser.name);
    setAnomalies([...DataAccessLayer.getAnomalies()]);
    setStations([...DataAccessLayer.getStations()]);
  };

  const selectedStation = stations.find(s => s.id === selectedStationId) || stations[0];
  const selectedAnomaly = anomalies.find(a => a.id === selectedAnomalyId) || null;
  const selectedStationAnomaly = anomalies.find(a => a.stationId === selectedStation?.id) || null;

  const counts = {
    total: stations.length,
    healthy: stations.filter(s => s.status === 'healthy').length,
    attention: stations.filter(s => s.status === 'attention').length,
    critical: stations.filter(s => s.status === 'critical').length,
    totalDatasetRows: datasetReport.totalRows,
    sensorFaultsCount: datasetReport.targetClassDistribution.sensor_data_anomaly.count,
    genuineEventsCount: datasetReport.targetClassDistribution.likely_genuine_event.count,
  };

  return (
    <StationContext.Provider
      value={{
        stations,
        anomalies,
        selectedStationId,
        selectedAnomalyId,
        currentTab,
        currentScenario,
        isAuthenticated,
        currentUser,
        isLiveUpdating,
        searchQuery,
        datasetReport,
        setSearchQuery,
        setCurrentTab,
        setSelectedStationId,
        setSelectedAnomalyId,
        setScenario,
        isProfileModalOpen,
        setIsProfileModalOpen,
        updateUserProfile,
        resetUserProfile,
        toggleLiveUpdating,
        login,
        logout,
        resolveAnomaly,
        selectedStation,
        selectedAnomaly,
        selectedStationAnomaly,
        counts,
      }}
    >
      {children}
    </StationContext.Provider>
  );
};

export const useStation = () => {
  const context = useContext(StationContext);
  if (!context) {
    throw new Error('useStation must be used within a StationProvider');
  }
  return context;
};
