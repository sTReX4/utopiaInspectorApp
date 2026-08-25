'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, ShieldCheck, ShieldAlert, User, ShieldX, Lock, MapPin, Key, KeyRound, Copy, Briefcase, Power, PowerOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/app/context/AuthContext';

interface Guard {
  id: string;
  guard_name: string;
  lesp_number: string;
  lesp_expiry_date: string;
  assigned_branch: string | null;
  is_active: boolean;
}

interface InspectorKey {
  id: string;
  access_key: string;
  assigned_to: string;
  is_used: boolean;
  created_by: string;
  created_at: string;
  used_at: string | null;
}

// NEW: Inspector Interface
interface Inspector {
  id: string;
  full_name: string;
  contact_number: string | null;
  is_active: boolean;
  created_at: string;
}

export default function PersonnelPage() {
  const { user, role, isLoading: authLoading } = useAuth();
  const isSuperadmin = role === 'superadmin';

  // --- UPGRADED 3-TIER TAB SYSTEM ---
  const [activeTab, setActiveTab] = useState<'guards' | 'inspectors' | 'keys'>('guards');

  // --- DATA STATES ---
  const [guards, setGuards] = useState<Guard[]>([]);
  const [keys, setKeys] = useState<InspectorKey[]>([]);
  const [inspectors, setInspectors] = useState<Inspector[]>([]);
  const [branchOptions, setBranchOptions] = useState<{branch_name: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // --- GUARD MODALS ---
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newGuard, setNewGuard] = useState({ guard_name: '', lesp_number: '', lesp_expiry_date: '', assigned_branch: '' });
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [guardToAssign, setGuardToAssign] = useState<Guard | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string>('');

  // --- KEY GENERATOR MODALS ---
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [newKeyAssignee, setNewKeyAssignee] = useState('');
  const [newlyGeneratedKey, setNewlyGeneratedKey] = useState<string | null>(null);

  // --- NEW: INSPECTOR MODAL ---
  const [isAddInspectorModalOpen, setIsAddInspectorModalOpen] = useState(false);
  const [newInspector, setNewInspector] = useState({ full_name: '', contact_number: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    await Promise.all([fetchGuards(), fetchBranches(), fetchKeys(), fetchInspectors()]);
    setIsLoading(false);
  };

  const fetchGuards = async () => {
    const { data } = await supabase.from('guards').select('*').order('guard_name', { ascending: true });
    if (data) setGuards(data);
  };

  const fetchBranches = async () => {
    const { data } = await supabase.from('detachments').select('branch_name').order('branch_name');
    if (data) setBranchOptions(data);
  };

  const fetchKeys = async () => {
    const { data } = await supabase.from('inspector_keys').select('*').order('created_at', { ascending: false });
    if (data) setKeys(data);
  };

  const fetchInspectors = async () => {
    const { data } = await supabase.from('inspectors').select('*').order('full_name', { ascending: true });
    if (data) setInspectors(data);
  };

  // --- GUARD LOGIC ---
  const handleAddGuard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperadmin) return;

    const branchToSave = newGuard.assigned_branch === 'UNASSIGNED' || !newGuard.assigned_branch ? null : newGuard.assigned_branch;
    const { data, error } = await supabase.from('guards').insert([{
        guard_name: newGuard.guard_name,
        lesp_number: newGuard.lesp_number,
        lesp_expiry_date: newGuard.lesp_expiry_date,
        assigned_branch: branchToSave,
        is_active: true
    }]).select().single();

    if (error) {
      alert("Error adding guard. Ensure the LESP Number is unique.");
      return;
    }

    setGuards([...guards, data].sort((a, b) => a.guard_name.localeCompare(b.guard_name))); 
    setIsAddModalOpen(false); 
    setNewGuard({ guard_name: '', lesp_number: '', lesp_expiry_date: '', assigned_branch: '' }); 
  };

  const handleAssignBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperadmin || !guardToAssign) return;

    const branchToSave = selectedBranch === 'UNASSIGNED' ? null : selectedBranch;
    const { error } = await supabase.from('guards').update({ assigned_branch: branchToSave }).eq('id', guardToAssign.id);

    if (error) return alert("Error deploying guard.");
    setGuards(guards.map(g => g.id === guardToAssign.id ? { ...g, assigned_branch: branchToSave } : g));
    setIsAssignModalOpen(false);
  };

  // --- NEW: INSPECTOR LOGIC ---
  const handleAddInspector = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperadmin) return;

    const { data, error } = await supabase.from('inspectors').insert([{
        full_name: newInspector.full_name,
        contact_number: newInspector.contact_number,
        is_active: true
    }]).select().single();

    if (error) {
      alert("Error registering inspector.");
      console.error(error);
      return;
    }

    setInspectors([...inspectors, data].sort((a, b) => a.full_name.localeCompare(b.full_name))); 
    setIsAddInspectorModalOpen(false); 
    setNewInspector({ full_name: '', contact_number: '' }); 
  };

  const toggleInspectorStatus = async (id: string, currentStatus: boolean) => {
    if (!isSuperadmin) return;
    const { error } = await supabase.from('inspectors').update({ is_active: !currentStatus }).eq('id', id);
    if (!error) {
      setInspectors(inspectors.map(ins => ins.id === id ? { ...ins, is_active: !currentStatus } : ins));
    }
  };

  // --- KEY GENERATOR LOGIC ---
  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperadmin || !newKeyAssignee.trim()) return;

    const uniqueCode = `UTP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const { data, error } = await supabase.from('inspector_keys').insert([{
        access_key: uniqueCode,
        assigned_to: newKeyAssignee,
        created_by: user?.email || 'System Admin',
        is_used: false
    }]).select().single();

    if (error) {
      alert("Error generating key.");
      console.error(error);
      return;
    }

    setKeys([data, ...keys]);
    setNewlyGeneratedKey(uniqueCode);
  };

  const closeKeyModal = () => {
    setIsKeyModalOpen(false);
    setNewlyGeneratedKey(null);
    setNewKeyAssignee('');
  };

  const getExpiryStatus = (dateString: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    const expiryDate = new Date(dateString);
    const diffDays = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: 'EXPIRED', color: 'bg-red-100 text-red-800 border-red-200', icon: <ShieldX className="w-4 h-4 mr-1" /> };
    if (diffDays <= 30) return { label: 'EXPIRING SOON', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: <ShieldAlert className="w-4 h-4 mr-1" /> };
    return { label: 'VALID', color: 'bg-green-100 text-green-800 border-green-200', icon: <ShieldCheck className="w-4 h-4 mr-1" /> };
  };

  const filteredGuards = guards.filter(g => g.guard_name.toLowerCase().includes(searchQuery.toLowerCase()) || g.lesp_number.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredKeys = keys.filter(k => k.assigned_to.toLowerCase().includes(searchQuery.toLowerCase()) || k.access_key.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredInspectors = inspectors.filter(i => i.full_name.toLowerCase().includes(searchQuery.toLowerCase()));

  if (authLoading) return <div className="p-8 text-center font-bold text-gray-500">Verifying Security Clearance...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Personnel & Provisioning</h1>
          <p className="text-gray-600 mt-1">Manage human resources and provision inspector mobile devices.</p>
        </div>
        
        <div className="flex items-center gap-4">
          {activeTab === 'guards' && (
            isSuperadmin ? (
              <button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center shadow-sm">
                <Plus className="w-5 h-5 mr-2" /> Register Guard
              </button>
            ) : (
              <button disabled className="bg-gray-200 text-gray-500 px-4 py-2 rounded-lg font-medium flex items-center cursor-not-allowed border border-gray-300">
                <Lock className="w-4 h-4 mr-2" /> HR Access Required
              </button>
            )
          )}

          {activeTab === 'inspectors' && (
            isSuperadmin ? (
              <button onClick={() => setIsAddInspectorModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium flex items-center shadow-sm">
                <User className="w-5 h-5 mr-2" /> Register Inspector
              </button>
            ) : (
              <button disabled className="bg-gray-200 text-gray-500 px-4 py-2 rounded-lg font-medium flex items-center cursor-not-allowed border border-gray-300">
                <Lock className="w-4 h-4 mr-2" /> HR Access Required
              </button>
            )
          )}

          {activeTab === 'keys' && (
            isSuperadmin ? (
              <button onClick={() => setIsKeyModalOpen(true)} className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-medium flex items-center shadow-sm">
                <KeyRound className="w-5 h-5 mr-2" /> Generate Access Key
              </button>
            ) : (
              <button disabled className="bg-gray-200 text-gray-500 px-4 py-2 rounded-lg font-medium flex items-center cursor-not-allowed border border-gray-300">
                <Lock className="w-4 h-4 mr-2" /> Provisioning Restricted
              </button>
            )
          )}
        </div>
      </div>

      {/* 3-TIER TABS */}
      <div className="flex space-x-6 border-b border-gray-200 overflow-x-auto">
        <button 
          onClick={() => { setActiveTab('guards'); setSearchQuery(''); }}
          className={`pb-3 font-bold transition-colors whitespace-nowrap ${activeTab === 'guards' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}
        >
          Security Guards Database
        </button>
        <button 
          onClick={() => { setActiveTab('inspectors'); setSearchQuery(''); }}
          className={`pb-3 font-bold transition-colors whitespace-nowrap ${activeTab === 'inspectors' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-800'}`}
        >
          Roving Inspectors Team
        </button>
        <button 
          onClick={() => { setActiveTab('keys'); setSearchQuery(''); }}
          className={`pb-3 font-bold transition-colors whitespace-nowrap ${activeTab === 'keys' ? 'border-b-2 border-gray-900 text-gray-900' : 'text-gray-500 hover:text-gray-800'}`}
        >
          Device Provisioning
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center">
        <Search className="w-5 h-5 text-gray-400 mr-3" />
        <input 
          type="text" 
          placeholder={
            activeTab === 'guards' ? "Search by guard name or LESP..." : 
            activeTab === 'inspectors' ? "Search by inspector name..." : 
            "Search by inspector name or access key..."
          } 
          className="flex-1 outline-none text-gray-900 placeholder-gray-400 bg-white"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {activeTab === 'guards' && (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                <th className="p-4 font-semibold">Guard Name</th>
                <th className="p-4 font-semibold">LESP Number</th>
                <th className="p-4 font-semibold">Expiration Date</th>
                <th className="p-4 font-semibold">Assigned Branch</th>
                <th className="p-4 font-semibold">License Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500">Loading HR database...</td></tr>
              ) : filteredGuards.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500">No guard records found.</td></tr>
              ) : (
                filteredGuards.map((guard) => {
                  const status = getExpiryStatus(guard.lesp_expiry_date);
                  return (
                    <tr key={guard.id} className="hover:bg-gray-50">
                      <td className="p-4 font-bold text-gray-900">{guard.guard_name}</td>
                      <td className="p-4 font-mono text-sm text-gray-600">{guard.lesp_number}</td>
                      <td className="p-4 font-medium text-gray-800">{new Date(guard.lesp_expiry_date).toLocaleDateString()}</td>
                      <td className="p-4 text-sm font-medium text-gray-800">{guard.assigned_branch || 'Floating'}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${status.color}`}>
                          {status.icon} {status.label}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {isSuperadmin ? (
                          <button onClick={() => { setGuardToAssign(guard); setSelectedBranch(guard.assigned_branch || 'UNASSIGNED'); setIsAssignModalOpen(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded" title="Deploy to Detachment">
                            <MapPin className="w-5 h-5" />
                          </button>
                        ) : (
                          <button disabled className="p-2 text-gray-300 cursor-not-allowed"><Lock className="w-4 h-4" /></button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}

        {/* NEW: INSPECTORS TABLE */}
        {activeTab === 'inspectors' && (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                <th className="p-4 font-semibold">Inspector Name</th>
                <th className="p-4 font-semibold">Contact Number</th>
                <th className="p-4 font-semibold">Joined Date</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-500">Loading Inspectors database...</td></tr>
              ) : filteredInspectors.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-500">No inspectors found.</td></tr>
              ) : (
                filteredInspectors.map((inspector) => (
                  <tr key={inspector.id} className={`transition-colors ${!inspector.is_active && 'bg-gray-50 opacity-60'}`}>
                    <td className="p-4 font-bold text-gray-900 flex items-center">
                      <Briefcase className="w-4 h-4 mr-2 text-indigo-500" />
                      {inspector.full_name}
                    </td>
                    <td className="p-4 text-sm font-medium text-gray-800">{inspector.contact_number || 'N/A'}</td>
                    <td className="p-4 text-sm text-gray-600">{new Date(inspector.created_at).toLocaleDateString()}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${inspector.is_active ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}`}>
                        {inspector.is_active ? 'ACTIVE' : 'DEACTIVATED'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {isSuperadmin ? (
                        <button 
                          onClick={() => toggleInspectorStatus(inspector.id, inspector.is_active)}
                          className={`p-2 rounded transition-colors ${inspector.is_active ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`} 
                          title={inspector.is_active ? "Deactivate Inspector" : "Reactivate Inspector"}
                        >
                          {inspector.is_active ? <PowerOff className="w-5 h-5" /> : <Power className="w-5 h-5" />}
                        </button>
                      ) : (
                        <button disabled className="p-2 text-gray-300 cursor-not-allowed"><Lock className="w-4 h-4" /></button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {activeTab === 'keys' && (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                <th className="p-4 font-semibold">Access Key</th>
                <th className="p-4 font-semibold">Assigned Inspector</th>
                <th className="p-4 font-semibold">Generated By</th>
                <th className="p-4 font-semibold">Generated On</th>
                <th className="p-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-500">Loading provisioning database...</td></tr>
              ) : filteredKeys.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-500">No access keys generated yet.</td></tr>
              ) : (
                filteredKeys.map((key) => (
                  <tr key={key.id} className="hover:bg-gray-50">
                    <td className="p-4 font-mono font-bold text-gray-900">{key.access_key}</td>
                    <td className="p-4 font-medium text-gray-900">{key.assigned_to}</td>
                    <td className="p-4 text-sm text-gray-500">{key.created_by}</td>
                    <td className="p-4 text-sm text-gray-600">{new Date(key.created_at).toLocaleString()}</td>
                    <td className="p-4">
                      {key.is_used ? (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                          USED
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                          PENDING
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* === MODALS === */}
      {isAssignModalOpen && guardToAssign && isSuperadmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="bg-gray-900 p-4 flex justify-between items-center text-white shrink-0">
              <h3 className="font-bold flex items-center gap-2"><MapPin className="w-5 h-5" /> Deploy Guard</h3>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleAssignBranch} className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Target Personnel:</p>
                <p className="font-bold text-gray-900 text-lg">{guardToAssign.guard_name}</p>
                <p className="text-xs font-mono text-gray-400">LESP: {guardToAssign.lesp_number}</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Assign Detachment</label>
                <select className="w-full border border-gray-300 p-2 rounded outline-none text-gray-900 bg-white" value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)}>
                  <option value="UNASSIGNED">-- Floating / Unassigned --</option>
                  {branchOptions.map((b, i) => <option key={i} value={b.branch_name}>{b.branch_name}</option>)}
                </select>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 shadow-sm mt-4">Confirm Deployment</button>
            </form>
          </div>
        </div>
      )}

      {isAddModalOpen && isSuperadmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="bg-gray-900 p-4 flex justify-between items-center text-white shrink-0">
              <h3 className="font-bold flex items-center"><User className="w-5 h-5 mr-2" /> Register Security Guard</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleAddGuard} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Full Legal Name</label>
                <input required type="text" className="w-full border p-2 rounded outline-none text-gray-900 bg-white placeholder-gray-400" value={newGuard.guard_name} onChange={e => setNewGuard({...newGuard, guard_name: e.target.value})} placeholder="e.g. Dela Cruz, Juan" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">LESP License Number</label>
                <input required type="text" className="w-full border p-2 rounded font-mono outline-none text-gray-900 bg-white placeholder-gray-400" value={newGuard.lesp_number} onChange={e => setNewGuard({...newGuard, lesp_number: e.target.value})} placeholder="LESP-12345" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">LESP Expiry Date</label>
                <input required type="date" className="w-full border p-2 rounded outline-none text-gray-900 bg-white" value={newGuard.lesp_expiry_date} onChange={e => setNewGuard({...newGuard, lesp_expiry_date: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Initial Assignment</label>
                <select className="w-full border p-2 rounded outline-none text-gray-900 bg-white" value={newGuard.assigned_branch} onChange={(e) => setNewGuard({...newGuard, assigned_branch: e.target.value})}>
                  <option value="UNASSIGNED">-- Floating / Unassigned --</option>
                  {branchOptions.map((b, i) => <option key={i} value={b.branch_name}>{b.branch_name}</option>)}
                </select>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 mt-6">Save Guard Record</button>
            </form>
          </div>
        </div>
      )}

      {/* NEW: ADD INSPECTOR MODAL */}
      {isAddInspectorModalOpen && isSuperadmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="bg-gray-900 p-4 flex justify-between items-center text-white shrink-0">
              <h3 className="font-bold flex items-center"><User className="w-5 h-5 mr-2" /> Register Field Inspector</h3>
              <button onClick={() => setIsAddInspectorModalOpen(false)} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleAddInspector} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Full Legal Name</label>
                <input required type="text" className="w-full border p-2 rounded outline-none text-gray-900 bg-white placeholder-gray-400" value={newInspector.full_name} onChange={e => setNewInspector({...newInspector, full_name: e.target.value})} placeholder="e.g. Inspector Alpha" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Contact Number</label>
                <input required type="text" className="w-full border p-2 rounded outline-none text-gray-900 bg-white placeholder-gray-400" value={newInspector.contact_number} onChange={e => setNewInspector({...newInspector, contact_number: e.target.value})} placeholder="0917-123-4567" />
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 mt-6">Save Inspector Record</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: GENERATE ACCESS KEY */}
      {isKeyModalOpen && isSuperadmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="bg-gray-900 p-4 flex justify-between items-center text-white shrink-0">
              <h3 className="font-bold flex items-center">
                <Key className="w-5 h-5 mr-2" /> Device Provisioning
              </h3>
              <button onClick={closeKeyModal} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
            </div>
            
            <div className="p-6">
              {!newlyGeneratedKey ? (
                <form onSubmit={handleGenerateKey} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Inspector's Name</label>
                    <p className="text-xs text-gray-500 mb-2">Select the inspector you are generating this key for.</p>
                    <select 
                      required
                      className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-gray-900 outline-none text-gray-900 bg-white font-medium cursor-pointer" 
                      value={newKeyAssignee} 
                      onChange={e => setNewKeyAssignee(e.target.value)} 
                    >
                      <option value="" disabled>-- Select Inspector --</option>
                      {inspectors.map((ins, i) => (
                        <option key={i} value={ins.full_name}>{ins.full_name}</option>
                      ))}
                    </select>
                  </div>
                  <button type="submit" className="w-full bg-gray-900 text-white font-bold py-3 rounded-lg hover:bg-gray-800 transition-colors shadow-sm mt-4">
                    Generate Key
                  </button>
                </form>
              ) : (
                <div className="text-center space-y-4">
                  <div className="bg-green-50 text-green-800 p-3 rounded-lg border border-green-200 mb-4">
                    <p className="text-sm font-bold">Key Generated Successfully!</p>
                  </div>
                  <p className="text-sm text-gray-600">Provide this exact code to <strong>{newKeyAssignee}</strong>. It can only be used once.</p>
                  
                  <div className="bg-gray-100 p-6 rounded-xl border-2 border-dashed border-gray-300 relative group">
                    <p className="text-4xl font-mono font-black text-gray-900 tracking-widest">{newlyGeneratedKey}</p>
                    <button 
                      onClick={() => navigator.clipboard.writeText(newlyGeneratedKey)}
                      className="absolute top-2 right-2 p-2 text-gray-400 hover:text-gray-900 bg-white rounded-md shadow-sm border border-gray-200 transition-opacity"
                      title="Copy to Clipboard"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <button onClick={closeKeyModal} className="w-full bg-gray-200 text-gray-800 font-bold py-3 rounded-lg hover:bg-gray-300 transition-colors mt-4">
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}