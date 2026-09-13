export type StationStatus = 'healthy' | 'attention' | 'critical';

export type ParameterType = 'temperature' | 'humidity' | 'pressure' | 'communication';

// Three-Way Classification from MODEL_DESIGN.md and DATA_SCHEMA.md
export type ThreeWayClassification = 'genuine_weather' | 'uncertain' | 'sensor_fault';

// Root Cause categories from DATA_SCHEMA.md section 5 & MODEL_DESIGN.md section 12
export type RootCauseType = 
  | 'spike'
  | 'frozen'
  | 'drift'
  | 'bias'
  | 'noise'
  | 'communication_failure'
  | 'calibration_error'
  | 'unknown'
  | 'none';

export type AnomalySeverity = 'critical' | 'warning' | 'info' | 'high' | 'medium' | 'low';

export type AnomalyStatus = 'Active' | 'Under Investigation' | 'Resolved' | 'False Positive';

// 11-Dimensional Evidence Vector as specified in DATA_SCHEMA.md & MODEL_DESIGN.md
export interface EvidenceVector {
  temporal: number;               // [0, 1] Deviation from recent temporal autoregression
  seasonal: number;               // [0, 1] Diurnal / seasonal envelope departure
  change: number;                 // [0, 1] Step rate-of-change magnitude
  multivariate: number;           // [0, 1] Mahalanobis T/P/RH psychrometric divergence
  spatial: number;                // [0, 1] Distance-weighted neighbor residual
  history: number;                // [0, 1] Sensor fault / missingness history score
  physics: number;                // [0, 1] Physics & lapse-rate plausibility check
  spatial_coherence: number;      // [0, 1] Agreement between spatial neighbors
  temporal_coherence: number;     // [0, 1] Consistency across consecutive periods
  multivariate_coherence: number; // [0, 1] Thermodynamic consistency (T drop + RH rise)
  persistence: number;            // [0, 1] Persistence of anomaly over multiple cycles
}

export interface ShapValueContribution {
  feature: keyof EvidenceVector | string;
  label: string;
  shapValue: number; // -1.0 to +1.0
  impact: 'increases_fault_risk' | 'supports_genuine' | 'neutral';
  description: string;
}

export interface SensorReading {
  temperature: number | null; // in °C
  humidity: number | null;    // in %
  pressure: number | null;    // in hPa
}

export interface SensorHealthBreakdown {
  temperature: number; // 0 to 100%
  humidity: number;
  pressure: number;
}

export interface SensorTrust {
  trust_score: number; // 0 to 100
  trend: 'improving' | 'stable' | 'declining';
  maintenance_status: 'normal' | 'watch' | 'investigate';
}

export interface DegradationRisk {
  degradation_risk: number; // 0.0 to 1.0
  status: 'normal' | 'watch' | 'maintenance_recommended';
  reason: string[];
}

export interface CorrectionPayload {
  raw_value: {
    temperature_c?: number | null;
    humidity_pct?: number | null;
    pressure_hpa?: number | null;
  };
  corrected_value: {
    temperature_c?: number | null;
    humidity_pct?: number | null;
    pressure_hpa?: number | null;
  };
  correction_confidence: number;
  correction_method: 'temporal_spatial_estimate' | 'multivariate_interpolation' | 'none';
  raw_preserved: boolean;
}

export interface ReadingPoint {
  timestamp: string;          // ISO format, e.g. "2023-08-28T14:30:00Z"
  timeLabel: string;          // e.g. "14:30" or "08-28 15:00"
  temperature: number | null;
  humidity: number | null;
  pressure: number | null;
  isAnomaly?: boolean;
  classification?: ThreeWayClassification;
  faultType?: RootCauseType;
  anomalyType?: string;
  flagNote?: string;
  estimatedTemp?: number | null;
  estimatedHumidity?: number | null;
  estimatedPressure?: number | null;
  is_injected?: boolean;
  scenario_type?: string | null;
  evidenceVector?: EvidenceVector;
}

export interface Station {
  id: string;                 // Official GHCNh ID e.g. 'INI0000VIDD'
  code: string;               // Short code e.g. 'VIDD'
  name: string;               // e.g. 'Delhi (Safdarjung)'
  state: string;              // e.g. 'Delhi NCR'
  district: string;
  region: 'North' | 'South' | 'East' | 'West' | 'Central' | 'North-East';
  lat: number;
  lng: number;
  elevation: number;          // in meters
  source: 'GHCNh' | 'IMD-AWS' | 'Prototype-Derived';
  datasetRows: number;        // e.g. 2952
  samplingInterval: string;   // e.g. '3 hours (03:00:00)'
  lastUpdated: string;
  status: StationStatus;
  currentReadings: SensorReading;
  sensorHealth: SensorHealthBreakdown;
  overallHealthScore: number; // 0 to 100%
  sensorTrust: SensorTrust;
  degradation: DegradationRisk;
  history: ReadingPoint[];
  nearbyStationIds: string[];
  activeAnomalyId?: string;
  installedDate: string;
  sensorModel: string;
  transmissionType: 'GPRS' | 'INSAT / Satellite' | 'LoRaWAN';
  missingRatePct: number;
  duplicateTimestampsCount: number;
  isPrimaryGhcnhStation: boolean;
}

