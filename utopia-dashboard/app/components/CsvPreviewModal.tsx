'use client';

import { DownloadSimple, FileXls } from '@phosphor-icons/react';

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

    /* Set on both a no-show and an alarm response: in either case there is no
     * guard to report on and the row carries the site condition instead. */
    const isSiteOnly = audit.guard_present_status !== null;
    const isAlarmResponse = audit.visit_type === 'Alarm Response';

    let guardName, uniform, lespExpiry, faSn, faMake, remarks, signature;

    if (isSiteOnly) {
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

      guardName = isAlarmResponse ? "ALARM RESPONSE" : "NO-SHOW";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4 overflow-y-auto transition-colors duration-200">
      <div className="relative w-full max-w-7xl flex flex-col bg-surface rounded-control border border-line shadow-none overflow-hidden max-h-[90vh]">
        
        {/* --- Toolbar --- */}
        <div className="bg-ink p-6 flex justify-between items-center text-surface shrink-0">
          <div className="flex items-center gap-4">
            <div className="border border-shell-line p-3 bg-shell">
              <FileXls className="w-6 h-6 text-surface" />
            </div>
            <div>
              <h3 className="font-bold text-base text-shell-ink">Master Routing Form Preview</h3>
              <p className="text-xs text-ink-muted mt-1.5">
                Target: {targetInspector.toUpperCase()} | Date: {targetDate} | Records: {audits.length}
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <button onClick={onClose} className="px-6 py-3 bg-shell hover:bg-shell-line text-surface rounded-control transition-colors duration-200 text-sm font-bold border border-shell-line">
              Cancel
            </button>
            <button onClick={handleExportCSV} className="px-6 py-3 bg-surface hover:bg-sunken text-ink rounded-control flex items-center transition-colors duration-200 text-sm font-bold">
              <DownloadSimple className="w-5 h-5 mr-2" />
              Download CSV
            </button>
          </div>
        </div>

        {/* --- Spreadsheet Preview Canvas --- */}
        <div className="overflow-auto flex-1 p-0 bg-surface">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead className="sticky top-0 bg-sunken z-10 border-b border-line">
              <tr className="text-xs text-ink-muted">
                <th className="p-5 font-bold border-r border-line">Time In</th>
                <th className="p-5 font-bold border-r border-line">Time Out</th>
                <th className="p-5 font-bold border-r border-line">Branch Code</th>
                <th className="p-5 font-bold border-r border-line">Detachment</th>
                <th className="p-5 font-bold border-r border-line">Guard Name</th>
                <th className="p-5 font-bold border-r border-line">LESP Expiry</th>
                <th className="p-5 font-bold border-r border-line">Uniform</th>
                <th className="p-5 font-bold border-r border-line">F/A SN</th>
                <th className="p-5 font-bold border-r border-line">F/A Make</th>
                <th className="p-5 font-bold border-r border-line">Remarks</th>
                <th className="p-5 font-bold">Guard Signature</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {tableRows.map((row, index) => (
                <tr key={index} className="hover:bg-sunken transition-colors duration-200">
                  <td className="p-5 text-sm text-ink-muted border-r border-line">{row.timeIn}</td>
                  <td className="p-5 text-sm text-ink-muted border-r border-line">{row.timeOut}</td>
                  <td className="p-5 text-sm text-ink border-r border-line">{row.code}</td>
                  <td className="p-5 text-base font-bold text-ink border-r border-line">{row.detachment}</td>
                  <td className={`p-5 text-sm font-bold border-r border-line ${row.guardName === 'NO-SHOW' ? 'text-danger-ink' : 'text-ink'}`}>{row.guardName}</td>
                  <td className={`p-5 text-sm border-r border-line ${row.guardName === 'NO-SHOW' ? 'text-ink-muted font-bold' : 'text-ink'}`}>{row.lespExpiry}</td>
                  <td className={`p-5 text-sm font-bold border-r border-line ${row.uniform === 'NON-COMPLIANT' ? 'text-danger-ink' : (row.guardName === 'NO-SHOW' ? 'text-ink-muted' : 'text-ink')}`}>{row.uniform}</td>
                  <td className={`p-5 text-sm border-r border-line ${row.guardName === 'NO-SHOW' ? 'text-ink-muted font-bold' : 'text-ink'}`}>{row.faSn}</td>
                  <td className={`p-5 text-sm border-r border-line ${row.guardName === 'NO-SHOW' ? 'text-ink-muted font-bold  ' : 'text-ink'}`}>{row.faMake}</td>
                  <td className={`p-5 text-sm border-r border-line ${row.remarks === 'IS' ? 'text-danger-ink font-bold' : 'text-ink-muted font-bold'}`}>{row.remarks}</td>
                  <td className={`p-5 text-sm font-bold ${row.signature === 'MISSING' || row.signature === 'BREACHED' ? 'text-danger-ink' : (row.guardName === 'NO-SHOW' ? 'text-ink-muted   ' : 'text-ok-ink')}`}>{row.signature}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}