import { mockOrders } from '../data/mockData';
import { getLinePrice } from '../utils/pricing';
import { getSelectedPageCount } from '../utils';
import { STORAGE_KEYS, createId, readStorage, writeStorage } from './storageService';

export function getOrders() {
  return readStorage(STORAGE_KEYS.orders, mockOrders);
}

export function saveOrders(orders) {
  writeStorage(STORAGE_KEYS.orders, orders);
  return orders;
}

export function getOrder(id) {
  return getOrders().find((order) => order.id === id) || null;
}

export function createOrder({ order, pricing }) {
  const id = `PN-${Math.floor(10000 + Math.random() * 89999)}`;
  const files = order.files.map((file) => ({
    name: file.name,
    type: file.type,
    pages: file.pages,
    selectedPages: getSelectedPageCount(file),
    copies: Number(file.options?.copies) || 1,
    paperSize: file.options?.paperSize,
    orientation: file.options?.orientation,
    color: file.options?.color,
    sides: file.options?.sides,
    pageSelection: file.options?.pageSelection,
    pageRange: file.options?.pageRange || '',
    fit: file.options?.fit,
    finishing: file.options?.finishing || {},
  }));

  const total = order.files.reduce((sum, file) => sum + getLinePrice(file, pricing), 0);
  const snapshot = {
    id,
    customer: order.customer,
    shop: order.shop,
    status: 'submitted',
    paymentStatus: order.checkoutPayment?.status === 'mock-paid' ? 'paid' : 'pending',
    paymentMethod: order.checkoutPayment?.method || 'shop',
    createdAt: `Today, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
    total,
    pages: order.files.reduce((sum, file) => sum + getSelectedPageCount(file), 0),
    files,
  };

  saveOrders([snapshot, ...getOrders()]);
  return snapshot;
}

export function updateOrderStatus(id, status) {
  return saveOrders(getOrders().map((item) => item.id === id ? { ...item, status } : item));
}

export function updatePaymentStatus(id, paymentStatus, paymentMethod = null) {
  return saveOrders(getOrders().map((item) => item.id === id ? { ...item, paymentStatus, paymentMethod: paymentMethod || item.paymentMethod || 'shop' } : item));
}

export function markActionRequired(id, message) {
  return saveOrders(getOrders().map((item) => item.id === id ? { ...item, status: 'action_required', actionRequired: message } : item));
}

export function createReorder(order) {
  if (!order) return [];
  return order.files.map((file) => ({
    id: createId('file'),
    name: file.name,
    type: file.type,
    size: 0,
    pages: file.pages,
    preview: null,
    sourceFile: null,
    configured: true,
    options: {
      paperSize: file.paperSize || 'A4',
      orientation: file.orientation || 'portrait',
      color: file.color || 'bw',
      copies: file.copies || 1,
      sides: file.sides || 'single',
      pageSelection: file.pageSelection || 'all',
      pageRange: file.pageRange || '',
      fit: file.fit || 'fill',
      finishing: file.finishing || {},
    },
  }));
}
