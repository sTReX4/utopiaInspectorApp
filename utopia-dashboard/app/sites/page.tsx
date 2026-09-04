'use client';

import { useAuth } from '@/app/context/AuthContext';
import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Plus, Search, MapPin, QrCode, Power, PowerOff, Printer, Map, Lock, Eye, UserPlus, User, ShieldCheck, Trash2, AlertTriangle, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import dynamic from 'next/dynamic';

const LocationPicker = dynamic(() => import('../components/locationPicker'), { 
  ssr: false,
  loading: () => <div className="h-64 bg-slate-50 flex items-center justify-center text-slate-400 font-mono text-xs uppercase tracking-widest border border-slate-200">Loading Map...</div>
});

interface Inspector {
  id: string;
  full_name: string;
}

interface Guard {
  id: string;
  guard_name: string;
  assigned_branch: string | null;
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
  
  const [allGuards, setAllGuards] = useState<Guard[]>([]);
  const [selectedGuards, setSelectedGuards] = useState<Guard[]>([]);
  const [guardSearch, setGuardSearch] = useState('');

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
      .select('id, guard_name, assigned_branch')
      .eq('is_active', true);

    if (guardsData) setAllGuards(guardsData);

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

  const handleAddGuardToSelection = (guard: Guard) => {
    if (selectedGuards.find(g => g.id === guard.id)) return;

    if (guard.assigned_branch && guard.assigned_branch !== siteToAssign?.branch_name) {
        const confirmed = window.confirm(`WARNING: ${guard.guard_name} is currently deployed at "${guard.assigned_branch}".\n\nDo you want to reassign them to "${siteToAssign?.branch_name}"?`);
        if (!confirmed) return;
    }

    setSelectedGuards([...selectedGuards, guard]);
    setGuardSearch('');
  };

  const handleRemoveGuardFromSelection = (guardId: string) => {
    setSelectedGuards(selectedGuards.filter(g => g.id !== guardId));
  };

