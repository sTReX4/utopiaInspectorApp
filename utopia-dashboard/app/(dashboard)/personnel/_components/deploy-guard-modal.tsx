'use client';

import { MapPin } from '@phosphor-icons/react';
import Modal from '@/app/components/modal';
import type { BranchOption, Guard } from '../types';
import { LABEL, PRIMARY_ACTION, SELECT } from './form-styles';

type Props = {
  guard: Guard | null;
  branchOptions: BranchOption[];
  selectedBranch: string;
  onSelectBranch: (branch: string) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
};

export default function DeployGuardModal({
  guard, branchOptions, selectedBranch, onSelectBranch, onClose, onSubmit,
}: Props) {
  if (!guard) return null;

  return (
    <Modal open onClose={onClose} title={<><MapPin className="w-4 h-4" /> Deploy Guard</>} size="sm">
      <form onSubmit={onSubmit} className="p-6 space-y-5 bg-canvas">
        <div className="bg-surface p-4 border border-line">
          <p className="text-xs text-ink-muted mb-1">Target Personnel</p>
          <p className="font-bold text-ink text-sm">{guard.guard_name}</p>
          <p className="text-xs text-ink-muted mt-1">LESP: {guard.lesp_number}</p>
        </div>
        <div>
          <label className={LABEL}>Assign Detachment</label>
          <select className={SELECT} value={selectedBranch} onChange={(e) => onSelectBranch(e.target.value)}>
            <option value="UNASSIGNED">-- Floating / Unassigned --</option>
            {branchOptions.map((b, i) => <option key={i} value={b.branch_name}>{b.branch_name}</option>)}
          </select>
        </div>
        <div className="pt-2">
          <button type="submit" className={PRIMARY_ACTION}>Confirm Deployment</button>
        </div>
      </form>
    </Modal>
  );
}
