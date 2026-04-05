import { useState, useCallback, useRef } from 'react';
import { careHistory } from '../utils/api.js';

const PAGE_LIMIT = 20;

/**
 * Hook for fetching paginated, filterable care history for a single plant.
 * Used by CareHistorySection on the Plant Detail page (SPEC-015 / T-094).
 */
export function usePlantCareHistory(plantId) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [loadMoreError, setLoadMoreError] = useState(null);

  // Track the current request to avoid race conditions
  const requestId = useRef(0);

  const fetchHistory = useCallback(async (careType = 'all') => {
    const id = ++requestId.current;
    setIsLoading(true);
    setError(null);
    setLoadMoreError(null);
    setItems([]);
    setPage(1);
    setFilter(careType);

    try {
      const params = { page: 1, limit: PAGE_LIMIT };
      if (careType !== 'all') params.careType = careType;
      const data = await careHistory.get(plantId, params);

      // Bail if a newer request has been issued
      if (id !== requestId.current) return;

      setItems(data.items || []);
      setTotal(data.total || 0);
      setPage(data.page || 1);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      if (id !== requestId.current) return;
      setError(err.message || 'Failed to load care history.');
    } finally {
      if (id === requestId.current) {
        setIsLoading(false);
      }
    }
  }, [plantId]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || page >= totalPages) return;

    const nextPage = page + 1;
    setIsLoadingMore(true);
    setLoadMoreError(null);

    try {
      const params = { page: nextPage, limit: PAGE_LIMIT };
      if (filter !== 'all') params.careType = filter;
      const data = await careHistory.get(plantId, params);

      setItems(prev => [...prev, ...(data.items || [])]);
      setPage(data.page || nextPage);
      setTotalPages(data.totalPages || 0);
      setTotal(data.total || 0);
    } catch (err) {
      setLoadMoreError(err.message || "Couldn't load more. Try again.");
    } finally {
      setIsLoadingMore(false);
    }
  }, [plantId, page, totalPages, filter, isLoadingMore]);

  const changeFilter = useCallback((careType) => {
    fetchHistory(careType);
  }, [fetchHistory]);

  const retry = useCallback(() => {
    fetchHistory(filter);
  }, [fetchHistory, filter]);

  const hasMore = page < totalPages;

  return {
    items,
    total,
    page,
    totalPages,
    filter,
    isLoading,
    isLoadingMore,
    error,
    loadMoreError,
    hasMore,
    fetchHistory,
    loadMore,
    changeFilter,
    retry,
  };
}
