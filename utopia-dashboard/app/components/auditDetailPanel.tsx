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
    lat1?: number | string | null, 
    lon1?: number | string | null, 
    lat2?: number | string | null, 
    lon2?: number | string | null
) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    
    // Safely cast to Numbers to prevent string math errors
    const numLat1 = Number(lat1);
    const numLon1 = Number(lon1);
    const numLat2 = Number(lat2);
    const numLon2 = Number(lon2);

    const R = 6371e3; // Earth radius in meters
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
    
    // --- QC/TBD Manager Escalation States ---
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

    if (!auditId) {
        return null; 
    }

    const activeLat = mapView === 'inspector' ? auditData?.gps_latitude : detachmentGps?.lat;
    const activeLng = mapView === 'inspector' ? auditData?.gps_longitude : detachmentGps?.lng;
    const hasGps = activeLat && activeLng;

    const numLat = Number(activeLat);
    const numLng = Number(activeLng);
    const offset = 0.002; 
    
    const osmUrl = hasGps 
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${numLng - offset},${numLat - offset},${numLng + offset},${numLat + offset}&layer=mapnik&marker=${numLat},${numLng}`
    : null;

    // Sterile Mono-Badge Renderer
    const renderStatusBadge = (status: string | boolean | null | undefined, customText?: string) => {
        const text = customText || String(status);
        if (status === 'Valid' || status === true || status === 'Compliant' || status === 'Yes' || status === 'Secured') 
            return <span className="inline-flex items-center px-1.5 py-0.5 border border-slate-300 text-[10px] font-mono font-bold text-slate-800 uppercase tracking-widest">✓ {text}</span>;
        if (status === 'Missing' || status === false || status === 'Non-Compliant' || status === 'No' || status === 'Breached/Open') 
            return <span className="inline-flex items-center px-1.5 py-0.5 border border-red-300 bg-red-50 text-[10px] font-mono font-bold text-red-700 uppercase tracking-widest">✕ {text}</span>;
        if (status === 'Expired') 
            return <span className="inline-flex items-center px-1.5 py-0.5 border border-slate-400 text-[10px] font-mono font-bold text-slate-900 uppercase tracking-widest">⚠ {text}</span>;
        
        return <span className="inline-flex items-center px-1.5 py-0.5 border border-slate-200 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">{text}</span>;
    };

    const distance = calculateDistanceInMeters(
        auditData?.gps_latitude, auditData?.gps_longitude,
        detachmentGps?.lat, detachmentGps?.lng
    );
    
    // --- ESCALATION LOGIC ENGINE ---
    const isGpsMismatch = distance !== null && distance > 100;
    const hasViolations = !!auditData?.violations_checklist;
    
    const hasDocumentIssues = auditData?.documents_checklist 
        ? Object.values(auditData.documents_checklist).some(status => status === 'Expired' || status === 'Missing')
        : false;

    const isUniformNonCompliant = auditData?.uniform_compliance === false || auditData?.uniform_status === false || auditData?.uniform_status === 'Non-Compliant';

    const needsEscalation = isGpsMismatch || hasViolations || hasDocumentIssues || isUniformNonCompliant;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-none" onClick={onClose} />

      <div className="relative w-full max-w-md md:max-w-3xl bg-white h-full border-l border-slate-200 overflow-y-auto z-10 flex flex-col">
        
        {/* Sterile Header */}
        <div className="bg-white border-b border-slate-200 p-6 sticky top-0 z-20 flex justify-between items-center">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-slate-900 uppercase">Audit Inspection Report</h2>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-1">ID: {auditId}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 transition-none text-2xl font-light leading-none flex items-center justify-center w-8 h-8 rounded-none">
            ✕
          </button>
        </div>

        {isLoading ? (
          <div className="p-8 text-center font-mono text-slate-500 my-auto text-xs uppercase tracking-widest">Loading Live Data...</div>
        ) : auditData ? (
          <div className="p-6 space-y-0 flex-1 divide-y divide-slate-200">
            
            {/* --- AUTOMATED QC/TBD ESCALATION BANNER --- */}
            {needsEscalation && (
              <section className={`mb-8 p-5 border-l-4 ${
                auditData?.escalation_status === 'Resolved' ? 'bg-slate-50 border-slate-800 border border-slate-200' : 'bg-red-50/50 border-red-600 border border-red-200'
              }`}>
                <div>
                  <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
                    auditData?.escalation_status === 'Resolved' ? 'text-slate-900' : 'text-red-800'
                  }`}>
                    {auditData?.escalation_status === 'Resolved' 
                      ? '✓ Escalation Resolved by Superadmin' 
                      : '⚠️ QC/TBD Manager Review Required'}
                  </h3>
                  <ul className={`text-xs mt-3 space-y-2 ${
                    auditData?.escalation_status === 'Resolved' ? 'text-slate-600' : 'text-red-700'
                  }`}>
                    {isGpsMismatch && <li className="flex items-start gap-2"><span className="mt-1 w-1 h-1 rounded-none bg-current opacity-60 shrink-0"></span> <span><strong className="font-semibold">Tier 2 Location Mismatch:</strong> Inspector was {distance} meters away.</span></li>}
                    {hasViolations && <li className="flex items-start gap-2"><span className="mt-1 w-1 h-1 rounded-none bg-current opacity-60 shrink-0"></span> <span><strong className="font-semibold">Guard Violations:</strong> Inspector logged active uniform/equipment violations.</span></li>}
                    {hasDocumentIssues && <li className="flex items-start gap-2"><span className="mt-1 w-1 h-1 rounded-none bg-current opacity-60 shrink-0"></span> <span><strong className="font-semibold">Document Compliance:</strong> Inspector logged missing or expired operational licenses.</span></li>}
                    {isUniformNonCompliant && <li className="flex items-start gap-2"><span className="mt-1 w-1 h-1 rounded-none bg-current opacity-60 shrink-0"></span> <span><strong className="font-semibold">Uniform Non-Compliance:</strong> Inspector logged that the guard is not in proper uniform.</span></li>}
                  </ul>
                </div>

                {auditData?.escalation_status === 'Resolved' ? (
                   <div className="bg-white border border-slate-200 text-slate-800 p-3 rounded-none text-xs font-mono uppercase tracking-wider flex items-center justify-between mt-4">
                     <span>Case Closed. Record Archived.</span>
                   </div>
                ) : auditData?.escalation_status === 'Pending QC Review' ? (
                  <div className="flex flex-col gap-3 border-t border-red-200 pt-4 mt-4">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-red-800 uppercase tracking-widest">Admin Remarks:</span>
                      <p className="text-sm text-red-900 bg-white p-3 rounded-none border border-red-200 mt-1.5">
                        "{auditData.escalation_remarks || 'No remarks provided.'}"
                      </p>
                    </div>
                    {userRole === 'superadmin' && (
                      <button
                        onClick={handleResolveEscalation}
                        disabled={isResolving}
                        className={`self-end text-[10px] font-mono font-bold uppercase tracking-widest py-2 px-5 rounded-none transition-none w-full sm:w-auto ${
                          isResolving ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800 text-white'
                        }`}
                      >
                        {isResolving ? 'Resolving...' : 'Mark as Resolved'}
                      </button>
                    )}
                  </div>
                ) : !escalationSuccess ? (
                  <div className="flex flex-col gap-3 border-t border-red-200 pt-4 mt-4">
                    <label className="text-[10px] font-mono font-bold text-red-800 uppercase tracking-widest">Superadmin Context / Remarks</label>
                    <textarea
                      className="w-full p-3 text-sm text-slate-900 bg-white placeholder-slate-400 border border-red-200 rounded-none outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 resize-none"
                      rows={2}
                      placeholder="Explain why this requires Superadmin review..."
                      value={escalationRemarks}
                      onChange={(e) => setEscalationRemarks(e.target.value)}
                    />
                    <button
                      onClick={handleEscalateReport}
                      disabled={isEscalating || !escalationRemarks.trim()}
                      className={`self-end text-[10px] font-mono font-bold uppercase tracking-widest py-2 px-5 rounded-none transition-none w-full sm:w-auto ${
                        isEscalating || !escalationRemarks.trim() 
                          ? 'bg-red-200 text-white cursor-not-allowed' 
                          : 'bg-red-600 hover:bg-red-700 text-white'
                      }`}
                    >
                      {isEscalating ? 'Escalating...' : 'Submit Escalation'}
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 bg-white border border-slate-200 text-slate-800 p-3 rounded-none text-xs font-mono uppercase tracking-wider flex items-center justify-between">
                    <span>✓ Escalated to QC</span>
                    <span className="text-slate-500">Remarks attached.</span>
                  </div>
                )}
              </section>
            )}

            {/* 1. Detachment Info */}
            <section className="py-6">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-5">Detachment Info</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-mono tracking-widest mb-1">Branch Name</span>
                  <span className="text-sm font-medium text-slate-900">{auditData.branch_name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-mono tracking-widest mb-1">Branch Code</span>
                  <span className="text-sm font-mono text-slate-900">{auditData.branch_code || 'N/A'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] text-slate-500 block uppercase font-mono tracking-widest mb-1">Location</span>
                  <span className="text-sm text-slate-700">{auditData.branch_location || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-mono tracking-widest mb-1">Time In (Arrival)</span>
                  <span className="text-sm font-mono text-slate-900">
                    {auditData.time_in ? new Date(auditData.time_in).toLocaleString() : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-mono tracking-widest mb-1">Time Out (Submitted)</span>
                  <span className="text-sm font-mono text-slate-900">
                    {auditData.time_out ? new Date(auditData.time_out).toLocaleString() : 'N/A'}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] text-slate-500 block uppercase font-mono tracking-widest mb-1">Inspector</span>
                  <span className="text-sm font-medium text-slate-900">{auditData.inspector_name}</span>
                </div>
              </div>
            </section>

            {/* 2. Location / GPS Map */}
            <section className="py-6">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">GPS Location</h3>
                {/* Always render the button group so it's obvious to the user, but disable if data is missing */}
                <div className="flex border border-slate-200">
                  <button
                    onClick={() => setMapView('inspector')}
                    className={`text-[10px] px-3 py-1 font-mono uppercase tracking-widest transition-none ${mapView === 'inspector' ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
                  >
                    Inspector
                  </button>
                  <button
                    onClick={() => {
                        if (detachmentGps) setMapView('detachment');
                        else alert("No GPS coordinates registered for this detachment. Please assign them on the Sites & Detachments page.");
                    }}
                    className={`text-[10px] px-3 py-1 font-mono uppercase tracking-widest transition-none border-l border-slate-200 ${mapView === 'detachment' ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50'} ${!detachmentGps ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={!detachmentGps ? 'Detachment coordinates missing in database' : 'View Detachment Location'}
                  >
                    Detachment
                  </button>
                </div>
              </div>
              
              <div className="border border-slate-200 bg-slate-50">
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
                  <div className="h-48 flex flex-col items-center justify-center text-slate-400 text-xs font-mono uppercase tracking-widest">
                    <span>📍 Map unavailable for {mapView}</span>
                  </div>
                )}
                <div className="bg-white p-3 text-center flex flex-col items-center justify-center border-t border-slate-200">
                  <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                    Lat: {activeLat || 'N/A'} | Lng: {activeLng || 'N/A'}
                  </span>
                  
                  {mapView === 'inspector' && auditData?.branch_location && (
                    <span className="text-[10px] text-slate-900 mt-2 font-mono border border-slate-300 px-2 py-1 uppercase tracking-widest">
                      QR Location: {auditData.branch_location}
                    </span>
                  )}
                  {mapView === 'detachment' && (
                     <span className="text-[10px] text-slate-900 mt-2 font-mono border border-slate-300 px-2 py-1 uppercase tracking-widest">
                      Official Registered Location
                    </span>
                  )}
                </div>
              </div>
            </section>

            {/* 3. Guard Evidence & Identification */}
            <section className="py-6">
               <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-5">Guard Identity & Equipment</h3>
               <div className="flex flex-col sm:flex-row gap-8">
                 
                 <div className="w-full sm:w-1/3">
                   <div className="border border-slate-200 bg-slate-50 h-56">
                      {auditData.live_photo_url ? (
                        <img src={auditData.live_photo_url} alt="Live Evidence" className="w-full h-full object-cover" />
                      ) : (
                        <div className="h-full flex items-center justify-center text-slate-400 text-[10px] font-mono uppercase tracking-widest">No Photo</div>
                      )}
                   </div>
                 </div>

                 <div className="w-full sm:w-2/3 grid grid-cols-2 gap-y-6 gap-x-4">
                    <div className="col-span-2">
                      <span className="text-[10px] text-slate-500 block uppercase font-mono tracking-widest mb-1.5">Guard on Post</span>
                      {auditData.guard_present_status ? (
                        renderStatusBadge(false, 'NO-SHOW (ABSENT)')
                      ) : (
                        <span className="text-sm font-medium text-slate-900">{auditData.guard_name || 'PRESENT'}</span>
                      )}
                    </div>

                    {!auditData.guard_present_status && (
                      <>
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase font-mono tracking-widest mb-1.5">Uniform Compliance</span>
                          {renderStatusBadge(
                              auditData.uniform_compliance === true || auditData.uniform_status === 'Compliant' || auditData.uniform_status === true, 
                              (auditData.uniform_compliance === true || auditData.uniform_status === 'Compliant' || auditData.uniform_status === true) ? 'Compliant' : 'Non-Compliant'
                          )}
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase font-mono tracking-widest mb-1.5">LESP Expiry</span>
                          <span className="text-sm font-mono text-slate-900">{auditData.lesp_expiry || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase font-mono tracking-widest mb-1.5">Firearm Make</span>
                          <span className="text-sm text-slate-900">{auditData.firearm_make || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase font-mono tracking-widest mb-1.5">Firearm Serial</span>
                          <span className="text-sm font-mono text-slate-900">{auditData.firearm_serial || 'N/A'}</span>
                        </div>
                      </>
                    )}

                    {auditData.guard_present_status && (() => {
                      const isOnline = auditData.guard_present_status.atm_online;
                      const isOffline = auditData.guard_present_status.atm_offline;
                      
                      // Convert mutually exclusive booleans into a single state parameter
                      const atmStatusValue = isOnline ? true : (isOffline ? false : null);
                      const atmStatusText = isOnline ? 'ONLINE' : (isOffline ? 'OFFLINE' : 'UNCHECKED');

                      return (
                        <div className="col-span-2 bg-slate-50 border border-slate-200 p-4 mt-2">
                          <span className="text-[10px] text-slate-900 block uppercase font-mono tracking-widest mb-4 border-b border-slate-200 pb-2">Emergency Facility Status</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                            <div>
                              <span className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1">ATM Status</span>
                              <div>{renderStatusBadge(atmStatusValue, atmStatusText)}</div>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1">Facility Doors Secure</span>
                              <div>{renderStatusBadge(auditData.guard_present_status.door_secure ? 'Secured' : 'Breached/Open')}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                 </div>
               </div>
               
               <div className="mt-8">
                 <span className="text-[10px] text-slate-500 block uppercase font-mono tracking-widest mb-2">General Remarks</span>
                 <p className="bg-white p-4 border border-slate-200 text-slate-900 text-sm leading-relaxed">
                   {auditData.remarks || 'No remarks logged.'}
                 </p>
               </div>
            </section>

            {/* 4. Document Checklist */}
            {auditData.documents_checklist && (
              <section className="py-6">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-5">Document Compliance</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {Object.entries(auditData.documents_checklist).map(([key, value]) => (
                    <div key={key} className="flex flex-col gap-1.5 border-l border-slate-200 pl-3">
                      <span className="text-[10px] text-slate-500 block uppercase font-mono tracking-widest">
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
              <section className="py-6">
                <h3 className="text-xs font-bold text-red-700 uppercase tracking-widest mb-5 flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-600 rounded-none"></span>
                  Violation Ticket Issued
                </h3>
                <div className="bg-white border border-red-200 p-5">
                  <div className="grid grid-cols-2 gap-6 mb-6 pb-6 border-b border-red-100">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-mono tracking-widest mb-1">Security License No.</span>
                      <span className="font-mono text-sm font-medium text-slate-900">{auditData.violations_checklist.security_license_no || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-mono tracking-widest mb-1">License Expiry</span>
                      <span className="text-sm font-mono font-medium text-slate-900">{auditData.violations_checklist.security_license_expiry || 'N/A'}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                    {Object.entries(auditData.violations_checklist)
                      .filter(([key]) => key !== 'security_license_no' && key !== 'security_license_expiry' && key !== 'violation_remarks')
                      .map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center border-b border-slate-100 pb-2">
                          <span className="capitalize text-xs text-slate-700">{key.replace(/_/g, ' ')}</span>
                          {renderStatusBadge(value as string)}
                        </div>
                      ))}
                  </div>

                  {auditData.violations_checklist.violation_remarks && (
                    <div className="mt-6 pt-5 border-t border-red-200">
                      <span className="text-[10px] text-slate-500 block uppercase font-mono tracking-widest mb-2">Violation Details</span>
                      <p className="text-sm text-slate-900 leading-relaxed">{auditData.violations_checklist.violation_remarks}</p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* 6. Signatures */}
            <section className="py-6">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-5">Captured Signatures</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                {/* LEFT: Guard Signature */}
                <div className="border border-slate-200 p-5 bg-white flex flex-col justify-between">
                  <h4 className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-widest mb-4">Guard Signature</h4>
                  {auditData.guard_signature && auditData.guard_signature.startsWith('data:image') ? (
                    <img src={auditData.guard_signature} alt="Guard Signature" className="h-24 object-contain mix-blend-multiply border border-slate-100 bg-slate-50 w-full" />
                  ) : (
                    <div className="h-24 flex items-center justify-center border border-red-200 bg-red-50">
                      <span className="text-[10px] font-mono font-bold text-red-600 uppercase tracking-widest">
                        Missing / Not Signed
                      </span>
                    </div>
                  )}
                  <div className="mt-4 pt-4 border-t border-slate-200 text-xs font-semibold text-slate-900 uppercase">
                    {auditData.guard_name || 'N/A'}
                  </div>
                </div>

                {/* RIGHT: Client Signature */}
                <div className="border border-slate-200 p-5 bg-white flex flex-col justify-between">
                  <h4 className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-widest mb-4">Client Signature</h4>
                  
                  {auditData.inspector_signature === 'UNAVAILABLE_ON_SITE' || !auditData.inspector_signature ? (
                     <div className="h-24 flex items-center justify-center border border-slate-300 bg-slate-50">
                       <span className="text-[10px] font-mono font-bold text-slate-600 uppercase tracking-widest">
                         Unavailable On Site
                       </span>
                     </div>
                  ) : auditData.inspector_signature.startsWith('data:image') ? (
                    <img src={auditData.inspector_signature} alt="Client Signature" className="h-24 object-contain mix-blend-multiply border border-slate-100 bg-slate-50 w-full" />
                  ) : (
                     <div className="h-24 flex items-center justify-center border border-slate-200 bg-slate-50">
                       <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                         No Signature
                       </span>
                     </div>
                  )}
                  <div className="mt-4 pt-4 border-t border-slate-200 text-xs font-semibold text-slate-900 uppercase">
                    Verified Representative
                  </div>
                </div>

              </div>
            </section>

          </div>
        ) : (
           <div className="p-8 text-center text-red-600 font-mono text-xs uppercase tracking-widest my-auto">Failed to load record details.</div>
        )}
      </div>
    </div>
  );
}