// In local dev and staging the Vite proxy forwards /api/* to the backend on
// port 3000, so a relative base URL is correct and avoids CORS entirely.
// In production, set VITE_API_BASE_URL to the absolute backend origin.
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

let accessToken = null;
let onAuthFailure = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export function clearTokens() {
  accessToken = null;
}

// Legacy alias — some existing code passes (access, refresh).
// We only store the access token now; refresh token lives in HttpOnly cookie.
export function setTokens(access, _refresh) {
  accessToken = access;
}

export function setOnAuthFailure(callback) {
  onAuthFailure = callback;
}

/**
 * Silent re-auth: call POST /auth/refresh with credentials: 'include'.
 * The browser sends the HttpOnly refresh_token cookie automatically.
 * On success, stores the new access_token in memory and returns it.
 * On failure, clears local auth state and throws.
 */
export async function refreshAccessToken() {
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    clearTokens();
    throw new Error('Refresh failed');
  }

  const json = await res.json();
  accessToken = json.data.access_token;
  return accessToken;
}

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const headers = { ...options.headers };

  if (accessToken && !options.skipAuth) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  if (!(options.body instanceof FormData) && options.body) {
    headers['Content-Type'] = 'application/json';
  }

  let res = await fetch(url, { ...options, headers, credentials: 'include' });

  // Auto-refresh on 401
  if (res.status === 401 && !options._retried) {
    try {
      await refreshAccessToken();
      headers['Authorization'] = `Bearer ${accessToken}`;
      res = await fetch(url, { ...options, headers, credentials: 'include', _retried: true });
    } catch {
      if (onAuthFailure) onAuthFailure();
      throw new ApiError('Session expired. Please log in again.', 'UNAUTHORIZED', 401);
    }
  }

  const json = await res.json();

  if (!res.ok) {
    const err = json.error || {};
    throw new ApiError(err.message || 'Something went wrong.', err.code || 'UNKNOWN', res.status);
  }

  return options._returnFull ? json : json.data;
}

export class ApiError extends Error {
  constructor(message, code, status) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

// Auth endpoints
export const auth = {
  register(data) {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
      skipAuth: true,
    });
  },
  login(data) {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
      skipAuth: true,
    });
  },
  logout() {
    // No body needed — refresh token is read from HttpOnly cookie by backend
    return request('/auth/logout', {
      method: 'POST',
    });
  },
  async deleteAccount(password) {
    const url = `${API_BASE}/account`;
    const headers = { 'Content-Type': 'application/json' };
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const body = JSON.stringify({ password });

    let res = await fetch(url, { method: 'DELETE', headers, body, credentials: 'include' });

    // Auto-refresh on 401
    if (res.status === 401) {
      try {
        await refreshAccessToken();
        headers['Authorization'] = `Bearer ${accessToken}`;
        res = await fetch(url, { method: 'DELETE', headers, body, credentials: 'include' });
      } catch {
        throw new ApiError('Session expired. Please log in again.', 'UNAUTHORIZED', 401);
      }
    }

    if (res.status === 204) {
      return null; // Success — no content
    }

    // Handle errors
    let err = {};
    try {
      const json = await res.json();
      err = json.error || {};
    } catch {
      // Response may not have a JSON body
    }
    throw new ApiError(err.message || 'Something went wrong.', err.code || 'UNKNOWN', res.status);
  },
};

