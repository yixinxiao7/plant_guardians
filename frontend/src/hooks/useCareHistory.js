import { useState, useCallback } from 'react';
import { careActions } from '../utils/api.js';

const PAGE_LIMIT = 20;

export function useCareHistory() {
  const [actions, setActions] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const fetchActions = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    setActions([]);
    setPagination(null);
    try {
      const result = await careActions.list({
        page: 1,
        limit: PAGE_LIMIT,
        ...params,
      });
      setActions(result.data || []);
      setPagination(result.pagination || null);
    } catch (err) {
      setError(err.message || 'Failed to load care history.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async (params = {}) => {
    if (!pagination || loadingMore) return;
    const nextPage = pagination.page + 1;
    setLoadingMore(true);
    try {
      const result = await careActions.list({
        page: nextPage,
        limit: PAGE_LIMIT,
        ...params,
      });
      setActions(prev => [...prev, ...(result.data || [])]);
      setPagination(result.pagination || null);
    } catch (err) {
      setError(err.message || 'Failed to load more actions.');
    } finally {
      setLoadingMore(false);
    }
  }, [pagination, loadingMore]);

  const hasMore = pagination
    ? pagination.total > pagination.page * pagination.limit
    : false;

  const remaining = pagination
    ? Math.max(0, pagination.total - actions.length)
    : 0;

  return {
    actions,
    pagination,
    loading,
    loadingMore,
    error,
    hasMore,
    remaining,
    fetchActions,
    loadMore,
  };
}
