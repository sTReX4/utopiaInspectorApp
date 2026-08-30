'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, ShieldCheck, ShieldAlert, ShieldX, User, Lock, MapPin, Key, KeyRound, Copy, Trash2, AlertTriangle, Power, PowerOff } from 'lucide-react';
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

  // --- 3-TIER TAB SYSTEM ---
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

  // --- INSPECTOR MODALS ---
  const [isAddInspectorModalOpen, setIsAddInspectorModalOpen] = useState(false);
  const [newInspector, setNewInspector] = useState({ full_name: '', contact_number: '' });

  // UPGRADED: Added 'key' to the allowed types
  const [entityToDelete, setEntityToDelete] = useState<{ id: string, name: string, type: 'guard' | 'inspector' | 'key' } | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

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

  // UPGRADED: Handles specific table routing for all 3 entities
  const handleDeleteEntity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperadmin || !entityToDelete || deleteConfirmText !== 'DELETE') return;

    let table = '';
    if (entityToDelete.type === 'guard') table = 'guards';
    else if (entityToDelete.type === 'inspector') table = 'inspectors';
    else if (entityToDelete.type === 'key') table = 'inspector_keys';

    const { error } = await supabase.from(table).delete().eq('id', entityToDelete.id);

    if (error) {
      alert(`Error deleting ${entityToDelete.type}. They may have historical records preventing deletion.`);
      console.error(error);
      return;
    }

    if (entityToDelete.type === 'guard') {
      setGuards(guards.filter(g => g.id !== entityToDelete.id));
    } else if (entityToDelete.type === 'inspector') {
      setInspectors(inspectors.filter(i => i.id !== entityToDelete.id));
      await supabase.from('inspector_keys').delete().eq('assigned_to', entityToDelete.name);
      setKeys(keys.filter(k => k.assigned_to !== entityToDelete.name));
    } else if (entityToDelete.type === 'key') {
      setKeys(keys.filter(k => k.id !== entityToDelete.id));
    }

    setEntityToDelete(null);
    setDeleteConfirmText('');
  };

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

    if (diffDays < 0) return { label: 'EXPIRED', color: 'bg-red-50 text-red-700 ring-1 ring-red-200/60', icon: <ShieldX className="w-3 h-3 mr-1" /> };
    if (diffDays <= 30) return { label: 'EXPIRING SOON', color: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60', icon: <ShieldAlert className="w-3 h-3 mr-1" /> };
    return { label: 'VALID', color: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60', icon: <ShieldCheck className="w-3 h-3 mr-1" /> };
  };

  const filteredGuards = guards.filter(g => g.guard_name.toLowerCase().includes(searchQuery.toLowerCase()) || g.lesp_number.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredKeys = keys.filter(k => k.assigned_to.toLowerCase().includes(searchQuery.toLowerCase()) || k.access_key.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredInspectors = inspectors.filter(i => i.full_name.toLowerCase().includes(searchQuery.toLowerCase()));

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
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Personnel & Provisioning</h1>
          <p className="text-subdued mt-1">Manage human resources and provision inspector mobile devices.</p>
        </div>
        
        <div className="flex items-center gap-4">
          {activeTab === 'guards' && (
            isSuperadmin ? (
              <button onClick={() => setIsAddModalOpen(true)} className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center transition-all shadow-sm ring-1 ring-slate-900/50">
                <Plus className="w-4 h-4 mr-2" /> Register Guard
              </button>
            ) : (
              <button disabled className="bg-white text-slate-400 px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center cursor-not-allowed border border-slate-200 shadow-sm">
                <Lock className="w-4 h-4 mr-2" /> HR Access Required
              </button>
            )
          )}

          {activeTab === 'inspectors' && (
            isSuperadmin ? (
              <button onClick={() => setIsAddInspectorModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center transition-all shadow-sm ring-1 ring-blue-700/50">
                <User className="w-4 h-4 mr-2" /> Register Inspector
              </button>
            ) : (
              <button disabled className="bg-white text-slate-400 px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center cursor-not-allowed border border-slate-200 shadow-sm">
                <Lock className="w-4 h-4 mr-2" /> HR Access Required
              </button>
            )
          )}

          {activeTab === 'keys' && (
            isSuperadmin ? (
              <button onClick={() => setIsKeyModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center transition-all shadow-sm ring-1 ring-indigo-700/50">
                <KeyRound className="w-4 h-4 mr-2" /> Generate Access Key
              </button>
            ) : (
              <button disabled className="bg-white text-slate-400 px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center cursor-not-allowed border border-slate-200 shadow-sm">
                <Lock className="w-4 h-4 mr-2" /> Provisioning Restricted
              </button>
            )
          )}
        </div>
      </div>

      {/* 3-TIER TABS */}
      <div className="flex space-x-8 border-b border-slate-200">
        <button 
          onClick={() => { setActiveTab('guards'); setSearchQuery(''); }}
          className={`pb-3 text-sm font-semibold transition-colors whitespace-nowrap ${activeTab === 'guards' ? 'border-b-2 border-slate-900 text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}
        >
          Security Guards Database
        </button>
        <button 
          onClick={() => { setActiveTab('inspectors'); setSearchQuery(''); }}
          className={`pb-3 text-sm font-semibold transition-colors whitespace-nowrap ${activeTab === 'inspectors' ? 'border-b-2 border-slate-900 text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}
        >
          Roving Inspectors Team
        </button>
        <button 
          onClick={() => { setActiveTab('keys'); setSearchQuery(''); }}
          className={`pb-3 text-sm font-semibold transition-colors whitespace-nowrap ${activeTab === 'keys' ? 'border-b-2 border-slate-900 text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}
        >
          Device Provisioning
        </button>
      </div>

      {/* Search Bar */}
      <div className="enterprise-card p-3 flex items-center">
        <Search className="w-4 h-4 text-slate-400 mr-3 ml-2" />
        <input 
          type="text" 
          placeholder={
            activeTab === 'guards' ? "Search by guard name or LESP..." : 
            activeTab === 'inspectors' ? "Search by inspector name..." : 
            "Search by inspector name or access key..."
          } 
          className="flex-1 outline-none text-sm font-medium text-slate-900 bg-transparent placeholder-slate-400"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Main Table Area */}
      <div className="enterprise-card overflow-hidden">
        {activeTab === 'guards' && (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-widest text-slate-500">
                <th className="p-4 font-bold">Guard Name</th>
                <th className="p-4 font-bold">LESP Number</th>
                <th className="p-4 font-bold">Expiration Date</th>
                <th className="p-4 font-bold">Assigned Branch</th>
                <th className="p-4 font-bold">License Status</th>
                <th className="p-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={6} className="p-12 text-center text-slate-400 text-sm font-medium">Loading HR database...</td></tr>
              ) : filteredGuards.length === 0 ? (
                <tr><td colSpan={6} className="p-12 text-center text-slate-400 text-sm font-medium">No guard records found.</td></tr>
              ) : (
                filteredGuards.map((guard) => {
                  const status = getExpiryStatus(guard.lesp_expiry_date);
                  return (
                    <tr key={guard.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 text-sm font-bold text-slate-900">{guard.guard_name}</td>
                      <td className="p-4 text-sm font-mono font-medium text-slate-500">{guard.lesp_number}</td>
                      <td className="p-4 text-sm font-medium text-slate-700">{new Date(guard.lesp_expiry_date).toLocaleDateString()}</td>
                      <td className="p-4 text-sm font-medium text-slate-700">{guard.assigned_branch || 'Floating'}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${status.color}`}>
                          {status.icon} {status.label}
                        </span>
                      </td>
                      <td className="p-4 text-right flex justify-end space-x-1">
                        {isSuperadmin ? (
                          <>
                            <button onClick={() => { setGuardToAssign(guard); setSelectedBranch(guard.assigned_branch || 'UNASSIGNED'); setIsAssignModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Deploy to Detachment">
                              <MapPin className="w-4 h-4" />
                            </button>
                            <button onClick={() => { setEntityToDelete({ id: guard.id, name: guard.guard_name, type: 'guard' }); setDeleteConfirmText(''); }} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete Guard">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <button disabled className="p-1.5 text-slate-300 cursor-not-allowed"><Lock className="w-4 h-4" /></button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}

        {activeTab === 'inspectors' && (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-widest text-slate-500">
                <th className="p-4 font-bold">Inspector Name</th>
                <th className="p-4 font-bold">Contact Number</th>
                <th className="p-4 font-bold">Joined Date</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={5} className="p-12 text-center text-slate-400 text-sm font-medium">Loading Inspectors database...</td></tr>
              ) : filteredInspectors.length === 0 ? (
                <tr><td colSpan={5} className="p-12 text-center text-slate-400 text-sm font-medium">No inspectors found.</td></tr>
              ) : (
                filteredInspectors.map((inspector) => (
                  <tr key={inspector.id} className={`transition-colors hover:bg-slate-50/50 ${!inspector.is_active && 'bg-slate-50/50 opacity-60'}`}>
                    <td className="p-4 text-sm font-bold text-slate-900">
                      {inspector.full_name}
                    </td>
                    <td className="p-4 text-sm font-mono font-medium text-slate-500">{inspector.contact_number || 'N/A'}</td>
                    <td className="p-4 text-sm font-medium text-slate-700">{new Date(inspector.created_at).toLocaleDateString()}</td>
                    <td className="p-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${inspector.is_active ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60' : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200/60'}`}>
                        {inspector.is_active ? 'ACTIVE' : 'DEACTIVATED'}
                      </span>
                    </td>
                    <td className="p-4 text-right flex justify-end space-x-1">
                      {isSuperadmin ? (
                        <>
                          <button 
                            onClick={() => toggleInspectorStatus(inspector.id, inspector.is_active)}
                            className={`p-1.5 rounded-md transition-colors ${inspector.is_active ? 'text-slate-400 hover:text-red-600 hover:bg-red-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`} 
                            title={inspector.is_active ? "Deactivate Inspector" : "Reactivate Inspector"}
                          >
                            {inspector.is_active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                          </button>
                          <button 
                            onClick={() => { setEntityToDelete({ id: inspector.id, name: inspector.full_name, type: 'inspector' }); setDeleteConfirmText(''); }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" 
                            title="Delete Inspector"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <button disabled className="p-1.5 text-slate-300 cursor-not-allowed"><Lock className="w-4 h-4" /></button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {/* UPGRADED KEYS TABLE: Added Action Column for manual deletion */}
        {activeTab === 'keys' && (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-widest text-slate-500">
                <th className="p-4 font-bold">Access Key</th>
                <th className="p-4 font-bold">Assigned Inspector</th>
                <th className="p-4 font-bold">Generated By</th>
                <th className="p-4 font-bold">Generated On</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={6} className="p-12 text-center text-slate-400 text-sm font-medium">Loading provisioning database...</td></tr>
              ) : filteredKeys.length === 0 ? (
                <tr><td colSpan={6} className="p-12 text-center text-slate-400 text-sm font-medium">No access keys generated yet.</td></tr>
              ) : (
                filteredKeys.map((key) => (
                  <tr key={key.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 text-sm font-mono font-bold text-slate-900">{key.access_key}</td>
                    <td className="p-4 text-sm font-bold text-slate-900">{key.assigned_to}</td>
                    <td className="p-4 text-sm font-medium text-slate-500">{key.created_by}</td>
                    <td className="p-4 text-sm font-medium text-slate-600">{new Date(key.created_at).toLocaleString()}</td>
                    <td className="p-4">
                      {key.is_used ? (
                        <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 ring-1 ring-slate-200/60">
                          USED
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 ring-1 ring-blue-200/60">
                          PENDING
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right flex justify-end space-x-1">
                      {isSuperadmin ? (
                        <button 
                          onClick={() => { setEntityToDelete({ id: key.id, name: `Access Key ${key.access_key}`, type: 'key' }); setDeleteConfirmText(''); }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" 
                          title="Delete Key"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <button disabled className="p-1.5 text-slate-300 cursor-not-allowed"><Lock className="w-4 h-4" /></button>
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
      
      {/* Deploy Guard Modal */}
      {isAssignModalOpen && guardToAssign && isSuperadmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col ring-1 ring-slate-200">
            <div className="bg-white border-b border-slate-200 p-5 flex justify-between items-center shrink-0">
              <h3 className="text-base font-semibold text-slate-900 tracking-tight flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" /> Deploy Guard
              </h3>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleAssignBranch} className="p-6 space-y-5 bg-slate-50/50">
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Target Personnel</p>
                <p className="font-semibold text-slate-900 text-sm">{guardToAssign.guard_name}</p>
                <p className="text-[11px] font-mono text-slate-500 mt-0.5">LESP: {guardToAssign.lesp_number}</p>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Assign Detachment</label>
                <select 
                  className="w-full border border-slate-200 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500/40 outline-none text-sm font-medium text-slate-900 bg-white cursor-pointer shadow-sm"
                  value={selectedBranch} 
                  onChange={(e) => setSelectedBranch(e.target.value)}
                >
                  <option value="UNASSIGNED">-- Floating / Unassigned --</option>
                  {branchOptions.map((b, i) => <option key={i} value={b.branch_name}>{b.branch_name}</option>)}
                </select>
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full bg-slate-900 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-slate-800 transition-all shadow-sm ring-1 ring-slate-900/50">
                  Confirm Deployment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Register Guard Modal */}
      {isAddModalOpen && isSuperadmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col ring-1 ring-slate-200">
            <div className="bg-white border-b border-slate-200 p-5 flex justify-between items-center shrink-0">
              <h3 className="text-base font-semibold text-slate-900 tracking-tight flex items-center">
                <User className="w-4 h-4 mr-2 text-slate-500" /> Register Security Guard
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleAddGuard} className="p-6 space-y-4 bg-slate-50/50">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Full Legal Name</label>
                <input required type="text" className="w-full border border-slate-200 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500/40 outline-none bg-white text-sm font-medium text-slate-900 shadow-sm" value={newGuard.guard_name} onChange={e => setNewGuard({...newGuard, guard_name: e.target.value})} placeholder="e.g. Dela Cruz, Juan" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">LESP License Number</label>
                <input required type="text" className="w-full border border-slate-200 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500/40 outline-none bg-white text-sm font-mono font-medium text-slate-900 shadow-sm" value={newGuard.lesp_number} onChange={e => setNewGuard({...newGuard, lesp_number: e.target.value})} placeholder="LESP-12345" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">LESP Expiry Date</label>
                <input required type="date" className="w-full border border-slate-200 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500/40 outline-none bg-white text-sm font-medium text-slate-900 shadow-sm" value={newGuard.lesp_expiry_date} onChange={e => setNewGuard({...newGuard, lesp_expiry_date: e.target.value})} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Initial Assignment</label>
                <select className="w-full border border-slate-200 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500/40 outline-none bg-white text-sm font-medium text-slate-900 shadow-sm cursor-pointer" value={newGuard.assigned_branch} onChange={(e) => setNewGuard({...newGuard, assigned_branch: e.target.value})}>
                  <option value="UNASSIGNED">-- Floating / Unassigned --</option>
                  {branchOptions.map((b, i) => <option key={i} value={b.branch_name}>{b.branch_name}</option>)}
                </select>
              </div>
              <div className="pt-3">
                <button type="submit" className="w-full bg-slate-900 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-slate-800 transition-all shadow-sm ring-1 ring-slate-900/50">Save Guard Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Register Inspector Modal */}
      {isAddInspectorModalOpen && isSuperadmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col ring-1 ring-slate-200">
            <div className="bg-white border-b border-slate-200 p-5 flex justify-between items-center shrink-0">
              <h3 className="text-base font-semibold text-slate-900 tracking-tight flex items-center">
                <User className="w-4 h-4 mr-2 text-slate-500" /> Register Field Inspector
              </h3>
              <button onClick={() => setIsAddInspectorModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleAddInspector} className="p-6 space-y-4 bg-slate-50/50">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Full Legal Name</label>
                <input required type="text" className="w-full border border-slate-200 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500/40 outline-none bg-white text-sm font-medium text-slate-900 shadow-sm" value={newInspector.full_name} onChange={e => setNewInspector({...newInspector, full_name: e.target.value})} placeholder="e.g. Inspector Alpha" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Contact Number</label>
                <input required type="text" className="w-full border border-slate-200 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500/40 outline-none bg-white text-sm font-mono font-medium text-slate-900 shadow-sm" value={newInspector.contact_number} onChange={e => setNewInspector({...newInspector, contact_number: e.target.value})} placeholder="0917-123-4567" />
              </div>
              <div className="pt-3">
                <button type="submit" className="w-full bg-blue-600 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-blue-700 transition-all shadow-sm ring-1 ring-blue-700/50">Save Inspector Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generate Access Key Modal */}
      {isKeyModalOpen && isSuperadmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col ring-1 ring-slate-200">
            <div className="bg-white border-b border-slate-200 p-5 flex justify-between items-center shrink-0">
              <h3 className="text-base font-semibold text-slate-900 tracking-tight flex items-center">
                <Key className="w-4 h-4 mr-2 text-indigo-600" /> Device Provisioning
              </h3>
              <button onClick={closeKeyModal} className="text-slate-400 hover:text-slate-700 transition-colors text-2xl leading-none">&times;</button>
            </div>
            
            <div className="p-6 bg-slate-50/50">
              {!newlyGeneratedKey ? (
                <form onSubmit={handleGenerateKey} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Inspector's Name</label>
                    <p className="text-[11px] text-slate-400 mb-3">Select the inspector you are generating this key for.</p>
                    <select 
                      required
                      className="w-full border border-slate-200 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500/40 outline-none text-sm font-medium text-slate-900 bg-white cursor-pointer shadow-sm" 
                      value={newKeyAssignee} 
                      onChange={e => setNewKeyAssignee(e.target.value)} 
                    >
                      <option value="" disabled>-- Select Inspector --</option>
                      {inspectors.map((ins, i) => (
                        <option key={i} value={ins.full_name}>{ins.full_name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="pt-3">
                    <button type="submit" className="w-full bg-slate-900 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-slate-800 transition-all shadow-sm ring-1 ring-slate-900/50">
                      Generate Key
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-center space-y-5">
                  <div className="bg-emerald-50 text-emerald-800 p-3.5 rounded-lg border border-emerald-200 shadow-sm">
                    <p className="text-sm font-semibold">Key Generated Successfully!</p>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">Provide this exact code to <strong className="text-slate-900">{newKeyAssignee}</strong>. It can only be used once.</p>
                  
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative group">
                    <p className="text-3xl font-mono font-black text-slate-900 tracking-widest">{newlyGeneratedKey}</p>
                    <button 
                      onClick={() => navigator.clipboard.writeText(newlyGeneratedKey)}
                      className="absolute top-2 right-2 p-2 text-slate-400 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 rounded-md transition-colors"
                      title="Copy to Clipboard"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="pt-2">
                    <button onClick={closeKeyModal} className="w-full bg-white border border-slate-200 text-slate-700 text-sm font-semibold py-2.5 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Entity Modal */}
      {entityToDelete && isSuperadmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col ring-1 ring-slate-200">
            <div className="bg-white border-b border-red-100 p-5 flex justify-between items-center shrink-0">
              <h3 className="text-base font-semibold text-red-600 tracking-tight flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2" /> Danger: Permanent Deletion
              </h3>
              <button onClick={() => { setEntityToDelete(null); setDeleteConfirmText(''); }} className="text-slate-400 hover:text-slate-700 transition-colors text-2xl leading-none">&times;</button>
            </div>
            
            <form onSubmit={handleDeleteEntity} className="p-6 space-y-5 bg-slate-50/50">
              <p className="text-slate-600 text-sm leading-relaxed">
                You are about to permanently delete <strong className="text-slate-900">{entityToDelete.name}</strong>. This action cannot be undone and will permanently remove their records.
              </p>
              
              <div className="bg-red-50/50 border border-red-100 p-3.5 rounded-lg text-xs text-red-800 shadow-sm font-medium">
                Type <strong className="font-bold">DELETE</strong> below to confirm your action.
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
                <button type="button" onClick={() => { setEntityToDelete(null); setDeleteConfirmText(''); }} className="flex-1 bg-white border border-slate-200 text-slate-700 text-sm font-semibold py-2.5 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
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