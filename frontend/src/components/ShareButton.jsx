import { useState, useCallback } from 'react';
import { ShareNetwork } from '@phosphor-icons/react';
import { plantShares } from '../utils/api.js';
import { useToast } from '../hooks/useToast.jsx';
import ClipboardFallbackModal from './ClipboardFallbackModal.jsx';
import './ShareButton.css';

/**
 * ShareButton — Sprint 28 / SPEC-022
 *
 * Icon button that generates (or retrieves — idempotent) a shareable link
 * for a plant and copies it to the clipboard.
 *
 * Props:
 *   - plantId: string (required)
 *   - className?: string
 *   - onSuccess?: (shareUrl: string) => void
 *   - onError?: (error: Error) => void
 */
export default function ShareButton({ plantId, className = '', onSuccess, onError }) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fallbackUrl, setFallbackUrl] = useState(null);

  const handleClick = useCallback(async () => {
    if (loading) return;
    setLoading(true);

    try {
      const data = await plantShares.create(plantId);
      const shareUrl = data?.share_url;

      if (!shareUrl) {
        throw new Error('Missing share_url in response');
      }

      // Attempt to copy via clipboard API. Fall back to a manual-copy modal
      // when the API is unavailable (non-HTTPS, older browsers) or throws.
      const clipboard =
        typeof navigator !== 'undefined' ? navigator.clipboard : undefined;

      if (clipboard && typeof clipboard.writeText === 'function') {
        try {
          await clipboard.writeText(shareUrl);
          addToast('Link copied!', 'success');
          if (onSuccess) onSuccess(shareUrl);
        } catch {
          // Permission or transient failure — open fallback modal so the
          // user can copy manually instead of losing the URL.
          setFallbackUrl(shareUrl);
          if (onSuccess) onSuccess(shareUrl);
        }
      } else {
        setFallbackUrl(shareUrl);
        if (onSuccess) onSuccess(shareUrl);
      }
    } catch (err) {
      addToast('Failed to generate link. Please try again.', 'error');
      if (onError) onError(err);
    } finally {
      setLoading(false);
    }
  }, [loading, plantId, addToast, onSuccess, onError]);

  return (
    <>
      <button
        type="button"
        className={`share-btn ${className}`}
        onClick={handleClick}
        disabled={loading}
        aria-busy={loading ? 'true' : 'false'}
        aria-label={loading ? 'Generating share link…' : 'Share plant'}
        title="Share"
      >
        {loading ? (
          <span className="share-btn-spinner" aria-hidden="true" />
        ) : (
          <ShareNetwork size={20} weight="regular" aria-hidden="true" />
        )}
      </button>

      {fallbackUrl && (
        <ClipboardFallbackModal
          shareUrl={fallbackUrl}
          onClose={() => setFallbackUrl(null)}
        />
      )}
    </>
  );
}
