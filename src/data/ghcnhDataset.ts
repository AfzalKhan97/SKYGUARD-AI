import { 
  Station, 
  AnomalyRecord, 
  ReadingPoint, 
  DatasetValidationMetadata,
  EvidenceVector,
  ThreeWayClassification,
  RootCauseType
} from '../types';

/**
 * SkyGuard AI — Source Dataset Validation Metadata
 * Sourced directly from dataset_validation_report.md (GHCNh 2023 3-Station Benchmark)
 */
export const DATASET_VALIDATION_REPORT: DatasetValidationMetadata = {
  totalRows: 8929,
  stationsCount: 3,
  stationsList: [
    { id: 'INI0000VIDD', name: 'Delhi (Safdarjung)', rows: 2952, lat: 28.5843, lng: 77.2065, elevation_m: 216 },
    { id: 'INI0000VIJO', name: 'Jodhpur (Airport)', rows: 3000, lat: 26.2514, lng: 73.0489, elevation_m: 224 },
    { id: 'INM00042111', name: 'Dehradun', rows: 2977, lat: 30.3256, lng: 78.0344, elevation_m: 682 }
  ],
  timeRange: {
    start: '2023-01-01 00:00:00',
    end: '2023-12-31 21:00:00'
  },
  samplingInterval: '3 hours (03:00:00)',
  missingness: [
    { parameter: 'latitude', missingCount: 240, percentage: 2.69 },
    { parameter: 'longitude', missingCount: 240, percentage: 2.69 },
    { parameter: 'elevation_m', missingCount: 240, percentage: 2.69 },
    { parameter: 'temperature_c', missingCount: 253, percentage: 2.83 },
    { parameter: 'pressure_hpa', missingCount: 253, percentage: 2.83 },
    { parameter: 'relative_humidity_pct', missingCount: 253, percentage: 2.83 }
  ],
  duplicateTimestampsPerStation: 169,
  parameterCoverage: [
    { parameter: 'temperature_c', validCount: 8676, percentage: 97.17 },
    { parameter: 'pressure_hpa', validCount: 8676, percentage: 97.17 },
    { parameter: 'relative_humidity_pct', validCount: 8676, percentage: 97.17 }
  ],
  targetClassDistribution: {
    normal: { count: 8760, percentage: 98.11 },
    sensor_data_anomaly: { count: 121, percentage: 1.36 },
    likely_genuine_event: { count: 48, percentage: 0.54 }
  },
  faultTypeDistribution: {
    none: { count: 8808, percentage: 98.64 },
    drift: { count: 48, percentage: 0.54 },
    frozen: { count: 24, percentage: 0.27 },
    bias: { count: 16, percentage: 0.18 },
    noise: { count: 16, percentage: 0.18 },
    communication_failure: { count: 16, percentage: 0.18 },
    spike: { count: 1, percentage: 0.01 }
  }
};

/**
 * Standard 11-Dimensional Evidence Vector Generator for observations
 */
export function createEvidenceVector(overrides: Partial<EvidenceVector> = {}): EvidenceVector {
  return {
    temporal: 0.12,
    seasonal: 0.15,
    change: 0.08,
    multivariate: 0.10,
    spatial: 0.14,
    history: 0.05,
    physics: 0.04,
    spatial_coherence: 0.92,
    temporal_coherence: 0.89,
    multivariate_coherence: 0.94,
    persistence: 0.08,
    ...overrides
  };
}

/**
 * Generates calibrated 3-hour interval sequences matching GHCNh 2023 observations
 */
