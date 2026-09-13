import { 
  Station, 
  ReadingPoint, 
  ThreeWayClassification, 
  RootCauseType, 
  AnomalySeverity, 
  ParameterType,
  EvidenceVector,
  ShapValueContribution,
  CorrectionPayload,
  EvidenceIndicator
} from '../types';

export interface DiagnosisResult {
  anomalyDetected: boolean;
  classification: ThreeWayClassification;
  probabilities: {
    genuine_weather: number;
    uncertain: number;
    sensor_fault: number;
  };
  rootCause: RootCauseType;
  anomalyType: string;
  severity: AnomalySeverity;
  confidence: number;
  affectedSensor: ParameterType | null;
  observedValue: number | string;
  estimatedCorrectValue: number | string;
  unit: string;
  evidenceVector: EvidenceVector;
  evidence: EvidenceIndicator[];
  shapContributions: ShapValueContribution[];
  correction: CorrectionPayload;
  explanation: string;
  recommendedAction: string;
  sensorTrust?: any;
  degradation?: any;
}

/**
 * Intelligent Anomaly Analysis & Evidence Vector Engine
 * Now calls the Real ML API (FastAPI backend).
 */
export async function analyzeStationData(
  station: Station,
  allStations: Station[],
  currentReading: { temperature: number | null; humidity: number | null; pressure: number | null },
  history: ReadingPoint[]
): Promise<DiagnosisResult> {
  const payload = {
    station: station,
    allStations: allStations,
    currentReading: currentReading,
    history: history
  };

  try {
    const response = await fetch('http://localhost:8000/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data as DiagnosisResult;
  } catch (err) {
    console.error("ML Pipeline Error, falling back to safe defaults", err);
    // Fallback if backend is down
    return {
      anomalyDetected: false,
      classification: 'genuine_weather',
      probabilities: { genuine_weather: 1.0, uncertain: 0, sensor_fault: 0 },
      rootCause: 'none',
      anomalyType: '',
      severity: 'info',
      confidence: 100,
      affectedSensor: null,
      observedValue: currentReading.temperature ?? 0,
      estimatedCorrectValue: currentReading.temperature ?? 0,
      unit: '',
      evidenceVector: {
        temporal: 0, seasonal: 0, change: 0, multivariate: 0,
        spatial: 0, history: 0, physics: 0, spatial_coherence: 1,
        temporal_coherence: 1, multivariate_coherence: 1, persistence: 0
      },
      evidence: [],
      shapContributions: [],
      correction: { raw_preserved: true, raw_value: {}, corrected_value: {}, correction_confidence: 0, correction_method: 'none' },
      explanation: 'Backend API unreachable.',
      recommendedAction: 'Check backend.'
    };
  }
}
