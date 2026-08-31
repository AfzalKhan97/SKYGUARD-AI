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
  const [isControlledSimModalOpen, setIsControlledSimModalOpen] = useState<boolean>(false);
  const [activeControlledSim, setActiveControlledSim] = useState<ActiveSimulationInfo | null>(null);
  const [preferredChartParam, setPreferredChartParam] = useState<ParameterType>('temperature');

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
  const setScenario = (scenario: SimulationScenario) => {
    setActiveControlledSim(null);
    setCurrentScenario(scenario);
    const result = DataAccessLayer.simulateScenario(scenario);
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

  // Injects custom controlled anomaly from the modal
  const injectControlledAnomaly = (params: ControlledSimulationParams) => {
    const targetStation = stations.find(s => s.id === params.stationId) || stations[0];
    const stationName = targetStation.name;

    const currentT = targetStation.currentReadings.temperature ?? 32.4;
    const currentRH = targetStation.currentReadings.humidity ?? 61.0;
    const currentP = targetStation.currentReadings.pressure ?? 997.8;

    let injectedNumericVal: number | null = null;
    let injectedDisplayVal: string = '';
    let currentDisplayVal: string = '';
    let expectedDisplayVal: string = '';
    let unit: string = '°C';
    let anomalyTitle = '';
    let severity: AnomalySeverity = 'critical';
    let rootCause: RootCauseType = 'spike';
    let confidence = 90;
    let likelyCause = '';
    let explanation = '';
    let flagNote = '';

    if (params.parameter === 'temperature') {
      unit = '°C';
      currentDisplayVal = `${currentT}°C`;
      expectedDisplayVal = `${currentT}°C`;

      if (params.anomalyType === 'spike') {
        injectedNumericVal = params.customInjectedValue !== undefined && params.customInjectedValue !== null && params.customInjectedValue !== ''
          ? Number(params.customInjectedValue)
          : 55.0;
        injectedDisplayVal = `${injectedNumericVal}°C`;
        anomalyTitle = '🔴 Temperature Spike Detected';
        severity = 'critical';
        rootCause = 'spike';
        confidence = 90;
        likelyCause = 'Sudden sensor spike / hardware fault (ADC saturation)';
        flagNote = `Instantaneous step change from ${currentT}°C to ${injectedNumericVal}°C (+${(injectedNumericVal - currentT).toFixed(1)}°C) exceeds physical rate limit (+6.0°C/hr).`;
        explanation = `Sudden sensor spike / hardware fault: Physical step rate-of-change +${(injectedNumericVal - currentT).toFixed(1)}°C exceeds maximum allowable atmospheric gradient. Spatial neighbors confirm normal range (32-34°C).`;
      } else if (params.anomalyType === 'drop') {
        injectedNumericVal = params.customInjectedValue !== undefined && params.customInjectedValue !== null && params.customInjectedValue !== ''
          ? Number(params.customInjectedValue)
          : 4.2;
        injectedDisplayVal = `${injectedNumericVal}°C`;
        anomalyTitle = '🔴 Temperature Plunge Fault Detected';
        severity = 'critical';
        rootCause = 'spike';
        confidence = 93;
        likelyCause = 'Sudden sensor drop / probe ground fault';
        flagNote = `Instantaneous plunge of ${(currentT - injectedNumericVal).toFixed(1)}°C to ${injectedNumericVal}°C uncorroborated by regional cold pool dynamics.`;
        explanation = `Sudden sensor drop / probe ground fault: Extreme thermal drop violating psychrometric vapor equilibrium.`;
      } else if (params.anomalyType === 'drift') {
        injectedNumericVal = params.customInjectedValue !== undefined && params.customInjectedValue !== null && params.customInjectedValue !== ''
          ? Number(params.customInjectedValue)
          : Number((currentT + 4.8).toFixed(1));
        injectedDisplayVal = `${injectedNumericVal}°C`;
        anomalyTitle = '🟡 Temperature Sensor Drift Detected';
        severity = 'warning';
        rootCause = 'drift';
        confidence = 88;
        likelyCause = 'Sensor calibration drift / radiation shield degradation';
        flagNote = `Expanding positive thermal bias (+${(injectedNumericVal - currentT).toFixed(1)}°C) detected across consecutive diurnal cycles relative to cluster.`;
        explanation = `Calibration drift: Radiation shield aging and thermal sensor calibration offset expanding over consecutive diurnal cycles.`;
      } else if (params.anomalyType === 'missing') {
        injectedNumericVal = null;
        injectedDisplayVal = 'NULL / Dropout';
        anomalyTitle = '🔴 Telemetry Missing / Packet Dropout';
        severity = 'critical';
        rootCause = 'communication_failure';
        confidence = 98;
        likelyCause = 'Communication failure / packet dropout / power loss';
        flagNote = 'Scheduled DCP 3-hour transmission window timed out with 0 bytes received from sensor ADC.';
        explanation = 'Communication failure: Sensor telemetry bus timed out / packet dropout across scheduled observation interval.';
      }
    } else if (params.parameter === 'humidity') {
      unit = '%';
      currentDisplayVal = `${currentRH}%`;
      expectedDisplayVal = `${currentRH}%`;

      if (params.anomalyType === 'spike') {
        injectedNumericVal = params.customInjectedValue !== undefined && params.customInjectedValue !== null && params.customInjectedValue !== ''
          ? Number(params.customInjectedValue)
          : 99.5;
        injectedDisplayVal = `${injectedNumericVal}%`;
        anomalyTitle = '🔴 Humidity Spike Fault Detected';
        severity = 'critical';
        rootCause = 'spike';
        confidence = 91;
        likelyCause = 'Capacitive polymer condensation lock-up / short circuit';
        flagNote = `Instantaneous RH jump from ${currentRH}% to ${injectedNumericVal}% with zero precipitation and clear skies across neighboring stations.`;
        explanation = `Humidity transducer spike: Capacitive sensor short-circuit or condensation lock-up without corroborating precipitation telemetry.`;
      } else if (params.anomalyType === 'drop') {
        injectedNumericVal = params.customInjectedValue !== undefined && params.customInjectedValue !== null && params.customInjectedValue !== ''
          ? Number(params.customInjectedValue)
          : 12.0;
        injectedDisplayVal = `${injectedNumericVal}%`;
        anomalyTitle = '🔴 Humidity Dropout Fault Detected';
        severity = 'critical';
        rootCause = 'spike';
        confidence = 89;
        likelyCause = 'Hygrometer open-circuit / transducer dislocation';
        flagNote = `Extreme unphysical dry-air dropout to ${injectedNumericVal}% violating psychrometric vapor pressure constraints.`;
        explanation = `Hygrometer open-circuit: Transducer disconnected or bridge voltage collapsed.`;
      } else if (params.anomalyType === 'drift') {
        injectedNumericVal = params.customInjectedValue !== undefined && params.customInjectedValue !== null && params.customInjectedValue !== ''
          ? Number(params.customInjectedValue)
          : Math.min(100, Number((currentRH + 14.0).toFixed(1)));
        injectedDisplayVal = `${injectedNumericVal}%`;
        anomalyTitle = '🟡 Humidity Sensor Drift Detected';
        severity = 'warning';
        rootCause = 'drift';
        confidence = 86;
        likelyCause = 'Hygrometer polymer aging / recalibration required';
        flagNote = `Systematic humidity upward bias (+${(injectedNumericVal - currentRH).toFixed(1)}%) persisting during daytime solar minimum RH window.`;
        explanation = `Hygrometer polymer aging: Sensor requires recalibration; systematic offset detected.`;
      } else if (params.anomalyType === 'missing') {
        injectedNumericVal = null;
        injectedDisplayVal = 'NULL / Dropout';
        anomalyTitle = '🔴 Humidity Telemetry Missing';
        severity = 'critical';
        rootCause = 'communication_failure';
        confidence = 98;
        likelyCause = 'Hygrometer channel communication timeout';
        flagNote = 'Null reading received on relative humidity sensor telemetry bus.';
        explanation = 'Missing telemetry packet on relative humidity sensor channel.';
      }
    } else if (params.parameter === 'pressure') {
      unit = 'hPa';
      currentDisplayVal = `${currentP} hPa`;
      expectedDisplayVal = `${currentP} hPa`;

      if (params.anomalyType === 'spike') {
        injectedNumericVal = params.customInjectedValue !== undefined && params.customInjectedValue !== null && params.customInjectedValue !== ''
          ? Number(params.customInjectedValue)
          : 1042.5;
        injectedDisplayVal = `${injectedNumericVal} hPa`;
        anomalyTitle = '🔴 Pressure Spike Fault Detected';
        severity = 'critical';
        rootCause = 'spike';
        confidence = 94;
        likelyCause = 'Piezoresistive pressure transducer overload / reference port blocked';
        flagNote = `Barometric jump from ${currentP} hPa to ${injectedNumericVal} hPa exceeds highest recorded atmospheric pressure differential.`;
        explanation = `Pressure transducer overload: Piezoresistive bridge saturation or static port blocked by debris.`;
      } else if (params.anomalyType === 'drop') {
        injectedNumericVal = params.customInjectedValue !== undefined && params.customInjectedValue !== null && params.customInjectedValue !== ''
          ? Number(params.customInjectedValue)
          : 920.0;
        injectedDisplayVal = `${injectedNumericVal} hPa`;
        anomalyTitle = '🔴 Pressure Plunge Fault Detected';
        severity = 'critical';
        rootCause = 'spike';
        confidence = 96;
        likelyCause = 'Barometer diaphragm leakage / ADC reference fault';
        flagNote = `Pressure reading ${injectedNumericVal} hPa would correspond to Category 5 cyclone eye, impossible in current synoptic field.`;
        explanation = `Barometer diaphragm leakage: ADC voltage reference dropped; reading physically implausible.`;
      } else if (params.anomalyType === 'drift') {
        injectedNumericVal = params.customInjectedValue !== undefined && params.customInjectedValue !== null && params.customInjectedValue !== ''
          ? Number(params.customInjectedValue)
          : Number((currentP + 7.2).toFixed(1));
        injectedDisplayVal = `${injectedNumericVal} hPa`;
        anomalyTitle = '🟡 Barometric Pressure Drift Detected';
        severity = 'warning';
        rootCause = 'drift';
        confidence = 87;
        likelyCause = 'Barometric transducer zero-point drift';
        flagNote = `Systematic offset (+${(injectedNumericVal - currentP).toFixed(1)} hPa) from hydrostatic pressure equilibrium and regional tendencies.`;
        explanation = `Barometric zero-point drift: Transducer offset accumulated over operational lifecycle.`;
      } else if (params.anomalyType === 'missing') {
        injectedNumericVal = null;
        injectedDisplayVal = 'NULL / Dropout';
        anomalyTitle = '🔴 Barometer Telemetry Missing';
        severity = 'critical';
        rootCause = 'communication_failure';
        confidence = 98;
        likelyCause = 'Barometer serial bus bus-off / timeout';
        flagNote = 'Null reading received on pressure transducer telemetry port.';
        explanation = 'Missing telemetry packet on barometric pressure transducer.';
      }
    }

    const newAnomalyId = `SIM-INJ-${Date.now()}`;
    const stationStatus = severity === 'critical' ? 'critical' : 'attention';

    // Update target station in stations array
    setStations(prev => {
      return prev.map(s => {
        if (s.id === params.stationId) {
          const updatedReadings = {
            ...s.currentReadings,
            temperature: params.parameter === 'temperature' ? injectedNumericVal : s.currentReadings.temperature,
            humidity: params.parameter === 'humidity' ? injectedNumericVal : s.currentReadings.humidity,
            pressure: params.parameter === 'pressure' ? injectedNumericVal : s.currentReadings.pressure,
          };

          const updatedSensorHealth = {
            temperature: params.parameter === 'temperature' ? (severity === 'critical' ? 20 : 65) : s.sensorHealth.temperature,
            humidity: params.parameter === 'humidity' ? (severity === 'critical' ? 22 : 68) : s.sensorHealth.humidity,
            pressure: params.parameter === 'pressure' ? (severity === 'critical' ? 25 : 70) : s.sensorHealth.pressure,
          };

          const overallHealthScore = severity === 'critical' ? 38 : 68;

          // Update history with the anomalous point at the end
          const updatedHistory = s.history ? [...s.history] : [];
          if (updatedHistory.length > 0) {
            const lastIdx = updatedHistory.length - 1;
            const lastPoint = updatedHistory[lastIdx];
            updatedHistory[lastIdx] = {
              ...lastPoint,
              temperature: params.parameter === 'temperature' ? injectedNumericVal : lastPoint.temperature,
              humidity: params.parameter === 'humidity' ? injectedNumericVal : lastPoint.humidity,
              pressure: params.parameter === 'pressure' ? injectedNumericVal : lastPoint.pressure,
              isAnomaly: true,
              classification: 'sensor_fault',
              faultType: rootCause,
              anomalyType: anomalyTitle.replace(/^[🔴🟡🟢]\s*/, ''),
              flagNote: flagNote,
              estimatedTemp: params.parameter === 'temperature' ? currentT : (lastPoint.estimatedTemp ?? currentT),
              estimatedHumidity: params.parameter === 'humidity' ? currentRH : (lastPoint.estimatedHumidity ?? currentRH),
              estimatedPressure: params.parameter === 'pressure' ? currentP : (lastPoint.estimatedPressure ?? currentP),
              is_injected: true,
              scenario_type: params.anomalyType,
              evidenceVector: createEvidenceVector({
                temporal: 0.94,
                seasonal: 0.45,
                change: params.anomalyType === 'missing' ? 0.0 : 0.96,
                multivariate: 0.88,
                spatial: 0.91,
                history: 0.65,
                physics: 0.08,
                spatial_coherence: 0.12,
                temporal_coherence: 0.10,
                multivariate_coherence: 0.15,
                persistence: params.anomalyType === 'drift' ? 0.85 : 0.40,
              }),
            };
          }

          return {
            ...s,
            status: stationStatus,
            currentReadings: updatedReadings,
            overallHealthScore,
            sensorHealth: updatedSensorHealth,
            sensorTrust: {
              trust_score: severity === 'critical' ? 42.0 : 70.0,
              trend: 'declining',
              maintenance_status: severity === 'critical' ? 'investigate' : 'watch',
            },
            degradation: {
              degradation_risk: severity === 'critical' ? 0.88 : 0.45,
              status: severity === 'critical' ? 'maintenance_recommended' : 'watch',
              reason: [params.anomalyType, 'synthetic_anomaly_injection'],
            },
            history: updatedHistory,
            activeAnomalyId: newAnomalyId,
          };
        }
        return s;
      });
    });

    // Create New Anomaly Record and prepend to anomalies list
    const newAnomalyRecord: AnomalyRecord = {
      id: newAnomalyId,
      stationId: params.stationId,
      stationName: stationName,
      state: targetStation.state,
      timestamp: 'Just now (Live Injection)',
      parameter: params.parameter,
      classification: 'sensor_fault',
      probabilities: {
        genuine_weather: 0.02,
        uncertain: 0.08,
        sensor_fault: 0.90,
      },
      rootCause: rootCause,
      anomalyType: anomalyTitle.replace(/^[🔴🟡🟢]\s*/, ''),
      severity: severity,
      confidence: confidence,
      status: 'Active',
      observedValue: injectedNumericVal !== null ? `${injectedNumericVal}` : 'NULL / Dropout',
      estimatedValue: params.parameter === 'temperature' ? currentT : (params.parameter === 'humidity' ? currentRH : currentP),
      unit: unit,
      evidenceVector: createEvidenceVector({
        temporal: 0.94,
        seasonal: 0.45,
        change: params.anomalyType === 'missing' ? 0.0 : 0.96,
        multivariate: 0.88,
        spatial: 0.91,
        history: 0.65,
        physics: 0.08,
        spatial_coherence: 0.12,
        temporal_coherence: 0.10,
        multivariate_coherence: 0.15,
        persistence: params.anomalyType === 'drift' ? 0.85 : 0.40,
      }),
      evidence: [
        {
          indicator: 'Physical Step Rate Violation',
          dimension: 'change',
          score: 'HIGH',
          value: 0.96,
          detail: `Step delta exceeds physical atmospheric limits (${expectedDisplayVal} → ${injectedDisplayVal})`,
          benchmark: 'Max allowable: 6.0°C/hr',
        },
        {
          indicator: 'Spatial Neighbor Cluster Residual',
          dimension: 'spatial',
          score: 'HIGH',
          value: 0.91,
          detail: `Adjacent stations in regional network confirm nominal baseline readings`,
          benchmark: 'ΔResidual: High',
        },
        {
          indicator: 'Multivariate Psychrometric Consistency',
          dimension: 'multivariate',
          score: 'HIGH',
          value: 0.88,
          detail: 'Thermodynamic cross-channel balance failed (vapor pressure & temperature mismatch)',
          benchmark: 'Physical Invariance: Failed',
        },
      ],
      shapContributions: [
        {
          feature: 'change',
          label: 'Step Rate of Change (0.96)',
          shapValue: 0.54,
          impact: 'increases_fault_risk',
          description: 'Instantaneous step jump contributed +54% to fault classification.',
        },
        {
          feature: 'spatial',
          label: 'Spatial Neighbor Residual (0.91)',
          shapValue: 0.36,
          impact: 'increases_fault_risk',
          description: 'Lack of corroborating shift in regional AWS network contributed +36%.',
        },
      ],
      correction: {
        raw_value: {
          temperature_c: params.parameter === 'temperature' ? injectedNumericVal : currentT,
          humidity_pct: params.parameter === 'humidity' ? injectedNumericVal : currentRH,
          pressure_hpa: params.parameter === 'pressure' ? injectedNumericVal : currentP,
        },
        corrected_value: {
          temperature_c: currentT,
          humidity_pct: currentRH,
          pressure_hpa: currentP,
        },
        correction_confidence: 0.92,
        correction_method: 'temporal_spatial_estimate',
        raw_preserved: true,
      },
      explanation: explanation,
      recommendedAction: 'Automated QC isolation applied. Data flag set to REJECT. Dispatched remote ADC calibration / diagnostic cycle.',
      is_injected: true,
      scenario_type: params.anomalyType,
    };

    setAnomalies(prev => [newAnomalyRecord, ...prev]);
    setSelectedStationId(params.stationId);
    setSelectedAnomalyId(newAnomalyId);
    setPreferredChartParam(params.parameter);

    setActiveControlledSim({
      stationId: params.stationId,
      stationName: stationName,
      parameter: params.parameter,
      anomalyType: params.anomalyType,
      anomalyTitle: anomalyTitle,
      currentValue: currentDisplayVal,
      injectedValue: injectedDisplayVal,
      expectedValue: expectedDisplayVal,
      unit: unit,
      confidence: confidence,
      likelyCause: likelyCause,
      severity: severity,
      timestamp: 'Just now',
    });

    setIsControlledSimModalOpen(false);
  };

  // Reset simulation back to base scenario state
  const resetControlledSimulation = () => {
    setActiveControlledSim(null);
    const result = DataAccessLayer.simulateScenario(currentScenario);
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
