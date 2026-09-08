'use client';

import { User } from '@phosphor-icons/react';
import Modal from '@/app/components/modal';
import type { BranchOption } from '../types';
import { FIELD, LABEL, PRIMARY_ACTION, SELECT } from './form-styles';

export type NewGuard = {
  guard_name: string;
  lesp_number: string;
  lesp_expiry_date: string;
  assigned_branch: string;
};

type Props = {
  open: boolean;
  value: NewGuard;
  onChange: (value: NewGuard) => void;
  branchOptions: BranchOption[];
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
};

export default function RegisterGuardModal({
  open, value, onChange, branchOptions, onClose, onSubmit,
}: Props) {
  if (!open) return null;

  return (
    <Modal open onClose={onClose} title={<><User className="w-4 h-4" /> Register Security Guard</>} size="md">
      <form onSubmit={onSubmit} className="p-6 space-y-5 bg-canvas">
        <div>
          <label className={LABEL}>Full Legal Name</label>
          <input required type="text" className={FIELD} value={value.guard_name} onChange={e => onChange({ ...value, guard_name: e.target.value })} placeholder="e.g. Dela Cruz, Juan" />
        </div>
        <div>
          <label className={LABEL}>LESP License Number</label>
          <input required type="text" className={FIELD} value={value.lesp_number} onChange={e => onChange({ ...value, lesp_number: e.target.value })} placeholder="LESP-12345" />
        </div>
        <div>
          <label className={LABEL}>LESP Expiry Date</label>
          <input required type="date" className={`${FIELD} transition-colors duration-200`} value={value.lesp_expiry_date} onChange={e => onChange({ ...value, lesp_expiry_date: e.target.value })} />
        </div>
        <div>
          <label className={LABEL}>Initial Assignment</label>
          <select className={SELECT} value={value.assigned_branch} onChange={(e) => onChange({ ...value, assigned_branch: e.target.value })}>
            <option value="UNASSIGNED">-- Floating / Unassigned --</option>
            {branchOptions.map((b, i) => <option key={i} value={b.branch_name}>{b.branch_name}</option>)}
          </select>
        </div>
        <div className="pt-2">
          <button type="submit" className={PRIMARY_ACTION}>Save Guard Record</button>
        </div>
      </form>
    </Modal>
  );
}
