import React from 'react';
import { 
  LayoutDashboard, 
  Radio, 
  AlertTriangle, 
  BarChart3, 
  FileText, 
  Sliders, 
  Layers, 
  CheckCircle2, 
  Server,
  HelpCircle,
  ExternalLink,
  Shield,
  User,
  Edit3
} from 'lucide-react';
import { NavigationTab } from '../types';
import { useStation } from '../context/StationContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { currentTab, setCurrentTab, counts, anomalies, currentUser, setIsProfileModalOpen } = useStation();

  const activeAnomaliesCount = anomalies.filter(a => a.status === 'Active' || a.status === 'Under Investigation').length;

  const navItems: { id: NavigationTab; label: string; icon: React.FC<{ className?: string }>; badge?: number; badgeType?: 'alert' | 'neutral' }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'stations', label: 'Stations', icon: Radio, badge: counts.total, badgeType: 'neutral' },
    { id: 'anomalies', label: 'Anomalies', icon: AlertTriangle, badge: activeAnomaliesCount, badgeType: 'alert' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Sliders },
  ];

  const handleNavClick = (tab: NavigationTab) => {
    setCurrentTab(tab);
    onClose();
  };

  const getInitials = (name: string) => {
    if (!name) return 'OP';
    const parts = name.replace(/^(Dr\.|Mr\.|Ms\.|Mrs\.|Prof\.)\s+/i, '').trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-16 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Navigation List */}
        <div className="p-3 space-y-1 overflow-y-auto">
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Monitoring & QC
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                className={`
                  w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-medium transition-colors
                  ${isActive 
                    ? 'bg-blue-900 text-white font-semibold shadow-xs' 
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'}
                `}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-200' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span className={`
                    text-[10px] font-bold px-1.5 py-0.5 rounded-full
                    ${item.badgeType === 'alert' && item.badge > 0
                      ? (isActive ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-700')
                      : (isActive ? 'bg-blue-800 text-blue-100' : 'bg-slate-100 text-slate-600')}
                  `}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-4 px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Data Quality Rules
          </div>
          
          <div className="px-3 py-2 text-[11px] text-slate-500 bg-slate-50 rounded-md border border-slate-100 space-y-1.5">
            <div className="flex items-center justify-between text-slate-700 font-medium">
              <span>WMO / IMD Standard</span>
              <span className="text-[10px] text-emerald-600 font-mono">QCv4.2</span>
            </div>
            <p className="text-[10px] leading-relaxed text-slate-500">
              Active: Rate-of-Change, Psychrometric consistency, Spatial consensus & Climatological bounds.
            </p>
          </div>
        </div>

        {/* Bottom Section: Operator Card & Network Health */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/50 space-y-2.5">
          
          {/* Operator Profile Quick Card */}
          <div className="bg-white p-2.5 rounded-md border border-slate-200 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                {getInitials(currentUser.name)}
              </div>
              <div className="overflow-hidden">
                <p className="text-[11px] font-semibold text-slate-900 truncate leading-tight">{currentUser.name}</p>
                <p className="text-[10px] text-slate-500 font-mono truncate leading-tight">{currentUser.badge}</p>
              </div>
            </div>

            <button
              id="sidebar-edit-profile-btn"
              onClick={() => setIsProfileModalOpen(true)}
              title="Edit Operator Profile Details"
              className="p-1 text-blue-700 hover:text-blue-950 hover:bg-blue-50 rounded transition shrink-0"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Network Link Status */}
          <div className="bg-white p-2.5 rounded-md border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-blue-700" />
                DCP Network Link
              </span>
              <span className="text-[10px] text-emerald-700 font-medium px-1.5 py-0.5 bg-emerald-50 rounded">
                Operational
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Healthy Stations</span>
                <span className="font-semibold text-slate-700">{counts.healthy} / {counts.total} ({Math.round((counts.healthy / counts.total) * 100)}%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-1.5 rounded-full" 
                  style={{ width: `${(counts.healthy / counts.total) * 100}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
              <span>Downlink: INSAT-3DR</span>
              <span className="font-mono">99.8% ACK</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