function generateGhcnhSequence(
  stationId: string,
  baseDate: string,
  baseT: number,
  baseRH: number,
  baseP: number,
  anomalyScenario?: {
    type: RootCauseType;
    classification: ThreeWayClassification;
    param: 'temperature' | 'humidity' | 'pressure' | 'communication';
    injected: boolean;
  }
): ReadingPoint[] {
  const points: ReadingPoint[] = [];
  // Standard 3-hourly observation cycle (8 points per 24 hours)
  const times = ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'];

  times.forEach((tLabel, idx) => {
    // Atmospheric Diurnal Cycle Simulation
    // Peak temperature at 15:00, lowest at 06:00
    const diurnalCurve = Math.sin(((idx - 2) / 8) * Math.PI);
    const diurnalT = diurnalCurve * 5.8;
    const diurnalRH = -diurnalCurve * 18.0;
    const diurnalP = -Math.cos(((idx - 2) / 8) * Math.PI) * 2.1;

    let t: number | null = Number((baseT + diurnalT).toFixed(1));
    let rh: number | null = Math.min(98, Math.max(15, Number((baseRH + diurnalRH).toFixed(0))));
    let p: number | null = Number((baseP + diurnalP).toFixed(1));

    let isAnomaly = false;
    let classification: ThreeWayClassification = 'genuine_weather';
    let faultType: RootCauseType = 'none';
    let flagNote: string | undefined = undefined;
    let anomalyTypeLabel: string | undefined = undefined;
    let estimatedT: number | null = null;
    let estimatedRH: number | null = null;
    let estimatedP: number | null = null;
    let evVector = createEvidenceVector();
    let is_injected = false;
    let scenario_type: string | null = null;

    // Apply specific anomaly condition at final active step if specified
    if (idx === times.length - 1 && anomalyScenario) {
      is_injected = anomalyScenario.injected;
      scenario_type = anomalyScenario.type;
      isAnomaly = true;
      classification = anomalyScenario.classification;
      faultType = anomalyScenario.type;

      if (anomalyScenario.type === 'spike') {
        t = 55.0; // Exact spike test payload from DATA_SCHEMA.md
        estimatedT = 32.4;
        anomalyTypeLabel = 'Sensor Spike (Transient)';
        flagNote = 'Instantaneous +22.6°C jump (55.0°C) with zero psychrometric humidity response';
        evVector = createEvidenceVector({
          temporal: 0.81,
          seasonal: 0.64,
          change: 0.91,
          multivariate: 0.72,
          spatial: 0.88,
          history: 0.41,
          physics: 0.30,
          spatial_coherence: 0.10,
          temporal_coherence: 0.22,
          multivariate_coherence: 0.35,
          persistence: 0.12
        });
      } else if (anomalyScenario.type === 'drift') {
        t = Number((baseT + diurnalT + 4.8).toFixed(1));
        estimatedT = Number((baseT + diurnalT).toFixed(1));
        anomalyTypeLabel = 'Sensor Drift (Positive Departure)';
        flagNote = 'Gradual +4.8°C systematic bias diverging against Jodhpur & Dehradun spatial reference';
        evVector = createEvidenceVector({
          temporal: 0.68,
          seasonal: 0.42,
          change: 0.35,
          multivariate: 0.62,
          spatial: 0.79,
          history: 0.58,
          physics: 0.20,
          spatial_coherence: 0.25,
          temporal_coherence: 0.78,
          multivariate_coherence: 0.45,
          persistence: 0.82
        });
      } else if (anomalyScenario.type === 'frozen') {
        t = 28.5; // Locked across solar peak
        estimatedT = Number((baseT + diurnalT).toFixed(1));
        anomalyTypeLabel = 'Frozen / Stuck Transducer';
        flagNote = 'Temperature reading flatlined at 28.5°C across 3 consecutive 3-hour sample cycles';
        evVector = createEvidenceVector({
          temporal: 0.72,
          seasonal: 0.55,
          change: 0.01,
          multivariate: 0.65,
          spatial: 0.71,
          history: 0.60,
          physics: 0.15,
          spatial_coherence: 0.30,
          temporal_coherence: 0.12,
          multivariate_coherence: 0.28,
          persistence: 0.90
        });
      } else if (anomalyScenario.type === 'bias') {
        t = Number((baseT + diurnalT + 3.8).toFixed(1));
        estimatedT = Number((baseT + diurnalT).toFixed(1));
        anomalyTypeLabel = 'Sensor Bias (Constant Offset)';
        flagNote = 'Constant +3.8°C positive offset detected on RTD bridge circuit';
        evVector = createEvidenceVector({
          temporal: 0.55,
          seasonal: 0.38,
          change: 0.12,
          multivariate: 0.58,
          spatial: 0.74,
          history: 0.45,
          physics: 0.18,
          spatial_coherence: 0.28,
          temporal_coherence: 0.82,
          multivariate_coherence: 0.50,
          persistence: 0.85
        });
      } else if (anomalyScenario.type === 'noise') {
        t = Number((baseT + diurnalT + (Math.random() > 0.5 ? 4.2 : -3.9)).toFixed(1));
        estimatedT = Number((baseT + diurnalT).toFixed(1));
        anomalyTypeLabel = 'Noise / Erratic Sensor Jitter';
        flagNote = 'High-frequency stochastic fluctuations exceeding physical variance envelope';
        evVector = createEvidenceVector({
          temporal: 0.76,
          seasonal: 0.45,
          change: 0.84,
          multivariate: 0.69,
          spatial: 0.68,
          history: 0.52,
          physics: 0.28,
          spatial_coherence: 0.32,
          temporal_coherence: 0.15,
          multivariate_coherence: 0.38,
          persistence: 0.40
        });
      } else if (anomalyScenario.type === 'communication_failure') {
        t = null;
        rh = null;
        p = null;
        estimatedT = Number((baseT + diurnalT).toFixed(1));
        estimatedRH = baseRH;
        estimatedP = baseP;
        anomalyTypeLabel = 'Communication Failure (Packet Drop)';
        flagNote = 'Null payload packet / DCP telemetry buffer timeout across 3-hour scheduled window';
        evVector = createEvidenceVector({
          temporal: 0.90,
          seasonal: 0.10,
          change: 0.00,
          multivariate: 0.00,
          spatial: 0.00,
          history: 0.75,
          physics: 0.00,
          spatial_coherence: 0.00,
          temporal_coherence: 0.00,
          multivariate_coherence: 0.00,
          persistence: 0.70
        });
      } else if (anomalyScenario.type === 'none' && anomalyScenario.classification === 'genuine_weather') {
        // Genuine Meteorological Kalbaishakhi / Monsoon Squall Event
        t = 22.8;
        rh = 96;
        p = Number((baseP - 3.4).toFixed(1));
        anomalyTypeLabel = 'Genuine Weather Event (Monsoon Squall)';
        flagNote = 'Convective cold pool downdraft: -9.2°C drop with +32% RH surge and barometric micro-transient';
        evVector = createEvidenceVector({
          temporal: 0.79,
          seasonal: 0.52,
          change: 0.82,
          multivariate: 0.18, // High physical multivariate consistency (cold downdraft = high RH)
          spatial: 0.34,     // Spatial front corroborated
          history: 0.08,
          physics: 0.88,     // Strongly physically compliant
          spatial_coherence: 0.85,
          temporal_coherence: 0.74,
          multivariate_coherence: 0.96, // Near-perfect thermodynamic alignment!
          persistence: 0.45
        });
      }
    }

    points.push({
      timestamp: `${baseDate}T${tLabel}:00Z`,
      timeLabel: tLabel,
      temperature: t,
      humidity: rh,
      pressure: p,
      isAnomaly,
      classification,
      faultType,
      anomalyType: anomalyTypeLabel,
      flagNote,
      estimatedTemp: estimatedT,
      estimatedHumidity: estimatedRH,
      estimatedPressure: estimatedP,
      is_injected,
      scenario_type,
      evidenceVector: evVector
    });
  });

  return points;
}

