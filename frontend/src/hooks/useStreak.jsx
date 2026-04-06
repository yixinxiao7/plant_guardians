/**
 * useStreak — shared streak data via React Context (Option A per SPEC-014).
 * Both ProfilePage and AppShell/Sidebar consume the same fetch result,
 * avoiding duplicate API calls.
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { careStreak } from '../utils/api.js';

const StreakContext = createContext(null);

export function StreakProvider({ children }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStreak = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await careStreak.get();
      setData(result);
    } catch (err) {
      setError(err.message || 'Failed to load streak data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStreak();
  }, [fetchStreak]);

  return (
    <StreakContext.Provider value={{ data, loading, error, refetch: fetchStreak }}>
      {children}
    </StreakContext.Provider>
  );
}

export function useStreak() {
  const ctx = useContext(StreakContext);
  if (!ctx) {
    throw new Error('useStreak must be used within a StreakProvider');
  }
  return ctx;
}
