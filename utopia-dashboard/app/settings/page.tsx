'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Lock, Save, Download, User, Sliders, Database, ShieldAlert, Key } from 'lucide-react';

export default function SettingsPage() {
  const { user, role, isLoading: authLoading } = useAuth();
  const isSuperadmin = role === 'superadmin';

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // System Settings State
  const [geofence, setGeofence] = useState<number>(100);
  const [timeout, setTimeoutVal] = useState<number>(30);
  const [retention, setRetention] = useState<number>(12);
  const [emails, setEmails] = useState<string>('');

  useEffect(() => {
    if (!authLoading) {
      fetchSettings();
    }
  }, [authLoading]);

  const fetchSettings = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (data) {
      setGeofence(data.gps_geofence_radius);
      setTimeoutVal(data.session_timeout_minutes);
      setRetention(data.audit_retention_months);
      const emailArray = data.escalation_routing_emails || [];
      setEmails(Array.isArray(emailArray) ? emailArray.join(', ') : '');
    } else if (error) {
      console.error('Failed to load system settings:', error);
    }
    setIsLoading(false);
  };

  const handleSaveSettings = async () => {
    if (!isSuperadmin) return;
    setIsSaving(true);
    setSaveMessage(null);

    // Clean and format comma-separated emails into a strict JSON array
    const emailArray = emails.split(',').map(e => e.trim()).filter(e => e.length > 0);

    const { error } = await supabase
      .from('system_settings')
      .update({
        gps_geofence_radius: geofence,
        session_timeout_minutes: timeout,
        audit_retention_months: retention,
        escalation_routing_emails: emailArray
      })
      .eq('id', 1);

    setIsSaving(false);
    if (error) {
      setSaveMessage({ type: 'error', text: 'SYS_ERROR: UNABLE TO WRITE THRESHOLDS.' });
    } else {
      setSaveMessage({ type: 'success', text: 'SYS_SUCCESS: THRESHOLDS LOCKED.' });
      setTimeout(() => setSaveMessage(null), 4000);
    }
  };

  const handleMasterExport = async () => {
    // Placeholder for Phase 6 master compliance data dump
    alert("SYSTEM_ROUTING: Executing raw extraction protocol...");
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(user.email);
    if (error) {
      alert("Error initiating password reset.");
    } else {
      alert("Password reset instructions transmitted to authorized email.");
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-500 font-mono text-sm tracking-widest uppercase">
        Verifying Security Clearance...
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">System Configuration</h1>
          <p className="text-slate-500 mt-2 text-sm">Manage operational thresholds, compliance retention, and access protocols.</p>
        </div>
        
        {saveMessage && (
          <div className={`px-4 py-2 border rounded-none font-mono text-xs font-bold uppercase tracking-widest ${
            saveMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {saveMessage.text}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Personal & Platform Access */}
        <div className="space-y-8 lg:col-span-1">
          
          {/* Section 1: Personal & Operational Preferences */}
          <div className="bg-white border border-slate-200 rounded-none">
            <div className="border-b border-slate-200 p-4 bg-slate-50 flex items-center gap-2">
              <User className="w-4 h-4 text-slate-500" />
              <h2 className="font-bold text-slate-900 text-sm">Account Preferences</h2>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block font-mono text-[10px] text-slate-500 uppercase tracking-widest mb-2">Authorized Email</label>
                <input 
                  type="text" 
                  disabled 
                  value={user?.email || ''} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-none p-2.5 font-mono text-sm text-slate-500 cursor-not-allowed"
                />
              </div>
              <button 
                onClick={handlePasswordReset}
                className="w-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-none transition-none flex items-center justify-center"
              >
                <Key className="w-4 h-4 mr-2" />
                Initiate Password Reset
              </button>
            </div>
          </div>

          {/* Section 2: Platform Access Management */}
          <div className="bg-white border border-slate-200 rounded-none">
            <div className="border-b border-slate-200 p-4 bg-slate-50 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-slate-500" />
              <h2 className="font-bold text-slate-900 text-sm">Access Management</h2>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                User roles and personnel clearances are strictly managed through the Supabase 
                <span className="font-mono bg-slate-100 px-1 mx-1 border border-slate-200">public.profiles</span> 
                table to ensure cryptographic security.
              </p>
              <div className="bg-slate-900 text-slate-300 p-3 rounded-none border border-slate-800 font-mono text-xs">
                <span className="text-emerald-400 font-bold">CURRENT CLEARANCE:</span> {role?.toUpperCase() || 'UNKNOWN'}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: System Variables & Archiving */}
        <div className="space-y-8 lg:col-span-2">
          
          {/* Section 3: System Variables & Thresholds */}
          <div className="bg-white border border-slate-200 rounded-none">
            <div className="border-b border-slate-200 p-4 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-slate-500" />
                <h2 className="font-bold text-slate-900 text-sm">Global System Thresholds</h2>
              </div>
              {!isSuperadmin && (
                <span className="bg-slate-200 text-slate-600 font-mono text-[10px] font-bold px-2 py-1 uppercase tracking-widest flex items-center">
                  <Lock className="w-3 h-3 mr-1" /> Read Only
                </span>
              )}
            </div>
            
            {isLoading ? (
              <div className="p-12 text-center font-mono text-xs text-slate-500 uppercase tracking-widest">Loading Telemetry...</div>
            ) : (
              <div className="p-6 space-y-6">
                
                {/* Geofence & Timeout Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-mono text-[10px] text-slate-500 uppercase tracking-widest mb-2">GPS Geofence Limit (Meters)</label>
                    <input 
                      type="number" 
                      disabled={!isSuperadmin}
                      value={geofence} 
                      onChange={(e) => setGeofence(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 focus:border-slate-900 rounded-none p-2.5 font-mono text-sm text-slate-900 outline-none transition-none disabled:bg-slate-50 disabled:text-slate-500"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">Radius mismatch before triggering Mismatch Escalation.</p>
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] text-slate-500 uppercase tracking-widest mb-2">Session Timeout (Minutes)</label>
                    <input 
                      type="number" 
                      disabled={!isSuperadmin}
                      value={timeout} 
                      onChange={(e) => setTimeoutVal(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 focus:border-slate-900 rounded-none p-2.5 font-mono text-sm text-slate-900 outline-none transition-none disabled:bg-slate-50 disabled:text-slate-500"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">Idle duration before automated Command Center lock.</p>
                  </div>
                </div>

                {/* Escalation Routing */}
                <div className="border-t border-slate-100 pt-6">
                  <label className="block font-mono text-[10px] text-slate-500 uppercase tracking-widest mb-2">Escalation Routing Emails (Comma Separated)</label>
                  <textarea 
                    rows={3}
                    disabled={!isSuperadmin}
                    value={emails} 
                    onChange={(e) => setEmails(e.target.value)}
                    placeholder="qc@utopiasecurity.com, ops@utopiasecurity.com"
                    className="w-full bg-white border border-slate-300 focus:border-slate-900 rounded-none p-3 font-mono text-sm text-slate-900 outline-none transition-none resize-none disabled:bg-slate-50 disabled:text-slate-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Executive addresses receiving automated incident reports.</p>
                </div>

                {/* Save Action */}
                <div className="border-t border-slate-100 pt-6 flex justify-end">
                  {isSuperadmin ? (
                    <button 
                      onClick={handleSaveSettings}
                      disabled={isSaving}
                      className="bg-slate-900 hover:bg-black text-white px-6 py-2.5 rounded-none font-bold text-sm flex items-center transition-none shadow-sm disabled:bg-slate-400"
                    >
                      {isSaving ? 'UPDATING...' : (
                        <>
                          <Save className="w-4 h-4 mr-2" /> 
                          APPLY GLOBAL THRESHOLDS
                        </>
                      )}
                    </button>
                  ) : (
                    <button disabled className="bg-slate-100 text-slate-400 px-6 py-2.5 rounded-none font-bold text-sm flex items-center border border-slate-200 cursor-not-allowed">
                      <Lock className="w-4 h-4 mr-2" />
                      RESTRICTED TO SUPERADMIN
                    </button>
                  )}
                </div>

              </div>
            )}
          </div>

          {/* Section 4: Data Archiving & Maintenance */}
          <div className="bg-white border border-slate-200 rounded-none">
            <div className="border-b border-slate-200 p-4 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-slate-500" />
                <h2 className="font-bold text-slate-900 text-sm">Archiving & Maintenance</h2>
              </div>
            </div>
            <div className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-200 p-4 bg-slate-50">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Master Compliance Export</h3>
                  <p className="text-xs text-slate-500 mt-1">Execute a complete raw CSV dump of all historical audits, sites, and personnel records.</p>
                </div>
                {isSuperadmin ? (
                  <button 
                    onClick={handleMasterExport}
                    className="bg-white border border-slate-300 hover:border-slate-900 text-slate-900 px-4 py-2 rounded-none font-bold text-xs flex items-center shrink-0 transition-none"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    EXPORT DATABASE
                  </button>
                ) : (
                  <button disabled className="bg-white border border-slate-200 text-slate-300 px-4 py-2 rounded-none font-bold text-xs flex items-center shrink-0 cursor-not-allowed">
                    <Lock className="w-4 h-4 mr-2" />
                    LOCKED
                  </button>
                )}
              </div>

              <div className="mt-6">
                <label className="block font-mono text-[10px] text-slate-500 uppercase tracking-widest mb-2">Audit Retention Policy (Months)</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="number" 
                    disabled={!isSuperadmin}
                    value={retention} 
                    onChange={(e) => setRetention(Number(e.target.value))}
                    className="w-32 bg-white border border-slate-300 focus:border-slate-900 rounded-none p-2.5 font-mono text-sm text-slate-900 outline-none transition-none disabled:bg-slate-50 disabled:text-slate-500"
                  />
                  <span className="text-xs font-bold text-slate-400 uppercase">Months</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">Routine logs older than this threshold will be targeted for soft-deletion during automated maintenance sweeps.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}