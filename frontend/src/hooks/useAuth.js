import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { auth as authApi, setTokens, clearTokens, setOnAuthFailure } from '../utils/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored session on mount
    const storedUser = sessionStorage.getItem('pg_user');
    const storedAccess = sessionStorage.getItem('pg_access');
    const storedRefresh = sessionStorage.getItem('pg_refresh');

    if (storedUser && storedAccess && storedRefresh) {
      setUser(JSON.parse(storedUser));
      setTokens(storedAccess, storedRefresh);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    setOnAuthFailure(() => {
      setUser(null);
      sessionStorage.removeItem('pg_user');
      sessionStorage.removeItem('pg_access');
      sessionStorage.removeItem('pg_refresh');
    });
  }, []);

  const persistSession = useCallback((userData, accessToken, refreshToken) => {
    setUser(userData);
    setTokens(accessToken, refreshToken);
    sessionStorage.setItem('pg_user', JSON.stringify(userData));
    sessionStorage.setItem('pg_access', accessToken);
    sessionStorage.setItem('pg_refresh', refreshToken);
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await authApi.login({ email, password });
    persistSession(data.user, data.access_token, data.refresh_token);
    return data.user;
  }, [persistSession]);

  const register = useCallback(async (fullName, email, password) => {
    const data = await authApi.register({ full_name: fullName, email, password });
    persistSession(data.user, data.access_token, data.refresh_token);
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
    sessionStorage.removeItem('pg_access');
    sessionStorage.removeItem('pg_refresh');
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
