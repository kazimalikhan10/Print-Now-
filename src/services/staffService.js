import { STORAGE_KEYS, createId, readStorage, writeStorage } from './storageService';

const DEFAULT_STAFF = [
  { id: 'owner-1', name: 'Shop Owner', role: 'Owner', phone: '+91 98765 43210', email: 'owner@abcdigitalprints.local', active: true, permissions: { orders: true, pricing: true, settings: true, reports: true, inventory: true, staff: true } },
  { id: 'staff-1', name: 'Print Counter', role: 'Staff', phone: '+91 90000 11111', email: 'counter@abcdigitalprints.local', active: true, permissions: { orders: true, pricing: false, settings: false, reports: false, inventory: true, staff: false } },
];

export function getStaff() {
  return readStorage(STORAGE_KEYS.staff, DEFAULT_STAFF);
}

export function saveStaff(staff) {
  writeStorage(STORAGE_KEYS.staff, staff);
  return staff;
}

export function addStaff(person) {
  const next = {
    id: createId('staff'),
    active: true,
    role: 'Staff',
    permissions: { orders: true, pricing: false, settings: false, reports: false, inventory: true, staff: false },
    ...person,
  };
  return saveStaff([...getStaff(), next]);
}
