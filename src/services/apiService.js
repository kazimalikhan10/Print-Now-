const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export function isApiConfigured() {
  return Boolean(API_BASE_URL);
}

export async function apiRequest(path, options = {}) {
  if (!API_BASE_URL) {
    throw new Error('API base URL is not configured. Use the mock service while the project is frontend-only.');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    const message = body?.message || `API request failed with status ${response.status}`;
    throw new Error(message);
  }

  return body;
}

export const api = {
  auth: {
    login: (payload) => apiRequest('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
    logout: () => apiRequest('/api/auth/logout', { method: 'POST' }),
    me: () => apiRequest('/api/auth/me'),
  },
  shops: {
    get: (shopId) => apiRequest(`/api/shops/${shopId}`),
    settings: (shopId) => apiRequest(`/api/shops/${shopId}/settings`),
    updateSettings: (shopId, payload) => apiRequest(`/api/shops/${shopId}/settings`, { method: 'PUT', body: JSON.stringify(payload) }),
    pricing: (shopId) => apiRequest(`/api/shops/${shopId}/pricing`),
    updatePricing: (shopId, payload) => apiRequest(`/api/shops/${shopId}/pricing`, { method: 'PUT', body: JSON.stringify(payload) }),
  },
  files: {
    upload: (payload) => apiRequest('/api/files/upload', { method: 'POST', body: JSON.stringify(payload) }),
    get: (fileId) => apiRequest(`/api/files/${fileId}`),
    remove: (fileId) => apiRequest(`/api/files/${fileId}`, { method: 'DELETE' }),
  },
  orders: {
    list: () => apiRequest('/api/orders'),
    get: (orderId) => apiRequest(`/api/orders/${orderId}`),
    create: (payload) => apiRequest('/api/orders', { method: 'POST', body: JSON.stringify(payload) }),
    status: (orderId, status) => apiRequest(`/api/orders/${orderId}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
    payment: (orderId, payload) => apiRequest(`/api/orders/${orderId}/payment`, { method: 'PUT', body: JSON.stringify(payload) }),
    reorder: (orderId) => apiRequest(`/api/orders/${orderId}/reorder`, { method: 'POST' }),
  },
  customers: {
    me: () => apiRequest('/api/customers/me'),
    orders: () => apiRequest('/api/customers/me/orders'),
  },
  staff: {
    list: (shopId) => apiRequest(`/api/shops/${shopId}/staff`),
    create: (shopId, payload) => apiRequest(`/api/shops/${shopId}/staff`, { method: 'POST', body: JSON.stringify(payload) }),
    update: (shopId, staffId, payload) => apiRequest(`/api/shops/${shopId}/staff/${staffId}`, { method: 'PUT', body: JSON.stringify(payload) }),
    remove: (shopId, staffId) => apiRequest(`/api/shops/${shopId}/staff/${staffId}`, { method: 'DELETE' }),
  },
  notifications: {
    list: () => apiRequest('/api/notifications'),
    read: (notificationId) => apiRequest(`/api/notifications/${notificationId}/read`, { method: 'PUT' }),
  },
};
