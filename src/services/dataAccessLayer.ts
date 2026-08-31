/**
 * SkyGuard AI — Clean Data Access Layer (DAL)
 * 
 * Source of Truth:
 * - DATA_SCHEMA.md
 * - dataset_validation_report.md
 * - MODEL_DESIGN.md
 * - README.md
 * 
 * This layer abstracts all data operations for the prototype and defines
 * the exact API contracts for future FastAPI + PostgreSQL + WebSocket integration.
 * 
 * Future Backend API Endpoints Mapped:
 * - GET  /api/v1/stations                -> getStations()
 * - GET  /api/v1/stations/{id}           -> getStationById(id)
 * - GET  /api/v1/stations/{id}/history   -> getStationHistory(id)
 * - GET  /api/v1/stations/{id}/health    -> getStationHealthMetrics(id)
 * - GET  /api/v1/alerts                  -> getAnomalies()
 * - GET  /api/v1/observations/{id}       -> getObservationDetails(id)
 * - POST /api/v1/observations            -> submitObservation(payload)
 * - WS   /ws/live                        -> streamLiveResults()
 */

import { 
  Station, 
  AnomalyRecord, 
  ReadingPoint, 
  DatasetValidationMetadata,
  SimulationScenario,
  ThreeWayClassification,
  RootCauseType,
  AnomalyStatus,
  EvidenceVector,
  ShapValueContribution,
  CorrectionPayload,
  SensorTrust,
  DegradationRisk
} from '../types';
import { 
  GHCNH_STATIONS, 
  GHCNH_ANOMALIES, 
  DATASET_VALIDATION_REPORT,
  createEvidenceVector 
} from '../data/ghcnhDataset';

export class DataAccessLayer {
  private static stations: Station[] = JSON.parse(JSON.stringify(GHCNH_STATIONS));
  private static anomalies: AnomalyRecord[] = JSON.parse(JSON.stringify(GHCNH_ANOMALIES));

  /**
   * Fetches all registered Automatic Weather Stations
   * Equivalent to GET /api/v1/stations
   */
  public static getStations(): Station[] {
    return this.stations;
  }

  /**
   * Fetches a specific AWS station by ID
   * Equivalent to GET /api/v1/stations/{id}
   */
  public static getStationById(id: string): Station | undefined {
    return this.stations.find(s => s.id === id);
  }

  /**
   * Fetches the official dataset validation report metadata
   * Sourced directly from dataset_validation_report.md
   */
  public static getDatasetValidationReport(): DatasetValidationMetadata {
    return DATASET_VALIDATION_REPORT;
  }

  /**
   * Fetches historical time-series observation points for a station
   * Equivalent to GET /api/v1/stations/{id}/history
   */
  public static getStationHistory(stationId: string, limit?: number): ReadingPoint[] {
    const station = this.getStationById(stationId);
    if (!station) return [];
    if (limit && limit > 0) {
      return station.history.slice(-limit);
    }
    return station.history;
  }

  /**
   * Fetches anomalies filtered by classification, root cause, or station
   * Equivalent to GET /api/v1/alerts
   */
  public static getAnomalies(filter?: {
    classification?: ThreeWayClassification;
    rootCause?: RootCauseType;
    stationId?: string;
    status?: AnomalyStatus;
  }): AnomalyRecord[] {
    let result = [...this.anomalies];

    if (filter?.stationId) {
      result = result.filter(a => a.stationId === filter.stationId);
    }
    if (filter?.classification) {
      result = result.filter(a => a.classification === filter.classification);
    }
    if (filter?.rootCause) {
      result = result.filter(a => a.rootCause === filter.rootCause);
    }
    if (filter?.status) {
      result = result.filter(a => a.status === filter.status);
    }

    return result;
  }

  /**
   * Fetches anomaly details by incident ID
   */
  public static getAnomalyById(id: string): AnomalyRecord | undefined {
    return this.anomalies.find(a => a.id === id);
  }

  /**
   * Fetches Sensor Trust and Degradation metrics for a station
   * Equivalent to GET /api/v1/stations/{id}/health
   */
  public static getStationHealthMetrics(stationId: string): {
    sensorTrust: SensorTrust;
    degradation: DegradationRisk;
  } | undefined {
    const station = this.getStationById(stationId);
    if (!station) return undefined;
    return {
      sensorTrust: station.sensorTrust,
      degradation: station.degradation,
    };
  }

