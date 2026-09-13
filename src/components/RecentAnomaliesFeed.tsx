import React from 'react';
import { 
  AlertOctagon, 
  TrendingUp, 
  Snowflake, 
  WifiOff, 
  CloudLightning, 
  ChevronRight, 
  ShieldAlert,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { AnomalyRecord } from '../types';
import { useStation } from '../context/StationContext';

interface RecentAnomaliesFeedProps {
  onInvestigate?: (anomalyId: string) => void;
}

export const RecentAnomaliesFeed: React.FC<RecentAnomaliesFeedProps> = ({ onInvestigate }) => {
  const { anomalies, setSelectedAnomalyId, setSelectedStationId, setCurrentTab } = useStation();

  const getAnomalyIcon = (type: string) => {
    switch (type) {
      case 'Sensor Spike': return AlertOctagon;
      case 'Sensor Drift': return TrendingUp;
      case 'Frozen Sensor': return Snowflake;
      case 'Missing Data': return WifiOff;
      case 'Genuine Weather Event': return CloudLightning;
      default: return AlertOctagon;
    }
  };

  const handleInspect = (anomaly: AnomalyRecord) => {
    setSelectedAnomalyId(anomaly.id);
    setSelectedStationId(anomaly.stationId);
    if (onInvestigate) {
      onInvestigate(anomaly.id);
    } else {
      setCurrentTab('anomalies');
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Recent Anomaly Detections</span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
              {anomalies.filter(a => a.status !== 'Resolved').length} Active
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time multi-sensor fault flags and genuine weather event classifications
          </p>
        </div>

        <button
          onClick={() => setCurrentTab('anomalies')}
          className="text-xs font-semibold text-blue-900 hover:text-blue-950 inline-flex items-center gap-1"
        >
          View All Logs
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
        {anomalies.slice(0, 4).map((anom) => {
          const Icon = getAnomalyIcon(anom.anomalyType);
          const isCritical = anom.severity === 'critical';
          const isWarning = anom.severity === 'warning';
          const isWeatherEvent = anom.anomalyType === 'Genuine Weather Event';

          return (
            <div
              key={anom.id}
              id={`recent-anomaly-card-${anom.id}`}
              onClick={() => handleInspect(anom)}
              className={`
                p-3.5 rounded-lg border transition-all cursor-pointer hover:shadow-md flex flex-col justify-between
                ${isCritical 
                  ? 'border-rose-200 bg-rose-50/40 hover:bg-rose-50/70' 
                  : isWarning
                  ? 'border-amber-200 bg-amber-50/40 hover:bg-amber-50/70'
                  : 'border-blue-200 bg-blue-50/30 hover:bg-blue-50/60'}
              `}
            >
              <div>
                {/* Card Top: Type, Severity badge & Confidence */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-md ${
                      isCritical ? 'bg-rose-100 text-rose-700' :
                      isWarning ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 leading-tight">
                        {anom.anomalyType}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {anom.stationId} • {anom.stationName}
                      </p>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    isCritical ? 'bg-rose-100 text-rose-800' :
                    isWarning ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {anom.severity}
                  </span>
                </div>

                {/* Values & Confidence Row */}
                <div className="grid grid-cols-2 gap-2 my-2 py-2 border-y border-slate-200/60 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Observed Reading</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {anom.observedValue} {anom.unit && !anom.observedValue.toString().includes('°') ? anom.unit : ''}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">AI Confidence</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 text-sm">{anom.confidence}%</span>
                      <div className="w-12 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${isCritical ? 'bg-rose-600' : 'bg-blue-600'}`}
                          style={{ width: `${anom.confidence}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Likely Cause */}
                <div className="text-[11px] text-slate-600 mb-2">
                  <span className="font-semibold text-slate-800">Likely cause: </span>
                  <span>{anom.explanation.split('.')[0]}.</span>
                </div>
              </div>

              {/* Action Footer */}
              <div className="pt-2 mt-1 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-mono text-[10px]">
                  Detected: {anom.timestamp}
                </span>
                <span className="font-semibold text-blue-900 hover:text-blue-950 inline-flex items-center gap-1">
                  Investigate Evidence
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
