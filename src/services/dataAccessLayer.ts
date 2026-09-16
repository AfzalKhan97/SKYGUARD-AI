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
import { analyzeStationData } from './anomalyEngine';
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
  public static async simulateScenario(scenario: SimulationScenario): Promise<{
    stations: Station[];
    anomalies: AnomalyRecord[];
    targetStationId: string;
  }> {
    // Reset to base state
    this.stations = JSON.parse(JSON.stringify(GHCNH_STATIONS));
    this.anomalies = JSON.parse(JSON.stringify(GHCNH_ANOMALIES));

    let targetStationId = 'INI0000VIDD';
    let targetStationIndex = this.stations.findIndex(s => s.id === targetStationId);
    let injectedNumericVal: number | null = null;
    let parameter: string = 'temperature';
    let scenarioType: string = 'normal';

    if (scenario === 'NORMAL') {
      targetStationId = 'INM00042111'; // Dehradun baseline
      // Reset is sufficient, just return base state
      return {
        stations: this.stations,
        anomalies: this.anomalies,
        targetStationId
      };
    } else if (scenario === 'TEMPERATURE_SPIKE') {
      targetStationId = 'INI0000VIDD';
      targetStationIndex = this.stations.findIndex(s => s.id === targetStationId);
      injectedNumericVal = 55.0; // Injected spike on Delhi Safdarjung
      parameter = 'temperature';
      scenarioType = 'spike';
    } else if (scenario === 'SENSOR_DRIFT') {
      targetStationId = 'INI0000VIJO';
      targetStationIndex = this.stations.findIndex(s => s.id === targetStationId);
      injectedNumericVal = 38.6; // Drift on Jodhpur
      parameter = 'temperature';
      scenarioType = 'drift';
    } else if (scenario === 'FROZEN_SENSOR') {
      targetStationId = 'INM00042111';
      targetStationIndex = this.stations.findIndex(s => s.id === targetStationId);
      injectedNumericVal = 938.4;
      parameter = 'pressure';
      scenarioType = 'frozen';
    } else if (scenario === 'MISSING_DATA') {
      targetStationId = 'INI0000VIDD';
      targetStationIndex = this.stations.findIndex(s => s.id === targetStationId);
      injectedNumericVal = null;
      parameter = 'communication';
      scenarioType = 'communication_failure';
    } else if (scenario === 'GENUINE_WEATHER_EVENT') {
      targetStationId = 'INI0000VIDD';
      targetStationIndex = this.stations.findIndex(s => s.id === targetStationId);
      injectedNumericVal = 22.8;
      parameter = 'temperature';
      scenarioType = 'genuine';
    }

    const targetStation = this.stations[targetStationIndex];
    if (!targetStation) {
       return { stations: this.stations, anomalies: this.anomalies, targetStationId };
    }

    const currentT = targetStation.currentReadings.temperature ?? 32.4;
    const currentRH = targetStation.currentReadings.humidity ?? 61.0;
    const currentP = targetStation.currentReadings.pressure ?? 997.8;

    const newReading = {
      temperature: parameter === 'temperature' ? injectedNumericVal : currentT,
      humidity: parameter === 'humidity' ? injectedNumericVal : (parameter === 'communication' ? null : currentRH),
      pressure: parameter === 'pressure' ? injectedNumericVal : (parameter === 'communication' ? null : currentP),
    };

    // CALL REAL ML API
    const analysis = await analyzeStationData(targetStation, this.stations, newReading, targetStation.history || []);
    
    const newAnomalyId = `ANM-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`;

    const updatedHistory = targetStation.history ? [...targetStation.history] : [];
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
        scenario_type: scenarioType,
        evidenceVector: analysis.evidenceVector,
      };
    }

    this.stations[targetStationIndex] = {
      ...targetStation,
      status: analysis.anomalyDetected ? (analysis.severity === 'critical' ? 'critical' : 'attention') : 'healthy',
      currentReadings: newReading,
      sensorTrust: analysis.sensorTrust || targetStation.sensorTrust,
      degradation: analysis.degradation || targetStation.degradation,
      history: updatedHistory,
      activeAnomalyId: analysis.anomalyDetected ? newAnomalyId : undefined,
    };

    if (analysis.anomalyDetected) {
      const newAnomalyRecord: AnomalyRecord = {
        id: newAnomalyId,
        stationId: targetStationId,
        stationName: targetStation.name,
        state: targetStation.state,
        timestamp: 'Just now (Live Injection)',
        parameter: parameter as any,
        classification: analysis.classification,
        probabilities: analysis.probabilities,
        rootCause: analysis.rootCause,
        anomalyType: analysis.anomalyType || 'Anomaly Detected',
        severity: analysis.severity,
        confidence: analysis.confidence,
        status: 'Active',
        observedValue: injectedNumericVal !== null ? String(injectedNumericVal) : 'NULL',
        estimatedValue: newReading.temperature || 0,
        unit: parameter === 'temperature' ? '°C' : (parameter === 'pressure' ? 'hPa' : (parameter === 'humidity' ? '%' : '')),
        evidenceVector: analysis.evidenceVector,
        evidence: analysis.evidence || [],
        shapContributions: analysis.shapContributions || [],
        correction: analysis.correction,
        explanation: analysis.explanation,
        recommendedAction: analysis.recommendedAction,
        is_injected: true,
        scenario_type: scenarioType
      };
      this.anomalies = [newAnomalyRecord, ...this.anomalies];
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
