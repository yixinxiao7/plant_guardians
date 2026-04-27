import { useState, useCallback, useRef } from 'react';
import { plants as plantsApi, careActions as careActionsApi } from '../utils/api.js';

export function usePlants() {
  const [plants, setPlants] = useState([]);
  const [pagination, setPagination] = useState(null);
  // Sprint 30 / T-143: backend now returns `status_counts` for tab badges.
  // SPEC-024 §2 requires we KEEP last-known counts during in-flight refetches.
  const [statusCounts, setStatusCounts] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const fetchPlants = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await plantsApi.list(params);
      // result is the full response { data: [...], pagination: {...}, status_counts?: {...} }
      const items = Array.isArray(result) ? result : (result.data || result);
      const pag = result.pagination || null;
      setPlants(Array.isArray(items) ? items : []);
      setPagination(pag);
      if (result && result.status_counts) {
        setStatusCounts(result.status_counts);
      }
      // Note: if `status_counts` is absent in the response, we deliberately
      // keep the last-known value (per SPEC-024 §2).
      return result;
    } catch (err) {
      setError(err.message || 'Failed to load plants.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deletePlant = useCallback(async (id) => {
    await plantsApi.delete(id);
    setPlants(prev => prev.filter(p => p.id !== id));
  }, []);

  return {
    plants,
    pagination,
    statusCounts,
    loading,
    error,
    fetchPlants,
    deletePlant,
    setPlants,
  };
}

export function usePlantDetail() {
  const [plant, setPlant] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);

  const fetchPlant = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const data = await plantsApi.get(id);
      setPlant(data);
      return data;
    } catch (err) {
      if (err.status === 404) {
        setNotFound(true);
      } else {
        setError(err.message || 'Failed to load plant.');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const markCareAsDone = useCallback(async (plantId, careType, notes = null) => {
    const data = await careActionsApi.markDone(plantId, careType, notes);
    // Update local state with the new schedule
    setPlant(prev => {
      if (!prev) return prev;
      const updatedSchedules = prev.care_schedules.map(s =>
        s.care_type === careType ? data.updated_schedule : s
      );
      return { ...prev, care_schedules: updatedSchedules };
    });
    return data;
  }, []);

  const undoCareAction = useCallback(async (plantId, actionId) => {
    const data = await careActionsApi.undo(plantId, actionId);
    setPlant(prev => {
      if (!prev) return prev;
      const updatedSchedules = prev.care_schedules.map(s =>
        s.care_type === data.updated_schedule.care_type ? data.updated_schedule : s
      );
      return { ...prev, care_schedules: updatedSchedules };
    });
    return data;
  }, []);

  return { plant, loading, error, notFound, fetchPlant, setPlant, markCareAsDone, undoCareAction };
}