  const handleAssignPersonnel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteToAssign) return;

    const inspectorIdToSave = selectedInspectorId === 'UNASSIGNED' ? null : selectedInspectorId;

    const { error: detachmentError } = await supabase
      .from('detachments')
      .update({ assigned_inspector_id: inspectorIdToSave } as any)
      .eq('id', siteToAssign.id);

    if (detachmentError) {
      alert("Error assigning inspector.");
      return;
    }

    const originalGuards = allGuards.filter(g => g.assigned_branch === siteToAssign.branch_name);
    const originalGuardIds = originalGuards.map(g => g.id);
    const newGuardIds = selectedGuards.map(g => g.id);

    const guardsToAdd = selectedGuards.filter(g => !originalGuardIds.includes(g.id));
    const guardsToRemove = originalGuards.filter(g => !newGuardIds.includes(g.id));

    for (const g of guardsToAdd) {
        await supabase.from('guards').update({ assigned_branch: siteToAssign.branch_name }).eq('id', g.id);
    }
    for (const g of guardsToRemove) {
        await supabase.from('guards').update({ assigned_branch: null }).eq('id', g.id);
    }

    const updatedAllGuards = allGuards.map(g => {
        if (guardsToAdd.some(add => add.id === g.id)) return { ...g, assigned_branch: siteToAssign.branch_name };
        if (guardsToRemove.some(rem => rem.id === g.id)) return { ...g, assigned_branch: null };
        return g;
    });
    setAllGuards(updatedAllGuards);

    const assignedInspectorData = inspectors.find(i => i.id === selectedInspectorId);
    setSites(sites.map(site => site.id === siteToAssign.id ? { 
        ...site, 
        assigned_inspector_id: inspectorIdToSave,
        inspector: assignedInspectorData ? { full_name: assignedInspectorData.full_name } : null,
        assigned_guards: selectedGuards.map(g => g.guard_name)
    } : site));
    
    setIsAssignModalOpen(false);
  };

  const filteredSites = sites.filter(site => 
    site.branch_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    site.branch_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading) return (
    <div className="flex h-[50vh] items-center justify-center">
      <div className="text-xs font-mono uppercase tracking-widest text-slate-500">Verifying Security Clearance...</div>
    </div>
  );

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">Detachment Roster</h1>
            {!isSuperadmin && (
              <span className="bg-white text-slate-600 text-xs font-mono px-2 py-0.5 border border-slate-300 uppercase tracking-widest flex items-center">
                <Eye className="w-3 h-3 mr-1" /> Partial Access
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">Manage client locations, verification codes, and assignments.</p>
        </div>

        {isSuperadmin ? (
          <button onClick={() => setIsAddModalOpen(true)} className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-none text-sm font-semibold flex items-center transition-none">
            <Plus className="w-4 h-4 mr-2" /> Add Detachment
          </button>
        ) : (
          <button disabled className="bg-slate-100 text-slate-400 px-5 py-2.5 rounded-none text-sm font-semibold flex items-center cursor-not-allowed border border-slate-200">
            <Lock className="w-4 h-4 mr-2" /> Add Detachment
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-slate-200 p-3 flex items-center">
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
      <div className="border border-slate-200 bg-white overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-widest text-slate-500 font-mono">
              <th className="p-4 font-bold">Branch Code</th>
              <th className="p-4 font-bold">Branch Name</th>
              <th className="p-4 font-bold">Location</th>
              <th className="p-4 font-bold">Deployed Guard(s)</th>
              <th className="p-4 font-bold">Assigned Inspector</th>
              <th className="p-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {isLoading ? (
              <tr><td colSpan={6} className="p-12 text-center text-slate-500 font-mono text-xs uppercase tracking-widest">Loading database...</td></tr>
            ) : filteredSites.length === 0 ? (
              <tr><td colSpan={6} className="p-12 text-center text-slate-500 font-mono text-xs uppercase tracking-widest">No detachments found. Add one above.</td></tr>
            ) : (
              filteredSites.map((site) => (
                <tr key={site.id} className={`transition-none hover:bg-slate-50 ${!site.is_active && 'bg-slate-50 opacity-60'}`}>
                  <td className="p-4 font-mono text-sm text-slate-500">{site.branch_code}</td>
                  <td className="p-4 text-sm font-bold text-slate-900">{site.branch_name}</td>
                  <td className="p-4 text-sm text-slate-600">
                    <div className="flex items-center">
                      <MapPin className="w-3.5 h-3.5 mr-1.5 text-slate-400 shrink-0" />
                      {site.branch_location}
                    </div>
                  </td>
                  
                  <td className="p-4">
                    {site.assigned_guards && site.assigned_guards.length > 0 ? (
                      <div className="flex flex-col gap-1.5">
                        {site.assigned_guards.map((gName, idx) => (
                          <span key={idx} className="flex items-center text-xs font-mono font-bold text-slate-800 bg-white px-2 py-1 rounded-none w-max border border-slate-300 uppercase tracking-widest">
                            <ShieldCheck className="w-3 h-3 mr-1.5 text-slate-400" />
                            {gName}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">Unmanned Post</span>
                    )}
                  </td>

                  <td className="p-4">
                    {site.inspector ? (
                      <span className="flex items-center text-xs font-mono font-bold text-slate-900 bg-white px-2 py-1 rounded-none w-max border border-slate-300 uppercase tracking-widest">
                        <User className="w-3 h-3 mr-1.5 text-slate-400" />
                        {site.inspector.full_name}
                      </span>
                    ) : (
                      <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">Unassigned</span>
                    )}
                  </td>

                  <td className="p-4 text-right space-x-1 flex justify-end">
                    <button 
                      onClick={() => {
                        setSiteToAssign(site);
                        setSelectedInspectorId(site.assigned_inspector_id || 'UNASSIGNED');
                        setSelectedGuards(allGuards.filter(g => g.assigned_branch === site.branch_name));
                        setGuardSearch('');
                        setIsAssignModalOpen(true);
                      }}
                      className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-none transition-none"
                      title="Dispatch Personnel"
                    >
                      <UserPlus className="w-4 h-4" />
                    </button>

                    <button 
                      onClick={() => setSelectedSiteForMap(site)}
                      className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-none transition-none"
                      title="View Map Location"
                    >
                      <Map className="w-4 h-4" />
                    </button>

                    {site.is_active && (
                      <button 
                        onClick={() => setSelectedSiteForQR(site)}
                        className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-none transition-none"
                        title="Generate Verification QR"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                    )}

                    {isSuperadmin ? (
                      <button 
                        onClick={() => toggleSiteStatus(site.id, site.is_active)}
                        className={`p-2 rounded-none transition-none ${site.is_active ? 'text-slate-500 hover:text-red-600 hover:bg-red-50' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'}`} 
                        title={site.is_active ? "Deactivate Site" : "Reactivate Site"}
                      >
                        {site.is_active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                      </button>
                    ) : (
                      <button disabled className="p-2 text-slate-300 cursor-not-allowed">
                        <Lock className="w-4 h-4" />
                      </button>
                    )}

                    {isSuperadmin ? (
                      <button 
                        onClick={() => { setSiteToDelete(site); setDeleteConfirmText(''); }}
                        className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-none transition-none" 
                        title="Delete Detachment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <button disabled className="p-2 text-slate-300 cursor-not-allowed">
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

      {/* 1. Assign Inspector & Guards Modal */}
      {isAssignModalOpen && siteToAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 transition-none">
          <div className="bg-white rounded-none border border-slate-300 shadow-none w-full max-w-md overflow-visible flex flex-col">
            <div className="bg-white border-b border-slate-200 p-5 flex justify-between items-center shrink-0">
              <h3 className="text-base font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <UserPlus className="w-4 h-4" /> Dispatch Personnel
              </h3>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-slate-400 hover:text-slate-900 transition-none text-xl leading-none">✕</button>
            </div>
            
            <form onSubmit={handleAssignPersonnel} className="p-6 space-y-6 overflow-visible bg-slate-50">
              <div className="bg-white p-4 border border-slate-200">
                <p className="text-xs text-slate-500 font-mono uppercase tracking-widest mb-1">Target Detachment</p>
                <p className="font-bold text-slate-900 text-sm uppercase">{siteToAssign.branch_name}</p>
                <p className="text-xs font-mono text-slate-500 mt-1">{siteToAssign.branch_code}</p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-500 uppercase tracking-widest mb-2">Select Roving Inspector</label>
                  <select 
                    className="w-full border border-slate-300 p-2.5 rounded-none outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 text-sm font-medium text-slate-900 bg-white cursor-pointer"
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

                <div className="border-t border-slate-200 pt-5">
                  <label className="block text-xs font-mono font-bold text-slate-500 uppercase tracking-widest mb-2">Deploy Guards to Detachment</label>
                  
                  <div className="flex flex-wrap gap-2 mb-3 min-h-[42px] p-2 bg-white border border-slate-300">
                    {selectedGuards.length === 0 && <span className="text-xs font-mono text-slate-400 py-1 px-1 uppercase tracking-widest">No guards deployed.</span>}
                    {selectedGuards.map(g => (
                      <span key={g.id} className="flex items-center text-xs font-mono font-bold text-slate-900 bg-slate-100 pl-2 pr-1 py-1 rounded-none border border-slate-300 uppercase tracking-widest">
                        {g.guard_name}
                        <button type="button" onClick={() => handleRemoveGuardFromSelection(g.id)} className="ml-2 text-slate-400 hover:text-slate-900 hover:bg-slate-200 p-0.5 transition-none">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search and add guards..."
                      className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-none outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 text-sm font-medium text-slate-900 bg-white"
                      value={guardSearch}
                      onChange={(e) => setGuardSearch(e.target.value)}
                    />
                    {guardSearch && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-300 max-h-48 overflow-y-auto z-50">
                        {allGuards
                          .filter(g => g.guard_name.toLowerCase().includes(guardSearch.toLowerCase()) || (g.assigned_branch && g.assigned_branch.toLowerCase().includes(guardSearch.toLowerCase())))
                          .filter(g => !selectedGuards.find(sg => sg.id === g.id))
                          .map(g => (
                            <button
                              key={g.id}
                              type="button"
                              onClick={() => handleAddGuardToSelection(g)}
                              className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-200 last:border-0 flex flex-col transition-none"
                            >
                              <span className="text-sm font-bold text-slate-900">{g.guard_name}</span>
                              {g.assigned_branch && (
                                <span className="text-xs text-slate-500 font-mono uppercase tracking-widest mt-1">
                                  Currently at: {g.assigned_branch}
                                </span>
                              )}
                            </button>
                        ))}
                        {allGuards.filter(g => g.guard_name.toLowerCase().includes(guardSearch.toLowerCase()) && !selectedGuards.find(sg => sg.id === g.id)).length === 0 && (
                            <div className="p-3 text-xs font-mono uppercase tracking-widest text-slate-500 text-center">No matching guards available.</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button type="submit" className="w-full bg-slate-900 text-white text-sm font-bold uppercase tracking-widest py-3 rounded-none hover:bg-slate-800 transition-none">
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Add New Site Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 transition-none">
          <div className="bg-white rounded-none border border-slate-300 shadow-none w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-white border-b border-slate-200 p-5 flex justify-between items-center shrink-0">
              <h3 className="text-base font-bold text-slate-900 uppercase tracking-tight">Register New Detachment</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-900 transition-none text-xl leading-none">✕</button>
            </div>
            
            <form onSubmit={handleAddSite} className="p-6 flex flex-col md:flex-row gap-6 overflow-y-auto bg-slate-50">
              <div className="w-full md:w-1/2 space-y-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-500 uppercase tracking-widest mb-2">Branch Code (Unique)</label>
                  <input required type="text" placeholder="e.g. BDO-001" className="w-full border border-slate-300 p-2.5 rounded-none outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 bg-white text-sm font-medium text-slate-900" value={newSite.code} onChange={e => setNewSite({...newSite, code: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-500 uppercase tracking-widest mb-2">Branch Name</label>
                  <input required type="text" placeholder="e.g. BDO Makati Ave" className="w-full border border-slate-300 p-2.5 rounded-none outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 bg-white text-sm font-medium text-slate-900" value={newSite.name} onChange={e => setNewSite({...newSite, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-500 uppercase tracking-widest mb-2">Full Address / Location</label>
                  <input required type="text" placeholder="e.g. Makati City, Metro Manila" className="w-full border border-slate-300 p-2.5 rounded-none outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 bg-white text-sm font-medium text-slate-900" value={newSite.location} onChange={e => setNewSite({...newSite, location: e.target.value})} />
                </div>
              </div>

              <div className="w-full md:w-1/2 flex flex-col">
                <label className="block text-xs font-mono font-bold text-slate-500 uppercase tracking-widest mb-2">Pinpoint Location</label>
                <div className="flex-1 min-h-[250px] border border-slate-300 bg-white">
                  <LocationPicker 
                    position={newSite.coordinates} 
                    setPosition={(pos) => setNewSite({...newSite, coordinates: pos})} 
                  />
                </div>
                <div className="mt-3 p-3 bg-white border border-slate-300 text-xs font-mono text-center text-slate-900">
                  {newSite.coordinates 
                    ? `Lat: ${newSite.coordinates.lat.toFixed(5)}, Lng: ${newSite.coordinates.lng.toFixed(5)}` 
                    : "No location selected"}
                </div>
              </div>
            </form>

            <div className="p-5 border-t border-slate-200 bg-white shrink-0">
              <button onClick={handleAddSite} type="submit" className="w-full bg-slate-900 text-white text-sm font-bold uppercase tracking-widest py-3 rounded-none hover:bg-slate-800 transition-none">
                Save & Register Detachment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. QR Code Generator Modal */}
      {selectedSiteForQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 transition-none">
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

          <div className="bg-white border border-slate-300 rounded-none w-full max-w-sm flex flex-col print:border-none">
            
            <div className="bg-white border-b border-slate-200 p-5 flex justify-between items-center shrink-0 print:hidden">
              <h3 className="text-base font-bold text-slate-900 uppercase tracking-tight">Verification QR Code</h3>
              <button onClick={() => setSelectedSiteForQR(null)} className="text-slate-400 hover:text-slate-900 transition-none text-xl leading-none">✕</button>
            </div>

            <div id="qr-print-area" className="p-8 flex flex-col items-center justify-center space-y-6 bg-slate-50 print:bg-white">
              <div className="text-center">
                <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">{selectedSiteForQR.branch_name}</h2>
                <p className="text-sm font-mono text-slate-500 mt-2">{selectedSiteForQR.branch_code}</p>
              </div>
              
              <div className="bg-white p-6 border border-slate-300 print:border-none">
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

              <p className="text-xs font-mono text-slate-500 text-center leading-relaxed print:mt-4 print:text-black max-w-xs uppercase tracking-widest">
                Scan via Inspector App to verify arrival at <span className="font-bold print:text-black">{selectedSiteForQR.branch_code}</span>.
              </p>

              <button 
                onClick={() => window.print()}
                className="w-full mt-4 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold uppercase tracking-widest py-3 rounded-none flex items-center justify-center transition-none print:hidden"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 transition-none">
          <div className="bg-white rounded-none border border-slate-300 w-full max-w-2xl overflow-hidden flex flex-col">
            <div className="bg-white border-b border-slate-200 p-5 flex justify-between items-center shrink-0">
              <h3 className="text-base font-bold text-slate-900 uppercase tracking-tight">GPS Location</h3>
              <button onClick={() => setSelectedSiteForMap(null)} className="text-slate-400 hover:text-slate-900 transition-none text-xl leading-none">✕</button>
            </div>
            <div className="p-6 flex flex-col space-y-4 bg-slate-50">
              <div className="bg-white p-4 border border-slate-200">
                <h2 className="text-sm font-bold uppercase text-slate-900">{selectedSiteForMap.branch_name}</h2>
                <p className="text-xs font-mono text-slate-500 mt-1">{selectedSiteForMap.branch_location}</p>
              </div>
              <div className="h-72 w-full bg-white border border-slate-300">
                {selectedSiteForMap.latitude && selectedSiteForMap.longitude ? (
                  <LocationPicker 
                    position={{ lat: selectedSiteForMap.latitude, lng: selectedSiteForMap.longitude }} 
                    setPosition={() => {}} 
                  />
                ) : (
                  <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 font-mono text-xs uppercase tracking-widest">
                    <MapPin className="w-6 h-6 text-slate-300 mb-2" />
                    <span>No Coordinates Recorded</span>
                  </div>
                )}
              </div>
              {selectedSiteForMap.latitude && (
                <div className="bg-white p-3 border border-slate-200 text-xs font-mono text-slate-900 text-center uppercase tracking-widest">
                  Lat: {selectedSiteForMap.latitude} | Lng: {selectedSiteForMap.longitude}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. Delete Detachment Modal */}
      {siteToDelete && isSuperadmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 transition-none">
          <div className="bg-white border border-slate-300 rounded-none w-full max-w-md overflow-hidden flex flex-col">
            <div className="bg-white border-b border-slate-200 p-5 flex justify-between items-center shrink-0">
              <h3 className="text-base font-bold text-red-600 uppercase tracking-tight flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2" /> Permanent Deletion
              </h3>
              <button onClick={() => { setSiteToDelete(null); setDeleteConfirmText(''); }} className="text-slate-400 hover:text-slate-900 transition-none text-xl leading-none">✕</button>
            </div>
            
            <form onSubmit={handleDeleteSite} className="p-6 space-y-5 bg-slate-50">
              <p className="text-slate-700 text-sm leading-relaxed">
                You are about to permanently delete <strong className="text-slate-900">{siteToDelete.branch_name}</strong>.
              </p>
              
              <div className="bg-red-50 border border-red-300 p-4 text-xs font-mono text-red-900 uppercase tracking-widest text-center">
                Type <strong className="font-bold">DELETE</strong> to execute.
              </div>
              
              <input 
                type="text" 
                required
                className="w-full border border-slate-300 p-3 outline-none text-slate-900 bg-white placeholder-slate-300 focus:border-red-600 focus:ring-1 focus:ring-red-600 font-mono font-bold tracking-widest text-center text-sm rounded-none" 
                placeholder="DELETE"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
              />
              
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setSiteToDelete(null); setDeleteConfirmText(''); }} className="flex-1 bg-white border border-slate-300 text-slate-900 text-xs font-bold uppercase tracking-widest py-3 rounded-none hover:bg-slate-100 transition-none">
                  Cancel
                </button>
                <button type="submit" disabled={deleteConfirmText !== 'DELETE'} className={`flex-1 text-xs font-bold uppercase tracking-widest py-3 rounded-none transition-none text-white border ${deleteConfirmText === 'DELETE' ? 'bg-red-600 hover:bg-red-700 border-red-700' : 'bg-red-300 border-red-300 cursor-not-allowed'}`}>
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