import { useEffect, useRef, useState } from 'react';
import { WarningOctagon, Eye, EyeSlash } from '@phosphor-icons/react';
import Button from './Button.jsx';
import './DeleteAccountModal.css';

export default function DeleteAccountModal({ isOpen, onClose, onDeleteSuccess }) {
  const modalRef = useRef(null);
  const passwordRef = useRef(null);
  const previousFocus = useRef(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [genericError, setGenericError] = useState(null);

  const deletingRef = useRef(false);
  deletingRef.current = deleting;

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      previousFocus.current = document.activeElement;
      setDeleting(false);
      setPassword('');
      setShowPassword(false);
      setPasswordError(null);
      setGenericError(null);

      // Focus password input on modal open
      setTimeout(() => {
        passwordRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Keyboard handler (separate effect to avoid resetting state on deleting change)
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
      previousFocus.current?.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCancel = () => {
    setPassword('');
    setPasswordError(null);
    setGenericError(null);
    onClose();
  };

  const handleDelete = async () => {
    setDeleting(true);
    setPasswordError(null);
    setGenericError(null);
    try {
      await onDeleteSuccess(password);
      // onDeleteSuccess handles redirect and cleanup
    } catch (err) {
      setDeleting(false);
      if (err?.status === 400 && err?.code === 'INVALID_PASSWORD') {
        setPasswordError('Password is incorrect.');
        // Re-focus the password input for easy correction
        setTimeout(() => passwordRef.current?.focus(), 50);
      } else if (err?.status === 401) {
        setGenericError('Session expired. Please log in again.');
      } else {
        setGenericError('Something went wrong. Please try again.');
      }
    }
  };

  const passwordErrorId = 'delete-modal-password-error';

  return (
    <div className="delete-modal-overlay">
      <div
        ref={modalRef}
        className="delete-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-modal-heading"
        aria-describedby="delete-modal-desc"
      >
        <WarningOctagon size={36} color="var(--color-status-red)" className="delete-modal-icon" />

        <h2 id="delete-modal-heading" className="delete-modal-heading">
          Delete your account?
        </h2>

        <p id="delete-modal-desc" className="delete-modal-body">
          This will permanently delete your account and all your plant data. This cannot be undone.
        </p>

        {/* Password input */}
        <div className="delete-modal-password-group">
          <label htmlFor="delete-modal-password" className="delete-modal-password-label">
            Confirm your password
          </label>
          <div className="delete-modal-password-wrapper">
            <input
              ref={passwordRef}
              id="delete-modal-password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError(null);
              }}
              disabled={deleting}
              className={`delete-modal-password-input${passwordError ? ' delete-modal-password-input--error' : ''}`}
              aria-describedby={passwordError ? passwordErrorId : undefined}
            />
            <button
              type="button"
              className="delete-modal-password-toggle"
              onClick={() => setShowPassword((prev) => !prev)}
              disabled={deleting}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeSlash size={18} color="var(--color-text-secondary)" />
              ) : (
                <Eye size={18} color="var(--color-text-secondary)" />
              )}
            </button>
          </div>
          {passwordError && (
            <span id={passwordErrorId} className="delete-modal-password-error" role="alert">
              {passwordError}
            </span>
          )}
        </div>

        {/* Generic error */}
        {genericError && (
          <div className="delete-modal-error" role="alert">
            {genericError}
          </div>
        )}

        <div className="delete-modal-actions">
          <Button
            variant="secondary"
            onClick={handleCancel}
            disabled={deleting}
            className="delete-modal-cancel"
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            loading={deleting}
            disabled={deleting || !password.trim()}
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
