import React from 'react';
import { 
  Radio, 
  MapPin, 
  Clock, 
  Activity, 
  Thermometer, 
  Droplets, 
  Gauge, 
  ShieldAlert, 
  CheckCircle2, 
  ChevronRight,
  Sparkles,
  Info,
  Layers,
  Cpu,
  BarChart3,
  Scale,
  ShieldCheck,
  Zap,
  TrendingDown,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { useStation } from '../context/StationContext';
import { TrendChart } from './TrendChart';
import { analyzeStationData } from '../services/anomalyEngine';

interface StationDetailsViewProps {
  onBack?: () => void;
  onOpenAnomalyDetails?: (anomalyId: string) => void;
}

export const StationDetailsView: React.FC<StationDetailsViewProps> = ({ 
  onBack,
  onOpenAnomalyDetails 
}) => {
  const { 
    selectedStation, 
    stations, 
    setSelectedAnomalyId,
    selectedStationAnomaly,
    setCurrentTab
  } = useStation();

  if (!selectedStation) {
    return (
      <div className="p-8 text-center text-slate-500 text-sm">
        No station selected. Please select an Automatic Weather Station.
      </div>
    );
  }

  // Run ML Anomaly & Evidence Vector inference
  const analysis = analyzeStationData(
    selectedStation,
    stations,
    selectedStation.currentReadings,
    selectedStation.history
  );

  const isAnomaly = analysis.anomalyDetected;
  const ev = analysis.evidenceVector;

  return (
    <div className="space-y-6">
      {/* Top Station Header Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Station Title & Metadata */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200">
                {selectedStation.id}
              </span>
              <span className={`text-xs font-bold uppercase px-2.5 py-0.5 rounded-full ${
                selectedStation.status === 'healthy' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                selectedStation.status === 'attention' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse'
              }`}>
                {selectedStation.status} Status
              </span>
              <span className="text-xs text-slate-500 font-mono">
                • {selectedStation.source} ({selectedStation.datasetRows.toLocaleString()} obs)
              </span>
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                • Interval: {selectedStation.samplingInterval}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>{selectedStation.name} Weather Station</span>
            </h1>

            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 mt-2">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {selectedStation.district}, {selectedStation.state} (Elevation: {selectedStation.elevation}m MSL)
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Scheduled: <strong className="text-slate-700">{selectedStation.lastUpdated}</strong>
              </span>
              <span className="font-mono text-[11px] text-slate-400">
                GPS: {selectedStation.lat.toFixed(4)}°N, {selectedStation.lng.toFixed(4)}°E
              </span>
              <span className="text-slate-400 text-[11px]">
                Missing Rate: <strong className="text-slate-600">{selectedStation.missingRatePct}%</strong>
              </span>
            </div>
          </div>

          {/* Sensor Trust Score & Degradation Status */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-right min-w-[130px]">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Sensor Trust Score
              </span>
              <div className="flex items-center justify-end gap-1 mt-0.5">
                {selectedStation.sensorTrust.trend === 'declining' ? (
                  <TrendingDown className="w-4 h-4 text-rose-600" />
                ) : (
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                )}
                <span className={`text-xl font-bold font-mono ${
                  selectedStation.sensorTrust.trust_score >= 80 ? 'text-emerald-700' :
                  selectedStation.sensorTrust.trust_score >= 60 ? 'text-amber-700' : 'text-rose-700'
                }`}>
                  {selectedStation.sensorTrust.trust_score.toFixed(1)}/100
                </span>
              </div>
              <span className="text-[10px] text-slate-500 capitalize">
                Status: {selectedStation.sensorTrust.maintenance_status}
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-right min-w-[130px]">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Degradation Risk
              </span>
              <div className="flex items-center justify-end gap-1 mt-0.5">
                <span className={`text-xl font-bold font-mono ${
                  selectedStation.degradation.degradation_risk <= 0.3 ? 'text-emerald-700' :
                  selectedStation.degradation.degradation_risk <= 0.6 ? 'text-amber-700' : 'text-rose-700'
                }`}>
                  {(selectedStation.degradation.degradation_risk * 100).toFixed(0)}%
                </span>
              </div>
              <span className="text-[10px] text-slate-500 capitalize">
                {selectedStation.degradation.status.replace('_', ' ')}
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Three Main Sensor Channels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Temperature Channel */}
        <div className={`p-4 rounded-lg border bg-white shadow-xs ${
          analysis.affectedSensor === 'temperature' && isAnomaly
            ? 'border-rose-300 ring-1 ring-rose-200' 
            : 'border-slate-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Thermometer className="w-4 h-4 text-blue-800" />
              Dry-Bulb Temperature
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
              selectedStation.sensorHealth.temperature >= 90 ? 'bg-emerald-50 text-emerald-700' :
              selectedStation.sensorHealth.temperature >= 70 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
            }`}>
              {selectedStation.sensorHealth.temperature >= 90 ? 'Normal' : selectedStation.sensorHealth.temperature >= 70 ? 'Attention' : 'Critical'}
            </span>
          </div>

          <div className="my-2">
            <span className="text-2xl font-bold font-mono text-slate-900">
              {selectedStation.currentReadings.temperature !== null 
                ? `${selectedStation.currentReadings.temperature.toFixed(1)}°C` 
                : 'NULL / Dropout'}
            </span>
            <span className="text-xs text-slate-500 block mt-0.5">
              Nominal Climatology: 18.0°C – 36.5°C
            </span>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>PT100 Channel Health</span>
            <span className="font-bold text-slate-700">{selectedStation.sensorHealth.temperature}%</span>
          </div>
        </div>

        {/* Humidity Channel */}
        <div className="p-4 rounded-lg border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Droplets className="w-4 h-4 text-sky-700" />
              Relative Humidity
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
              selectedStation.sensorHealth.humidity >= 90 ? 'bg-emerald-50 text-emerald-700' :
              selectedStation.sensorHealth.humidity >= 70 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
            }`}>
              {selectedStation.sensorHealth.humidity >= 90 ? 'Normal' : 'Attention'}
            </span>
          </div>

          <div className="my-2">
            <span className="text-2xl font-bold font-mono text-slate-900">
              {selectedStation.currentReadings.humidity !== null 
                ? `${selectedStation.currentReadings.humidity}%` 
                : 'NULL'}
            </span>
            <span className="text-xs text-slate-500 block mt-0.5">
              Psychrometric Range: 15% – 98%
            </span>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Hygrometer Health</span>
            <span className="font-bold text-slate-700">{selectedStation.sensorHealth.humidity}%</span>
          </div>
        </div>

        {/* Pressure Channel */}
        <div className="p-4 rounded-lg border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-slate-700" />
              Atmospheric Pressure
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
              selectedStation.sensorHealth.pressure >= 90 ? 'bg-emerald-50 text-emerald-700' :
              selectedStation.sensorHealth.pressure >= 70 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
            }`}>
              {selectedStation.sensorHealth.pressure >= 90 ? 'Normal' : 'Attention'}
            </span>
          </div>

          <div className="my-2">
            <span className="text-2xl font-bold font-mono text-slate-900">
              {selectedStation.currentReadings.pressure !== null 
                ? `${selectedStation.currentReadings.pressure} hPa` 
                : 'NULL'}
            </span>
            <span className="text-xs text-slate-500 block mt-0.5">
              Elevation Adjusted ({selectedStation.elevation}m)
            </span>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Barometer Health</span>
            <span className="font-bold text-slate-700">{selectedStation.sensorHealth.pressure}%</span>
          </div>
        </div>

      </div>

      {/* Historical Trend Chart (Raw vs Corrected & 3-hour cycle) */}
      <TrendChart station={selectedStation} showStationSelector={false} />

      {/* 11-DIMENSIONAL EVIDENCE VECTOR & AI DIAGNOSTICS CARD */}
      <div className={`
        border rounded-lg p-5 shadow-xs transition-all
        ${isAnomaly && analysis.severity === 'critical'
          ? 'bg-rose-50/40 border-rose-300' 
          : isAnomaly && analysis.severity === 'warning'
          ? 'bg-amber-50/30 border-amber-300'
          : 'bg-emerald-50/20 border-emerald-200'}
      `}>
        {/* Diagnostic Pipeline Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-md ${
              isAnomaly && analysis.severity === 'critical' ? 'bg-rose-100 text-rose-800' :
              isAnomaly && analysis.severity === 'warning' ? 'bg-amber-100 text-amber-800' :
              'bg-emerald-100 text-emerald-800'
            }`}>
              {isAnomaly ? <ShieldAlert className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  SkyGuard AI Diagnostic Pipeline
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200 text-slate-800">
                  XGBoost 3-Way Classifier
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                {isAnomaly ? `ANOMALY DETECTED: ${analysis.anomalyType}` : 'NOMINAL DATA QUALITY VERIFIED'}
              </h3>
            </div>
          </div>

          {/* Three-Way Calibrated Probabilities */}
          <div className="flex items-center gap-2 text-xs">
            <div className="bg-white px-2.5 py-1.5 rounded border border-slate-200 text-center">
              <span className="text-[9px] text-slate-400 block font-semibold uppercase">Sensor Fault</span>
              <span className="font-mono font-bold text-rose-700">
                {(analysis.probabilities.sensor_fault * 100).toFixed(0)}%
              </span>
            </div>
            <div className="bg-white px-2.5 py-1.5 rounded border border-slate-200 text-center">
              <span className="text-[9px] text-slate-400 block font-semibold uppercase">Uncertain</span>
              <span className="font-mono font-bold text-amber-700">
                {(analysis.probabilities.uncertain * 100).toFixed(0)}%
              </span>
            </div>
            <div className="bg-white px-2.5 py-1.5 rounded border border-slate-200 text-center">
              <span className="text-[9px] text-slate-400 block font-semibold uppercase">Genuine Weather</span>
              <span className="font-mono font-bold text-emerald-700">
                {(analysis.probabilities.genuine_weather * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        {/* 11-Dimensional Evidence Vector Visualizer */}
        <div className="my-4 bg-white p-4 rounded-md border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-900" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                11-Dimensional Evidence Vector Scores [0.0 – 1.0]
              </h4>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Vector Definition: DATA_SCHEMA.md & MODEL_DESIGN.md
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
            {[
              { label: 'Temporal', val: ev.temporal, desc: 'Autoregression dev' },
              { label: 'Seasonal', val: ev.seasonal, desc: 'Diurnal envelope' },
              { label: 'Change', val: ev.change, desc: 'Step rate of change' },
              { label: 'Multivariate', val: ev.multivariate, desc: 'Psychrometric diff' },
              { label: 'Spatial', val: ev.spatial, desc: 'Neighbor residual' },
              { label: 'History', val: ev.history, desc: 'Prior fault rate' },
              { label: 'Physics', val: ev.physics, desc: 'Physical bounds' },
              { label: 'Spatial Coh.', val: ev.spatial_coherence, desc: 'Network agreement' },
              { label: 'Temporal Coh.', val: ev.temporal_coherence, desc: 'Step consistency' },
              { label: 'Multi Coh.', val: ev.multivariate_coherence, desc: 'T vs RH thermodynamic' },
              { label: 'Persistence', val: ev.persistence, desc: 'Duration in cycles' },
            ].map((dim) => (
              <div key={dim.label} className="p-2 bg-slate-50 rounded border border-slate-100">
                <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                  <span>{dim.label}</span>
                  <span className="font-mono text-blue-950 font-bold">{dim.val.toFixed(2)}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className={`h-1.5 rounded-full ${
                      dim.val >= 0.75 ? 'bg-rose-500' :
                      dim.val >= 0.45 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, dim.val * 100)}%` }}
                  />
                </div>
                <span className="text-[9px] text-slate-400 mt-1 block truncate">{dim.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Diagnosis, Evidence & Corrected Action Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 text-xs">
          
          {/* Col 1: Observed vs Estimated & Raw Preservation */}
          <div className="space-y-3 bg-white p-4 rounded-md border border-slate-200 shadow-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Root Cause Classification
              </span>
              <p className="font-bold text-sm text-slate-900 mt-0.5">
                {analysis.anomalyType}
              </p>
            </div>

            <div className="p-2.5 bg-slate-50 rounded border border-slate-200 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Observed Value:</span>
                <span className="font-mono font-bold text-rose-700">{analysis.observedValue} {analysis.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ML Corrected Value:</span>
                <span className="font-mono font-bold text-emerald-700">{analysis.estimatedCorrectValue} {analysis.unit}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-[10px] text-slate-500">
                <span>Raw Value Preserved:</span>
                <span className="font-semibold text-blue-900 bg-blue-50 px-1.5 py-0.2 rounded">True (Immutable)</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed">
              {analysis.explanation}
            </p>
          </div>

          {/* Col 2: SHAP Feature Contributions */}
          <div className="bg-white p-4 rounded-md border border-slate-200 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2 flex items-center justify-between">
              <span>SHAP Feature Impact Contributions</span>
              <span className="text-[9px] font-mono text-slate-400">Explainable AI</span>
            </span>

            <ul className="space-y-2.5">
              {analysis.shapContributions.map((shap, idx) => (
                <li key={idx} className="text-[11px]">
                  <div className="flex items-center justify-between font-semibold mb-0.5">
                    <span className="text-slate-800">{shap.label}</span>
                    <span className={`font-mono text-[10px] px-1.5 py-0.2 rounded ${
                      shap.impact === 'increases_fault_risk' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {shap.shapValue > 0 ? `+${shap.shapValue}` : shap.shapValue}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[10px] leading-tight">{shap.description}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Recommended Action & Deep Investigation */}
          <div className="bg-white p-4 rounded-md border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Recommended Action & Protocol
              </span>
              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded text-blue-950 font-medium text-[11px] leading-relaxed">
                {analysis.recommendedAction}
              </div>

              <div className="mt-3 text-[10px] text-slate-400 leading-tight">
                * Operator protocol: Anomaly record is permanently logged for IMD audit trail compliance.
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-slate-100 flex flex-col gap-2">
              {selectedStationAnomaly && (
                <button
                  onClick={() => {
                    setSelectedAnomalyId(selectedStationAnomaly.id);
                    if (onOpenAnomalyDetails) {
                      onOpenAnomalyDetails(selectedStationAnomaly.id);
                    } else {
                      setCurrentTab('anomalies');
                    }
                  }}
                  className="w-full px-3 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  View Full ML Pipeline Inspection
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
