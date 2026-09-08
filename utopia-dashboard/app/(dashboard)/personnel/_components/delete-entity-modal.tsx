'use client';

import { Warning } from '@phosphor-icons/react';
import Modal from '@/app/components/modal';
import type { DeleteTarget } from '../types';

type Props = {
  target: DeleteTarget | null;
  confirmText: string;
  onConfirmTextChange: (text: string) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
};

export default function DeleteEntityModal({
  target, confirmText, onConfirmTextChange, onClose, onSubmit,
}: Props) {
  if (!target) return null;

  const armed = confirmText === 'DELETE';

  return (
    <Modal
      open
      onClose={onClose}
      title={<><Warning className="w-4 h-4" /> Danger: Permanent Deletion</>}
      size="md"
      tone="danger"
    >
      <form onSubmit={onSubmit} className="p-6 space-y-5 bg-canvas">
        <p className="text-ink text-sm leading-relaxed">
          You are about to permanently delete <strong className="text-ink">{target.name}</strong>. This action cannot be undone.
        </p>

        <div className="bg-danger-bg border border-danger-ink/20 p-4 text-xs text-danger-ink text-center">
          Type <strong className="font-bold">DELETE</strong> to execute.
        </div>

        <input
          type="text"
          required
          className="w-full border border-line p-3 outline-none text-ink bg-surface placeholder-ink-muted focus:border-danger-ink focus:ring-1 focus:ring-danger-ink font-bold text-center text-sm rounded-control"
          placeholder="DELETE"
          value={confirmText}
          onChange={(e) => onConfirmTextChange(e.target.value)}
        />

        <div className="flex gap-3 pt-4">
          <button type="button" onClick={onClose} className="flex-1 bg-surface border border-line text-ink text-xs font-bold py-3 rounded-control hover:bg-sunken transition-colors duration-200">
            Cancel
          </button>
          <button
            type="submit"
            disabled={!armed}
            className={`flex-1 text-xs font-bold py-3 rounded-control transition-colors duration-200 border ${
              armed
                ? 'bg-danger-ink hover:bg-danger-ink-hover border-danger-ink text-surface'
                : 'bg-sunken border-line text-ink-muted cursor-not-allowed'
            }`}
          >
            Confirm Delete
          </button>
        </div>
      </form>
    </Modal>
  );
}
