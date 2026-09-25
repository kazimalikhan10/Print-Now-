const PREFIX = 'print-now-';

export const STORAGE_KEYS = {
  orders: `${PREFIX}orders`,
  pricing: `${PREFIX}pricing`,
  shop: `${PREFIX}shop`,
  customer: `${PREFIX}customer`,
  auth: `${PREFIX}auth`,
  notifications: `${PREFIX}notifications`,
  staff: `${PREFIX}staff`,
  inventory: `${PREFIX}inventory`,
};

export function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeStorage(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function createId(prefix = 'id') {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return `${prefix}_${crypto.randomUUID()}`;
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
