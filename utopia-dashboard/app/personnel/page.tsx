'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, ShieldCheck, ShieldAlert, ShieldX, User, Lock, MapPin, Key, KeyRound, Copy, Trash2, AlertTriangle, Power, PowerOff, X, Edit, Briefcase } from 'lucide-react';
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
  detachments?: { branch_name: string }[];
}

interface BranchOption {
  id: string;
  branch_name: string;
  assigned_inspector_id: string | null;
  inspector?: { full_name: string } | null;
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
  const [branchOptions, setBranchOptions] = useState<BranchOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // --- GUARD MODALS ---
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newGuard, setNewGuard] = useState({ guard_name: '', lesp_number: '', lesp_expiry_date: '', assigned_branch: '' });
  
  const [isEditGuardModalOpen, setIsEditGuardModalOpen] = useState(false);
  const [editGuardData, setEditGuardData] = useState<Guard | null>(null);

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

  const [isEditInspectorModalOpen, setIsEditInspectorModalOpen] = useState(false);
  const [editInspectorData, setEditInspectorData] = useState<Inspector | null>(null);

  const [isAssignInspectorModalOpen, setIsAssignInspectorModalOpen] = useState(false);
  const [inspectorToAssign, setInspectorToAssign] = useState<Inspector | null>(null);
  const [selectedDetachments, setSelectedDetachments] = useState<BranchOption[]>([]);
  const [detachmentSearch, setDetachmentSearch] = useState('');

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
    const { data } = await supabase
      .from('detachments')
      .select('id, branch_name, assigned_inspector_id, inspector:inspectors(full_name)')
      .order('branch_name');
    if (data) setBranchOptions(data);
  };

  const fetchKeys = async () => {
    const { data } = await supabase.from('inspector_keys').select('*').order('created_at', { ascending: false });
    if (data) setKeys(data);
  };

  const fetchInspectors = async () => {
    const { data } = await supabase
      .from('inspectors')
      .select('*, detachments(branch_name)')
      .order('full_name', { ascending: true });
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

  const handleUpdateGuard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperadmin || !editGuardData) return;

    const { error } = await supabase
      .from('guards')
      .update({
        guard_name: editGuardData.guard_name,
        lesp_number: editGuardData.lesp_number,
        lesp_expiry_date: editGuardData.lesp_expiry_date,
      })
      .eq('id', editGuardData.id);

    if (error) {
      alert("Error updating guard information.");
      console.error(error);
      return;
    }

    setGuards(guards.map(g => g.id === editGuardData.id ? { ...g, ...editGuardData } : g));
    setIsEditGuardModalOpen(false);
    setEditGuardData(null);
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

  // --- INSPECTOR LOGIC ---
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

  const handleUpdateInspector = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperadmin || !editInspectorData) return;

    const { error } = await supabase
      .from('inspectors')
      .update({
        full_name: editInspectorData.full_name,
        contact_number: editInspectorData.contact_number,
      })
      .eq('id', editInspectorData.id);

    if (error) {
      alert("Error updating inspector information.");
      console.error(error);
      return;
    }

    setInspectors(inspectors.map(i => i.id === editInspectorData.id ? { ...i, ...editInspectorData } : i));
    setIsEditInspectorModalOpen(false);
    setEditInspectorData(null);
  };

  const toggleInspectorStatus = async (id: string, currentStatus: boolean) => {
    if (!isSuperadmin) return;
    const { error } = await supabase.from('inspectors').update({ is_active: !currentStatus }).eq('id', id);
    if (!error) {
      setInspectors(inspectors.map(ins => ins.id === id ? { ...ins, is_active: !currentStatus } : ins));
    }
  };

  const handleAddDetachmentToSelection = (branch: BranchOption) => {
    if (selectedDetachments.find(b => b.id === branch.id)) return;

    if (branch.assigned_inspector_id && branch.assigned_inspector_id !== inspectorToAssign?.id) {
        const confirmed = window.confirm(`WARNING: "${branch.branch_name}" is currently monitored by "${branch.inspector?.full_name}".\n\nDo you want to reassign this detachment to "${inspectorToAssign?.full_name}"?`);
        if (!confirmed) return;
    }

    setSelectedDetachments([...selectedDetachments, branch]);
    setDetachmentSearch('');
  };

  const handleRemoveDetachmentFromSelection = (branchId: string) => {
    setSelectedDetachments(selectedDetachments.filter(b => b.id !== branchId));
  };

  const handleAssignInspectorToDetachments = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperadmin || !inspectorToAssign) return;

    const originalBranches = branchOptions.filter(b => b.assigned_inspector_id === inspectorToAssign.id);
    const originalBranchIds = originalBranches.map(b => b.id);
    const newBranchIds = selectedDetachments.map(b => b.id);

    const branchesToAdd = selectedDetachments.filter(b => !originalBranchIds.includes(b.id));
    const branchesToRemove = originalBranches.filter(b => !newBranchIds.includes(b.id));

    for (const b of branchesToAdd) {
        await supabase.from('detachments').update({ assigned_inspector_id: inspectorToAssign.id }).eq('id', b.id);
    }
    for (const b of branchesToRemove) {
        await supabase.from('detachments').update({ assigned_inspector_id: null }).eq('id', b.id);
    }

    const updatedBranchOptions = branchOptions.map(b => {
        if (branchesToAdd.some(add => add.id === b.id)) return { ...b, assigned_inspector_id: inspectorToAssign.id, inspector: { full_name: inspectorToAssign.full_name } };
        if (branchesToRemove.some(rem => rem.id === b.id)) return { ...b, assigned_inspector_id: null, inspector: null };
        return b;
    });
    setBranchOptions(updatedBranchOptions);

    const updatedInspectors = inspectors.map(ins => {
        if (ins.id === inspectorToAssign.id) {
            return {
                ...ins,
                detachments: selectedDetachments.map(d => ({ branch_name: d.branch_name }))
            };
        }
        if (branchesToAdd.length > 0) {
            return {
                ...ins,
                detachments: ins.detachments?.filter(d => !branchesToAdd.some(add => add.branch_name === d.branch_name))
            };
        }
        return ins;
    });
    setInspectors(updatedInspectors);
    setIsAssignInspectorModalOpen(false);
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

  const getExpiryStatus = (dateString: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    const expiryDate = new Date(dateString);
    const diffDays = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: 'EXPIRED', color: 'border-red-300 bg-red-50 text-red-700', icon: '✕' };
    if (diffDays <= 30) return { label: 'EXPIRING SOON', color: 'border-amber-300 bg-amber-50 text-amber-700', icon: '⚠' };
    return { label: 'VALID', color: 'border-slate-300 bg-white text-slate-900', icon: '✓' };
  };

  const filteredGuards = guards.filter(g => g.guard_name.toLowerCase().includes(searchQuery.toLowerCase()) || g.lesp_number.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredKeys = keys.filter(k => k.assigned_to.toLowerCase().includes(searchQuery.toLowerCase()) || k.access_key.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredInspectors = inspectors.filter(i => i.full_name.toLowerCase().includes(searchQuery.toLowerCase()));

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
          <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">Personnel & Provisioning</h1>
          <p className="text-sm text-slate-500 mt-1">Manage human resources and provision inspector mobile devices.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {activeTab === 'guards' && (
            isSuperadmin ? (
              <button onClick={() => setIsAddModalOpen(true)} className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-none text-xs font-bold uppercase tracking-widest flex items-center transition-none">
                <Plus className="w-4 h-4 mr-2" /> Register Guard
              </button>
            ) : (
              <button disabled className="bg-slate-100 text-slate-400 px-5 py-2.5 rounded-none text-xs font-bold uppercase tracking-widest flex items-center cursor-not-allowed border border-slate-200">
                <Lock className="w-4 h-4 mr-2" /> HR Access Required
              </button>
            )
          )}

          {activeTab === 'inspectors' && (
            isSuperadmin ? (
              <button onClick={() => setIsAddInspectorModalOpen(true)} className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-none text-xs font-bold uppercase tracking-widest flex items-center transition-none">
                <User className="w-4 h-4 mr-2" /> Register Inspector
              </button>
            ) : (
              <button disabled className="bg-slate-100 text-slate-400 px-5 py-2.5 rounded-none text-xs font-bold uppercase tracking-widest flex items-center cursor-not-allowed border border-slate-200">
                <Lock className="w-4 h-4 mr-2" /> HR Access Required
              </button>
            )
          )}

          {activeTab === 'keys' && (
            isSuperadmin ? (
              <button onClick={() => setIsKeyModalOpen(true)} className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-none text-xs font-bold uppercase tracking-widest flex items-center transition-none">
                <KeyRound className="w-4 h-4 mr-2" /> Generate Access Key
              </button>
            ) : (
              <button disabled className="bg-slate-100 text-slate-400 px-5 py-2.5 rounded-none text-xs font-bold uppercase tracking-widest flex items-center cursor-not-allowed border border-slate-200">
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
          className={`pb-3 text-xs font-bold uppercase tracking-widest transition-none whitespace-nowrap ${activeTab === 'guards' ? 'border-b-2 border-slate-900 text-slate-900' : 'text-slate-500 hover:text-slate-900 border-b-2 border-transparent'}`}
        >
          Security Guards
        </button>
        <button 
          onClick={() => { setActiveTab('inspectors'); setSearchQuery(''); }}
          className={`pb-3 text-xs font-bold uppercase tracking-widest transition-none whitespace-nowrap ${activeTab === 'inspectors' ? 'border-b-2 border-slate-900 text-slate-900' : 'text-slate-500 hover:text-slate-900 border-b-2 border-transparent'}`}
        >
          Roving Inspectors
        </button>
        <button 
          onClick={() => { setActiveTab('keys'); setSearchQuery(''); }}
          className={`pb-3 text-xs font-bold uppercase tracking-widest transition-none whitespace-nowrap ${activeTab === 'keys' ? 'border-b-2 border-slate-900 text-slate-900' : 'text-slate-500 hover:text-slate-900 border-b-2 border-transparent'}`}
        >
          Device Provisioning
        </button>
      </div>

      {/* Search Bar */}
      <div className="border border-slate-200 bg-white p-3 flex items-center">
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
      <div className="border border-slate-200 bg-white overflow-hidden">
        {activeTab === 'guards' && (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-mono uppercase tracking-widest text-slate-500">
                <th className="p-4 font-bold border-r border-slate-100">Guard Name</th>
                <th className="p-4 font-bold border-r border-slate-100">LESP Number</th>
                <th className="p-4 font-bold border-r border-slate-100">Expiration Date</th>
                <th className="p-4 font-bold border-r border-slate-100">Assigned Branch</th>
                <th className="p-4 font-bold border-r border-slate-100">License Status</th>
                <th className="p-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                <tr><td colSpan={6} className="p-12 text-center text-slate-500 text-xs font-mono uppercase tracking-widest">Loading HR database...</td></tr>
              ) : filteredGuards.length === 0 ? (
                <tr><td colSpan={6} className="p-12 text-center text-slate-500 text-xs font-mono uppercase tracking-widest">No guard records found.</td></tr>
              ) : (
                filteredGuards.map((guard) => {
                  const status = getExpiryStatus(guard.lesp_expiry_date);
                  return (
                    <tr key={guard.id} className={`hover:bg-slate-50 transition-none ${!guard.is_active && 'opacity-50'}`}>
                      <td className="p-4 text-sm font-bold text-slate-900 border-r border-slate-100 uppercase">{guard.guard_name}</td>
                      <td className="p-4 text-xs font-mono text-slate-600 border-r border-slate-100">{guard.lesp_number}</td>
                      <td className="p-4 text-xs font-mono text-slate-900 border-r border-slate-100">{new Date(guard.lesp_expiry_date).toLocaleDateString()}</td>
                      <td className="p-4 text-sm font-bold text-slate-900 border-r border-slate-100">{guard.assigned_branch || 'Floating'}</td>
                      <td className="p-4 border-r border-slate-100">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-none text-[10px] font-mono font-bold uppercase tracking-widest border ${status.color}`}>
                          {status.icon} {status.label}
                        </span>
                      </td>
                      <td className="p-4 text-right flex justify-end space-x-2">
                        {isSuperadmin ? (
                          <>
                            <button 
                              onClick={() => { setEditGuardData(guard); setIsEditGuardModalOpen(true); }}
                              className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-200 rounded-none transition-none"
                              title="Edit Guard Details"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => { setGuardToAssign(guard); setSelectedBranch(guard.assigned_branch || 'UNASSIGNED'); setIsAssignModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-200 rounded-none transition-none" title="Deploy to Detachment">
                              <MapPin className="w-4 h-4" />
                            </button>
                            <button onClick={() => { setEntityToDelete({ id: guard.id, name: guard.guard_name, type: 'guard' }); setDeleteConfirmText(''); }} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-none transition-none" title="Delete Guard">
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
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-mono uppercase tracking-widest text-slate-500">
                <th className="p-4 font-bold border-r border-slate-100">Inspector Name</th>
                <th className="p-4 font-bold border-r border-slate-100">Contact Number</th>
                <th className="p-4 font-bold border-r border-slate-100">Assigned Detachment(s)</th>
                <th className="p-4 font-bold border-r border-slate-100">Joined Date</th>
                <th className="p-4 font-bold border-r border-slate-100">Status</th>
                <th className="p-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                <tr><td colSpan={6} className="p-12 text-center text-slate-500 text-xs font-mono uppercase tracking-widest">Loading Inspectors database...</td></tr>
              ) : filteredInspectors.length === 0 ? (
                <tr><td colSpan={6} className="p-12 text-center text-slate-500 text-xs font-mono uppercase tracking-widest">No inspectors found.</td></tr>
              ) : (
                filteredInspectors.map((inspector) => (
                  <tr key={inspector.id} className={`transition-none hover:bg-slate-50 ${!inspector.is_active && 'bg-slate-50 opacity-60'}`}>
                    <td className="p-4 text-sm font-bold text-slate-900 border-r border-slate-100 uppercase">
                      {inspector.full_name}
                    </td>
                    <td className="p-4 text-xs font-mono text-slate-600 border-r border-slate-100">{inspector.contact_number || 'N/A'}</td>
                    
                    <td className="p-4 border-r border-slate-100">
                      {inspector.detachments && inspector.detachments.length > 0 ? (
                        <div className="flex flex-col gap-1.5">
                          {inspector.detachments.map((det, idx) => (
                            <span key={idx} className="flex items-center text-[10px] font-mono font-bold text-slate-800 bg-white border border-slate-300 px-2 py-0.5 rounded-none w-max uppercase tracking-widest">
                              {det.branch_name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">Unassigned</span>
                      )}
                    </td>

                    <td className="p-4 text-xs font-mono text-slate-900 border-r border-slate-100">{new Date(inspector.created_at).toLocaleDateString()}</td>
                    <td className="p-4 border-r border-slate-100">
                      <span className={`inline-flex px-1.5 py-0.5 rounded-none text-[10px] font-mono font-bold uppercase tracking-widest border ${inspector.is_active ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                        {inspector.is_active ? 'ACTIVE' : 'DEACTIVATED'}
                      </span>
                    </td>
                    <td className="p-4 text-right flex justify-end space-x-2">
                      {isSuperadmin ? (
                        <>
                          <button 
                            onClick={() => { setEditInspectorData(inspector); setIsEditInspectorModalOpen(true); }}
                            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-200 rounded-none transition-none"
                            title="Edit Inspector Details"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => {
                              setInspectorToAssign(inspector);
                              setSelectedDetachments(branchOptions.filter(b => b.assigned_inspector_id === inspector.id));
                              setDetachmentSearch('');
                              setIsAssignInspectorModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-200 rounded-none transition-none"
                            title="Assign to Detachments"
                          >
                            <MapPin className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => toggleInspectorStatus(inspector.id, inspector.is_active)}
                            className={`p-1.5 rounded-none transition-none ${inspector.is_active ? 'text-slate-400 hover:text-red-600 hover:bg-red-50' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-200'}`} 
                            title={inspector.is_active ? "Deactivate Inspector" : "Reactivate Inspector"}
                          >
                            {inspector.is_active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                          </button>
                          <button 
                            onClick={() => { setEntityToDelete({ id: inspector.id, name: inspector.full_name, type: 'inspector' }); setDeleteConfirmText(''); }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-none transition-none" 
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

        {activeTab === 'keys' && (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-mono uppercase tracking-widest text-slate-500">
                <th className="p-4 font-bold border-r border-slate-100">Access Key</th>
                <th className="p-4 font-bold border-r border-slate-100">Assigned Inspector</th>
                <th className="p-4 font-bold border-r border-slate-100">Generated By</th>
                <th className="p-4 font-bold border-r border-slate-100">Generated On</th>
                <th className="p-4 font-bold border-r border-slate-100">Status</th>
                <th className="p-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                <tr><td colSpan={6} className="p-12 text-center text-slate-500 text-xs font-mono uppercase tracking-widest">Loading provisioning database...</td></tr>
              ) : filteredKeys.length === 0 ? (
                <tr><td colSpan={6} className="p-12 text-center text-slate-500 text-xs font-mono uppercase tracking-widest">No access keys generated yet.</td></tr>
              ) : (
                filteredKeys.map((key) => (
                  <tr key={key.id} className="hover:bg-slate-50 transition-none">
                    <td className="p-4 text-sm font-mono font-bold text-slate-900 border-r border-slate-100">{key.access_key}</td>
                    <td className="p-4 text-sm font-bold text-slate-900 border-r border-slate-100 uppercase">{key.assigned_to}</td>
                    <td className="p-4 text-xs font-mono text-slate-600 border-r border-slate-100">{key.created_by}</td>
                    <td className="p-4 text-xs font-mono text-slate-900 border-r border-slate-100">{new Date(key.created_at).toLocaleString()}</td>
                    <td className="p-4 border-r border-slate-100">
                      {key.is_used ? (
                        <span className="inline-flex px-1.5 py-0.5 rounded-none text-[10px] font-mono font-bold uppercase tracking-widest bg-slate-100 text-slate-500 border border-slate-200">
                          USED
                        </span>
                      ) : (
                        <span className="inline-flex px-1.5 py-0.5 rounded-none text-[10px] font-mono font-bold uppercase tracking-widest bg-white text-slate-900 border border-slate-300">
                          PENDING
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right flex justify-end space-x-1">
                      {isSuperadmin ? (
                        <button 
                          onClick={() => { setEntityToDelete({ id: key.id, name: `Access Key ${key.access_key}`, type: 'key' }); setDeleteConfirmText(''); }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-none transition-none" 
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
      
      {/* EDIT GUARD MODAL */}
      {isEditGuardModalOpen && editGuardData && isSuperadmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 transition-none">
          <div className="bg-white rounded-none border border-slate-300 shadow-none w-full max-w-md overflow-hidden flex flex-col">
            <div className="bg-white border-b border-slate-200 p-5 flex justify-between items-center shrink-0">
              <h3 className="text-base font-bold uppercase text-slate-900 tracking-tight flex items-center">
                <Edit className="w-4 h-4 mr-2" /> Edit Guard Profile
              </h3>
              <button onClick={() => setIsEditGuardModalOpen(false)} className="text-slate-400 hover:text-slate-900 transition-none text-xl leading-none">✕</button>
            </div>
            <form onSubmit={handleUpdateGuard} className="p-6 space-y-5 bg-slate-50">
              <div>
                <label className="block text-xs font-mono font-bold text-slate-500 uppercase tracking-widest mb-2">Full Legal Name</label>
                <input required type="text" className="w-full border border-slate-300 p-3 rounded-none outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 bg-white text-sm font-medium text-slate-900" value={editGuardData.guard_name} onChange={e => setEditGuardData({...editGuardData, guard_name: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-mono font-bold text-slate-500 uppercase tracking-widest mb-2">LESP License Number</label>
                <input required type="text" className="w-full border border-slate-300 p-3 rounded-none outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 bg-white text-sm font-mono font-medium text-slate-900" value={editGuardData.lesp_number} onChange={e => setEditGuardData({...editGuardData, lesp_number: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-mono font-bold text-slate-500 uppercase tracking-widest mb-2">LESP Expiry Date</label>
                <input required type="date" className="w-full border border-slate-300 p-3 rounded-none outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 bg-white text-sm font-medium text-slate-900 transition-none" value={editGuardData.lesp_expiry_date} onChange={e => setEditGuardData({...editGuardData, lesp_expiry_date: e.target.value})} />
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full bg-slate-900 text-white text-xs font-bold uppercase tracking-widest py-3 rounded-none hover:bg-slate-800 transition-none">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT INSPECTOR MODAL */}
      {isEditInspectorModalOpen && editInspectorData && isSuperadmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 transition-none">
          <div className="bg-white rounded-none border border-slate-300 shadow-none w-full max-w-md overflow-hidden flex flex-col">
            <div className="bg-white border-b border-slate-200 p-5 flex justify-between items-center shrink-0">
              <h3 className="text-base font-bold uppercase text-slate-900 tracking-tight flex items-center">
                <Edit className="w-4 h-4 mr-2" /> Edit Inspector Profile
              </h3>
              <button onClick={() => setIsEditInspectorModalOpen(false)} className="text-slate-400 hover:text-slate-900 transition-none text-xl leading-none">✕</button>
            </div>
            <form onSubmit={handleUpdateInspector} className="p-6 space-y-5 bg-slate-50">
              <div>
                <label className="block text-xs font-mono font-bold text-slate-500 uppercase tracking-widest mb-2">Full Legal Name</label>
                <input required type="text" className="w-full border border-slate-300 p-3 rounded-none outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 bg-white text-sm font-medium text-slate-900" value={editInspectorData.full_name} onChange={e => setEditInspectorData({...editInspectorData, full_name: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-mono font-bold text-slate-500 uppercase tracking-widest mb-2">Contact Number</label>
                <input required type="text" className="w-full border border-slate-300 p-3 rounded-none outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 bg-white text-sm font-mono font-medium text-slate-900" value={editInspectorData.contact_number || ''} onChange={e => setEditInspectorData({...editInspectorData, contact_number: e.target.value})} />
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full bg-slate-900 text-white text-xs font-bold uppercase tracking-widest py-3 rounded-none hover:bg-slate-800 transition-none">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deploy Guard Modal */}
      {isAssignModalOpen && guardToAssign && isSuperadmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 transition-none">
           <div className="bg-white rounded-none border border-slate-300 shadow-none w-full max-w-sm overflow-hidden flex flex-col">
            <div className="bg-white border-b border-slate-200 p-5 flex justify-between items-center shrink-0">
              <h3 className="text-base font-bold uppercase text-slate-900 tracking-tight flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Deploy Guard
              </h3>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-slate-400 hover:text-slate-900 transition-none text-xl leading-none">✕</button>
            </div>
            <form onSubmit={handleAssignBranch} className="p-6 space-y-5 bg-slate-50">
              <div className="bg-white p-4 border border-slate-200">
                <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-1">Target Personnel</p>
                <p className="font-bold text-slate-900 text-sm uppercase">{guardToAssign.guard_name}</p>
                <p className="text-xs font-mono text-slate-500 mt-1">LESP: {guardToAssign.lesp_number}</p>
              </div>
              <div>
                <label className="block text-xs font-mono font-bold text-slate-500 uppercase tracking-widest mb-2">Assign Detachment</label>
                <select 
                  className="w-full border border-slate-300 p-3 rounded-none outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 text-sm font-medium text-slate-900 bg-white cursor-pointer"
                  value={selectedBranch} 
                  onChange={(e) => setSelectedBranch(e.target.value)}
                >
                  <option value="UNASSIGNED">-- Floating / Unassigned --</option>
                  {branchOptions.map((b, i) => <option key={i} value={b.branch_name}>{b.branch_name}</option>)}
                </select>
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full bg-slate-900 text-white text-xs font-bold uppercase tracking-widest py-3 rounded-none hover:bg-slate-800 transition-none">
                  Confirm Deployment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Register Guard Modal */}
      {isAddModalOpen && isSuperadmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 transition-none">
           <div className="bg-white rounded-none border border-slate-300 shadow-none w-full max-w-md overflow-hidden flex flex-col">
            <div className="bg-white border-b border-slate-200 p-5 flex justify-between items-center shrink-0">
              <h3 className="text-base font-bold uppercase text-slate-900 tracking-tight flex items-center">
                <User className="w-4 h-4 mr-2" /> Register Security Guard
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-900 transition-none text-xl leading-none">✕</button>
            </div>
            <form onSubmit={handleAddGuard} className="p-6 space-y-5 bg-slate-50">
              <div>
                <label className="block text-xs font-mono font-bold text-slate-500 uppercase tracking-widest mb-2">Full Legal Name</label>
                <input required type="text" className="w-full border border-slate-300 p-3 rounded-none outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 bg-white text-sm font-medium text-slate-900" value={newGuard.guard_name} onChange={e => setNewGuard({...newGuard, guard_name: e.target.value})} placeholder="e.g. Dela Cruz, Juan" />
              </div>
              <div>
                <label className="block text-xs font-mono font-bold text-slate-500 uppercase tracking-widest mb-2">LESP License Number</label>
                <input required type="text" className="w-full border border-slate-300 p-3 rounded-none outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 bg-white text-sm font-mono font-medium text-slate-900" value={newGuard.lesp_number} onChange={e => setNewGuard({...newGuard, lesp_number: e.target.value})} placeholder="LESP-12345" />
              </div>
              <div>
                <label className="block text-xs font-mono font-bold text-slate-500 uppercase tracking-widest mb-2">LESP Expiry Date</label>
                <input required type="date" className="w-full border border-slate-300 p-3 rounded-none outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 bg-white text-sm font-medium text-slate-900 transition-none" value={newGuard.lesp_expiry_date} onChange={e => setNewGuard({...newGuard, lesp_expiry_date: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-mono font-bold text-slate-500 uppercase tracking-widest mb-2">Initial Assignment</label>
                <select className="w-full border border-slate-300 p-3 rounded-none outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 bg-white text-sm font-medium text-slate-900 cursor-pointer" value={newGuard.assigned_branch} onChange={(e) => setNewGuard({...newGuard, assigned_branch: e.target.value})}>
                  <option value="UNASSIGNED">-- Floating / Unassigned --</option>
                  {branchOptions.map((b, i) => <option key={i} value={b.branch_name}>{b.branch_name}</option>)}
                </select>
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full bg-slate-900 text-white text-xs font-bold uppercase tracking-widest py-3 rounded-none hover:bg-slate-800 transition-none">Save Guard Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Register Inspector Modal */}
      {isAddInspectorModalOpen && isSuperadmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 transition-none">
           <div className="bg-white rounded-none border border-slate-300 shadow-none w-full max-w-md overflow-hidden flex flex-col">
            <div className="bg-white border-b border-slate-200 p-5 flex justify-between items-center shrink-0">
              <h3 className="text-base font-bold uppercase text-slate-900 tracking-tight flex items-center">
                <User className="w-4 h-4 mr-2" /> Register Field Inspector
              </h3>
              <button onClick={() => setIsAddInspectorModalOpen(false)} className="text-slate-400 hover:text-slate-900 transition-none text-xl leading-none">✕</button>
            </div>
            <form onSubmit={handleAddInspector} className="p-6 space-y-5 bg-slate-50">
              <div>
                <label className="block text-xs font-mono font-bold text-slate-500 uppercase tracking-widest mb-2">Full Legal Name</label>
                <input required type="text" className="w-full border border-slate-300 p-3 rounded-none outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 bg-white text-sm font-medium text-slate-900" value={newInspector.full_name} onChange={e => setNewInspector({...newInspector, full_name: e.target.value})} placeholder="e.g. Inspector Alpha" />
              </div>
              <div>
                <label className="block text-xs font-mono font-bold text-slate-500 uppercase tracking-widest mb-2">Contact Number</label>
                <input required type="text" className="w-full border border-slate-300 p-3 rounded-none outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 bg-white text-sm font-mono font-medium text-slate-900" value={newInspector.contact_number} onChange={e => setNewInspector({...newInspector, contact_number: e.target.value})} placeholder="0917-123-4567" />
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full bg-slate-900 text-white text-xs font-bold uppercase tracking-widest py-3 rounded-none hover:bg-slate-800 transition-none">Save Inspector Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* === MODAL: DISPATCH INSPECTOR TO DETACHMENTS === */}
      {isAssignInspectorModalOpen && inspectorToAssign && isSuperadmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 transition-none">
          <div className="bg-white rounded-none border border-slate-300 shadow-none w-full max-w-md overflow-visible flex flex-col">
            <div className="bg-white border-b border-slate-200 p-5 flex justify-between items-center shrink-0">
              <h3 className="text-base font-bold uppercase text-slate-900 tracking-tight flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Dispatch Inspector
              </h3>
              <button onClick={() => setIsAssignInspectorModalOpen(false)} className="text-slate-400 hover:text-slate-900 transition-none text-xl leading-none">✕</button>
            </div>
            
            <form onSubmit={handleAssignInspectorToDetachments} className="p-6 space-y-6 overflow-visible bg-slate-50">
              <div className="bg-white p-4 border border-slate-200">
                <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-1">Target Personnel</p>
                <p className="font-bold text-slate-900 text-sm uppercase">{inspectorToAssign.full_name}</p>
                <p className="text-[11px] font-mono text-slate-500 mt-1">{inspectorToAssign.contact_number || 'No contact number'}</p>
              </div>

              <div className="space-y-5">
                <div className="border-t border-slate-200 pt-5">
                  <label className="block text-xs font-mono font-bold text-slate-500 uppercase tracking-widest mb-2">Deploy to Detachments</label>
                  
                  {/* Selected Detachments Multi-Pill Container */}
                  <div className="flex flex-wrap gap-2 mb-3 min-h-[42px] p-2 bg-white border border-slate-300">
                    {selectedDetachments.length === 0 && <span className="text-xs font-mono text-slate-400 py-1 px-1 uppercase tracking-widest">No assigned detachments.</span>}
                    {selectedDetachments.map(b => (
                      <span key={b.id} className="flex items-center text-xs font-mono font-bold text-slate-900 bg-slate-100 pl-2 pr-1 py-1 rounded-none border border-slate-300 uppercase tracking-widest">
                        {b.branch_name}
                        <button type="button" onClick={() => handleRemoveDetachmentFromSelection(b.id)} className="ml-2 text-slate-400 hover:text-slate-900 hover:bg-slate-200 p-0.5 transition-none">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>

                  {/* Multi-Select Detachment Combo-Box */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search and assign detachments..."
                      className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-none outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 text-sm font-medium text-slate-900 bg-white"
                      value={detachmentSearch}
                      onChange={(e) => setDetachmentSearch(e.target.value)}
                    />
                    {detachmentSearch && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-300 max-h-48 overflow-y-auto z-50">
                        {branchOptions
                          .filter(b => b.branch_name.toLowerCase().includes(detachmentSearch.toLowerCase()))
                          .filter(b => !selectedDetachments.find(sd => sd.id === b.id))
                          .map(b => (
                            <button
                              key={b.id}
                              type="button"
                              onClick={() => handleAddDetachmentToSelection(b)}
                              className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-200 last:border-0 flex flex-col transition-none"
                            >
                              <span className="text-sm font-bold text-slate-900">{b.branch_name}</span>
                              {b.assigned_inspector_id && (
                                <span className="text-xs font-mono text-slate-500 uppercase tracking-widest mt-1">
                                  Currently monitored by: {b.inspector?.full_name}
                                </span>
                              )}
                            </button>
                        ))}
                        {branchOptions.filter(b => b.branch_name.toLowerCase().includes(detachmentSearch.toLowerCase()) && !selectedDetachments.find(sd => sd.id === b.id)).length === 0 && (
                            <div className="p-3 text-xs font-mono text-slate-500 text-center uppercase tracking-widest">No matching detachments available.</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button type="submit" className="w-full bg-slate-900 text-white text-xs font-bold uppercase tracking-widest py-3 rounded-none hover:bg-slate-800 transition-none">
                  Confirm Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generate Access Key Modal */}
      {isKeyModalOpen && isSuperadmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 transition-none">
          <div className="bg-white rounded-none border border-slate-300 shadow-none w-full max-w-md overflow-hidden flex flex-col">
            <div className="bg-white border-b border-slate-200 p-5 flex justify-between items-center shrink-0">
              <h3 className="text-base font-bold uppercase text-slate-900 tracking-tight flex items-center">
                <Key className="w-4 h-4 mr-2" /> Device Provisioning
              </h3>
              <button onClick={closeKeyModal} className="text-slate-400 hover:text-slate-900 transition-none text-xl leading-none">✕</button>
            </div>
            
            <div className="p-6 bg-slate-50">
              {!newlyGeneratedKey ? (
                <form onSubmit={handleGenerateKey} className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono font-bold text-slate-500 uppercase tracking-widest mb-2">Inspector's Name</label>
                    <p className="text-[11px] font-mono text-slate-400 uppercase tracking-widest mb-3">Select the inspector you are generating this key for.</p>
                    <select 
                      required
                      className="w-full border border-slate-300 p-3 rounded-none outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 text-sm font-medium text-slate-900 bg-white cursor-pointer" 
                      value={newKeyAssignee} 
                      onChange={e => setNewKeyAssignee(e.target.value)} 
                    >
                      <option value="" disabled>-- Select Inspector --</option>
                      {inspectors.map((ins, i) => (
                        <option key={i} value={ins.full_name}>{ins.full_name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="pt-2">
                    <button type="submit" className="w-full bg-slate-900 text-white text-xs font-bold uppercase tracking-widest py-3 rounded-none hover:bg-slate-800 transition-none">
                      Generate Key
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-center space-y-6">
                  <div className="bg-white text-slate-900 p-4 border border-slate-300">
                    <p className="text-xs font-mono font-bold uppercase tracking-widest">Key Generated Successfully</p>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">Provide this exact code to <strong className="text-slate-900 uppercase">{newKeyAssignee}</strong>. It can only be used once.</p>
                  
                  <div className="bg-white p-6 border border-slate-300 relative group">
                    <p className="text-3xl font-mono font-bold text-slate-900 tracking-widest">{newlyGeneratedKey}</p>
                    <button 
                      onClick={() => navigator.clipboard.writeText(newlyGeneratedKey)}
                      className="absolute top-2 right-2 p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-none"
                      title="Copy to Clipboard"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="pt-2">
                    <button onClick={closeKeyModal} className="w-full bg-white border border-slate-300 text-slate-900 text-xs font-bold uppercase tracking-widest py-3 rounded-none hover:bg-slate-100 transition-none">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 transition-none">
          <div className="bg-white rounded-none border border-slate-300 shadow-none w-full max-w-md overflow-hidden flex flex-col">
            <div className="bg-white border-b border-red-200 p-5 flex justify-between items-center shrink-0">
              <h3 className="text-base font-bold uppercase text-red-600 tracking-tight flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2" /> Permanent Deletion
              </h3>
              <button onClick={() => { setEntityToDelete(null); setDeleteConfirmText(''); }} className="text-slate-400 hover:text-slate-900 transition-none text-xl leading-none">✕</button>
            </div>
            
            <form onSubmit={handleDeleteEntity} className="p-6 space-y-5 bg-slate-50">
              <p className="text-slate-700 text-sm leading-relaxed">
                You are about to permanently delete <strong className="text-slate-900 uppercase">{entityToDelete.name}</strong>. This action cannot be undone.
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
                <button type="button" onClick={() => { setEntityToDelete(null); setDeleteConfirmText(''); }} className="flex-1 bg-white border border-slate-300 text-slate-900 text-xs font-bold uppercase tracking-widest py-3 rounded-none hover:bg-slate-100 transition-none">
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