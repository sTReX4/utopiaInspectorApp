'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Database, DownloadSimple, FloppyDisk, Key, Lock, ShieldWarning, SlidersHorizontal, User } from '@phosphor-icons/react';

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
      <div className="flex h-screen items-center justify-center text-ink-muted text-sm">
        Verifying Security Clearance...
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-line pb-6">
        <div>
          <h1 className="text-3xl font-bold text-ink tracking-tight">System Configuration</h1>
          <p className="text-ink-muted mt-2 text-sm">Manage operational thresholds, compliance retention, and access protocols.</p>
        </div>
        
        {saveMessage && (
          <div className={`px-4 py-2 border rounded-control text-xs font-bold ${
            saveMessage.type === 'success' ? 'bg-ok-bg border-ok-ink/20 text-ok-ink' : 'bg-danger-bg border-danger-ink/20 text-danger-ink'
          }`}>
            {saveMessage.text}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Personal & Platform Access */}
        <div className="space-y-8 lg:col-span-1">
          
          {/* Section 1: Personal & Operational Preferences */}
          <div className="bg-surface border border-line rounded-control">
            <div className="border-b border-line p-4 bg-canvas flex items-center gap-2">
              <User className="w-4 h-4 text-ink-muted" />
              <h2 className="font-bold text-ink text-sm">Account Preferences</h2>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs text-ink-muted mb-2">Authorized Email</label>
                <input 
                  type="text" 
                  disabled 
                  value={user?.email || ''} 
                  className="w-full bg-canvas border border-line rounded-control p-2.5 text-sm text-ink-muted cursor-not-allowed"
                />
              </div>
              <button 
                onClick={handlePasswordReset}
                className="w-full bg-surface border border-line hover:bg-sunken text-ink font-bold text-xs px-4 py-2.5 rounded-control transition-colors duration-200 flex items-center justify-center"
              >
                <Key className="w-4 h-4 mr-2" />
                Initiate Password Reset
              </button>
            </div>
          </div>

          {/* Section 2: Platform Access Management */}
          <div className="bg-surface border border-line rounded-control">
            <div className="border-b border-line p-4 bg-canvas flex items-center gap-2">
              <ShieldWarning className="w-4 h-4 text-ink-muted" />
              <h2 className="font-bold text-ink text-sm">Access Management</h2>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-xs text-ink-muted leading-relaxed">
                User roles and personnel clearances are strictly managed through the Supabase 
                <span className="bg-sunken px-1 mx-1 border border-line">public.profiles</span> 
                table to ensure cryptographic security.
              </p>
              <div className="bg-ink text-shell-muted p-3 rounded-control border border-shell-line text-xs">
                <span className="text-emerald-400 font-bold">CURRENT CLEARANCE:</span> {role?.toUpperCase() || 'UNKNOWN'}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: System Variables & Archiving */}
        <div className="space-y-8 lg:col-span-2">
          
          {/* Section 3: System Variables & Thresholds */}
          <div className="bg-surface border border-line rounded-control">
            <div className="border-b border-line p-4 bg-canvas flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-ink-muted" />
                <h2 className="font-bold text-ink text-sm">Global System Thresholds</h2>
              </div>
              {!isSuperadmin && (
                <span className="bg-sunken text-ink-muted text-xs font-bold px-2 py-1 flex items-center">
                  <Lock className="w-3 h-3 mr-1" /> Read Only
                </span>
              )}
            </div>
            
            {isLoading ? (
              <div className="p-12 text-center text-xs text-ink-muted">Loading Telemetry...</div>
            ) : (
              <div className="p-6 space-y-6">
                
                {/* Geofence & Timeout Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs text-ink-muted mb-2">GPS Geofence Limit (Meters)</label>
                    <input 
                      type="number" 
                      disabled={!isSuperadmin}
                      value={geofence} 
                      onChange={(e) => setGeofence(Number(e.target.value))}
                      className="w-full bg-surface border border-line focus:border-ink rounded-control p-2.5 text-sm text-ink outline-none transition-colors duration-200 disabled:bg-canvas disabled:text-ink-muted"
                    />
                    <p className="text-[11px] text-ink-muted mt-1">Radius mismatch before triggering Mismatch Escalation.</p>
                  </div>

                  <div>
                    <label className="block text-xs text-ink-muted mb-2">Session Timeout (Minutes)</label>
                    <input 
                      type="number" 
                      disabled={!isSuperadmin}
                      value={timeout} 
                      onChange={(e) => setTimeoutVal(Number(e.target.value))}
                      className="w-full bg-surface border border-line focus:border-ink rounded-control p-2.5 text-sm text-ink outline-none transition-colors duration-200 disabled:bg-canvas disabled:text-ink-muted"
                    />
                    <p className="text-[11px] text-ink-muted mt-1">Idle duration before automated Command Center lock.</p>
                  </div>
                </div>

                {/* Escalation Routing */}
                <div className="border-t border-line pt-6">
                  <label className="block text-xs text-ink-muted mb-2">Escalation Routing Emails (Comma Separated)</label>
                  <textarea 
                    rows={3}
                    disabled={!isSuperadmin}
                    value={emails} 
                    onChange={(e) => setEmails(e.target.value)}
                    placeholder="qc@utopiasecurity.com, ops@utopiasecurity.com"
                    className="w-full bg-surface border border-line focus:border-ink rounded-control p-3 text-sm text-ink outline-none transition-colors duration-200 resize-none disabled:bg-canvas disabled:text-ink-muted"
                  />
                  <p className="text-[11px] text-ink-muted mt-1">Executive addresses receiving automated incident reports.</p>
                </div>

                {/* Save Action */}
                <div className="border-t border-line pt-6 flex justify-end">
                  {isSuperadmin ? (
                    <button 
                      onClick={handleSaveSettings}
                      disabled={isSaving}
                      className="bg-ink hover:bg-[#333333] text-surface px-6 py-2.5 rounded-control font-bold text-sm flex items-center transition-colors duration-200 disabled:bg-ink-muted"
                    >
                      {isSaving ? 'UPDATING...' : (
                        <>
                          <FloppyDisk className="w-4 h-4 mr-2" /> 
                          APPLY GLOBAL THRESHOLDS
                        </>
                      )}
                    </button>
                  ) : (
                    <button disabled className="bg-sunken text-ink-muted px-6 py-2.5 rounded-control font-bold text-sm flex items-center border border-line cursor-not-allowed">
                      <Lock className="w-4 h-4 mr-2" />
                      RESTRICTED TO SUPERADMIN
                    </button>
                  )}
                </div>

              </div>
            )}
          </div>

          {/* Section 4: Data Archiving & Maintenance */}
          <div className="bg-surface border border-line rounded-control">
            <div className="border-b border-line p-4 bg-canvas flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-ink-muted" />
                <h2 className="font-bold text-ink text-sm">Archiving & Maintenance</h2>
              </div>
            </div>
            <div className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border border-line p-4 bg-canvas">
                <div>
                  <h3 className="font-bold text-ink text-sm">Master Compliance Export</h3>
                  <p className="text-xs text-ink-muted mt-1">Execute a complete raw CSV dump of all historical audits, sites, and personnel records.</p>
                </div>
                {isSuperadmin ? (
                  <button 
                    onClick={handleMasterExport}
                    className="bg-surface border border-line hover:border-ink text-ink px-4 py-2 rounded-control font-bold text-xs flex items-center shrink-0 transition-colors duration-200"
                  >
                    <DownloadSimple className="w-4 h-4 mr-2" />
                    EXPORT DATABASE
                  </button>
                ) : (
                  <button disabled className="bg-surface border border-line text-shell-muted px-4 py-2 rounded-control font-bold text-xs flex items-center shrink-0 cursor-not-allowed">
                    <Lock className="w-4 h-4 mr-2" />
                    LOCKED
                  </button>
                )}
              </div>

              <div className="mt-6">
                <label className="block text-xs text-ink-muted mb-2">Audit Retention Policy (Months)</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="number" 
                    disabled={!isSuperadmin}
                    value={retention} 
                    onChange={(e) => setRetention(Number(e.target.value))}
                    className="w-32 bg-surface border border-line focus:border-ink rounded-control p-2.5 text-sm text-ink outline-none transition-colors duration-200 disabled:bg-canvas disabled:text-ink-muted"
                  />
                  <span className="text-xs font-bold text-ink-muted">Months</span>
                </div>
                <p className="text-[11px] text-ink-muted mt-2">Routine logs older than this threshold will be targeted for soft-deletion during automated maintenance sweeps.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}