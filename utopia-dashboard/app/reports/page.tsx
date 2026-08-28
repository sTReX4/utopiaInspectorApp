'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Filter, AlertTriangle, FileText, Calendar, MapPin, Database, User, Lock, RefreshCcw } from 'lucide-react';
import PdfPreviewModal from '@/app/components/PdfPreviewModal';
import CsvPreviewModal from '@/app/components/CsvPreviewModal'; 
import AuditDetailPanel from '@/app/components/auditDetailPanel'; 
import { useAuth } from '@/app/context/AuthContext'; 

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
  const { role } = useAuth(); 

  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasQueried, setHasQueried] = useState(false);

  const [inspectorOptions, setInspectorOptions] = useState<{full_name: string}[]>([]);
  const [branchOptions, setBranchOptions] = useState<{branch_name: string}[]>([]);

  const [filterInspector, setFilterInspector] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterOnlyViolations, setFilterOnlyViolations] = useState(false);
  const [filterGpsIssues, setFilterGpsIssues] = useState(false);
  
  const [previewAuditData, setPreviewAuditData] = useState<any>(null); 
  const [showCsvPreview, setShowCsvPreview] = useState(false); 
  
  const [selectedDetailAuditId, setSelectedDetailAuditId] = useState<string | null>(null);
  const [selectedPdfAuditId, setSelectedPdfAuditId] = useState<string>(''); 

  useEffect(() => {
    const fetchDropdownData = async () => {
      const { data: inspectors } = await supabase.from('inspectors').select('full_name').order('full_name');
      if (inspectors) setInspectorOptions(inspectors);

      const { data: detachments } = await supabase.from('detachments').select('branch_name').order('branch_name');
      if (detachments) setBranchOptions(detachments);
    };
    fetchDropdownData();
  }, []);

  const handleRunQuery = async () => {
    setIsLoading(true);
    setHasQueried(true);

    try {
      let query = supabase
        .from('audits')
        .select('id, inspector_name, time_in, time_out, branch_code, branch_name, branch_location, guard_name, violations_checklist, guard_present_status, firearm_serial, firearm_make, remarks, guard_signature, gps_latitude, escalation_status, escalation_remarks, live_photo_url')
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

  const handleClearQuery = () => {
    setFilterInspector('');
    setFilterBranch('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterOnlyViolations(false);
    setFilterGpsIssues(false);
    setAudits([]);
    setHasQueried(false);
    setSelectedPdfAuditId('');
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const canExportCsv = hasQueried && audits.length > 0 && filterInspector.trim() !== '' && filterDateFrom !== '';

  return (
    <div className="space-y-6">
      <div className="border-b micro-border pb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Data Extraction & Logs</h1>
        <p className="text-subdued mt-1">Filter database records, verify data, and generate official reports.</p>
      </div>

      {/* PANEL 1: THE SYSTEM QUERY BUILDER */}
      <div className="enterprise-card p-6">
        <div className="flex items-center mb-5 pb-4 border-b micro-border">
          <Filter className="w-5 h-5 text-blue-600 mr-2" />
          <h2 className="text-base font-semibold text-slate-900 tracking-tight">System Query Builder</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5 mb-6">
          
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Target Inspector</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <select
                className="w-full pl-9 pr-8 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/40 text-sm font-medium text-slate-900 bg-white appearance-none cursor-pointer shadow-sm"
                value={filterInspector}
                onChange={(e) => setFilterInspector(e.target.value)}
              >
                <option value="">-- All Inspectors --</option>
                {inspectorOptions.map((inspector, idx) => (
                  <option key={idx} value={inspector.full_name}>{inspector.full_name}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Target Branch</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <select
                className="w-full pl-9 pr-8 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/40 text-sm font-medium text-slate-900 bg-white appearance-none cursor-pointer shadow-sm"
                value={filterBranch}
                onChange={(e) => setFilterBranch(e.target.value)}
              >
                <option value="">-- All Branches --</option>
                {branchOptions.map((branch, idx) => (
                  <option key={idx} value={branch.branch_name}>{branch.branch_name}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Target Date (Req. for CSV)</label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="date"
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/40 text-sm font-medium text-slate-900 bg-white shadow-sm"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">End Date (Optional)</label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="date"
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/40 text-sm font-medium text-slate-900 bg-white shadow-sm"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col justify-center space-y-3 pt-4">
            <label className="flex items-center space-x-2 cursor-pointer group">
              <input type="checkbox" className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500/40" checked={filterOnlyViolations} onChange={(e) => setFilterOnlyViolations(e.target.checked)} />
              <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 flex items-center transition-colors">
                <AlertTriangle className="w-4 h-4 text-orange-500 mr-1.5" /> Show Violations Only
              </span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer group">
              <input type="checkbox" className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500/40" checked={filterGpsIssues} onChange={(e) => setFilterGpsIssues(e.target.checked)} />
              <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 flex items-center transition-colors">
                <MapPin className="w-4 h-4 text-red-500 mr-1.5" /> Flag GPS Mismatches
              </span>
            </label>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-3">
          <button onClick={handleRunQuery} className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-lg text-sm font-semibold flex items-center transition-colors w-full sm:w-auto justify-center shadow-sm ring-1 ring-slate-900/50">
            <Database className="w-4 h-4 mr-2" />
            {isLoading ? 'Querying...' : 'Run Query'}
          </button>
          
          <button onClick={handleClearQuery} className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-6 py-2.5 rounded-lg text-sm font-semibold flex items-center transition-colors w-full sm:w-auto justify-center shadow-sm">
            <RefreshCcw className="w-4 h-4 mr-2 text-slate-400" />
            Clear Filters
          </button>
        </div>
      </div>

      {/* PANEL 2: RAW DATA PREVIEW */}
      <div className="enterprise-card overflow-hidden flex flex-col h-[400px]">
        <div className="bg-white border-b border-slate-200 p-4 flex justify-between items-center shrink-0">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center">
            <FileText className="w-4 h-4 mr-2 text-slate-400" />
            Global Data Preview
          </h3>
          <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-3 py-1 rounded-md font-bold tracking-wider uppercase ring-1 ring-blue-200/60">
            {hasQueried ? `${audits.length} Records Found` : 'Awaiting Query'}
          </span>
        </div>

        <div className="overflow-auto flex-1 p-0 bg-white">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-50 shadow-sm z-10">
              <tr className="text-[10px] uppercase tracking-widest text-slate-500 border-b border-slate-200">
                <th className="p-4 font-bold">Date & Time</th>
                <th className="p-4 font-bold">Detachment</th>
                <th className="p-4 font-bold">Inspector Name</th>
                <th className="p-4 font-bold">Guard on Duty</th>
                <th className="p-4 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!hasQueried ? (
                <tr><td colSpan={5} className="p-12 text-center text-slate-400 text-sm font-medium">Set your filters above and click "Run Query" to preview data.</td></tr>
              ) : audits.length === 0 ? (
                <tr><td colSpan={5} className="p-12 text-center text-slate-400 text-sm font-medium">No audits match your current query parameters.</td></tr>
              ) : (
                audits.map((audit) => (
                  <tr 
                    key={audit.id} 
                    onClick={() => setSelectedDetailAuditId(audit.id)}
                    className="hover:bg-blue-50/50 cursor-pointer transition-colors group"
                    title="Click to view full inspection report"
                  >
                    <td className="p-4 text-sm text-slate-500 whitespace-nowrap font-medium group-hover:text-blue-700">{formatDate(audit.time_in)}</td>
                    <td className="p-4 text-sm font-bold text-slate-900">{audit.branch_name}</td>
                    <td className="p-4 text-sm font-medium text-slate-700">{audit.inspector_name || 'UNKNOWN'}</td>
                    <td className="p-4 text-sm font-medium text-slate-700">{audit.guard_name || 'NO-SHOW'}</td>
                    <td className="p-4">
                      {audit.violations_checklist ? (
                        <span className="inline-flex px-2 py-0.5 bg-red-50 text-red-700 rounded text-[10px] font-bold border border-red-200/60 uppercase tracking-wider">Incident</span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold border border-emerald-200/60 uppercase tracking-wider">Routine / Clear</span>
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
        <div className="enterprise-card p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900 mb-1.5 tracking-tight">Accounting & Payroll (Internal)</h3>
            <p className="text-sm text-slate-500 mb-5 leading-relaxed">
              Extracts chronological proof-of-work routing logs into a structured spreadsheet mimicking the physical routing forms.
            </p>
          </div>
          
          <div>
            {!canExportCsv && hasQueried && (
               <div className="mb-4 p-3 bg-red-50/50 border border-red-200 rounded-lg flex items-start shadow-sm">
                 <Lock className="w-4 h-4 text-red-600 mr-2 mt-0.5 shrink-0" />
                 <p className="text-xs text-red-800 font-medium">
                   <strong>Strict Filter Required:</strong> You must explicitly select a Target Inspector and a Start Date to generate a Master Routing Form CSV.
                 </p>
               </div>
            )}
            <button
              onClick={() => setShowCsvPreview(true)}
              disabled={!canExportCsv}
              className={`w-full py-3 rounded-lg text-sm font-semibold flex items-center justify-center transition-all ${
                !canExportCsv ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm ring-1 ring-emerald-700/50'
              }`}
            >
              <FileText className="w-4 h-4 mr-2" />
              Preview & Download CSV
            </button>
          </div>
        </div>

        {/* Client Reporting Export */}
        <div className="enterprise-card p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900 mb-1.5 tracking-tight">Client Incident Reports (External)</h3>
            <p className="text-sm text-slate-500 mb-5 leading-relaxed">
              Generates standardized, read-only PDF documents containing photographic evidence and dual e-signatures.
            </p>

            {hasQueried && audits.length > 0 && (
              <div className="mb-5 bg-blue-50/50 p-4 rounded-xl border border-blue-100 shadow-sm">
                <label className="block text-[10px] font-bold text-blue-800 uppercase tracking-wider mb-2">Select Report to Generate</label>
                <select
                  className="w-full p-2.5 border border-blue-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/40 text-sm font-medium text-slate-900 bg-white cursor-pointer shadow-sm"
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
            onClick={() => {
              const targetAudit = audits.find(a => a.id === selectedPdfAuditId) || audits[0];
              setPreviewAuditData(targetAudit);
            }}
            disabled={!hasQueried || audits.length === 0}
            className={`w-full py-3 rounded-lg text-sm font-semibold flex items-center justify-center transition-all mt-auto ${
              (!hasQueried || audits.length === 0) ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm ring-1 ring-blue-700/50'
            }`}
          >
            <FileText className="w-4 h-4 mr-2" />
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

      {selectedDetailAuditId && (
        <AuditDetailPanel 
          auditId={selectedDetailAuditId} 
          onClose={() => setSelectedDetailAuditId(null)} 
          userRole={role as 'admin' | 'superadmin'}
        />
      )}
    </div>
  );
}