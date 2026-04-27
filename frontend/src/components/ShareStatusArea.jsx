import { useCallback, useRef, useState } from 'react';
import { useShareStatus } from '../hooks/useShareStatus.js';
import { useToast } from '../hooks/useToast.jsx';
import ShareButton from './ShareButton.jsx';
import ShareRevokeModal from './ShareRevokeModal.jsx';
import ClipboardFallbackModal from './ClipboardFallbackModal.jsx';
import './ShareStatusArea.css';

/**
 * ShareStatusArea — Sprint 29 / SPEC-023 (Surface 1)
 *
 * Renders the share action area on `PlantDetailPage`. On mount fetches
 * `GET /api/v1/plants/:plantId/share`; transitions through the SPEC-023
 * state machine and renders one of:
 *
 *   LOADING     → shimmering skeleton pill (140×36)
 *   SHARED      → "Copy link" secondary button + "Remove share link" ghost link
 *   NOT_SHARED  → original <ShareButton /> (Sprint 28 behavior unchanged)
 *
 * Non-404 errors degrade to NOT_SHARED (no error toast) per SPEC-023.
 *
 * Props:
 *   - plantId: string (required) — UUID of the plant being viewed
 */
export default function ShareStatusArea({ plantId }) {
  const { addToast } = useToast();
  const {
    status,
    shareUrl,
    setShared,
    setNotShared,
    isLoading,
    isShared,
    isNotShared,
  } = useShareStatus(plantId);

  const [copying, setCopying] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [fallbackUrl, setFallbackUrl] = useState(null);
  const shareTriggerRef = useRef(null);

  // "Copy link" handler — uses the share_url already in memory; no new POST.
  const handleCopyLink = useCallback(async () => {
    if (!shareUrl || copying) return;
    setCopying(true);

    try {
      const clipboard =
        typeof navigator !== 'undefined' ? navigator.clipboard : undefined;

      if (clipboard && typeof clipboard.writeText === 'function') {
        try {
          await clipboard.writeText(shareUrl);
          addToast('Link copied!', 'success');
        } catch {
          // Permission failure — surface manual-copy modal instead.
          setFallbackUrl(shareUrl);
        }
      } else {
        setFallbackUrl(shareUrl);
      }
    } finally {
      setCopying(false);
    }
  }, [shareUrl, copying, addToast]);

  const handleOpenRevoke = useCallback(() => {
    if (copying) return;
    setRevokeOpen(true);
  }, [copying]);

  const handleRevokeSuccess = useCallback(() => {
    setRevokeOpen(false);
    setNotShared();
    // SPEC-023: return focus to the "Share" button after transition.
    requestAnimationFrame(() => {
      shareTriggerRef.current?.querySelector?.('button')?.focus?.();
    });
  }, [setNotShared]);

  const handleRevokeClose = useCallback(() => {
    setRevokeOpen(false);
  }, []);

  // SPEC-022 parity: once the user generates a share via <ShareButton/>, flip
  // state to SHARED so the next render shows Copy + Remove without a re-fetch.
  const handleShareSuccess = useCallback(
    (newUrl) => {
      if (newUrl) setShared(newUrl);
    },
    [setShared],
  );

  if (isLoading) {
    return (
      <div
        className="ssa-root ssa-root--loading"
        aria-busy="true"
        aria-label="Loading share status"
      >
        <div className="ssa-skeleton" />
      </div>
    );
  }

  if (isShared) {
    return (
      <div className="ssa-root ssa-root--shared">
        <button
          type="button"
          className="ssa-copy-btn"
          onClick={handleCopyLink}
          disabled={copying}
          aria-busy={copying ? 'true' : 'false'}
          aria-label="Copy plant share link"
        >
          {copying ? (
            <span className="ssa-copy-spinner" aria-hidden="true" />
          ) : (
            'Copy link'
          )}
        </button>
        <button
          type="button"
          className="ssa-revoke-link"
          onClick={handleOpenRevoke}
          disabled={copying}
          aria-label="Remove share link for this plant"
        >
          Remove share link
        </button>

        <ShareRevokeModal
          isOpen={revokeOpen}
          plantId={plantId}
          onSuccess={handleRevokeSuccess}
          onClose={handleRevokeClose}
        />

        {fallbackUrl && (
          <ClipboardFallbackModal
            shareUrl={fallbackUrl}
            onClose={() => setFallbackUrl(null)}
          />
        )}
      </div>
    );
  }

  // NOT_SHARED / ERROR: render original Sprint 28 share icon button.
  // ERROR state is coalesced into NOT_SHARED by `useShareStatus` per SPEC-023.
  return (
    <div className="ssa-root ssa-root--unshared" ref={shareTriggerRef}>
      <ShareButton plantId={plantId} onSuccess={handleShareSuccess} />
      {/* isNotShared is always true here — kept for future diagnostics */}
      {isNotShared ? null : null}
    </div>
  );
}
