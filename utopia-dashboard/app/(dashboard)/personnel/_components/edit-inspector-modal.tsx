'use client';

import { PencilSimple } from '@phosphor-icons/react';
import Modal from '@/app/components/modal';
import type { Inspector } from '../types';
import { FIELD, LABEL, PRIMARY_ACTION } from './form-styles';

type Props = {
  inspector: Inspector | null;
  onClose: () => void;
  onChange: (inspector: Inspector) => void;
  onSubmit: (e: React.FormEvent) => void;
};

export default function EditInspectorModal({ inspector, onClose, onChange, onSubmit }: Props) {
  if (!inspector) return null;

  return (
    <Modal open onClose={onClose} title={<><PencilSimple className="w-4 h-4" /> Edit Inspector Profile</>} size="md">
      <form onSubmit={onSubmit} className="p-6 space-y-5 bg-canvas">
        <div>
          <label className={LABEL}>Full Legal Name</label>
          <input required type="text" className={FIELD} value={inspector.full_name} onChange={e => onChange({ ...inspector, full_name: e.target.value })} />
        </div>
        <div>
          <label className={LABEL}>Contact Number</label>
          <input required type="text" className={FIELD} value={inspector.contact_number || ''} onChange={e => onChange({ ...inspector, contact_number: e.target.value })} />
        </div>
        <div className="pt-2">
          <button type="submit" className={PRIMARY_ACTION}>Save Changes</button>
        </div>
      </form>
    </Modal>
  );
}
