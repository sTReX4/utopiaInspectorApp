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
    }).toUpperCase();
  };

  const canExportCsv = hasQueried && audits.length > 0 && filterInspector.trim() !== '' && filterDateFrom !== '';

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">Data Extraction & Logs</h1>
        <p className="text-sm text-slate-500 mt-1">Filter database records, verify data, and generate official reports.</p>
      </div>

      {/* PANEL 1: THE SYSTEM QUERY BUILDER */}
      <div className="border border-slate-200 bg-white p-6">
        <div className="flex items-center mb-5 pb-4 border-b border-slate-200">
          <Filter className="w-4 h-4 text-slate-400 mr-2" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">System Query Builder</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5 mb-6">
          
          <div>
            <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-2">Target Inspector</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <select
                className="w-full pl-9 pr-8 py-2.5 border border-slate-300 rounded-none outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 text-sm font-medium text-slate-900 bg-white appearance-none cursor-pointer"
                value={filterInspector}
                onChange={(e) => setFilterInspector(e.target.value)}
              >
                <option value="">-- All Inspectors --</option>
                {inspectorOptions.map((inspector, idx) => (
                  <option key={idx} value={inspector.full_name}>{inspector.full_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-2">Target Branch</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <select
                className="w-full pl-9 pr-8 py-2.5 border border-slate-300 rounded-none outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 text-sm font-medium text-slate-900 bg-white appearance-none cursor-pointer"
                value={filterBranch}
                onChange={(e) => setFilterBranch(e.target.value)}
              >
                <option value="">-- All Branches --</option>
                {branchOptions.map((branch, idx) => (
                  <option key={idx} value={branch.branch_name}>{branch.branch_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-2">Start Date (Req for CSV)</label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="date"
                className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-none outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 text-sm font-medium text-slate-900 bg-white transition-none"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-2">End Date</label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="date"
                className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-none outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 text-sm font-medium text-slate-900 bg-white transition-none"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col justify-center space-y-3 pt-4">
            <label className="flex items-center space-x-2 cursor-pointer group">
              <input type="checkbox" className="w-4 h-4 text-slate-900 rounded-none border-slate-300 focus:ring-slate-900" checked={filterOnlyViolations} onChange={(e) => setFilterOnlyViolations(e.target.checked)} />
              <span className="text-[11px] font-mono font-bold text-slate-700 uppercase tracking-widest flex items-center transition-none">
                <AlertTriangle className="w-3.5 h-3.5 text-slate-400 mr-1.5" /> Violations Only
              </span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer group">
              <input type="checkbox" className="w-4 h-4 text-slate-900 rounded-none border-slate-300 focus:ring-slate-900" checked={filterGpsIssues} onChange={(e) => setFilterGpsIssues(e.target.checked)} />
              <span className="text-[11px] font-mono font-bold text-slate-700 uppercase tracking-widest flex items-center transition-none">
                <MapPin className="w-3.5 h-3.5 text-slate-400 mr-1.5" /> Flag GPS Mismatches
              </span>
            </label>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-3">
          <button onClick={handleRunQuery} className="bg-slate-900 text-white px-6 py-3 rounded-none text-xs font-bold uppercase tracking-widest flex items-center transition-none w-full sm:w-auto justify-center hover:bg-slate-800">
            <Database className="w-3.5 h-3.5 mr-2" />
            {isLoading ? 'Querying...' : 'Run Query'}
          </button>
          
          <button onClick={handleClearQuery} className="bg-white text-slate-900 border border-slate-300 px-6 py-3 rounded-none text-xs font-bold uppercase tracking-widest flex items-center transition-none w-full sm:w-auto justify-center hover:bg-slate-50">
            <RefreshCcw className="w-3.5 h-3.5 mr-2 text-slate-400" />
            Clear Filters
          </button>
        </div>
      </div>

      {/* PANEL 2: RAW DATA PREVIEW */}
      <div className="border border-slate-200 bg-white overflow-hidden flex flex-col h-[400px]">
        <div className="border-b border-slate-200 p-4 flex justify-between items-center shrink-0">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900 flex items-center">
            <FileText className="w-4 h-4 mr-2 text-slate-400" />
            Global Data Preview
          </h3>
          <span className="text-[10px] font-mono bg-white border border-slate-300 text-slate-900 px-3 py-1 rounded-none font-bold tracking-widest uppercase">
            {hasQueried ? `${audits.length} Records Found` : 'Awaiting Query'}
          </span>
        </div>

        <div className="overflow-auto flex-1 p-0 bg-white">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-50 z-10">
              <tr className="text-[10px] font-mono uppercase tracking-widest text-slate-500 border-b border-slate-200">
                <th className="p-4 font-bold">Date & Time</th>
                <th className="p-4 font-bold">Detachment</th>
                <th className="p-4 font-bold">Inspector Name</th>
                <th className="p-4 font-bold">Guard on Duty</th>
                <th className="p-4 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!hasQueried ? (
                <tr><td colSpan={5} className="p-12 text-center text-slate-400 text-xs font-mono uppercase tracking-widest">Set your filters above and click "Run Query" to preview data.</td></tr>
              ) : audits.length === 0 ? (
                <tr><td colSpan={5} className="p-12 text-center text-slate-400 text-xs font-mono uppercase tracking-widest">No audits match your current query parameters.</td></tr>
              ) : (
                audits.map((audit) => (
                  <tr 
                    key={audit.id} 
                    onClick={() => setSelectedDetailAuditId(audit.id)}
                    className="hover:bg-slate-50 cursor-pointer transition-none group"
                  >
                    <td className="p-4 text-xs font-mono text-slate-500 whitespace-nowrap">{formatDate(audit.time_in)}</td>
                    <td className="p-4 text-sm font-bold text-slate-900">{audit.branch_name}</td>
                    <td className="p-4 text-sm font-medium text-slate-700">{audit.inspector_name || 'UNKNOWN'}</td>
                    <td className="p-4 text-sm font-medium text-slate-700">{audit.guard_name || 'NO-SHOW'}</td>
                    <td className="p-4">
                      {audit.violations_checklist ? (
                        <span className="inline-flex px-1.5 py-0.5 border border-red-300 bg-red-50 text-red-700 rounded-none text-[10px] font-mono font-bold uppercase tracking-widest">Incident</span>
                      ) : (
                        <span className="inline-flex px-1.5 py-0.5 border border-slate-300 text-slate-900 rounded-none text-[10px] font-mono font-bold uppercase tracking-widest">Routine / Clear</span>
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
        <div className="border border-slate-200 bg-white p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900 mb-2">Accounting & Payroll (Internal)</h3>
            <p className="text-sm text-slate-500 mb-5 leading-relaxed">
              Extracts chronological proof-of-work routing logs into a structured spreadsheet mimicking physical routing forms.
            </p>
          </div>
          
          <div>
            {!canExportCsv && hasQueried && (
               <div className="mb-4 p-4 border border-red-300 bg-red-50 flex items-start">
                 <Lock className="w-4 h-4 text-red-600 mr-2 mt-0.5 shrink-0" />
                 <p className="text-[11px] font-mono uppercase tracking-widest text-red-800 font-bold">
                   Strict Filter Required: Target Inspector & Start Date
                 </p>
               </div>
            )}
            <button
              onClick={() => setShowCsvPreview(true)}
              disabled={!canExportCsv}
              className={`w-full py-3 rounded-none text-xs font-bold uppercase tracking-widest flex items-center justify-center transition-none ${
                !canExportCsv ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              <FileText className="w-4 h-4 mr-2" />
              Preview & Download CSV
            </button>
          </div>
        </div>

        {/* Client Reporting Export */}
        <div className="border border-slate-200 bg-white p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900 mb-2">Client Incident Reports (External)</h3>
            <p className="text-sm text-slate-500 mb-5 leading-relaxed">
              Generates standardized, read-only PDF documents containing photographic evidence and dual e-signatures.
            </p>

            {hasQueried && audits.length > 0 && (
              <div className="mb-5 bg-slate-50 p-4 border border-slate-200">
                <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-2">Select Report to Generate</label>
                <select
                  className="w-full p-2.5 border border-slate-300 rounded-none outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 text-sm font-medium text-slate-900 bg-white cursor-pointer"
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
            className={`w-full py-3 rounded-none text-xs font-bold uppercase tracking-widest flex items-center justify-center transition-none mt-auto ${
              (!hasQueried || audits.length === 0) ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' : 'bg-slate-900 hover:bg-slate-800 text-white'
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