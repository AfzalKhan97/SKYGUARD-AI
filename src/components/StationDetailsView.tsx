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
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { useStation } from '../context/StationContext';
import { TrendChart } from './TrendChart';
import { analyzeStationData } from '../services/anomalyEngine';

const useAnimatedNumber = (end: number, duration: number = 800) => {
  const [val, setVal] = React.useState(0);
  React.useEffect(() => {
    let startTimestamp: number | null = null;
    let animationFrameId: number;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4); // easeOutQuart
      setVal(progress === 1 ? end : end * ease);
      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      }
    };
    animationFrameId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animationFrameId);
  }, [end, duration]);
  return val;
};

const AnimatedEvidenceCard = ({ dim }: { dim: any }) => {
  const animatedVal = useAnimatedNumber(dim.val, 800);
  const [showTooltip, setShowTooltip] = React.useState(false);
  return (
    <div
      className="p-2 bg-slate-50 rounded border border-slate-100 cursor-pointer hover:bg-slate-100 transition relative"
      onClick={() => setShowTooltip(!showTooltip)}
    >
      <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
        <span>{dim.label}</span>
        <span className="font-mono text-blue-950 font-bold">{(animatedVal || 0).toFixed(2)}</span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-1.5 rounded-full ${animatedVal >= 0.75 ? 'bg-rose-500' :
            animatedVal >= 0.45 ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
          style={{ width: `${Math.min(100, animatedVal * 100)}%` }}
        />
      </div>
      <span className="text-[9px] text-slate-400 mt-1 block truncate">{dim.desc}</span>
      {showTooltip && (
        <div className="absolute top-full left-0 mt-1 z-50 w-48 p-2 bg-slate-800 text-slate-100 text-[10px] rounded shadow-lg whitespace-normal leading-tight">
          {dim.explanation}
        </div>
      )}
    </div>
  );
};

const ClickableShapItem = ({ shap }: { shap: any }) => {
  const [showTooltip, setShowTooltip] = React.useState(false);
  return (
    <li className="text-[11px] relative cursor-pointer group" onClick={() => setShowTooltip(!showTooltip)}>
      <div className="flex items-center justify-between font-semibold mb-0.5 p-1 rounded hover:bg-slate-50 transition">
        <span className="text-slate-800">{shap.label}</span>
        <span className={`font-mono text-[10px] px-1.5 py-0.2 rounded ${shap.impact === 'increases_fault_risk' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
          }`}>
          {shap.shapValue > 0 ? '+' : ''}{shap.shapValue.toFixed(2)}
        </span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-1">
        <div
          className={`h-1 rounded-full ${shap.impact === 'increases_fault_risk' ? 'bg-rose-400' : 'bg-emerald-400'}`}
          style={{ width: `${Math.min(100, Math.abs(shap.shapValue) * 30)}%` }}
        />
      </div>
      {showTooltip && (
        <div className="absolute top-full left-0 mt-1 z-50 w-56 p-2 bg-slate-800 text-slate-100 text-[10px] rounded shadow-lg whitespace-normal leading-tight">
          {shap.impact === 'increases_fault_risk'
            ? "Positive contribution: this feature increased the model's Sensor/Data Fault score."
            : "Negative contribution: this feature reduced the model's Sensor/Data Fault score."}
        </div>
      )}
    </li>
  );
};

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
    setCurrentTab,
    isAnalyzing,
    lastAnalysisResult,
    setIsControlledSimModalOpen,
    preferredChartParam,
    setPreferredChartParam
  } = useStation();

  if (!selectedStation) {
    return (
      <div className="p-8 text-center text-slate-500 text-sm">
        No station selected. Please select an Automatic Weather Station.
      </div>
    );
  }

  // Derive analysis data from recent active run or an existing real anomaly
  let analysis = lastAnalysisResult;
  if (!analysis && selectedStationAnomaly) {
    analysis = {
      anomalyDetected: true,
      classification: selectedStationAnomaly.classification,
      probabilities: selectedStationAnomaly.probabilities,
      rootCause: selectedStationAnomaly.rootCause,
      anomalyType: selectedStationAnomaly.anomalyType,
      severity: selectedStationAnomaly.severity,
      confidence: selectedStationAnomaly.confidence,
      evidenceVector: selectedStationAnomaly.evidenceVector,
      shapContributions: selectedStationAnomaly.shapContributions,
      observedValue: selectedStationAnomaly.observedValue,
      unit: selectedStationAnomaly.unit,
      affectedSensor: selectedStationAnomaly.parameter
    };
  }

  if (isAnalyzing) {
    return (
      <div className="p-8 flex flex-col items-center justify-center space-y-6 min-h-[400px]">
        <h3 className="text-xl font-bold text-slate-800 animate-pulse">ANALYZING...</h3>
        <p className="text-sm text-slate-500">Processing observation through SkyGuard ML pipeline...</p>
        <div className="w-full max-w-lg space-y-2 mt-4">
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
            <span className="text-blue-600 font-bold">✓ Observation received</span>
            <span className="text-blue-600 font-bold">✓ Preprocessing</span>
            <span className="text-blue-600 font-bold animate-pulse">● Building 11D Evidence</span>
            <span>○ XGBoost</span>
            <span>○ SHAP</span>
            <span>○ Diagnosis</span>
          </div>
          <style>{`
            @keyframes pipelineProgress {
              0% { width: 0%; }
              20% { width: 30%; }
              50% { width: 60%; }
              80% { width: 85%; }
              100% { width: 95%; }
            }
          `}</style>
          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
            <div className="h-1.5 rounded-full bg-blue-500" style={{ animation: "pipelineProgress 2.5s ease-out forwards" }}></div>
          </div>
        </div>
      </div>
    );
  }

  const isAnomaly = analysis ? analysis.anomalyDetected : false;
  const ev = analysis ? analysis.evidenceVector : null;

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
              <span className={`text-xs font-bold uppercase px-2.5 py-0.5 rounded-full ${selectedStation.status === 'healthy' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
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
                <span className={`text-xl font-bold font-mono ${selectedStation.sensorTrust.trust_score >= 80 ? 'text-emerald-700' :
                  selectedStation.sensorTrust.trust_score >= 60 ? 'text-amber-700' : 'text-rose-700'
                  }`}>
                  {selectedStation.sensorTrust.trust_score.toFixed(1)}/100
                </span>
              </div>
              <span className="text-[10px] text-slate-500 capitalize">
                Status: {selectedStation.sensorTrust.maintenance_status}
              </span>
            </div>

            {/* NEW: Inject Custom Anomaly Button */}
            <button
              onClick={() => setIsControlledSimModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold shadow-xs hover:shadow transition ml-2"
            >
              <Zap className="w-4 h-4 fill-current text-amber-400" />
              <span>INJECT CUSTOM ANOMALY</span>
            </button>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-right min-w-[130px]">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Degradation Risk
              </span>
              <div className="flex items-center justify-end gap-1 mt-0.5">
                <span className={`text-xl font-bold font-mono ${selectedStation.degradation.degradation_risk <= 0.3 ? 'text-emerald-700' :
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
        <div
          onClick={() => setPreferredChartParam('temperature')}
          className={`p-4 rounded-lg border shadow-xs cursor-pointer hover:border-blue-300 transition-colors ${analysis?.affectedSensor === 'temperature' && isAnomaly
            ? 'border-rose-300 ring-1 ring-rose-200 bg-rose-50/20'
            : preferredChartParam === 'temperature'
              ? 'border-blue-400 bg-blue-50/30 ring-1 ring-blue-300'
              : 'border-slate-200 bg-white'
            }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Thermometer className="w-4 h-4 text-blue-800" />
              Dry-Bulb Temperature
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${selectedStation.sensorHealth.temperature >= 90 ? 'bg-emerald-50 text-emerald-700' :
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
            <span>Temperature Data Quality</span>
            <span className="font-bold text-slate-700">Valid</span>
          </div>
        </div>

        {/* Humidity Channel */}
        <div
          onClick={() => setPreferredChartParam('humidity')}
          className={`p-4 rounded-lg border shadow-xs cursor-pointer hover:border-blue-300 transition-colors ${analysis?.affectedSensor === 'humidity' && isAnomaly
            ? 'border-rose-300 ring-1 ring-rose-200 bg-rose-50/20'
            : preferredChartParam === 'humidity'
              ? 'border-blue-400 bg-blue-50/30 ring-1 ring-blue-300'
              : 'border-slate-200 bg-white'
            }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Droplets className="w-4 h-4 text-sky-700" />
              Relative Humidity
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${selectedStation.sensorHealth.humidity >= 90 ? 'bg-emerald-50 text-emerald-700' :
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
            <span>Humidity Data Quality</span>
            <span className="font-bold text-slate-700">Valid</span>
          </div>
        </div>

        {/* Pressure Channel */}
        <div
          onClick={() => setPreferredChartParam('pressure')}
          className={`p-4 rounded-lg border shadow-xs cursor-pointer hover:border-blue-300 transition-colors ${analysis?.affectedSensor === 'pressure' && isAnomaly
            ? 'border-rose-300 ring-1 ring-rose-200 bg-rose-50/20'
            : preferredChartParam === 'pressure'
              ? 'border-blue-400 bg-blue-50/30 ring-1 ring-blue-300'
              : 'border-slate-200 bg-white'
            }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-slate-700" />
              Atmospheric Pressure
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${selectedStation.sensorHealth.pressure >= 90 ? 'bg-emerald-50 text-emerald-700' :
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
            <span>Pressure Data Quality</span>
            <span className="font-bold text-slate-700">Valid</span>
          </div>
        </div>

      </div>

      {/* Historical Trend Chart (Raw vs Corrected & 3-hour cycle) */}
      <TrendChart station={selectedStation} showStationSelector={false} />

      {!analysis ? (
        <div className="p-12 text-center border rounded-lg bg-slate-50/50 border-slate-200 shadow-xs">
          <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-700">Ready for analysis</h3>
          <p className="text-sm text-slate-500 mt-1">Select a scenario and click RUN AI ANALYSIS to evaluate this observation through the ML pipeline.</p>
        </div>
      ) : (
        <>
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
                <div className={`p-2 rounded-md ${isAnomaly && analysis.severity === 'critical' ? 'bg-rose-100 text-rose-800' :
                  isAnomaly && analysis.severity === 'warning' ? 'bg-amber-100 text-amber-800' :
                    'bg-emerald-100 text-emerald-800'
                  }`}>
                  {isAnomaly ? <ShieldAlert className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex flex-col gap-1 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                      <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">OBSERVATION</span>
                      <ArrowRight className="w-3 h-3" />
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">11D EVIDENCE</span>
                      <ArrowRight className="w-3 h-3" />
                      <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">XGBOOST</span>
                      <ArrowRight className="w-3 h-3" />
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">SHAP + DIAGNOSIS</span>
                    </span>
                  </div>
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
                  { label: 'Temporal', val: ev.temporal, desc: 'Autoregression dev', explanation: 'Measures deviation from recent temporal behaviour.' },
                  { label: 'Seasonal', val: ev.seasonal, desc: 'Diurnal envelope', explanation: 'Measures departure from expected diurnal or seasonal cycles.' },
                  { label: 'Change', val: ev.change, desc: 'Step rate of change', explanation: 'Measures the magnitude of sudden step changes.' },
                  { label: 'Multivariate', val: ev.multivariate, desc: 'Psychrometric diff', explanation: 'Measures consistency among temperature, pressure and humidity.' },
                  { label: 'Spatial', val: ev.spatial, desc: 'Neighbor residual', explanation: 'Measures consistency with available neighbouring station observations.' },
                  { label: 'History', val: ev.history, desc: 'Prior fault rate', explanation: 'Historical frequency of faults for this specific sensor.' },
                  { label: 'Physics', val: ev.physics, desc: 'Physical bounds', explanation: 'Checks plausibility against atmospheric physics and lapse rates.' },
                  { label: 'Spatial Coh.', val: ev.spatial_coherence, desc: 'Network agreement', explanation: 'Evaluates broad spatial agreement across the network.' },
                  { label: 'Temporal Coh.', val: ev.temporal_coherence, desc: 'Step consistency', explanation: 'Evaluates temporal consistency across multiple recent intervals.' },
                  { label: 'Multi Coh.', val: ev.multivariate_coherence, desc: 'T vs RH thermodynamic', explanation: 'Cross-checks thermodynamic invariants.' },
                  { label: 'Persistence', val: ev.persistence, desc: 'Duration in cycles', explanation: 'Measures how long suspicious behaviour continues.' },
                ].map((dim) => (
                  <AnimatedEvidenceCard key={dim.label} dim={dim} />
                ))}
              </div>
            </div>

            {/* Diagnosis, Evidence & Corrected Action Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 text-xs">

              {/* Col 1: Observed vs Estimated & Raw Preservation */}
              <div className="space-y-3 bg-white p-4 rounded-md border border-slate-200 shadow-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    ROOT CAUSE ANALYSIS
                  </span>
                  <div className="p-2.5 bg-slate-50 rounded border border-slate-200 space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Observed Value:</span>
                      <span className="font-mono font-bold text-slate-900">{analysis.observedValue} {analysis.unit}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-[10px] text-slate-500">
                      <span>Data Quality:</span>
                      <span className={`font-semibold px-1.5 py-0.2 rounded ${isAnomaly ? 'bg-rose-50 text-rose-800' : 'bg-emerald-50 text-emerald-800'}`}>
                        {isAnomaly ? 'Anomalous' : 'Nominal'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    AI DIAGNOSIS
                  </span>
                  <div className="p-2.5 bg-blue-50 border border-blue-100 rounded space-y-1.5">
                    <p className="text-[11px] font-bold text-blue-950">Classification: {analysis.classification}</p>
                    <p className="text-[11px] text-blue-900 leading-relaxed">
                      <span className="font-semibold">Why:</span> {analysis.anomalyDetected ? `Observation exhibits abnormal contextual behavior characteristic of a ${analysis.anomalyType}.` : 'Observation exhibits nominal behavior consistent with genuine weather patterns.'}
                    </p>
                    {analysis.anomalyDetected && (
                      <p className="text-[11px] text-blue-900">
                        <span className="font-semibold">Most influential evidence:</span> {analysis.shapContributions.slice(0, 2).map(s => s.label).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
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
                        <span className={`font-mono text-[10px] px-1.5 py-0.2 rounded ${shap.impact === 'increases_fault_risk' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                          {shap.shapValue > 0 ? `+${shap.shapValue.toFixed(2)}` : shap.shapValue.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[10px] leading-tight">
                        {shap.impact === 'increases_fault_risk' ? 'Increases fault likelihood' : 'Supports genuine weather'}
                      </p>
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
                    * Operator protocol: Anomaly record is permanently logged for audit trail compliance.
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
        </>
      )}
    </div>
  );
};
