'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Filter, AlertTriangle, FileText, Calendar, MapPin, Database } from 'lucide-react';

interface AuditRecord {
  id: string;
  inspector_name: string;
  time_in: string;
  time_out: string; 
  branch_code: string;       
  branch_name: string;
  branch_location: string;   
  guard_name: string;
  violations_checklist: any;
  guard_present_status: any;
  firearm_serial: string | null; 
  firearm_make: string | null;   
  remarks: string | null;        
  guard_signature: string | null;
  gps_latitude: number | null;
}

export default function ReportsExtractionPage() {
  // 1. Data States
  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasQueried, setHasQueried] = useState(false); // Tracks if they hit "Run Query" yet

  // 2. Filter States (The Query Builder)
  const [filterBranch, setFilterBranch] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterOnlyViolations, setFilterOnlyViolations] = useState(false);
  const [filterGpsIssues, setFilterGpsIssues] = useState(false);

  // 3. The Query Execution Engine
  const handleRunQuery = async () => {
    setIsLoading(true);
    setHasQueried(true);

    try {
      let query = supabase
        .from('audits')
        .select('id, inspector_name, time_in, time_out, branch_code, branch_name, branch_location, guard_name, violations_checklist, guard_present_status, firearm_serial, firearm_make, remarks, guard_signature, gps_latitude')
        .order('time_in', { ascending: false });

      if (filterBranch) {
        query = query.ilike('branch_name', `%${filterBranch}%`);
      }

      // Apply Date Filters if selected
      if (filterDateFrom) {
        query = query.gte('time_in', `${filterDateFrom}T00:00:00Z`);
      }
      if (filterDateTo) {
        query = query.lte('time_in', `${filterDateTo}T23:59:59Z`);
      }

      // Apply Violation Filter (Only show audits where violations_checklist is NOT null)
      if (filterOnlyViolations) {
        query = query.not('violations_checklist', 'is', null);
      }

      // Apply GPS Mismatch/Error Filter (Missing GPS data)
      if (filterGpsIssues) {
        query = query.is('gps_latitude', null);
      }

      // Execute the query
      const { data, error } = await query;

      if (error) throw error;
      setAudits(data || []);

    } catch (error) {
      console.error("Error executing query:", error);
      alert("Failed to fetch data. Check console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  };

  // CSV Generation Engine for Accounting & HR
  const handleExportCSV = () => {
    if (audits.length === 0) {
      alert("No data to export. Please run a query first.");
      return;
    }

    // 1. Added "Inspector Name" to the physical routing form headers
    const headers = [
      "Inspector",
      "Branch Code", 
      "Detachment", 
      "Area", 
      "Time IN", 
      "Time OUT", 
      "Name of Guard", 
      "Uniform", 
      "F/A SN",
      "F/A Kind/Make",
      "Remarks",
      "Guard Signature"
    ];

    // 2. Loop through the database rows and format them
    const rows = audits.map(audit => {
      // Clean timestamps
      const timeIn = audit.time_in ? new Date(audit.time_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'N/A';
      const timeOut = audit.time_out ? new Date(audit.time_out).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'N/A';
      
      // Escape commas in string data to prevent CSV column breaking
      const inspector = `"${audit.inspector_name || 'UNKNOWN'}"`;
      const code = `"${audit.branch_code || 'N/A'}"`; 
      const detachment = `"${audit.branch_name || 'N/A'}"`; 
      const area = `"${audit.branch_location || 'N/A'}"`; 

      // 3. THE NO-SHOW LOGIC GATE (Upgraded with JSON parsing safety net)
      const isNoShow = audit.guard_present_status !== null;
      
      let guardName, uniform, faSn, faMake, remarks, signature;

      if (isNoShow) {
        // Guard is ABSENT
        guardName = "NO-SHOW";
        uniform = "N/A";
        faSn = "N/A";
        faMake = "N/A";
        signature = "N/A";

        let statusObj: any = {}; // <-- Just add ": any" right here
        try {
          statusObj = typeof audit.guard_present_status === 'string' 
            ? JSON.parse(audit.guard_present_status) 
            : audit.guard_present_status;
        } catch (e) {
          console.error("Error parsing guard status:", e);
        }

        // Reconstruct the exact physical form shorthand
        const atmStat = statusObj?.atm_online ? "ATM ONLINE" : (statusObj?.atm_offline ? "ATM OFFLINE" : "ATM UNCHECKED");
        const doorStat = statusObj?.door_secure ? "DOOR GLASS PADLOCK NO PROBLEM" : "DOOR/PADLOCK BREACHED";
        
        remarks = `"${atmStat}, ${doorStat}"`; 

      } else {
        // Guard is PRESENT
        guardName = `"${audit.guard_name || 'N/A'}"`;
        uniform = audit.violations_checklist?.authorized_uniform === 'No' ? 'NON-COMPLIANT' : 'COMPLIANT';
        faSn = `"${audit.firearm_serial || 'N/A'}"`;
        faMake = `"${audit.firearm_make || 'N/A'}"`;
        signature = audit.guard_signature ? "SIGNED (DIGITAL)" : "MISSING";
        
        // Output qualitative remarks typed by the inspector
        remarks = `"${audit.remarks || 'NO PROBLEM'}"`;
      }

      // Return row matching the new headers perfectly
      return [inspector, code, detachment, area, timeIn, timeOut, guardName, uniform, faSn, faMake, remarks, signature].join(",");
    });

    // 4. Combine headers and rows, then trigger the browser download
    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    link.href = url;
    link.setAttribute("download", `Inspector_Routing_Form_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Data Extraction & Logs</h1>
        <p className="text-gray-600 mt-1">Filter database records, verify data, and generate official reports.</p>
      </div>

      {/* PANEL 1: THE SYSTEM QUERY BUILDER */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center mb-4 pb-4 border-b border-gray-100">
          <Filter className="w-5 h-5 text-blue-600 mr-2" />
          <h2 className="text-lg font-bold text-gray-800">System Query Builder</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Branch Search */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Target Branch</label>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input 
                type="text" 
                placeholder="e.g. BDO Makati"
                className="w-full pl-9 pr-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                value={filterBranch}
                onChange={(e) => setFilterBranch(e.target.value)}
              />
            </div>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Start Date</label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input 
                type="date" 
                className="w-full pl-9 pr-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-700"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
              />
            </div>
          </div>

          {/* Date To */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">End Date</label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input 
                type="date" 
                className="w-full pl-9 pr-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-700"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
              />
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="flex flex-col justify-center space-y-3 pt-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input 
                type="checkbox" 
                className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
                checked={filterOnlyViolations}
                onChange={(e) => setFilterOnlyViolations(e.target.checked)}
              />
              <span className="text-sm font-medium text-gray-700 flex items-center">
                <AlertTriangle className="w-4 h-4 text-orange-500 mr-1" />
                Show Violations Only
              </span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input 
                type="checkbox" 
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                checked={filterGpsIssues}
                onChange={(e) => setFilterGpsIssues(e.target.checked)}
              />
              <span className="text-sm font-medium text-gray-700 flex items-center">
                <MapPin className="w-4 h-4 text-red-500 mr-1" />
                Flag GPS Mismatches
              </span>
            </label>
          </div>
        </div>

        <button 
          onClick={handleRunQuery}
          className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-2.5 rounded-lg font-bold flex items-center transition-colors w-full sm:w-auto justify-center"
        >
          <Database className="w-4 h-4 mr-2" />
          {isLoading ? 'Querying Database...' : 'Run Query'}
        </button>
      </div>

      {/* PANEL 2: RAW DATA PREVIEW */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[400px]">
        <div className="bg-gray-50 border-b border-gray-200 p-4 flex justify-between items-center shrink-0">
          <h3 className="font-bold text-gray-800 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-gray-500" />
            Data Preview
          </h3>
          <span className="text-sm font-mono bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-bold">
            {hasQueried ? `${audits.length} Records Found` : 'Awaiting Query'}
          </span>
        </div>
        
        <div className="overflow-auto flex-1 p-0">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-white shadow-sm z-10">
              <tr className="text-xs uppercase tracking-wider text-gray-500 border-b border-gray-200">
                <th className="p-4 font-semibold">Date & Time</th>
                <th className="p-4 font-semibold">Detachment</th>
                <th className="p-4 font-semibold">Inspector Name</th> 
                <th className="p-4 font-semibold">Guard on Duty</th>
                <th className="p-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!hasQueried ? (
                <tr>
                  {/* Changed colSpan from 4 to 5 */}
                  <td colSpan={5} className="p-12 text-center text-gray-400">
                    Set your filters above and click "Run Query" to preview data.
                  </td>
                </tr>
              ) : audits.length === 0 ? (
                <tr>
                  {/* Changed colSpan from 4 to 5 */}
                  <td colSpan={5} className="p-12 text-center text-gray-400">
                    No audits match your current query parameters.
                  </td>
                </tr>
              ) : (
                audits.map((audit) => (
                  <tr key={audit.id} className="hover:bg-gray-50">
                    <td className="p-4 text-sm text-gray-600 whitespace-nowrap">{formatDate(audit.time_in)}</td>
                    <td className="p-4 text-sm font-bold text-gray-800">{audit.branch_name}</td>
                    
                    {/* ADDED THIS LINE: Renders the Inspector's Name */}
                    <td className="p-4 text-sm text-gray-800">{audit.inspector_name || 'UNKNOWN'}</td>
                    
                    <td className="p-4 text-sm text-gray-700">{audit.guard_name || 'NO-SHOW'}</td>
                    <td className="p-4">
                      {audit.violations_checklist ? (
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold border border-red-200">INCIDENT</span>
                      ) : (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold border border-green-200">ROUTINE / CLEAR</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

        {/* PANEL 3: EXPORT CONTROLS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        
        {/* Accounting & HR Export */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-bold text-gray-900 mb-2">Accounting & Payroll (Internal)</h3>
          <p className="text-sm text-gray-500 mb-4">
            Extracts chronological proof-of-work routing logs, timeframes, and raw violation metrics into a structured spreadsheet.
          </p>
          <button 
            onClick={handleExportCSV}
            disabled={!hasQueried || audits.length === 0}
            className={`w-full py-3 rounded-lg font-bold flex items-center justify-center transition-colors ${
              (!hasQueried || audits.length === 0) 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            <FileText className="w-5 h-5 mr-2" />
            Download Master Routing Form (CSV)
          </button>
        </div>

        {/* Client Reporting Export (To be implemented next) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 opacity-70">
          <h3 className="font-bold text-gray-900 mb-2">Client Incident Reports (External)</h3>
          <p className="text-sm text-gray-500 mb-4">
            Generates standardized, read-only PDF documents containing photographic evidence and dual e-signatures.
          </p>
          <button 
            disabled={true}
            className="w-full bg-gray-100 text-gray-400 py-3 rounded-lg font-bold flex items-center justify-center cursor-not-allowed"
          >
            <AlertTriangle className="w-5 h-5 mr-2" />
            Generate PDF Incident Batch (Pending)
          </button>
        </div>

      </div>

    </div>
  );
}