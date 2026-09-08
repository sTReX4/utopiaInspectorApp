'use client';

import { useAuth } from '@/app/context/AuthContext';
import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Eye, Lock, MagnifyingGlass, MapPin, MapTrifold, Plus, Power, Printer, Prohibit, QrCode, ShieldCheck, Trash, User, UserPlus, Warning, X } from '@phosphor-icons/react';
import { supabase } from '@/lib/supabase';
import dynamic from 'next/dynamic';

const LocationPicker = dynamic(() => import('@/app/components/locationPicker'), { 
  ssr: false,
  loading: () => <div className="h-64 bg-canvas flex items-center justify-center text-ink-muted text-xs border border-line">Loading Map...</div>
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
      <div className="text-xs text-ink-muted">Verifying Security Clearance...</div>
    </div>
  );

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-line pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-ink">Detachment Roster</h1>
            {!isSuperadmin && (
              <span className="bg-surface text-ink-muted text-xs px-2 py-0.5 border border-line flex items-center">
                <Eye className="w-3 h-3 mr-1" /> Partial Access
              </span>
            )}
          </div>
          <p className="text-sm text-ink-muted mt-1">Manage client locations, verification codes, and assignments.</p>
        </div>

        {isSuperadmin ? (
          <button onClick={() => setIsAddModalOpen(true)} className="bg-ink hover:bg-shell-hover text-surface px-5 py-2.5 rounded-control text-sm font-semibold flex items-center transition-colors duration-200">
            <Plus className="w-4 h-4 mr-2" /> Add Detachment
          </button>
        ) : (
          <button disabled className="bg-sunken text-ink-muted px-5 py-2.5 rounded-control text-sm font-semibold flex items-center cursor-not-allowed border border-line">
            <Lock className="w-4 h-4 mr-2" /> Add Detachment
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-surface border border-line p-3 flex items-center">
        <MagnifyingGlass className="w-4 h-4 text-ink-muted mr-3 ml-2" />
        <input 
          type="text" 
          placeholder="Search by branch name or code..." 
          className="flex-1 outline-none text-sm font-medium text-ink bg-transparent placeholder-ink-muted"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Main Table */}
      <div className="border border-line bg-surface rounded-card overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-canvas border-b border-line text-xs text-ink-muted">
              <th className="p-4 font-bold">Branch Code</th>
              <th className="p-4 font-bold">Branch Name</th>
              <th className="p-4 font-bold">Location</th>
              <th className="p-4 font-bold">Deployed Guard(s)</th>
              <th className="p-4 font-bold">Assigned Inspector</th>
              <th className="p-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {isLoading ? (
              <tr><td colSpan={6} className="p-12 text-center text-ink-muted text-xs">Loading database...</td></tr>
            ) : filteredSites.length === 0 ? (
              <tr><td colSpan={6} className="p-12 text-center text-ink-muted text-xs">No detachments found. Add one above.</td></tr>
            ) : (
              filteredSites.map((site) => (
                <tr key={site.id} className={`transition-colors duration-200 hover:bg-sunken ${!site.is_active && 'bg-canvas opacity-60'}`}>
                  <td className="p-4 text-sm text-ink-muted">{site.branch_code}</td>
                  <td className="p-4 text-sm font-bold text-ink">{site.branch_name}</td>
                  <td className="p-4 text-sm text-ink-muted">
                    <div className="flex items-center">
                      <MapPin className="w-3.5 h-3.5 mr-1.5 text-ink-muted shrink-0" />
                      {site.branch_location}
                    </div>
                  </td>
                  
                  <td className="p-4">
                    {site.assigned_guards && site.assigned_guards.length > 0 ? (
                      <div className="flex flex-col gap-1.5">
                        {site.assigned_guards.map((gName, idx) => (
                          <span key={idx} className="flex items-center text-xs font-bold text-ink bg-surface px-2 py-1 rounded-control w-max border border-line">
                            <ShieldCheck className="w-3 h-3 mr-1.5 text-ink-muted" />
                            {gName}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-ink-muted">Unmanned Post</span>
                    )}
                  </td>

                  <td className="p-4">
                    {site.inspector ? (
                      <span className="flex items-center text-xs font-bold text-ink bg-surface px-2 py-1 rounded-control w-max border border-line">
                        <User className="w-3 h-3 mr-1.5 text-ink-muted" />
                        {site.inspector.full_name}
                      </span>
                    ) : (
                      <span className="text-xs text-ink-muted">Unassigned</span>
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
                      className="p-2 text-ink-muted hover:text-ink hover:bg-sunken rounded-control transition-colors duration-200"
                      title="Dispatch Personnel"
                    >
                      <UserPlus className="w-4 h-4" />
                    </button>

                    <button 
                      onClick={() => setSelectedSiteForMap(site)}
                      className="p-2 text-ink-muted hover:text-ink hover:bg-sunken rounded-control transition-colors duration-200"
                      title="View Map Location"
                    >
                      <MapTrifold className="w-4 h-4" />
                    </button>

                    {site.is_active && (
                      <button 
                        onClick={() => setSelectedSiteForQR(site)}
                        className="p-2 text-ink-muted hover:text-ink hover:bg-sunken rounded-control transition-colors duration-200"
                        title="Generate Verification QR"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                    )}

                    {isSuperadmin ? (
                      <button 
                        onClick={() => toggleSiteStatus(site.id, site.is_active)}
                        className={`p-2 rounded-control transition-colors duration-200 ${site.is_active ? 'text-ink-muted hover:text-danger-ink hover:bg-danger-bg' : 'text-ink-muted hover:text-ink hover:bg-sunken'}`} 
                        title={site.is_active ? "Deactivate Site" : "Reactivate Site"}
                      >
                        {site.is_active ? <Prohibit className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                      </button>
                    ) : (
                      <button disabled className="p-2 text-shell-muted cursor-not-allowed">
                        <Lock className="w-4 h-4" />
                      </button>
                    )}

                    {isSuperadmin ? (
                      <button 
                        onClick={() => { setSiteToDelete(site); setDeleteConfirmText(''); }}
                        className="p-2 text-ink-muted hover:text-danger-ink hover:bg-danger-bg rounded-control transition-colors duration-200" 
                        title="Delete Detachment"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    ) : (
                      <button disabled className="p-2 text-shell-muted cursor-not-allowed">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4 transition-colors duration-200">
          <div className="bg-surface rounded-control border border-line shadow-none w-full max-w-md overflow-visible flex flex-col">
            <div className="bg-surface border-b border-line p-5 flex justify-between items-center shrink-0">
              <h3 className="text-base font-bold text-ink tracking-tight flex items-center gap-2">
                <UserPlus className="w-4 h-4" /> Dispatch Personnel
              </h3>
              <button onClick={() => setIsAssignModalOpen(false)} aria-label="Close" className="text-ink-muted hover:text-ink transition-colors duration-200 p-1 rounded-control"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleAssignPersonnel} className="p-6 space-y-6 overflow-visible bg-canvas">
              <div className="bg-surface p-4 border border-line">
                <p className="text-xs text-ink-muted mb-1">Target Detachment</p>
                <p className="font-bold text-ink text-sm">{siteToAssign.branch_name}</p>
                <p className="text-xs text-ink-muted mt-1">{siteToAssign.branch_code}</p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-ink-muted mb-2">Select Roving Inspector</label>
                  <select 
                    className="w-full border border-line p-2.5 rounded-control outline-none focus:border-ink focus:ring-1 focus:ring-info-ink text-sm font-medium text-ink bg-surface cursor-pointer"
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

                <div className="border-t border-line pt-5">
                  <label className="block text-xs font-bold text-ink-muted mb-2">Deploy Guards to Detachment</label>
                  
                  <div className="flex flex-wrap gap-2 mb-3 min-h-[42px] p-2 bg-surface border border-line">
                    {selectedGuards.length === 0 && <span className="text-xs text-ink-muted py-1 px-1">No guards deployed.</span>}
                    {selectedGuards.map(g => (
                      <span key={g.id} className="flex items-center text-xs font-bold text-ink bg-sunken pl-2 pr-1 py-1 rounded-control border border-line">
                        {g.guard_name}
                        <button type="button" onClick={() => handleRemoveGuardFromSelection(g.id)} className="ml-2 text-ink-muted hover:text-ink hover:bg-sunken p-0.5 transition-colors duration-200">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="relative">
                    <MagnifyingGlass className="w-4 h-4 text-ink-muted absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search and add guards..."
                      className="w-full pl-9 pr-4 py-2.5 border border-line rounded-control outline-none focus:border-ink focus:ring-1 focus:ring-info-ink text-sm font-medium text-ink bg-surface"
                      value={guardSearch}
                      onChange={(e) => setGuardSearch(e.target.value)}
                    />
                    {guardSearch && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-surface border border-line max-h-48 overflow-y-auto z-50">
                        {allGuards
                          .filter(g => g.guard_name.toLowerCase().includes(guardSearch.toLowerCase()) || (g.assigned_branch && g.assigned_branch.toLowerCase().includes(guardSearch.toLowerCase())))
                          .filter(g => !selectedGuards.find(sg => sg.id === g.id))
                          .map(g => (
                            <button
                              key={g.id}
                              type="button"
                              onClick={() => handleAddGuardToSelection(g)}
                              className="w-full text-left px-4 py-3 hover:bg-sunken border-b border-line last:border-0 flex flex-col transition-colors duration-200"
                            >
                              <span className="text-sm font-bold text-ink">{g.guard_name}</span>
                              {g.assigned_branch && (
                                <span className="text-xs text-ink-muted mt-1">
                                  Currently at: {g.assigned_branch}
                                </span>
                              )}
                            </button>
                        ))}
                        {allGuards.filter(g => g.guard_name.toLowerCase().includes(guardSearch.toLowerCase()) && !selectedGuards.find(sg => sg.id === g.id)).length === 0 && (
                            <div className="p-3 text-xs text-ink-muted text-center">No matching guards available.</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button type="submit" className="w-full bg-ink text-surface text-sm font-bold py-3 rounded-control hover:bg-shell-hover transition-colors duration-200">
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Add New Site Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4 transition-colors duration-200">
          <div className="bg-surface rounded-control border border-line shadow-none w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-surface border-b border-line p-5 flex justify-between items-center shrink-0">
              <h3 className="text-base font-bold text-ink tracking-tight">Register New Detachment</h3>
              <button onClick={() => setIsAddModalOpen(false)} aria-label="Close" className="text-ink-muted hover:text-ink transition-colors duration-200 p-1 rounded-control"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleAddSite} className="p-6 flex flex-col md:flex-row gap-6 overflow-y-auto bg-canvas">
              <div className="w-full md:w-1/2 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-ink-muted mb-2">Branch Code (Unique)</label>
                  <input required type="text" placeholder="e.g. BDO-001" className="w-full border border-line p-2.5 rounded-control outline-none focus:border-ink focus:ring-1 focus:ring-info-ink bg-surface text-sm font-medium text-ink" value={newSite.code} onChange={e => setNewSite({...newSite, code: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink-muted mb-2">Branch Name</label>
                  <input required type="text" placeholder="e.g. BDO Makati Ave" className="w-full border border-line p-2.5 rounded-control outline-none focus:border-ink focus:ring-1 focus:ring-info-ink bg-surface text-sm font-medium text-ink" value={newSite.name} onChange={e => setNewSite({...newSite, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink-muted mb-2">Full Address / Location</label>
                  <input required type="text" placeholder="e.g. Makati City, Metro Manila" className="w-full border border-line p-2.5 rounded-control outline-none focus:border-ink focus:ring-1 focus:ring-info-ink bg-surface text-sm font-medium text-ink" value={newSite.location} onChange={e => setNewSite({...newSite, location: e.target.value})} />
                </div>
              </div>

              <div className="w-full md:w-1/2 flex flex-col">
                <label className="block text-xs font-bold text-ink-muted mb-2">Pinpoint Location</label>
                <div className="flex-1 min-h-[250px] border border-line bg-surface">
                  <LocationPicker 
                    position={newSite.coordinates} 
                    setPosition={(pos) => setNewSite({...newSite, coordinates: pos})} 
                  />
                </div>
                <div className="mt-3 p-3 bg-surface border border-line text-xs text-center text-ink">
                  {newSite.coordinates 
                    ? `Lat: ${newSite.coordinates.lat.toFixed(5)}, Lng: ${newSite.coordinates.lng.toFixed(5)}` 
                    : "No location selected"}
                </div>
              </div>
            </form>

            <div className="p-5 border-t border-line bg-surface shrink-0">
              <button onClick={handleAddSite} type="submit" className="w-full bg-ink text-surface text-sm font-bold py-3 rounded-control hover:bg-shell-hover transition-colors duration-200">
                Save & Register Detachment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. QR Code Generator Modal */}
      {selectedSiteForQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4 transition-colors duration-200">
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

          <div className="bg-surface border border-line rounded-control w-full max-w-sm flex flex-col print:border-none">
            
            <div className="bg-surface border-b border-line p-5 flex justify-between items-center shrink-0 print:hidden">
              <h3 className="text-base font-bold text-ink tracking-tight">Verification QR Code</h3>
              <button onClick={() => setSelectedSiteForQR(null)} aria-label="Close" className="text-ink-muted hover:text-ink transition-colors duration-200 p-1 rounded-control"><X className="w-5 h-5" /></button>
            </div>

            <div id="qr-print-area" className="p-8 flex flex-col items-center justify-center space-y-6 bg-canvas print:bg-white">
              <div className="text-center">
                <h2 className="text-xl font-bold text-ink tracking-tight">{selectedSiteForQR.branch_name}</h2>
                <p className="text-sm text-ink-muted mt-2">{selectedSiteForQR.branch_code}</p>
              </div>
              
              <div className="bg-surface p-6 border border-line print:border-none">
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

              <p className="text-xs text-ink-muted text-center leading-relaxed print:mt-4 print:text-black max-w-xs">
                Scan this code using the Utopia Inspector App to verify arrival at <span className="font-bold print:text-black">{selectedSiteForQR.branch_code}</span>.
              </p>

              <button 
                onClick={() => window.print()}
                className="w-full mt-4 bg-ink hover:bg-shell-hover text-surface text-sm font-bold py-3 rounded-control flex items-center justify-center transition-colors duration-200 print:hidden"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4 transition-colors duration-200">
          <div className="bg-surface rounded-control border border-line w-full max-w-2xl overflow-hidden flex flex-col">
            <div className="bg-surface border-b border-line p-5 flex justify-between items-center shrink-0">
              <h3 className="text-base font-bold text-ink tracking-tight">GPS Location</h3>
              <button onClick={() => setSelectedSiteForMap(null)} aria-label="Close" className="text-ink-muted hover:text-ink transition-colors duration-200 p-1 rounded-control"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 flex flex-col space-y-4 bg-canvas">
              <div className="bg-surface p-4 border border-line">
                <h2 className="text-sm font-bold text-ink">{selectedSiteForMap.branch_name}</h2>
                <p className="text-xs text-ink-muted mt-1">{selectedSiteForMap.branch_location}</p>
              </div>
              <div className="h-72 w-full bg-surface border border-line">
                {selectedSiteForMap.latitude && selectedSiteForMap.longitude ? (
                  <LocationPicker 
                    position={{ lat: selectedSiteForMap.latitude, lng: selectedSiteForMap.longitude }} 
                    setPosition={() => {}} 
                  />
                ) : (
                  <div className="h-full w-full flex flex-col items-center justify-center text-ink-muted text-xs">
                    <MapPin className="w-6 h-6 text-shell-muted mb-2" />
                    <span>No Coordinates Recorded</span>
                  </div>
                )}
              </div>
              {selectedSiteForMap.latitude && (
                <div className="bg-surface p-3 border border-line text-xs text-ink text-center">
                  Lat: {selectedSiteForMap.latitude} | Lng: {selectedSiteForMap.longitude}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. Delete Detachment Modal */}
      {siteToDelete && isSuperadmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4 transition-colors duration-200">
          <div className="bg-surface border border-line rounded-control w-full max-w-md overflow-hidden flex flex-col">
            <div className="bg-surface border-b border-line p-5 flex justify-between items-center shrink-0">
              <h3 className="text-base font-bold text-danger-ink tracking-tight flex items-center">
                <Warning className="w-4 h-4 mr-2" /> Danger: Permanent Deletion
              </h3>
              <button onClick={() => { setSiteToDelete(null); setDeleteConfirmText(''); }} aria-label="Close" className="text-ink-muted hover:text-ink transition-colors duration-200 p-1 rounded-control"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleDeleteSite} className="p-6 space-y-5 bg-canvas">
              <p className="text-ink text-sm leading-relaxed">
                You are about to permanently delete <strong className="text-ink">{siteToDelete.branch_name}</strong>.
              </p>
              
              <div className="bg-danger-bg border border-danger-ink/20 p-4 text-xs text-danger-ink text-center">
                Type <strong className="font-bold">DELETE</strong> to execute.
              </div>
              
              <input 
                type="text" 
                required
                className="w-full border border-line p-3 outline-none text-ink bg-surface placeholder-ink-muted focus:border-danger-ink focus:ring-1 focus:ring-danger-ink font-bold text-center text-sm rounded-control" 
                placeholder="DELETE"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
              />
              
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setSiteToDelete(null); setDeleteConfirmText(''); }} className="flex-1 bg-surface border border-line text-ink text-xs font-bold py-3 rounded-control hover:bg-sunken transition-colors duration-200">
                  Cancel
                </button>
                <button type="submit" disabled={deleteConfirmText !== 'DELETE'} className={`flex-1 text-xs font-bold py-3 rounded-control transition-colors duration-200 border ${deleteConfirmText === 'DELETE' ? 'bg-danger-ink hover:bg-danger-ink-hover border-danger-ink text-surface' : 'bg-sunken border-line text-ink-muted cursor-not-allowed'}`}>
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