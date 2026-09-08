'use client';

import { useEffect, useId, useRef } from 'react';
import { X } from '@phosphor-icons/react';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  /* Accepts a node so dialogs can lead with an icon. The accessible name is
   * taken from this element's text, and icons contribute none. */
  title: React.ReactNode;
  size?: 'sm' | 'md' | '2xl' | '3xl';
  tone?: 'default' | 'danger';
  /* One dialog hosts a dropdown that must escape the panel bounds. A prop
   * beats passing a conflicting overflow class and hoping CSS order wins. */
  overflow?: 'hidden' | 'visible';
  /* Extra classes for the panel and header, used by the dialogs that carry
   * print rules. */
  className?: string;
  headerClassName?: string;
  children: React.ReactNode;
};

const SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
} as const;

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Modal({
  open,
  onClose,
  title,
  size = 'md',
  tone = 'default',
  overflow = 'hidden',
  className = '',
  headerClassName = '',
  children,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  /* Callers pass inline arrows, so holding onClose in a ref keeps the effect
   * below keyed on `open` alone. Depending on the callback directly would
   * re-run it on every render and pull focus back to the panel mid-edit. */
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    panel?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !panel) return;

      // Keep Tab inside the dialog rather than letting it walk the page behind.
      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE)
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // The page behind a dialog should not scroll away under it.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  const isDanger = tone === 'danger';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-sm p-4">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`bg-surface border border-line rounded-card w-full ${SIZES[size]} ${
          overflow === 'visible' ? 'overflow-visible' : 'overflow-hidden'
        } flex flex-col outline-none ${className}`}
      >
        <div
          className={`bg-surface border-b p-5 flex justify-between items-center shrink-0 ${
            isDanger ? 'border-danger-ink/20' : 'border-line'
          } ${headerClassName}`}
        >
          <h3
            id={titleId}
            className={`text-base font-bold tracking-tight flex items-center gap-2 ${
              isDanger ? 'text-danger-ink' : 'text-ink'
            }`}
          >
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-ink-muted hover:text-ink transition-colors duration-200 p-1 rounded-control"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
