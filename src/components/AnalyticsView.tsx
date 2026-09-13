import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { 
  BarChart3, Activity, AlertTriangle, ShieldCheck, Database, RefreshCw
} from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch('http://localhost:8000/api/metrics');
      if (!res.ok) throw new Error("Failed to fetch metrics");
      const data = await res.json();
      setMetrics(data);
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        Loading Evaluation Metrics...
      </div>
    );
  }

  if (error || !metrics || !metrics.historical_metrics) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500 bg-white border border-slate-200 rounded-lg">
        <AlertTriangle className="w-10 h-10 text-amber-500 mb-2" />
        <h3 className="text-lg font-bold text-slate-800">Evaluation metrics unavailable</h3>
        <p className="text-sm">Please ensure the FastAPI backend is running on port 8000.</p>
        <button onClick={fetchMetrics} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700">
          Retry
        </button>
      </div>
    );
  }

  const xgbHist = metrics.historical_metrics.XGBoost;
  const xgbScen = metrics.scenario_metrics.XGBoost;
  
  // Format Confusion Matrix for charting
  const cm = xgbScen.confusion_matrix;
  const cmData = [
    { name: 'Genuine', "Genuine Weather": cm["Genuine Weather"]["Genuine Weather"], "Uncertain": cm["Genuine Weather"]["Uncertain"], "Sensor Fault": cm["Genuine Weather"]["Sensor Fault"] },
    { name: 'Uncertain', "Genuine Weather": cm["Uncertain"]["Genuine Weather"], "Uncertain": cm["Uncertain"]["Uncertain"], "Sensor Fault": cm["Uncertain"]["Sensor Fault"] },
    { name: 'Fault', "Genuine Weather": cm["Sensor Fault"]["Genuine Weather"], "Uncertain": cm["Sensor Fault"]["Uncertain"], "Sensor Fault": cm["Sensor Fault"]["Sensor Fault"] },
  ];

  const pieData = [
    { name: 'Correct (Hist)', value: xgbHist.accuracy * 100, color: '#10b981' },
    { name: 'Error (Hist)', value: (1 - xgbHist.accuracy) * 100, color: '#ef4444' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-800" />
              <span>Model Evaluation Analytics</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Live metrics pulled from empirical validation datasets and controlled test scenarios.
            </p>
          </div>
          <button onClick={fetchMetrics} className="p-2 bg-slate-100 hover:bg-slate-200 rounded text-slate-600">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Historical Accuracy</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-800">
            {(xgbHist.accuracy * 100).toFixed(2)}%
          </div>
          <p className="text-[10px] text-slate-400 mt-1">XGBoost Baseline (Clean Data)</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Scenario Detection (F1)</span>
            <Activity className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-800">
            {xgbScen.macro_f1.toFixed(3)}
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Macro F1 (Anomalies injected)</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Fault Precision</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-800">
            {(xgbScen.per_class["Sensor Fault"].precision * 100).toFixed(1)}%
          </div>
          <p className="text-[10px] text-slate-400 mt-1">True Positive Rate for faults</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Model Type</span>
            <BarChart3 className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-800 pt-1">
            XGBoost (3-Class)
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Tree-based Gradient Boosting</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Confusion Matrix (Scenarios) */}
        <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            Scenario Confusion Matrix (Actual vs Predicted)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cmData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="Genuine Weather" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                <Bar dataKey="Uncertain" stackId="a" fill="#f59e0b" />
                <Bar dataKey="Sensor Fault" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Historical Accuracy Pie */}
        <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            Historical Baseline Accuracy (Validation Set)
          </h3>
          <div className="h-64 flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
