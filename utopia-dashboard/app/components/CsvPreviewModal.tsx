'use client';

import { Download, FileSpreadsheet } from 'lucide-react';

interface CsvPreviewModalProps {
  audits: any[];
  onClose: () => void;
  targetInspector: string;
  targetDate: string;
}

export default function CsvPreviewModal({ audits, onClose, targetInspector, targetDate }: CsvPreviewModalProps) {
  
  const tableRows = audits.map(audit => {
    const timeIn = audit.time_in ? new Date(audit.time_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'N/A';
    const timeOut = audit.time_out ? new Date(audit.time_out).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'N/A';

    const code = audit.branch_code || 'N/A';
    const detachment = audit.branch_name || 'N/A';
    const area = audit.branch_location || 'N/A';

    const isNoShow = audit.guard_present_status !== null;

    let guardName, uniform, lespExpiry, faSn, faMake, remarks, signature;

    if (isNoShow) {
      let statusObj: any = {};
      try {
        statusObj = typeof audit.guard_present_status === 'string'
          ? JSON.parse(audit.guard_present_status)
          : audit.guard_present_status;
      } catch (e) {
        console.error("Error parsing guard status:", e);
      }

      // Reconstruct the manual shorthand across the empty columns
      const atmStat = statusObj?.atm_online ? "ATM ONLINE" : (statusObj?.atm_offline ? "ATM OFFLINE" : "ATM UNCHECKED");
      const isSecure = statusObj?.door_secure;

      guardName = "NO-SHOW";
      lespExpiry = atmStat;
      uniform = "DOOR";
      faSn = "GLASS";
      faMake = "PADLOCK";
      remarks = isSecure ? "NO" : "IS";
      signature = isSecure ? "PROBLEM" : "BREACHED";

    } else {
      guardName = audit.guard_name || 'N/A';
      uniform = audit.violations_checklist?.authorized_uniform === 'No' ? 'NON-COMPLIANT' : 'COMPLIANT';
      lespExpiry = audit.lesp_expiry ? new Date(audit.lesp_expiry).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }) : 'N/A';
      faSn = audit.firearm_serial || 'N/A';
      faMake = audit.firearm_make || 'N/A';
      signature = audit.guard_signature ? "SIGNED (DIGITAL)" : "MISSING";
      remarks = audit.remarks || 'NO PROBLEM';
    }

    return {
      inspector: audit.inspector_name || 'UNKNOWN',
      code, detachment, area, timeIn, timeOut, guardName, lespExpiry, uniform, faSn, faMake, remarks, signature
    };
  });

  const handleExportCSV = () => {
    const headers = [
      "Inspector", "Branch Code", "Detachment", "Area", "Time IN", "Time OUT", 
      "Name of Guard", "LESP Expiry", "Uniform", "F/A SN", "F/A Kind/Make", "Remarks", "Guard Signature"
    ];

    const csvRows = tableRows.map(row => {
      return [
        `"${row.inspector}"`, `"${row.code}"`, `"${row.detachment}"`, `"${row.area}"`, 
        row.timeIn, row.timeOut, `"${row.guardName}"`, `"${row.lespExpiry}"`, `"${row.uniform}"`, `"${row.faSn}"`, 
        `"${row.faMake}"`, `"${row.remarks}"`, `"${row.signature}"`
      ].join(",");
    });

    const csvContent = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.setAttribute("download", `Inspector_Routing_Form_${targetInspector.replace(/\s+/g, '_')}_${targetDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    onClose(); 
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto transition-none">
      <div className="relative w-full max-w-7xl flex flex-col bg-white rounded-none border border-slate-300 shadow-none overflow-hidden max-h-[90vh]">
        
        {/* --- Toolbar --- */}
        <div className="bg-slate-900 p-6 flex justify-between items-center text-white shrink-0">
          <div className="flex items-center gap-4">
            <div className="border border-slate-700 p-3 bg-slate-800">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base uppercase tracking-widest text-slate-100">Master Routing Form Preview</h3>
              <p className="text-xs font-mono text-slate-400 uppercase tracking-widest mt-1.5">
                Target: {targetInspector.toUpperCase()} | Date: {targetDate} | Records: {audits.length}
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <button onClick={onClose} className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-none transition-none text-sm font-bold uppercase tracking-widest border border-slate-700">
              Cancel
            </button>
            <button onClick={handleExportCSV} className="px-6 py-3 bg-white hover:bg-slate-200 text-slate-900 rounded-none flex items-center transition-none text-sm font-bold uppercase tracking-widest">
              <Download className="w-5 h-5 mr-2" />
              Download CSV
            </button>
          </div>
        </div>

        {/* --- Spreadsheet Preview Canvas --- */}
        <div className="overflow-auto flex-1 p-0 bg-white">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead className="sticky top-0 bg-slate-100 z-10 border-b border-slate-300">
              <tr className="text-xs uppercase font-mono tracking-widest text-slate-500">
                <th className="p-5 font-bold border-r border-slate-200">Time In</th>
                <th className="p-5 font-bold border-r border-slate-200">Time Out</th>
                <th className="p-5 font-bold border-r border-slate-200">Branch Code</th>
                <th className="p-5 font-bold border-r border-slate-200">Detachment</th>
                <th className="p-5 font-bold border-r border-slate-200">Guard Name</th>
                <th className="p-5 font-bold border-r border-slate-200">LESP Expiry</th>
                <th className="p-5 font-bold border-r border-slate-200">Uniform</th>
                <th className="p-5 font-bold border-r border-slate-200">F/A SN</th>
                <th className="p-5 font-bold border-r border-slate-200">F/A Make</th>
                <th className="p-5 font-bold border-r border-slate-200">Remarks</th>
                <th className="p-5 font-bold">Guard Signature</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {tableRows.map((row, index) => (
                <tr key={index} className="hover:bg-slate-50 transition-none">
                  <td className="p-5 text-sm font-mono text-slate-600 border-r border-slate-200">{row.timeIn}</td>
                  <td className="p-5 text-sm font-mono text-slate-600 border-r border-slate-200">{row.timeOut}</td>
                  <td className="p-5 text-sm font-mono text-slate-900 border-r border-slate-200">{row.code}</td>
                  <td className="p-5 text-base font-bold text-slate-900 border-r border-slate-200">{row.detachment}</td>
                  <td className={`p-5 text-sm font-bold border-r border-slate-200 ${row.guardName === 'NO-SHOW' ? 'text-red-600' : 'text-slate-900'}`}>{row.guardName}</td>
                  <td className={`p-5 text-sm font-mono border-r border-slate-200 ${row.guardName === 'NO-SHOW' ? 'text-slate-500 font-bold' : 'text-slate-700'}`}>{row.lespExpiry}</td>
                  <td className={`p-5 text-sm font-bold border-r border-slate-200 ${row.uniform === 'NON-COMPLIANT' ? 'text-red-600' : (row.guardName === 'NO-SHOW' ? 'text-slate-500' : 'text-slate-900')}`}>{row.uniform}</td>
                  <td className={`p-5 text-sm font-mono border-r border-slate-200 ${row.guardName === 'NO-SHOW' ? 'text-slate-500 font-bold' : 'text-slate-700'}`}>{row.faSn}</td>
                  <td className={`p-5 text-sm border-r border-slate-200 ${row.guardName === 'NO-SHOW' ? 'text-slate-500 font-mono font-bold uppercase tracking-widest' : 'text-slate-700'}`}>{row.faMake}</td>
                  <td className={`p-5 text-sm font-mono border-r border-slate-200 ${row.remarks === 'IS' ? 'text-red-600 font-bold' : 'text-slate-500 font-bold'}`}>{row.remarks}</td>
                  <td className={`p-5 text-sm font-bold ${row.signature === 'MISSING' || row.signature === 'BREACHED' ? 'text-red-600' : (row.guardName === 'NO-SHOW' ? 'text-slate-500 font-mono uppercase tracking-widest' : 'text-emerald-600')}`}>{row.signature}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}