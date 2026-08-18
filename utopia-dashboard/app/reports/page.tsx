'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Filter, AlertTriangle, FileText, Calendar, MapPin, Database, User, Lock } from 'lucide-react';
import PdfPreviewModal from '@/app/components/PdfPreviewModal';
import CsvPreviewModal from '@/app/components/CsvPreviewModal'; 

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
  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasQueried, setHasQueried] = useState(false);

  const [filterInspector, setFilterInspector] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterOnlyViolations, setFilterOnlyViolations] = useState(false);
  const [filterGpsIssues, setFilterGpsIssues] = useState(false);
  
  // Modal States
  const [previewAuditData, setPreviewAuditData] = useState<any>(null); 
  const [showCsvPreview, setShowCsvPreview] = useState(false); 
  
  // NEW: State to track which specific report the user wants to generate a PDF for
  const [selectedPdfAuditId, setSelectedPdfAuditId] = useState<string>(''); 

  const handleRunQuery = async () => {
    setIsLoading(true);
    setHasQueried(true);

    try {
      let query = supabase
        .from('audits')
        .select('id, inspector_name, time_in, time_out, branch_code, branch_name, branch_location, guard_name, violations_checklist, guard_present_status, firearm_serial, firearm_make, remarks, guard_signature, gps_latitude')
        .order('time_in', { ascending: false });

      if (filterInspector) query = query.ilike('inspector_name', `%${filterInspector}%`);
      if (filterBranch) query = query.ilike('branch_name', `%${filterBranch}%`);
      if (filterDateFrom) query = query.gte('time_in', `${filterDateFrom}T00:00:00Z`);
      if (filterDateTo) query = query.lte('time_in', `${filterDateTo}T23:59:59Z`);
      if (filterOnlyViolations) query = query.not('violations_checklist', 'is', null);
      if (filterGpsIssues) query = query.is('gps_latitude', null);

      const { data, error } = await query;
      if (error) throw error;
      
      setAudits(data || []);
      
      // NEW: Automatically select the first record in the dropdown by default if data exists
      if (data && data.length > 0) {
        setSelectedPdfAuditId(data[0].id);
      } else {
        setSelectedPdfAuditId('');
      }

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

  // STRICT VALIDATION: CSV Export requires an Inspector and a Start Date
  const canExportCsv = hasQueried && audits.length > 0 && filterInspector.trim() !== '' && filterDateFrom !== '';

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
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

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Target Inspector</label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="e.g. Dela Cruz"
                className="w-full pl-9 pr-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 bg-white"
                value={filterInspector}
                onChange={(e) => setFilterInspector(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Target Branch</label>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="e.g. BDO Makati"
                className="w-full pl-9 pr-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 bg-white"
                value={filterBranch}
                onChange={(e) => setFilterBranch(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Target Date (Required for CSV)</label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="date"
                className="w-full pl-9 pr-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 bg-white"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">End Date (Optional)</label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="date"
                className="w-full pl-9 pr-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 bg-white"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col justify-center space-y-3 pt-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500" checked={filterOnlyViolations} onChange={(e) => setFilterOnlyViolations(e.target.checked)} />
              <span className="text-sm font-medium text-gray-700 flex items-center">
                <AlertTriangle className="w-4 h-4 text-orange-500 mr-1" /> Show Violations Only
              </span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" checked={filterGpsIssues} onChange={(e) => setFilterGpsIssues(e.target.checked)} />
              <span className="text-sm font-medium text-gray-700 flex items-center">
                <MapPin className="w-4 h-4 text-red-500 mr-1" /> Flag GPS Mismatches
              </span>
            </label>
          </div>
        </div>

        <button onClick={handleRunQuery} className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-2.5 rounded-lg font-bold flex items-center transition-colors w-full sm:w-auto justify-center">
          <Database className="w-4 h-4 mr-2" />
          {isLoading ? 'Querying Database...' : 'Run Query'}
        </button>
      </div>

      {/* PANEL 2: RAW DATA PREVIEW */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[400px]">
        <div className="bg-gray-50 border-b border-gray-200 p-4 flex justify-between items-center shrink-0">
          <h3 className="font-bold text-gray-800 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-gray-500" />
            Global Data Preview
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
                <tr><td colSpan={5} className="p-12 text-center text-gray-400">Set your filters above and click "Run Query" to preview data.</td></tr>
              ) : audits.length === 0 ? (
                <tr><td colSpan={5} className="p-12 text-center text-gray-400">No audits match your current query parameters.</td></tr>
              ) : (
                audits.map((audit) => (
                  <tr key={audit.id} className="hover:bg-gray-50">
                    <td className="p-4 text-sm text-gray-600 whitespace-nowrap">{formatDate(audit.time_in)}</td>
                    <td className="p-4 text-sm font-bold text-gray-800">{audit.branch_name}</td>
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
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-gray-900 mb-2">Accounting & Payroll (Internal)</h3>
            <p className="text-sm text-gray-500 mb-4">
              Extracts chronological proof-of-work routing logs into a structured spreadsheet mimicking the physical routing forms.
            </p>
          </div>
          
          <div>
            {!canExportCsv && hasQueried && (
               <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
                 <Lock className="w-4 h-4 text-red-600 mr-2 mt-0.5 shrink-0" />
                 <p className="text-xs text-red-800 font-medium">
                   <strong>Strict Filter Required:</strong> You must explicitly type a Target Inspector and select a Start Date to generate a Master Routing Form CSV.
                 </p>
               </div>
            )}
            <button
              onClick={() => setShowCsvPreview(true)}
              disabled={!canExportCsv}
              className={`w-full py-3 rounded-lg font-bold flex items-center justify-center transition-colors ${
                !canExportCsv ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white shadow-sm'
              }`}
            >
              <FileText className="w-5 h-5 mr-2" />
              Preview & Download CSV
            </button>
          </div>
        </div>

        {/* Client Reporting Export */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-gray-900 mb-2">Client Incident Reports (External)</h3>
            <p className="text-sm text-gray-500 mb-4">
              Generates standardized, read-only PDF documents containing photographic evidence and dual e-signatures.
            </p>

            {/* NEW: PDF Selector Dropdown */}
            {hasQueried && audits.length > 0 && (
              <div className="mb-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
                <label className="block text-xs font-bold text-blue-800 uppercase mb-2">Select Report to Generate</label>
                <select
                  className="w-full p-2 border border-blue-200 rounded outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-800 bg-white cursor-pointer"
                  value={selectedPdfAuditId}
                  onChange={(e) => setSelectedPdfAuditId(e.target.value)}
                >
                  {audits.map((audit) => (
                    <option key={audit.id} value={audit.id}>
                      {formatDate(audit.time_in)} - {audit.branch_name} {audit.violations_checklist ? '(INCIDENT)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <button
            // NEW: Grabs the explicitly selected audit instead of defaulting to audits[0]
            onClick={() => {
              const targetAudit = audits.find(a => a.id === selectedPdfAuditId) || audits[0];
              setPreviewAuditData(targetAudit);
            }}
            disabled={!hasQueried || audits.length === 0}
            className={`w-full py-3 rounded-lg font-bold flex items-center justify-center transition-colors mt-auto ${
              (!hasQueried || audits.length === 0) ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
            }`}
          >
            <FileText className="w-5 h-5 mr-2" />
            Preview PDF Template
          </button>
        </div>
      </div>
      
      {/* === MODALS === */}
      {previewAuditData && (
        <PdfPreviewModal auditData={previewAuditData} onClose={() => setPreviewAuditData(null)} />
      )}

      {showCsvPreview && (
        <CsvPreviewModal 
          audits={audits} 
          onClose={() => setShowCsvPreview(false)} 
          targetInspector={filterInspector} 
          targetDate={filterDateFrom} 
        />
      )}
    </div>
  );
}