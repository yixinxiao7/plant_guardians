import { setAccessToken, clearTokens, refreshAccessToken, auth, ApiError, setOnAuthFailure, plants } from '../utils/api.js';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock import.meta.env
vi.stubEnv('VITE_API_BASE_URL', '');

beforeEach(() => {
  mockFetch.mockReset();
  clearTokens();
  setOnAuthFailure(null);
});

describe('api.js — cookie-based auth', () => {
  describe('refreshAccessToken', () => {
    it('calls POST /auth/refresh with credentials: include and no body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { access_token: 'new-access-123' } }),
      });

      const token = await refreshAccessToken();

      expect(token).toBe('new-access-123');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toContain('/auth/refresh');
      expect(opts.method).toBe('POST');
      expect(opts.credentials).toBe('include');
      // No body — refresh token comes from HttpOnly cookie
      expect(opts.body).toBeUndefined();
    });

    it('clears access token and throws on refresh failure', async () => {
      setAccessToken('old-access');
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Invalid token', code: 'UNAUTHORIZED' } }),
      });

      await expect(refreshAccessToken()).rejects.toThrow('Refresh failed');
    });
  });

  describe('request — credentials: include on all calls', () => {
    it('includes credentials: include on authenticated requests', async () => {
      setAccessToken('my-token');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [{ id: 1, name: 'Fern' }] }),
      });

      await plants.list();

      const [, opts] = mockFetch.mock.calls[0];
      expect(opts.credentials).toBe('include');
    });

    it('includes credentials: include on unauthenticated (skipAuth) requests', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: { user: { id: 1 }, access_token: 'tok' } }),
      });

      await auth.login({ email: 'a@b.com', password: 'pass' });

      const [, opts] = mockFetch.mock.calls[0];
      expect(opts.credentials).toBe('include');
    });
  });

  describe('auth.logout — no body', () => {
    it('calls POST /auth/logout with no refresh_token in body', async () => {
      setAccessToken('access-tok');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: { message: 'Logged out' } }),
      });

      await auth.logout();

      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toContain('/auth/logout');
      expect(opts.method).toBe('POST');
      expect(opts.credentials).toBe('include');
      // Body should not contain refresh_token
      expect(opts.body).toBeUndefined();
    });
  });

  describe('auto-refresh on 401', () => {
    it('retries the original request after refreshing access token', async () => {
      setAccessToken('expired-token');

      // First request → 401
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } }),
      });
      // Refresh call → success
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { access_token: 'refreshed-token' } }),
      });
      // Retry original → success
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [{ id: 1 }] }),
      });

      const result = await plants.list();
      expect(result).toEqual({ data: [{ id: 1 }] });
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('calls onAuthFailure and throws ApiError when refresh also fails', async () => {
      setAccessToken('expired-token');
      const authFailureCb = vi.fn();
      setOnAuthFailure(authFailureCb);

      // Original → 401
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Unauthorized' } }),
      });
      // Refresh → 401
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Refresh failed' } }),
      });

      await expect(plants.list()).rejects.toThrow('Session expired');
      expect(authFailureCb).toHaveBeenCalled();
    });
  });

  describe('auth.deleteAccount — credentials: include', () => {
    it('sends credentials: include on delete account', async () => {
      setAccessToken('tok');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      await auth.deleteAccount();

      const [, opts] = mockFetch.mock.calls[0];
      expect(opts.credentials).toBe('include');
    });
  });

  // Sprint 30 / T-143: extended plant query params (search, status, sort).
  describe('plants.list & plants.getAll — search/status/sort', () => {
    function urlOf(call) {
      return call[0];
    }

    it('plants.getAll exists and is an alias of plants.list (same endpoint)', async () => {
      setAccessToken('tok');
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: [], pagination: { page: 1, limit: 50, total: 0 }, status_counts: { all: 0, overdue: 0, due_today: 0, on_track: 0 } }),
      });
      await plants.getAll();
      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('/plants?');
    });

    it('forwards search, status, and sort query params when provided', async () => {
      setAccessToken('tok');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [], pagination: { page: 1, limit: 50, total: 0 } }),
      });

      await plants.getAll({
        search: 'fern',
        status: 'overdue',
        sort: 'most_overdue',
      });

      const url = urlOf(mockFetch.mock.calls[0]);
      expect(url).toMatch(/[?&]search=fern(&|$)/);
      expect(url).toMatch(/[?&]status=overdue(&|$)/);
      expect(url).toMatch(/[?&]sort=most_overdue(&|$)/);
    });

    it('strips empty/whitespace-only search', async () => {
      setAccessToken('tok');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [], pagination: { page: 1, limit: 50, total: 0 } }),
      });

      await plants.getAll({ search: '   ' });
      const url = urlOf(mockFetch.mock.calls[0]);
      expect(url).not.toMatch(/[?&]search=/);
    });

    it('omits sort/status when not provided (relying on backend defaults)', async () => {
      setAccessToken('tok');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [], pagination: { page: 1, limit: 50, total: 0 } }),
      });

      await plants.getAll({ search: 'rose' });
      const url = urlOf(mockFetch.mock.calls[0]);
      expect(url).toMatch(/[?&]search=rose(&|$)/);
      expect(url).not.toMatch(/[?&]status=/);
      expect(url).not.toMatch(/[?&]sort=/);
    });

    it('trims search before encoding', async () => {
      setAccessToken('tok');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [] }),
      });

      await plants.getAll({ search: '  fern  ' });
      const url = urlOf(mockFetch.mock.calls[0]);
      expect(url).toMatch(/[?&]search=fern(&|$)/);
    });

    it('always includes utcOffset for backend timezone-aware status computation', async () => {
      setAccessToken('tok');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [] }),
      });

      await plants.getAll({ status: 'due_today' });
      const url = urlOf(mockFetch.mock.calls[0]);
      expect(url).toMatch(/[?&]utcOffset=/);
    });
  });
});
