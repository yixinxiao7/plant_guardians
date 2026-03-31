import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { auth as authApi, setAccessToken, clearTokens, setOnAuthFailure, refreshAccessToken } from '../utils/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    // Restore non-sensitive user display data from sessionStorage (name, email — not tokens)
    const storedUser = sessionStorage.getItem('pg_user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  // Start in loading state if we have a stored user — we need to validate their session
  const [loading, setLoading] = useState(() => {
    return !!sessionStorage.getItem('pg_user');
  });

  // Silent re-auth on app init: attempt to refresh the access token using
  // the HttpOnly refresh_token cookie. If the cookie is valid, the user stays
  // logged in across hard page refreshes without ever seeing the login screen.
  useEffect(() => {
    let cancelled = false;

    async function attemptSilentRefresh() {
      const storedUser = sessionStorage.getItem('pg_user');
      if (!storedUser) {
        // No stored user session — nothing to refresh
        setLoading(false);
        return;
      }

      try {
        await refreshAccessToken();
        if (!cancelled) {
          // Access token restored — user is authenticated
          setUser(JSON.parse(storedUser));
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          // Refresh failed — session expired, clear everything
          setUser(null);
          clearTokens();
          sessionStorage.removeItem('pg_user');
          setLoading(false);
        }
      }
    }

    attemptSilentRefresh();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setOnAuthFailure(() => {
      setUser(null);
      clearTokens();
      sessionStorage.removeItem('pg_user');
    });
  }, []);

  const persistSession = useCallback((userData, accessToken) => {
    setUser(userData);
    setAccessToken(accessToken);
    // Only persist non-sensitive user display data — tokens stay in memory only
    sessionStorage.setItem('pg_user', JSON.stringify(userData));
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await authApi.login({ email, password });
    // refresh_token is no longer in the response body — it's set as HttpOnly cookie
    persistSession(data.user, data.access_token);
    return data.user;
  }, [persistSession]);

  const register = useCallback(async (fullName, email, password) => {
    const data = await authApi.register({ full_name: fullName, email, password });
    // refresh_token is no longer in the response body — it's set as HttpOnly cookie
    persistSession(data.user, data.access_token);
    return data.user;
  }, [persistSession]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Proceed with local logout even if API fails
    }
    setUser(null);
    clearTokens();
    sessionStorage.removeItem('pg_user');
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
