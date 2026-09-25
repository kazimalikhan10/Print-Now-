import { STORAGE_KEYS, readStorage, writeStorage } from './storageService';

const DEFAULT_AUTH = { role: null, signedIn: false };

export function getSession() {
  return readStorage(STORAGE_KEYS.auth, DEFAULT_AUTH);
}

export function signIn(role, details = {}) {
  const session = { role, signedIn: true, user: details };
  writeStorage(STORAGE_KEYS.auth, session);
  return session;
}

export function signOut() {
  const session = { role: null, signedIn: false };
  writeStorage(STORAGE_KEYS.auth, session);
  return session;
}
