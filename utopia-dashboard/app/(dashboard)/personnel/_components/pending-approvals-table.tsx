'use client';

import { CheckCircle, Lock, UserPlus, XCircle } from '@phosphor-icons/react';
import type { Inspector } from '../types';

type Props = {
  inspectors: Inspector[];
  isLoading: boolean;
  isSuperadmin: boolean;
  /* The id currently being written, so only that row's buttons go quiet. */
  decidingId: string | null;
  onDecide: (inspector: Inspector, decision: 'approve' | 'reject') => void;
};

/* Inspectors who signed up on the mobile app and are sitting on the
 * "Waiting for Operations Approval" screen until someone here clears them. */
export default function PendingApprovalsTable({
  inspectors,
  isLoading,
  isSuperadmin,
  decidingId,
  onDecide,
}: Props) {
  if (isLoading || inspectors.length === 0) return null;

  return (
    <div className="border border-warn-ink/20 bg-warn-bg rounded-card overflow-hidden">
      <div className="flex items-center justify-between gap-4 border-b border-warn-ink/20 p-4">
        <div className="flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-warn-ink" />
          <h2 className="text-sm font-bold tracking-tight text-warn-ink">Pending Approvals</h2>
        </div>
        <span className="text-xs font-bold text-warn-ink">
          {inspectors.length} awaiting clearance
        </span>
      </div>

      <div className="overflow-x-auto bg-surface">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-canvas border-b border-line text-xs text-ink-muted">
              <th className="p-4 font-bold border-r border-line">Applicant Name</th>
              <th className="p-4 font-bold border-r border-line">Contact Number</th>
              <th className="p-4 font-bold border-r border-line">Sign-Up Email</th>
              <th className="p-4 font-bold border-r border-line">Requested</th>
              <th className="p-4 font-bold text-right">Decision</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {inspectors.map((inspector) => {
              const isDeciding = decidingId === inspector.id;

              return (
                <tr key={inspector.id} className="transition-colors duration-200 hover:bg-sunken">
                  <td className="p-4 text-sm font-bold text-ink border-r border-line">{inspector.full_name}</td>
                  <td className="p-4 text-xs text-ink-muted border-r border-line">{inspector.contact_number || 'N/A'}</td>
                  <td className="p-4 text-xs font-mono text-ink-muted border-r border-line">{inspector.email || 'N/A'}</td>
                  <td className="p-4 text-xs font-mono text-ink-muted border-r border-line">
                    {new Date(inspector.created_at).toLocaleString()}
                  </td>
                  <td className="p-4 text-right">
                    {isSuperadmin ? (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => onDecide(inspector, 'approve')}
                          disabled={isDeciding}
                          className="inline-flex items-center gap-1.5 bg-ink text-surface px-3 py-1.5 rounded-control text-xs font-bold hover:bg-shell-hover transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          title={`Approve ${inspector.full_name} for field duty`}
                        >
                          <CheckCircle className="w-4 h-4" />
                          {isDeciding ? 'Working…' : 'Approve'}
                        </button>
                        <button
                          onClick={() => onDecide(inspector, 'reject')}
                          disabled={isDeciding}
                          className="inline-flex items-center gap-1.5 border border-line bg-surface text-ink-muted px-3 py-1.5 rounded-control text-xs font-bold hover:text-danger-ink hover:bg-danger-bg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          title={`Reject ${inspector.full_name}'s access request`}
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-muted">
                        <Lock className="w-4 h-4" /> Approval Restricted
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
