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
    fetchEscalations(); 
  };

  // --- SECURITY LOADER ---
  if (authLoading) return (
    <div className="flex h-[50vh] items-center justify-center">
      <div className="text-sm font-mono uppercase tracking-widest text-slate-500">Verifying Security Clearance...</div>
    </div>
  );

  // --- RBAC GATE: HARD BLOCK ADMINS ---
  if (!isSuperadmin) {
    return (
        <div className="flex h-[70vh] flex-col items-center justify-center relative">
            <div className="bg-white border border-slate-200 p-12 text-center max-w-lg w-full">
                <div className="w-20 h-20 bg-red-50 border border-red-200 text-red-600 rounded-none flex items-center justify-center mx-auto mb-6">
                  <Lock className="w-10 h-10" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-3 uppercase">Access Restricted</h1>
                <p className="text-sm text-slate-600 leading-relaxed font-mono">
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200 pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 uppercase flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-red-600" />
            QC & Superadmin Escalations
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Review and resolve audits requiring immediate management override.
          </p>
        </div>
        <div className="bg-white text-red-700 px-5 py-3 border border-red-200 rounded-none font-bold text-xs font-mono flex items-center gap-2 tracking-widest uppercase">
          <AlertTriangle className="w-4 h-4" />
          {escalations.length} Pending Review
        </div>
      </div>

      {/* Data List / Empty State */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 bg-white border border-slate-200">
          <p className="text-sm font-mono uppercase tracking-widest">Querying escalation queue...</p>
        </div>
      ) : escalations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white border border-slate-200">
          <div className="w-20 h-20 bg-slate-50 text-slate-400 border border-slate-200 rounded-none flex items-center justify-center mb-6">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h3 className="text-base font-bold text-slate-900 tracking-widest uppercase">Queue is Clear</h3>
          <p className="text-sm font-mono text-slate-500 mt-2 uppercase tracking-widest">No pending reports escalated to QC at this time.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 divide-y divide-slate-200">
          {escalations.map((audit) => (
            <div 
              key={audit.id} 
              className="flex flex-col md:flex-row hover:bg-slate-50 transition-none cursor-pointer group"
              onClick={() => setSelectedAuditId(audit.id)}
            >
              {/* Left Column: Metadata */}
              <div className="p-6 md:w-1/3 border-b md:border-b-0 md:border-r border-slate-200 bg-slate-50/50 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs font-mono font-bold bg-white border border-red-200 text-red-700 px-3 py-1 rounded-none uppercase tracking-widest">
                    Tier 2 Review
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-base uppercase tracking-wide">{audit.branch_name || 'Unknown Branch'}</h3>
                <p className="text-xs text-slate-500 font-mono tracking-widest uppercase mt-1">Code: {audit.branch_code || 'N/A'}</p>
                
                <div className="mt-5 space-y-3 text-sm text-slate-600 font-mono uppercase tracking-wide">
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="truncate">{audit.inspector_name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span className="truncate">{audit.branch_location || 'Location Not Specified'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>{new Date(audit.time_in).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Admin Remarks & Action */}
              <div className="p-6 md:w-2/3 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest mb-3">
                    Admin Escalation Remarks
                  </h4>
                  <div className="bg-white border border-red-200 p-5 text-sm text-slate-900 leading-relaxed">
                    <p className="font-medium">"{audit.escalation_remarks || 'No remarks provided by the operator.'}"</p>
                  </div>
                </div>
                
                <div className="mt-8 pt-5 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-mono tracking-widest uppercase">Ref: {audit.id.split('-')[0]}</span>
                  <button
                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-mono font-bold py-3 px-6 rounded-none transition-none flex items-center gap-2 uppercase tracking-widest"
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