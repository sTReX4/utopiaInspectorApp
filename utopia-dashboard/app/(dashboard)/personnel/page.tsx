'use client';

import { useState } from 'react';
import { Lock, MagnifyingGlass, Plus, User, CheckCircle, Warning, XCircle } from '@phosphor-icons/react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/app/context/AuthContext';
import Reveal from '@/app/components/reveal';

import { usePersonnelData } from './use-personnel-data';
import type { BranchOption, DeleteTarget, Guard, Inspector } from './types';

import GuardsTable from './_components/guards-table';
import InspectorsTable from './_components/inspectors-table';
import PendingApprovalsTable from './_components/pending-approvals-table';
import EditGuardModal from './_components/edit-guard-modal';
import EditInspectorModal from './_components/edit-inspector-modal';
import DeployGuardModal from './_components/deploy-guard-modal';
import RegisterGuardModal from './_components/register-guard-modal';
import RegisterInspectorModal from './_components/register-inspector-modal';
import DispatchInspectorModal from './_components/dispatch-inspector-modal';
import DeleteEntityModal from './_components/delete-entity-modal';

export default function PersonnelPage() {
  const { user, role, isLoading: authLoading } = useAuth();
  const isSuperadmin = role === 'superadmin';

  const {
    guards, inspectors, branchOptions, isLoading,
    setGuards, setInspectors, setBranchOptions,
  } = usePersonnelData();

  // --- 2-TIER TAB SYSTEM ---
  const [activeTab, setActiveTab] = useState<'guards' | 'inspectors'>('guards');
  const [searchQuery, setSearchQuery] = useState('');

  // --- GUARD MODALS ---
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newGuard, setNewGuard] = useState({ guard_name: '', lesp_number: '', lesp_expiry_date: '', assigned_branch: '' });

  const [editGuardData, setEditGuardData] = useState<Guard | null>(null);

  const [guardToAssign, setGuardToAssign] = useState<Guard | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string>('');

  // --- INSPECTOR MODALS ---
  const [isAddInspectorModalOpen, setIsAddInspectorModalOpen] = useState(false);
  const [newInspector, setNewInspector] = useState({ full_name: '', contact_number: '', email: '' });

  const [editInspectorData, setEditInspectorData] = useState<Inspector | null>(null);

  const [inspectorToAssign, setInspectorToAssign] = useState<Inspector | null>(null);
  const [selectedDetachments, setSelectedDetachments] = useState<BranchOption[]>([]);
  const [detachmentSearch, setDetachmentSearch] = useState('');

  // --- ONBOARDING QUEUE ---
  const [decidingId, setDecidingId] = useState<string | null>(null);

  const [entityToDelete, setEntityToDelete] = useState<DeleteTarget | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

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
    setEditGuardData(null);
  };

  const handleAssignBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperadmin || !guardToAssign) return;

    const branchToSave = selectedBranch === 'UNASSIGNED' ? null : selectedBranch;
    const { error } = await supabase.from('guards').update({ assigned_branch: branchToSave }).eq('id', guardToAssign.id);

    if (error) return alert("Error deploying guard.");
    setGuards(guards.map(g => g.id === guardToAssign.id ? { ...g, assigned_branch: branchToSave } : g));
    setGuardToAssign(null);
  };

  // --- INSPECTOR LOGIC ---
  const handleAddInspector = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperadmin) return;

    /* A record opened here is pre-registration, not clearance: it carries the
     * HR details but no account. The email is the join key — signing up with
     * it claims this row instead of creating a duplicate, and the sign-up then
     * enters Pending Approvals like any other. */
    const { data, error } = await supabase.from('inspectors').insert([{
        full_name: newInspector.full_name,
        contact_number: newInspector.contact_number.replace(/\D/g, ''),
        email: newInspector.email.trim().toLowerCase(),
        status: 'approved',
        is_active: true,
        approved_at: new Date().toISOString(),
        approved_by: user?.email || 'System Admin'
    }]).select().single();

    if (error) {
      alert("Error registering inspector.");
      console.error(error);
      return;
    }

    setInspectors([...inspectors, data].sort((a, b) => a.full_name.localeCompare(b.full_name)));
    setIsAddInspectorModalOpen(false);
    setNewInspector({ full_name: '', contact_number: '', email: '' });
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
    setEditInspectorData(null);
  };

  const toggleInspectorStatus = async (id: string, currentStatus: boolean) => {
    if (!isSuperadmin) return;
    const { error } = await supabase.from('inspectors').update({ is_active: !currentStatus }).eq('id', id);
    if (!error) {
      setInspectors(inspectors.map(ins => ins.id === id ? { ...ins, is_active: !currentStatus } : ins));
    }
  };

  /* Approvals go through the API route, not the browser client: the write has
   * to clear a server-side superadmin check before the service key flips a
   * flag that unlocks a field device. */
  const handleApprovalDecision = async (inspector: Inspector, decision: 'approve' | 'reject') => {
    if (!isSuperadmin || decidingId) return;

    if (decision === 'reject' && !window.confirm(`Reject the access request from "${inspector.full_name}"?\n\nThey stay locked out of the inspector app.`)) {
      return;
    }

    setDecidingId(inspector.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Your session expired. Sign in again to review approvals.');
        return;
      }

      const response = await fetch('/api/inspectors/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ inspectorId: inspector.id, decision }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.error || 'Could not update the inspector record.');
        return;
      }

      setInspectors(inspectors.map(ins => ins.id === inspector.id ? { ...ins, ...result.inspector } : ins));
    } catch (error) {
      console.error('Approval request failed:', error);
      alert('Could not reach the approval service. Check your connection and retry.');
    } finally {
      setDecidingId(null);
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
    setInspectorToAssign(null);
  };

  const handleDeleteEntity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperadmin || !entityToDelete || deleteConfirmText !== 'DELETE') return;

    const table = entityToDelete.type === 'guard' ? 'guards' : 'inspectors';

    const { error } = await supabase.from(table).delete().eq('id', entityToDelete.id);

    if (error) {
      alert(`Error deleting ${entityToDelete.type}. They may have historical records preventing deletion.`);
      console.error(error);
      return;
    }

    if (entityToDelete.type === 'guard') {
      setGuards(guards.filter(g => g.id !== entityToDelete.id));
    } else {
      setInspectors(inspectors.filter(i => i.id !== entityToDelete.id));
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

  /* Applicants sit in their own queue above the roster, so the roster table
   * only carries records operations has already decided on. */
  const matchesSearch = (i: Inspector) => i.full_name.toLowerCase().includes(searchQuery.toLowerCase());
  const pendingInspectors = inspectors.filter(i => i.status === 'pending' && matchesSearch(i));
  const filteredInspectors = inspectors.filter(i => i.status !== 'pending' && matchesSearch(i));

  if (authLoading) return (
    <div className="flex h-[50vh] items-center justify-center">
      <div className="text-xs text-ink-muted">Verifying Security Clearance...</div>
    </div>
  );

  const primaryAction = 'bg-ink hover:bg-shell-hover text-surface px-5 py-2.5 rounded-control text-xs font-bold flex items-center transition-colors duration-200';
  const lockedAction = 'bg-sunken text-ink-muted px-5 py-2.5 rounded-control text-xs font-bold flex items-center cursor-not-allowed border border-line';

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-line pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">Personnel &amp; Provisioning</h1>
          <p className="text-sm text-ink-muted mt-1">Manage human resources and clear inspectors for field duty.</p>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'guards' && (
            isSuperadmin ? (
              <button onClick={() => setIsAddModalOpen(true)} className={primaryAction}>
                <Plus className="w-4 h-4 mr-2" /> Register Guard
              </button>
            ) : (
              <button disabled className={lockedAction}>
                <Lock className="w-4 h-4 mr-2" /> HR Access Required
              </button>
            )
          )}

          {activeTab === 'inspectors' && (
            isSuperadmin ? (
              <button onClick={() => setIsAddInspectorModalOpen(true)} className={primaryAction}>
                <User className="w-4 h-4 mr-2" /> Register Inspector
              </button>
            ) : (
              <button disabled className={lockedAction}>
                <Lock className="w-4 h-4 mr-2" /> HR Access Required
              </button>
            )
          )}

        </div>
      </div>

      {/* TABS */}
      <div className="flex space-x-8 border-b border-line">
        {([
          ['guards', 'Security Guards'],
          ['inspectors', 'Roving Inspectors'],
        ] as const).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setSearchQuery(''); }}
            aria-current={activeTab === tab ? 'page' : undefined}
            className={`pb-3 text-xs font-bold transition-colors duration-200 whitespace-nowrap ${activeTab === tab ? 'border-b-2 border-ink text-ink' : 'text-ink-muted hover:text-ink border-b-2 border-transparent'}`}
          >
            {label}
            {tab === 'inspectors' && pendingInspectors.length > 0 && (
              <span className="ml-2 inline-flex items-center rounded-control border border-warn-ink/20 bg-warn-bg px-1.5 py-0.5 text-warn-ink">
                {pendingInspectors.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="border border-line bg-surface p-3 flex items-center rounded-control">
        <MagnifyingGlass className="w-4 h-4 text-ink-muted mr-3 ml-2" />
        <input
          type="text"
          aria-label="Search personnel"
          placeholder={
            activeTab === 'guards' ? "Search by guard name or LESP..." :
            "Search by inspector name..."
          }
          className="flex-1 outline-none text-sm font-medium text-ink bg-transparent placeholder-ink-muted"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Onboarding Queue — inspectors held on the mobile lock screen */}
      {activeTab === 'inspectors' && (
        <PendingApprovalsTable
          inspectors={pendingInspectors}
          isLoading={isLoading}
          isSuperadmin={isSuperadmin}
          decidingId={decidingId}
          onDecide={handleApprovalDecision}
        />
      )}

      {/* Main Table Area */}
      <Reveal>
        <div className="border border-line bg-surface rounded-card overflow-x-auto">
          {activeTab === 'guards' && (
            <GuardsTable
              guards={filteredGuards}
              isLoading={isLoading}
              isSuperadmin={isSuperadmin}
              getExpiryStatus={getExpiryStatus}
              onEdit={(guard) => setEditGuardData(guard)}
              onDeploy={(guard) => { setGuardToAssign(guard); setSelectedBranch(guard.assigned_branch || 'UNASSIGNED'); }}
              onDelete={(target) => { setEntityToDelete(target); setDeleteConfirmText(''); }}
            />
          )}

          {activeTab === 'inspectors' && (
            <InspectorsTable
              inspectors={filteredInspectors}
              isLoading={isLoading}
              isSuperadmin={isSuperadmin}
              onEdit={(inspector) => setEditInspectorData(inspector)}
              onAssign={(inspector) => {
                setInspectorToAssign(inspector);
                setSelectedDetachments(branchOptions.filter(b => b.assigned_inspector_id === inspector.id));
                setDetachmentSearch('');
              }}
              onToggleStatus={toggleInspectorStatus}
              onDelete={(target) => { setEntityToDelete(target); setDeleteConfirmText(''); }}
            />
          )}

        </div>
      </Reveal>

      {/* === MODALS ===
        * Each stays behind its own isSuperadmin check so the privilege gate is
        * visible at the call site rather than buried in a component. */}

      {isSuperadmin && (
        <>
          <EditGuardModal
            guard={editGuardData}
            onClose={() => setEditGuardData(null)}
            onChange={setEditGuardData}
            onSubmit={handleUpdateGuard}
          />

          <EditInspectorModal
            inspector={editInspectorData}
            onClose={() => setEditInspectorData(null)}
            onChange={setEditInspectorData}
            onSubmit={handleUpdateInspector}
          />

          <DeployGuardModal
            guard={guardToAssign}
            branchOptions={branchOptions}
            selectedBranch={selectedBranch}
            onSelectBranch={setSelectedBranch}
            onClose={() => setGuardToAssign(null)}
            onSubmit={handleAssignBranch}
          />

          <RegisterGuardModal
            open={isAddModalOpen}
            value={newGuard}
            onChange={setNewGuard}
            branchOptions={branchOptions}
            onClose={() => setIsAddModalOpen(false)}
            onSubmit={handleAddGuard}
          />

          <RegisterInspectorModal
            open={isAddInspectorModalOpen}
            value={newInspector}
            onChange={setNewInspector}
            onClose={() => setIsAddInspectorModalOpen(false)}
            onSubmit={handleAddInspector}
          />

          <DispatchInspectorModal
            inspector={inspectorToAssign}
            branchOptions={branchOptions}
            selectedDetachments={selectedDetachments}
            search={detachmentSearch}
            onSearchChange={setDetachmentSearch}
            onAdd={handleAddDetachmentToSelection}
            onRemove={handleRemoveDetachmentFromSelection}
            onClose={() => setInspectorToAssign(null)}
            onSubmit={handleAssignInspectorToDetachments}
          />

          <DeleteEntityModal
            target={entityToDelete}
            confirmText={deleteConfirmText}
            onConfirmTextChange={setDeleteConfirmText}
            onClose={() => { setEntityToDelete(null); setDeleteConfirmText(''); }}
            onSubmit={handleDeleteEntity}
          />
        </>
      )}

    </div>
  );
}
