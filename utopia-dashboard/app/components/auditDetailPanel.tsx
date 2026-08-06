'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface AuditDetailPanelProps {
    auditId: string | null;
    onClose: () => void;
}

export default function AuditDetailPanel({ auditId, onClose }: AuditDetailPanelProps) {
    const [auditData, setAuditData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!auditId) {
            setAuditData(null);
            return;
        }

        const fetchAuditDetails = async () => {
            setIsLoading(true);
            try {
                const { data, error } = await supabase.from('audits').select('*').eq('id', auditId).single();
                if (error) throw error;
                setAuditData(data);
            } catch (error) {
                console.error('Error fetching audit details:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAuditDetails();
    }, [auditId]);

    if (!auditId) {
        return null; // Don't render the panel if no audit is selected
    }

    const hasGps = auditData && auditData.gps_latitude && auditData.gps_longitude;

    const offset = 0.002; 
    const osmUrl = hasGps 
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${auditData.gps_longitude - offset},${auditData.gps_latitude - offset},${auditData.gps_longitude + offset},${auditData.gps_latitude + offset}&layer=mapnik&marker=${auditData.gps_latitude},${auditData.gps_longitude}`
    : null;

    const getStatusColor = (status: string | boolean | null | undefined) => {
    if (status === 'Valid' || status === true || status === 'Compliant' || status === 'Yes') return 'text-green-600';
    if (status === 'Missing' || status === false || status === 'Non-Compliant' || status === 'No') return 'text-red-600';
    if (status === 'Expired') return 'text-yellow-600';
    return 'text-gray-500';
  };

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
              <h3 className="text-base font-bold text-gray-800 border-b pb-2 mb-3">GPS Location Verification</h3>
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
                    <span>📍 Map unavailable</span>
                  </div>
                )}
                <div className="p-2 text-xs text-gray-500 text-center font-mono bg-white border-t">
                  Lat: {auditData?.gps_latitude || 'N/A'} | Lng: {auditData?.gps_longitude || 'N/A'}
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

            {/* 4. Document Checklist (Only render if JSONB object exists) */}
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

            {/* 5. Violations Ticket (Only render if JSONB object exists) */}
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
                    {/* Filter out the license numbers and remarks to only loop through the Yes/No checkboxes */}
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
                <div className="border rounded-lg p-3 text-center bg-gray-50">
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

                <div className="border rounded-lg p-3 text-center bg-gray-50">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Client Signature</h4>
                  {auditData.inspector_signature === 'UNAVAILABLE_ON_SITE' || !auditData.inspector_signature ? (
                     <div className="h-20 flex items-center justify-center text-yellow-700 text-xs font-bold bg-yellow-50 rounded p-2">
                       UNAVAILABLE ON SITE
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