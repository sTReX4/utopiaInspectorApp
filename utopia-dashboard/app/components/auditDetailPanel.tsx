'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface AuditDetailPanelProps {
    auditId: string | null;
    onClose: () => void;
    userRole?: 'admin' | 'superadmin';
}

// Math function to calculate the physical distance (in meters) between two GPS coordinates
const calculateDistanceInMeters = (
    lat1?: number | null, 
    lon1?: number | null, 
    lat2?: number | null, 
    lon2?: number | null
) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371e3; // Earth radius in meters
    const toRad = (value: number) => (value * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
};

export default function AuditDetailPanel({ auditId, onClose, userRole }: AuditDetailPanelProps) {
    const [auditData, setAuditData] = useState<any>(null);
    const [detachmentGps, setDetachmentGps] = useState<{lat: number, lng: number} | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [mapView, setMapView] = useState<'inspector' | 'detachment'>('inspector');
    
    // --- E-Signature Request States ---
    const [clientEmail, setClientEmail] = useState('');
    const [isRequestingSig, setIsRequestingSig] = useState(false);
    const [requestSuccess, setRequestSuccess] = useState(false);

    // --- QC/TBD Manager Escalation States ---
    const [isEscalating, setIsEscalating] = useState(false);
    const [escalationSuccess, setEscalationSuccess] = useState(false);
    const [escalationRemarks, setEscalationRemarks] = useState('');

    const [isResolving, setIsResolving] = useState(false);

    const handleRequestSignature = async () => {
        if (!clientEmail) return;
        setIsRequestingSig(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1200));
            setRequestSuccess(true);
        } catch (error) {
            console.error('Error sending request:', error);
        } finally {
            setIsRequestingSig(false);
        }
    };

    const handleEscalateReport = async () => {
        if (!escalationRemarks.trim()) return;
        
        setIsEscalating(true);
        try {
            const { error } = await supabase
                .from('audits')
                .update({ 
                    escalation_status: 'Pending QC Review',
                    escalation_remarks: escalationRemarks 
                })
                .eq('id', auditId);

            if (error) throw error;
            
            setEscalationSuccess(true);
        } catch (error) {
            console.error('Error escalating report:', error);
        } finally {
            setIsEscalating(false);
        }
    };

    const handleResolveEscalation = async () => {
        setIsResolving(true);
        try {
            const { error } = await supabase
                .from('audits')
                .update({ escalation_status: 'Resolved' })
                .eq('id', auditId);

            if (error) throw error;
            
            setAuditData((prev: any) => ({ ...prev, escalation_status: 'Resolved' }));
        } catch (error) {
            console.error('Error resolving report:', error);
        } finally {
            setIsResolving(false);
        }
    };

    useEffect(() => {
        if (!auditId) {
            setAuditData(null);
            setDetachmentGps(null);
            setMapView('inspector');
            setEscalationSuccess(false);
            setEscalationRemarks('');
            setIsResolving(false);
            return;
        }

        const fetchAuditDetails = async () => {
            setIsLoading(true);
            try {
                const { data, error } = await supabase.from('audits').select('*').eq('id', auditId).single();
                if (error) throw error;
                setAuditData(data);

                if (data?.branch_code) {
                    const { data: detData } = await supabase
                        .from('detachments')
                        .select('latitude, longitude')
                        .eq('branch_code', data.branch_code)
                        .single();

                    if (detData && detData.latitude && detData.longitude) {
                        setDetachmentGps({ lat: detData.latitude, lng: detData.longitude });
                    } else {
                        setDetachmentGps(null);
                    }
                }
            } catch (error) {
                console.error('Error fetching audit details:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAuditDetails();
    }, [auditId]);

    if (!auditId) {
        return null; 
    }

    const activeLat = mapView === 'inspector' ? auditData?.gps_latitude : detachmentGps?.lat;
    const activeLng = mapView === 'inspector' ? auditData?.gps_longitude : detachmentGps?.lng;
    const hasGps = activeLat && activeLng;

    const offset = 0.002; 
    const osmUrl = hasGps 
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${activeLng - offset},${activeLat - offset},${activeLng + offset},${activeLat + offset}&layer=mapnik&marker=${activeLat},${activeLng}`
    : null;

    // Enterprise Status Badge Renderer
    const renderStatusBadge = (status: string | boolean | null | undefined, customText?: string) => {
        const text = customText || String(status);
        if (status === 'Valid' || status === true || status === 'Compliant' || status === 'Yes' || status === 'Secured') 
            return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60 uppercase tracking-wider">{text}</span>;
        if (status === 'Missing' || status === false || status === 'Non-Compliant' || status === 'No' || status === 'Breached/Open') 
            return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 ring-1 ring-red-200/60 uppercase tracking-wider">{text}</span>;
        if (status === 'Expired') 
            return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 ring-1 ring-amber-200/60 uppercase tracking-wider">{text}</span>;
        
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 ring-1 ring-slate-200/60 uppercase tracking-wider">{text}</span>;
    };

    const distance = calculateDistanceInMeters(
        auditData?.gps_latitude, auditData?.gps_longitude,
        detachmentGps?.lat, detachmentGps?.lng
    );
    
    // --- ESCALATION LOGIC ENGINE ---
    const isGpsMismatch = distance !== null && distance > 100;
    const hasViolations = !!auditData?.violations_checklist;
    
    // NEW: Scans the JSON object to see if ANY license is missing or expired
    const hasDocumentIssues = auditData?.documents_checklist 
        ? Object.values(auditData.documents_checklist).some(status => status === 'Expired' || status === 'Missing')
        : false;

    // Trigger escalation if any of the three thresholds are breached
    const needsEscalation = isGpsMismatch || hasViolations || hasDocumentIssues;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative w-full max-w-md md:max-w-3xl bg-slate-50 h-full shadow-2xl border-l border-slate-200 overflow-y-auto z-10 flex flex-col">
        
        {/* Enterprise Header */}
        <div className="bg-white border-b border-slate-200 p-6 sticky top-0 z-20 flex justify-between items-center shadow-sm">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">Audit Inspection Report</h2>
            <p className="text-[11px] text-slate-400 font-mono font-medium uppercase tracking-widest mt-1">ID: {auditId}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors text-2xl font-light leading-none flex items-center justify-center w-8 h-8 rounded-md hover:bg-slate-100">
            &times;
          </button>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-500 my-auto text-sm font-medium">Loading live audit data...</div>
        ) : auditData ? (
          <div className="p-6 space-y-6 flex-1">
            
            {/* --- AUTOMATED QC/TBD ESCALATION BANNER --- */}
            {needsEscalation && (
              <section className={`p-5 rounded-xl border shadow-sm flex flex-col gap-4 ${
                auditData?.escalation_status === 'Resolved' ? 'bg-emerald-50/50 border-emerald-200' : 'bg-red-50/50 border-red-200'
              }`}>
                <div>
                  <h3 className={`text-sm font-semibold flex items-center gap-2 ${
                    auditData?.escalation_status === 'Resolved' ? 'text-emerald-800' : 'text-red-800'
                  }`}>
                    {auditData?.escalation_status === 'Resolved' 
                      ? '✓ Escalation Resolved by Superadmin' 
                      : '⚠️ QC/TBD Manager Review Required'}
                  </h3>
                  <ul className={`text-xs mt-2 space-y-1.5 ${
                    auditData?.escalation_status === 'Resolved' ? 'text-emerald-700' : 'text-red-700'
                  }`}>
                    {isGpsMismatch && <li className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-current opacity-60"></span> <span className="font-semibold">Tier 2 Location Mismatch:</span> Inspector was {distance} meters away.</li>}
                    {hasViolations && <li className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-current opacity-60"></span> <span className="font-semibold">Guard Violations:</span> Inspector logged active uniform/equipment violations.</li>}
                    
                    {/* NEW: Document issue render logic */}
                    {hasDocumentIssues && <li className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-current opacity-60"></span> <span className="font-semibold">Document Compliance:</span> Inspector logged missing or expired operational licenses.</li>}
                  </ul>
                </div>

                {auditData?.escalation_status === 'Resolved' ? (
                   <div className="bg-white border border-emerald-200 text-emerald-800 p-3 rounded-lg text-xs font-semibold flex items-center justify-between shadow-sm mt-2">
                     <span>Case Closed. Record Archived.</span>
                   </div>
                ) : auditData?.escalation_status === 'Pending QC Review' ? (
                  <div className="flex flex-col gap-3 border-t border-red-200/60 pt-4 mt-1">
                    <div>
                      <span className="text-[10px] font-bold text-red-800 uppercase tracking-wider">Admin Remarks:</span>
                      <p className="text-sm text-red-900 bg-white p-3 rounded-lg border border-red-100 mt-1.5 shadow-sm">
                        "{auditData.escalation_remarks || 'No remarks provided.'}"
                      </p>
                    </div>
                    {userRole === 'superadmin' && (
                      <button
                        onClick={handleResolveEscalation}
                        disabled={isResolving}
                        className={`self-end text-xs font-semibold py-2 px-5 rounded-lg shadow-sm transition-colors w-full sm:w-auto ${
                          isResolving ? 'bg-emerald-400 text-white cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white ring-1 ring-emerald-700/50'
                        }`}
                      >
                        {isResolving ? 'Resolving...' : 'Mark as Resolved'}
                      </button>
                    )}
                  </div>
                ) : !escalationSuccess ? (
                  <div className="flex flex-col gap-3 border-t border-red-200/60 pt-4 mt-1">
                    <label className="text-[10px] font-bold text-red-800 uppercase tracking-wider">Superadmin Context / Remarks</label>
                    <textarea
                      className="w-full p-2.5 text-sm text-slate-900 bg-white placeholder-slate-400 border border-red-200 rounded-lg outline-none focus:ring-2 focus:ring-red-500/40 resize-none shadow-sm"
                      rows={2}
                      placeholder="Explain why this requires Superadmin review..."
                      value={escalationRemarks}
                      onChange={(e) => setEscalationRemarks(e.target.value)}
                    />
                    <button
                      onClick={handleEscalateReport}
                      disabled={isEscalating || !escalationRemarks.trim()}
                      className={`self-end text-xs font-semibold py-2 px-5 rounded-lg shadow-sm transition-colors w-full sm:w-auto ${
                        isEscalating || !escalationRemarks.trim() 
                          ? 'bg-red-300 text-white cursor-not-allowed' 
                          : 'bg-red-600 hover:bg-red-700 text-white ring-1 ring-red-700/50'
                      }`}
                    >
                      {isEscalating ? 'Escalating...' : 'Submit Escalation'}
                    </button>
                  </div>
                ) : (
                  <div className="mt-2 bg-white border border-emerald-200 text-emerald-800 p-3 rounded-lg text-xs font-semibold flex items-center justify-between shadow-sm">
                    <span>✓ Successfully Escalated to QC</span>
                    <span className="font-medium text-emerald-600 italic">Remarks attached.</span>
                  </div>
                )}
              </section>
            )}

            {/* 1. Detachment Info */}
            <section className="enterprise-card p-5">
              <h3 className="text-sm font-semibold text-slate-900 border-b micro-border pb-3 mb-4">Detachment Info</h3>
              <div className="grid grid-cols-2 gap-y-5 gap-x-4">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider mb-1">Branch Name</span>
                  <span className="text-sm font-medium text-slate-900">{auditData.branch_name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider mb-1">Branch Code</span>
                  <span className="text-sm font-medium text-slate-900">{auditData.branch_code || 'N/A'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider mb-1">Location</span>
                  <span className="text-sm font-medium text-slate-700">{auditData.branch_location || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider mb-1">Time In (Arrival)</span>
                  <span className="text-sm font-medium text-slate-900">
                    {auditData.time_in ? new Date(auditData.time_in).toLocaleString() : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider mb-1">Time Out (Submitted)</span>
                  <span className="text-sm font-medium text-slate-900">
                    {auditData.time_out ? new Date(auditData.time_out).toLocaleString() : 'N/A'}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider mb-1">Inspector</span>
                  <span className="text-sm font-medium text-slate-900">{auditData.inspector_name}</span>
                </div>
              </div>
            </section>

            {/* 2. Location / GPS Map */}
            <section className="enterprise-card p-5">
              <div className="flex justify-between items-center border-b micro-border pb-3 mb-4">
                <h3 className="text-sm font-semibold text-slate-900">GPS Location Verification</h3>
                {detachmentGps && (
                  <div className="flex bg-slate-100 rounded-lg p-1 ring-1 ring-slate-200/50">
                    <button
                      onClick={() => setMapView('inspector')}
                      className={`text-[11px] px-3 py-1 rounded-md transition-all font-semibold ${mapView === 'inspector' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/60' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Inspector
                    </button>
                    <button
                      onClick={() => setMapView('detachment')}
                      className={`text-[11px] px-3 py-1 rounded-md transition-all font-semibold ${mapView === 'detachment' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/60' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Detachment
                    </button>
                  </div>
                )}
              </div>
              
              <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50">
                {osmUrl ? (
                  <iframe 
                    width="100%" 
                    height="192" 
                    frameBorder="0" 
                    scrolling="no" 
                    src={osmUrl} 
                    className="w-full h-48 border-0"
                  />
                ) : (
                  <div className="h-48 flex flex-col items-center justify-center text-slate-400 text-sm font-medium">
                    <span>📍 Map unavailable for {mapView}</span>
                  </div>
                )}
                <div className="bg-white p-3 text-center flex flex-col items-center justify-center border-t border-slate-200">
                  <span className="text-[11px] text-slate-400 font-mono font-medium tracking-wide">
                    Lat: {activeLat || 'N/A'} | Lng: {activeLng || 'N/A'}
                  </span>
                  
                  {mapView === 'inspector' && auditData?.branch_location && (
                    <span className="text-[10px] text-slate-600 mt-2 font-semibold bg-slate-100 px-3 py-1 rounded-md ring-1 ring-slate-200/60 uppercase tracking-wider">
                      📍 QR Scan Location: {auditData.branch_location}
                    </span>
                  )}
                  {mapView === 'detachment' && (
                     <span className="text-[10px] text-blue-700 mt-2 font-semibold bg-blue-50 px-3 py-1 rounded-md ring-1 ring-blue-200/60 uppercase tracking-wider">
                      🏢 Official Registered Location
                    </span>
                  )}
                </div>
              </div>
            </section>

            {/* 3. Guard Evidence & Identification */}
            <section className="enterprise-card p-5">
               <h3 className="text-sm font-semibold text-slate-900 border-b micro-border pb-3 mb-4">Guard Identity & Equipment</h3>
               <div className="flex flex-col sm:flex-row gap-6">
                 
                 <div className="w-full sm:w-1/3">
                   <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100 h-48">
                      {auditData.live_photo_url ? (
                        <img src={auditData.live_photo_url} alt="Live Evidence" className="w-full h-full object-cover" />
                      ) : (
                        <div className="h-full flex items-center justify-center text-slate-400 text-xs font-medium uppercase tracking-widest">No Photo</div>
                      )}
                   </div>
                 </div>

                 <div className="w-full sm:w-2/3 grid grid-cols-2 gap-y-5 gap-x-4">
                    <div className="col-span-2">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider mb-1.5">Guard on Post</span>
                      {auditData.guard_present_status ? (
                        renderStatusBadge(false, 'NO-SHOW (ABSENT)')
                      ) : (
                        <span className="text-sm font-medium text-slate-900">{auditData.guard_name || 'PRESENT'}</span>
                      )}
                    </div>

                    {!auditData.guard_present_status && (
                      <>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider mb-1.5">Uniform Compliance</span>
                          {renderStatusBadge(auditData.uniform_status === 'Compliant' || auditData.uniform_status === true, auditData.uniform_status === 'Compliant' || auditData.uniform_status === true ? 'Compliant' : 'Non-Compliant')}
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider mb-1.5">LESP Expiry</span>
                          <span className="text-sm font-medium text-slate-900">{auditData.lesp_expiry || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider mb-1.5">Firearm Make</span>
                          <span className="text-sm font-medium text-slate-900">{auditData.firearm_make || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider mb-1.5">Firearm Serial</span>
                          <span className="text-sm font-mono text-slate-700">{auditData.firearm_serial || 'N/A'}</span>
                        </div>
                      </>
                    )}

                    {auditData.guard_present_status && (
                      <div className="col-span-2 bg-slate-50 border border-slate-200 p-4 rounded-xl mt-1">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider mb-3">Emergency Facility Status</span>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col border-b border-slate-200/60 pb-2">
                            <span className="text-xs text-slate-500 mb-1">ATM Online</span>
                            <div>{renderStatusBadge(auditData.guard_present_status.atm_online)}</div>
                          </div>
                          <div className="flex flex-col border-b border-slate-200/60 pb-2">
                            <span className="text-xs text-slate-500 mb-1">ATM Offline</span>
                            <div>{renderStatusBadge(!auditData.guard_present_status.atm_offline, auditData.guard_present_status.atm_offline ? 'Yes' : 'No')}</div>
                          </div>
                          <div className="flex flex-col col-span-2">
                            <span className="text-xs text-slate-500 mb-1">Facility Doors Secure</span>
                            <div>{renderStatusBadge(auditData.guard_present_status.door_secure ? 'Secured' : 'Breached/Open')}</div>
                          </div>
                        </div>
                      </div>
                    )}
                 </div>
               </div>
               
               <div className="mt-6">
                 <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider mb-2">General Remarks</span>
                 <p className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-slate-700 text-sm leading-relaxed">
                   {auditData.remarks || 'No remarks logged.'}
                 </p>
               </div>
            </section>

            {/* 4. Document Checklist */}
            {auditData.documents_checklist && (
              <section className="enterprise-card p-5">
                <h3 className="text-sm font-semibold text-slate-900 border-b micro-border pb-3 mb-4">Document Compliance</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries(auditData.documents_checklist).map(([key, value]) => (
                    <div key={key} className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex flex-col justify-center">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider mb-1.5">
                        {key.replace('_license', '')}
                      </span>
                      <div>{renderStatusBadge(value as string)}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 5. Violations Ticket */}
            {auditData.violations_checklist && (
              <section className="enterprise-card p-5 border-red-200 ring-1 ring-red-100">
                <h3 className="text-sm font-semibold text-red-700 border-b border-red-100 pb-3 mb-4">Violation Ticket Issued</h3>
                <div className="bg-red-50/30 p-4 rounded-xl border border-red-100 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider mb-1">Security License No.</span>
                      <span className="font-mono text-sm font-medium text-slate-900">{auditData.violations_checklist.security_license_no || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider mb-1">License Expiry</span>
                      <span className="text-sm font-medium text-slate-900">{auditData.violations_checklist.security_license_expiry || 'N/A'}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 pt-4 border-t border-red-100">
                    {Object.entries(auditData.violations_checklist)
                      .filter(([key]) => key !== 'security_license_no' && key !== 'security_license_expiry' && key !== 'violation_remarks')
                      .map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center border-b border-red-50 pb-2">
                          <span className="capitalize text-xs text-slate-600 font-medium">{key.replace(/_/g, ' ')}</span>
                          {renderStatusBadge(value as string)}
                        </div>
                      ))}
                  </div>

                  {auditData.violations_checklist.violation_remarks && (
                    <div className="mt-4 pt-4 border-t border-red-200/60">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider mb-2">Violation Details</span>
                      <p className="text-sm text-slate-800 bg-white p-3 rounded-lg border border-red-100 shadow-sm leading-relaxed">{auditData.violations_checklist.violation_remarks}</p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* 6. Signatures */}
            <section className="enterprise-card p-5">
              <h3 className="text-sm font-semibold text-slate-900 border-b micro-border pb-3 mb-4">Captured Signatures</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                
                {/* LEFT: Guard Signature */}
                <div className="border border-slate-200 rounded-xl p-4 text-center bg-slate-50 flex flex-col justify-between">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Guard Signature</h4>
                  {auditData.guard_signature && auditData.guard_signature.startsWith('data:image') ? (
                    <img src={auditData.guard_signature} alt="Guard Signature" className="h-20 mx-auto object-contain mix-blend-multiply" />
                  ) : (
                    <div className="h-20 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-red-600 bg-red-50 ring-1 ring-red-200/60 px-3 py-1 rounded-md uppercase tracking-wider">
                        Missing / Not Signed
                      </span>
                    </div>
                  )}
                  <div className="mt-3 pt-3 border-t border-slate-200 text-xs font-semibold text-slate-700">
                    {auditData.guard_name || 'N/A'}
                  </div>
                </div>

                {/* RIGHT: Client Signature */}
                <div className="border border-slate-200 rounded-xl p-4 text-center bg-slate-50 flex flex-col justify-between">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Client Signature</h4>
                  
                  {auditData.inspector_signature === 'UNAVAILABLE_ON_SITE' || !auditData.inspector_signature ? (
                     <div className="flex flex-col items-center justify-center space-y-3 h-20">
                       <span className="text-[10px] font-bold text-amber-700 bg-amber-50 ring-1 ring-amber-200/60 px-3 py-1 rounded-md uppercase tracking-wider">
                         Unavailable On Site
                       </span>
                       
                       {requestSuccess ? (
                         <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200/60 px-3 py-1 rounded-md uppercase tracking-wider">
                           ✓ Link Sent
                         </span>
                       ) : (
                         <div className="w-full flex space-x-2">
                           <input 
                             type="email" 
                             placeholder="Client email..." 
                             className="w-full text-xs p-1.5 border border-slate-200 rounded-md outline-none focus:ring-2 focus:ring-blue-500/40 shadow-sm"
                             value={clientEmail}
                             onChange={(e) => setClientEmail(e.target.value)}
                           />
                           <button 
                             onClick={handleRequestSignature}
                             disabled={isRequestingSig || !clientEmail}
                             className={`text-[10px] font-bold px-3 rounded-md transition-colors whitespace-nowrap uppercase tracking-wide ${isRequestingSig || !clientEmail ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm ring-1 ring-blue-700/50'}`}
                           >
                             {isRequestingSig ? 'Sending...' : 'Request'}
                           </button>
                         </div>
                       )}
                     </div>
                  ) : auditData.inspector_signature.startsWith('data:image') ? (
                    <img src={auditData.inspector_signature} alt="Client Signature" className="h-20 mx-auto object-contain mix-blend-multiply" />
                  ) : (
                     <div className="h-20 flex items-center justify-center">
                       <span className="text-[10px] font-bold text-slate-500 bg-slate-100 ring-1 ring-slate-200/60 px-3 py-1 rounded-md uppercase tracking-wider">
                         No Signature
                       </span>
                     </div>
                  )}
                  <div className="mt-3 pt-3 border-t border-slate-200 text-xs font-semibold text-slate-700">Verified Representative</div>
                </div>

              </div>
            </section>

          </div>
        ) : (
           <div className="p-8 text-center text-red-500 my-auto text-sm font-medium">Failed to load record details from database.</div>
        )}
      </div>
    </div>
  );
}