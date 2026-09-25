import { mockShop } from '../data/mockData';
import { STORAGE_KEYS, readStorage, writeStorage } from './storageService';
import { normalizeBusinessHours } from '../utils/shopHours';

export function getShop() {
  return readStorage(STORAGE_KEYS.shop, mockShop);
}

export function saveShop(shop) {
  writeStorage(STORAGE_KEYS.shop, shop);
  return shop;
}

export function updateShop(settings) {
  const current = getShop();
  const paperMap = { a4: 'A4', a5: 'A5', a6: 'A6', a3: 'A3' };
  const paperSizes = Object.entries(paperMap)
    .filter(([key]) => settings[key] !== false)
    .map(([, size]) => size);

  const { upiId, businessHours, ...capabilitySettings } = settings;
  const next = {
    ...current,
    ...(upiId !== undefined ? { upiId } : {}),
    settings: { ...current.settings, ...capabilitySettings },
    timeZone: current.timeZone || 'Asia/Kolkata',
    businessHours: normalizeBusinessHours(settings.businessHours || current.businessHours),
    paperSizes: paperSizes.length ? paperSizes : ['A4'],
  };

  return saveShop(next);
}