export interface EvidenceIndicator {
  indicator: string;
  dimension: keyof EvidenceVector;
  score: 'HIGH' | 'MEDIUM' | 'LOW';
  value: number;
  detail: string;
  benchmark?: string;
}

export interface AnomalyRecord {
  id: string;
  stationId: string;
  stationName: string;
  state: string;
  timestamp: string;
  parameter: ParameterType;
  classification: ThreeWayClassification;
  probabilities: {
    genuine_weather: number;
    uncertain: number;
    sensor_fault: number;
  };
  rootCause: RootCauseType;
  anomalyType: string;
  severity: AnomalySeverity;
  confidence: number; // e.g. 92
  status: AnomalyStatus;
  observedValue: number | string;
  estimatedValue: number | string;
  unit: string;
  evidenceVector: EvidenceVector;
  evidence: EvidenceIndicator[];
  shapContributions: ShapValueContribution[];
  correction: CorrectionPayload;
  explanation: string;
  recommendedAction: string;
  is_injected: boolean;
  scenario_type: string | null;
  operatorNotes?: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export type SimulationScenario =
  | 'NORMAL'
  | 'TEMPERATURE_SPIKE'
  | 'SENSOR_DRIFT'
  | 'FROZEN_SENSOR'
  | 'SENSOR_BIAS'
  | 'SENSOR_NOISE'
  | 'MISSING_DATA'
  | 'GENUINE_WEATHER_EVENT';

export type ControlledAnomalyType = 'spike' | 'drop' | 'drift' | 'missing';

export interface ActiveSimulationInfo {
  stationId: string;
  stationName: string;
  parameter: ParameterType;
  anomalyType: ControlledAnomalyType;
  anomalyTitle: string;
  currentValue: number | string;
  injectedValue: number | string;
  expectedValue: number | string;
  unit: string;
  confidence: number;
  likelyCause: string;
  severity: AnomalySeverity;
  timestamp: string;
}

export interface ControlledSimulationParams {
  stationId: string;
  parameter: ParameterType;
  anomalyType: ControlledAnomalyType;
  customInjectedValue?: number | string | null;
}

export type NavigationTab =
  | 'dashboard'
  | 'stations'
  | 'anomalies'
  | 'analytics'
  | 'reports'
  | 'settings';

export interface StationReport {
  stationId: string;
  stationName: string;
  source: string;
  generatedAt: string;
  dateRange: string;
  totalRecords: number;
  overallScore: number;
  sensorHealth: SensorHealthBreakdown;
  sensorTrust: SensorTrust;
  degradation: DegradationRisk;
  anomaliesDetected: number;
  faultBreakdown: Record<string, number>;
  dataCompleteness: number;
  missingnessRate: number;
  duplicateTimestamps: number;
  maintenancePriority: 'Immediate' | 'Scheduled' | 'Optimal';
  recommendations: string[];
}

export interface DatasetValidationMetadata {
  totalRows: number;
  stationsCount: number;
  stationsList: {
    id: string;
    name: string;
    rows: number;
    lat: number;
    lng: number;
    elevation_m: number;
  }[];
  timeRange: {
    start: string;
    end: string;
  };
  samplingInterval: string;
  missingness: {
    parameter: string;
    missingCount: number;
    percentage: number;
  }[];
  duplicateTimestampsPerStation: number;
  parameterCoverage: {
    parameter: string;
    validCount: number;
    percentage: number;
  }[];
  targetClassDistribution: {
    normal: { count: number; percentage: number };
    sensor_data_anomaly: { count: number; percentage: number };
    likely_genuine_event: { count: number; percentage: number };
  };
  faultTypeDistribution: {
    none: { count: number; percentage: number };
    drift: { count: number; percentage: number };
    frozen: { count: number; percentage: number };
    bias: { count: number; percentage: number };
    noise: { count: number; percentage: number };
    communication_failure: { count: number; percentage: number };
    spike: { count: number; percentage: number };
  };
}

export interface UserProfile {
  name: string;
  role: string;
  badge: string;
  email: string;
  phone: string;
  organization: string;
  division: string;
  regionalCenter: string;
  shift: string;
  alertEmailEnabled: boolean;
  alertSmsEnabled: boolean;
  soundAlertsEnabled: boolean;
  bio?: string;
}
