'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface AuditDetailPanelProps {
    auditId: string | null;
    onClose: () => void;
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

export default function AuditDetailPanel({ auditId, onClose }: AuditDetailPanelProps) {
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
        setIsEscalating(true);
        try {
            // Future Implementation: fetch('/api/escalate-report', { method: 'POST', body: auditId })
            await new Promise(resolve => setTimeout(resolve, 1200));
            setEscalationSuccess(true);
        } catch (error) {
            console.error('Error escalating report:', error);
        } finally {
            setIsEscalating(false);
        }
    };

    useEffect(() => {
        if (!auditId) {
            setAuditData(null);
            setDetachmentGps(null);
            setMapView('inspector');
            setEscalationSuccess(false); // Reset escalation state on new audit click
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

    const getStatusColor = (status: string | boolean | null | undefined) => {
      if (status === 'Valid' || status === true || status === 'Compliant' || status === 'Yes') return 'text-green-600';
      if (status === 'Missing' || status === false || status === 'Non-Compliant' || status === 'No') return 'text-red-600';
      if (status === 'Expired') return 'text-yellow-600';
      return 'text-gray-500';
    };

    // --- ESCALATION LOGIC ENGINE ---
    // 1. Calculate physical distance in meters
    const distance = calculateDistanceInMeters(
        auditData?.gps_latitude, auditData?.gps_longitude,
        detachmentGps?.lat, detachmentGps?.lng
    );
    // 2. Determine if thresholds are breached
    const isGpsMismatch = distance !== null && distance > 100; // Flag if more than 100 meters away
    const hasViolations = !!auditData?.violations_checklist;
    const needsEscalation = isGpsMismatch || hasViolations;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      <div className="absolute inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />

      <div className="relative w-full max-w-md md:max-w-3xl bg-white h-full shadow-2xl overflow-y-auto z-10 flex flex-col">
        
        <div className="bg-gray-900 text-white p-6 sticky top-0 z-20 flex justify-between items-center shadow">
          <div>
            <h2 className="text-xl font-bold">Audit Inspection Report</h2>
            <p className="text-xs text-gray-400 font-mono mt-1">ID: {auditId}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl font-light leading-none">
            &times;
          </button>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-500 my-auto">Loading live audit data from database...</div>
        ) : auditData ? (
          <div className="p-6 space-y-8 flex-1">
            
            {/* --- NEW: AUTOMATED QC/TBD ESCALATION BANNER --- */}
            {needsEscalation && (
              <section className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-red-800 font-bold flex items-center gap-2">
                    ⚠️ QC/TBD Manager Review Required
                  </h3>
                  <ul className="text-sm text-red-700 mt-1 list-disc list-inside">
                    {isGpsMismatch && <li><span className="font-semibold">Tier 2 Location Mismatch:</span> Inspector was {distance} meters away from the official detachment.</li>}
                    {hasViolations && <li><span className="font-semibold">Guard Violations:</span> Inspector logged active uniform/equipment violations.</li>}
                  </ul>
                </div>
                <button
                  onClick={handleEscalateReport}
                  disabled={isEscalating || escalationSuccess}
                  className={`shrink-0 font-bold py-2 px-4 rounded shadow-sm transition-colors text-sm w-full sm:w-auto ${escalationSuccess ? 'bg-green-600 text-white cursor-default' : isEscalating ? 'bg-red-300 text-white cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 text-white'}`}
                >
                  {escalationSuccess ? '✓ Escalated to QC' : isEscalating ? 'Sending...' : 'Escalate Report'}
                </button>
              </section>
            )}

            {/* 1. Detachment Info */}
            <section className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-base font-bold text-gray-800 border-b pb-2 mb-3">Detachment Info</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-xs text-gray-500 block uppercase font-bold">Branch Name</span>
                  <span className="font-semibold text-gray-800">{auditData.branch_name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block uppercase font-bold">Branch Code</span>
                  <span className="font-semibold text-gray-800">{auditData.branch_code || 'N/A'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-xs text-gray-500 block uppercase font-bold">Location</span>
                  <span className="font-medium text-gray-700">{auditData.branch_location || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block uppercase font-bold">Time In (Arrival)</span>
                  <span className="font-medium text-gray-800">
                    {auditData.time_in ? new Date(auditData.time_in).toLocaleString() : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block uppercase font-bold">Time Out (Submitted)</span>
                  <span className="font-medium text-gray-800">
                    {auditData.time_out ? new Date(auditData.time_out).toLocaleString() : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block uppercase font-bold">Inspector</span>
                  <span className="font-medium text-gray-800">{auditData.inspector_name}</span>
                </div>
              </div>
            </section>

            {/* 2. Location / GPS Map */}
            <section>
              <div className="flex justify-between items-end border-b pb-2 mb-3">
                <h3 className="text-base font-bold text-gray-800">GPS Location Verification</h3>
                {detachmentGps && (
                  <div className="flex bg-gray-200 rounded p-0.5">
                    <button
                      onClick={() => setMapView('inspector')}
                      className={`text-xs px-3 py-1 rounded transition-colors ${mapView === 'inspector' ? 'bg-white font-bold text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                    >
                      Inspector
                    </button>
                    <button
                      onClick={() => setMapView('detachment')}
                      className={`text-xs px-3 py-1 rounded transition-colors ${mapView === 'detachment' ? 'bg-white font-bold text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                    >
                      Detachment
                    </button>
                  </div>
                )}
              </div>
              
              <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-gray-100">
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
                  <div className="h-32 flex flex-col items-center justify-center text-gray-500 text-sm p-4 text-center">
                    <span>📍 Map unavailable for {mapView}</span>
                  </div>
                )}
                <div className="bg-gray-50 p-2 text-center flex flex-col items-center justify-center border-t border-gray-200">
                  <span className="text-xs text-gray-500 font-mono">
                    Lat: {activeLat || 'N/A'} | Lng: {activeLng || 'N/A'}
                  </span>
                  
                  {mapView === 'inspector' && auditData?.branch_location && (
                    <span className="text-xs text-gray-600 mt-1 font-sans font-medium bg-gray-200 px-3 py-0.5 rounded-full">
                      📍 QR Location: {auditData.branch_location}
                    </span>
                  )}
                  {mapView === 'detachment' && (
                     <span className="text-xs text-indigo-700 mt-1 font-sans font-medium bg-indigo-100 px-3 py-0.5 rounded-full">
                      🏢 Official Registered Location
                    </span>
                  )}
                </div>
              </div>
            </section>

            {/* 3. Guard Evidence & Identification */}
            <section>
               <h3 className="text-base font-bold text-gray-800 border-b pb-2 mb-3">Guard Identity & Equipment</h3>
               <div className="flex flex-col sm:flex-row gap-6">
                 
                 <div className="w-full sm:w-1/3">
                   <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-gray-100 h-48">
                      {auditData.live_photo_url ? (
                        <img src={auditData.live_photo_url} alt="Live Evidence" className="w-full h-full object-cover" />
                      ) : (
                        <div className="h-full flex items-center justify-center text-gray-400 text-sm">No Photo</div>
                      )}
                   </div>
                 </div>

                 <div className="w-full sm:w-2/3 grid grid-cols-2 gap-4 text-sm">
                    <div className="col-span-2">
                      <span className="text-xs text-gray-500 block uppercase font-bold">Guard on Post</span>
                      <span className={`font-bold ${!auditData.guard_present_status ? 'text-green-600' : 'text-red-600'}`}>
                        {!auditData.guard_present_status ? (auditData.guard_name || 'PRESENT') : 'NO-SHOW (ABSENT)'}
                      </span>
                    </div>

                    {!auditData.guard_present_status && (
                      <>
                        <div>
                          <span className="text-xs text-gray-500 block uppercase font-bold">Uniform Compliance</span>
                          <span className={`font-semibold ${auditData.uniform_status === 'Compliant' || auditData.uniform_status === true ? 'text-green-600' : 'text-red-600'}`}>
                             {auditData.uniform_status === 'Compliant' || auditData.uniform_status === true ? 'Compliant' : 'Non-Compliant'}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 block uppercase font-bold">LESP Expiry</span>
                          <span className="font-semibold text-gray-800">{auditData.lesp_expiry || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 block uppercase font-bold">Firearm Make</span>
                          <span className="font-medium text-gray-800">{auditData.firearm_make || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 block uppercase font-bold">Firearm Serial</span>
                          <span className="font-mono text-gray-800">{auditData.firearm_serial || 'N/A'}</span>
                        </div>
                      </>
                    )}

                    {auditData.guard_present_status && (
                      <div className="col-span-2 bg-red-50 border border-red-100 p-3 rounded-lg mt-2">
                        <span className="text-xs text-red-800 block uppercase font-bold mb-2">Emergency Facility Status</span>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex justify-between border-b border-red-100 pb-1">
                            <span className="text-gray-700">ATM Online</span>
                            <span className={`font-bold ${auditData.guard_present_status.atm_online ? 'text-green-600' : 'text-red-600'}`}>
                              {auditData.guard_present_status.atm_online ? 'Yes' : 'No'}
                            </span>
                          </div>
                          <div className="flex justify-between border-b border-red-100 pb-1">
                            <span className="text-gray-700">ATM Offline</span>
                            <span className={`font-bold ${auditData.guard_present_status.atm_offline ? 'text-red-600' : 'text-green-600'}`}>
                              {auditData.guard_present_status.atm_offline ? 'Yes' : 'No'}
                            </span>
                          </div>
                          <div className="flex justify-between border-b border-red-100 pb-1 col-span-2">
                            <span className="text-gray-700">Facility Doors Secure</span>
                            <span className={`font-bold ${auditData.guard_present_status.door_secure ? 'text-green-600' : 'text-red-600'}`}>
                              {auditData.guard_present_status.door_secure ? 'Secured' : 'Breached/Open'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                 </div>
               </div>
               
               <div className="mt-4">
                 <span className="text-xs text-gray-500 block uppercase font-bold">General Remarks</span>
                 <p className="bg-gray-50 p-3 rounded border border-gray-200 text-gray-700 mt-1 italic text-sm">
                   {auditData.remarks || 'No remarks logged.'}
                 </p>
               </div>
            </section>

            {/* 4. Document Checklist */}
            {auditData.documents_checklist && (
              <section>
                <h3 className="text-base font-bold text-gray-800 border-b pb-2 mb-3">Document Compliance</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                  {Object.entries(auditData.documents_checklist).map(([key, value]) => (
                    <div key={key} className="bg-gray-50 p-2 rounded border border-gray-100">
                      <span className="text-xs text-gray-500 block uppercase font-bold">
                        {key.replace('_license', '').toUpperCase()}
                      </span>
                      <span className={`font-semibold ${getStatusColor(value as string)}`}>
                        {String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 5. Violations Ticket */}
            {auditData.violations_checklist && (
              <section>
                <h3 className="text-base font-bold text-red-600 border-b border-red-200 pb-2 mb-3">Violation Ticket Issued</h3>
                <div className="bg-red-50 p-4 rounded-lg border border-red-100 space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <span className="text-xs text-gray-600 block uppercase font-bold">Security License No.</span>
                      <span className="font-mono font-semibold">{auditData.violations_checklist.security_license_no || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-600 block uppercase font-bold">License Expiry</span>
                      <span className="font-semibold">{auditData.violations_checklist.security_license_expiry || 'N/A'}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    {Object.entries(auditData.violations_checklist)
                      .filter(([key]) => key !== 'security_license_no' && key !== 'security_license_expiry' && key !== 'violation_remarks')
                      .map(([key, value]) => (
                        <div key={key} className="flex justify-between border-b border-red-100 pb-1">
                          <span className="capitalize text-gray-700">{key.replace(/_/g, ' ')}</span>
                          <span className={`font-bold ${getStatusColor(value as string)}`}>{String(value)}</span>
                        </div>
                      ))}
                  </div>

                  {auditData.violations_checklist.violation_remarks && (
                    <div className="mt-3 pt-3 border-t border-red-200">
                      <span className="text-xs text-gray-600 block uppercase font-bold">Violation Details</span>
                      <p className="text-sm italic text-gray-800 mt-1">{auditData.violations_checklist.violation_remarks}</p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* 6. Signatures */}
            <section>
              <h3 className="text-base font-bold text-gray-800 border-b pb-2 mb-3">Captured Signatures</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* LEFT: Guard Signature */}
                <div className="border rounded-lg p-3 text-center bg-gray-50 flex flex-col justify-between">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Guard Signature</h4>
                  {auditData.guard_signature && auditData.guard_signature.startsWith('data:image') ? (
                    <img src={auditData.guard_signature} alt="Guard Signature" className="h-20 mx-auto object-contain" />
                  ) : (
                    <div className="h-20 flex items-center justify-center text-red-500 text-xs font-bold bg-red-50 rounded">
                      MISSING / NOT SIGNED
                    </div>
                  )}
                  <div className="mt-2 pt-2 border-t text-xs font-medium text-gray-700">
                    {auditData.guard_name || 'N/A'}
                  </div>
                </div>

                {/* RIGHT: Client Signature */}
                <div className="border rounded-lg p-3 text-center bg-gray-50 flex flex-col justify-between">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Client Signature</h4>
                  
                  {auditData.inspector_signature === 'UNAVAILABLE_ON_SITE' || !auditData.inspector_signature ? (
                     <div className="flex flex-col items-center justify-center space-y-2">
                       <span className="text-yellow-700 text-xs font-bold bg-yellow-50 px-2 py-1 rounded w-full border border-yellow-200">
                         UNAVAILABLE ON SITE
                       </span>
                       
                       {requestSuccess ? (
                         <span className="text-xs text-green-700 font-bold bg-green-50 px-2 py-2 rounded w-full border border-green-200">
                           ✓ Signature Link Sent
                         </span>
                       ) : (
                         <div className="w-full flex flex-col space-y-2 mt-1">
                           <input 
                             type="email" 
                             placeholder="Enter client email..." 
                             className="w-full text-xs p-2 border border-gray-300 rounded outline-none focus:ring-1 focus:ring-blue-500"
                             value={clientEmail}
                             onChange={(e) => setClientEmail(e.target.value)}
                           />
                           <button 
                             onClick={handleRequestSignature}
                             disabled={isRequestingSig || !clientEmail}
                             className={`text-xs font-bold py-2 px-3 rounded transition-colors ${isRequestingSig || !clientEmail ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'}`}
                           >
                             {isRequestingSig ? 'Sending Request...' : 'Request E-Signature'}
                           </button>
                         </div>
                       )}
                     </div>
                  ) : auditData.inspector_signature.startsWith('data:image') ? (
                    <img src={auditData.inspector_signature} alt="Client Signature" className="h-20 mx-auto object-contain" />
                  ) : (
                     <div className="h-20 flex items-center justify-center text-gray-400 text-xs bg-gray-100 rounded">
                       No Signature
                     </div>
                  )}
                  <div className="mt-2 pt-2 border-t text-xs font-medium text-gray-700">Verified Representative</div>
                </div>

              </div>
            </section>

          </div>
        ) : (
           <div className="p-8 text-center text-red-500 my-auto">Failed to load record details from database.</div>
        )}
      </div>
    </div>
  );
}