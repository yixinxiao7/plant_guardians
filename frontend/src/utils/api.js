// In local dev and staging the Vite proxy forwards /api/* to the backend on
// port 3000, so a relative base URL is correct and avoids CORS entirely.
// In production, set VITE_API_BASE_URL to the absolute backend origin.
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

let accessToken = null;
let refreshToken = null;
let onAuthFailure = null;

export function setTokens(access, refresh) {
  accessToken = access;
  refreshToken = refresh;
}

export function getAccessToken() {
  return accessToken;
}

export function getRefreshToken() {
  return refreshToken;
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
}

export function setOnAuthFailure(callback) {
  onAuthFailure = callback;
}

async function refreshAccessToken() {
  if (!refreshToken) throw new Error('No refresh token');

  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!res.ok) {
    clearTokens();
    throw new Error('Refresh failed');
  }

  const json = await res.json();
  accessToken = json.data.access_token;
  refreshToken = json.data.refresh_token;
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

  let res = await fetch(url, { ...options, headers });

  // Auto-refresh on 401
  if (res.status === 401 && refreshToken && !options._retried) {
    try {
      await refreshAccessToken();
      headers['Authorization'] = `Bearer ${accessToken}`;
      res = await fetch(url, { ...options, headers, _retried: true });
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
    return request('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  },
  async deleteAccount() {
    const url = `${API_BASE}/auth/account`;
    const headers = {};
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    let res = await fetch(url, { method: 'DELETE', headers });

    // Auto-refresh on 401
    if (res.status === 401 && refreshToken) {
      try {
        await refreshAccessToken();
        headers['Authorization'] = `Bearer ${accessToken}`;
        res = await fetch(url, { method: 'DELETE', headers });
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
  list(page = 1, limit = 50) {
    return request(`/plants?page=${page}&limit=${limit}`);
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
  markDone(plantId, careType) {
    return request(`/plants/${plantId}/care-actions`, {
      method: 'POST',
      body: JSON.stringify({ care_type: careType }),
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
};

// AI advice
export const ai = {
  getAdvice(data) {
    return request('/ai/advice', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Profile
export const profile = {
  get() {
    return request('/profile');
  },
};
