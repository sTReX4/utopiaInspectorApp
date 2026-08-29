'use client';

import { useAuth } from '@/app/context/AuthContext';
import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Plus, Search, MapPin, QrCode, Power, PowerOff, Printer, Map, Lock, Eye, UserPlus, User, ShieldCheck, Trash2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import dynamic from 'next/dynamic';

const LocationPicker = dynamic(() => import('../components/locationPicker'), { 
  ssr: false,
  loading: () => <div className="h-64 bg-slate-50 animate-pulse rounded-xl flex items-center justify-center text-slate-400 text-sm font-medium border border-slate-100">Loading Map...</div>
});

interface Inspector {
  id: string;
  full_name: string;
}

interface Detachment {
  id: string;
  branch_code: string;
  branch_name: string;
  branch_location: string;
  is_active: boolean;
  latitude?: number;
  longitude?: number;
  assigned_inspector_id?: string | null;
  inspector?: { full_name: string } | null; 
  assigned_guards?: string[];
}

export default function SitesPage() {
  const { role, isLoading: authLoading } = useAuth();
  const [sites, setSites] = useState<Detachment[]>([]);
  const [inspectors, setInspectors] = useState<Inspector[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedSiteForQR, setSelectedSiteForQR] = useState<Detachment | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedSiteForMap, setSelectedSiteForMap] = useState<Detachment | null>(null);
  
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [siteToAssign, setSiteToAssign] = useState<Detachment | null>(null);
  const [selectedInspectorId, setSelectedInspectorId] = useState<string>('');

  const [siteToDelete, setSiteToDelete] = useState<Detachment | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const [newSite, setNewSite] = useState({ 
      code: '', 
      name: '', 
      location: '', 
      coordinates: null as { lat: number; lng: number } | null 
  });

  const isSuperadmin = role === 'superadmin';

  useEffect(() => {
    fetchSites();
    fetchInspectors();
  }, []);

  const fetchSites = async () => {
    setIsLoading(true);
    
    const { data: detachmentsData, error } = await supabase
      .from('detachments')
      .select(`
        *,
        inspector:inspectors(full_name)
      `)
      .order('created_at', { ascending: false });

    const { data: guardsData } = await supabase
      .from('guards')
      .select('guard_name, assigned_branch')
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching sites:', error);
    } else {
      const mappedSites = (detachmentsData || []).map(site => ({
        ...site,
        assigned_guards: (guardsData || [])
          .filter(g => g.assigned_branch === site.branch_name)
          .map(g => g.guard_name)
      }));
      setSites(mappedSites);
    }
    setIsLoading(false);
  };

  const fetchInspectors = async () => {
    const { data, error } = await supabase.from('inspectors').select('id, full_name').eq('is_active', true).order('full_name');
    if (!error && data) setInspectors(data);
  };

  const handleAddSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSite.coordinates) {
      alert("Please pinpoint the detachment location on the map.");
      return;
    }

    const { data, error } = await supabase
      .from('detachments')
      .insert([{
        branch_code: newSite.code,
        branch_name: newSite.name,
        branch_location: newSite.location,
        latitude: newSite.coordinates.lat,
        longitude: newSite.coordinates.lng,
        is_active: true
      }])
      .select()
      .single();

    if (error) {
      alert("Error adding site. Make sure the Branch Code is unique.");
      return;
    }

    setSites([{ ...data, assigned_guards: [] }, ...sites]); 
    setIsAddModalOpen(false); 
    setNewSite({ code: '', name: '', location: '', coordinates: null }); 
  };

  const toggleSiteStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('detachments')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    if (error) {
      console.error('Error updating status:', error);
      return;
    }

    setSites(sites.map(site => site.id === id ? { ...site, is_active: !currentStatus } : site));
  };

  const handleDeleteSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperadmin || !siteToDelete || deleteConfirmText !== 'DELETE') return;

    const { error } = await supabase.from('detachments').delete().eq('id', siteToDelete.id);

    if (error) {
      alert("Error deleting detachment. It likely has existing historical audit reports tied to it.");
      console.error('Error deleting site:', error);
      return;
    }

    setSites(sites.filter(site => site.id !== siteToDelete.id));
    setSiteToDelete(null);
    setDeleteConfirmText('');
  };

  const handleAssignInspector = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteToAssign) return;

    const inspectorIdToSave = selectedInspectorId === 'UNASSIGNED' ? null : selectedInspectorId;
    const { error } = await supabase.from('detachments').update({ assigned_inspector_id: inspectorIdToSave } as any).eq('id', siteToAssign.id);

    if (!error) {
      const assignedInspectorData = inspectors.find(i => i.id === selectedInspectorId);
      setSites(sites.map(site => site.id === siteToAssign.id ? { 
          ...site, 
          assigned_inspector_id: inspectorIdToSave,
          inspector: assignedInspectorData ? { full_name: assignedInspectorData.full_name } : null
      } : site));
      setIsAssignModalOpen(false);
    }
  };

  const filteredSites = sites.filter(site => 
    site.branch_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    site.branch_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading) return (
    <div className="flex h-[50vh] items-center justify-center">
      <div className="text-sm font-medium text-slate-500 animate-pulse">Verifying Security Clearance...</div>
    </div>
  );

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b micro-border pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Detachment Roster</h1>
            {!isSuperadmin && (
              <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ring-1 ring-slate-200/60 flex items-center">
                <Eye className="w-3 h-3 mr-1" /> Partial Access
              </span>
            )}
          </div>
          <p className="text-subdued mt-1">Manage client locations, verification codes, and assignments.</p>
        </div>

        {isSuperadmin ? (
          <button onClick={() => setIsAddModalOpen(true)} className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center transition-all shadow-sm ring-1 ring-slate-900/50">
            <Plus className="w-4 h-4 mr-2" /> Add Detachment
          </button>
        ) : (
          <button disabled className="bg-white text-slate-400 px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center cursor-not-allowed border border-slate-200 shadow-sm">
            <Lock className="w-4 h-4 mr-2" /> Add Detachment
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="enterprise-card p-3 flex items-center">
        <Search className="w-4 h-4 text-slate-400 mr-3 ml-2" />
        <input 
          type="text" 
          placeholder="Search by branch name or code..." 
          className="flex-1 outline-none text-sm font-medium text-slate-900 bg-transparent placeholder-slate-400"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Main Table */}
      <div className="enterprise-card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-widest text-slate-500">
              <th className="p-4 font-bold">Branch Code</th>
              <th className="p-4 font-bold">Branch Name</th>
              <th className="p-4 font-bold">Location</th>
              <th className="p-4 font-bold">Deployed Guard(s)</th>
              <th className="p-4 font-bold">Assigned Inspector</th>
              <th className="p-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan={6} className="p-12 text-center text-slate-400 text-sm font-medium">Loading database...</td></tr>
            ) : filteredSites.length === 0 ? (
              <tr><td colSpan={6} className="p-12 text-center text-slate-400 text-sm font-medium">No detachments found. Add one above!</td></tr>
            ) : (
              filteredSites.map((site) => (
                <tr key={site.id} className={`transition-colors hover:bg-slate-50/50 ${!site.is_active && 'bg-slate-50/50 opacity-60'}`}>
                  <td className="p-4 font-mono text-sm text-slate-500 font-medium">{site.branch_code}</td>
                  <td className="p-4 text-sm font-bold text-slate-900">{site.branch_name}</td>
                  <td className="p-4 text-sm text-slate-600 font-medium">
                    <div className="flex items-center">
                      <MapPin className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                      {site.branch_location}
                    </div>
                  </td>
                  
                  <td className="p-4">
                    {site.assigned_guards && site.assigned_guards.length > 0 ? (
                      <div className="flex flex-col gap-1.5">
                        {site.assigned_guards.map((gName, idx) => (
                          <span key={idx} className="flex items-center text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-md w-max ring-1 ring-slate-200/60 uppercase tracking-wider">
                            <ShieldCheck className="w-3 h-3 mr-1 text-slate-400" />
                            {gName}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs font-medium text-slate-400 italic">Unmanned Post</span>
                    )}
                  </td>

                  <td className="p-4">
                    {site.inspector ? (
                      <span className="flex items-center text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-md w-max ring-1 ring-blue-200/60 uppercase tracking-wider">
                        <User className="w-3 h-3 mr-1 text-blue-500" />
                        {site.inspector.full_name}
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-slate-400 italic">Unassigned</span>
                    )}
                  </td>

                  <td className="p-4 text-right space-x-1 flex justify-end">
                    <button 
                      onClick={() => {
                        setSiteToAssign(site);
                        setSelectedInspectorId(site.assigned_inspector_id || 'UNASSIGNED');
                        setIsAssignModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="Assign Inspector"
                    >
                      <UserPlus className="w-4 h-4" />
                    </button>

                    <button 
                      onClick={() => setSelectedSiteForMap(site)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                      title="View Map Location"
                    >
                      <Map className="w-4 h-4" />
                    </button>

                    {site.is_active && (
                      <button 
                        onClick={() => setSelectedSiteForQR(site)}
                        className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                        title="Generate Verification QR"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                    )}

                    {isSuperadmin ? (
                      <button 
                        onClick={() => toggleSiteStatus(site.id, site.is_active)}
                        className={`p-1.5 rounded-md transition-colors ${site.is_active ? 'text-slate-400 hover:text-red-600 hover:bg-red-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`} 
                        title={site.is_active ? "Deactivate Site" : "Reactivate Site"}
                      >
                        {site.is_active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                      </button>
                    ) : (
                      <button disabled className="p-1.5 text-slate-300 cursor-not-allowed" title="Requires Superadmin">
                        <Lock className="w-4 h-4" />
                      </button>
                    )}

                    {isSuperadmin ? (
                      <button 
                        onClick={() => { setSiteToDelete(site); setDeleteConfirmText(''); }}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" 
                        title="Delete Detachment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <button disabled className="p-1.5 text-slate-300 cursor-not-allowed" title="Requires Superadmin">
                        <Lock className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* === MODALS === */}

      {/* 1. Assign Inspector Modal */}
      {isAssignModalOpen && siteToAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col ring-1 ring-slate-200">
            <div className="bg-white border-b border-slate-200 p-5 flex justify-between items-center shrink-0">
              <h3 className="text-base font-semibold text-slate-900 tracking-tight flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-blue-600" /> Dispatch Inspector
              </h3>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors text-2xl leading-none">&times;</button>
            </div>
            
            <form onSubmit={handleAssignInspector} className="p-6 space-y-5 bg-slate-50/50">
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Target Detachment</p>
                <p className="font-semibold text-slate-900 text-sm">{siteToAssign.branch_name}</p>
                <p className="text-[11px] font-mono text-slate-500 mt-0.5">{siteToAssign.branch_code}</p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Select Roving Inspector</label>
                <select 
                  className="w-full border border-slate-200 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500/40 outline-none text-sm font-medium text-slate-900 bg-white cursor-pointer shadow-sm"
                  value={selectedInspectorId}
                  onChange={(e) => setSelectedInspectorId(e.target.value)}
                >
                  <option value="UNASSIGNED">-- Leave Unassigned --</option>
                  {inspectors.map((inspector) => (
                    <option key={inspector.id} value={inspector.id}>
                      {inspector.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2">
                <button type="submit" className="w-full bg-slate-900 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-slate-800 transition-all shadow-sm ring-1 ring-slate-900/50">
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Add New Site Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] ring-1 ring-slate-200">
            <div className="bg-white border-b border-slate-200 p-5 flex justify-between items-center shrink-0">
              <h3 className="text-base font-semibold text-slate-900 tracking-tight">Register New Detachment</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors text-2xl leading-none">&times;</button>
            </div>
            
            <form onSubmit={handleAddSite} className="p-6 flex flex-col md:flex-row gap-6 overflow-y-auto bg-slate-50/50">
              <div className="w-full md:w-1/2 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Branch Code (Unique)</label>
                  <input required type="text" placeholder="e.g. BDO-001" className="w-full border border-slate-200 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500/40 outline-none bg-white text-sm font-medium text-slate-900 shadow-sm" value={newSite.code} onChange={e => setNewSite({...newSite, code: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Branch Name</label>
                  <input required type="text" placeholder="e.g. BDO Makati Ave" className="w-full border border-slate-200 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500/40 outline-none bg-white text-sm font-medium text-slate-900 shadow-sm" value={newSite.name} onChange={e => setNewSite({...newSite, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Full Address / Location</label>
                  <input required type="text" placeholder="e.g. Makati City, Metro Manila" className="w-full border border-slate-200 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500/40 outline-none bg-white text-sm font-medium text-slate-900 shadow-sm" value={newSite.location} onChange={e => setNewSite({...newSite, location: e.target.value})} />
                </div>
              </div>

              <div className="w-full md:w-1/2 flex flex-col">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Pinpoint Detachment Location</label>
                <p className="text-[11px] text-slate-400 mb-3">Click map to assign the official location.</p>
                <div className="flex-1 min-h-[250px] rounded-lg overflow-hidden ring-1 ring-slate-200 shadow-sm">
                  <LocationPicker 
                    position={newSite.coordinates} 
                    setPosition={(pos) => setNewSite({...newSite, coordinates: pos})} 
                  />
                </div>
                <div className="mt-3 p-2 bg-white border border-slate-200 rounded-lg text-[11px] font-mono text-center text-slate-500 shadow-sm">
                  {newSite.coordinates 
                    ? `Lat: ${newSite.coordinates.lat.toFixed(5)}, Lng: ${newSite.coordinates.lng.toFixed(5)}` 
                    : "No location selected"}
                </div>
              </div>
            </form>

            <div className="p-5 border-t border-slate-200 bg-white shrink-0">
              <button onClick={handleAddSite} type="submit" className="w-full bg-slate-900 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-slate-800 transition-all shadow-sm ring-1 ring-slate-900/50">
                Save & Register Detachment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. PRINT-OPTIMIZED QR CODE GENERATOR MODAL */}
      {selectedSiteForQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          
          {/* CSS injected specifically to isolate the QR container when printing */}
          <style media="print">
            {`
              @page { size: auto; margin: 0; }
              body * { visibility: hidden !important; }
              #qr-print-area, #qr-print-area * { visibility: visible !important; }
              #qr-print-area {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                justify-content: center !important;
                background-color: white !important;
                margin: 0 !important;
                padding: 0 !important;
              }
            `}
          </style>

          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col ring-1 ring-slate-200 print:shadow-none print:ring-0">
            
            <div className="bg-white border-b border-slate-200 p-5 flex justify-between items-center shrink-0 print:hidden">
              <h3 className="text-base font-semibold text-slate-900 tracking-tight">Verification QR Code</h3>
              <button onClick={() => setSelectedSiteForQR(null)} className="text-slate-400 hover:text-slate-700 transition-colors text-2xl leading-none">&times;</button>
            </div>

            {/* This specific div becomes the sole focus of the physical printout */}
            <div id="qr-print-area" className="p-6 flex flex-col items-center justify-center space-y-4 bg-slate-50/50 print:bg-white">
              
              <div className="text-center">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">{selectedSiteForQR.branch_name}</h2>
                <p className="text-sm font-mono text-slate-500 mt-1">{selectedSiteForQR.branch_code}</p>
              </div>
              
              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 ring-1 ring-slate-100 print:border-none print:shadow-none print:ring-0">
                <QRCodeSVG 
                  value={JSON.stringify({
                    code: selectedSiteForQR.branch_code,
                    name: selectedSiteForQR.branch_name,
                    location: selectedSiteForQR.branch_location
                  })} 
                  size={220} 
                  level="H" 
                  includeMargin={true} 
                />
              </div>

              <p className="text-xs text-slate-500 text-center leading-relaxed print:mt-4 print:text-black max-w-xs">
                Scan this code using the Utopia Inspector App to verify physical arrival at <span className="font-mono text-slate-700 font-bold print:text-black">{selectedSiteForQR.branch_code}</span>.
              </p>

              <button 
                onClick={() => window.print()}
                className="w-full mt-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold py-2.5 rounded-lg flex items-center justify-center transition-all shadow-sm ring-1 ring-slate-900/50 print:hidden"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print Document
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. View Map Location Modal */}
      {selectedSiteForMap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col ring-1 ring-slate-200">
            <div className="bg-white border-b border-slate-200 p-5 flex justify-between items-center shrink-0">
              <h3 className="text-base font-semibold text-slate-900 tracking-tight">Detachment GPS Location</h3>
              <button onClick={() => setSelectedSiteForMap(null)} className="text-slate-400 hover:text-slate-700 transition-colors text-2xl leading-none">&times;</button>
            </div>
            <div className="p-6 flex flex-col space-y-4 bg-slate-50/50">
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-900 mb-1">{selectedSiteForMap.branch_name}</h2>
                <p className="text-xs text-slate-500">{selectedSiteForMap.branch_location}</p>
              </div>
              <div className="h-72 w-full bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-sm ring-1 ring-slate-100">
                {selectedSiteForMap.latitude && selectedSiteForMap.longitude ? (
                  <LocationPicker 
                    position={{ lat: selectedSiteForMap.latitude, lng: selectedSiteForMap.longitude }} 
                    setPosition={() => {}} 
                  />
                ) : (
                  <div className="h-full w-full flex flex-col items-center justify-center text-slate-400">
                    <MapPin className="w-6 h-6 text-slate-300 mb-2" />
                    <span className="text-sm font-medium">No GPS coordinates recorded for this detachment.</span>
                  </div>
                )}
              </div>
              {selectedSiteForMap.latitude && (
                <div className="bg-white p-3 rounded-lg border border-slate-200 text-[11px] font-mono text-slate-500 text-center shadow-sm">
                  Lat: {selectedSiteForMap.latitude} | Lng: {selectedSiteForMap.longitude}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. Delete Detachment Modal */}
      {siteToDelete && isSuperadmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col ring-1 ring-slate-200">
            <div className="bg-white border-b border-red-100 p-5 flex justify-between items-center shrink-0">
              <h3 className="text-base font-semibold text-red-600 tracking-tight flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2" /> Danger: Permanent Deletion
              </h3>
              <button onClick={() => { setSiteToDelete(null); setDeleteConfirmText(''); }} className="text-slate-400 hover:text-slate-700 transition-colors text-2xl leading-none">&times;</button>
            </div>
            
            <form onSubmit={handleDeleteSite} className="p-6 space-y-5 bg-slate-50/50">
              <p className="text-slate-600 text-sm leading-relaxed">
                You are about to permanently delete the <strong className="text-slate-900">{siteToDelete.branch_name}</strong> detachment. This will completely remove it from the system.
              </p>
              
              <div className="bg-red-50/50 border border-red-100 p-3.5 rounded-lg text-xs text-red-800 shadow-sm font-medium">
                Type <strong className="font-bold">DELETE</strong> below to execute.
              </div>
              
              <input 
                type="text" 
                required
                className="w-full border border-slate-200 p-2.5 rounded-lg outline-none text-slate-900 bg-white placeholder-slate-300 focus:border-red-400 focus:ring-2 focus:ring-red-500/20 font-mono font-bold tracking-widest text-center shadow-sm text-sm" 
                placeholder="DELETE"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
              />
              
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setSiteToDelete(null); setDeleteConfirmText(''); }} className="flex-1 bg-white border border-slate-200 text-slate-700 text-sm font-semibold py-2.5 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
                  Cancel
                </button>
                <button type="submit" disabled={deleteConfirmText !== 'DELETE'} className={`flex-1 text-sm font-semibold py-2.5 rounded-lg text-white transition-all shadow-sm ${deleteConfirmText === 'DELETE' ? 'bg-red-600 hover:bg-red-700 ring-1 ring-red-700/50' : 'bg-red-300 cursor-not-allowed'}`}>
                  Confirm Delete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}