/**
 * Real Stations from GHCNh 2023 Dataset (dataset_validation_report.md)
 * + Contextual regional reference stations for spatial cross-validation
 */
export const GHCNH_STATIONS: Station[] = [
  {
    id: 'INI0000VIDD',
    code: 'VIDD',
    name: 'Delhi (Safdarjung)',
    state: 'Delhi NCR',
    district: 'New Delhi',
    region: 'North',
    lat: 28.5843,
    lng: 77.2065,
    elevation: 216,
    source: 'GHCNh',
    datasetRows: 2952,
    samplingInterval: '3 hours (03:00:00)',
    lastUpdated: '14:30:00Z (Scheduled)',
    status: 'critical',
    currentReadings: {
      temperature: 55.0, // Injected / Active Spike from DATA_SCHEMA.md
      humidity: 61.0,
      pressure: 997.8,
    },
    sensorHealth: {
      temperature: 42,
      humidity: 98,
      pressure: 97,
    },
    overallHealthScore: 48,
    sensorTrust: {
      trust_score: 54.0,
      trend: 'declining',
      maintenance_status: 'investigate',
    },
    degradation: {
      degradation_risk: 0.78,
      status: 'maintenance_recommended',
      reason: ['declining_trust', 'persistent_drift_evidence', 'repeated_anomalies'],
    },
    history: generateGhcnhSequence(
      'INI0000VIDD',
      '2023-08-28',
      32.4,
      61.0,
      997.8,
      { type: 'spike', classification: 'sensor_fault', param: 'temperature', injected: true }
    ),
    nearbyStationIds: ['INI0000VIJO', 'INM00042111', 'AWS-NCR-01'],
    activeAnomalyId: 'ANOM-GHCNH-VIDD-01',
    installedDate: '2021-01-15',
    sensorModel: 'Vaisala HMP155 / PT100 Class A (GHCNh Verified)',
    transmissionType: 'GPRS',
    missingRatePct: 2.83,
    duplicateTimestampsCount: 56,
    isPrimaryGhcnhStation: true,
  },
  {
    id: 'INI0000VIJO',
    code: 'VIJO',
    name: 'Jodhpur (Airport)',
    state: 'Rajasthan',
    district: 'Jodhpur',
    region: 'West',
    lat: 26.2514,
    lng: 73.0489,
    elevation: 224,
    source: 'GHCNh',
    datasetRows: 3000,
    samplingInterval: '3 hours (03:00:00)',
    lastUpdated: '14:30:00Z (Scheduled)',
    status: 'attention',
    currentReadings: {
      temperature: 38.6,
      humidity: 34.0,
      pressure: 995.2,
    },
    sensorHealth: {
      temperature: 72,
      humidity: 95,
      pressure: 96,
    },
    overallHealthScore: 74,
    sensorTrust: {
      trust_score: 71.5,
      trend: 'declining',
      maintenance_status: 'watch',
    },
    degradation: {
      degradation_risk: 0.45,
      status: 'watch',
      reason: ['persistent_drift_evidence', 'thermal_radiation_shield_aging'],
    },
    history: generateGhcnhSequence(
      'INI0000VIJO',
      '2023-08-28',
      33.8,
      34.0,
      995.2,
      { type: 'drift', classification: 'sensor_fault', param: 'temperature', injected: true }
    ),
    nearbyStationIds: ['INI0000VIDD', 'AWS-RAJ-02'],
    activeAnomalyId: 'ANOM-GHCNH-VIJO-02',
    installedDate: '2020-08-10',
    sensorModel: 'Rotronic HC2A-S3 High Precision / PT100',
    transmissionType: 'INSAT / Satellite',
    missingRatePct: 2.83,
    duplicateTimestampsCount: 62,
    isPrimaryGhcnhStation: true,
  },
  {
    id: 'INM00042111',
    code: '42111',
    name: 'Dehradun',
    state: 'Uttarakhand',
    district: 'Dehradun',
    region: 'North',
    lat: 30.3256,
    lng: 78.0344,
    elevation: 682,
    source: 'GHCNh',
    datasetRows: 2977,
    samplingInterval: '3 hours (03:00:00)',
    lastUpdated: '14:30:00Z (Scheduled)',
    status: 'healthy',
    currentReadings: {
      temperature: 24.2,
      humidity: 88.0,
      pressure: 938.4, // Pressure adjusted for elevation 682m
    },
    sensorHealth: {
      temperature: 98,
      humidity: 97,
      pressure: 99,
    },
    overallHealthScore: 98,
    sensorTrust: {
      trust_score: 96.0,
      trend: 'stable',
      maintenance_status: 'normal',
    },
    degradation: {
      degradation_risk: 0.12,
      status: 'normal',
      reason: [],
    },
    history: generateGhcnhSequence(
      'INM00042111',
      '2023-08-28',
      24.2,
      88.0,
      938.4
    ),
    nearbyStationIds: ['INI0000VIDD', 'AWS-UTK-01'],
    installedDate: '2022-04-18',
    sensorModel: 'Campbell Scientific CS215 / PTB330 Barometer',
    transmissionType: 'GPRS',
    missingRatePct: 2.83,
    duplicateTimestampsCount: 51,
    isPrimaryGhcnhStation: true,
  },
  // Contextual Regional Network Stations for Spatial Coherence Evaluation
  {
    id: 'AWS-NCR-01',
    code: 'NCR01',
    name: 'Delhi (Palam Airport)',
    state: 'Delhi NCR',
    district: 'South West Delhi',
    region: 'North',
    lat: 28.5665,
    lng: 77.1031,
    elevation: 237,
    source: 'Prototype-Derived',
    datasetRows: 2950,
    samplingInterval: '3 hours (03:00:00)',
    lastUpdated: '14:30:00Z',
    status: 'healthy',
    currentReadings: {
      temperature: 32.8,
      humidity: 60.0,
      pressure: 996.9,
    },
    sensorHealth: { temperature: 99, humidity: 98, pressure: 98 },
    overallHealthScore: 98,
    sensorTrust: { trust_score: 98.0, trend: 'stable', maintenance_status: 'normal' },
    degradation: { degradation_risk: 0.08, status: 'normal', reason: [] },
    history: generateGhcnhSequence('AWS-NCR-01', '2023-08-28', 32.8, 60.0, 996.9),
    nearbyStationIds: ['INI0000VIDD'],
    installedDate: '2022-11-01',
    sensorModel: 'Vaisala AWS310 Reference Grade',
    transmissionType: 'GPRS',
    missingRatePct: 1.80,
    duplicateTimestampsCount: 12,
    isPrimaryGhcnhStation: false,
  },
  {
    id: 'AWS-RAJ-02',
    code: 'RAJ02',
    name: 'Jaipur (Sanganer)',
    state: 'Rajasthan',
    district: 'Jaipur',
    region: 'North',
    lat: 26.8242,
    lng: 75.8122,
    elevation: 390,
    source: 'Prototype-Derived',
    datasetRows: 2980,
    samplingInterval: '3 hours (03:00:00)',
    lastUpdated: '14:30:00Z',
    status: 'healthy',
    currentReadings: {
      temperature: 34.6,
      humidity: 48.0,
      pressure: 980.5,
    },
    sensorHealth: { temperature: 96, humidity: 97, pressure: 97 },
    overallHealthScore: 97,
    sensorTrust: { trust_score: 95.0, trend: 'stable', maintenance_status: 'normal' },
    degradation: { degradation_risk: 0.14, status: 'normal', reason: [] },
    history: generateGhcnhSequence('AWS-RAJ-02', '2023-08-28', 34.6, 48.0, 980.5),
    nearbyStationIds: ['INI0000VIJO', 'INI0000VIDD'],
    installedDate: '2021-06-12',
    sensorModel: 'Kintech EOL Zenith AWS',
    transmissionType: 'INSAT / Satellite',
    missingRatePct: 2.10,
    duplicateTimestampsCount: 15,
    isPrimaryGhcnhStation: false,
  },
  {
    id: 'AWS-UTK-01',
    code: 'UTK01',
    name: 'Pantnagar (Tarai)',
    state: 'Uttarakhand',
    district: 'Udham Singh Nagar',
    region: 'North',
    lat: 29.0300,
    lng: 79.4800,
    elevation: 244,
    source: 'Prototype-Derived',
    datasetRows: 2940,
    samplingInterval: '3 hours (03:00:00)',
    lastUpdated: '14:30:00Z',
    status: 'healthy',
    currentReadings: {
      temperature: 28.5,
      humidity: 82.0,
      pressure: 994.0,
    },
    sensorHealth: { temperature: 97, humidity: 96, pressure: 98 },
    overallHealthScore: 97,
    sensorTrust: { trust_score: 96.5, trend: 'stable', maintenance_status: 'normal' },
    degradation: { degradation_risk: 0.10, status: 'normal', reason: [] },
    history: generateGhcnhSequence('AWS-UTK-01', '2023-08-28', 28.5, 82.0, 994.0),
    nearbyStationIds: ['INM00042111', 'INI0000VIDD'],
    installedDate: '2022-09-20',
    sensorModel: 'Vaisala HMP155 / PT100',
    transmissionType: 'GPRS',
    missingRatePct: 2.40,
    duplicateTimestampsCount: 18,
    isPrimaryGhcnhStation: false,
  }
];

