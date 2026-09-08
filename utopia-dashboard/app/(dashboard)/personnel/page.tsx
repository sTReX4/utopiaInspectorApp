'use client';

import { useState, useEffect } from 'react';
import { Briefcase, CheckCircle, Copy, Key, Lock, MagnifyingGlass, MapPin, PencilSimple, Plus, Power, Prohibit, ShieldCheck, ShieldSlash, ShieldWarning, Trash, User, Warning, X, XCircle } from '@phosphor-icons/react';
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
    if (data) setBranchOptions(data as any);
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

    if (diffDays < 0) return { label: 'EXPIRED', color: 'border-danger-ink/20 bg-danger-bg text-danger-ink', icon: XCircle };
    if (diffDays <= 30) return { label: 'EXPIRING SOON', color: 'border-warn-ink/20 bg-warn-bg text-warn-ink', icon: Warning };
    return { label: 'VALID', color: 'border-line bg-surface text-ink', icon: CheckCircle };
  };

  const filteredGuards = guards.filter(g => g.guard_name.toLowerCase().includes(searchQuery.toLowerCase()) || g.lesp_number.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredKeys = keys.filter(k => k.assigned_to.toLowerCase().includes(searchQuery.toLowerCase()) || k.access_key.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredInspectors = inspectors.filter(i => i.full_name.toLowerCase().includes(searchQuery.toLowerCase()));

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
          <h1 className="text-xl font-bold tracking-tight text-ink">Personnel & Provisioning</h1>
          <p className="text-sm text-ink-muted mt-1">Manage human resources and provision inspector mobile devices.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {activeTab === 'guards' && (
            isSuperadmin ? (
              <button onClick={() => setIsAddModalOpen(true)} className="bg-ink hover:bg-shell-hover text-surface px-5 py-2.5 rounded-control text-xs font-bold flex items-center transition-colors duration-200">
                <Plus className="w-4 h-4 mr-2" /> Register Guard
              </button>
            ) : (
              <button disabled className="bg-sunken text-ink-muted px-5 py-2.5 rounded-control text-xs font-bold flex items-center cursor-not-allowed border border-line">
                <Lock className="w-4 h-4 mr-2" /> HR Access Required
              </button>
            )
          )}

          {activeTab === 'inspectors' && (
            isSuperadmin ? (
              <button onClick={() => setIsAddInspectorModalOpen(true)} className="bg-ink hover:bg-shell-hover text-surface px-5 py-2.5 rounded-control text-xs font-bold flex items-center transition-colors duration-200">
                <User className="w-4 h-4 mr-2" /> Register Inspector
              </button>
            ) : (
              <button disabled className="bg-sunken text-ink-muted px-5 py-2.5 rounded-control text-xs font-bold flex items-center cursor-not-allowed border border-line">
                <Lock className="w-4 h-4 mr-2" /> HR Access Required
              </button>
            )
          )}

          {activeTab === 'keys' && (
            isSuperadmin ? (
              <button onClick={() => setIsKeyModalOpen(true)} className="bg-ink hover:bg-shell-hover text-surface px-5 py-2.5 rounded-control text-xs font-bold flex items-center transition-colors duration-200">
                <Key className="w-4 h-4 mr-2" /> Generate Access Key
              </button>
            ) : (
              <button disabled className="bg-sunken text-ink-muted px-5 py-2.5 rounded-control text-xs font-bold flex items-center cursor-not-allowed border border-line">
                <Lock className="w-4 h-4 mr-2" /> Provisioning Restricted
              </button>
            )
          )}
        </div>
      </div>

      {/* 3-TIER TABS */}
      <div className="flex space-x-8 border-b border-line">
        <button 
          onClick={() => { setActiveTab('guards'); setSearchQuery(''); }}
          className={`pb-3 text-xs font-bold transition-colors duration-200 whitespace-nowrap ${activeTab === 'guards' ? 'border-b-2 border-ink text-ink' : 'text-ink-muted hover:text-ink border-b-2 border-transparent'}`}
        >
          Security Guards
        </button>
        <button 
          onClick={() => { setActiveTab('inspectors'); setSearchQuery(''); }}
          className={`pb-3 text-xs font-bold transition-colors duration-200 whitespace-nowrap ${activeTab === 'inspectors' ? 'border-b-2 border-ink text-ink' : 'text-ink-muted hover:text-ink border-b-2 border-transparent'}`}
        >
          Roving Inspectors
        </button>
        <button 
          onClick={() => { setActiveTab('keys'); setSearchQuery(''); }}
          className={`pb-3 text-xs font-bold transition-colors duration-200 whitespace-nowrap ${activeTab === 'keys' ? 'border-b-2 border-ink text-ink' : 'text-ink-muted hover:text-ink border-b-2 border-transparent'}`}
        >
          Device Provisioning
        </button>
      </div>

      {/* Search Bar */}
      <div className="border border-line bg-surface p-3 flex items-center">
        <MagnifyingGlass className="w-4 h-4 text-ink-muted mr-3 ml-2" />
        <input 
          type="text" 
          placeholder={
            activeTab === 'guards' ? "Search by guard name or LESP..." : 
            activeTab === 'inspectors' ? "Search by inspector name..." : 
            "Search by inspector name or access key..."
          } 
          className="flex-1 outline-none text-sm font-medium text-ink bg-transparent placeholder-ink-muted"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Main Table Area */}
      <div className="border border-line bg-surface rounded-card overflow-x-auto">
        {activeTab === 'guards' && (
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-canvas border-b border-line text-xs text-ink-muted">
                <th className="p-4 font-bold border-r border-line">Guard Name</th>
                <th className="p-4 font-bold border-r border-line">LESP Number</th>
                <th className="p-4 font-bold border-r border-line">Expiration Date</th>
                <th className="p-4 font-bold border-r border-line">Assigned Branch</th>
                <th className="p-4 font-bold border-r border-line">License Status</th>
                <th className="p-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {isLoading ? (
                <tr><td colSpan={6} className="p-12 text-center text-ink-muted text-xs">Loading HR database...</td></tr>
              ) : filteredGuards.length === 0 ? (
                <tr><td colSpan={6} className="p-12 text-center text-ink-muted text-xs">No guard records found.</td></tr>
              ) : (
                filteredGuards.map((guard) => {
                  const status = getExpiryStatus(guard.lesp_expiry_date);
                  return (
                    <tr key={guard.id} className={`hover:bg-sunken transition-colors duration-200 ${!guard.is_active && 'opacity-50'}`}>
                      <td className="p-4 text-sm font-bold text-ink border-r border-line">{guard.guard_name}</td>
                      <td className="p-4 text-xs font-mono text-ink-muted border-r border-line">{guard.lesp_number}</td>
                      <td className="p-4 text-xs text-ink border-r border-line">{new Date(guard.lesp_expiry_date).toLocaleDateString()}</td>
                      <td className="p-4 text-sm font-bold text-ink border-r border-line">{guard.assigned_branch || 'Floating'}</td>
                      <td className="p-4 border-r border-line">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-control text-xs font-bold border ${status.color}`}>
                          <status.icon weight="fill" className="w-3.5 h-3.5 shrink-0" /> {status.label}
                        </span>
                      </td>
                      <td className="p-4 text-right flex justify-end space-x-2">
                        {isSuperadmin ? (
                          <>
                            <button 
                              onClick={() => { setEditGuardData(guard); setIsEditGuardModalOpen(true); }}
                              className="p-1.5 text-ink-muted hover:text-ink hover:bg-sunken rounded-control transition-colors duration-200"
                              title="Edit Guard Details"
                            >
                              <PencilSimple className="w-4 h-4" />
                            </button>
                            <button onClick={() => { setGuardToAssign(guard); setSelectedBranch(guard.assigned_branch || 'UNASSIGNED'); setIsAssignModalOpen(true); }} className="p-1.5 text-ink-muted hover:text-ink hover:bg-sunken rounded-control transition-colors duration-200" title="Deploy to Detachment">
                              <MapPin className="w-4 h-4" />
                            </button>
                            <button onClick={() => { setEntityToDelete({ id: guard.id, name: guard.guard_name, type: 'guard' }); setDeleteConfirmText(''); }} className="p-1.5 text-ink-muted hover:text-danger-ink hover:bg-danger-bg rounded-control transition-colors duration-200" title="Delete Guard">
                              <Trash className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <button disabled className="p-1.5 text-shell-muted cursor-not-allowed"><Lock className="w-4 h-4" /></button>
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
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-canvas border-b border-line text-xs text-ink-muted">
                <th className="p-4 font-bold border-r border-line">Inspector Name</th>
                <th className="p-4 font-bold border-r border-line">Contact Number</th>
                <th className="p-4 font-bold border-r border-line">Assigned Detachment(s)</th>
                <th className="p-4 font-bold border-r border-line">Joined Date</th>
                <th className="p-4 font-bold border-r border-line">Status</th>
                <th className="p-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {isLoading ? (
                <tr><td colSpan={6} className="p-12 text-center text-ink-muted text-xs">Loading Inspectors database...</td></tr>
              ) : filteredInspectors.length === 0 ? (
                <tr><td colSpan={6} className="p-12 text-center text-ink-muted text-xs">No inspectors found.</td></tr>
              ) : (
                filteredInspectors.map((inspector) => (
                  <tr key={inspector.id} className={`transition-colors duration-200 hover:bg-sunken ${!inspector.is_active && 'bg-canvas opacity-60'}`}>
                    <td className="p-4 text-sm font-bold text-ink border-r border-line">
                      {inspector.full_name}
                    </td>
                    <td className="p-4 text-xs text-ink-muted border-r border-line">{inspector.contact_number || 'N/A'}</td>
                    
                    <td className="p-4 border-r border-line">
                      {inspector.detachments && inspector.detachments.length > 0 ? (
                        <div className="flex flex-col gap-1.5">
                          {inspector.detachments.map((det, idx) => (
                            <span key={idx} className="flex items-center text-xs font-bold text-ink bg-surface border border-line px-2 py-0.5 rounded-control w-max">
                              {det.branch_name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-ink-muted">Unassigned</span>
                      )}
                    </td>

                    <td className="p-4 text-xs font-mono text-ink-muted border-r border-line">{new Date(inspector.created_at).toLocaleDateString()}</td>
                    <td className="p-4 border-r border-line">
                      <span className={`inline-flex px-1.5 py-0.5 rounded-control text-xs font-bold border ${inspector.is_active ? 'bg-surface border-line text-ink' : 'bg-sunken border-line text-ink-muted'}`}>
                        {inspector.is_active ? 'ACTIVE' : 'DEACTIVATED'}
                      </span>
                    </td>
                    <td className="p-4 text-right flex justify-end space-x-2">
                      {isSuperadmin ? (
                        <>
                          <button 
                            onClick={() => { setEditInspectorData(inspector); setIsEditInspectorModalOpen(true); }}
                            className="p-1.5 text-ink-muted hover:text-ink hover:bg-sunken rounded-control transition-colors duration-200"
                            title="Edit Inspector Details"
                          >
                            <PencilSimple className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => {
                              setInspectorToAssign(inspector);
                              setSelectedDetachments(branchOptions.filter(b => b.assigned_inspector_id === inspector.id));
                              setDetachmentSearch('');
                              setIsAssignInspectorModalOpen(true);
                            }}
                            className="p-1.5 text-ink-muted hover:text-ink hover:bg-sunken rounded-control transition-colors duration-200"
                            title="Assign to Detachments"
                          >
                            <MapPin className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => toggleInspectorStatus(inspector.id, inspector.is_active)}
                            className={`p-1.5 rounded-control transition-colors duration-200 ${inspector.is_active ? 'text-ink-muted hover:text-danger-ink hover:bg-danger-bg' : 'text-ink-muted hover:text-ink hover:bg-sunken'}`} 
                            title={inspector.is_active ? "Deactivate Inspector" : "Reactivate Inspector"}
                          >
                            {inspector.is_active ? <Prohibit className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                          </button>
                          <button 
                            onClick={() => { setEntityToDelete({ id: inspector.id, name: inspector.full_name, type: 'inspector' }); setDeleteConfirmText(''); }}
                            className="p-1.5 text-ink-muted hover:text-danger-ink hover:bg-danger-bg rounded-control transition-colors duration-200" 
                            title="Delete Inspector"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <button disabled className="p-1.5 text-shell-muted cursor-not-allowed"><Lock className="w-4 h-4" /></button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {activeTab === 'keys' && (
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-canvas border-b border-line text-xs text-ink-muted">
                <th className="p-4 font-bold border-r border-line">Access Key</th>
                <th className="p-4 font-bold border-r border-line">Assigned Inspector</th>
                <th className="p-4 font-bold border-r border-line">Generated By</th>
                <th className="p-4 font-bold border-r border-line">Generated On</th>
                <th className="p-4 font-bold border-r border-line">Status</th>
                <th className="p-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {isLoading ? (
                <tr><td colSpan={6} className="p-12 text-center text-ink-muted text-xs">Loading provisioning database...</td></tr>
              ) : filteredKeys.length === 0 ? (
                <tr><td colSpan={6} className="p-12 text-center text-ink-muted text-xs">No access keys generated yet.</td></tr>
              ) : (
                filteredKeys.map((key) => (
                  <tr key={key.id} className="hover:bg-sunken transition-colors duration-200">
                    <td className="p-4 text-sm font-mono font-medium text-ink border-r border-line">{key.access_key}</td>
                    <td className="p-4 text-sm font-bold text-ink border-r border-line">{key.assigned_to}</td>
                    <td className="p-4 text-xs text-ink-muted border-r border-line">{key.created_by}</td>
                    <td className="p-4 text-xs font-mono text-ink-muted border-r border-line">{new Date(key.created_at).toLocaleString()}</td>
                    <td className="p-4 border-r border-line">
                      {key.is_used ? (
                        <span className="inline-flex px-1.5 py-0.5 rounded-control text-xs font-bold bg-sunken text-ink-muted border border-line">
                          USED
                        </span>
                      ) : (
                        <span className="inline-flex px-1.5 py-0.5 rounded-control text-xs font-bold bg-surface text-ink border border-line">
                          PENDING
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right flex justify-end space-x-1">
                      {isSuperadmin ? (
                        <button 
                          onClick={() => { setEntityToDelete({ id: key.id, name: `Access Key ${key.access_key}`, type: 'key' }); setDeleteConfirmText(''); }}
                          className="p-1.5 text-ink-muted hover:text-danger-ink hover:bg-danger-bg rounded-control transition-colors duration-200" 
                          title="Delete Key"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      ) : (
                        <button disabled className="p-1.5 text-shell-muted cursor-not-allowed"><Lock className="w-4 h-4" /></button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4 transition-colors duration-200">
          <div className="bg-surface rounded-control border border-line shadow-none w-full max-w-md overflow-hidden flex flex-col">
            <div className="bg-surface border-b border-line p-5 flex justify-between items-center shrink-0">
              <h3 className="text-base font-bold text-ink tracking-tight flex items-center">
                <PencilSimple className="w-4 h-4 mr-2" /> Edit Guard Profile
              </h3>
              <button onClick={() => setIsEditGuardModalOpen(false)} aria-label="Close" className="text-ink-muted hover:text-ink transition-colors duration-200 p-1 rounded-control"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleUpdateGuard} className="p-6 space-y-5 bg-canvas">
              <div>
                <label className="block text-xs font-bold text-ink-muted mb-2">Full Legal Name</label>
                <input required type="text" className="w-full border border-line p-3 rounded-control outline-none focus:border-ink focus:ring-1 focus:ring-info-ink bg-surface text-sm font-medium text-ink" value={editGuardData.guard_name} onChange={e => setEditGuardData({...editGuardData, guard_name: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-ink-muted mb-2">LESP License Number</label>
                <input required type="text" className="w-full border border-line p-3 rounded-control outline-none focus:border-ink focus:ring-1 focus:ring-info-ink bg-surface text-sm font-medium text-ink" value={editGuardData.lesp_number} onChange={e => setEditGuardData({...editGuardData, lesp_number: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-ink-muted mb-2">LESP Expiry Date</label>
                <input required type="date" className="w-full border border-line p-3 rounded-control outline-none focus:border-ink focus:ring-1 focus:ring-info-ink bg-surface text-sm font-medium text-ink transition-colors duration-200" value={editGuardData.lesp_expiry_date} onChange={e => setEditGuardData({...editGuardData, lesp_expiry_date: e.target.value})} />
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full bg-ink text-surface text-xs font-bold py-3 rounded-control hover:bg-shell-hover transition-colors duration-200">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT INSPECTOR MODAL */}
      {isEditInspectorModalOpen && editInspectorData && isSuperadmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4 transition-colors duration-200">
          <div className="bg-surface rounded-control border border-line shadow-none w-full max-w-md overflow-hidden flex flex-col">
            <div className="bg-surface border-b border-line p-5 flex justify-between items-center shrink-0">
              <h3 className="text-base font-bold text-ink tracking-tight flex items-center">
                <PencilSimple className="w-4 h-4 mr-2" /> Edit Inspector Profile
              </h3>
              <button onClick={() => setIsEditInspectorModalOpen(false)} aria-label="Close" className="text-ink-muted hover:text-ink transition-colors duration-200 p-1 rounded-control"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleUpdateInspector} className="p-6 space-y-5 bg-canvas">
              <div>
                <label className="block text-xs font-bold text-ink-muted mb-2">Full Legal Name</label>
                <input required type="text" className="w-full border border-line p-3 rounded-control outline-none focus:border-ink focus:ring-1 focus:ring-info-ink bg-surface text-sm font-medium text-ink" value={editInspectorData.full_name} onChange={e => setEditInspectorData({...editInspectorData, full_name: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-ink-muted mb-2">Contact Number</label>
                <input required type="text" className="w-full border border-line p-3 rounded-control outline-none focus:border-ink focus:ring-1 focus:ring-info-ink bg-surface text-sm font-medium text-ink" value={editInspectorData.contact_number || ''} onChange={e => setEditInspectorData({...editInspectorData, contact_number: e.target.value})} />
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full bg-ink text-surface text-xs font-bold py-3 rounded-control hover:bg-shell-hover transition-colors duration-200">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deploy Guard Modal */}
      {isAssignModalOpen && guardToAssign && isSuperadmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4 transition-colors duration-200">
           <div className="bg-surface rounded-control border border-line shadow-none w-full max-w-sm overflow-hidden flex flex-col">
            <div className="bg-surface border-b border-line p-5 flex justify-between items-center shrink-0">
              <h3 className="text-base font-bold text-ink tracking-tight flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Deploy Guard
              </h3>
              <button onClick={() => setIsAssignModalOpen(false)} aria-label="Close" className="text-ink-muted hover:text-ink transition-colors duration-200 p-1 rounded-control"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAssignBranch} className="p-6 space-y-5 bg-canvas">
              <div className="bg-surface p-4 border border-line">
                <p className="text-xs text-ink-muted mb-1">Target Personnel</p>
                <p className="font-bold text-ink text-sm">{guardToAssign.guard_name}</p>
                <p className="text-xs text-ink-muted mt-1">LESP: {guardToAssign.lesp_number}</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-ink-muted mb-2">Assign Detachment</label>
                <select 
                  className="w-full border border-line p-3 rounded-control outline-none focus:border-ink focus:ring-1 focus:ring-info-ink text-sm font-medium text-ink bg-surface cursor-pointer"
                  value={selectedBranch} 
                  onChange={(e) => setSelectedBranch(e.target.value)}
                >
                  <option value="UNASSIGNED">-- Floating / Unassigned --</option>
                  {branchOptions.map((b, i) => <option key={i} value={b.branch_name}>{b.branch_name}</option>)}
                </select>
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full bg-ink text-surface text-xs font-bold py-3 rounded-control hover:bg-shell-hover transition-colors duration-200">
                  Confirm Deployment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Register Guard Modal */}
      {isAddModalOpen && isSuperadmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4 transition-colors duration-200">
           <div className="bg-surface rounded-control border border-line shadow-none w-full max-w-md overflow-hidden flex flex-col">
            <div className="bg-surface border-b border-line p-5 flex justify-between items-center shrink-0">
              <h3 className="text-base font-bold text-ink tracking-tight flex items-center">
                <User className="w-4 h-4 mr-2" /> Register Security Guard
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} aria-label="Close" className="text-ink-muted hover:text-ink transition-colors duration-200 p-1 rounded-control"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddGuard} className="p-6 space-y-5 bg-canvas">
              <div>
                <label className="block text-xs font-bold text-ink-muted mb-2">Full Legal Name</label>
                <input required type="text" className="w-full border border-line p-3 rounded-control outline-none focus:border-ink focus:ring-1 focus:ring-info-ink bg-surface text-sm font-medium text-ink" value={newGuard.guard_name} onChange={e => setNewGuard({...newGuard, guard_name: e.target.value})} placeholder="e.g. Dela Cruz, Juan" />
              </div>
              <div>
                <label className="block text-xs font-bold text-ink-muted mb-2">LESP License Number</label>
                <input required type="text" className="w-full border border-line p-3 rounded-control outline-none focus:border-ink focus:ring-1 focus:ring-info-ink bg-surface text-sm font-medium text-ink" value={newGuard.lesp_number} onChange={e => setNewGuard({...newGuard, lesp_number: e.target.value})} placeholder="LESP-12345" />
              </div>
              <div>
                <label className="block text-xs font-bold text-ink-muted mb-2">LESP Expiry Date</label>
                <input required type="date" className="w-full border border-line p-3 rounded-control outline-none focus:border-ink focus:ring-1 focus:ring-info-ink bg-surface text-sm font-medium text-ink transition-colors duration-200" value={newGuard.lesp_expiry_date} onChange={e => setNewGuard({...newGuard, lesp_expiry_date: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-ink-muted mb-2">Initial Assignment</label>
                <select className="w-full border border-line p-3 rounded-control outline-none focus:border-ink focus:ring-1 focus:ring-info-ink bg-surface text-sm font-medium text-ink cursor-pointer" value={newGuard.assigned_branch} onChange={(e) => setNewGuard({...newGuard, assigned_branch: e.target.value})}>
                  <option value="UNASSIGNED">-- Floating / Unassigned --</option>
                  {branchOptions.map((b, i) => <option key={i} value={b.branch_name}>{b.branch_name}</option>)}
                </select>
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full bg-ink text-surface text-xs font-bold py-3 rounded-control hover:bg-shell-hover transition-colors duration-200">Save Guard Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Register Inspector Modal */}
      {isAddInspectorModalOpen && isSuperadmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4 transition-colors duration-200">
           <div className="bg-surface rounded-control border border-line shadow-none w-full max-w-md overflow-hidden flex flex-col">
            <div className="bg-surface border-b border-line p-5 flex justify-between items-center shrink-0">
              <h3 className="text-base font-bold text-ink tracking-tight flex items-center">
                <User className="w-4 h-4 mr-2" /> Register Field Inspector
              </h3>
              <button onClick={() => setIsAddInspectorModalOpen(false)} aria-label="Close" className="text-ink-muted hover:text-ink transition-colors duration-200 p-1 rounded-control"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddInspector} className="p-6 space-y-5 bg-canvas">
              <div>
                <label className="block text-xs font-bold text-ink-muted mb-2">Full Legal Name</label>
                <input required type="text" className="w-full border border-line p-3 rounded-control outline-none focus:border-ink focus:ring-1 focus:ring-info-ink bg-surface text-sm font-medium text-ink" value={newInspector.full_name} onChange={e => setNewInspector({...newInspector, full_name: e.target.value})} placeholder="e.g. Inspector Alpha" />
              </div>
              <div>
                <label className="block text-xs font-bold text-ink-muted mb-2">Contact Number</label>
                <input required type="text" className="w-full border border-line p-3 rounded-control outline-none focus:border-ink focus:ring-1 focus:ring-info-ink bg-surface text-sm font-medium text-ink" value={newInspector.contact_number} onChange={e => setNewInspector({...newInspector, contact_number: e.target.value})} placeholder="0917-123-4567" />
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full bg-ink text-surface text-xs font-bold py-3 rounded-control hover:bg-shell-hover transition-colors duration-200">Save Inspector Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* === MODAL: DISPATCH INSPECTOR TO DETACHMENTS === */}
      {isAssignInspectorModalOpen && inspectorToAssign && isSuperadmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4 transition-colors duration-200">
          <div className="bg-surface rounded-control border border-line shadow-none w-full max-w-md overflow-visible flex flex-col">
            <div className="bg-surface border-b border-line p-5 flex justify-between items-center shrink-0">
              <h3 className="text-base font-bold text-ink tracking-tight flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Dispatch Inspector
              </h3>
              <button onClick={() => setIsAssignInspectorModalOpen(false)} aria-label="Close" className="text-ink-muted hover:text-ink transition-colors duration-200 p-1 rounded-control"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleAssignInspectorToDetachments} className="p-6 space-y-6 overflow-visible bg-canvas">
              <div className="bg-surface p-4 border border-line">
                <p className="text-xs text-ink-muted mb-1">Target Personnel</p>
                <p className="font-bold text-ink text-sm">{inspectorToAssign.full_name}</p>
                <p className="text-[11px] text-ink-muted mt-1">{inspectorToAssign.contact_number || 'No contact number'}</p>
              </div>

              <div className="space-y-5">
                <div className="border-t border-line pt-5">
                  <label className="block text-xs font-bold text-ink-muted mb-2">Deploy to Detachments</label>
                  
                  {/* Selected Detachments Multi-Pill Container */}
                  <div className="flex flex-wrap gap-2 mb-3 min-h-[42px] p-2 bg-surface border border-line">
                    {selectedDetachments.length === 0 && <span className="text-xs text-ink-muted py-1 px-1">No assigned detachments.</span>}
                    {selectedDetachments.map(b => (
                      <span key={b.id} className="flex items-center text-xs font-bold text-ink bg-sunken pl-2 pr-1 py-1 rounded-control border border-line">
                        {b.branch_name}
                        <button type="button" onClick={() => handleRemoveDetachmentFromSelection(b.id)} className="ml-2 text-ink-muted hover:text-ink hover:bg-sunken p-0.5 transition-colors duration-200">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>

                  {/* Multi-Select Detachment Combo-Box */}
                  <div className="relative">
                    <MagnifyingGlass className="w-4 h-4 text-ink-muted absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search and assign detachments..."
                      className="w-full pl-9 pr-4 py-2.5 border border-line rounded-control outline-none focus:border-ink focus:ring-1 focus:ring-info-ink text-sm font-medium text-ink bg-surface"
                      value={detachmentSearch}
                      onChange={(e) => setDetachmentSearch(e.target.value)}
                    />
                    {detachmentSearch && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-surface border border-line max-h-48 overflow-y-auto z-50">
                        {branchOptions
                          .filter(b => b.branch_name.toLowerCase().includes(detachmentSearch.toLowerCase()))
                          .filter(b => !selectedDetachments.find(sd => sd.id === b.id))
                          .map(b => (
                            <button
                              key={b.id}
                              type="button"
                              onClick={() => handleAddDetachmentToSelection(b)}
                              className="w-full text-left px-4 py-3 hover:bg-sunken border-b border-line last:border-0 flex flex-col transition-colors duration-200"
                            >
                              <span className="text-sm font-bold text-ink">{b.branch_name}</span>
                              {b.assigned_inspector_id && (
                                <span className="text-xs text-ink-muted mt-1">
                                  Currently monitored by: {b.inspector?.full_name}
                                </span>
                              )}
                            </button>
                        ))}
                        {branchOptions.filter(b => b.branch_name.toLowerCase().includes(detachmentSearch.toLowerCase()) && !selectedDetachments.find(sd => sd.id === b.id)).length === 0 && (
                            <div className="p-3 text-xs text-ink-muted text-center">No matching detachments available.</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button type="submit" className="w-full bg-ink text-surface text-xs font-bold py-3 rounded-control hover:bg-shell-hover transition-colors duration-200">
                  Confirm Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generate Access Key Modal */}
      {isKeyModalOpen && isSuperadmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4 transition-colors duration-200">
          <div className="bg-surface rounded-control border border-line shadow-none w-full max-w-md overflow-hidden flex flex-col">
            <div className="bg-surface border-b border-line p-5 flex justify-between items-center shrink-0">
              <h3 className="text-base font-bold text-ink tracking-tight flex items-center">
                <Key className="w-4 h-4 mr-2" /> Device Provisioning
              </h3>
              <button onClick={closeKeyModal} aria-label="Close" className="text-ink-muted hover:text-ink transition-colors duration-200 p-1 rounded-control"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 bg-canvas">
              {!newlyGeneratedKey ? (
                <form onSubmit={handleGenerateKey} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-ink-muted mb-2">Inspector's Name</label>
                    <p className="text-[11px] text-ink-muted mb-3">Select the inspector you are generating this key for.</p>
                    <select 
                      required
                      className="w-full border border-line p-3 rounded-control outline-none focus:border-ink focus:ring-1 focus:ring-info-ink text-sm font-medium text-ink bg-surface cursor-pointer" 
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
                    <button type="submit" className="w-full bg-ink text-surface text-xs font-bold py-3 rounded-control hover:bg-shell-hover transition-colors duration-200">
                      Generate Key
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-center space-y-6">
                  <div className="bg-surface text-ink p-4 border border-line">
                    <p className="text-xs font-bold">Key Generated Successfully</p>
                  </div>
                  <p className="text-sm text-ink-muted leading-relaxed">Provide this exact code to <strong className="text-ink">{newKeyAssignee}</strong>. It can only be used once.</p>
                  
                  <div className="bg-surface p-6 border border-line relative group">
                    <p className="text-3xl font-bold text-ink">{newlyGeneratedKey}</p>
                    <button 
                      onClick={() => navigator.clipboard.writeText(newlyGeneratedKey)}
                      className="absolute top-2 right-2 p-2 text-ink-muted hover:text-ink hover:bg-sunken transition-colors duration-200"
                      title="Copy to Clipboard"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="pt-2">
                    <button onClick={closeKeyModal} className="w-full bg-surface border border-line text-ink text-xs font-bold py-3 rounded-control hover:bg-sunken transition-colors duration-200">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4 transition-colors duration-200">
          <div className="bg-surface rounded-control border border-line shadow-none w-full max-w-md overflow-hidden flex flex-col">
            <div className="bg-surface border-b border-danger-ink/20 p-5 flex justify-between items-center shrink-0">
              <h3 className="text-base font-bold text-danger-ink tracking-tight flex items-center">
                <Warning className="w-4 h-4 mr-2" /> Permanent Deletion
              </h3>
              <button onClick={() => { setEntityToDelete(null); setDeleteConfirmText(''); }} aria-label="Close" className="text-ink-muted hover:text-ink transition-colors duration-200 p-1 rounded-control"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleDeleteEntity} className="p-6 space-y-5 bg-canvas">
              <p className="text-ink text-sm leading-relaxed">
                You are about to permanently delete <strong className="text-ink">{entityToDelete.name}</strong>. This action cannot be undone.
              </p>
              
              <div className="bg-danger-bg border border-danger-ink/20 p-4 text-xs text-red-900 text-center">
                Type <strong className="font-bold">DELETE</strong> to execute.
              </div>
              
              <input 
                type="text" 
                required
                className="w-full border border-line p-3 outline-none text-ink bg-surface placeholder-ink-muted focus:border-red-600 focus:ring-1 focus:ring-red-600 font-bold text-center text-sm rounded-control" 
                placeholder="DELETE"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
              />
              
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setEntityToDelete(null); setDeleteConfirmText(''); }} className="flex-1 bg-surface border border-line text-ink text-xs font-bold py-3 rounded-control hover:bg-sunken transition-colors duration-200">
                  Cancel
                </button>
                <button type="submit" disabled={deleteConfirmText !== 'DELETE'} className={`flex-1 text-xs font-bold py-3 rounded-control transition-colors duration-200 text-surface border ${deleteConfirmText === 'DELETE' ? 'bg-red-600 hover:bg-red-700 border-red-700' : 'bg-red-300 border-danger-ink/20 cursor-not-allowed'}`}>
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