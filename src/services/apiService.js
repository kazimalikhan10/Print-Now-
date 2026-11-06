const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/$/, '');
const SESSION_STORAGE_KEY = 'print-now-backend-session-id';

export function isApiConfigured() {
  return Boolean(API_BASE_URL);
}

export function getBackendSessionId() {
  if (typeof window === 'undefined') return 'print-now-session';
  try {
    let sessionId = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!sessionId) {
      sessionId = globalThis.crypto?.randomUUID?.() || `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      window.localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
    }
    return sessionId;
  } catch {
    return `session-${Date.now()}`;
  }
}

async function parseResponse(response) {
  if (response.status === 204) return null;
  try { return await response.json(); } catch { return null; }
}

export async function apiRequest(path, options = {}) {
  if (!API_BASE_URL) {
    throw new Error('Backend URL is not configured. Add VITE_API_BASE_URL to your frontend .env file.');
  }

  const headers = { ...(options.headers || {}) };
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  if (options.body != null && !isFormData && !headers['Content-Type']) headers['Content-Type'] = 'application/json';

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('Could not reach the backend. Check VITE_API_BASE_URL, backend availability, and whether the backend allows this frontend origin (CORS).');
    }
    throw error;
  }

  const body = await parseResponse(response);
  if (!response.ok || body?.success === false) {
    const details = Array.isArray(body?.errors) ? body.errors.map((item) => item.message || item).join(' ') : '';
    throw new Error(body?.message || details || `Backend request failed (${response.status}).`);
  }
  return body;
}

export async function uploadFileToBackend(file) {
  const sessionId = getBackendSessionId();
  const formData = new FormData();
  formData.append('file', file);
  formData.append('sessionId', sessionId);
  const result = await apiRequest('/files', {
    method: 'POST',
    headers: { 'X-Session-ID': sessionId },
    body: formData,
  });
  if (!result?.data?.id) throw new Error(`The backend did not return a file ID for ${file.name}.`);
  if (result.data.validation?.status === 'INVALID' || result.data.status === 'FAILED') {
    const reasons = result.data.validation?.errors || [];
    try { await deleteBackendFile(result.data.id); } catch { /* Best-effort cleanup of rejected upload metadata. */ }
    throw new Error(`${file.name}: ${reasons.join(' ') || 'The backend rejected this file.'}`);
  }
  return result.data;
}

export async function deleteBackendFile(fileId) {
  if (!fileId || !isApiConfigured()) return;
  const sessionId = getBackendSessionId();
  await apiRequest(`/files/${encodeURIComponent(fileId)}`, {
    method: 'DELETE',
    headers: { 'X-Session-ID': sessionId },
  });
}

export async function createBackendPrintJob(items) {
  return apiRequest('/print-jobs', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}

export async function getBackendPrintJob(jobId) {
  const result = await apiRequest(`/print-jobs/${encodeURIComponent(jobId)}`);
  return result?.data ?? result;
}

export async function createBackendPayment({ printJobId, method, customer }) {
  const result = await apiRequest('/payments', {
    method: 'POST',
    body: JSON.stringify({ printJobId, method, customer }),
  });
  if (!result?.data?.payment?._id) {
    throw new Error('The backend did not return a payment record.');
  }
  return result.data;
}

export async function getBackendPayment(paymentId) {
  const result = await apiRequest(`/payments/${encodeURIComponent(paymentId)}`);
  return result?.data ?? result;
}

export const api = {
  files: {
    upload: uploadFileToBackend,
    get: (fileId) => apiRequest(`/files/${encodeURIComponent(fileId)}`, { headers: { 'X-Session-ID': getBackendSessionId() } }),
    listBySession: () => apiRequest(`/files/session/${encodeURIComponent(getBackendSessionId())}`),
    remove: deleteBackendFile,
  },
  printJobs: {
    create: createBackendPrintJob,
    get: getBackendPrintJob,
    updateStatus: (jobId, status) => apiRequest(`/print-jobs/${encodeURIComponent(jobId)}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  },
  payments: {
    create: createBackendPayment,
    get: getBackendPayment,
    approveCash: (paymentId) => apiRequest(`/payments/${encodeURIComponent(paymentId)}/approve`, { method: 'POST' }),
    rejectCash: (paymentId) => apiRequest(`/payments/${encodeURIComponent(paymentId)}/reject`, { method: 'POST' }),
  },
};
