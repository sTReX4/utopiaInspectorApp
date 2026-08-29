'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AlertTriangle, Clock, MapPin, User, ArrowRight, ShieldAlert, CheckCircle, Lock } from 'lucide-react';
import AuditDetailPanel from '@/app/components/auditDetailPanel';
import { useAuth } from '@/app/context/AuthContext';

interface EscalatedAudit {
  id: string;
  branch_name: string;
  branch_code: string;
  branch_location: string;
  inspector_name: string;
  time_in: string;
  time_out: string | null;
  escalation_remarks: string;
  escalation_status: string;
}

export default function EscalationsPage() {
  // --- REAL SUPABASE AUTHENTICATION ---
  const { role, isLoading: authLoading } = useAuth();
  const isSuperadmin = role === 'superadmin';

  const [escalations, setEscalations] = useState<EscalatedAudit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);

  const fetchEscalations = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('audits')
        .select('id, branch_name, branch_code, branch_location, inspector_name, time_in, time_out, escalation_remarks, escalation_status')
        .eq('escalation_status', 'Pending QC Review')
        .order('time_in', { ascending: false });

      if (error) throw error;
      setEscalations(data || []);
    } catch (error) {
      console.error('Error fetching escalations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperadmin) {
        fetchEscalations();
    }
  }, [isSuperadmin]);

  const handleClosePanel = () => {
    setSelectedAuditId(null);
    fetchEscalations(); // Refreshes the list so resolved items drop off immediately
  };

  // --- SECURITY LOADER ---
  if (authLoading) return (
    <div className="flex h-[50vh] items-center justify-center">
      <div className="text-sm font-medium text-slate-500 animate-pulse">Verifying Security Clearance...</div>
    </div>
  );

  // --- RBAC GATE: HARD BLOCK ADMINS ---
  if (!isSuperadmin) {
    return (
        <div className="flex h-[70vh] flex-col items-center justify-center relative">
            <div className="enterprise-card p-10 text-center max-w-md w-full">
                <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-5 ring-1 ring-red-100">
                  <Lock className="w-8 h-8" />
                </div>
                <h1 className="text-xl font-semibold tracking-tight text-slate-900 mb-2">Access Restricted</h1>
                <p className="text-sm text-slate-500 leading-relaxed">
                    The QC Escalations queue is restricted to Superadmin personnel. 
                    Please return to the main dashboard.
                </p>
            </div>
        </div>
    )
  }

  return (
    <div className="space-y-6">
        
      {/* Page Header */}
      <div className="flex items-center justify-between border-b micro-border pb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-red-600" />
            QC & Superadmin Escalations
          </h1>
          <p className="text-subdued mt-1">
            Review and resolve audits requiring immediate management override.
          </p>
        </div>
        <div className="bg-red-50 text-red-700 px-3 py-1.5 rounded-md ring-1 ring-red-200/60 font-semibold text-xs flex items-center gap-2 tracking-wide uppercase">
          <AlertTriangle className="w-4 h-4" />
          {escalations.length} Pending Review
        </div>
      </div>

      {/* Data List / Empty State */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 enterprise-card">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mb-4"></div>
          <p className="text-sm font-medium">Loading escalations queue...</p>
        </div>
      ) : escalations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 enterprise-card">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-5 ring-1 ring-emerald-100">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 tracking-tight">Queue is Clear</h3>
          <p className="text-sm text-slate-500 mt-1">There are no pending reports escalated to QC at this time.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {escalations.map((audit) => (
            <div 
              key={audit.id} 
              className="enterprise-card overflow-hidden flex flex-col md:flex-row hover:border-red-400 hover:ring-1 hover:ring-red-400/50 transition-all cursor-pointer group"
              onClick={() => setSelectedAuditId(audit.id)}
            >
              {/* Left Column: Metadata */}
              <div className="p-5 md:w-1/3 border-b md:border-b-0 md:border-r micro-border bg-slate-50/50 flex flex-col justify-center transition-colors group-hover:bg-red-50/30">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold bg-red-50 ring-1 ring-red-200/60 text-red-700 px-2 py-0.5 rounded uppercase tracking-wider">
                    Tier 2 Review
                  </span>
                </div>
                <h3 className="font-semibold text-slate-900 text-base">{audit.branch_name || 'Unknown Branch'}</h3>
                <p className="text-[11px] text-slate-400 font-mono font-medium tracking-widest mt-0.5">CODE: {audit.branch_code || 'N/A'}</p>
                
                <div className="mt-4 space-y-2 text-xs text-slate-600 font-medium">
                  <div className="flex items-center gap-2.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{audit.inspector_name}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{audit.branch_location || 'Location Not Specified'}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{new Date(audit.time_in).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Admin Remarks & Action */}
              <div className="p-5 md:w-2/3 flex flex-col justify-between bg-white">
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                    Admin Escalation Remarks
                  </h4>
                  <div className="bg-red-50/50 border border-red-100 rounded-lg p-4 text-sm text-red-900 leading-relaxed shadow-sm">
                    <p className="italic">"{audit.escalation_remarks || 'No remarks provided by the operator.'}"</p>
                  </div>
                </div>
                
                <div className="mt-5 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-mono font-medium tracking-wide">REF: {audit.id.split('-')[0]}</span>
                  <button
                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-2 px-4 rounded-lg shadow-sm ring-1 ring-slate-900/50 transition-colors flex items-center gap-2 group-hover:bg-slate-800"
                  >
                    Review Full Audit
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Render the detailed modal if an audit is selected */}
      {selectedAuditId && (
        <AuditDetailPanel 
          auditId={selectedAuditId} 
          onClose={handleClosePanel}
          userRole={role || undefined} 
        />
      )}
    </div>
  );
}