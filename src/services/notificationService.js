import { STORAGE_KEYS, createId, readStorage, writeStorage } from './storageService';

export function getNotifications() {
  return readStorage(STORAGE_KEYS.notifications, []);
}

export function addNotification(notification) {
  const next = [
    {
      id: createId('notification'),
      read: false,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ...notification,
    },
    ...getNotifications(),
  ].slice(0, 30);
  writeStorage(STORAGE_KEYS.notifications, next);
  return next;
}

export function markAllRead() {
  const next = getNotifications().map((item) => ({ ...item, read: true }));
  writeStorage(STORAGE_KEYS.notifications, next);
  return next;
}
