import { useState, useCallback, useRef } from 'react';
import { careDue, careActions } from '../utils/api.js';

export function useCareDue() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const controllerRef = useRef(null);

  const fetchCareDue = useCallback(async () => {
    if (controllerRef.current) controllerRef.current.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const result = await careDue.get();
      if (!controller.signal.aborted) {
        setData(result);
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        setError(err.message || 'Failed to load care due items.');
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  const markDone = useCallback(async (plantId, careType) => {
    await careActions.markDone(plantId, careType);

    // Optimistic local removal
    setData((prev) => {
      if (!prev) return prev;
      const removeItem = (items) =>
        items.filter(
          (item) => !(item.plant_id === plantId && item.care_type === careType)
        );
      return {
        overdue: removeItem(prev.overdue),
        due_today: removeItem(prev.due_today),
        upcoming: removeItem(prev.upcoming),
      };
    });
  }, []);

  const overdueCount = data ? data.overdue.length : 0;
  const dueTodayCount = data ? data.due_today.length : 0;
  const badgeCount = overdueCount + dueTodayCount;

  return {
    data,
    loading,
    error,
    badgeCount,
    fetchCareDue,
    markDone,
  };
}
