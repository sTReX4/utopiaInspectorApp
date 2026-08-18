'use client';

import { X, Download, FileSpreadsheet } from 'lucide-react';

interface CsvPreviewModalProps {
  audits: any[];
  onClose: () => void;
  targetInspector: string;
  targetDate: string;
}

export default function CsvPreviewModal({ audits, onClose, targetInspector, targetDate }: CsvPreviewModalProps) {
  
  // 1. Pre-process the data array to match the physical Routing Form exactly
  const tableRows = audits.map(audit => {
    const timeIn = audit.time_in ? new Date(audit.time_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'N/A';
    const timeOut = audit.time_out ? new Date(audit.time_out).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'N/A';

    const code = audit.branch_code || 'N/A';
    const detachment = audit.branch_name || 'N/A';
    const area = audit.branch_location || 'N/A';

    const isNoShow = audit.guard_present_status !== null;

    let guardName, uniform, faSn, faMake, remarks, signature;

    if (isNoShow) {
      guardName = "NO-SHOW";
      uniform = "N/A";
      faSn = "N/A";
      faMake = "N/A";
      signature = "N/A";

      let statusObj: any = {};
      try {
        statusObj = typeof audit.guard_present_status === 'string'
          ? JSON.parse(audit.guard_present_status)
          : audit.guard_present_status;
      } catch (e) {
        console.error("Error parsing guard status:", e);
      }

      const atmStat = statusObj?.atm_online ? "ATM ONLINE" : (statusObj?.atm_offline ? "ATM OFFLINE" : "ATM UNCHECKED");
      const doorStat = statusObj?.door_secure ? "DOOR GLASS PADLOCK NO PROBLEM" : "DOOR/PADLOCK BREACHED";

      remarks = `${atmStat}, ${doorStat}`;

    } else {
      guardName = audit.guard_name || 'N/A';
      uniform = audit.violations_checklist?.authorized_uniform === 'No' ? 'NON-COMPLIANT' : 'COMPLIANT';
      faSn = audit.firearm_serial || 'N/A';
      faMake = audit.firearm_make || 'N/A';
      signature = audit.guard_signature ? "SIGNED (DIGITAL)" : "MISSING";
      remarks = audit.remarks || 'NO PROBLEM';
    }

    return {
      inspector: audit.inspector_name || 'UNKNOWN',
      code, detachment, area, timeIn, timeOut, guardName, uniform, faSn, faMake, remarks, signature
    };
  });

  // 2. The CSV Download Engine (Moved from page.tsx)
  const handleExportCSV = () => {
    const headers = [
      "Inspector", "Branch Code", "Detachment", "Area", "Time IN", "Time OUT", 
      "Name of Guard", "Uniform", "F/A SN", "F/A Kind/Make", "Remarks", "Guard Signature"
    ];

    const csvRows = tableRows.map(row => {
      // Escape commas by wrapping strings in quotes
      return [
        `"${row.inspector}"`, `"${row.code}"`, `"${row.detachment}"`, `"${row.area}"`, 
        row.timeIn, row.timeOut, `"${row.guardName}"`, `"${row.uniform}"`, `"${row.faSn}"`, 
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
    
    onClose(); // Close modal after successful download
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4 overflow-y-auto">
      <div className="relative w-full max-w-7xl flex flex-col bg-white rounded-xl shadow-2xl overflow-hidden max-h-[90vh]">
        
        {/* --- Toolbar --- */}
        <div className="bg-gray-900 p-4 flex justify-between items-center text-white shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="bg-green-600 p-2 rounded-lg">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Master Routing Form Preview</h3>
              <p className="text-xs text-gray-400">
                Target: {targetInspector.toUpperCase()} | Date: {targetDate} | Records: {audits.length}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm font-bold">
              Cancel
            </button>
            <button onClick={handleExportCSV} className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg flex items-center transition-colors text-sm font-bold text-white shadow-sm">
              <Download className="w-4 h-4 mr-2" />
              Confirm & Download CSV
            </button>
          </div>
        </div>

        {/* --- Spreadsheet Preview Canvas --- */}
        <div className="overflow-auto flex-1 p-0 bg-gray-50">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead className="sticky top-0 bg-gray-200 shadow-sm z-10 border-b border-gray-300">
              <tr className="text-[10px] uppercase tracking-wider text-gray-700">
                <th className="p-3 font-bold border-r border-gray-300">Time In</th>
                <th className="p-3 font-bold border-r border-gray-300">Time Out</th>
                <th className="p-3 font-bold border-r border-gray-300">Branch Code</th>
                <th className="p-3 font-bold border-r border-gray-300">Detachment</th>
                <th className="p-3 font-bold border-r border-gray-300">Guard Name</th>
                <th className="p-3 font-bold border-r border-gray-300">Uniform</th>
                <th className="p-3 font-bold border-r border-gray-300">F/A Make</th>
                <th className="p-3 font-bold">Remarks (Shorthand)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tableRows.map((row, index) => (
                <tr key={index} className="hover:bg-white bg-gray-50 transition-colors">
                  <td className="p-3 text-xs font-mono text-gray-600 border-r border-gray-200">{row.timeIn}</td>
                  <td className="p-3 text-xs font-mono text-gray-600 border-r border-gray-200">{row.timeOut}</td>
                  <td className="p-3 text-xs font-mono text-gray-800 border-r border-gray-200">{row.code}</td>
                  <td className="p-3 text-xs font-bold text-gray-800 border-r border-gray-200">{row.detachment}</td>
                  <td className={`p-3 text-xs font-bold border-r border-gray-200 ${row.guardName === 'NO-SHOW' ? 'text-red-600' : 'text-gray-800'}`}>{row.guardName}</td>
                  <td className={`p-3 text-xs font-bold border-r border-gray-200 ${row.uniform === 'NON-COMPLIANT' ? 'text-red-600' : 'text-green-700'}`}>{row.uniform}</td>
                  <td className="p-3 text-xs text-gray-700 border-r border-gray-200">{row.faMake}</td>
                  <td className="p-3 text-xs italic text-gray-600">{row.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}