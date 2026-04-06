import { useEffect, useRef, useState } from 'react';
import { Warning, X } from '@phosphor-icons/react';
import './DeleteAccountModal.css';

export default function DeleteAccountModal({ isOpen, onClose, onConfirmDelete }) {
  const modalRef = useRef(null);
  const inputRef = useRef(null);
  const triggerRef = useRef(null);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  const deletingRef = useRef(false);
  deletingRef.current = deleting;

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const isConfirmEnabled = confirmText === 'DELETE';

  // Store the trigger element that opened the modal
  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement;
      setConfirmText('');
      setDeleting(false);
      setError(null);

      // Focus the confirmation input on open
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Keyboard handler
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !deletingRef.current) {
        onCloseRef.current();
        return;
      }

      // Focus trap
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll(
          'input:not([disabled]), button:not([disabled])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      triggerRef.current?.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCancel = () => {
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (deleting) return;
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!isConfirmEnabled || deleting) return;
    setDeleting(true);
    setError(null);
    try {
      await onConfirmDelete();
      // onConfirmDelete handles redirect and cleanup
    } catch {
      setDeleting(false);
      setError('Could not delete your account. Please try again.');
    }
  };

  return (
    <div
      className="dam-overlay"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="dam-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
      >
        {/* Header */}
        <div className="dam-header">
          <h2 id="delete-modal-title" className="dam-title">Delete your account?</h2>
          <button
            className="dam-close"
            onClick={handleCancel}
            disabled={deleting}
            aria-label="Close dialog"
          >
            <X size={20} color="var(--color-text-secondary)" />
          </button>
        </div>

        {/* Body */}
        <div className="dam-body">
          <p className="dam-intro">This will permanently delete:</p>
          <ul className="dam-list">
            <li>Your account and profile</li>
            <li>All your plants</li>
            <li>All care history and notes</li>
            <li>All care schedules and reminders</li>
          </ul>
          <p className="dam-warning">This action cannot be undone.</p>

          {/* Confirmation input */}
          <label className="dam-input-label" htmlFor="dam-confirm-input">
            To confirm, type DELETE below:
          </label>
          <input
            ref={inputRef}
            id="dam-confirm-input"
            type="text"
            className="dam-input"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            disabled={deleting}
            aria-label="Type DELETE to confirm"
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
            placeholder="DELETE"
          />

          {/* Inline error */}
          {error && (
            <p className="dam-error" role="alert">
              <Warning size={14} color="var(--color-status-red)" aria-hidden="true" />
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="dam-footer">
          <button
            className="dam-cancel-btn"
            onClick={handleCancel}
            disabled={deleting}
          >
            Cancel
          </button>
          <button
            className={`dam-confirm-btn${isConfirmEnabled && !deleting ? '' : ' dam-confirm-btn--disabled'}`}
            onClick={handleDelete}
            disabled={!isConfirmEnabled || deleting}
            aria-disabled={!isConfirmEnabled}
          >
            {deleting ? (
              <>
                <span className="dam-spinner" aria-hidden="true" />
                Deleting…
              </>
            ) : (
              'Delete my account'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
