'use client';

import { Copy, Key } from '@phosphor-icons/react';
import Modal from '@/app/components/modal';
import type { Inspector } from '../types';
import { LABEL, PRIMARY_ACTION, SELECT } from './form-styles';

type Props = {
  open: boolean;
  inspectors: Inspector[];
  assignee: string;
  onAssigneeChange: (value: string) => void;
  generatedKey: string | null;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
};

export default function ProvisioningModal({
  open,
  inspectors,
  assignee,
  onAssigneeChange,
  generatedKey,
  onClose,
  onSubmit,
}: Props) {
  if (!open) return null;

  return (
    <Modal open onClose={onClose} title={<><Key className="w-4 h-4" /> Device Provisioning</>} size="md">
      <div className="p-6 bg-canvas">
        {!generatedKey ? (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className={LABEL}>Inspector&apos;s Name</label>
              <p className="text-[11px] text-ink-muted mb-3">
                Select the inspector you are generating this key for.
              </p>
              <select
                required
                className={SELECT}
                value={assignee}
                onChange={(e) => onAssigneeChange(e.target.value)}
              >
                <option value="" disabled>-- Select Inspector --</option>
                {inspectors.map((ins, i) => (
                  <option key={i} value={ins.full_name}>{ins.full_name}</option>
                ))}
              </select>
            </div>
            <div className="pt-2">
              <button type="submit" className={PRIMARY_ACTION}>Generate Key</button>
            </div>
          </form>
        ) : (
          <div className="text-center space-y-6">
            <div className="bg-surface text-ink p-4 border border-line">
              <p className="text-xs font-bold">Key Generated Successfully</p>
            </div>
            <p className="text-sm text-ink-muted leading-relaxed">
              Provide this exact code to <strong className="text-ink">{assignee}</strong>. It can only be used once.
            </p>

            <div className="bg-surface p-6 border border-line relative group">
              {/* The key is an identifier, so it reads in mono like the rest of the data. */}
              <p className="text-3xl font-bold text-ink font-mono">{generatedKey}</p>
              <button
                onClick={() => navigator.clipboard.writeText(generatedKey)}
                className="absolute top-2 right-2 p-2 text-ink-muted hover:text-ink hover:bg-sunken transition-colors duration-200"
                title="Copy to Clipboard"
                aria-label="Copy access key to clipboard"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>

            <div className="pt-2">
              <button
                onClick={onClose}
                className="w-full bg-surface border border-line text-ink text-xs font-bold py-3 rounded-control hover:bg-sunken transition-colors duration-200"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
