import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  Save, 
  RotateCcw, 
  X, 
  CheckCircle2, 
  Briefcase, 
  Bell, 
  Sparkles,
  Award,
  Smartphone,
  Volume2
} from 'lucide-react';
import { useStation } from '../context/StationContext';
import { UserProfile } from '../types';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateUserProfile, resetUserProfile } = useStation();

  const [formData, setFormData] = useState<UserProfile>(currentUser);
  const [activeTab, setActiveTab] = useState<'details' | 'posting' | 'alerts'>('details');
  const [showSavedToast, setShowSavedToast] = useState(false);

  // Sync formData whenever modal opens or currentUser changes
  useEffect(() => {
    if (isOpen) {
      setFormData(currentUser);
      setShowSavedToast(false);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleChange = (field: keyof UserProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile(formData);
    setShowSavedToast(true);
    setTimeout(() => {
      setShowSavedToast(false);
      onClose();
    }, 1200);
  };

  const handleReset = () => {
    resetUserProfile();
    onClose();
  };

  // Helper to compute initials from name
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
    'Automated Sensor Systems Analyst',
    'Principal Meteorologist'
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600/30 border border-blue-400/40 text-blue-300 flex items-center justify-center font-bold text-sm">
              {getInitials(formData.name || 'RS')}
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                <span>Edit Operator Profile & Details</span>
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {formData.badge || 'IMD-QC-9842'}
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Update operational credentials, assigned meteorological center, and alert preferences
              </p>
            </div>
          </div>
          <button
            id="close-profile-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Saved Toast Notification */}
        {showSavedToast && (
          <div className="px-6 py-2.5 bg-emerald-600 text-white text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span>Profile successfully updated across SkyGuard AI system!</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'details'
                ? 'border-blue-900 text-blue-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>1. Identity & Credentials</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('posting')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'posting'
                ? 'border-blue-900 text-blue-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>2. Posting & Regional Center</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('alerts')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'alerts'
                ? 'border-blue-900 text-blue-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>3. Alert Channels</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          
          {/* TAB 1: Identity & Credentials */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              
              {/* Live Preview Card */}
              <div className="p-3.5 bg-gradient-to-r from-blue-50/70 to-slate-50 border border-blue-200/80 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-800 text-white font-bold text-base flex items-center justify-center shadow-xs">
                    {getInitials(formData.name || 'RS')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{formData.name || 'Enter Name'}</span>
                      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        Verified Operator
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{formData.role || 'Designation'}</p>
                    <p className="text-[11px] text-slate-500">{formData.email || 'Email'}</p>
                  </div>
                </div>
                <div className="text-right hidden sm:block">
                  <span className="text-[10px] font-mono bg-white px-2 py-1 rounded border border-slate-200 text-slate-600">
                    Badge: {formData.badge || 'N/A'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Full Name */}
                <div>
                  <label htmlFor="edit-profile-name" className="block text-slate-700 font-semibold mb-1">
                    Full Name & Salutation <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="edit-profile-name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      placeholder="e.g. Dr. Rajesh Sharma"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-700 text-slate-900 font-medium"
                    />
                  </div>
                </div>

                {/* Badge ID */}
                <div>
                  <label htmlFor="edit-profile-badge" className="block text-slate-700 font-semibold mb-1">
                    Operator Badge / Employee ID <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Award className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="edit-profile-badge"
                      type="text"
                      required
                      value={formData.badge}
                      onChange={(e) => handleChange('badge', e.target.value)}
                      placeholder="e.g. IMD-QC-9842"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-700 text-slate-900 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Role / Designation */}
              <div>
                <label htmlFor="edit-profile-role" className="block text-xs text-slate-700 font-semibold mb-1">
                  Designation / Role Title <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="edit-profile-role"
                    type="text"
                    required
                    value={formData.role}
                    onChange={(e) => handleChange('role', e.target.value)}
                    placeholder="e.g. Senior Meteorological Officer"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-700 text-slate-900"
                  />
                </div>
                {/* Role quick pills */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-400 self-center">Presets:</span>
                  {rolePresets.map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleChange('role', preset)}
                      className={`text-[10px] px-2 py-0.5 rounded border transition ${
                        formData.role === preset
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
              <div>
                <label htmlFor="edit-profile-bio" className="block text-xs text-slate-700 font-semibold mb-1">
                  Operational Scope & Specialization
                </label>
                <textarea
                  id="edit-profile-bio"
                  rows={2}
                  value={formData.bio || ''}
                  onChange={(e) => handleChange('bio', e.target.value)}
                  placeholder="Describe your operational responsibilities and regional AWS cluster coverage..."
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-700 text-slate-900"
                />
              </div>

            </div>
          )}

          {/* TAB 2: Posting & Regional Center */}
          {activeTab === 'posting' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                
                {/* Official Email */}
                <div>
                  <label htmlFor="edit-profile-email" className="block text-slate-700 font-semibold mb-1">
                    Official IMD / Government Email <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="edit-profile-email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="r.sharma@imd.gov.in"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-700 text-slate-900"
                    />
                  </div>
                </div>

                {/* Duty Contact Phone */}
                <div>
                  <label htmlFor="edit-profile-phone" className="block text-slate-700 font-semibold mb-1">
                    Duty Phone / Hotline
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="edit-profile-phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="+91 11 2461 8241"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-700 text-slate-900"
                    />
                  </div>
                </div>

                {/* Organization */}
                <div>
                  <label htmlFor="edit-profile-org" className="block text-slate-700 font-semibold mb-1">
                    Organization <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="edit-profile-org"
                      type="text"
                      required
                      value={formData.organization}
                      onChange={(e) => handleChange('organization', e.target.value)}
                      placeholder="India Meteorological Department"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-700 text-slate-900"
                    />
                  </div>
                </div>

                {/* Division */}
                <div>
                  <label htmlFor="edit-profile-div" className="block text-slate-700 font-semibold mb-1">
                    Division / Directorate
                  </label>
                  <input
                    id="edit-profile-div"
                    type="text"
                    value={formData.division}
                    onChange={(e) => handleChange('division', e.target.value)}
                    placeholder="Surface Instruments & AWS Quality Division"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-700 text-slate-900"
                  />
                </div>

              </div>

              {/* Regional Met Center */}
              <div>
                <label htmlFor="edit-profile-center" className="block text-xs text-slate-700 font-semibold mb-1">
                  Assigned Regional Meteorological Centre (RMC)
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    id="edit-profile-center"
                    value={formData.regionalCenter}
                    onChange={(e) => handleChange('regionalCenter', e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-700 text-slate-900"
                  >
                    {regionalCenters.map(center => (
                      <option key={center} value={center}>{center}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Operational Shift */}
              <div>
                <label htmlFor="edit-profile-shift" className="block text-xs text-slate-700 font-semibold mb-1">
                  Active Operational Shift
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    id="edit-profile-shift"
                    value={formData.shift}
                    onChange={(e) => handleChange('shift', e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-700 text-slate-900"
                  >
                    {shiftPresets.map(shift => (
                      <option key={shift} value={shift}>{shift}</option>
                    ))}
                  </select>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: Alert Notifications */}
          {activeTab === 'alerts' && (
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-slate-700 leading-relaxed">
                Configure direct dispatch notifications for sensor fault anomalies flagged with high ML confidence.
              </div>

              <div className="space-y-2.5 pt-1">
                {/* Email Alert Toggle */}
                <label className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer transition">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-blue-100 text-blue-800 flex items-center justify-center">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Email Quality Alert Digest</p>
                      <p className="text-[11px] text-slate-500">Receive hourly digest and critical fault notifications at {formData.email}</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.alertEmailEnabled}
                    onChange={(e) => handleChange('alertEmailEnabled', e.target.checked)}
                    className="w-4 h-4 text-blue-900 rounded border-slate-300 focus:ring-blue-800"
                  />
                </label>

                {/* SMS Alert Toggle */}
                <label className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer transition">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-amber-100 text-amber-800 flex items-center justify-center">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">SMS Incident Dispatch</p>
                      <p className="text-[11px] text-slate-500">Instant SMS dispatch to duty phone for critical hardware spikes and frozen sensors</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.alertSmsEnabled}
                    onChange={(e) => handleChange('alertSmsEnabled', e.target.checked)}
                    className="w-4 h-4 text-blue-900 rounded border-slate-300 focus:ring-blue-800"
                  />
                </label>

                {/* Sound Alert Toggle */}
                <label className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer transition">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-slate-200 text-slate-800 flex items-center justify-center">
                      <Volume2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Audio Ingest Warning Chime</p>
                      <p className="text-[11px] text-slate-500">Play subtle warning chime when a new 3-hour AWS packet fails physical limit bounds</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.soundAlertsEnabled}
                    onChange={(e) => handleChange('soundAlertsEnabled', e.target.checked)}
                    className="w-4 h-4 text-blue-900 rounded border-slate-300 focus:ring-blue-800"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Defaults</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-md transition"
              >
                Cancel
              </button>
              <button
                id="save-profile-btn"
                type="submit"
                className="px-5 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded-md text-xs font-semibold flex items-center gap-2 shadow-xs transition"
              >
                <Save className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
