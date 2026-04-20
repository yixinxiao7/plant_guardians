import { useCallback, useEffect, useRef, useState } from 'react';
import { Warning } from '@phosphor-icons/react';
import { plantShares, ApiError } from '../utils/api.js';
import { useToast } from '../hooks/useToast.jsx';
import './ShareRevokeModal.css';

/**
 * ShareRevokeModal — Sprint 29 / SPEC-023 (Surface 2)
 *
 * Destructive confirmation dialog. Triggered by clicking "Remove share link"
 * on `PlantDetailPage` while the share status is SHARED. Dispatches
 * `DELETE /api/v1/plants/:plantId/share`; on 204 it unmounts and fires a
 * success toast; on any error it keeps the modal open so the user can retry.
 *
 * Accessibility (per SPEC-023):
 *   - role="dialog" aria-modal="true" aria-labelledby=revoke-modal-title
 *   - Focus moves to "Cancel" on open (safer default for destructive modal)
 *   - Tab / Shift+Tab cycle within modal (focus trap)
 *   - Escape triggers Cancel
 *   - Backdrop click is a no-op (explicit Cancel/Remove only)
 *
 * Props:
 *   - isOpen: boolean — modal visibility
 *   - plantId: string — used to fire DELETE
 *   - onSuccess: () => void — called on 204 before the modal unmounts
 *   - onClose: () => void — called when user clicks Cancel or hits Escape
 */
export default function ShareRevokeModal({ isOpen, plantId, onSuccess, onClose }) {
  const { addToast } = useToast();
  const modalRef = useRef(null);
  const cancelBtnRef = useRef(null);
  const triggerRef = useRef(null);
  const [loading, setLoading] = useState(false);

  // Keep a ref in sync so the Escape handler closes only when not loading.
  const loadingRef = useRef(loading);
  loadingRef.current = loading;

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Capture the element that triggered the modal; restore focus on unmount.
  useEffect(() => {
    if (!isOpen) return undefined;

    triggerRef.current = document.activeElement;
    setLoading(false);

    // Focus "Cancel" first per SPEC-023 (safer default for destructive UI).
    const focusTimer = setTimeout(() => {
      cancelBtnRef.current?.focus();
    }, 30);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !loadingRef.current) {
        onCloseRef.current?.();
        return;
      }

      // Focus trap
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll(
          'button:not([disabled])',
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
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
      // Restore focus to the trigger (e.g., "Remove share link" text button).
      // The parent will reassign focus on SHARED → NOT_SHARED transition.
      triggerRef.current?.focus?.();
    };
  }, [isOpen]);

  const handleCancel = useCallback(() => {
    if (loading) return;
    onClose?.();
  }, [loading, onClose]);

  const handleRemove = useCallback(async () => {
    if (loading) return;
    setLoading(true);

    try {
      await plantShares.revoke(plantId);
      // Success — fire toast, let parent transition to NOT_SHARED.
      addToast('Share link removed.', 'success');
      // We intentionally do NOT call setLoading(false) on success — the modal
      // is about to unmount via onSuccess().
      onSuccess?.();
    } catch (err) {
      // Any error class (400/401/403/404/500/network) collapses to the same
      // message per SPEC-023. Keep modal open for retry; restore the button.
      // eslint-disable-next-line no-console
      console.warn(
        '[ShareRevokeModal] DELETE failed:',
        err instanceof ApiError ? `${err.status} ${err.code}` : err,
      );
      addToast('Failed to remove link. Please try again.', 'error');
      setLoading(false);
    }
  }, [loading, plantId, addToast, onSuccess]);

  if (!isOpen) return null;

  return (
    <div
      className="srm-overlay"
      // Backdrop click is deliberately a no-op for destructive confirmations.
      onClick={(e) => e.stopPropagation()}
      data-testid="share-revoke-overlay"
    >
      <div
        ref={modalRef}
        className="srm-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="revoke-modal-title"
      >
        <div className="srm-icon" aria-hidden="true">
          <Warning size={24} color="#B85C38" weight="regular" />
        </div>

        <h2 id="revoke-modal-title" className="srm-title">
          Remove share link?
        </h2>

        <p className="srm-body">
          Anyone with the old link will no longer be able to view this plant.
        </p>

        <div className="srm-actions">
          <button
            ref={cancelBtnRef}
            type="button"
            className="srm-cancel-btn"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="srm-remove-btn"
            onClick={handleRemove}
            disabled={loading}
            aria-busy={loading ? 'true' : 'false'}
            aria-label={loading ? 'Removing share link…' : 'Confirm: remove share link'}
          >
            {loading ? (
              <span className="srm-spinner" aria-hidden="true" />
            ) : (
              'Remove link'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