  /**
   * Simulates/Switches controlled demonstration scenarios
   * Clearly distinguishes simulated/injected scenarios vs real GHCNh observations
   */
  public static simulateScenario(scenario: SimulationScenario): {
    stations: Station[];
    anomalies: AnomalyRecord[];
    targetStationId: string;
  } {
    // Reset to base state
    this.stations = JSON.parse(JSON.stringify(GHCNH_STATIONS));
    this.anomalies = JSON.parse(JSON.stringify(GHCNH_ANOMALIES));

    let targetStationId = 'INI0000VIDD';

    if (scenario === 'NORMAL') {
      targetStationId = 'INM00042111'; // Dehradun baseline
      this.stations = this.stations.map(st => {
        if (st.id === 'INI0000VIDD') {
          return {
            ...st,
            status: 'healthy',
            overallHealthScore: 98,
            currentReadings: { temperature: 32.4, humidity: 61.0, pressure: 997.8 },
            sensorHealth: { temperature: 98, humidity: 98, pressure: 97 },
            sensorTrust: { trust_score: 97.5, trend: 'stable', maintenance_status: 'normal' },
            degradation: { degradation_risk: 0.05, status: 'normal', reason: [] },
            activeAnomalyId: undefined,
          };
        }
        if (st.id === 'INI0000VIJO') {
          return {
            ...st,
            status: 'healthy',
            overallHealthScore: 96,
            currentReadings: { temperature: 33.8, humidity: 34.0, pressure: 995.2 },
            sensorHealth: { temperature: 96, humidity: 95, pressure: 97 },
            sensorTrust: { trust_score: 95.0, trend: 'stable', maintenance_status: 'normal' },
            degradation: { degradation_risk: 0.08, status: 'normal', reason: [] },
            activeAnomalyId: undefined,
          };
        }
        return st;
      });
    } else if (scenario === 'TEMPERATURE_SPIKE') {
      targetStationId = 'INI0000VIDD';
      // Injected spike on Delhi Safdarjung
    } else if (scenario === 'SENSOR_DRIFT') {
      targetStationId = 'INI0000VIJO';
      // Drift on Jodhpur
    } else if (scenario === 'FROZEN_SENSOR') {
      targetStationId = 'INM00042111';
      this.stations = this.stations.map(st => {
        if (st.id === 'INM00042111') {
          return {
            ...st,
            status: 'attention',
            overallHealthScore: 71,
            sensorHealth: { temperature: 65, humidity: 97, pressure: 98 },
            sensorTrust: { trust_score: 68.0, trend: 'declining', maintenance_status: 'watch' },
            degradation: {
              degradation_risk: 0.52,
              status: 'watch',
              reason: ['frozen_sensor_evidence', 'zero_signal_variance'],
            },
            currentReadings: { temperature: 24.2, humidity: 88.0, pressure: 938.4 },
            activeAnomalyId: 'ANOM-GHCNH-DEH-04',
          };
        }
        return st;
      });

      // Add frozen anomaly
      const frozenAnomaly: AnomalyRecord = {
        id: 'ANOM-GHCNH-DEH-04',
        stationId: 'INM00042111',
        stationName: 'Dehradun',
        state: 'Uttarakhand',
        timestamp: '2023-08-28T14:30:00Z',
        parameter: 'temperature',
        classification: 'sensor_fault',
        probabilities: { genuine_weather: 0.05, uncertain: 0.09, sensor_fault: 0.86 },
        rootCause: 'frozen',
        anomalyType: 'Frozen / Stuck Transducer',
        severity: 'warning',
        confidence: 94,
        status: 'Active',
        observedValue: 24.2,
        estimatedValue: 26.8,
        unit: '°C',
        is_injected: true,
        scenario_type: 'frozen',
        evidenceVector: createEvidenceVector({
          temporal: 0.72,
          seasonal: 0.55,
          change: 0.01,
          multivariate: 0.65,
          spatial: 0.71,
          history: 0.60,
          persistence: 0.90,
        }),
        evidence: [
          {
            indicator: 'Zero Signal Variance (σ²=0)',
            dimension: 'persistence',
            score: 'HIGH',
            value: 0.90,
            detail: 'Temperature reading static at exactly 24.20°C across 3 consecutive 3-hour sample cycles',
            benchmark: 'σ² = 0.000',
          },
          {
            indicator: 'Diurnal Solar Forcing Mismatch',
            dimension: 'seasonal',
            score: 'HIGH',
            value: 0.55,
            detail: 'Ambient solar irradiance changed +290 W/m² without corresponding thermal response',
            benchmark: 'ΔSolar: +290 W/m²',
          },
        ],
        shapContributions: [
          {
            feature: 'persistence',
            label: 'Static Output Persistence (0.90)',
            shapValue: 0.45,
            impact: 'increases_fault_risk',
            description: 'Repeated static reading without micro-fluctuation contributed +45% to fault diagnosis.',
          },
        ],
        correction: {
          raw_value: { temperature_c: 24.2, humidity_pct: 88.0, pressure_hpa: 938.4 },
          corrected_value: { temperature_c: 26.8, humidity_pct: 88.0, pressure_hpa: 938.4 },
          correction_confidence: 0.92,
          correction_method: 'temporal_spatial_estimate',
          raw_preserved: true,
        },
        explanation: 'Temperature transducer ADC locked at a static output value across diurnal peak.',
        recommendedAction: 'Initiate remote transducer soft-reset; if lock persists, dispatch field team for probe bridge replacement.',
      };

      this.anomalies.push(frozenAnomaly);
    } else if (scenario === 'MISSING_DATA') {
      targetStationId = 'INI0000VIDD';
      this.stations = this.stations.map(st => {
        if (st.id === 'INI0000VIDD') {
          return {
            ...st,
            status: 'critical',
            overallHealthScore: 28,
            sensorHealth: { temperature: 25, humidity: 25, pressure: 25 },
            sensorTrust: { trust_score: 35.0, trend: 'declining', maintenance_status: 'investigate' },
            degradation: {
              degradation_risk: 0.85,
              status: 'maintenance_recommended',
              reason: ['telemetry_timeout', 'packet_loss_100pct', 'battery_undervoltage'],
            },
            currentReadings: { temperature: null, humidity: null, pressure: null },
            activeAnomalyId: 'ANOM-GHCNH-VIDD-05',
          };
        }
        return st;
      });

      const missingAnomaly: AnomalyRecord = {
        id: 'ANOM-GHCNH-VIDD-05',
        stationId: 'INI0000VIDD',
        stationName: 'Delhi (Safdarjung)',
        state: 'Delhi NCR',
        timestamp: '2023-08-28T14:30:00Z',
        parameter: 'communication',
        classification: 'sensor_fault',
        probabilities: { genuine_weather: 0.01, uncertain: 0.04, sensor_fault: 0.95 },
        rootCause: 'communication_failure',
        anomalyType: 'Communication Failure (Packet Drop)',
        severity: 'critical',
        confidence: 98,
        status: 'Active',
        observedValue: 'NULL / Dropout',
        estimatedValue: 32.4,
        unit: '°C',
        is_injected: true,
        scenario_type: 'communication_failure',
        evidenceVector: createEvidenceVector({
          temporal: 0.90,
          history: 0.75,
          persistence: 0.70,
        }),
        evidence: [
          {
            indicator: 'Payload Transmission Dropout',
            dimension: 'history',
            score: 'HIGH',
            value: 0.75,
            detail: 'Zero bytes received in scheduled transmission window for all channels',
            benchmark: 'Packet Loss: 100%',
          },
        ],
        shapContributions: [
          {
            feature: 'temporal',
            label: 'Consecutive Missing Telemetry Packets',
            shapValue: 0.55,
            impact: 'increases_fault_risk',
            description: 'Missing scheduled DCP packet triggered immediate communication failure alert.',
          },
        ],
        correction: {
          raw_value: { temperature_c: null, humidity_pct: null, pressure_hpa: null },
          corrected_value: { temperature_c: 32.4, humidity_pct: 61.0, pressure_hpa: 997.8 },
          correction_confidence: 0.85,
          correction_method: 'temporal_spatial_estimate',
          raw_preserved: true,
        },
        explanation: 'Telemetry dropout detected. Data Collection Platform (DCP) remote logger unreachable due to power interruption.',
        recommendedAction: 'Check remote DCP battery voltage; inspect 12V solar backup charge controller.',
      };

      this.anomalies.push(missingAnomaly);
    } else if (scenario === 'GENUINE_WEATHER_EVENT') {
      targetStationId = 'INI0000VIDD';
    }

    return {
      stations: this.stations,
      anomalies: this.anomalies,
      targetStationId,
    };
  }

  /**
   * Resolves or updates the status of an anomaly record
   */
  public static resolveAnomaly(id: string, newStatus: AnomalyStatus, operatorNotes?: string, resolvedBy = 'Senior Meteorological Officer'): AnomalyRecord | null {
    const anomaly = this.anomalies.find(a => a.id === id);
    if (!anomaly) return null;

    anomaly.status = newStatus;
    if (operatorNotes) anomaly.operatorNotes = operatorNotes;
    anomaly.resolvedAt = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST';
    anomaly.resolvedBy = resolvedBy;

    if (newStatus === 'Resolved') {
      const station = this.stations.find(s => s.id === anomaly.stationId);
      if (station) {
        station.status = 'healthy';
        station.overallHealthScore = 96;
        station.sensorTrust = { trust_score: 94.0, trend: 'improving', maintenance_status: 'normal' };
        station.degradation = { degradation_risk: 0.15, status: 'normal', reason: [] };
        if (typeof anomaly.estimatedValue === 'number') {
          station.currentReadings.temperature = anomaly.estimatedValue;
        }
      }
    }

    return anomaly;
  }
}
