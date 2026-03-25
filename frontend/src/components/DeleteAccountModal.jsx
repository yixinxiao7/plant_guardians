import { useEffect, useRef, useState } from 'react';
import { WarningOctagon } from '@phosphor-icons/react';
import Button from './Button.jsx';
import './DeleteAccountModal.css';

export default function DeleteAccountModal({ isOpen, onCancel, onConfirm }) {
  const modalRef = useRef(null);
  const previousFocus = useRef(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      previousFocus.current = document.activeElement;
      setDeleting(false);
      setError(null);

      // Focus Cancel button (first button in the modal — safest default)
      setTimeout(() => {
        const firstBtn = modalRef.current?.querySelector('button');
        firstBtn?.focus();
      }, 50);

      const handleKeyDown = (e) => {
        if (e.key === 'Escape' && !deleting) {
          onCancel();
          return;
        }

        // Focus trap
        if (e.key === 'Tab' && modalRef.current) {
          const focusable = modalRef.current.querySelectorAll(
            'button:not([disabled])'
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
        previousFocus.current?.focus();
      };
    }
  }, [isOpen, onCancel, deleting]);

  if (!isOpen) return null;

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await onConfirm();
      // onConfirm handles redirect and cleanup
    } catch (err) {
      setDeleting(false);
      if (err?.status === 401) {
        setError('Session expired. Please log in again.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    }
  };

  return (
    <div className="delete-modal-overlay">
      <div
        ref={modalRef}
        className="delete-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-modal-heading"
        aria-describedby="delete-modal-body"
      >
        <WarningOctagon size={36} color="#B85C38" className="delete-modal-icon" />

        <h2 id="delete-modal-heading" className="delete-modal-heading">
          Delete your account?
        </h2>

        <p id="delete-modal-body" className="delete-modal-body">
          This will permanently delete your account and all your plants. This cannot be undone. Are you sure?
        </p>

        {error && (
          <div className="delete-modal-error" role="alert">
            {error}
          </div>
        )}

        <div className="delete-modal-actions">
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={deleting}
            className="delete-modal-cancel"
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            loading={deleting}
            disabled={deleting}
            className="delete-modal-confirm"
            aria-busy={deleting}
            aria-label={deleting ? 'Deleting account, please wait' : 'Delete my account'}
          >
            Delete my account
          </Button>
        </div>
      </div>
    </div>
  );
}
