import React, { useState } from 'react';
import { 
  Play, 
  FlaskConical, 
  CheckCircle, 
  AlertOctagon, 
  TrendingUp, 
  Snowflake, 
  WifiOff, 
  CloudLightning,
  ChevronRight,
  Sliders
} from 'lucide-react';
import { SimulationScenario } from '../types';
import { useStation } from '../context/StationContext';

export const SimulationController: React.FC = () => {
  const { currentScenario, setScenario, setCurrentTab, setSelectedStationId } = useStation();
  const [isExpanded, setIsExpanded] = useState(true);

  const scenarios: { 
    id: SimulationScenario; 
    label: string; 
    station: string; 
    stationId: string;
    description: string; 
    observed: string;
    estimated: string;
    rootCause: string;
    type: string;
    icon: React.FC<{ className?: string }>;
    accentColor: string;
  }[] = [
    {
      id: 'NORMAL',
      label: '1. Normal Baseline',
      station: 'Dehradun (INM00042111)',
      stationId: 'INM00042111',
      description: 'All meteorological channels operating within nominal physical bounds.',
      observed: '24.2°C / 88% RH',
      estimated: '24.2°C (Valid)',
      rootCause: 'None (Nominal Diurnal Curve)',
      type: 'Normal',
      icon: CheckCircle,
      accentColor: 'border-emerald-200 text-emerald-800 bg-emerald-50 hover:bg-emerald-100',
    },
    {
      id: 'TEMPERATURE_SPIKE',
      label: '2. Temperature Spike',
      station: 'Delhi Safdarjung (INI0000VIDD)',
      stationId: 'INI0000VIDD',
      description: 'Test payload from DATA_SCHEMA.md: Instantaneous +22.6°C jump to 55.0°C.',
      observed: '55.0°C (Fault)',
      estimated: '32.4°C',
      rootCause: 'Sensor Spike (Hardware ADC Fault)',
      type: 'Critical Fault',
      icon: AlertOctagon,
      accentColor: 'border-rose-200 text-rose-800 bg-rose-50 hover:bg-rose-100',
    },
    {
      id: 'SENSOR_DRIFT',
      label: '3. Sensor Drift',
      station: 'Jodhpur Airport (INI0000VIJO)',
      stationId: 'INI0000VIJO',
      description: 'Gradual +4.8°C positive bias expanding across 14 consecutive diurnal cycles.',
      observed: '38.6°C (+4.8°C)',
      estimated: '33.8°C',
      rootCause: 'Calibration Drift (Radiation Shield Aging)',
      type: 'Warning',
      icon: TrendingUp,
      accentColor: 'border-amber-200 text-amber-800 bg-amber-50 hover:bg-amber-100',
    },
    {
      id: 'FROZEN_SENSOR',
      label: '4. Frozen / Stuck Sensor',
      station: 'Dehradun (INM00042111)',
      stationId: 'INM00042111',
      description: 'Temperature reading locked at static 24.2°C (σ²=0) across daytime insolation rise.',
      observed: '24.2°C (Static)',
      estimated: '26.8°C',
      rootCause: 'Frozen / Stuck Transducer (ADC Latch-Up)',
      type: 'Warning',
      icon: Snowflake,
      accentColor: 'border-cyan-200 text-cyan-800 bg-cyan-50 hover:bg-cyan-100',
    },
    {
      id: 'MISSING_DATA',
      label: '5. Missing Telemetry',
      station: 'Delhi Safdarjung (INI0000VIDD)',
      stationId: 'INI0000VIDD',
      description: 'Scheduled DCP 3-hour transmission window timed out / 0 bytes received.',
      observed: 'NULL / Dropout',
      estimated: '32.4°C (Imputed)',
      rootCause: 'Communication Failure (Packet Drop)',
      type: 'Critical Outage',
      icon: WifiOff,
      accentColor: 'border-purple-200 text-purple-800 bg-purple-50 hover:bg-purple-100',
    },
    {
      id: 'GENUINE_WEATHER_EVENT',
      label: '6. Genuine Weather Event',
      station: 'Delhi Safdarjung (INI0000VIDD)',
      stationId: 'INI0000VIDD',
      description: 'Kalbaishakhi squall line: Temp plunges 9.2°C, RH surges to 96%, verified by spatial network.',
      observed: '22.8°C / 96% RH',
      estimated: '22.8°C (Valid)',
      rootCause: 'None (Genuine Monsoon Squall)',
      type: 'Meteorological',
      icon: CloudLightning,
      accentColor: 'border-blue-200 text-blue-800 bg-blue-50 hover:bg-blue-100',
    },
  ];

  const active = scenarios.find(s => s.id === currentScenario) || scenarios[1];

  return (
    <section aria-label="Simulation controls" className="bg-white border border-slate-200 rounded-lg p-3 sm:p-4 mb-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 text-blue-900 rounded">
            <FlaskConical className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span>SIH Controlled Scenario Injector</span>
              <span className="font-normal normal-case text-slate-500 hidden md:inline">
                — Demonstrates 11D Evidence Vector & XGBoost 3-way decision logic
              </span>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 text-[11px]">Active Condition:</span>
          <span className="font-semibold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-[11px]">
            {active.label}
          </span>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-slate-400 hover:text-slate-700 text-xs px-1"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-3">
          {scenarios.map((scenario) => {
            const isCurrent = currentScenario === scenario.id;
            const Icon = scenario.icon;

            return (
              <button
                key={scenario.id}
                id={`scenario-btn-${scenario.id.toLowerCase()}`}
                onClick={() => setScenario(scenario.id)}
                className={`
                  p-2.5 text-left rounded-md border text-xs transition-all flex flex-col justify-between min-h-[96px]
                  ${isCurrent 
                    ? 'ring-2 ring-blue-800 border-blue-700 bg-blue-50/50 shadow-xs' 
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70 text-slate-700'}
                `}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Icon className={`w-3.5 h-3.5 ${isCurrent ? 'text-blue-800' : 'text-slate-500'}`} />
                    <span className={`text-[9px] font-bold uppercase px-1 py-0.2 rounded ${
                      scenario.id === 'NORMAL' ? 'bg-emerald-100 text-emerald-800' :
                      scenario.id === 'TEMPERATURE_SPIKE' ? 'bg-rose-100 text-rose-800' :
                      scenario.id === 'GENUINE_WEATHER_EVENT' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {scenario.type.split(' ')[0]}
                    </span>
                  </div>
                  <p className="font-semibold text-slate-900 text-[11px] leading-tight mb-0.5">
                    {scenario.label.replace(/^\d+\.\s*/, '')}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">{scenario.station.split(' ')[0]}</p>
                </div>

                <div className="pt-1 mt-1 border-t border-slate-100 text-[10px] font-mono text-slate-600 flex justify-between">
                  <span>{scenario.observed.split(' ')[0]}</span>
                  <span className="text-slate-400">→</span>
                  <span className={`font-semibold ${isCurrent ? 'text-blue-900' : 'text-slate-700'}`}>
                    {scenario.estimated.split(' ')[0]}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Real-time Pipeline Flow Banner */}
      <div className="mt-3 bg-slate-50 border border-slate-200 rounded-md p-2.5 text-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div className="flex items-start md:items-center gap-2">
            <span className="text-[10px] font-bold tracking-wider uppercase bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded shrink-0">
              Pipeline State
            </span>
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600">
              <span>Station: <strong className="text-slate-900">{active.station}</strong></span>
              <span className="text-slate-300">•</span>
              <span>Observed: <strong className="text-rose-700 font-mono">{active.observed}</strong></span>
              <span className="text-slate-300">•</span>
              <span>Corrected: <strong className="text-emerald-700 font-mono">{active.estimated}</strong></span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-800 font-medium">{active.rootCause}</span>
            </div>
          </div>

          <button
            onClick={() => {
              setSelectedStationId(active.stationId);
              setCurrentTab('stations');
            }}
            className="self-end md:self-auto inline-flex items-center gap-1 text-[11px] font-semibold text-blue-900 hover:text-blue-950 hover:underline"
          >
            Inspect {active.station.split(' ')[0]} Diagnosis
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
};
