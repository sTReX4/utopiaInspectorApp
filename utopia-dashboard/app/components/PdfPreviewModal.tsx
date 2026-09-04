'use client';

import { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas-pro';
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

  const handleGeneratePDF = async () => {
    const element = pdfRef.current;
    if (!element) return;

    setIsGenerating(true);
    try {
      window.scrollTo(0, 0);

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
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 backdrop-blur-sm p-4 py-12 overflow-y-auto transition-none">
      <div className="relative w-full max-w-4xl flex flex-col bg-slate-100 rounded-none border border-slate-300 shadow-none overflow-hidden">
        
        {/* --- Toolbar --- */}
        <div className="bg-slate-900 p-5 flex justify-between items-center text-white shrink-0 sticky top-0 z-10">
          <div>
            <h3 className="font-bold text-sm uppercase tracking-widest text-slate-100">Document Preview</h3>
            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mt-1">Verify formatting before extraction.</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={onClose} 
              disabled={isGenerating}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-none transition-none text-xs font-bold uppercase tracking-widest border border-slate-700"
            >
              Cancel
            </button>
            <button 
              onClick={handleGeneratePDF}
              disabled={isGenerating}
              className={`px-5 py-2.5 rounded-none flex items-center transition-none text-xs font-bold uppercase tracking-widest border border-slate-300 ${
                isGenerating ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-white hover:bg-slate-200 text-slate-900'
              }`}
            >
              <Download className="w-4 h-4 mr-2" />
              {isGenerating ? 'Generating PDF...' : 'Download PDF'}
            </button>
          </div>
        </div>

        {/* --- Printable A4 Canvas Container --- */}
        <div className="p-8 flex justify-center overflow-x-auto bg-slate-100">
          <div 
            ref={pdfRef} 
            className="bg-white text-slate-900 border border-slate-300"
            style={{ width: '794px', minHeight: '1123px', padding: '40px' }}
          >
            
            {/* 1. PDF Header */}
            <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-end">
              <div>
                <h1 className="text-2xl font-bold uppercase tracking-widest text-slate-900">Utopia Security</h1>
                <p className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest mt-1">Official Incident & Compliance Report</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">ID: {auditData.id}</p>
                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-0.5">Date: {new Date(auditData.time_in).toLocaleDateString()}</p>
              </div>
            </div>

            {/* 2. Facility & Time Info */}
            <div className="grid grid-cols-2 gap-4 mb-6 text-sm border border-slate-300 p-5 bg-slate-50">
              <div>
                <span className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-1.5">Branch Details</span>
                <p className="font-bold text-slate-900 text-sm uppercase">{auditData.branch_code} - {auditData.branch_name}</p>
                <p className="text-slate-700 text-xs mt-1">{auditData.branch_location}</p>
              </div>
              <div>
                <span className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-1.5">Audit Timeline</span>
                <div className="flex flex-col gap-1 mt-1">
                  <div className="flex justify-between max-w-[200px]">
                    <span className="text-xs text-slate-500 font-mono uppercase tracking-widest">Time In:</span>
                    <span className="text-xs font-mono font-bold text-slate-900">{new Date(auditData.time_in).toLocaleTimeString()}</span>
                  </div>
                  <div className="flex justify-between max-w-[200px]">
                    <span className="text-xs text-slate-500 font-mono uppercase tracking-widest">Time Out:</span>
                    <span className="text-xs font-mono font-bold text-slate-900">{auditData.time_out ? new Date(auditData.time_out).toLocaleTimeString() : 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Incident Body & Photo */}
            <div className="flex gap-6 mb-6">
              <div className="w-1/2 flex flex-col">
                <span className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-2">Live Photographic Evidence</span>
                <div className="w-full h-64 border border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden">
                  {base64Photo ? (
                    <img src={base64Photo} alt="Evidence" className="w-full h-full object-cover grayscale" />
                  ) : auditData.live_photo_url ? (
                    <span className="text-slate-400 text-[10px] font-mono uppercase tracking-widest">Loading Image...</span>
                  ) : (
                    <span className="text-slate-400 text-[10px] font-mono uppercase tracking-widest">No Image Provided</span>
                  )}
                </div>
              </div>

              <div className="w-1/2 flex flex-col space-y-4">
                <div className="border border-slate-300 p-4 bg-white">
                  <span className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-2 mb-3">Inspector Details</span>
                  <p className="text-sm font-bold text-slate-900 uppercase">{auditData.inspector_name}</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-2 tracking-widest uppercase">GPS Lock: {auditData.gps_latitude}, {auditData.gps_longitude}</p>
                </div>

                {auditData.violations_checklist ? (
                  <div className="border border-slate-300 p-4 bg-white">
                     <span className="flex items-center text-[10px] font-mono font-bold text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-2 mb-3">
                       <ShieldAlert className="w-4 h-4 mr-1.5 text-slate-900" /> Active Violations Logged
                     </span>
                     <p className="text-xs text-slate-700 uppercase tracking-wide"><span className="font-bold text-slate-900">License:</span> {auditData.violations_checklist.security_license_no || 'N/A'}</p>
                     <p className="text-xs text-slate-700 uppercase tracking-wide mt-2"><span className="font-bold text-slate-900">Remarks:</span> {auditData.violations_checklist.violation_remarks || 'None provided.'}</p>
                  </div>
                ) : (
                  <div className="border border-slate-300 p-4 bg-white">
                    <span className="flex items-center text-[10px] font-mono font-bold text-slate-900 uppercase tracking-widest">
                       <CheckCircle className="w-4 h-4 mr-1.5" /> No Violations Reported
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 4. Dual Signatures Area */}
            <div className="mt-16 pt-8 border-t border-slate-300 grid grid-cols-2 gap-12">
              <div className="text-center">
                <div className="h-20 flex items-end justify-center mb-2">
                  {auditData.guard_signature && auditData.guard_signature.startsWith('data:image') ? (
                    <img src={auditData.guard_signature} alt="Guard Sig" className="max-h-full object-contain mix-blend-multiply" />
                  ) : (
                    <span className="text-slate-400 text-[10px] font-mono uppercase tracking-widest border border-slate-200 bg-slate-50 px-4 py-2">MISSING</span>
                  )}
                </div>
                <div className="border-t border-slate-900 pt-2">
                  <p className="font-bold text-slate-900 text-sm uppercase">{auditData.guard_name || 'Guard on Duty'}</p>
                  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">Acknowledgee</p>
                </div>
              </div>

              <div className="text-center">
                <div className="h-20 flex items-end justify-center mb-2">
                  {auditData.inspector_signature === 'UNAVAILABLE_ON_SITE' ? (
                     <span className="text-slate-500 text-[10px] font-mono uppercase tracking-widest border border-slate-200 bg-slate-50 px-4 py-2">UNAVAILABLE ON SITE</span>
                  ) : auditData.inspector_signature && auditData.inspector_signature.startsWith('data:image') ? (
                    <img src={auditData.inspector_signature} alt="Client Sig" className="max-h-full object-contain mix-blend-multiply" />
                  ) : (
                    <span className="text-slate-400 text-[10px] font-mono uppercase tracking-widest border border-slate-200 bg-slate-50 px-4 py-2">MISSING</span>
                  )}
                </div>
                <div className="border-t border-slate-900 pt-2">
                  <p className="font-bold text-slate-900 text-sm uppercase">Verified Representative</p>
                  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">Client Authorization</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}