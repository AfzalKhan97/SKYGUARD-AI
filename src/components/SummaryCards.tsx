import React from 'react';
import { Radio, CheckCircle, AlertTriangle, AlertOctagon, ArrowUpRight, Database, ShieldAlert, CloudRain } from 'lucide-react';
import { useStation } from '../context/StationContext';

interface SummaryCardsProps {
  onFilterChange?: (status: 'all' | 'healthy' | 'attention' | 'critical') => void;
  activeFilter?: string;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ onFilterChange, activeFilter = 'all' }) => {
  const { counts, datasetReport } = useStation();

  const cards = [
    {
      id: 'all',
      title: 'Monitored AWS Stations',
      value: `${counts.total} Stations`,
      badge: '3 GHCNh + Network',
      subtitle: `${datasetReport.totalRows.toLocaleString()} verified observations (2023)`,
      icon: Radio,
      borderColor: 'border-slate-200',
      badgeColor: 'bg-slate-100 text-slate-700',
      textColor: 'text-slate-900',
      activeBorder: 'ring-2 ring-slate-400',
    },
    {
      id: 'healthy',
      title: 'Nominal Quality',
      value: counts.healthy,
      badge: `${datasetReport.targetClassDistribution.normal.percentage}% Dataset Rate`,
      subtitle: 'Values strictly within thermodynamic bounds',
      icon: CheckCircle,
      borderColor: 'border-emerald-200',
      badgeColor: 'bg-emerald-50 text-emerald-700',
      textColor: 'text-emerald-700',
      activeBorder: 'ring-2 ring-emerald-500',
    },
    {
      id: 'attention',
      title: 'Attention / Degradation',
      value: counts.attention,
      badge: 'Watch / Drift',
      subtitle: 'Calibration drift, sensor bias & transducer latch-up',
      icon: AlertTriangle,
      borderColor: 'border-amber-200',
      badgeColor: 'bg-amber-50 text-amber-700',
      textColor: 'text-amber-700',
      activeBorder: 'ring-2 ring-amber-500',
    },
    {
      id: 'critical',
      title: 'Critical Sensor Faults',
      value: counts.critical,
      badge: `${datasetReport.targetClassDistribution.sensor_data_anomaly.count} in Dataset`,
      subtitle: 'Severe hardware spikes & telemetry dropouts',
      icon: AlertOctagon,
      borderColor: 'border-rose-200',
      badgeColor: 'bg-rose-50 text-rose-700',
      textColor: 'text-rose-700',
      activeBorder: 'ring-2 ring-rose-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {cards.map((card) => {
        const Icon = card.icon;
        const isSelected = activeFilter === card.id;

        return (
          <div
            key={card.id}
            id={`summary-card-${card.id}`}
            onClick={() => onFilterChange && onFilterChange(card.id as any)}
            className={`
              bg-white p-3.5 sm:p-4 rounded-lg border ${card.borderColor} shadow-xs transition-all cursor-pointer hover:shadow-md
              ${isSelected ? card.activeBorder : ''}
            `}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-600">{card.title}</span>
              <div className={`p-1.5 rounded-md ${card.badgeColor}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline justify-between">
              <span className={`text-xl sm:text-2xl font-bold tracking-tight ${card.textColor}`}>
                {card.value}
              </span>
              <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                {card.badge}
              </span>
            </div>

            <p className="text-[11px] text-slate-500 mt-1.5 leading-snug">
              {card.subtitle}
            </p>
          </div>
        );
      })}
    </div>
  );
};
