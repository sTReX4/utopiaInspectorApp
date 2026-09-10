'use client';

import { User } from '@phosphor-icons/react';
import Modal from '@/app/components/modal';
import { FIELD, LABEL, PRIMARY_ACTION } from './form-styles';

export type NewInspector = { full_name: string; contact_number: string; email: string };

type Props = {
  open: boolean;
  value: NewInspector;
  onChange: (value: NewInspector) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
};

export default function RegisterInspectorModal({ open, value, onChange, onClose, onSubmit }: Props) {
  if (!open) return null;

  return (
    <Modal open onClose={onClose} title={<><User className="w-4 h-4" /> Register Field Inspector</>} size="md">
      <form onSubmit={onSubmit} className="p-6 space-y-5 bg-canvas">
        <div>
          <label className={LABEL}>Full Legal Name</label>
          <input required type="text" className={FIELD} value={value.full_name} onChange={e => onChange({ ...value, full_name: e.target.value })} placeholder="e.g. Inspector Alpha" />
        </div>
        <div>
          <label className={LABEL}>Contact Number</label>
          <input required type="text" className={FIELD} value={value.contact_number} onChange={e => onChange({ ...value, contact_number: e.target.value })} placeholder="09171234567" />
        </div>
        <div>
          <label className={LABEL}>Sign-Up Email</label>
          <input required type="email" className={FIELD} value={value.email} onChange={e => onChange({ ...value, email: e.target.value })} placeholder="inspector@example.com" />
          {/* This is the join key. When the inspector signs up with this
              address the app claims this record instead of opening a second
              one, so it has to be the address they will actually use. */}
          <p className="text-xs text-ink-muted mt-2 leading-relaxed">
            The address this inspector will register with. Their sign-up claims this record
            rather than creating a duplicate — they will still appear in Pending Approvals for
            you to clear.
          </p>
        </div>
        <div className="pt-2">
          <button type="submit" className={PRIMARY_ACTION}>Save Inspector Record</button>
        </div>
      </form>
    </Modal>
  );
}
