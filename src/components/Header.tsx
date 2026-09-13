import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Search, 
  Bell, 
  User, 
  Menu, 
  X, 
  ShieldCheck, 
  Activity, 
  LogOut,
  ChevronDown,
  Clock,
  Sparkles,
  Wifi,
  WifiOff,
  Edit3,
  Sliders,
  FileText
} from 'lucide-react';
import { useStation } from '../context/StationContext';
import { EditProfileModal } from './EditProfileModal';

interface HeaderProps {
  onMobileMenuToggle: () => void;
  isMobileMenuOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onMobileMenuToggle, isMobileMenuOpen }) => {
  const { 
    currentUser, 
    logout, 
    counts, 
    isLiveUpdating, 
    toggleLiveUpdating,
    searchQuery,
    setSearchQuery,
    setSelectedStationId,
    setCurrentTab,
    stations,
    isProfileModalOpen,
    setIsProfileModalOpen
  } = useStation();

  const [timeString, setTimeString] = useState<string>('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const getInitials = (name: string) => {
    if (!name) return 'OP';
    const parts = name.replace(/^(Dr\.|Mr\.|Ms\.|Mrs\.|Prof\.)\s+/i, '').trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Live IST Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      };
      setTimeString(now.toLocaleDateString('en-IN', options) + ' IST');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const searchResults = searchQuery.trim() === '' ? [] : stations.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.state.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5);

  return (
    <>
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Left: Branding & Mobile Toggle */}
            <div className="flex items-center gap-3">
              <button
                id="mobile-menu-btn"
                onClick={onMobileMenuToggle}
                className="lg:hidden p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-hidden"
                aria-label="Toggle navigation menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <div 
                className="flex items-center gap-2.5 cursor-pointer"
                onClick={() => setCurrentTab('dashboard')}
              >
                <div className="w-9 h-9 rounded-lg bg-blue-900 text-white flex items-center justify-center font-bold text-lg shadow-xs">
                  <Radio className="w-5 h-5 text-blue-200" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-lg tracking-tight">SkyGuard AI</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                      SIH26073
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 hidden sm:block">AWS Data Quality & Anomaly Monitoring</p>
                </div>
              </div>
            </div>

            {/* Center: Search Bar */}
            <div className="hidden md:flex items-center flex-1 max-w-xs lg:max-w-sm mx-6 relative">
              <div className="relative w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="station-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchDropdown(true);
                  }}
                  onFocus={() => setShowSearchDropdown(true)}
                  placeholder="Search station or location (e.g. Vijayawada, AWS-031)..."
                  className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Search Dropdown */}
              {showSearchDropdown && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg py-1 z-50">
                  {searchResults.map(station => (
                    <div
                      key={station.id}
                      onClick={() => {
                        setSelectedStationId(station.id);
                        setCurrentTab('stations');
                        setShowSearchDropdown(false);
                        setSearchQuery('');
                      }}
                      className="px-3 py-2 text-xs hover:bg-slate-50 cursor-pointer flex items-center justify-between border-b border-slate-100 last:border-0"
                    >
                      <div>
                        <span className="font-semibold text-slate-900">{station.name}</span>
                        <span className="text-slate-500 ml-1.5 text-[11px]">({station.id} • {station.state})</span>
                      </div>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded capitalize ${
                        station.status === 'healthy' ? 'bg-emerald-50 text-emerald-700' :
                        station.status === 'attention' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {station.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Telemetry status, Clock, Alerts & User Profile */}
            <div className="flex items-center gap-3 sm:gap-4">
              
              {/* Live Stream Toggle Indicator */}
              <button
                id="live-stream-toggle-btn"
                onClick={toggleLiveUpdating}
                title={isLiveUpdating ? "Live telemetry simulation active" : "Live stream paused"}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
              >
                <span className="relative flex h-2 w-2">
                  {isLiveUpdating ? (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </>
                  ) : (
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-400"></span>
                  )}
                </span>
                <span className="hidden xl:inline text-slate-600">
                  {isLiveUpdating ? 'Stream: Active' : 'Stream: Paused'}
                </span>
              </button>

              {/* Current IST Time */}
              <div className="hidden lg:flex items-center gap-1.5 text-xs font-mono text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>{timeString || 'Loading time...'}</span>
              </div>

              {/* Quick Critical Alert Pill */}
              <button
                id="critical-alert-quick-btn"
                onClick={() => setCurrentTab('anomalies')}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition"
                title="Active Critical Alerts"
              >
                <Bell className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                <span>{counts.critical} Critical</span>
              </button>

              {/* User Profile Pill & Trigger */}
              <div className="relative">
                <button
                  id="user-profile-menu-btn"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 p-1.5 rounded-lg border border-transparent hover:border-slate-200 hover:bg-slate-50 transition focus:outline-hidden"
                >
                  <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                    {getInitials(currentUser.name)}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-semibold text-slate-900 leading-tight truncate max-w-[120px]">{currentUser.name}</p>
                    <p className="text-[10px] text-slate-500 leading-tight truncate max-w-[120px]">{currentUser.role || 'Operator'}</p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                </button>

                {/* Profile Menu Dropdown */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-lg shadow-xl py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/50">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-slate-900">{currentUser.name}</p>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">
                          {currentUser.badge}
                        </span>
                      </div>
                      <p className="text-slate-600 font-medium text-[11px] mt-0.5">{currentUser.role}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">{currentUser.email}</p>
                      <p className="text-[10px] text-slate-400 truncate">{currentUser.regionalCenter}</p>
                    </div>

                    <div className="px-2 py-1.5 space-y-0.5">
                      <button
                        id="header-edit-profile-action-btn"
                        onClick={() => {
                          setShowProfileMenu(false);
                          setIsProfileModalOpen(true);
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-md hover:bg-blue-50 text-blue-900 font-semibold flex items-center gap-2.5 transition"
                      >
                        <Edit3 className="w-4 h-4 text-blue-700" />
                        <span>Edit Profile & Details</span>
                      </button>

                      <button
                        onClick={() => {
                          setCurrentTab('settings');
                          setShowProfileMenu(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-slate-50 text-slate-700 flex items-center gap-2.5 transition"
                      >
                        <Sliders className="w-4 h-4 text-slate-500" />
                        <span>System Settings & Thresholds</span>
                      </button>

                      <button
                        onClick={() => {
                          setCurrentTab('reports');
                          setShowProfileMenu(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-slate-50 text-slate-700 flex items-center gap-2.5 transition"
                      >
                        <FileText className="w-4 h-4 text-slate-500" />
                        <span>QA & Validation Reports</span>
                      </button>
                    </div>

                    <div className="border-t border-slate-100 pt-1.5 px-2">
                      <button
                        id="logout-btn"
                        onClick={() => {
                          setShowProfileMenu(false);
                          logout();
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-rose-50 text-rose-600 flex items-center gap-2 font-medium transition"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      </header>

      {/* Global Edit Profile Modal */}
      <EditProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </>
  );
};
