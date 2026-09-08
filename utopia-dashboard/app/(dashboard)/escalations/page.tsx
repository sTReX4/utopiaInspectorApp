'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowRight, CheckCircle, Clock, Lock, MapPin, ShieldWarning, User, Warning } from '@phosphor-icons/react';
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
      <div className="text-sm text-ink-muted">Verifying Security Clearance...</div>
    </div>
  );

  // --- RBAC GATE: HARD BLOCK ADMINS ---
  if (!isSuperadmin) {
    return (
        <div className="flex h-[70vh] flex-col items-center justify-center relative">
            <div className="bg-surface border border-line p-12 text-center max-w-lg w-full">
                <div className="w-20 h-20 bg-danger-bg border border-danger-ink/20 text-danger-ink rounded-control flex items-center justify-center mx-auto mb-6">
                  <Lock className="w-10 h-10" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-ink mb-3">Access Restricted</h1>
                <p className="text-sm text-ink-muted leading-relaxed">
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-line pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink flex items-center gap-3">
            <ShieldWarning className="w-6 h-6 text-danger-ink" />
            QC & Superadmin Escalations
          </h1>
          <p className="text-sm text-ink-muted mt-2">
            Review and resolve audits requiring immediate management override.
          </p>
        </div>
        <div className="bg-surface text-danger-ink px-5 py-3 border border-danger-ink/20 rounded-control font-bold text-xs flex items-center gap-2">
          <Warning className="w-4 h-4" />
          {escalations.length} Pending Review
        </div>
      </div>

      {/* Data List / Empty State */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-ink-muted bg-surface border border-line">
          <p className="text-sm">Querying escalation queue...</p>
        </div>
      ) : escalations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-surface border border-line">
          <div className="w-20 h-20 bg-canvas text-ink-muted border border-line rounded-control flex items-center justify-center mb-6">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h3 className="text-base font-bold text-ink">Queue is Clear</h3>
          <p className="text-sm text-ink-muted mt-2">No pending reports escalated to QC at this time.</p>
        </div>
      ) : (
        <div className="bg-surface border border-line divide-y divide-line">
          {escalations.map((audit) => (
            <div 
              key={audit.id} 
              className="flex flex-col md:flex-row hover:bg-sunken transition-colors duration-200 cursor-pointer group"
              onClick={() => setSelectedAuditId(audit.id)}
            >
              {/* Left Column: Metadata */}
              <div className="p-6 md:w-1/3 border-b md:border-b-0 md:border-r border-line bg-canvas/50 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs font-bold bg-surface border border-danger-ink/20 text-danger-ink px-3 py-1 rounded-control">
                    Tier 2 Review
                  </span>
                </div>
                <h3 className="font-bold text-ink text-base tracking-wide">{audit.branch_name || 'Unknown Branch'}</h3>
                <p className="text-xs text-ink-muted mt-1">Code: {audit.branch_code || 'N/A'}</p>
                
                <div className="mt-5 space-y-3 text-sm text-ink-muted tracking-wide">
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-ink-muted" />
                    <span className="truncate">{audit.inspector_name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-ink-muted" />
                    <span className="truncate">{audit.branch_location || 'Location Not Specified'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-ink-muted" />
                    <span>{new Date(audit.time_in).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Admin Remarks & Action */}
              <div className="p-6 md:w-2/3 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-ink-muted mb-3">
                    Admin Escalation Remarks
                  </h4>
                  <div className="bg-surface border border-danger-ink/20 p-5 text-sm text-ink leading-relaxed">
                    <p className="font-medium">"{audit.escalation_remarks || 'No remarks provided by the operator.'}"</p>
                  </div>
                </div>
                
                <div className="mt-8 pt-5 border-t border-line flex items-center justify-between">
                  <span className="text-xs text-ink-muted">Ref: {audit.id.split('-')[0]}</span>
                  <button
                    className="bg-ink hover:bg-[#333333] text-surface text-xs font-bold py-3 px-6 rounded-control transition-colors duration-200 flex items-center gap-2"
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