/**
 * Real/Sample Anomaly Records adhering strictly to DATA_SCHEMA.md & MODEL_DESIGN.md
 */
export const GHCNH_ANOMALIES: AnomalyRecord[] = [
  {
    id: 'ANOM-GHCNH-VIDD-01',
    stationId: 'INI0000VIDD',
    stationName: 'Delhi (Safdarjung)',
    state: 'Delhi NCR',
    timestamp: '2023-08-28T14:30:00Z',
    parameter: 'temperature',
    classification: 'sensor_fault',
    probabilities: {
      genuine_weather: 0.04,
      uncertain: 0.06,
      sensor_fault: 0.90, // Calibrated probabilities from DATA_SCHEMA.md
    },
    rootCause: 'spike',
    anomalyType: 'Sensor Spike (Hardware Fault)',
    severity: 'critical',
    confidence: 90,
    status: 'Active',
    observedValue: 55.0,
    estimatedValue: 32.4,
    unit: '°C',
    is_injected: true,
    scenario_type: 'spike',
    evidenceVector: {
      temporal: 0.81,
      seasonal: 0.64,
      change: 0.91,
      multivariate: 0.72,
      spatial: 0.88,
      history: 0.41,
      physics: 0.30,
      spatial_coherence: 0.10,
      temporal_coherence: 0.22,
      multivariate_coherence: 0.35,
      persistence: 0.12,
    },
    evidence: [
      {
        indicator: 'Sudden Step Change',
        dimension: 'change',
        score: 'HIGH',
        value: 0.91,
        detail: 'Instantaneous +22.6°C jump in single 3-hour interval (Normal limit: ±3.0°C)',
        benchmark: 'ΔT = +22.6°C vs Threshold 3.0°C',
      },
      {
        indicator: 'Spatial Neighbor Inconsistency',
        dimension: 'spatial',
        score: 'HIGH',
        value: 0.88,
        detail: 'Palam (AWS-NCR-01) at 32.8°C and Dehradun (INM00042111) at 24.2°C show zero regional warming',
        benchmark: 'Spatial divergence: +22.2°C',
      },
      {
        indicator: 'Multivariate Thermodynamic Mismatch',
        dimension: 'multivariate',
        score: 'HIGH',
        value: 0.72,
        detail: 'Relative humidity remained steady at 61.0% (Physically incompatible with 55.0°C dry-bulb heating)',
        benchmark: 'Psychrometric RH drop: 0% observed',
      },
      {
        indicator: 'Climatological Seasonal Envelope',
        dimension: 'seasonal',
        score: 'HIGH',
        value: 0.64,
        detail: 'Exceeds the 50-year all-time August maximum record for Safdarjung by +12.6°C',
        benchmark: 'August Record: 42.4°C vs 55.0°C',
      },
    ],
    shapContributions: [
      {
        feature: 'change',
        label: 'Step Rate of Change (0.91)',
        shapValue: 0.42,
        impact: 'increases_fault_risk',
        description: 'Sudden isolated +22.6°C temperature leap within single 3h cycle contributed +42% to fault classification.',
      },
      {
        feature: 'spatial',
        label: 'Spatial Neighbor Disagreement (0.88)',
        shapValue: 0.35,
        impact: 'increases_fault_risk',
        description: 'Zero agreement from adjacent stations (Palam @ 32.8°C) contributed +35% to fault classification.',
      },
      {
        feature: 'multivariate',
        label: 'Psychrometric Divergence (0.72)',
        shapValue: 0.18,
        impact: 'increases_fault_risk',
        description: 'Stable 61% relative humidity fails thermodynamic laws for 55°C air.',
      },
      {
        feature: 'persistence',
        label: 'Low Temporal Persistence (0.12)',
        shapValue: -0.05,
        impact: 'supports_genuine',
        description: 'Single isolated cycle slightly reduced fault confidence baseline.',
      },
    ],
    correction: {
      raw_value: { temperature_c: 55.0, humidity_pct: 61.0, pressure_hpa: 997.8 },
      corrected_value: { temperature_c: 32.4, humidity_pct: 61.0, pressure_hpa: 997.8 },
      correction_confidence: 0.91,
      correction_method: 'temporal_spatial_estimate',
      raw_preserved: true,
    },
    explanation: 'Extreme temperature spike detected on RTD channel. High rate of change, zero spatial consensus, and lack of psychrometric humidity response confirm a sensor ADC hardware fault rather than meteorological warming.',
    recommendedAction: 'Inspect and calibrate temperature RTD probe. Clean terminal connection block and replace surge protection suppressor.',
  },
  {
    id: 'ANOM-GHCNH-VIJO-02',
    stationId: 'INI0000VIJO',
    stationName: 'Jodhpur (Airport)',
    state: 'Rajasthan',
    timestamp: '2023-08-28T12:00:00Z',
    parameter: 'temperature',
    classification: 'sensor_fault',
    probabilities: {
      genuine_weather: 0.08,
      uncertain: 0.14,
      sensor_fault: 0.78,
    },
    rootCause: 'drift',
    anomalyType: 'Sensor Drift (Calibration Offset)',
    severity: 'warning',
    confidence: 86,
    status: 'Under Investigation',
    observedValue: 38.6,
    estimatedValue: 33.8,
    unit: '°C',
    is_injected: true,
    scenario_type: 'drift',
    evidenceVector: {
      temporal: 0.68,
      seasonal: 0.42,
      change: 0.35,
      multivariate: 0.62,
      spatial: 0.79,
      history: 0.58,
      physics: 0.20,
      spatial_coherence: 0.25,
      temporal_coherence: 0.78,
      multivariate_coherence: 0.45,
      persistence: 0.82,
    },
    evidence: [
      {
        indicator: 'Spatial Reference Gradient Bias',
        dimension: 'spatial',
        score: 'HIGH',
        value: 0.79,
        detail: 'Persistent positive offset of +4.8°C above regional arid benchmark stations',
        benchmark: 'Regional ΔT bias: +4.8°C',
      },
      {
        indicator: 'High Anomaly Persistence',
        dimension: 'persistence',
        score: 'HIGH',
        value: 0.82,
        detail: 'Offset has expanded steadily over 14 consecutive daily diurnal cycles (+0.34°C/day progression)',
        benchmark: '14-Day Cumulative Slope',
      },
      {
        indicator: 'Temporal Coherence',
        dimension: 'temporal_coherence',
        score: 'MEDIUM',
        value: 0.78,
        detail: 'Diurnal curve shape is smooth but shifted upward in amplitude',
        benchmark: 'Smoothness Index: 0.78',
      },
      {
        indicator: 'Multivariate Dewpoint Shift',
        dimension: 'multivariate',
        score: 'MEDIUM',
        value: 0.62,
        detail: 'Calculated dew point departs systematically from boundary layer equilibrium',
        benchmark: 'Dewpoint offset: +2.8°C',
      },
    ],
    shapContributions: [
      {
        feature: 'spatial',
        label: 'Spatial Bias vs Regional Baseline (0.79)',
        shapValue: 0.38,
        impact: 'increases_fault_risk',
        description: 'Persistent positive departure across arid network contributed +38% to drift classification.',
      },
      {
        feature: 'persistence',
        label: 'Multi-Day Temporal Persistence (0.82)',
        shapValue: 0.30,
        impact: 'increases_fault_risk',
        description: 'Gradual multi-day drift slope confirms slow sensor calibration degradation.',
      },
      {
        feature: 'change',
        label: 'Low Single-Step Jump (0.35)',
        shapValue: -0.10,
        impact: 'supports_genuine',
        description: 'Smooth rate of change prevents classification as sudden transient spike.',
      },
    ],
    correction: {
      raw_value: { temperature_c: 38.6, humidity_pct: 34.0, pressure_hpa: 995.2 },
      corrected_value: { temperature_c: 33.8, humidity_pct: 34.0, pressure_hpa: 995.2 },
      correction_confidence: 0.88,
      correction_method: 'temporal_spatial_estimate',
      raw_preserved: true,
    },
    explanation: 'Systematic positive thermal drift detected. Solar radiation shield degradation or aging RTD element has created a +4.8°C positive offset against regional network baseline.',
    recommendedAction: 'Schedule field recalibration with certified reference psychrometer; clean solar radiation multi-plate shield.',
  },
  {
    id: 'ANOM-GHCNH-VIDD-03',
    stationId: 'INI0000VIDD',
    stationName: 'Delhi (Safdarjung)',
    state: 'Delhi NCR',
    timestamp: '2023-06-15T15:00:00Z',
    parameter: 'temperature',
    classification: 'genuine_weather',
    probabilities: {
      genuine_weather: 0.92,
      uncertain: 0.05,
      sensor_fault: 0.03,
    },
    rootCause: 'none',
    anomalyType: 'Genuine Weather Event (Pre-Monsoon Squall)',
    severity: 'info',
    confidence: 92,
    status: 'Resolved',
    observedValue: '22.8°C / 96%',
    estimatedValue: '22.8°C (Valid)',
    unit: '°C',
    is_injected: false,
    scenario_type: 'genuine_event',
    evidenceVector: {
      temporal: 0.79,
      seasonal: 0.52,
      change: 0.82,
      multivariate: 0.18,
      spatial: 0.34,
      history: 0.08,
      physics: 0.88,
      spatial_coherence: 0.85,
      temporal_coherence: 0.74,
      multivariate_coherence: 0.96,
      persistence: 0.45,
    },
    evidence: [
      {
        indicator: 'Thermodynamic Cross-Sensor Consistency',
        dimension: 'multivariate_coherence',
        score: 'HIGH',
        value: 0.96,
        detail: 'Rapid cooling of -9.2°C perfectly matches +32% humidity surge and barometric micro-transient (+2.8 hPa)',
        benchmark: 'Thermodynamic consistency: 96%',
      },
      {
        indicator: 'Multi-Station Spatial Agreement',
        dimension: 'spatial_coherence',
        score: 'HIGH',
        value: 0.85,
        detail: 'Palam Airport (AWS-NCR-01) observed identical convective squall signature 18 minutes earlier',
        benchmark: 'Frontal speed & direction matched',
      },
      {
        indicator: 'Atmospheric Physics Bounds',
        dimension: 'physics',
        score: 'HIGH',
        value: 0.88,
        detail: 'Thermodynamics align with standard downdraft cold pool kinematics',
        benchmark: 'Wet-bulb cooling limit satisfied',
      },
      {
        indicator: 'Clean Sensor History',
        dimension: 'history',
        score: 'LOW',
        value: 0.08,
        detail: 'Station sensors have shown 99.4% baseline reliability over past 90 days',
        benchmark: 'Fault rate < 0.6%',
      },
    ],
    shapContributions: [
      {
        feature: 'multivariate_coherence',
        label: 'Multivariate Thermodynamic Agreement (0.96)',
        shapValue: -0.48,
        impact: 'supports_genuine',
        description: 'Simultaneous temperature plunge and humidity surge strongly supports genuine convective cold pool downdraft.',
      },
      {
        feature: 'spatial_coherence',
        label: 'Multi-Station Squall Corroboration (0.85)',
        shapValue: -0.34,
        impact: 'supports_genuine',
        description: 'Corroboration from upwind Palam station confirms real regional meteorological event.',
      },
      {
        feature: 'change',
        label: 'Sudden Step Change (0.82)',
        shapValue: 0.12,
        impact: 'increases_fault_risk',
        description: 'Rapid drop initially flagged for screening before evidence fusion confirmed genuine squall.',
      },
    ],
    correction: {
      raw_value: { temperature_c: 22.8, humidity_pct: 96.0, pressure_hpa: 1002.4 },
      corrected_value: { temperature_c: 22.8, humidity_pct: 96.0, pressure_hpa: 1002.4 },
      correction_confidence: 0.96,
      correction_method: 'none',
      raw_preserved: true,
    },
    explanation: 'Genuine atmospheric convective squall (Andhi / Kalbaishakhi downdraft). High multivariate thermodynamic alignment, spatial progression, and physical plausibility prove genuine atmospheric phenomenon, NOT sensor failure.',
    recommendedAction: 'Retain observation as Valid Extreme Meteorological Record. Forward squall verification flag to regional weather forecasting center.',
  }
];

