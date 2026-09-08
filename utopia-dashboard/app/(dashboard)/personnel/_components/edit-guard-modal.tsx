'use client';

import { PencilSimple } from '@phosphor-icons/react';
import Modal from '@/app/components/modal';
import type { Guard } from '../types';
import { FIELD, LABEL, PRIMARY_ACTION } from './form-styles';

type Props = {
  guard: Guard | null;
  onClose: () => void;
  onChange: (guard: Guard) => void;
  onSubmit: (e: React.FormEvent) => void;
};

export default function EditGuardModal({ guard, onClose, onChange, onSubmit }: Props) {
  if (!guard) return null;

  return (
    <Modal open onClose={onClose} title={<><PencilSimple className="w-4 h-4" /> Edit Guard Profile</>} size="md">
      <form onSubmit={onSubmit} className="p-6 space-y-5 bg-canvas">
        <div>
          <label className={LABEL}>Full Legal Name</label>
          <input required type="text" className={FIELD} value={guard.guard_name} onChange={e => onChange({ ...guard, guard_name: e.target.value })} />
        </div>
        <div>
          <label className={LABEL}>LESP License Number</label>
          <input required type="text" className={FIELD} value={guard.lesp_number} onChange={e => onChange({ ...guard, lesp_number: e.target.value })} />
        </div>
        <div>
          <label className={LABEL}>LESP Expiry Date</label>
          <input required type="date" className={`${FIELD} transition-colors duration-200`} value={guard.lesp_expiry_date} onChange={e => onChange({ ...guard, lesp_expiry_date: e.target.value })} />
        </div>
        <div className="pt-2">
          <button type="submit" className={PRIMARY_ACTION}>Save Changes</button>
        </div>
      </form>
    </Modal>
  );
}
