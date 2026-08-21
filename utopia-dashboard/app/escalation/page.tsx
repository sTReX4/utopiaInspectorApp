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
  if (authLoading) return <div className="p-8 text-center font-bold text-gray-500">Verifying Security Clearance...</div>;

  // --- RBAC GATE: HARD BLOCK ADMINS ---
  if (!isSuperadmin) {
    return (
        <main className="min-h-screen bg-gray-100 p-8 flex flex-col items-center justify-center relative">
            <div className="bg-white p-10 rounded-xl shadow-lg border border-gray-200 text-center max-w-md">
                <Lock className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
                <p className="text-gray-500">
                    The QC Escalations queue is restricted to Superadmin personnel only. 
                    Please return to the main dashboard.
                </p>
            </div>
        </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8 relative">
      <div className="max-w-6xl mx-auto space-y-6 mt-4">
        
        {/* Page Header */}
        <div className="flex items-center justify-between bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ShieldAlert className="w-7 h-7 text-red-600" />
              QC & Superadmin Escalations
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Review and resolve audits requiring immediate management override.
            </p>
          </div>
          <div className="bg-red-50 text-red-700 px-4 py-2 rounded-md border border-red-100 font-bold text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {escalations.length} Pending Review
          </div>
        </div>

        {/* Data List / Empty State */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
            <p className="font-medium">Loading escalations queue...</p>
          </div>
        ) : escalations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-lg border border-gray-200 shadow-sm">
            <CheckCircle className="w-12 h-12 text-green-500 mb-3" />
            <h3 className="text-lg font-bold text-gray-900">All clear!</h3>
            <p className="text-gray-500 mt-1">There are no pending reports escalated to QC at this time.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {escalations.map((audit) => (
              <div 
                key={audit.id} 
                className="bg-white rounded-lg border border-red-200 shadow-sm overflow-hidden flex flex-col md:flex-row hover:border-red-300 transition-colors"
              >
                <div className="p-5 md:w-1/3 border-b md:border-b-0 md:border-r border-gray-100 bg-gray-50 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold bg-red-100 text-red-800 px-2 py-0.5 rounded uppercase tracking-wider">
                      Tier 2 Review
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg mt-2">{audit.branch_name || 'Unknown Branch'}</h3>
                  <p className="text-xs text-gray-500 font-mono">CODE: {audit.branch_code || 'N/A'}</p>
                  
                  <div className="mt-4 space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{audit.inspector_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="truncate">{audit.branch_location || 'Location Not Specified'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>{new Date(audit.time_in).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 md:w-2/3 flex flex-col justify-between bg-white">
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                      Admin Escalation Remarks
                    </h4>
                    <div className="bg-red-50 border border-red-100 rounded p-4 text-sm text-red-900 italic relative">
                      <span className="absolute top-2 left-2 text-red-200 text-3xl font-serif leading-none">"</span>
                      <p className="relative z-10 pl-4">{audit.escalation_remarks || 'No remarks provided by the operator.'}</p>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-mono">ID: {audit.id}</span>
                    <button
                      onClick={() => setSelectedAuditId(audit.id)}
                      className="bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold py-2 px-5 rounded shadow transition-colors flex items-center gap-2"
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
      </div>

      {selectedAuditId && (
        <AuditDetailPanel 
          auditId={selectedAuditId} 
          onClose={handleClosePanel}
          userRole={role || undefined} 
        />
      )}
    </main>
  );
}