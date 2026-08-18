'use client';

import { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas-pro'; // FIX: Upgraded to Pro engine to parse modern CSS colors
import { jsPDF } from 'jspdf';
import { Download, ShieldAlert, CheckCircle } from 'lucide-react';

interface PdfPreviewModalProps {
  auditData: any;
  onClose: () => void;
}

export default function PdfPreviewModal({ auditData, onClose }: PdfPreviewModalProps) {
  const pdfRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [base64Photo, setBase64Photo] = useState<string | null>(null);

  // --- Base64 Converter to prevent canvas CORS taint ---
  useEffect(() => {
    if (auditData?.live_photo_url) {
      fetch(auditData.live_photo_url, { mode: 'cors' })
        .then((res) => res.blob())
        .then((blob) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            setBase64Photo(reader.result as string);
          };
          reader.readAsDataURL(blob);
        })
        .catch((err) => {
          console.error('Failed to convert image to base64:', err);
        });
    }
  }, [auditData]);

  // --- HTML to PDF Conversion Engine ---
  const handleGeneratePDF = async () => {
    const element = pdfRef.current;
    if (!element) return;

    setIsGenerating(true);
    try {
      window.scrollTo(0, 0);

      // The Pro engine will seamlessly parse your Tailwind/Next.js styles
      const canvas = await html2canvas(element, { 
        scale: 2, 
        useCORS: true,
        allowTaint: false, 
        scrollY: -window.scrollY,
        logging: false 
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      const fileName = `Utopia_Incident_${auditData.branch_code || 'Report'}_${new Date().getTime()}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Check console for details.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!auditData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black bg-opacity-75 p-4 py-12 overflow-y-auto">
      <div className="relative w-full max-w-4xl flex flex-col bg-gray-100 rounded-xl shadow-2xl overflow-hidden">
        
        {/* --- Toolbar --- */}
        <div className="bg-gray-900 p-4 flex justify-between items-center text-white shrink-0 sticky top-0 z-10 shadow-md">
          <div>
            <h3 className="font-bold text-lg">Document Preview</h3>
            <p className="text-xs text-gray-400">Verify formatting before extraction.</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={onClose} 
              disabled={isGenerating}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm font-bold"
            >
              Cancel
            </button>
            <button 
              onClick={handleGeneratePDF}
              disabled={isGenerating}
              className={`px-4 py-2 rounded-lg flex items-center transition-colors text-sm font-bold ${
                isGenerating ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <Download className="w-4 h-4 mr-2" />
              {isGenerating ? 'Generating PDF...' : 'Confirm & Download PDF'}
            </button>
          </div>
        </div>

        {/* --- Printable A4 Canvas Container --- */}
        <div className="p-8 flex justify-center overflow-x-auto bg-gray-50">
          <div 
            ref={pdfRef} 
            className="bg-white text-gray-900 border border-gray-200 shadow-sm"
            style={{ width: '794px', minHeight: '1123px', padding: '40px' }}
          >
            
            {/* 1. PDF Header */}
            <div className="border-b-2 border-gray-900 pb-4 mb-6 flex justify-between items-end">
              <div>
                <h1 className="text-2xl font-black uppercase tracking-wider text-gray-900">Utopia Security</h1>
                <p className="text-sm font-bold text-gray-600 uppercase">Official Incident & Compliance Report</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 font-mono">ID: {auditData.id}</p>
                <p className="text-xs text-gray-500 font-mono">Date: {new Date(auditData.time_in).toLocaleDateString()}</p>
              </div>
            </div>

            {/* 2. Facility & Time Info */}
            <div className="grid grid-cols-2 gap-4 mb-6 text-sm border border-gray-300 p-4 rounded-sm bg-white">
              <div>
                <span className="block text-xs font-bold text-gray-500 uppercase">Branch Details</span>
                <p className="font-bold text-gray-900">{auditData.branch_code} - {auditData.branch_name}</p>
                <p className="text-gray-700">{auditData.branch_location}</p>
              </div>
              <div>
                <span className="block text-xs font-bold text-gray-500 uppercase">Audit Timeline</span>
                <p className="text-gray-900"><span className="font-semibold">Time In:</span> {new Date(auditData.time_in).toLocaleTimeString()}</p>
                <p className="text-gray-900"><span className="font-semibold">Time Out:</span> {auditData.time_out ? new Date(auditData.time_out).toLocaleTimeString() : 'N/A'}</p>
              </div>
            </div>

            {/* 3. Incident Body & Photo */}
            <div className="flex gap-6 mb-6">
              <div className="w-1/2 flex flex-col">
                <span className="block text-xs font-bold text-gray-500 uppercase mb-2">Live Photographic Evidence</span>
                <div className="w-full h-64 border-2 border-gray-300 rounded-sm bg-gray-100 flex items-center justify-center overflow-hidden">
                  {base64Photo ? (
                    <img src={base64Photo} alt="Evidence" className="w-full h-full object-cover" />
                  ) : auditData.live_photo_url ? (
                    <span className="text-gray-400 text-sm">Loading Image...</span>
                  ) : (
                    <span className="text-gray-400 text-sm">No Image Provided</span>
                  )}
                </div>
              </div>

              <div className="w-1/2 flex flex-col space-y-4">
                <div className="border border-gray-300 p-3 rounded-sm bg-white">
                  <span className="block text-xs font-bold text-gray-500 uppercase border-b border-gray-200 pb-1 mb-2">Inspector Details</span>
                  <p className="text-sm font-bold text-gray-900">{auditData.inspector_name}</p>
                  <p className="text-xs text-gray-600 font-mono mt-1">GPS Lock: {auditData.gps_latitude}, {auditData.gps_longitude}</p>
                </div>

                {auditData.violations_checklist ? (
                  <div className="border-2 border-red-300 p-3 rounded-sm bg-red-50">
                     <span className="flex items-center text-xs font-bold text-red-700 uppercase border-b border-red-200 pb-1 mb-2">
                       <ShieldAlert className="w-4 h-4 mr-1" /> Active Violations Logged
                     </span>
                     <p className="text-sm text-gray-900"><span className="font-bold">License:</span> {auditData.violations_checklist.security_license_no || 'N/A'}</p>
                     <p className="text-sm text-gray-900 mt-2"><span className="font-bold">Remarks:</span> {auditData.violations_checklist.violation_remarks || 'None provided.'}</p>
                  </div>
                ) : (
                  <div className="border border-green-300 p-3 rounded-sm bg-green-50">
                    <span className="flex items-center text-xs font-bold text-green-700 uppercase">
                       <CheckCircle className="w-4 h-4 mr-1" /> No Violations Reported
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 4. Dual Signatures Area */}
            <div className="mt-12 pt-6 border-t border-gray-300 grid grid-cols-2 gap-8">
              <div className="text-center">
                <div className="h-20 flex items-end justify-center mb-2">
                  {auditData.guard_signature && auditData.guard_signature.startsWith('data:image') ? (
                    <img src={auditData.guard_signature} alt="Guard Sig" className="max-h-full object-contain" />
                  ) : (
                    <span className="text-gray-400 text-sm font-mono border border-dashed border-gray-300 p-2">MISSING</span>
                  )}
                </div>
                <div className="border-t border-gray-900 pt-1">
                  <p className="font-bold text-gray-900 text-sm">{auditData.guard_name || 'Guard on Duty'}</p>
                  <p className="text-xs text-gray-500 uppercase">Acknowledgee</p>
                </div>
              </div>

              <div className="text-center">
                <div className="h-20 flex items-end justify-center mb-2">
                  {auditData.inspector_signature === 'UNAVAILABLE_ON_SITE' ? (
                     <span className="text-gray-500 text-sm font-mono border border-gray-300 p-2 bg-gray-50">UNAVAILABLE ON SITE</span>
                  ) : auditData.inspector_signature && auditData.inspector_signature.startsWith('data:image') ? (
                    <img src={auditData.inspector_signature} alt="Client Sig" className="max-h-full object-contain" />
                  ) : (
                    <span className="text-gray-400 text-sm font-mono border border-dashed border-gray-300 p-2">MISSING</span>
                  )}
                </div>
                <div className="border-t border-gray-900 pt-1">
                  <p className="font-bold text-gray-900 text-sm">Verified Representative</p>
                  <p className="text-xs text-gray-500 uppercase">Client Authorization</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}