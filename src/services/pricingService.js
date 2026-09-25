import { defaultPricing } from '../data/mockData';
import { STORAGE_KEYS, readStorage, writeStorage } from './storageService';

export function getPricing() {
  return readStorage(STORAGE_KEYS.pricing, defaultPricing);
}

export function savePricing(pricing) {
  writeStorage(STORAGE_KEYS.pricing, pricing);
  return pricing;
}
