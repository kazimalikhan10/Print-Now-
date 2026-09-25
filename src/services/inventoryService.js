import { STORAGE_KEYS, readStorage, writeStorage } from './storageService';

export const DEFAULT_INVENTORY = { A4: 82, A5: 61, A6: 54, A3: 40 };

export function getInventory() {
  return readStorage(STORAGE_KEYS.inventory, DEFAULT_INVENTORY);
}

export function saveInventory(stock) {
  writeStorage(STORAGE_KEYS.inventory, stock);
  return stock;
}
