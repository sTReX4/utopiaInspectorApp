'use client';

import { Lock, MapPin, PencilSimple, Trash } from '@phosphor-icons/react';
import type { Guard, DeleteTarget } from '../types';

type ExpiryStatus = {
  label: string;
  color: string;
  icon: React.ComponentType<{ weight?: 'fill'; className?: string }>;
};

type Props = {
  guards: Guard[];
  isLoading: boolean;
  isSuperadmin: boolean;
  getExpiryStatus: (dateString: string) => ExpiryStatus;
  onEdit: (guard: Guard) => void;
  onDeploy: (guard: Guard) => void;
  onDelete: (target: DeleteTarget) => void;
};

export default function GuardsTable({
  guards,
  isLoading,
  isSuperadmin,
  getExpiryStatus,
  onEdit,
  onDeploy,
  onDelete,
}: Props) {
  return (
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
        ) : guards.length === 0 ? (
          <tr><td colSpan={6} className="p-12 text-center text-ink-muted text-xs">No guard records found.</td></tr>
        ) : (
          guards.map((guard) => {
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
                        onClick={() => onEdit(guard)}
                        className="p-1.5 text-ink-muted hover:text-ink hover:bg-sunken rounded-control transition-colors duration-200"
                        title="Edit Guard Details"
                      >
                        <PencilSimple className="w-4 h-4" />
                      </button>
                      <button onClick={() => onDeploy(guard)} className="p-1.5 text-ink-muted hover:text-ink hover:bg-sunken rounded-control transition-colors duration-200" title="Deploy to Detachment">
                        <MapPin className="w-4 h-4" />
                      </button>
                      <button onClick={() => onDelete({ id: guard.id, name: guard.guard_name, type: 'guard' })} className="p-1.5 text-ink-muted hover:text-danger-ink hover:bg-danger-bg rounded-control transition-colors duration-200" title="Delete Guard">
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
  );
}
