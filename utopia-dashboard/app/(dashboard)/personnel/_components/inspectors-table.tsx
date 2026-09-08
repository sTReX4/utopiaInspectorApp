'use client';

import { Lock, MapPin, PencilSimple, Power, Prohibit, Trash } from '@phosphor-icons/react';
import type { Inspector, DeleteTarget } from '../types';

type Props = {
  inspectors: Inspector[];
  isLoading: boolean;
  isSuperadmin: boolean;
  onEdit: (inspector: Inspector) => void;
  onAssign: (inspector: Inspector) => void;
  onToggleStatus: (id: string, currentStatus: boolean) => void;
  onDelete: (target: DeleteTarget) => void;
};

export default function InspectorsTable({
  inspectors,
  isLoading,
  isSuperadmin,
  onEdit,
  onAssign,
  onToggleStatus,
  onDelete,
}: Props) {
  return (
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
        ) : inspectors.length === 0 ? (
          <tr><td colSpan={6} className="p-12 text-center text-ink-muted text-xs">No inspectors found.</td></tr>
        ) : (
          inspectors.map((inspector) => (
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
                      onClick={() => onEdit(inspector)}
                      className="p-1.5 text-ink-muted hover:text-ink hover:bg-sunken rounded-control transition-colors duration-200"
                      title="Edit Inspector Details"
                    >
                      <PencilSimple className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onAssign(inspector)}
                      className="p-1.5 text-ink-muted hover:text-ink hover:bg-sunken rounded-control transition-colors duration-200"
                      title="Assign to Detachments"
                    >
                      <MapPin className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onToggleStatus(inspector.id, inspector.is_active)}
                      className={`p-1.5 rounded-control transition-colors duration-200 ${inspector.is_active ? 'text-ink-muted hover:text-danger-ink hover:bg-danger-bg' : 'text-ink-muted hover:text-ink hover:bg-sunken'}`}
                      title={inspector.is_active ? "Deactivate Inspector" : "Reactivate Inspector"}
                    >
                      {inspector.is_active ? <Prohibit className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => onDelete({ id: inspector.id, name: inspector.full_name, type: 'inspector' })}
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
  );
}
