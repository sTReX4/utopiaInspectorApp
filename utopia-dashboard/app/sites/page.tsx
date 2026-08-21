'use client';

import { useAuth } from '@/app/context/AuthContext';
import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Plus, Search, MapPin, QrCode, Power, PowerOff, Printer, Map, Lock, Eye, UserPlus, User, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import dynamic from 'next/dynamic';

const LocationPicker = dynamic(() => import('../components/locationPicker'), { 
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center text-gray-500">Loading Map...</div>
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
  assigned_guards?: string[]; // NEW: Track guards deployed here
}

export default function SitesPage() {
  const { role, isLoading: authLoading } = useAuth();
  const [sites, setSites] = useState<Detachment[]>([]);
  const [inspectors, setInspectors] = useState<Inspector[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal States
  const [selectedSiteForQR, setSelectedSiteForQR] = useState<Detachment | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedSiteForMap, setSelectedSiteForMap] = useState<Detachment | null>(null);
  
  // Dispatch States
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [siteToAssign, setSiteToAssign] = useState<Detachment | null>(null);
  const [selectedInspectorId, setSelectedInspectorId] = useState<string>('');

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
    
    // 1. Fetch Detachments & Inspectors assigned
    const { data: detachmentsData, error } = await supabase
      .from('detachments')
      .select(`
        *,
        inspector:inspectors(full_name)
      `)
      .order('created_at', { ascending: false });

    // 2. Fetch all Active Guards to map their assignments
    const { data: guardsData } = await supabase
      .from('guards')
      .select('guard_name, assigned_branch')
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching sites:', error);
    } else {
      // 3. Map the guards directly into the matching detachments
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
    const { error } = await supabase.from('detachments').update({ is_active: !currentStatus }).eq('id', id);
    if (!error) setSites(sites.map(site => site.id === id ? { ...site, is_active: !currentStatus } : site));
  };

  const handleAssignInspector = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteToAssign) return;

    const inspectorIdToSave = selectedInspectorId === 'UNASSIGNED' ? null : selectedInspectorId;
    const { error } = await supabase.from('detachments').update({ assigned_inspector_id: inspectorIdToSave }).eq('id', siteToAssign.id);

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

  if (authLoading) return <div className="p-8 text-center font-bold text-gray-500">Verifying Security Clearance...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">Detachment Roster</h1>
            {!isSuperadmin && (
              <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2 py-1 rounded flex items-center">
                <Eye className="w-3 h-3 mr-1" /> Partial Access
              </span>
            )}
          </div>
          <p className="text-gray-600 mt-1">Manage client locations, verification codes, and assignments.</p>
        </div>
        
        {isSuperadmin ? (
          <button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center transition-colors shadow-sm">
            <Plus className="w-5 h-5 mr-2" /> Add Detachment
          </button>
        ) : (
          <button disabled className="bg-gray-100 text-gray-400 px-4 py-2 rounded-lg font-bold flex items-center cursor-not-allowed border border-gray-200 shadow-sm">
            <Lock className="w-4 h-4 mr-2" /> Add Detachment
          </button>
        )}
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center">
        <Search className="w-5 h-5 text-gray-400 mr-3" />
        <input 
          type="text" 
          placeholder="Search by branch name or code..." 
          className="flex-1 outline-none text-gray-900 bg-white"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
              <th className="p-4 font-semibold">Branch Code</th>
              <th className="p-4 font-semibold">Branch Name</th>
              <th className="p-4 font-semibold">Location</th>
              <th className="p-4 font-semibold">Deployed Guard(s)</th>
              <th className="p-4 font-semibold">Assigned Inspector</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr><td colSpan={6} className="p-8 text-center text-gray-500">Loading database...</td></tr>
            ) : filteredSites.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-gray-500">No detachments found.</td></tr>
            ) : (
              filteredSites.map((site) => (
                <tr key={site.id} className={`transition-colors ${!site.is_active && 'bg-gray-50 opacity-60'}`}>
                  <td className="p-4 font-mono text-sm text-gray-600 font-bold">{site.branch_code}</td>
                  <td className="p-4 font-medium text-gray-900">{site.branch_name}</td>
                  <td className="p-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                      {site.branch_location}
                    </div>
                  </td>
                  
                  {/* NEW: Deployed Guards Render */}
                  <td className="p-4">
                    {site.assigned_guards && site.assigned_guards.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {site.assigned_guards.map((gName, idx) => (
                          <span key={idx} className="flex items-center text-xs font-bold text-gray-800 bg-gray-100 px-2 py-1 rounded w-max border border-gray-200">
                            <ShieldCheck className="w-3 h-3 mr-1 text-gray-500" />
                            {gName}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm font-medium text-gray-400 italic">Unmanned Post</span>
                    )}
                  </td>

                  <td className="p-4">
                    {site.inspector ? (
                      <span className="flex items-center text-sm font-bold text-gray-800 bg-blue-50 px-2 py-1 rounded w-max border border-blue-100">
                        <User className="w-3 h-3 mr-1 text-blue-600" />
                        {site.inspector.full_name}
                      </span>
                    ) : (
                      <span className="text-sm font-medium text-gray-400 italic">Unassigned</span>
                    )}
                  </td>

                  <td className="p-4 text-right space-x-1 flex justify-end">
                    <button 
                      onClick={() => {
                        setSiteToAssign(site);
                        setSelectedInspectorId(site.assigned_inspector_id || 'UNASSIGNED');
                        setIsAssignModalOpen(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Assign Inspector"
                    >
                      <UserPlus className="w-5 h-5" />
                    </button>

                    <button 
                      onClick={() => setSelectedSiteForMap(site)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                      title="View Map Location"
                    >
                      <Map className="w-5 h-5" />
                    </button>

                    {site.is_active && (
                      <button 
                        onClick={() => setSelectedSiteForQR(site)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        title="Generate Verification QR"
                      >
                        <QrCode className="w-5 h-5" />
                      </button>
                    )}

                    {isSuperadmin ? (
                      <button 
                        onClick={() => toggleSiteStatus(site.id, site.is_active)}
                        className={`p-2 rounded transition-colors ${site.is_active ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`} 
                        title={site.is_active ? "Deactivate Site" : "Reactivate Site"}
                      >
                        {site.is_active ? <PowerOff className="w-5 h-5" /> : <Power className="w-5 h-5" />}
                      </button>
                    ) : (
                      <button disabled className="p-2 text-gray-300 cursor-not-allowed" title="Requires Superadmin">
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

      {/* === MODAL: DISPATCH INSPECTOR === */}
      {isAssignModalOpen && siteToAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="bg-gray-900 p-4 flex justify-between items-center text-white shrink-0">
              <h3 className="font-bold flex items-center gap-2">
                <UserPlus className="w-5 h-5" /> Dispatch Inspector
              </h3>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
            </div>
            
            <form onSubmit={handleAssignInspector} className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Target Detachment:</p>
                <p className="font-bold text-gray-900 text-lg">{siteToAssign.branch_name}</p>
                <p className="text-xs font-mono text-gray-400">{siteToAssign.branch_code}</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Select Roving Inspector</label>
                <select 
                  className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white cursor-pointer"
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

              <div className="pt-4 mt-4">
                <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* === MODAL: ADD NEW SITE === */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gray-900 p-4 flex justify-between items-center text-white shrink-0">
              <h3 className="font-bold">Register New Detachment</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
            </div>
            
            <form onSubmit={handleAddSite} className="p-6 flex flex-col md:flex-row gap-6 overflow-y-auto">
              <div className="w-full md:w-1/2 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Branch Code (Unique)</label>
                  <input required type="text" placeholder="e.g. BDO-001" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900" value={newSite.code} onChange={e => setNewSite({...newSite, code: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Branch Name</label>
                  <input required type="text" placeholder="e.g. BDO Makati Ave" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900" value={newSite.name} onChange={e => setNewSite({...newSite, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Full Address / Location</label>
                  <input required type="text" placeholder="e.g. Makati City, Metro Manila" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900" value={newSite.location} onChange={e => setNewSite({...newSite, location: e.target.value})} />
                </div>
              </div>

              <div className="w-full md:w-1/2 flex flex-col">
                <label className="block text-sm font-bold text-gray-700 mb-1">Pinpoint Detachment Location</label>
                <p className="text-xs text-gray-500 mb-2">Click to assign the official location of this detachment.</p>
                <div className="flex-1 min-h-[250px]">
                  <LocationPicker 
                    position={newSite.coordinates} 
                    setPosition={(pos) => setNewSite({...newSite, coordinates: pos})} 
                  />
                </div>
                <div className="mt-2 p-2 bg-gray-50 border rounded text-xs font-mono text-center text-gray-600">
                  {newSite.coordinates 
                    ? `Lat: ${newSite.coordinates.lat.toFixed(5)}, Lng: ${newSite.coordinates.lng.toFixed(5)}` 
                    : "No location selected"}
                </div>
              </div>
            </form>

            <div className="p-4 border-t bg-gray-50 shrink-0">
              <button onClick={handleAddSite} type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors">
                Save & Register Detachment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === MODAL: ACTUAL QR CODE GENERATOR === */}
      {selectedSiteForQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="bg-gray-900 p-4 flex justify-between items-center text-white shrink-0">
              <h3 className="font-bold">Verification QR Code</h3>
              <button onClick={() => setSelectedSiteForQR(null)} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
            </div>
            <div className="p-6 flex flex-col items-center justify-center space-y-4">
              <h2 className="text-xl font-bold text-gray-900 text-center">{selectedSiteForQR.branch_name}</h2>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <QRCodeSVG 
                  value={JSON.stringify({
                    code: selectedSiteForQR.branch_code,
                    name: selectedSiteForQR.branch_name,
                    location: selectedSiteForQR.branch_location
                  })} 
                  size={200} 
                  level="H" 
                  includeMargin={true} 
                />
              </div>
              <p className="text-sm text-gray-500 text-center">
                Scan this code using the Utopia Inspector App to verify arrival at {selectedSiteForQR.branch_code}.
              </p>
              <button 
                onClick={() => window.print()}
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center transition-colors"
              >
                <Printer className="w-5 h-5 mr-2" />
                Print QR Code
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* === MODAL: VIEW MAP LOCATION === */}
      {selectedSiteForMap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
            <div className="bg-gray-900 p-4 flex justify-between items-center text-white shrink-0">
              <h3 className="font-bold">Detachment GPS Location</h3>
              <button onClick={() => setSelectedSiteForMap(null)} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
            </div>
            <div className="p-6 flex flex-col space-y-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedSiteForMap.branch_name}</h2>
                <p className="text-sm text-gray-500">{selectedSiteForMap.branch_location}</p>
              </div>
              <div className="h-72 w-full bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                {selectedSiteForMap.latitude && selectedSiteForMap.longitude ? (
                  <LocationPicker 
                    position={{ lat: selectedSiteForMap.latitude, lng: selectedSiteForMap.longitude }} 
                    setPosition={() => {}} 
                  />
                ) : (
                  <div className="h-full w-full flex flex-col items-center justify-center text-gray-500">
                    <MapPin className="w-8 h-8 text-gray-300 mb-2" />
                    <span>No GPS coordinates recorded for this detachment.</span>
                  </div>
                )}
              </div>
              {selectedSiteForMap.latitude && (
                <div className="bg-gray-50 p-3 rounded border text-sm font-mono text-gray-600 text-center">
                  Lat: {selectedSiteForMap.latitude} | Lng: {selectedSiteForMap.longitude}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}