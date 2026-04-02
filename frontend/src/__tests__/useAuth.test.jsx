import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../hooks/useAuth.jsx';

// Track mock calls
const mockRefreshAccessToken = vi.fn();
const mockSetAccessToken = vi.fn();
const mockClearTokens = vi.fn();
const mockSetOnAuthFailure = vi.fn();
const mockLogin = vi.fn();
const mockLogout = vi.fn();

vi.mock('../utils/api.js', () => ({
  auth: {
    login: (...args) => mockLogin(...args),
    register: vi.fn(),
    logout: (...args) => mockLogout(...args),
  },
  setAccessToken: (...args) => mockSetAccessToken(...args),
  clearTokens: (...args) => mockClearTokens(...args),
  setOnAuthFailure: (...args) => mockSetOnAuthFailure(...args),
  refreshAccessToken: (...args) => mockRefreshAccessToken(...args),
}));

// Helper component to observe auth state
function AuthConsumer() {
  const { user, loading, isAuthenticated } = useAuth();
  if (loading) return <div data-testid="loading">Loading...</div>;
  if (isAuthenticated) return <div data-testid="user">{user.full_name}</div>;
  return <div data-testid="guest">Guest</div>;
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
});

describe('useAuth — silent re-auth on app init', () => {
  it('shows loading then authenticated when silent refresh succeeds', async () => {
    // Simulate a returning user with stored session data
    sessionStorage.setItem('pg_user', JSON.stringify({ full_name: 'Jane', email: 'jane@test.com' }));
    mockRefreshAccessToken.mockResolvedValueOnce('new-access-token');

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    // Should start in loading state
    expect(screen.getByTestId('loading')).toBeInTheDocument();

    // After refresh resolves, should be authenticated
    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Jane');
    });

    expect(mockRefreshAccessToken).toHaveBeenCalledTimes(1);
  });

  it('clears session and shows guest when silent refresh fails', async () => {
    sessionStorage.setItem('pg_user', JSON.stringify({ full_name: 'Jane', email: 'jane@test.com' }));
    mockRefreshAccessToken.mockRejectedValueOnce(new Error('Refresh failed'));

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    // Should start in loading state
    expect(screen.getByTestId('loading')).toBeInTheDocument();

    // After refresh fails, should clear session and show guest
    await waitFor(() => {
      expect(screen.getByTestId('guest')).toBeInTheDocument();
    });

    expect(mockClearTokens).toHaveBeenCalled();
    expect(sessionStorage.getItem('pg_user')).toBeNull();
  });

  it('skips silent refresh when no stored user (fresh visitor)', async () => {
    // No pg_user in sessionStorage — should go straight to guest
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    // Should not show loading — goes directly to guest
    await waitFor(() => {
      expect(screen.getByTestId('guest')).toBeInTheDocument();
    });

    expect(mockRefreshAccessToken).not.toHaveBeenCalled();
  });
});

describe('useAuth — login', () => {
  it('stores access token from login response (no refresh token in body)', async () => {
    mockLogin.mockResolvedValueOnce({
      user: { full_name: 'Jane', email: 'jane@test.com' },
      access_token: 'access-123',
      // No refresh_token in body — it's in the HttpOnly cookie
    });

    let loginFn;
    function LoginConsumer() {
      const auth = useAuth();
      loginFn = auth.login;
      return auth.isAuthenticated ? <div data-testid="user">{auth.user.full_name}</div> : <div data-testid="guest">Guest</div>;
    }

    render(
      <AuthProvider>
        <LoginConsumer />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('guest')).toBeInTheDocument());

    await act(async () => {
      await loginFn('jane@test.com', 'password');
    });

    expect(screen.getByTestId('user')).toHaveTextContent('Jane');
    expect(mockSetAccessToken).toHaveBeenCalledWith('access-123');
  });
});

describe('useAuth — logout', () => {
  it('clears access token and session on logout', async () => {
    // Start with an authenticated user
    mockLogin.mockResolvedValueOnce({
      user: { full_name: 'Jane', email: 'jane@test.com' },
      access_token: 'access-123',
    });
    mockLogout.mockResolvedValueOnce({ message: 'Logged out' });

    let loginFn, logoutFn;
    function LogoutConsumer() {
      const auth = useAuth();
      loginFn = auth.login;
      logoutFn = auth.logout;
      return auth.isAuthenticated ? <div data-testid="user">User</div> : <div data-testid="guest">Guest</div>;
    }

    render(
      <AuthProvider>
        <LogoutConsumer />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('guest')).toBeInTheDocument());

    await act(async () => { await loginFn('j@t.com', 'p'); });
    expect(screen.getByTestId('user')).toBeInTheDocument();

    await act(async () => { await logoutFn(); });
    expect(screen.getByTestId('guest')).toBeInTheDocument();
    expect(mockClearTokens).toHaveBeenCalled();
  });
});
