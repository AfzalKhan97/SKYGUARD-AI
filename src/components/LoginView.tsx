import React, { useState } from 'react';
import { Radio, Lock, Mail, ArrowRight, ShieldCheck, CheckCircle2, Sparkles, Activity } from 'lucide-react';
import { useStation } from '../context/StationContext';

export const LoginView: React.FC = () => {
  const { login } = useStation();
  const [email, setEmail] = useState('r.sharma@imd.gov.in');
  const [password, setPassword] = useState('••••••••••••');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      login();
    }, 400);
  };

  const handleDemoLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      login();
    }, 200);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        
        {/* Brand Icon & Heading */}
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-900 text-white shadow-md mb-3">
          <Radio className="w-6 h-6 text-blue-200" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          SkyGuard AI
        </h1>
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mt-0.5">
          Automatic Weather Station (AWS) Data Quality & Anomaly Monitoring
        </p>

        <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-full text-blue-900 text-[11px] font-bold">
          <span>Smart India Hackathon 2026</span>
          <span>•</span>
          <span>Problem Statement: SIH26073</span>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-8 border border-slate-200 shadow-sm rounded-lg space-y-6">
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-xs font-semibold text-slate-700 mb-1">
                Email / IMD Operator ID
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="login-email"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@imd.gov.in"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-700"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-700"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded border-slate-300 text-blue-900 focus:ring-0" />
                <span>Keep session active</span>
              </label>
              <a href="#" onClick={(e) => e.preventDefault()} className="text-blue-900 font-semibold hover:underline">
                Forgot password?
              </a>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-blue-900 hover:bg-blue-950 text-white rounded-md text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition"
            >
              {isLoading ? 'Authenticating...' : 'Sign In to Operator Console'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Demo Login Option (As required by prompt) */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400 font-bold text-[10px] tracking-wider">
                OR Instant Evaluation
              </span>
            </div>
          </div>

          <button
            id="demo-login-btn"
            type="button"
            onClick={handleDemoLogin}
            className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-md text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Demo Login as IMD Lead Operator
          </button>

          {/* Prototype disclaimer note */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-500 leading-relaxed">
            <p className="font-semibold text-slate-700 mb-0.5">Prototype Note:</p>
            This is a frontend demonstration prototype for SIH 2026. Realistic simulated AWS telemetry & AI anomaly detection logic are active.
          </div>

        </div>
      </div>
    </div>
  );
};
