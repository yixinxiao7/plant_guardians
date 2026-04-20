import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { auth as authApi, profile as profileApi, setAccessToken, clearTokens, setOnAuthFailure, refreshAccessToken } from '../utils/api.js';

const AuthContext = createContext(null);

/**
 * Check if the current URL contains OAuth callback tokens (from Google OAuth redirect).
 * Returns { accessToken, refreshToken, linked } if present, null otherwise.
 * Cleans the URL immediately after reading.
 */
// Cache OAuth params at module level so they survive React StrictMode's
// double-invocation of useEffect (which cancels the first run).
// The URL is cleaned on first read; the cached value is returned on re-reads.
let _cachedOAuthParams = undefined;

function consumeOAuthParams() {
  if (_cachedOAuthParams !== undefined) return _cachedOAuthParams;

  const url = new URL(window.location.href);
  const accessToken = url.searchParams.get('access_token');
  const refreshToken = url.searchParams.get('refresh_token');

  if (!accessToken) {
    _cachedOAuthParams = null;
    return null;
  }

  const linked = url.searchParams.get('linked') === 'true';

  // Clean tokens from URL immediately — prevent exposure in browser history
  url.searchParams.delete('access_token');
  url.searchParams.delete('refresh_token');
  url.searchParams.delete('linked');
  window.history.replaceState({}, '', url.toString());

  _cachedOAuthParams = { accessToken, refreshToken, linked };
  return _cachedOAuthParams;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    // Restore non-sensitive user display data from sessionStorage (name, email — not tokens)
    const storedUser = sessionStorage.getItem('pg_user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  // Start in loading state if we have a stored user — we need to validate their session
  const [loading, setLoading] = useState(() => {
    return !!sessionStorage.getItem('pg_user') || !!new URLSearchParams(window.location.search).get('access_token');
  });
  // Track OAuth linked status for toast messaging
  const [oauthLinked, setOauthLinked] = useState(false);
  const [oauthJustLoggedIn, setOauthJustLoggedIn] = useState(false);

  // Silent re-auth on app init: attempt to refresh the access token using
  // the HttpOnly refresh_token cookie. If the cookie is valid, the user stays
  // logged in across hard page refreshes without ever seeing the login screen.
  useEffect(() => {
    let cancelled = false;

    async function initAuth() {
      // Check for OAuth callback tokens first
      const oauthParams = consumeOAuthParams();

      if (oauthParams) {
        try {
          // Store the access token in memory
          setAccessToken(oauthParams.accessToken);

          // Fetch user profile from the API to get full user data
          const profileData = await profileApi.get();

          if (!cancelled) {
            const userData = profileData.user;
            setUser(userData);
            sessionStorage.setItem('pg_user', JSON.stringify(userData));
            setOauthLinked(oauthParams.linked);
            setOauthJustLoggedIn(true);
            setLoading(false);
          }
        } catch {
          if (!cancelled) {
            // OAuth token was invalid — fall through to normal state
            clearTokens();
            setUser(null);
            setLoading(false);
          }
        }
        return;
      }

      // Normal init — silent refresh
      const storedUser = sessionStorage.getItem('pg_user');
      if (!storedUser) {
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

    initAuth();

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

  // Consume OAuth toast flags (called by the component that shows the toast)
  const consumeOAuthToast = useCallback(() => {
    if (!oauthJustLoggedIn) return null;
    setOauthJustLoggedIn(false);
    const linked = oauthLinked;
    setOauthLinked(false);
    return { linked };
  }, [oauthJustLoggedIn, oauthLinked]);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      isAuthenticated: !!user,
      consumeOAuthToast,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
