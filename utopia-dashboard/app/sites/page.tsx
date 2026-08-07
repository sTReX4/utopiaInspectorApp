'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Plus, Search, MapPin, QrCode, Power, PowerOff, Printer, Map } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import dynamic from 'next/dynamic';

// Dynamically import the map to prevent Server-Side Rendering (SSR) crashes
const LocationPicker = dynamic(() => import('../components/locationPicker'), { 
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center text-gray-500">Loading Map...</div>
});

// Define the TypeScript shape based on our new Supabase table
interface Detachment {
  id: string;
  branch_code: string;
  branch_name: string;
  branch_location: string;
  is_active: boolean;
  latitude?: number;
  longitude?: number;
}

export default function SitesPage() {
  const [sites, setSites] = useState<Detachment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal States
  const [selectedSiteForQR, setSelectedSiteForQR] = useState<Detachment | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const [selectedSiteForMap, setSelectedSiteForMap] = useState<Detachment | null>(null);
  
  const [newSite, setNewSite] = useState({ 
      code: '', 
      name: '', 
      location: '', 
      coordinates: null as { lat: number; lng: number } | null 
    });

    // 1. Fetch data on load
    useEffect(() => {
      fetchSites();
    }, []);

    const fetchSites = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('detachments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) console.error('Error fetching sites:', error);
      else setSites(data || []);
      setIsLoading(false);
    };

    // 2. Add a new detachment to Supabase
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
        console.error(error);
        return;
      }

      setSites([data, ...sites]); 
      setIsAddModalOpen(false); 
      setNewSite({ code: '', name: '', location: '', coordinates: null }); 
    };

    // 3. Toggle Status (Soft Delete / Reactivate)
    const toggleSiteStatus = async (id: string, currentStatus: boolean) => {
      const { error } = await supabase
        .from('detachments')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) {
        console.error('Error updating status:', error);
        return;
      }

      // Update the UI instantly without refreshing the page
      setSites(sites.map(site => site.id === id ? { ...site, is_active: !currentStatus } : site));
    };

    const filteredSites = sites.filter(site => 
      site.branch_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      site.branch_code.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Detachment Roster</h1>
          <p className="text-gray-600 mt-1">Manage client locations and verification codes.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Detachment
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center">
        <Search className="w-5 h-5 text-gray-400 mr-3" />
        <input 
          type="text" 
          placeholder="Search by branch name or code..." 
          className="flex-1 outline-none text-gray-700"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
              <th className="p-4 font-semibold">Branch Code</th>
              <th className="p-4 font-semibold">Branch Name</th>
              <th className="p-4 font-semibold">Location</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-500">Loading database...</td></tr>
            ) : filteredSites.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-500">No detachments found. Add one above!</td></tr>
            ) : (
              filteredSites.map((site) => (
                <tr key={site.id} className={`transition-colors ${!site.is_active && 'bg-gray-50 opacity-60'}`}>
                  <td className="p-4 font-mono text-sm text-gray-600">{site.branch_code}</td>
                  <td className="p-4 font-medium text-gray-900">{site.branch_name}</td>
                  <td className="p-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                      {site.branch_location}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${site.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {site.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    
                    {/* 1. NEW MAP BUTTON (Left) */}
                    <button 
                      onClick={() => setSelectedSiteForMap(site)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                      title="View Map Location"
                    >
                      <Map className="w-5 h-5" />
                    </button>

                    {/* 2. QR CODE BUTTON (Middle) */}
                    {site.is_active && (
                      <button 
                        onClick={() => setSelectedSiteForQR(site)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Generate Verification QR"
                      >
                        <QrCode className="w-5 h-5" />
                      </button>
                    )}

                    {/* 3. STATUS TOGGLE BUTTON (Right) */}
                    <button 
                      onClick={() => toggleSiteStatus(site.id, site.is_active)}
                      className={`p-2 rounded transition-colors ${site.is_active ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`} 
                      title={site.is_active ? "Deactivate Site" : "Reactivate Site"}
                    >
                      {site.is_active ? <PowerOff className="w-5 h-5" /> : <Power className="w-5 h-5" />}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* === MODAL: ADD NEW SITE === */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gray-900 p-4 flex justify-between items-center text-white shrink-0">
              <h3 className="font-bold">Register New Detachment</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
            </div>
            
            <form onSubmit={handleAddSite} className="p-6 flex flex-col md:flex-row gap-6 overflow-y-auto">
              
              {/* Left Column: Text Inputs */}
              <div className="w-full md:w-1/2 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Branch Code (Unique)</label>
                  <input required type="text" placeholder="e.g. BDO-001" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={newSite.code} onChange={e => setNewSite({...newSite, code: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Branch Name</label>
                  <input required type="text" placeholder="e.g. BDO Makati Ave" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={newSite.name} onChange={e => setNewSite({...newSite, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Full Address / Location</label>
                  <input required type="text" placeholder="e.g. Makati City, Metro Manila" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={newSite.location} onChange={e => setNewSite({...newSite, location: e.target.value})} />
                </div>
              </div>

              {/* Right Column: Interactive Map */}
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

      {/* === MODAL: QR CODE GENERATOR === */}
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
                    // We pass an empty function here so clicking the map doesn't move the saved pin!
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