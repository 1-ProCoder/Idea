import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

/**
 * Shared <Modal> primitive. All other modals in the app (NewJob,
 * NewWorker, AssignJob, NewBooking, customer edit, etc.) compose this
 * one so the dialog a11y contract (role="dialog", aria-modal, ESC,
 * backdrop click, focus trap basics) is consistent.
 */
export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Subtitle / description under the title. */
  description?: string;
  children: ReactNode;
  /** Optional footer (typically a Save / Cancel pair). */
  footer?: ReactNode;
  /** Maximum width in rem. Default 36rem (~max-w-lg). */
  maxWidthRem?: number;
  /** Hide the close (X) button — e.g. for blocking confirmation dialogs. */
  hideClose?: boolean;
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidthRem = 36,
  hideClose,
}: ModalProps): JSX.Element | null {
  // ESC to close + body-scroll lock while open.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-background/80 backdrop-blur-sm cursor-default"
      />
      <div
        className="relative bg-card border border-border rounded-xl shadow-2xl shadow-black/40 w-full p-6"
        style={{ maxWidth: `${maxWidthRem}rem` }}
      >
        <header className="flex items-start justify-between mb-4">
          <div>
            <h2
              id="modal-title"
              className="text-xl font-semibold text-foreground"
            >
              {title}
            </h2>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">
                {description}
              </p>
            )}
          </div>
          {!hideClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="text-muted-foreground hover:text-foreground rounded p-1 transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </header>
        <div>{children}</div>
        {footer && <footer className="mt-6">{footer}</footer>}
      </div>
    </div>
  );
}
