import { useCallback, useEffect, useState } from 'react';
import { plantShares } from '../utils/api.js';

/**
 * useShareStatus — Sprint 29 / SPEC-023
 *
 * Tracks the share status for a single plant on `PlantDetailPage`. On mount
 * (or when `plantId` changes) it fires `GET /api/v1/plants/:plantId/share`
 * and transitions through the state machine described in SPEC-023:
 *
 *     LOADING  →  (200)       →  SHARED        (stores share_url)
 *              →  (404)       →  NOT_SHARED
 *              →  (any error) →  NOT_SHARED    (safe degradation)
 *
 * Returns:
 *   - status: 'loading' | 'shared' | 'not_shared'
 *   - shareUrl: string | null
 *   - setNotShared(): helper used by `ShareRevokeModal` after a successful
 *                     DELETE to animate the area back to the original state.
 *   - setShared(url): helper used by the legacy Share button so that once
 *                     the user generates a share, the area flips to SHARED
 *                     without requiring a re-fetch.
 */
const STATUS = Object.freeze({
  LOADING: 'loading',
  SHARED: 'shared',
  NOT_SHARED: 'not_shared',
});

export function useShareStatus(plantId) {
  const [status, setStatus] = useState(STATUS.LOADING);
  const [shareUrl, setShareUrl] = useState(null);

  useEffect(() => {
    let cancelled = false;

    // Reset to LOADING whenever the plant changes so the skeleton shows again.
    setStatus(STATUS.LOADING);
    setShareUrl(null);

    if (!plantId) {
      setStatus(STATUS.NOT_SHARED);
      return undefined;
    }

    plantShares
      .getStatus(plantId)
      .then((data) => {
        if (cancelled) return;
        if (data && data.share_url) {
          setShareUrl(data.share_url);
          setStatus(STATUS.SHARED);
        } else {
          setShareUrl(null);
          setStatus(STATUS.NOT_SHARED);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        // Safe degradation per SPEC-023 — log quietly, fall back to NOT_SHARED.
        // eslint-disable-next-line no-console
        console.warn('[useShareStatus] GET /share failed:', err);
        setShareUrl(null);
        setStatus(STATUS.NOT_SHARED);
      });

    return () => {
      cancelled = true;
    };
  }, [plantId]);

  const setNotShared = useCallback(() => {
    setShareUrl(null);
    setStatus(STATUS.NOT_SHARED);
  }, []);

  const setShared = useCallback((url) => {
    if (!url) return;
    setShareUrl(url);
    setStatus(STATUS.SHARED);
  }, []);

  return {
    status,
    shareUrl,
    setNotShared,
    setShared,
    isLoading: status === STATUS.LOADING,
    isShared: status === STATUS.SHARED,
    isNotShared: status === STATUS.NOT_SHARED,
  };
}

useShareStatus.STATUS = STATUS;
