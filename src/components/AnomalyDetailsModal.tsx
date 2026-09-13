import React, { useState } from 'react';
import { 
  AlertOctagon, 
  TrendingUp, 
  Snowflake, 
  WifiOff, 
  CloudLightning, 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Wrench, 
  ShieldAlert, 
  Sparkles,
  BarChart3,
  Activity,
  Layers,
  ArrowRight,
  Database,
  Search,
  Cpu,
  FileCheck2,
  Lock
} from 'lucide-react';
import { AnomalyRecord, AnomalyStatus } from '../types';
import { useStation } from '../context/StationContext';

interface AnomalyDetailsModalProps {
  anomalyId?: string;
  onBack?: () => void;
}

export const AnomalyDetailsModal: React.FC<AnomalyDetailsModalProps> = ({ anomalyId, onBack }) => {
  const { anomalies, selectedAnomalyId, setSelectedAnomalyId, resolveAnomaly, setSelectedStationId, setCurrentTab } = useStation();
  
  const targetId = anomalyId || selectedAnomalyId;
  const anomaly = anomalies.find(a => a.id === targetId) || anomalies[0];

  const [operatorNote, setOperatorNote] = useState(anomaly?.operatorNotes || '');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  if (!anomaly) {
    return (
      <div className="p-8 text-center text-slate-500 text-sm">
        No anomaly selected for investigation.
      </div>
    );
  }

  const handleAction = (status: AnomalyStatus, feedbackMsg: string) => {
    resolveAnomaly(anomaly.id, status, operatorNote);
    setActionSuccess(feedbackMsg);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const getAnomalyIcon = () => {
    switch (anomaly.rootCause) {
      case 'spike': return AlertOctagon;
      case 'drift': return TrendingUp;
      case 'frozen': return Snowflake;
      case 'communication_failure': return WifiOff;
      default: return anomaly.classification === 'genuine_weather' ? CloudLightning : AlertOctagon;
    }
  };

  const Icon = getAnomalyIcon();
  const ev = anomaly.evidenceVector;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            if (onBack) onBack();
            else setSelectedAnomalyId(null);
          }}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-md shadow-xs transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Anomaly Feed
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Incident Record:</span>
          <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-100 rounded text-slate-800 border border-slate-200">
            {anomaly.id}
          </span>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-md text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* SYSTEM FLOW PIPELINE VISUALIZER (As mandated by problem statement) */}
      <div className="bg-slate-900 text-white rounded-lg p-4 shadow-sm border border-slate-800">
        <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
          <span className="text-[11px] font-bold tracking-wider uppercase text-blue-300 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            End-to-End Decision Pipeline Architecture
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            AWS DATA → VALIDATION → DETECTION → DIAGNOSIS → SHAP EXPLANATION → ACTION
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
          {/* Step 1: AWS Data */}
          <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700">
            <span className="text-[9px] text-blue-400 font-mono block">STAGE 1</span>
            <span className="font-bold text-white block mt-0.5">AWS Data</span>
            <span className="text-[10px] text-slate-400 block mt-1">
              {anomaly.stationId} (3h interval)
            </span>
          </div>

          {/* Step 2: Validation */}
          <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700">
            <span className="text-[9px] text-blue-400 font-mono block">STAGE 2</span>
            <span className="font-bold text-white block mt-0.5">Validation</span>
            <span className="text-[10px] text-slate-400 block mt-1">
              Phys. Range & Schema Verified
            </span>
          </div>

          {/* Step 3: Anomaly Detection */}
          <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700">
            <span className="text-[9px] text-rose-400 font-mono block">STAGE 3</span>
            <span className="font-bold text-rose-300 block mt-0.5">Detection</span>
            <span className="text-[10px] text-slate-400 block mt-1">
              11D Vector Flagged
            </span>
          </div>

          {/* Step 4: Diagnosis */}
          <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700">
            <span className="text-[9px] text-amber-400 font-mono block">STAGE 4</span>
            <span className="font-bold text-amber-300 block mt-0.5">Diagnosis</span>
            <span className="text-[10px] text-slate-400 block mt-1">
              {anomaly.rootCause.replace('_', ' ').toUpperCase()}
            </span>
          </div>

          {/* Step 5: SHAP Explanation */}
          <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700">
            <span className="text-[9px] text-purple-400 font-mono block">STAGE 5</span>
            <span className="font-bold text-purple-300 block mt-0.5">SHAP AI</span>
            <span className="text-[10px] text-slate-400 block mt-1">
              Feature Attribution
            </span>
          </div>

          {/* Step 6: Action */}
          <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700">
            <span className="text-[9px] text-emerald-400 font-mono block">STAGE 6</span>
            <span className="font-bold text-emerald-300 block mt-0.5">Correction</span>
            <span className="text-[10px] text-slate-400 block mt-1 font-mono">
              {typeof anomaly.estimatedValue === 'number' ? `${anomaly.estimatedValue}${anomaly.unit}` : 'Imputed'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Anomaly Summary Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          
          <div className="flex items-start gap-3">
            <div className={`p-3 rounded-lg ${
              anomaly.severity === 'critical' ? 'bg-rose-100 text-rose-800' :
              anomaly.severity === 'warning' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
            }`}>
              <Icon className="w-6 h-6" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="font-mono text-xs font-bold text-slate-600">
                  {anomaly.stationId}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs font-semibold text-slate-800">
                  {anomaly.stationName}, {anomaly.state}
                </span>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                  anomaly.severity === 'critical' ? 'bg-rose-100 text-rose-800' :
                  anomaly.severity === 'warning' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {anomaly.severity}
                </span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                  anomaly.status === 'Active' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                  anomaly.status === 'Under Investigation' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                  'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  {anomaly.status}
                </span>
              </div>

              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {anomaly.anomalyType} Flagged on {anomaly.parameter.toUpperCase()}
              </h1>
              
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Observation Timestamp: <strong className="text-slate-700">{anomaly.timestamp}</strong>
              </p>
            </div>
          </div>

          {/* Three-Way Model Probabilities */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 min-w-[220px]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
              XGBoost 3-Way Calibrated Output
            </span>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">Sensor Fault:</span>
                <span className="font-mono font-bold text-rose-700">{(anomaly.probabilities.sensor_fault * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Uncertain / Screening:</span>
                <span className="font-mono font-bold text-amber-700">{(anomaly.probabilities.uncertain * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Genuine Weather:</span>
                <span className="font-mono font-bold text-emerald-700">{(anomaly.probabilities.genuine_weather * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>

        </div>

        {/* Observed vs Estimated Comparison Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-5 p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs">
          <div className="bg-white p-3 rounded border border-slate-200">
            <span className="text-[10px] font-bold uppercase text-slate-500 block">Observed Reading (Raw)</span>
            <span className="text-xl font-bold font-mono text-rose-700 block mt-1">
              {anomaly.observedValue} {typeof anomaly.observedValue === 'number' ? anomaly.unit : ''}
            </span>
            <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
              <Lock className="w-3 h-3 text-slate-400" />
              Raw observation preserved in audit store
            </span>
          </div>

          <div className="bg-white p-3 rounded border border-slate-200">
            <span className="text-[10px] font-bold uppercase text-slate-500 block">ML Corrected / Estimated</span>
            <span className="text-xl font-bold font-mono text-emerald-700 block mt-1">
              {anomaly.estimatedValue} {typeof anomaly.estimatedValue === 'number' ? anomaly.unit : ''}
            </span>
            <span className="text-[10px] text-slate-400">
              Confidence: {(anomaly.correction.correction_confidence * 100).toFixed(0)}% ({anomaly.correction.correction_method})
            </span>
          </div>

          <div className="bg-white p-3 rounded border border-slate-200">
            <span className="text-[10px] font-bold uppercase text-slate-500 block">Root Cause Diagnosis</span>
            <span className="text-lg font-bold capitalize text-slate-900 block mt-1 truncate">
              {anomaly.rootCause.replace('_', ' ')}
            </span>
            <span className="text-[10px] text-slate-400">Classification: {anomaly.classification}</span>
          </div>
        </div>

        {/* 11-Dimensional Evidence Vector */}
        <div className="my-5 bg-white p-4 rounded-md border border-slate-200">
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-blue-900" />
              <span>11-Dimensional Evidence Vector Scores</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Normalized [0, 1]</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
            {Object.entries(ev).map(([key, val]) => (
              <div key={key} className="p-2 bg-slate-50 rounded border border-slate-100">
                <div className="flex justify-between text-[10px] font-semibold text-slate-700 capitalize">
                  <span className="truncate">{key.replace('_', ' ')}</span>
                  <span className="font-mono text-blue-900 font-bold">{(val as number).toFixed(2)}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1 mt-1 overflow-hidden">
                  <div 
                    className={`h-1 rounded-full ${
                      (val as number) >= 0.75 ? 'bg-rose-500' :
                      (val as number) >= 0.45 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, (val as number) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SHAP Feature Impact Contributions */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-900" />
              <span>Explainable AI — SHAP Feature Impact Breakdown</span>
            </h3>
            <span className="text-[11px] text-slate-500">Why was this flagged?</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {anomaly.shapContributions.map((shap, idx) => (
              <div 
                key={idx}
                className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-800 text-xs">{shap.label}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                      shap.impact === 'increases_fault_risk' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {shap.shapValue > 0 ? `+${shap.shapValue}` : shap.shapValue}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-snug">
                    {shap.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Diagnostic Explanation & Recommended Action */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5 pt-4 border-t border-slate-100 text-xs">
          
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <h4 className="font-bold text-slate-900 mb-1">Meteorological Diagnostic Summary</h4>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              {anomaly.explanation}
            </p>
          </div>

          <div className="p-3.5 bg-blue-50/60 rounded-lg border border-blue-200">
            <h4 className="font-bold text-blue-950 mb-1 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-blue-800" />
              Recommended Action
            </h4>
            <p className="text-blue-900 leading-relaxed text-[11px]">
              {anomaly.recommendedAction}
            </p>
          </div>

        </div>

        {/* Operator Resolution & Workflow Controls */}
        <div className="mt-6 pt-5 border-t border-slate-200">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
            Operator Review & Resolution
          </h4>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <textarea
                value={operatorNote}
                onChange={(e) => setOperatorNote(e.target.value)}
                placeholder="Add operator notes (e.g. Verified against regional radar; PT100 terminal cleaned; sensor recalibrated)..."
                rows={2}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-700"
              />
            </div>

            <div className="flex flex-col gap-2 justify-center">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleAction('Under Investigation', 'Incident assigned for calibration inspection')}
                  className="px-3 py-2 bg-amber-50 text-amber-800 border border-amber-200 rounded text-xs font-semibold hover:bg-amber-100 transition"
                >
                  Mark Under Review
                </button>
                <button
                  onClick={() => handleAction('Resolved', 'Sensor calibrated & anomaly marked Resolved')}
                  className="px-3 py-2 bg-emerald-700 text-white rounded text-xs font-semibold hover:bg-emerald-800 transition"
                >
                  Resolve & Calibrate
                </button>
              </div>

              <button
                onClick={() => handleAction('False Positive', 'Marked as Genuine Meteorological Event')}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 rounded text-xs font-medium transition"
              >
                Mark as Genuine Weather Event
              </button>
            </div>
          </div>

          {anomaly.resolvedBy && (
            <div className="mt-3 text-[11px] text-slate-500 font-mono">
              Actioned by {anomaly.resolvedBy} at {anomaly.resolvedAt}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
