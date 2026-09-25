import * as authService from './authService';
import * as inventoryService from './inventoryService';
import * as notificationService from './notificationService';
import * as orderService from './orderService';
import * as pricingService from './pricingService';
import * as shopService from './shopService';
import * as staffService from './staffService';

const delay = (value) => new Promise((resolve) => setTimeout(() => resolve(value), 80));

export const mockApi = {
  auth: {
    login: (role, details) => delay(authService.signIn(role, details)),
    logout: () => delay(authService.signOut()),
    me: () => delay(authService.getSession()),
  },
  shop: {
    get: () => delay(shopService.getShop()),
    updateSettings: (settings) => delay(shopService.updateShop(settings)),
    getPricing: () => delay(pricingService.getPricing()),
    updatePricing: (pricing) => delay(pricingService.savePricing(pricing)),
  },
  orders: {
    list: () => delay(orderService.getOrders()),
    get: (id) => delay(orderService.getOrder(id)),
    create: (payload) => delay(orderService.createOrder(payload)),
    updateStatus: (id, status) => delay(orderService.updateOrderStatus(id, status)),
    updatePayment: (id, status, method) => delay(orderService.updatePaymentStatus(id, status, method)),
  },
  staff: {
    list: () => delay(staffService.getStaff()),
    create: (person) => delay(staffService.addStaff(person)),
  },
  notifications: {
    list: () => delay(notificationService.getNotifications()),
    markAllRead: () => delay(notificationService.markAllRead()),
  },
  inventory: {
    get: () => delay(inventoryService.getInventory()),
    save: (stock) => delay(inventoryService.saveInventory(stock)),
  },
};
