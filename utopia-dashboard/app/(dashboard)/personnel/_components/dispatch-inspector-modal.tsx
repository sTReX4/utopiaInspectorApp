'use client';

import { MagnifyingGlass, MapPin, X } from '@phosphor-icons/react';
import Modal from '@/app/components/modal';
import type { BranchOption, Inspector } from '../types';
import { LABEL, PRIMARY_ACTION } from './form-styles';

type Props = {
  inspector: Inspector | null;
  branchOptions: BranchOption[];
  selectedDetachments: BranchOption[];
  search: string;
  onSearchChange: (value: string) => void;
  onAdd: (branch: BranchOption) => void;
  onRemove: (branchId: string) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
};

export default function DispatchInspectorModal({
  inspector,
  branchOptions,
  selectedDetachments,
  search,
  onSearchChange,
  onAdd,
  onRemove,
  onClose,
  onSubmit,
}: Props) {
  if (!inspector) return null;

  /* The filter ran twice inline: once to render the list and once more to
   * decide whether the empty state should show. */
  const matches = branchOptions
    .filter((b) => b.branch_name.toLowerCase().includes(search.toLowerCase()))
    .filter((b) => !selectedDetachments.find((sd) => sd.id === b.id));

  return (
    <Modal
      open
      onClose={onClose}
      title={<><MapPin className="w-4 h-4" /> Dispatch Inspector</>}
      size="md"
      overflow="visible"
    >
      <form onSubmit={onSubmit} className="p-6 space-y-6 overflow-visible bg-canvas">
        <div className="bg-surface p-4 border border-line">
          <p className="text-xs text-ink-muted mb-1">Target Personnel</p>
          <p className="font-bold text-ink text-sm">{inspector.full_name}</p>
          <p className="text-[11px] text-ink-muted mt-1">{inspector.contact_number || 'No contact number'}</p>
        </div>

        <div className="space-y-5">
          <div className="border-t border-line pt-5">
            <label className={LABEL}>Deploy to Detachments</label>

            {/* Selected Detachments Multi-Pill Container */}
            <div className="flex flex-wrap gap-2 mb-3 min-h-[42px] p-2 bg-surface border border-line">
              {selectedDetachments.length === 0 && (
                <span className="text-xs text-ink-muted py-1 px-1">No assigned detachments.</span>
              )}
              {selectedDetachments.map((b) => (
                <span key={b.id} className="flex items-center text-xs font-bold text-ink bg-sunken pl-2 pr-1 py-1 rounded-control border border-line">
                  {b.branch_name}
                  <button
                    type="button"
                    aria-label={`Remove ${b.branch_name}`}
                    onClick={() => onRemove(b.id)}
                    className="ml-2 text-ink-muted hover:text-ink hover:bg-sunken p-0.5 transition-colors duration-200"
                  >
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
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
              />
              {search && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-surface border border-line max-h-48 overflow-y-auto z-50">
                  {matches.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => onAdd(b)}
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
                  {matches.length === 0 && (
                    <div className="p-3 text-xs text-ink-muted text-center">No matching detachments available.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="pt-2">
          <button type="submit" className={PRIMARY_ACTION}>Confirm Dispatch</button>
        </div>
      </form>
    </Modal>
  );
}
