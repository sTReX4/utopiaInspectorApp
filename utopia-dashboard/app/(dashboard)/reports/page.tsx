'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowsClockwise, CalendarBlank, Database, FileText, FunnelSimple, Lock, MagnifyingGlass, MapPin, User, Warning } from '@phosphor-icons/react';
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
  visit_type: string | null;
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
        .select('id, inspector_name, time_in, time_out, branch_code, branch_name, branch_location, guard_name, violations_checklist, guard_present_status, visit_type, firearm_serial, firearm_make, remarks, guard_signature, gps_latitude, escalation_status, escalation_remarks, live_photo_url')
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
      <div className="border-b border-line pb-5">
        <h1 className="text-xl font-bold tracking-tight text-ink">Data Extraction & Logs</h1>
        <p className="text-sm text-ink-muted mt-1">Filter database records, verify data, and generate official reports.</p>
      </div>

      {/* PANEL 1: THE SYSTEM QUERY BUILDER */}
      <div className="border border-line bg-surface p-6">
        <div className="flex items-center mb-5 pb-4 border-b border-line">
          <FunnelSimple className="w-4 h-4 text-ink-muted mr-2" />
          <h2 className="text-sm font-bold text-ink">System Query Builder</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5 mb-6">
          
          <div>
            <label className="block text-xs font-bold text-ink-muted mb-2">Target Inspector</label>
            <div className="relative">
              <User className="w-4 h-4 text-ink-muted absolute left-3 top-2.5 pointer-events-none" />
              <select
                className="w-full pl-9 pr-8 py-2.5 border border-line rounded-control outline-none focus:border-ink focus:ring-1 focus:ring-info-ink text-sm font-medium text-ink bg-surface appearance-none cursor-pointer"
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
            <label className="block text-xs font-bold text-ink-muted mb-2">Target Branch</label>
            <div className="relative">
              <MagnifyingGlass className="w-4 h-4 text-ink-muted absolute left-3 top-2.5 pointer-events-none" />
              <select
                className="w-full pl-9 pr-8 py-2.5 border border-line rounded-control outline-none focus:border-ink focus:ring-1 focus:ring-info-ink text-sm font-medium text-ink bg-surface appearance-none cursor-pointer"
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
            <label className="block text-xs font-bold text-ink-muted mb-2">Start Date (Req for CSV)</label>
            <div className="relative">
              <CalendarBlank className="w-4 h-4 text-ink-muted absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="date"
                className="w-full pl-9 pr-3 py-2.5 border border-line rounded-control outline-none focus:border-ink focus:ring-1 focus:ring-info-ink text-sm font-medium text-ink bg-surface transition-colors duration-200"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-ink-muted mb-2">End Date</label>
            <div className="relative">
              <CalendarBlank className="w-4 h-4 text-ink-muted absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="date"
                className="w-full pl-9 pr-3 py-2.5 border border-line rounded-control outline-none focus:border-ink focus:ring-1 focus:ring-info-ink text-sm font-medium text-ink bg-surface transition-colors duration-200"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col justify-center space-y-3 pt-4">
            <label className="flex items-center space-x-2 cursor-pointer group">
              <input type="checkbox" className="w-4 h-4 text-ink rounded-control border-line focus:ring-info-ink" checked={filterOnlyViolations} onChange={(e) => setFilterOnlyViolations(e.target.checked)} />
              <span className="text-[11px] font-bold text-ink flex items-center transition-colors duration-200">
                <Warning className="w-3.5 h-3.5 text-ink-muted mr-1.5" /> Show Violations Only
              </span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer group">
              <input type="checkbox" className="w-4 h-4 text-ink rounded-control border-line focus:ring-info-ink" checked={filterGpsIssues} onChange={(e) => setFilterGpsIssues(e.target.checked)} />
              <span className="text-[11px] font-bold text-ink flex items-center transition-colors duration-200">
                <MapPin className="w-3.5 h-3.5 text-ink-muted mr-1.5" /> Flag GPS Mismatches
              </span>
            </label>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-3">
          <button onClick={handleRunQuery} className="bg-ink text-surface px-6 py-3 rounded-control text-xs font-bold flex items-center transition-colors duration-200 w-full sm:w-auto justify-center hover:bg-shell-hover">
            <Database className="w-3.5 h-3.5 mr-2" />
            {isLoading ? 'Querying...' : 'Run Query'}
          </button>
          
          <button onClick={handleClearQuery} className="bg-surface text-ink border border-line px-6 py-3 rounded-control text-xs font-bold flex items-center transition-colors duration-200 w-full sm:w-auto justify-center hover:bg-sunken">
            <ArrowsClockwise className="w-3.5 h-3.5 mr-2 text-ink-muted" />
            Clear Filters
          </button>
        </div>
      </div>

      {/* PANEL 2: RAW DATA PREVIEW */}
      <div className="border border-line bg-surface overflow-hidden flex flex-col h-[400px]">
        <div className="border-b border-line p-4 flex justify-between items-center shrink-0">
          <h3 className="text-xs font-bold text-ink flex items-center">
            <FileText className="w-4 h-4 mr-2 text-ink-muted" />
            Global Data Preview
          </h3>
          <span className="text-xs bg-surface border border-line text-ink px-3 py-1 rounded-control font-bold">
            {hasQueried ? `${audits.length} Records Found` : 'Awaiting Query'}
          </span>
        </div>

        <div className="overflow-auto flex-1 p-0 bg-surface">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead className="sticky top-0 bg-canvas z-10">
              <tr className="text-xs text-ink-muted border-b border-line">
                <th className="p-4 font-bold">Date & Time</th>
                <th className="p-4 font-bold">Detachment</th>
                <th className="p-4 font-bold">Inspector Name</th>
                <th className="p-4 font-bold">Guard on Duty</th>
                <th className="p-4 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {!hasQueried ? (
                <tr><td colSpan={5} className="p-12 text-center text-ink-muted text-xs">Set your filters above and click "Run Query" to preview data.</td></tr>
              ) : audits.length === 0 ? (
                <tr><td colSpan={5} className="p-12 text-center text-ink-muted text-xs">No audits match your current query parameters.</td></tr>
              ) : (
                audits.map((audit) => (
                  <tr 
                    key={audit.id} 
                    onClick={() => setSelectedDetailAuditId(audit.id)}
                    className="hover:bg-sunken cursor-pointer transition-colors duration-200 group"
                  >
                    <td className="p-4 text-xs text-ink-muted whitespace-nowrap">{formatDate(audit.time_in)}</td>
                    <td className="p-4 text-sm font-bold text-ink">{audit.branch_name}</td>
                    <td className="p-4 text-sm font-medium text-ink">{audit.inspector_name || 'UNKNOWN'}</td>
                    <td className="p-4 text-sm font-medium text-ink">{audit.guard_name || 'NO-SHOW'}</td>
                    <td className="p-4">
                      {audit.violations_checklist ? (
                        <span className="inline-flex px-1.5 py-0.5 border border-danger-ink/20 bg-danger-bg text-danger-ink rounded-control text-xs font-bold">Incident</span>
                      ) : (
                        <span className="inline-flex px-1.5 py-0.5 border border-line text-ink rounded-control text-xs font-bold">Routine / Clear</span>
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
        <div className="border border-line bg-surface p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-ink mb-2">Accounting & Payroll (Internal)</h3>
            <p className="text-sm text-ink-muted mb-5 leading-relaxed">
              Extracts chronological proof-of-work routing logs into a structured spreadsheet mimicking physical routing forms.
            </p>
          </div>
          
          <div>
            {!canExportCsv && hasQueried && (
               <div className="mb-4 p-4 border border-danger-ink/20 bg-danger-bg flex items-start">
                 <Lock className="w-4 h-4 text-danger-ink mr-2 mt-0.5 shrink-0" />
                 <p className="text-[11px] text-danger-ink font-bold">
                   Strict Filter Required: Target Inspector & Start Date
                 </p>
               </div>
            )}
            <button
              onClick={() => setShowCsvPreview(true)}
              disabled={!canExportCsv}
              className={`w-full py-3 rounded-control text-xs font-bold flex items-center justify-center transition-colors duration-200 ${
                !canExportCsv ? 'bg-sunken text-ink-muted cursor-not-allowed border border-line' : 'bg-ink hover:bg-shell-hover text-surface'
              }`}
            >
              <FileText className="w-4 h-4 mr-2" />
              Preview & Download CSV
            </button>
          </div>
        </div>

        {/* Client Reporting Export */}
        <div className="border border-line bg-surface p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-ink mb-2">Client Incident Reports (External)</h3>
            <p className="text-sm text-ink-muted mb-5 leading-relaxed">
              Generates standardized, read-only PDF documents containing photographic evidence and dual e-signatures.
            </p>

            {hasQueried && audits.length > 0 && (
              <div className="mb-5 bg-canvas p-4 border border-line">
                <label className="block text-xs font-bold text-ink-muted mb-2">Select Report to Generate</label>
                <select
                  className="w-full p-2.5 border border-line rounded-control outline-none focus:border-ink focus:ring-1 focus:ring-info-ink text-sm font-medium text-ink bg-surface cursor-pointer"
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
            className={`w-full py-3 rounded-control text-xs font-bold flex items-center justify-center transition-colors duration-200 mt-auto ${
              (!hasQueried || audits.length === 0) ? 'bg-sunken text-ink-muted cursor-not-allowed border border-line' : 'bg-ink hover:bg-shell-hover text-surface'
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