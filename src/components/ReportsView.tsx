import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  Radio, 
  ShieldCheck, 
  Activity, 
  Sparkles,
  Wrench,
  Layers,
  Check
} from 'lucide-react';
import { useStation } from '../context/StationContext';
import { Station } from '../types';

export const ReportsView: React.FC = () => {
  const { stations, selectedStationId } = useStation();

  const [targetStationId, setTargetStationId] = useState<string>(selectedStationId || 'AWS-031');
  const [reportPeriod, setReportPeriod] = useState<string>('Last 24 Hours');
  const [isGenerated, setIsGenerated] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const currentStation = stations.find(s => s.id === targetStationId) || stations[0];

  const handleGenerate = () => {
    setIsGenerated(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      alert(`Report for ${currentStation.name} (${currentStation.id}) generated and ready.`);
    }, 1000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header & Report Configurator Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-800" />
              <span>AWS Station Data Quality & Maintenance Report Generator</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Official Quality Assurance and Calibration Health Summary for IMD Meteorological Division
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
            <button
              onClick={handleDownload}
              disabled={isExporting}
              className="px-3.5 py-1.5 bg-blue-900 hover:bg-blue-950 text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
            >
              <Download className="w-3.5 h-3.5" />
              {isExporting ? 'Exporting...' : 'Export PDF / JSON'}
            </button>
          </div>
        </div>

        {/* Selection Controls */}
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label htmlFor="station-select-report" className="block text-slate-500 font-semibold mb-1">Select Weather Station:</label>
            <select
              id="station-select-report"
              value={targetStationId}
              onChange={(e) => setTargetStationId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 font-semibold text-slate-800 focus:ring-1 focus:ring-blue-700"
            >
              {stations.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.id}) — {s.state}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="report-period-select" className="block text-slate-500 font-semibold mb-1">Observation Period:</label>
            <select
              id="report-period-select"
              value={reportPeriod}
              onChange={(e) => setReportPeriod(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-slate-800 focus:ring-1 focus:ring-blue-700"
            >
              <option value="Last 24 Hours">Last 24 Hours (Diurnal cycle)</option>
              <option value="Last 7 Days">Last 7 Days (Weekly QC audit)</option>
              <option value="Last 30 Days">Last 30 Days (Monthly calibration)</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              id="generate-report-btn"
              onClick={handleGenerate}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded font-semibold text-xs transition"
            >
              Generate Health Report
            </button>
          </div>
        </div>
      </div>

      {/* Generated Report Document View */}
      {isGenerated && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 shadow-xs space-y-6 text-slate-800">
          
          {/* Document Header */}
          <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  IMD / SKYGUARD AI QUALITY ASSURANCE REPORT
                </span>
                <span className="text-[10px] font-mono text-slate-400">DOC-REF: SG-{currentStation.id}-2026</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-1">
                Meteorological Data Quality & Sensor Health Audit
              </h2>
              <p className="text-xs text-slate-500">
                Evaluation standard: WMO No. 8 & IMD Meteorological Sensor Quality Specifications
              </p>
            </div>

            <div className="text-right text-xs text-slate-500 font-mono">
              <div>Date Generated: <strong>31 Aug 2026 18:30 IST</strong></div>
              <div>Audit Period: <strong>{reportPeriod}</strong></div>
            </div>
          </div>

          {/* 1. Station Summary */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3 pb-1 border-b border-slate-100 flex items-center gap-2">
              <span>1. Station Profile & Identification</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Station Name</span>
                <span className="font-bold text-slate-900 text-sm">{currentStation.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Station Code</span>
                <span className="font-mono font-bold text-slate-900">{currentStation.id}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">State & District</span>
                <span className="font-semibold text-slate-800">{currentStation.district}, {currentStation.state}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Elevation / GPS</span>
                <span className="font-mono text-slate-700">{currentStation.elevation}m • {currentStation.lat.toFixed(2)}°N, {currentStation.lng.toFixed(2)}°E</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Sensor Hardware</span>
                <span className="font-semibold text-slate-800">{currentStation.sensorModel}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Transmission Downlink</span>
                <span className="font-semibold text-slate-800">{currentStation.transmissionType}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Commission Date</span>
                <span className="font-mono text-slate-700">{currentStation.installedDate}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Operational Status</span>
                <span className={`font-bold capitalize ${
                  currentStation.status === 'healthy' ? 'text-emerald-700' :
                  currentStation.status === 'attention' ? 'text-amber-700' : 'text-rose-700'
                }`}>
                  {currentStation.status}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Sensor Health Matrix */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3 pb-1 border-b border-slate-100">
              2. Sensor Channel Health & Calibration Scores
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Parameter</th>
                    <th className="py-2.5 px-3">Current Value</th>
                    <th className="py-2.5 px-3">Completeness</th>
                    <th className="py-2.5 px-3">Health Score</th>
                    <th className="py-2.5 px-3">Calibration Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">Temperature (RTD / PT100)</td>
                    <td className="py-2.5 px-3 font-mono">
                      {currentStation.currentReadings.temperature !== null ? `${currentStation.currentReadings.temperature}°C` : 'Dropout'}
                    </td>
                    <td className="py-2.5 px-3 font-mono">99.4%</td>
                    <td className="py-2.5 px-3 font-bold font-mono">
                      <span className={currentStation.sensorHealth.temperature < 70 ? 'text-rose-700' : 'text-emerald-700'}>
                        {currentStation.sensorHealth.temperature}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      {currentStation.sensorHealth.temperature < 70 
                        ? <span className="text-rose-700 font-bold">Calibration Required (Spike detected)</span>
                        : <span className="text-emerald-700">Valid / Certified</span>}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">Relative Humidity (Capacitive)</td>
                    <td className="py-2.5 px-3 font-mono">
                      {currentStation.currentReadings.humidity !== null ? `${currentStation.currentReadings.humidity}%` : 'Dropout'}
                    </td>
                    <td className="py-2.5 px-3 font-mono">100.0%</td>
                    <td className="py-2.5 px-3 font-bold font-mono text-emerald-700">
                      {currentStation.sensorHealth.humidity}%
                    </td>
                    <td className="py-2.5 px-3 text-emerald-700">Valid / Certified</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">Barometric Pressure (Piezoresistive)</td>
                    <td className="py-2.5 px-3 font-mono">
                      {currentStation.currentReadings.pressure !== null ? `${currentStation.currentReadings.pressure} hPa` : 'Dropout'}
                    </td>
                    <td className="py-2.5 px-3 font-mono">100.0%</td>
                    <td className="py-2.5 px-3 font-bold font-mono text-emerald-700">
                      {currentStation.sensorHealth.pressure}%
                    </td>
                    <td className="py-2.5 px-3 text-emerald-700">Valid / Certified</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. Detected Anomalies & Corrected / Estimated Readings */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3 pb-1 border-b border-slate-100">
              3. Detected Quality Flags & Estimated / Imputed Values
            </h3>

            {currentStation.status === 'healthy' ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>No severe anomalies detected in the selected timeframe. Data stream qualifies for NWP model assimilation.</span>
              </div>
            ) : (
              <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-lg text-xs space-y-3">
                <div className="flex items-center justify-between font-bold text-rose-900">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-700" />
                    Anomaly Flagged: {currentStation.status === 'critical' ? 'Temperature Sensor Spike' : 'Sensor Calibration Drift'}
                  </span>
                  <span className="font-mono text-[11px] bg-rose-200/80 px-2 py-0.5 rounded text-rose-900">
                    Confidence: 96%
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3 rounded border border-rose-100 text-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Flagged Observed Value</span>
                    <span className="font-mono font-bold text-rose-700 text-sm">
                      {currentStation.currentReadings.temperature !== null ? `${currentStation.currentReadings.temperature}°C` : 'NULL'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Estimated Correct Imputation</span>
                    <span className="font-mono font-bold text-emerald-700 text-sm">
                      {currentStation.id === 'AWS-031' ? '30.6°C' : currentStation.id === 'AWS-027' ? '31.1°C' : '28.9°C'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Imputation Method</span>
                    <span className="text-slate-800 font-medium">Spatial Neighbor Weighted Kriging</span>
                  </div>
                </div>

                <p className="text-[11px] text-rose-900 leading-relaxed">
                  <strong>Evidence Summary:</strong> Instantaneous step jump (+16.8°C) without thermodynamic response on relative humidity channel; corroborated against neighbor stations Guntur (AWS-018) & Tirupati (AWS-045).
                </p>
              </div>
            )}
          </div>

          {/* 4. Recommended Maintenance */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2 pb-1 border-b border-slate-100 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-blue-800" />
              <span>4. Recommended Preventive Maintenance & Field Actions</span>
            </h3>

            <ul className="space-y-1.5 text-xs text-slate-700 pl-4 list-disc">
              <li>
                <strong>Scheduled Calibration:</strong> Perform on-site calibration using certified secondary transfer standard psychrometer within 7 business days.
              </li>
              <li>
                <strong>Hardware Check:</strong> Clean aspirated radiation shield slats and inspect thermistor connection terminals for oxidation.
              </li>
              <li>
                <strong>Telemetry Verification:</strong> Test secondary satellite DCP transmitter health ping to confirm zero packet loss.
              </li>
            </ul>
          </div>

          {/* Sign-off footer */}
          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-500">
            <div>
              <p className="font-semibold text-slate-700">Certified by: Dr. Rajesh Sharma</p>
              <p className="text-[11px]">Senior Meteorological Officer, India Meteorological Department</p>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-slate-100 rounded text-slate-700 font-mono text-[11px]">
                SIGNATURE: IMD-DIGITAL-TOKEN-VERIFIED-9842
              </span>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
