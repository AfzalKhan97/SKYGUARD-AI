import React, { useState, useEffect } from 'react';
import { 
  X, 
  FlaskConical, 
  Zap, 
  RotateCcw, 
  Thermometer, 
  Droplets, 
  Gauge, 
  AlertOctagon, 
  TrendingUp, 
  TrendingDown, 
  WifiOff, 
  CheckCircle, 
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Info
} from 'lucide-react';
import { useStation } from '../context/StationContext';
import { ParameterType, ControlledAnomalyType } from '../types';

export const ControlledAnomalyModal: React.FC = () => {
  const { 
    isControlledSimModalOpen, 
    setIsControlledSimModalOpen, 
    stations, 
    injectControlledAnomaly, 
    activeControlledSim, 
    resetControlledSimulation 
  } = useStation();

  const [selectedStationId, setSelectedStationId] = useState<string>('INI0000VIDD');
  const [selectedParam, setSelectedParam] = useState<ParameterType>('temperature');
  const [selectedAnomalyType, setSelectedAnomalyType] = useState<ControlledAnomalyType>('spike');
  const [customVal, setCustomVal] = useState<string>('');

  // Selected station
  const station = stations.find(s => s.id === selectedStationId) || stations[0];

  // Base readings from current station
  const currentTemp = station.currentReadings.temperature ?? 32.4;
  const currentHum = station.currentReadings.humidity ?? 61.0;
  const currentPress = station.currentReadings.pressure ?? 997.8;

  // Calculate default auto-generated injected value based on selections
  const calculateDefaultInjected = (param: ParameterType, type: ControlledAnomalyType) => {
    if (param === 'temperature') {
      if (type === 'spike') return '55.0';
      if (type === 'drop') return '4.2';
      if (type === 'drift') return (currentTemp + 4.8).toFixed(1);
      if (type === 'missing') return 'NULL';
    } else if (param === 'humidity') {
      if (type === 'spike') return '99.5';
      if (type === 'drop') return '12.0';
      if (type === 'drift') return Math.min(100, Number((currentHum + 14.0).toFixed(1))).toFixed(1);
      if (type === 'missing') return 'NULL';
    } else if (param === 'pressure') {
      if (type === 'spike') return '1042.5';
      if (type === 'drop') return '920.0';
      if (type === 'drift') return (currentPress + 7.2).toFixed(1);
      if (type === 'missing') return 'NULL';
    }
    return '55.0';
  };

  // Keep custom value in sync when selections change
  useEffect(() => {
    const def = calculateDefaultInjected(selectedParam, selectedAnomalyType);
    setCustomVal(def);
  }, [selectedStationId, selectedParam, selectedAnomalyType]);

  if (!isControlledSimModalOpen) return null;

  const currentReadingFormatted = selectedParam === 'temperature'
    ? `${currentTemp}°C`
    : selectedParam === 'humidity'
    ? `${currentHum}%`
    : `${currentPress} hPa`;

  const injectedReadingFormatted = customVal === 'NULL' || selectedAnomalyType === 'missing'
    ? 'NULL / Dropout'
    : selectedParam === 'temperature'
    ? `${customVal}°C`
    : selectedParam === 'humidity'
    ? `${customVal}%`
    : `${customVal} hPa`;

  // Predictive Diagnosis preview info
  const getPreviewDiagnosis = () => {
    if (selectedParam === 'temperature') {
      if (selectedAnomalyType === 'spike') {
        return {
          title: '🔴 Temperature Spike Detected',
          confidence: 90,
          likelyCause: 'Sudden sensor spike / hardware fault',
          causeDetail: 'Physical step rate-of-change (+22.6°C) exceeds maximum allowable atmospheric gradient (+6.0°C/hr).',
          badge: 'Critical Fault',
          badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
        };
      } else if (selectedAnomalyType === 'drop') {
        return {
          title: '🔴 Temperature Plunge Fault Detected',
          confidence: 93,
          likelyCause: 'Sudden sensor drop / probe ground fault',
          causeDetail: 'Instantaneous temperature plunge uncorroborated by regional cold pool dynamics.',
          badge: 'Critical Fault',
          badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
        };
      } else if (selectedAnomalyType === 'drift') {
        return {
          title: '🟡 Temperature Sensor Drift Detected',
          confidence: 88,
          likelyCause: 'Sensor calibration drift / radiation shield degradation',
          causeDetail: 'Expanding positive thermal bias detected across consecutive diurnal cycles relative to cluster.',
          badge: 'Attention / Watch',
          badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
        };
      } else {
        return {
          title: '🔴 Telemetry Missing / Packet Dropout',
          confidence: 98,
          likelyCause: 'Communication failure / packet dropout / power loss',
          causeDetail: 'Scheduled DCP 3-hour transmission window timed out with 0 bytes received from sensor ADC.',
          badge: 'Critical Outage',
          badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
        };
      }
    } else if (selectedParam === 'humidity') {
      if (selectedAnomalyType === 'spike') {
        return {
          title: '🔴 Humidity Spike Fault Detected',
          confidence: 91,
          likelyCause: 'Capacitive polymer condensation lock-up / short circuit',
          causeDetail: 'Instantaneous RH jump to near 100% with zero precipitation and clear skies across neighboring stations.',
          badge: 'Critical Fault',
          badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
        };
      } else if (selectedAnomalyType === 'drop') {
        return {
          title: '🔴 Humidity Dropout Fault Detected',
          confidence: 89,
          likelyCause: 'Hygrometer open-circuit / transducer dislocation',
          causeDetail: 'Extreme unphysical dry-air dropout violating psychrometric vapor pressure constraints.',
          badge: 'Critical Fault',
          badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
        };
      } else if (selectedAnomalyType === 'drift') {
        return {
          title: '🟡 Humidity Sensor Drift Detected',
          confidence: 86,
          likelyCause: 'Hygrometer polymer aging / recalibration required',
          causeDetail: 'Systematic humidity upward bias persisting during daytime solar minimum RH window.',
          badge: 'Attention / Watch',
          badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
        };
      } else {
        return {
          title: '🔴 Humidity Telemetry Missing',
          confidence: 98,
          likelyCause: 'Hygrometer channel communication timeout',
          causeDetail: 'Missing telemetry packet on relative humidity sensor channel.',
          badge: 'Critical Outage',
          badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
        };
      }
    } else {
      if (selectedAnomalyType === 'spike') {
        return {
          title: '🔴 Pressure Spike Fault Detected',
          confidence: 94,
          likelyCause: 'Piezoresistive pressure transducer overload / reference port blocked',
          causeDetail: 'Barometric jump exceeds highest recorded atmospheric pressure differential.',
          badge: 'Critical Fault',
          badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
        };
      } else if (selectedAnomalyType === 'drop') {
        return {
          title: '🔴 Pressure Plunge Fault Detected',
          confidence: 96,
          likelyCause: 'Barometer diaphragm leakage / ADC reference fault',
          causeDetail: 'Pressure reading would correspond to Category 5 cyclone eye, physically implausible.',
          badge: 'Critical Fault',
          badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
        };
      } else if (selectedAnomalyType === 'drift') {
        return {
          title: '🟡 Barometric Pressure Drift Detected',
          confidence: 87,
          likelyCause: 'Barometric transducer zero-point drift',
          causeDetail: 'Systematic offset from hydrostatic pressure equilibrium and regional tendencies.',
          badge: 'Attention / Watch',
          badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
        };
      } else {
        return {
          title: '🔴 Barometer Telemetry Missing',
          confidence: 98,
          likelyCause: 'Barometer serial bus bus-off / timeout',
          causeDetail: 'Null reading received on pressure transducer telemetry port.',
          badge: 'Critical Outage',
          badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
        };
      }
    }
  };

  const preview = getPreviewDiagnosis();

  const handleInject = () => {
    const valToSend = selectedAnomalyType === 'missing' ? null : customVal;
    injectControlledAnomaly({
      stationId: selectedStationId,
      parameter: selectedParam,
      anomalyType: selectedAnomalyType,
      customInjectedValue: valToSend,
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-900 text-white rounded-lg shadow-xs">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Controlled Anomaly Simulation</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                  Live ML Testbed
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Inject synthetic meteorological faults to validate real-time classification, evidence vectoring, and imputation.
              </p>
            </div>
          </div>

          <button
            id="close-anomaly-sim-modal"
            onClick={() => setIsControlledSimModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-md transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs text-slate-700 max-h-[78vh] overflow-y-auto">
          
          {/* Step 1: Select Station */}
          <div>
            <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
              1. Target AWS Station
            </label>
            <select
              id="sim-station-select"
              value={selectedStationId}
              onChange={(e) => setSelectedStationId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-700 focus:outline-hidden"
            >
              {stations.map(st => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.id}) — {st.region} Region • Current: {st.currentReadings.temperature ?? 'NULL'}°C, {st.currentReadings.humidity ?? 'NULL'}% RH
                </option>
              ))}
            </select>
          </div>

          {/* Step 2: Select Parameter */}
          <div>
            <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
              2. Meteorological Channel / Parameter
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'temperature' as ParameterType, label: 'Temperature', unit: '°C', icon: Thermometer },
                { id: 'humidity' as ParameterType, label: 'Relative Humidity', unit: '%', icon: Droplets },
                { id: 'pressure' as ParameterType, label: 'Barometric Pressure', unit: 'hPa', icon: Gauge },
              ].map((param) => {
                const Icon = param.icon;
                const isSelected = selectedParam === param.id;
                return (
                  <button
                    key={param.id}
                    id={`sim-param-${param.id}`}
                    type="button"
                    onClick={() => setSelectedParam(param.id)}
                    className={`
                      p-2.5 rounded-lg border text-left flex items-center gap-2.5 transition-all
                      ${isSelected 
                        ? 'border-blue-700 bg-blue-50/80 text-blue-900 ring-1 ring-blue-700 font-semibold shadow-xs' 
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'}
                    `}
                  >
                    <div className={`p-1.5 rounded ${isSelected ? 'bg-blue-800 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs leading-tight">{param.label}</p>
                      <p className="text-[10px] text-slate-500 font-mono">({param.unit})</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Select Anomaly Type */}
          <div>
            <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
              3. Anomaly Fault Mode
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { 
                  id: 'spike' as ControlledAnomalyType, 
                  label: 'Sudden Spike', 
                  desc: 'Instant high outlier',
                  icon: AlertOctagon,
                  color: 'text-rose-700 bg-rose-50' 
                },
                { 
                  id: 'drop' as ControlledAnomalyType, 
                  label: 'Sudden Drop', 
                  desc: 'Instant low plunge',
                  icon: TrendingDown,
                  color: 'text-rose-700 bg-rose-50' 
                },
                { 
                  id: 'drift' as ControlledAnomalyType, 
                  label: 'Sensor Drift', 
                  desc: 'Gradual bias expansion',
                  icon: TrendingUp,
                  color: 'text-amber-700 bg-amber-50' 
                },
                { 
                  id: 'missing' as ControlledAnomalyType, 
                  label: 'Missing Telemetry', 
                  desc: 'Zero-byte packet drop',
                  icon: WifiOff,
                  color: 'text-purple-700 bg-purple-50' 
                },
              ].map((anom) => {
                const Icon = anom.icon;
                const isSelected = selectedAnomalyType === anom.id;
                return (
                  <button
                    key={anom.id}
                    id={`sim-type-${anom.id}`}
                    type="button"
                    onClick={() => setSelectedAnomalyType(anom.id)}
                    className={`
                      p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all min-h-[72px]
                      ${isSelected 
                        ? 'border-blue-700 bg-blue-50/80 text-blue-950 ring-1 ring-blue-700 font-semibold shadow-xs' 
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'}
                    `}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold">{anom.label}</span>
                      <Icon className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                    <span className="text-[10px] text-slate-500 leading-tight">{anom.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 4: Comparison & Injected Value Display */}
          <div className="bg-slate-900 text-white rounded-lg p-4 shadow-sm border border-slate-800">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Telemetry Injection Transformation
              </span>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${preview.badgeColor}`}>
                {preview.badge}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
              {/* Current Value */}
              <div className="bg-slate-800/80 p-3 rounded-md border border-slate-700">
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                  Current Reading
                </span>
                <span className="text-lg font-mono font-bold text-emerald-400">
                  {currentReadingFormatted}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Baseline Nominal</span>
              </div>

              {/* Arrow */}
              <div className="hidden sm:flex flex-col items-center justify-center text-slate-400">
                <span className="text-[10px] font-mono text-slate-400 mb-1">Synthetic Injection</span>
                <ArrowRight className="w-5 h-5 text-blue-400" />
              </div>

              {/* Injected Abnormal Value */}
              <div className="bg-slate-800/80 p-3 rounded-md border border-rose-700/80">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-rose-300 uppercase font-bold">
                    Injected Reading
                  </span>
                  {selectedAnomalyType !== 'missing' && (
                    <span className="text-[9px] text-slate-400">Editable</span>
                  )}
                </div>
                {selectedAnomalyType === 'missing' ? (
                  <span className="text-lg font-mono font-bold text-rose-400">
                    NULL / Dropout
                  </span>
                ) : (
                  <div className="flex items-center gap-1">
                    <input
                      id="sim-custom-value-input"
                      type="number"
                      step="0.1"
                      value={customVal}
                      onChange={(e) => setCustomVal(e.target.value)}
                      className="w-24 bg-slate-900 border border-rose-500/80 rounded px-2 py-0.5 text-base font-mono font-bold text-rose-400 focus:outline-hidden focus:ring-1 focus:ring-rose-400"
                    />
                    <span className="text-sm font-mono font-bold text-rose-400">
                      {selectedParam === 'temperature' ? '°C' : selectedParam === 'humidity' ? '%' : 'hPa'}
                    </span>
                  </div>
                )}
                <span className="text-[10px] text-rose-300 block mt-0.5">
                  {selectedAnomalyType === 'spike' ? 'Extreme Outlier Jump' : selectedAnomalyType === 'drop' ? 'Sudden Negative Plunge' : selectedAnomalyType === 'drift' ? 'Positive Bias Offset' : 'Complete Packet Loss'}
                </span>
              </div>
            </div>

            {/* Generated AI Diagnosis Preview */}
            <div className="mt-3 pt-3 border-t border-slate-800 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-slate-300">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="font-bold text-white">{preview.title}</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span>AI Confidence: <strong className="text-emerald-400">{preview.confidence}%</strong></span>
                  <span>•</span>
                  <span>Expected: <strong className="text-blue-300">{currentReadingFormatted}</strong></span>
                </div>
              </div>

              <div className="mt-1.5 text-[11px] text-slate-400">
                <strong className="text-slate-300">Likely Cause: </strong>
                <span>{preview.likelyCause}</span> — <span className="text-slate-400">{preview.causeDetail}</span>
              </div>
            </div>
          </div>

          {/* Real-time Pipeline Walkthrough Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-[11px] text-blue-900">
            <div className="font-bold mb-1 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-blue-700" />
              <span>Full Pipeline Flow (30-Second Live Demonstration):</span>
            </div>
            <div className="flex flex-wrap items-center gap-1 font-mono text-[10px] text-blue-800">
              <span className="bg-white px-1.5 py-0.5 rounded border border-blue-200 font-semibold">Normal Reading</span>
              <span>→</span>
              <span className="bg-rose-100 text-rose-900 px-1.5 py-0.5 rounded border border-rose-300 font-semibold">Anomaly Injection</span>
              <span>→</span>
              <span className="bg-white px-1.5 py-0.5 rounded border border-blue-200 font-semibold">11D Evidence Vector</span>
              <span>→</span>
              <span className="bg-white px-1.5 py-0.5 rounded border border-blue-200 font-semibold">XGBoost 3-Way</span>
              <span>→</span>
              <span className="bg-rose-100 text-rose-900 px-1.5 py-0.5 rounded border border-rose-300 font-semibold">Critical Alert</span>
              <span>→</span>
              <span className="bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded border border-emerald-300 font-semibold">Estimated Value</span>
            </div>
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-2">
          {activeControlledSim ? (
            <button
              id="sim-modal-reset-btn"
              type="button"
              onClick={() => {
                resetControlledSimulation();
                setIsControlledSimModalOpen(false);
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Active Simulation</span>
            </button>
          ) : (
            <div className="text-[11px] text-slate-500 hidden sm:block">
              Temporary demo payload • Zero dataset mutation
            </div>
          )}

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              id="cancel-sim-modal-btn"
              type="button"
              onClick={() => setIsControlledSimModalOpen(false)}
              className="px-3.5 py-2 rounded-md border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition"
            >
              Cancel
            </button>

            <button
              id="inject-anomaly-btn"
              type="button"
              onClick={handleInject}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs hover:shadow transition"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Inject Anomaly</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
