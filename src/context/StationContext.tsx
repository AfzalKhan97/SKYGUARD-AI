import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Station, 
  AnomalyRecord, 
  SimulationScenario, 
  NavigationTab, 
  AnomalyStatus,
  DatasetValidationMetadata,
  UserProfile,
  ControlledSimulationParams,
  ActiveSimulationInfo,
  ParameterType,
  EvidenceVector,
  RootCauseType,
  AnomalySeverity
} from '../types';
import { DataAccessLayer } from '../services/dataAccessLayer';
import { createEvidenceVector } from '../data/ghcnhDataset';
import { analyzeStationData } from '../services/anomalyEngine';

export const DEFAULT_USER_PROFILE: UserProfile = {
  name: 'Demo Analyst',
  role: 'Quality Operations',
  badge: 'DEMO-USER-01',
  email: 'analyst@demo.local',
  phone: 'N/A',
  organization: 'SkyGuard AI Evaluation',
  division: 'Testing & Verification',
  regionalCenter: 'Local Test Environment',
  shift: 'Standard Verification',
  alertEmailEnabled: false,
  alertSmsEnabled: false,
  soundAlertsEnabled: false,
  bio: 'Evaluating SkyGuard AI real-time anomaly detection pipeline performance.'
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
  isControlledSimModalOpen: boolean;
  activeControlledSim: ActiveSimulationInfo | null;
  preferredChartParam: ParameterType;
  isLiveUpdating: boolean;
  searchQuery: string;
  datasetReport: DatasetValidationMetadata;
  setSearchQuery: (q: string) => void;
  setCurrentTab: (tab: NavigationTab) => void;
  setSelectedStationId: (id: string | null) => void;
  setSelectedAnomalyId: (id: string | null) => void;
  setPreferredChartParam: (param: ParameterType) => void;
  setScenario: (scenario: SimulationScenario) => void;
  setIsProfileModalOpen: (open: boolean) => void;
  setIsControlledSimModalOpen: (open: boolean) => void;
  injectControlledAnomaly: (params: ControlledSimulationParams) => void;
  resetControlledSimulation: () => void;
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
  const [stations, setStations] = useState<Station[]>(() => {
    try {
      const saved = localStorage.getItem('skyguard_stations');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DataAccessLayer.getStations();
  });
  
  const [anomalies, setAnomalies] = useState<AnomalyRecord[]>(() => {
    try {
      const saved = localStorage.getItem('skyguard_anomalies');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DataAccessLayer.getAnomalies();
  });
  
  const [selectedStationId, setSelectedStationId] = useState<string | null>('INI0000VIDD');
  const [selectedAnomalyId, setSelectedAnomalyId] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [currentScenario, setCurrentScenario] = useState<SimulationScenario>('TEMPERATURE_SPIKE');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [isLiveUpdating, setIsLiveUpdating] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isControlledSimModalOpen, setIsControlledSimModalOpen] = useState<boolean>(false);
  
  const [activeControlledSim, setActiveControlledSim] = useState<ActiveSimulationInfo | null>(() => {
    try {
      const saved = localStorage.getItem('skyguard_active_sim');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });
  
  const [preferredChartParam, setPreferredChartParam] = useState<ParameterType>('temperature');

  useEffect(() => {
    localStorage.setItem('skyguard_stations', JSON.stringify(stations));
  }, [stations]);

  useEffect(() => {
    localStorage.setItem('skyguard_anomalies', JSON.stringify(anomalies));
  }, [anomalies]);

  useEffect(() => {
    if (activeControlledSim) {
      localStorage.setItem('skyguard_active_sim', JSON.stringify(activeControlledSim));
    } else {
      localStorage.removeItem('skyguard_active_sim');
    }
  }, [activeControlledSim]);

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

  // Switch preset simulation scenario using DataAccessLayer
  const setScenario = async (scenario: SimulationScenario) => {
    setActiveControlledSim(null);
    setCurrentScenario(scenario);
    const result = await DataAccessLayer.simulateScenario(scenario);
    setStations(result.stations);
    setAnomalies(result.anomalies);
    setSelectedStationId(result.targetStationId);
    if (scenario === 'TEMPERATURE_SPIKE' || scenario === 'FROZEN_SENSOR') {
      setPreferredChartParam('temperature');
    } else if (scenario === 'SENSOR_DRIFT') {
      setPreferredChartParam('temperature');
    } else if (scenario === 'GENUINE_WEATHER_EVENT') {
      setPreferredChartParam('temperature');
    }
  };

  const resetControlledSimulation = async () => {
    setActiveControlledSim(null);
    await setScenario('NORMAL');
  };

  // Injects custom controlled anomaly from the modal
  const injectControlledAnomaly = async (params: ControlledSimulationParams) => {
    const targetStation = stations.find(s => s.id === params.stationId) || stations[0];
    const stationName = targetStation.name;

    const currentT = targetStation.currentReadings.temperature ?? 32.4;
    const currentRH = targetStation.currentReadings.humidity ?? 61.0;
    const currentP = targetStation.currentReadings.pressure ?? 997.8;

    let injectedNumericVal: number | null = null;
    let unit: string = '°C';

    if (params.parameter === 'temperature') {
      unit = '°C';
      if (params.anomalyType === 'spike') injectedNumericVal = 55.0;
      else if (params.anomalyType === 'drop') injectedNumericVal = 4.2;
      else if (params.anomalyType === 'drift') injectedNumericVal = currentT + 4.8;
      else if (params.anomalyType === 'missing') injectedNumericVal = null;
    } else if (params.parameter === 'humidity') {
      unit = '%';
      if (params.anomalyType === 'spike') injectedNumericVal = 99.5;
      else if (params.anomalyType === 'drop') injectedNumericVal = 12.0;
      else if (params.anomalyType === 'drift') injectedNumericVal = Math.min(100, currentRH + 14.0);
      else if (params.anomalyType === 'missing') injectedNumericVal = null;
    } else if (params.parameter === 'pressure') {
      unit = 'hPa';
      if (params.anomalyType === 'spike') injectedNumericVal = 1042.5;
      else if (params.anomalyType === 'drop') injectedNumericVal = 920.0;
      else if (params.anomalyType === 'drift') injectedNumericVal = currentP - 8.5;
      else if (params.anomalyType === 'missing') injectedNumericVal = null;
    }

    if (params.customInjectedValue !== undefined && params.customInjectedValue !== null && params.customInjectedValue !== '') {
      injectedNumericVal = Number(params.customInjectedValue);
    }

    const newReading = {
      temperature: params.parameter === 'temperature' ? injectedNumericVal : currentT,
      humidity: params.parameter === 'humidity' ? injectedNumericVal : currentRH,
      pressure: params.parameter === 'pressure' ? injectedNumericVal : currentP,
    };

    // CALL REAL ML API
    const analysis = await analyzeStationData(targetStation, stations, newReading, targetStation.history || []);
    
    const newAnomalyId = `ANM-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`;

    setStations(prev => {
      return prev.map(s => {
        if (s.id === params.stationId) {
          const updatedHistory = s.history ? [...s.history] : [];
          if (updatedHistory.length > 0) {
            const lastIdx = updatedHistory.length - 1;
            const lastPoint = updatedHistory[lastIdx];
            updatedHistory[lastIdx] = {
              ...lastPoint,
              temperature: newReading.temperature,
              humidity: newReading.humidity,
              pressure: newReading.pressure,
              isAnomaly: analysis.anomalyDetected,
              classification: analysis.classification,
              faultType: analysis.rootCause,
              anomalyType: analysis.anomalyType,
              is_injected: true,
              scenario_type: params.anomalyType,
              evidenceVector: analysis.evidenceVector,
            };
          }

          return {
            ...s,
            status: analysis.anomalyDetected ? (analysis.severity === 'critical' ? 'critical' : 'attention') : 'healthy',
            currentReadings: newReading,
            sensorTrust: analysis.sensorTrust || s.sensorTrust,
            degradation: analysis.degradation || s.degradation,
            history: updatedHistory,
            activeAnomalyId: analysis.anomalyDetected ? newAnomalyId : undefined,
          };
        }
        return s;
      });
    });

    if (analysis.anomalyDetected) {
      const newAnomalyRecord: AnomalyRecord = {
        id: newAnomalyId,
        stationId: params.stationId,
        stationName: stationName,
        state: targetStation.state,
        timestamp: 'Just now (Live Injection)',
        parameter: params.parameter as any,
        classification: analysis.classification,
        probabilities: analysis.probabilities,
        rootCause: analysis.rootCause,
        anomalyType: analysis.anomalyType || 'Anomaly Detected',
        severity: analysis.severity,
        confidence: analysis.confidence,
        status: 'Active',
        observedValue: injectedNumericVal !== null ? String(injectedNumericVal) : 'NULL',
        estimatedValue: newReading.temperature || 0,
        unit: unit,
        evidenceVector: analysis.evidenceVector,
        evidence: analysis.evidence,
        shapContributions: analysis.shapContributions,
        correction: analysis.correction,
        explanation: analysis.explanation,
        recommendedAction: analysis.recommendedAction,
        is_injected: true,
        scenario_type: params.anomalyType
      };
      setAnomalies(prev => [newAnomalyRecord, ...prev]);
    }
  };

  // Subtle live update simulation preserving exact GHCNh base records
  useEffect(() => {
    if (!isLiveUpdating) return;

    const interval = setInterval(() => {
      setStations(prev => {
        return prev.map(s => {
          // If custom simulation is active on this station, do not overwrite its injected reading
          if (activeControlledSim && s.id === activeControlledSim.stationId) {
            return s;
          }
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
  }, [isLiveUpdating, currentScenario, activeControlledSim]);

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
        isProfileModalOpen,
        isControlledSimModalOpen,
        activeControlledSim,
        preferredChartParam,
        setSearchQuery,
        setCurrentTab,
        setSelectedStationId,
        setSelectedAnomalyId,
        setPreferredChartParam,
        setScenario,
        setIsProfileModalOpen,
        setIsControlledSimModalOpen,
        injectControlledAnomaly,
        resetControlledSimulation,
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
