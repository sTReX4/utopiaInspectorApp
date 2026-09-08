'use client';

import { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import { CheckCircle, DownloadSimple, ShieldWarning } from '@phosphor-icons/react';

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
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-ink/60 backdrop-blur-sm p-4 py-12 overflow-y-auto transition-colors duration-200">
      <div className="relative w-full max-w-4xl flex flex-col bg-sunken rounded-control border border-line shadow-none overflow-hidden">
        
        {/* --- Toolbar --- */}
        <div className="bg-ink p-5 flex justify-between items-center text-surface shrink-0 sticky top-0 z-10">
          <div>
            <h3 className="font-bold text-sm text-shell-ink">Document Preview</h3>
            <p className="text-xs text-ink-muted mt-1">Verify formatting before extraction.</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={onClose} 
              disabled={isGenerating}
              className="px-5 py-2.5 bg-shell hover:bg-shell-line text-surface rounded-control transition-colors duration-200 text-xs font-bold border border-shell-line"
            >
              Cancel
            </button>
            <button 
              onClick={handleGeneratePDF}
              disabled={isGenerating}
              className={`px-5 py-2.5 rounded-control flex items-center transition-colors duration-200 text-xs font-bold border border-line ${
                isGenerating ? 'bg-line text-ink-muted cursor-not-allowed' : 'bg-surface hover:bg-sunken text-ink'
              }`}
            >
              <DownloadSimple className="w-4 h-4 mr-2" />
              {isGenerating ? 'Generating PDF...' : 'Download PDF'}
            </button>
          </div>
        </div>

        {/* --- Printable A4 Canvas Container --- */}
        <div className="p-8 flex justify-center overflow-x-auto bg-sunken">
          <div 
            ref={pdfRef} 
            className="bg-surface text-ink border border-line"
            style={{ width: '794px', minHeight: '1123px', padding: '40px' }}
          >
            
            {/* 1. PDF Header */}
            <div className="border-b-2 border-ink pb-4 mb-6 flex justify-between items-end">
              <div>
                <h1 className="text-2xl font-bold text-ink">Utopia Security</h1>
                <p className="text-xs font-bold text-ink-muted mt-1">Official Incident & Compliance Report</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-ink-muted">ID: {auditData.id}</p>
                <p className="text-xs text-ink-muted mt-0.5">Date: {new Date(auditData.time_in).toLocaleDateString()}</p>
              </div>
            </div>

            {/* 2. Facility & Time Info */}
            <div className="grid grid-cols-2 gap-4 mb-6 text-sm border border-line p-5 bg-canvas">
              <div>
                <span className="block text-xs font-bold text-ink-muted mb-1.5">Branch Details</span>
                <p className="font-bold text-ink text-sm">{auditData.branch_code} - {auditData.branch_name}</p>
                <p className="text-ink text-xs mt-1">{auditData.branch_location}</p>
              </div>
              <div>
                <span className="block text-xs font-bold text-ink-muted mb-1.5">Audit Timeline</span>
                <div className="flex flex-col gap-1 mt-1">
                  <div className="flex justify-between max-w-[200px]">
                    <span className="text-xs text-ink-muted">Time In:</span>
                    <span className="text-xs font-bold text-ink">{new Date(auditData.time_in).toLocaleTimeString()}</span>
                  </div>
                  <div className="flex justify-between max-w-[200px]">
                    <span className="text-xs text-ink-muted">Time Out:</span>
                    <span className="text-xs font-bold text-ink">{auditData.time_out ? new Date(auditData.time_out).toLocaleTimeString() : 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Incident Body & Photo */}
            <div className="flex gap-6 mb-6">
              <div className="w-1/2 flex flex-col">
                <span className="block text-xs font-bold text-ink-muted mb-2">Live Photographic Evidence</span>
                <div className="w-full h-64 border border-line bg-canvas flex items-center justify-center overflow-hidden">
                  {base64Photo ? (
                    <img src={base64Photo} alt="Evidence" className="w-full h-full object-cover grayscale" />
                  ) : auditData.live_photo_url ? (
                    <span className="text-ink-muted text-xs">Loading Image...</span>
                  ) : (
                    <span className="text-ink-muted text-xs">No Image Provided</span>
                  )}
                </div>
              </div>

              <div className="w-1/2 flex flex-col space-y-4">
                <div className="border border-line p-4 bg-surface">
                  <span className="block text-xs font-bold text-ink-muted border-b border-line pb-2 mb-3">Inspector Details</span>
                  <p className="text-sm font-bold text-ink">{auditData.inspector_name}</p>
                  <p className="text-xs text-ink-muted mt-2">GPS Lock: {auditData.gps_latitude}, {auditData.gps_longitude}</p>
                </div>

                {auditData.violations_checklist ? (
                  <div className="border border-line p-4 bg-surface">
                     <span className="flex items-center text-xs font-bold text-ink border-b border-line pb-2 mb-3">
                       <ShieldWarning className="w-4 h-4 mr-1.5 text-ink" /> Active Violations Logged
                     </span>
                     <p className="text-xs text-ink tracking-wide"><span className="font-bold text-ink">License:</span> {auditData.violations_checklist.security_license_no || 'N/A'}</p>
                     <p className="text-xs text-ink tracking-wide mt-2"><span className="font-bold text-ink">Remarks:</span> {auditData.violations_checklist.violation_remarks || 'None provided.'}</p>
                  </div>
                ) : (
                  <div className="border border-line p-4 bg-surface">
                    <span className="flex items-center text-xs font-bold text-ink">
                       <CheckCircle className="w-4 h-4 mr-1.5" /> No Violations Reported
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 4. Dual Signatures Area */}
            <div className="mt-16 pt-8 border-t border-line grid grid-cols-2 gap-12">
              <div className="text-center">
                <div className="h-20 flex items-end justify-center mb-2">
                  {auditData.guard_signature && auditData.guard_signature.startsWith('data:image') ? (
                    <img src={auditData.guard_signature} alt="Guard Sig" className="max-h-full object-contain mix-blend-multiply" />
                  ) : (
                    <span className="text-ink-muted text-xs border border-line bg-canvas px-4 py-2">MISSING</span>
                  )}
                </div>
                <div className="border-t border-ink pt-2">
                  <p className="font-bold text-ink text-sm">{auditData.guard_name || 'Guard on Duty'}</p>
                  <p className="text-xs text-ink-muted mt-0.5">Acknowledgee</p>
                </div>
              </div>

              <div className="text-center">
                <div className="h-20 flex items-end justify-center mb-2">
                  {auditData.inspector_signature === 'UNAVAILABLE_ON_SITE' ? (
                     <span className="text-ink-muted text-xs border border-line bg-canvas px-4 py-2">UNAVAILABLE ON SITE</span>
                  ) : auditData.inspector_signature && auditData.inspector_signature.startsWith('data:image') ? (
                    <img src={auditData.inspector_signature} alt="Client Sig" className="max-h-full object-contain mix-blend-multiply" />
                  ) : (
                    <span className="text-ink-muted text-xs border border-line bg-canvas px-4 py-2">MISSING</span>
                  )}
                </div>
                <div className="border-t border-ink pt-2">
                  <p className="font-bold text-ink text-sm">Verified Representative</p>
                  <p className="text-xs text-ink-muted mt-0.5">Client Authorization</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}