import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { auth as authApi, setTokens, clearTokens, setOnAuthFailure } from '../utils/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    // Restore non-sensitive user display data from sessionStorage (name, email — not tokens)
    const storedUser = sessionStorage.getItem('pg_user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setOnAuthFailure(() => {
      setUser(null);
      clearTokens();
      sessionStorage.removeItem('pg_user');
    });
  }, []);

  const persistSession = useCallback((userData, accessToken, refreshToken) => {
    setUser(userData);
    setTokens(accessToken, refreshToken);
    // Only persist non-sensitive user display data — tokens stay in memory only
    sessionStorage.setItem('pg_user', JSON.stringify(userData));
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
