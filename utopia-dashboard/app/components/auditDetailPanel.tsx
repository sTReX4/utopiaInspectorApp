'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle, Warning, X, XCircle } from '@phosphor-icons/react';

interface AuditDetailPanelProps {
    auditId: string | null;
    onClose: () => void;
    userRole?: 'admin' | 'superadmin';
}

const calculateDistanceInMeters = (
    lat1?: number | string | null, 
    lon1?: number | string | null, 
    lat2?: number | string | null, 
    lon2?: number | string | null
) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    
    const numLat1 = Number(lat1);
    const numLon1 = Number(lon1);
    const numLat2 = Number(lat2);
    const numLon2 = Number(lon2);

    const R = 6371e3; 
    const toRad = (value: number) => (value * Math.PI) / 180;
    const dLat = toRad(numLat2 - numLat1);
    const dLon = toRad(numLon2 - numLon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(numLat1)) * Math.cos(toRad(numLat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
};

export default function AuditDetailPanel({ auditId, onClose, userRole }: AuditDetailPanelProps) {
    const [auditData, setAuditData] = useState<any>(null);
    const [detachmentGps, setDetachmentGps] = useState<{lat: number, lng: number} | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [mapView, setMapView] = useState<'inspector' | 'detachment'>('inspector');
    
    const [isEscalating, setIsEscalating] = useState(false);
    const [escalationSuccess, setEscalationSuccess] = useState(false);
    const [escalationRemarks, setEscalationRemarks] = useState('');
    const [isResolving, setIsResolving] = useState(false);

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
                        setDetachmentGps({ lat: Number(detData.latitude), lng: Number(detData.longitude) });
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

    if (!auditId) return null; 

    const activeLat = mapView === 'inspector' ? auditData?.gps_latitude : detachmentGps?.lat;
    const activeLng = mapView === 'inspector' ? auditData?.gps_longitude : detachmentGps?.lng;
    const hasGps = activeLat && activeLng;

    const numLat = Number(activeLat);
    const numLng = Number(activeLng);
    const offset = 0.002; 
    
    const osmUrl = hasGps 
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${numLng - offset},${numLat - offset},${numLng + offset},${numLat + offset}&layer=mapnik&marker=${numLat},${numLng}`
    : null;

    const renderStatusBadge = (status: string | boolean | null | undefined, customText?: string) => {
        const text = customText || String(status);
        if (status === 'Valid' || status === true || status === 'Compliant' || status === 'Yes' || status === 'Secured') 
            return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-ok-bg text-xs font-medium tracking-[0.05em] text-ok-ink"><CheckCircle weight="fill" className="w-3 h-3 shrink-0" />{text}</span>;
        if (status === 'Missing' || status === false || status === 'Non-Compliant' || status === 'No' || status === 'Breached/Open') 
            return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-danger-bg text-xs font-medium tracking-[0.05em] text-danger-ink"><XCircle weight="fill" className="w-3 h-3 shrink-0" />{text}</span>;
        if (status === 'Expired') 
            return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-warn-bg text-xs font-medium tracking-[0.05em] text-warn-ink"><Warning weight="fill" className="w-3 h-3 shrink-0" />{text}</span>;
        
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-sunken text-xs font-medium tracking-[0.05em] text-ink-muted">{text}</span>;
    };

    const distance = calculateDistanceInMeters(
        auditData?.gps_latitude, auditData?.gps_longitude,
        detachmentGps?.lat, detachmentGps?.lng
    );
    
    // --- ESCALATION & ROUTING ENGINE ---
    const isAlarmResponse = auditData?.visit_type === 'Alarm Response' || !!auditData?.incident_remarks;
    
    const isGpsMismatch = distance !== null && distance > 100;
    const hasViolations = !!auditData?.violations_checklist;
    const hasDocumentIssues = auditData?.documents_checklist 
        ? Object.values(auditData.documents_checklist).some(status => status === 'Expired' || status === 'Missing')
        : false;
    const isUniformNonCompliant = auditData?.uniform_compliance === false || auditData?.uniform_status === false || auditData?.uniform_status === 'Non-Compliant';

    const needsEscalation = isGpsMismatch || hasViolations || hasDocumentIssues || isUniformNonCompliant;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm transition-colors duration-200" onClick={onClose} />

      <div className="relative w-full max-w-md md:max-w-3xl bg-surface h-full border-l border-line overflow-y-auto z-10 flex flex-col">
        
        <div className="bg-surface border-b border-line p-6 sticky top-0 z-20 flex justify-between items-center">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-ink">Audit Inspection Report</h2>
            <p className="text-xs text-ink-muted mt-1">ID: {auditId}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-ink-muted hover:text-ink transition-colors duration-200 flex items-center justify-center w-8 h-8 rounded-control">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-ink-muted my-auto text-xs">Loading Live Data...</div>
        ) : auditData ? (
          <div className="p-6 space-y-0 flex-1 divide-y divide-line">
            
            {needsEscalation && !isAlarmResponse && (
              <section className={`mb-8 p-5 border-l-4 ${
                auditData?.escalation_status === 'Resolved' ? 'bg-canvas border-shell-line border border-line' : 'bg-danger-bg/50 border-danger-ink border border-danger-ink/20'
              }`}>
                <div>
                  <h3 className={`text-xs font-bold flex items-center gap-2 ${
                    auditData?.escalation_status === 'Resolved' ? 'text-ink' : 'text-danger-ink'
                  }`}>
                    {auditData?.escalation_status === 'Resolved'
                      ? <><CheckCircle weight="fill" className="w-4 h-4 shrink-0" /> Escalation Resolved by Superadmin</>
                      : <><Warning weight="fill" className="w-4 h-4 shrink-0" /> QC/TBD Manager Review Required</>}
                  </h3>
                  <ul className={`text-xs mt-3 space-y-2 ${
                    auditData?.escalation_status === 'Resolved' ? 'text-ink-muted' : 'text-danger-ink'
                  }`}>
                    {isGpsMismatch && <li className="flex items-start gap-2"><span className="mt-1 w-1 h-1 rounded-control bg-current opacity-60 shrink-0"></span> <span><strong className="font-semibold">Tier 2 Location Mismatch:</strong> Inspector was {distance} meters away.</span></li>}
                    {hasViolations && <li className="flex items-start gap-2"><span className="mt-1 w-1 h-1 rounded-control bg-current opacity-60 shrink-0"></span> <span><strong className="font-semibold">Guard Violations:</strong> Inspector logged active uniform/equipment violations.</span></li>}
                    {hasDocumentIssues && <li className="flex items-start gap-2"><span className="mt-1 w-1 h-1 rounded-control bg-current opacity-60 shrink-0"></span> <span><strong className="font-semibold">Document Compliance:</strong> Inspector logged missing or expired operational licenses.</span></li>}
                    {isUniformNonCompliant && <li className="flex items-start gap-2"><span className="mt-1 w-1 h-1 rounded-control bg-current opacity-60 shrink-0"></span> <span><strong className="font-semibold">Uniform Non-Compliance:</strong> Inspector logged that the guard is not in proper uniform.</span></li>}
                  </ul>
                </div>

                {auditData?.escalation_status === 'Resolved' ? (
                   <div className="bg-surface border border-line text-ink p-3 rounded-control text-xs flex items-center justify-between mt-4">
                     <span>Case Closed. Record Archived.</span>
                   </div>
                ) : auditData?.escalation_status === 'Pending QC Review' ? (
                  <div className="flex flex-col gap-3 border-t border-danger-ink/20 pt-4 mt-4">
                    <div>
                      <span className="text-xs font-bold text-danger-ink">Admin Remarks:</span>
                      <p className="text-sm text-danger-ink bg-surface p-3 rounded-control border border-danger-ink/20 mt-1.5">
                        "{auditData.escalation_remarks || 'No remarks provided.'}"
                      </p>
                    </div>
                    {userRole === 'superadmin' && (
                      <button
                        onClick={handleResolveEscalation}
                        disabled={isResolving}
                        className={`self-end text-xs font-bold py-2 px-5 rounded-control transition-colors duration-200 w-full sm:w-auto ${
                          isResolving ? 'bg-line text-ink-muted cursor-not-allowed' : 'bg-ink hover:bg-shell-hover text-surface'
                        }`}
                      >
                        {isResolving ? 'Resolving...' : 'Mark as Resolved'}
                      </button>
                    )}
                  </div>
                ) : !escalationSuccess ? (
                  <div className="flex flex-col gap-3 border-t border-danger-ink/20 pt-4 mt-4">
                    <label className="text-xs font-bold text-danger-ink">Superadmin Context / Remarks</label>
                    <textarea
                      className="w-full p-3 text-sm text-ink bg-surface placeholder-ink-muted border border-danger-ink/20 rounded-control outline-none focus:border-ink focus:ring-1 focus:ring-info-ink resize-none"
                      rows={2}
                      placeholder="Explain why this requires Superadmin review..."
                      value={escalationRemarks}
                      onChange={(e) => setEscalationRemarks(e.target.value)}
                    />
                    <button
                      onClick={handleEscalateReport}
                      disabled={isEscalating || !escalationRemarks.trim()}
                      className={`self-end text-xs font-bold py-2 px-5 rounded-control transition-colors duration-200 w-full sm:w-auto ${
                        isEscalating || !escalationRemarks.trim() 
                          ? 'bg-sunken text-ink-muted cursor-not-allowed' 
                          : 'bg-danger-ink hover:bg-danger-ink-hover text-surface'
                      }`}
                    >
                      {isEscalating ? 'Escalating...' : 'Submit Escalation'}
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 bg-surface border border-line text-ink p-3 rounded-control text-xs flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5"><CheckCircle weight="fill" className="w-4 h-4 shrink-0 text-ok-ink" />Escalated to QC</span>
                    <span className="text-ink-muted">Remarks attached.</span>
                  </div>
                )}
              </section>
            )}

            {/* 1. Detachment Info */}
            <section className="py-6">
              <h3 className="text-xs font-bold text-ink mb-5">Detachment Info</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4">
                <div>
                  <span className="text-xs text-ink-muted block mb-1">Branch Name</span>
                  <span className="text-sm font-medium text-ink">{auditData.branch_name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-xs text-ink-muted block mb-1">Branch Code</span>
                  <span className="text-sm text-ink">{auditData.branch_code || 'N/A'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-xs text-ink-muted block mb-1">Location</span>
                  <span className="text-sm text-ink">{auditData.branch_location || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-xs text-ink-muted block mb-1">Time In (Arrival)</span>
                  <span className="text-sm text-ink">
                    {auditData.time_in ? new Date(auditData.time_in).toLocaleString() : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-ink-muted block mb-1">Time Out (Submitted)</span>
                  <span className="text-sm text-ink">
                    {auditData.time_out ? new Date(auditData.time_out).toLocaleString() : 'N/A'}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-xs text-ink-muted block mb-1">Inspector</span>
                  <span className="text-sm font-medium text-ink">{auditData.inspector_name}</span>
                </div>
              </div>
            </section>

            {/* 2. Location / GPS Map */}
            <section className="py-6">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-xs font-bold text-ink">GPS Location</h3>
                <div className="flex border border-line">
                  <button
                    onClick={() => setMapView('inspector')}
                    className={`text-xs px-3 py-1 transition-colors duration-200 ${mapView === 'inspector' ? 'bg-ink text-surface' : 'bg-surface text-ink-muted hover:text-ink hover:bg-sunken'}`}
                  >
                    Inspector
                  </button>
                  <button
                    onClick={() => {
                        if (detachmentGps) setMapView('detachment');
                        else alert("No GPS coordinates registered for this detachment. Please assign them on the Sites & Detachments page.");
                    }}
                    className={`text-xs px-3 py-1 transition-colors duration-200 border-l border-line ${mapView === 'detachment' ? 'bg-ink text-surface' : 'bg-surface text-ink-muted hover:text-ink hover:bg-sunken'} ${!detachmentGps ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={!detachmentGps ? 'Detachment coordinates missing in database' : 'View Detachment Location'}
                  >
                    Detachment
                  </button>
                </div>
              </div>
              
              <div className="border border-line bg-canvas">
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
                  <div className="h-48 flex flex-col items-center justify-center text-ink-muted text-xs">
                    <span>📍 Map unavailable for {mapView}</span>
                  </div>
                )}
                <div className="bg-surface p-3 text-center flex flex-col items-center justify-center border-t border-line">
                  <span className="text-xs text-ink-muted">
                    Lat: {activeLat || 'N/A'} | Lng: {activeLng || 'N/A'}
                  </span>
                  
                  {mapView === 'inspector' && auditData?.branch_location && (
                    <span className="text-xs text-ink mt-2 border border-line px-2 py-1">
                      QR Location: {auditData.branch_location}
                    </span>
                  )}
                  {mapView === 'detachment' && (
                     <span className="text-xs text-ink mt-2 border border-line px-2 py-1">
                      Official Registered Location
                    </span>
                  )}
                </div>
              </div>
            </section>

            {/* 3. Guard Evidence / Incident Details */}
            <section className="py-6">
               <h3 className="text-xs font-bold text-ink mb-5">
                 {isAlarmResponse ? 'Incident Resolution Evidence' : 'Guard Identity & Equipment'}
               </h3>
               <div className="flex flex-col sm:flex-row gap-8">
                 
                 <div className="w-full sm:w-1/3">
                   <div className="border border-line bg-canvas h-56">
                      {auditData.live_photo_url ? (
                        <img src={auditData.live_photo_url} alt="Live Evidence" className="w-full h-full object-cover" />
                      ) : (
                        <div className="h-full flex items-center justify-center text-ink-muted text-xs">No Photo</div>
                      )}
                   </div>
                 </div>

                 <div className="w-full sm:w-2/3 flex flex-col gap-y-6">
                   {isAlarmResponse ? (
                     <div className="flex flex-col gap-4 h-full">
                       <div className="bg-danger-bg border border-danger-ink/20 p-5">
                         <span className="text-xs text-danger-ink block mb-2 border-b border-danger-ink/20 pb-2">Active Incident Dispatch</span>
                         <span className="text-xs text-ink-muted block mb-1.5 mt-4">Resolution Remarks</span>
                         <p className="text-sm text-ink font-medium leading-relaxed">
                           {auditData.incident_remarks || 'No incident remarks provided.'}
                         </p>
                       </div>

                       {/* The same site condition a no-show records. On an alarm
                         * response it is the point of the visit, so it belongs
                         * beside the resolution rather than under a guard. */}
                       {auditData.guard_present_status && (
                         <div className="bg-canvas border border-line p-4">
                           <span className="text-xs text-ink block mb-4 border-b border-line pb-2">Site Condition On Arrival</span>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                             <div>
                               <span className="text-xs text-ink-muted block mb-1">ATM Status</span>
                               <div>
                                 {renderStatusBadge(
                                   auditData.guard_present_status.atm_online
                                     ? true
                                     : (auditData.guard_present_status.atm_offline ? false : null),
                                   auditData.guard_present_status.atm_online
                                     ? 'ONLINE'
                                     : (auditData.guard_present_status.atm_offline ? 'OFFLINE' : 'UNCHECKED')
                                 )}
                               </div>
                             </div>
                             <div>
                               <span className="text-xs text-ink-muted block mb-1">Facility Doors Secure</span>
                               <div>{renderStatusBadge(auditData.guard_present_status.door_secure ? 'Secured' : 'Breached/Open')}</div>
                             </div>
                           </div>
                         </div>
                       )}
                     </div>
                   ) : (
                     <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                        <div className="col-span-2">
                          <span className="text-xs text-ink-muted block mb-1.5">Guard on Post</span>
                          {auditData.guard_present_status ? (
                            renderStatusBadge(false, 'NO-SHOW (ABSENT)')
                          ) : (
                            <span className="text-sm font-medium text-ink">{auditData.guard_name || 'PRESENT'}</span>
                          )}
                        </div>

                        {!auditData.guard_present_status && (
                          <>
                            <div>
                              <span className="text-xs text-ink-muted block mb-1.5">Uniform Compliance</span>
                              {renderStatusBadge(
                                  auditData.uniform_compliance === true || auditData.uniform_status === 'Compliant' || auditData.uniform_status === true, 
                                  (auditData.uniform_compliance === true || auditData.uniform_status === 'Compliant' || auditData.uniform_status === true) ? 'Compliant' : 'Non-Compliant'
                              )}
                            </div>
                            <div>
                              <span className="text-xs text-ink-muted block mb-1.5">LESP Expiry</span>
                              <span className="text-sm text-ink">{auditData.lesp_expiry || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-xs text-ink-muted block mb-1.5">Firearm Make</span>
                              <span className="text-sm text-ink">{auditData.firearm_make || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-xs text-ink-muted block mb-1.5">Firearm Serial</span>
                              <span className="text-sm text-ink">{auditData.firearm_serial || 'N/A'}</span>
                            </div>
                          </>
                        )}

                        {auditData.guard_present_status && (() => {
                          const isOnline = auditData.guard_present_status.atm_online;
                          const isOffline = auditData.guard_present_status.atm_offline;
                          
                          const atmStatusValue = isOnline ? true : (isOffline ? false : null);
                          const atmStatusText = isOnline ? 'ONLINE' : (isOffline ? 'OFFLINE' : 'UNCHECKED');

                          return (
                            <div className="col-span-2 bg-canvas border border-line p-4 mt-2">
                              <span className="text-xs text-ink block mb-4 border-b border-line pb-2">Emergency Facility Status</span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                                <div>
                                  <span className="text-xs text-ink-muted block mb-1">ATM Status</span>
                                  <div>{renderStatusBadge(atmStatusValue, atmStatusText)}</div>
                                </div>
                                <div>
                                  <span className="text-xs text-ink-muted block mb-1">Facility Doors Secure</span>
                                  <div>{renderStatusBadge(auditData.guard_present_status.door_secure ? 'Secured' : 'Breached/Open')}</div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                     </div>
                   )}
                 </div>
               </div>
               
               {!isAlarmResponse && (
                 <div className="mt-8">
                   <span className="text-xs text-ink-muted block mb-2">General Remarks</span>
                   <p className="bg-surface p-4 border border-line text-ink text-sm leading-relaxed">
                     {auditData.remarks || 'No remarks logged.'}
                   </p>
                 </div>
               )}
            </section>

            {/* 4. Document Checklist */}
            {!isAlarmResponse && auditData.documents_checklist && (
              <section className="py-6">
                <h3 className="text-xs font-bold text-ink mb-5">Document Compliance</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {Object.entries(auditData.documents_checklist).map(([key, value]) => (
                    <div key={key} className="flex flex-col gap-1.5 border-l border-line pl-3">
                      <span className="text-xs text-ink-muted block">
                        {key.replace('_license', '')}
                      </span>
                      <div>{renderStatusBadge(value as string)}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 5. Violations Ticket */}
            {!isAlarmResponse && auditData.violations_checklist && (
              <section className="py-6">
                <h3 className="text-xs font-bold text-danger-ink mb-5 flex items-center gap-2">
                  <span className="w-2 h-2 bg-danger-ink rounded-full"></span>
                  Violation Ticket Issued
                </h3>
                <div className="bg-surface border border-danger-ink/20 p-5">
                  <div className="grid grid-cols-2 gap-6 mb-6 pb-6 border-b border-danger-ink/20">
                    <div>
                      <span className="text-xs text-ink-muted block mb-1">Security License No.</span>
                      <span className="text-sm font-medium text-ink">{auditData.violations_checklist.security_license_no || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-xs text-ink-muted block mb-1">License Expiry</span>
                      <span className="text-sm font-medium text-ink">{auditData.violations_checklist.security_license_expiry || 'N/A'}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                    {Object.entries(auditData.violations_checklist)
                      .filter(([key]) => key !== 'security_license_no' && key !== 'security_license_expiry' && key !== 'violation_remarks')
                      .map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center border-b border-line pb-2">
                          <span className="capitalize text-xs text-ink">{key.replace(/_/g, ' ')}</span>
                          {renderStatusBadge(value as string)}
                        </div>
                      ))}
                  </div>

                  {auditData.violations_checklist.violation_remarks && (
                    <div className="mt-6 pt-5 border-t border-danger-ink/20">
                      <span className="text-xs text-ink-muted block mb-2">Violation Details</span>
                      <p className="text-sm text-ink leading-relaxed">{auditData.violations_checklist.violation_remarks}</p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* 6. Signatures */}
            <section className="py-6">
              <h3 className="text-xs font-bold text-ink mb-5">Captured Signatures</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                {/* LEFT: Guard / Inspector Signature */}
                <div className="border border-line p-5 bg-surface flex flex-col justify-between">
                  <h4 className="text-xs font-bold text-ink-muted mb-4">
                    {isAlarmResponse ? 'Inspector Signature' : 'Guard Signature'}
                  </h4>
                  {auditData.guard_signature && auditData.guard_signature.startsWith('data:image') ? (
                    <img src={auditData.guard_signature} alt="Guard Signature" className="h-24 object-contain mix-blend-multiply border border-line bg-canvas w-full" />
                  ) : (
                    <div className="h-24 flex items-center justify-center border border-danger-ink/20 bg-danger-bg">
                      <span className="text-xs font-bold text-danger-ink">
                        Missing / Not Signed
                      </span>
                    </div>
                  )}
                  <div className="mt-4 pt-4 border-t border-line text-xs font-semibold text-ink">
                    {isAlarmResponse ? auditData.inspector_name : (auditData.guard_name || 'N/A')}
                  </div>
                </div>

                {/* RIGHT: Client Signature */}
                <div className="border border-line p-5 bg-surface flex flex-col justify-between">
                  <h4 className="text-xs font-bold text-ink-muted mb-4">Client Signature</h4>
                  
                  {auditData.inspector_signature === 'UNAVAILABLE_ON_SITE' || !auditData.inspector_signature ? (
                     <div className="h-24 flex items-center justify-center border border-line bg-canvas">
                       <span className="text-xs font-bold text-ink-muted">
                         Unavailable On Site
                       </span>
                     </div>
                  ) : auditData.inspector_signature.startsWith('data:image') ? (
                    <img src={auditData.inspector_signature} alt="Client Signature" className="h-24 object-contain mix-blend-multiply border border-line bg-canvas w-full" />
                  ) : (
                     <div className="h-24 flex items-center justify-center border border-line bg-canvas">
                       <span className="text-xs font-bold text-ink-muted">
                         No Signature
                       </span>
                     </div>
                  )}
                  <div className="mt-4 pt-4 border-t border-line text-xs font-semibold text-ink">
                    Verified Representative
                  </div>
                </div>

              </div>
            </section>

          </div>
        ) : (
           <div className="p-8 text-center text-danger-ink text-xs my-auto">Failed to load record details.</div>
        )}
      </div>
    </div>
  );
}