export interface ScenarioDefinition {
  id: string;
  name: string;
  description: string;
  category: 'fault' | 'genuine' | 'communication';
  targetStationId: string;
  targetStationName: string;
  parameter: 'temperature' | 'humidity' | 'pressure' | 'communication';
  injectedValue: number | string | null;
  normalValue: number | string;
  unit: string;
  rootCause: RootCauseType;
  classification: ThreeWayClassification;
  severity: 'critical' | 'warning' | 'info';
  confidence: number;
}

export const GHCNH_SCENARIOS: ScenarioDefinition[] = [
  {
    id: 'spike-temperature',
    name: 'Hardware ADC Spike (+22.6°C jump)',
    description: 'Instantaneous anomalous temperature surge to 55.0°C at Safdarjung without relative humidity drop or neighbor corroboration.',
    category: 'fault',
    targetStationId: 'INI0000VIDD',
    targetStationName: 'Delhi (Safdarjung)',
    parameter: 'temperature',
    injectedValue: 55.0,
    normalValue: 32.4,
    unit: '°C',
    rootCause: 'spike',
    classification: 'sensor_fault',
    severity: 'critical',
    confidence: 90
  },
  {
    id: 'drift-temperature',
    name: 'Sensor Drift (+4.8°C calibration bias)',
    description: 'Persistent positive thermal offset accumulating over multiple cycles due to solar radiation shield dust buildup.',
    category: 'fault',
    targetStationId: 'INI0000VIJO',
    targetStationName: 'Jodhpur (Airport)',
    parameter: 'temperature',
    injectedValue: 38.6,
    normalValue: 33.8,
    unit: '°C',
    rootCause: 'drift',
    classification: 'sensor_fault',
    severity: 'warning',
    confidence: 86
  },
  {
    id: 'frozen-sensor',
    name: 'Frozen Barometric Transducer (Static 938.4 hPa)',
    description: 'Zero variance barometric signal with invariant ADC output over 18 consecutive hours.',
    category: 'fault',
    targetStationId: 'INM00042111',
    targetStationName: 'Dehradun',
    parameter: 'pressure',
    injectedValue: 938.4,
    normalValue: 938.4,
    unit: 'hPa',
    rootCause: 'frozen',
    classification: 'sensor_fault',
    severity: 'warning',
    confidence: 89
  },
  {
    id: 'genuine-squall',
    name: 'Genuine Meteorological Squall (Kalbaishakhi)',
    description: 'Sudden convective cold pool plunge (-9.2°C) with synchronous RH surge (+32%) verified across Delhi NCR network.',
    category: 'genuine',
    targetStationId: 'INI0000VIDD',
    targetStationName: 'Delhi (Safdarjung)',
    parameter: 'temperature',
    injectedValue: 22.8,
    normalValue: 32.0,
    unit: '°C',
    rootCause: 'none',
    classification: 'genuine_weather',
    severity: 'info',
    confidence: 92
  },
  {
    id: 'comm-dropout',
    name: 'DCP / Satellite Telemetry Timeout',
    description: 'Packet buffer failure causing consecutive missing 3-hour observations in automated ingest.',
    category: 'communication',
    targetStationId: 'AWS-RAJ-02',
    targetStationName: 'Barmer Desert Station',
    parameter: 'communication',
    injectedValue: null,
    normalValue: 100,
    unit: '%',
    rootCause: 'communication_failure',
    classification: 'sensor_fault',
    severity: 'critical',
    confidence: 95
  }
];