// Plant endpoints
export const plants = {
  list(params = {}) {
    const query = new URLSearchParams();
    query.set('page', String(params.page || 1));
    query.set('limit', String(params.limit || 50));
    if (params.search) query.set('search', params.search);
    if (params.status) query.set('status', params.status);
    const utcOffset = new Date().getTimezoneOffset() * -1;
    query.set('utcOffset', String(utcOffset));
    return request(`/plants?${query.toString()}`, { _returnFull: true });
  },
  get(id) {
    return request(`/plants/${id}`);
  },
  create(data) {
    return request('/plants', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  update(id, data) {
    return request(`/plants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  delete(id) {
    return request(`/plants/${id}`, {
      method: 'DELETE',
    });
  },
  uploadPhoto(id, file) {
    const formData = new FormData();
    formData.append('photo', file);
    return request(`/plants/${id}/photo`, {
      method: 'POST',
      body: formData,
    });
  },
};

// Care actions
export const careActions = {
  markDone(plantId, careType, notes = null) {
    const body = { care_type: careType };
    if (notes != null) {
      const trimmed = notes.trim();
      if (trimmed !== '') {
        body.notes = trimmed;
      }
    }
    return request(`/plants/${plantId}/care-actions`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  undo(plantId, actionId) {
    return request(`/plants/${plantId}/care-actions/${actionId}`, {
      method: 'DELETE',
    });
  },
  list(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.plant_id) query.set('plant_id', params.plant_id);
    const qs = query.toString();
    return request(`/care-actions${qs ? `?${qs}` : ''}`, { _returnFull: true });
  },
  /**
   * Batch mark-done: records multiple care actions in one request.
   * @param {Array<{plant_id: string, care_type: string, performed_at: string}>} actions
   * @returns {Promise<{results: Array, created_count: number, error_count: number}>}
   */
  batch(actions) {
    return request('/care-actions/batch', {
      method: 'POST',
      body: JSON.stringify({ actions }),
    });
  },
};

// Plant care history (per-plant, paginated)
export const careHistory = {
  get(plantId, params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.careType) query.set('careType', params.careType);
    const qs = query.toString();
    return request(`/plants/${plantId}/care-history${qs ? `?${qs}` : ''}`);
  },
};

// Care streak
export const careStreak = {
  get() {
    const utcOffset = new Date().getTimezoneOffset() * -1;
    return request(`/care-actions/streak?utcOffset=${utcOffset}`);
  },
};

// Care action stats (analytics)
export const careStats = {
  get() {
    return request('/care-actions/stats');
  },
};

// Care due dashboard
export const careDue = {
  get() {
    const utcOffset = new Date().getTimezoneOffset() * -1;
    return request(`/care-due?utcOffset=${utcOffset}`);
  },
};

// AI advice
export const ai = {
  getAdvice(data) {
    return request('/ai/advice', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  identify(imageFile) {
    const formData = new FormData();
    formData.append('image', imageFile);
    return request('/ai/identify', {
      method: 'POST',
      body: formData,
    });
  },
};

// Profile
export const profile = {
  get() {
    return request('/profile');
  },
  async delete() {
    const url = `${API_BASE}/profile`;
    const headers = {};
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    let res = await fetch(url, { method: 'DELETE', headers, credentials: 'include' });

    // Auto-refresh on 401
    if (res.status === 401) {
      try {
        await refreshAccessToken();
        headers['Authorization'] = `Bearer ${accessToken}`;
        res = await fetch(url, { method: 'DELETE', headers, credentials: 'include' });
      } catch {
        throw new ApiError('Session expired. Please log in again.', 'UNAUTHORIZED', 401);
      }
    }

    if (res.status === 204) {
      return null; // Success — no content
    }

    // Handle errors
    let err = {};
    try {
      const json = await res.json();
      err = json.error || {};
    } catch {
      // Response may not have a JSON body
    }
    throw new ApiError(err.message || 'Something went wrong.', err.code || 'UNKNOWN', res.status);
  },
};

// Plant sharing (Sprint 28 / T-126 / SPEC-022)
export const plantShares = {
  /**
   * Create (or retrieve — idempotent) a public share link for a plant the
   * authenticated user owns.
   * @param {string} plantId
   * @returns {Promise<{ share_url: string }>}
   */
  create(plantId) {
    return request(`/plants/${plantId}/share`, {
      method: 'POST',
    });
  },

  /**
   * Fetch a public plant profile by its share token. This endpoint is
   * unauthenticated — it is called via a bare fetch() that bypasses the
   * Bearer injection and 401-refresh interceptor, so that visitors who
   * have never logged in don't trigger an auth-refresh attempt.
   *
   * @param {string} shareToken
   * @returns {Promise<{ name: string, species: string|null, photo_url: string|null,
   *   watering_frequency_days: number|null, fertilizing_frequency_days: number|null,
   *   repotting_frequency_days: number|null, ai_care_notes: string|null }>}
   */
  async getPublic(shareToken) {
    const url = `${API_BASE}/public/plants/${encodeURIComponent(shareToken)}`;
    let res;
    try {
      res = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        // No credentials, no Authorization header — this endpoint is public.
      });
    } catch (networkErr) {
      throw new ApiError(
        networkErr?.message || 'Network error',
        'NETWORK_ERROR',
        0,
      );
    }

    let json = null;
    try {
      json = await res.json();
    } catch {
      // Response was not JSON — fall through to error handling below.
    }

    if (!res.ok) {
      const err = (json && json.error) || {};
      throw new ApiError(
        err.message || 'Something went wrong.',
        err.code || 'UNKNOWN',
        res.status,
      );
    }

    return json && json.data ? json.data : null;
  },
};

// Notification Preferences
export const notificationPreferences = {
  get() {
    return request('/profile/notification-preferences');
  },
  update(payload) {
    return request('/profile/notification-preferences', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  unsubscribe(token, uid) {
    const params = new URLSearchParams();
    params.set('token', token);
    if (uid) params.set('uid', uid);
    return request(`/unsubscribe?${params.toString()}`, {
      skipAuth: true,
    });
  },
};
