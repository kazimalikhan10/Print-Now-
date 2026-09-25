import { STORAGE_KEYS, readStorage, writeStorage } from './storageService';

const DEFAULT_CUSTOMER = { id: 'guest', name: '', phone: '', email: '' };

export function getCustomer() {
  return readStorage(STORAGE_KEYS.customer, DEFAULT_CUSTOMER);
}

export function saveCustomer(customer) {
  writeStorage(STORAGE_KEYS.customer, customer);
  return customer;
}

export function updateCustomer(details) {
  const next = { ...getCustomer(), ...details };
  return saveCustomer(next);
}
