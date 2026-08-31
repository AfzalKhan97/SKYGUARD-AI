import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Save, 
  ShieldCheck, 
  Bell, 
  Database, 
  Cpu, 
  RefreshCw, 
  CheckCircle2, 
  User, 
  Mail, 
  Phone, 
  Building, 
  MapPin, 
  Clock, 
  RotateCcw, 
  Briefcase, 
  Award, 
  Smartphone, 
  Volume2,
  Sparkles
} from 'lucide-react';
import { useStation } from '../context/StationContext';
import { UserProfile } from '../types';

export const SettingsView: React.FC = () => {
  const { currentUser, updateUserProfile, resetUserProfile } = useStation();

  const [activeTab, setActiveTab] = useState<'profile' | 'qc_thresholds'>('profile');
  
  // Profile form state
  const [profileForm, setProfileForm] = useState<UserProfile>(currentUser);
  const [profileSaved, setProfileSaved] = useState(false);

  // Sync profile form when currentUser changes
  useEffect(() => {
    setProfileForm(currentUser);
  }, [currentUser]);

  // QC settings state
  const [tempSpikeLimit, setTempSpikeLimit] = useState('6.0');
  const [humidityRateLimit, setHumidityRateLimit] = useState('20');
  const [spatialRadius, setSpatialRadius] = useState('150');
  const [confidenceCutoff, setConfidenceCutoff] = useState('85');
  const [qcSaved, setQcSaved] = useState(false);

  const handleProfileFieldChange = (field: keyof UserProfile, value: any) => {
    setProfileForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile(profileForm);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  const handleResetProfile = () => {
    resetUserProfile();
    setProfileForm(currentUser);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  const handleSaveQC = (e: React.FormEvent) => {
    e.preventDefault();
    setQcSaved(true);
    setTimeout(() => setQcSaved(false), 3000);
  };

  const getInitials = (name: string) => {
    const parts = name.replace(/^(Dr\.|Mr\.|Ms\.|Mrs\.|Prof\.)\s+/i, '').trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const rolePresets = [
    'Senior Meteorological Officer',
    'Lead QA/QC Specialist',
    'Regional Forecaster',
    'AWS Field Instrumentation Engineer',
    'Principal Meteorologist',
    'Automated Sensor Systems Analyst'
  ];

  const regionalCenters = [
    'RMC New Delhi (Mausam Bhawan)',
    'RMC Mumbai (Colaba Observatory)',
    'RMC Chennai (Meenambakkam)',
    'RMC Kolkata (Alipore Observatory)',
    'RMC Guwahati (Borjhar)',
    'RMC Nagpur (Central Division)'
  ];

  const shiftPresets = [
    '06:00 - 14:00 IST (Morning Operations)',
    '14:00 - 22:00 IST (Evening Operations)',
    '22:00 - 06:00 IST (Night Operations)',
    '09:00 - 17:30 IST (General Shift)'
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-800" />
            <span>System Settings & Operational Profile</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your IMD operator identity, contact credentials, regional center posting, and quality control tolerances
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold self-start md:self-auto">
          <button
            id="settings-tab-profile"
            onClick={() => setActiveTab('profile')}
            className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'bg-white text-blue-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Operator Profile & Identity</span>
          </button>
          <button
            id="settings-tab-qc"
            onClick={() => setActiveTab('qc_thresholds')}
            className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 ${
              activeTab === 'qc_thresholds'
                ? 'bg-white text-blue-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>QC Limit Thresholds</span>
          </button>
        </div>
      </div>

      {/* Profile Saved Toast */}
      {profileSaved && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-md text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Operator profile details successfully saved and updated across SkyGuard AI.</span>
        </div>
      )}

      {/* QC Saved Toast */}
      {qcSaved && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-md text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Quality control physical parameters successfully synchronized with automated ingest engine.</span>
        </div>
      )}

      {/* TAB 1: OPERATOR PROFILE */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          
          {/* Identity & Badge Card */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-900 text-white font-bold text-base flex items-center justify-center shadow-xs">
                  {getInitials(profileForm.name || 'RS')}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-900">{profileForm.name || 'Operator Name'}</h2>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-semibold">
                      {profileForm.badge || 'IMD-QC-9842'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{profileForm.role} • {profileForm.organization}</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold self-start sm:self-auto">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Active Authenticated Session
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Full Name */}
              <div>
                <label htmlFor="settings-profile-name" className="block text-slate-700 font-semibold mb-1">
                  Full Name & Salutation <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="settings-profile-name"
                    type="text"
                    required
                    value={profileForm.name}
                    onChange={(e) => handleProfileFieldChange('name', e.target.value)}
                    placeholder="e.g. Dr. Rajesh Sharma"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-700 text-slate-900 font-medium"
                  />
                </div>
              </div>

              {/* Badge ID */}
              <div>
                <label htmlFor="settings-profile-badge" className="block text-slate-700 font-semibold mb-1">
                  Employee Badge / Operator ID <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Award className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="settings-profile-badge"
                    type="text"
                    required
                    value={profileForm.badge}
                    onChange={(e) => handleProfileFieldChange('badge', e.target.value)}
                    placeholder="e.g. IMD-QC-9842"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-700 text-slate-900 font-mono"
                  />
                </div>
              </div>

              {/* Role */}
              <div className="md:col-span-2">
                <label htmlFor="settings-profile-role" className="block text-slate-700 font-semibold mb-1">
                  Designation / Role Title <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="settings-profile-role"
                    type="text"
                    required
                    value={profileForm.role}
                    onChange={(e) => handleProfileFieldChange('role', e.target.value)}
                    placeholder="e.g. Senior Meteorological Officer"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-700 text-slate-900"
                  />
                </div>
                {/* Role quick pills */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-400 self-center">Quick Presets:</span>
                  {rolePresets.map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleProfileFieldChange('role', preset)}
                      className={`text-[10px] px-2 py-0.5 rounded border transition ${
                        profileForm.role === preset
                          ? 'bg-blue-100 text-blue-900 border-blue-300 font-semibold'
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bio / Operational Scope */}
              <div className="md:col-span-2">
                <label htmlFor="settings-profile-bio" className="block text-slate-700 font-semibold mb-1">
                  Operational Responsibilities & Bio
                </label>
                <textarea
                  id="settings-profile-bio"
                  rows={2}
                  value={profileForm.bio || ''}
                  onChange={(e) => handleProfileFieldChange('bio', e.target.value)}
                  placeholder="Describe your station cluster coverage and quality assurance responsibilities..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-700 text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Contact & Regional Posting Card */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-700" />
              <span>Contact Details & Regional Met Center Posting</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Email */}
              <div>
                <label htmlFor="settings-profile-email" className="block text-slate-700 font-semibold mb-1">
                  Official IMD / Government Email <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="settings-profile-email"
                    type="email"
                    required
                    value={profileForm.email}
                    onChange={(e) => handleProfileFieldChange('email', e.target.value)}
                    placeholder="r.sharma@imd.gov.in"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-700 text-slate-900"
                  />
                </div>
              </div>

              {/* Duty Phone */}
              <div>
                <label htmlFor="settings-profile-phone" className="block text-slate-700 font-semibold mb-1">
                  Duty Contact Phone / Hotline
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="settings-profile-phone"
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => handleProfileFieldChange('phone', e.target.value)}
                    placeholder="+91 11 2461 8241"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-700 text-slate-900"
                  />
                </div>
              </div>

              {/* Organization */}
              <div>
                <label htmlFor="settings-profile-org" className="block text-slate-700 font-semibold mb-1">
                  Organization <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="settings-profile-org"
                    type="text"
                    required
                    value={profileForm.organization}
                    onChange={(e) => handleProfileFieldChange('organization', e.target.value)}
                    placeholder="India Meteorological Department"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-700 text-slate-900"
                  />
                </div>
              </div>

              {/* Division */}
              <div>
                <label htmlFor="settings-profile-div" className="block text-slate-700 font-semibold mb-1">
                  Division / Directorate
                </label>
                <input
                  id="settings-profile-div"
                  type="text"
                  value={profileForm.division}
                  onChange={(e) => handleProfileFieldChange('division', e.target.value)}
                  placeholder="Surface Instruments & AWS Quality Division"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-700 text-slate-900"
                />
              </div>

              {/* Regional Center */}
              <div>
                <label htmlFor="settings-profile-center" className="block text-slate-700 font-semibold mb-1">
                  Assigned Regional Meteorological Centre (RMC)
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    id="settings-profile-center"
                    value={profileForm.regionalCenter}
                    onChange={(e) => handleProfileFieldChange('regionalCenter', e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-700 text-slate-900"
                  >
                    {regionalCenters.map(center => (
                      <option key={center} value={center}>{center}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Operational Shift */}
              <div>
                <label htmlFor="settings-profile-shift" className="block text-slate-700 font-semibold mb-1">
                  Active Operational Shift
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    id="settings-profile-shift"
                    value={profileForm.shift}
                    onChange={(e) => handleProfileFieldChange('shift', e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-700 text-slate-900"
                  >
                    {shiftPresets.map(shift => (
                      <option key={shift} value={shift}>{shift}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Alert Preferences Card */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-700" />
              <span>Incident Notification & Dispatch Channels</span>
            </h2>

            <div className="space-y-2.5 pt-1 text-xs">
              <label className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer transition">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-blue-100 text-blue-800 flex items-center justify-center">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Email Quality Alert Digest</p>
                    <p className="text-[11px] text-slate-500">Send hourly digest and critical fault notifications to {profileForm.email}</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={profileForm.alertEmailEnabled}
                  onChange={(e) => handleProfileFieldChange('alertEmailEnabled', e.target.checked)}
                  className="w-4 h-4 text-blue-900 rounded border-slate-300 focus:ring-blue-800"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer transition">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-amber-100 text-amber-800 flex items-center justify-center">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">SMS Incident Emergency Dispatch</p>
                    <p className="text-[11px] text-slate-500">Instant SMS dispatch to {profileForm.phone} for hardware spike and frozen sensor events</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={profileForm.alertSmsEnabled}
                  onChange={(e) => handleProfileFieldChange('alertSmsEnabled', e.target.checked)}
                  className="w-4 h-4 text-blue-900 rounded border-slate-300 focus:ring-blue-800"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer transition">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-slate-200 text-slate-800 flex items-center justify-center">
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Audio Ingest Warning Sound</p>
                    <p className="text-[11px] text-slate-500">Play subtle audible chime on telemetry packets failing WMO limits</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={profileForm.soundAlertsEnabled}
                  onChange={(e) => handleProfileFieldChange('soundAlertsEnabled', e.target.checked)}
                  className="w-4 h-4 text-blue-900 rounded border-slate-300 focus:ring-blue-800"
                />
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleResetProfile}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold flex items-center gap-2 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Profile to Defaults</span>
            </button>

            <button
              id="save-profile-settings-btn"
              type="submit"
              className="px-6 py-2.5 bg-blue-900 hover:bg-blue-950 text-white rounded text-xs font-semibold flex items-center gap-2 shadow-xs transition"
            >
              <Save className="w-4 h-4" />
              <span>Save Profile Changes</span>
            </button>
          </div>

        </form>
      )}

      {/* TAB 2: QC LIMIT THRESHOLDS */}
      {activeTab === 'qc_thresholds' && (
        <form onSubmit={handleSaveQC} className="space-y-6">
          {/* Anomaly Detection Rules */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-700" />
              <span>1. Physical & Rate-of-Change Limit Thresholds</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label htmlFor="temp-spike-step" className="block text-slate-700 font-semibold mb-1">
                  Temperature Spike Step Threshold (ΔT max / 15-min)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="temp-spike-step"
                    type="number"
                    step="0.5"
                    value={tempSpikeLimit}
                    onChange={(e) => setTempSpikeLimit(e.target.value)}
                    className="w-32 bg-slate-50 border border-slate-200 rounded p-2 text-slate-900 font-mono"
                  />
                  <span className="text-slate-500">°C / interval</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Standard WMO recommendation: 5.0°C to 7.0°C
                </span>
              </div>

              <div>
                <label htmlFor="rh-step-jump" className="block text-slate-700 font-semibold mb-1">
                  Relative Humidity Step Jump Threshold (ΔRH)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="rh-step-jump"
                    type="number"
                    value={humidityRateLimit}
                    onChange={(e) => setHumidityRateLimit(e.target.value)}
                    className="w-32 bg-slate-50 border border-slate-200 rounded p-2 text-slate-900 font-mono"
                  />
                  <span className="text-slate-500">% / interval</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Disregards step jump if rainfall / gust front confirmed
                </span>
              </div>

              <div>
                <label htmlFor="spatial-neighbor-radius" className="block text-slate-700 font-semibold mb-1">
                  Spatial Neighbor Correlation Radius
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="spatial-neighbor-radius"
                    type="number"
                    value={spatialRadius}
                    onChange={(e) => setSpatialRadius(e.target.value)}
                    className="w-32 bg-slate-50 border border-slate-200 rounded p-2 text-slate-900 font-mono"
                  />
                  <span className="text-slate-500">kilometers (km)</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Defines spatial cluster envelope for neighbor cross-check
                </span>
              </div>

              <div>
                <label htmlFor="ml-confidence-cutoff" className="block text-slate-700 font-semibold mb-1">
                  ML Anomaly Confidence Filter Cutoff
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="ml-confidence-cutoff"
                    type="number"
                    value={confidenceCutoff}
                    onChange={(e) => setConfidenceCutoff(e.target.value)}
                    className="w-32 bg-slate-50 border border-slate-200 rounded p-2 text-slate-900 font-mono"
                  />
                  <span className="text-slate-500">% Confidence</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Alerts below this threshold are logged as advisory notices
                </span>
              </div>
            </div>
          </div>

          {/* Backend & Model Integration Architecture */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-700" />
              <span>2. Backend Architecture & ML Pipeline Interface</span>
            </h2>

            <p className="text-xs text-slate-600 leading-relaxed">
              SkyGuard AI is engineered with modular separation between telemetry ingestion, feature engineering, and inference scoring.
            </p>

            <div className="p-3 bg-slate-50 rounded-md border border-slate-200 font-mono text-[11px] text-slate-700 space-y-1">
              <div>• Real-time Stream Endpoint: <span className="text-blue-800 font-bold">/api/v1/telemetry/ingest</span></div>
              <div>• ML Inference Pipeline: <span className="text-blue-800 font-bold">Spatial-Temporal Autoencoder + Physics Heuristics</span></div>
              <div>• Quality Control Standard: <span className="text-emerald-700 font-bold">WMO Guide to Meteorological Instruments (No. 8)</span></div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              id="save-qc-settings-btn"
              type="submit"
              className="px-5 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded text-xs font-semibold flex items-center gap-2 shadow-xs transition"
            >
              <Save className="w-4 h-4" />
              <span>Save QC Threshold Changes</span>
            </button>
          </div>
        </form>
      )}

    </div>
  );
};
