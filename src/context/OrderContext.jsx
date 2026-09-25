import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { defaultPricing, mockShop } from '../data/mockData';
import { getLinePrice } from '../utils/pricing';
import { getSelectedPageCount } from '../utils';
import * as shopService from '../services/shopService';
import * as pricingService from '../services/pricingService';
import * as authService from '../services/authService';
import * as orderService from '../services/orderService';
import * as notificationService from '../services/notificationService';
import * as staffService from '../services/staffService';
import * as customerService from '../services/customerService';

const OrderContext = createContext(null);

export function isFileConfigured(file) {
  if (!file?.options) return false;
  if (!file.options.paperSize || !file.options.orientation || !file.options.color) return false;
  if (!Number.isInteger(Number(file.options.copies)) || Number(file.options.copies) < 1) return false;
  if (file.type === 'document') {
    if (!file.options.sides || !file.options.pageSelection) return false;
    if (file.options.pageSelection === 'custom' && !file.options.pageRange?.trim()) return false;
  }
  return true;
}

export function OrderProvider({ children }) {
  const [shop, setShop] = useState(() => { try { return shopService.getShop() || mockShop; } catch { return mockShop; } });
  const [orders, setOrders] = useState(() => { try { return orderService.getOrders() || []; } catch { return []; } });
  const [pricing, setPricingState] = useState(() => { try { return pricingService.getPricing() || defaultPricing; } catch { return defaultPricing; } });
  const [customer, setCustomerState] = useState(() => { try { return customerService.getCustomer(); } catch { return { id: 'guest', name: '', phone: '', email: '' }; } });
  const [auth, setAuthState] = useState(() => { try { return authService.getSession(); } catch { return { role: null, signedIn: false }; } });
  const [notifications, setNotifications] = useState(() => { try { return notificationService.getNotifications() || []; } catch { return []; } });
  const [staff, setStaff] = useState(() => { try { return staffService.getStaff() || []; } catch { return []; } });
  const [order, setOrder] = useState({ shop, files: [], customer, job: { id: null, status: null }, checkoutPayment: { method: 'shop', status: 'pending' } });

  useEffect(() => { pricingService.savePricing(pricing); }, [pricing]);
  useEffect(() => { shopService.saveShop(shop); }, [shop]);
  useEffect(() => { staffService.saveStaff(staff); }, [staff]);
  useEffect(() => setOrder((current) => ({ ...current, shop, customer })), [shop, customer]);

  const addFiles = (files) => setOrder((current) => ({ ...current, files: [...current.files, ...files] }));
  const removeFile = (id) => setOrder((current) => ({ ...current, files: current.files.filter((file) => file.id !== id) }));
  const updateFile = (id, updates) => setOrder((current) => ({ ...current, files: current.files.map((file) => file.id === id ? { ...file, ...updates } : file) }));
  const updateFileOptions = (id, options) => setOrder((current) => ({
    ...current,
    files: current.files.map((file) => {
      if (file.id !== id) return file;
      const next = { ...file, options: { ...file.options, ...options } };
      return { ...next, configured: isFileConfigured(next) };
    }),
  }));

  const updateCustomer = (details) => {
    const next = { ...customer, ...details };
    customerService.saveCustomer(next);
    setCustomerState(next);
    setOrder((current) => ({ ...current, customer: next }));
  };

  const updateShopSettings = (settings) => {
    const next = shopService.updateShop(settings);
    setShop(next);
    addNotification({ type: 'settings', title: 'Shop settings updated', message: 'Shop capabilities, paper sizes, or payment settings were changed.' });
    return next;
  };

  const setPricing = (next) => {
    pricingService.savePricing(next);
    setPricingState(next);
    addNotification({ type: 'settings', title: 'Pricing updated', message: 'Customer print prices were updated in shop settings.' });
  };

  const signIn = (role, details = {}) => {
    const nextAuth = authService.signIn(role, details);
    setAuthState(nextAuth);
    if (role === 'customer') updateCustomer(details);
  };

  const signOut = () => {
    const nextAuth = authService.signOut();
    setAuthState(nextAuth);
  };

  const setCheckoutPayment = (payment) => setOrder((current) => ({ ...current, checkoutPayment: { ...current.checkoutPayment, ...payment } }));

  const addNotification = (notification) => {
    const next = notificationService.addNotification(notification);
    setNotifications(next);
  };

  const markNotificationsRead = () => setNotifications(notificationService.markAllRead());

  const addStaff = (person) => {
    const next = staffService.addStaff(person);
    setStaff(next);
    addNotification({ type: 'staff', title: 'Staff member added', message: `${person.name || 'A staff member'} was added to the shop team.` });
    return next[next.length - 1];
  };

  const updateStaff = (id, updates) => {
    const current = staff;
    const next = current.map((person) => person.id === id ? { ...person, ...updates } : person);
    staffService.saveStaff(next);
    setStaff(next);
    addNotification({ type: 'staff', title: 'Staff details updated', message: 'A staff profile, role, or permission was updated.' });
  };

  const removeStaff = (id) => {
    const target = staff.find((person) => person.id === id);
    const next = staff.filter((person) => person.id !== id || person.role === 'Owner');
    staffService.saveStaff(next);
    setStaff(next);
    if (target && target.role !== 'Owner') addNotification({ type: 'staff', title: 'Staff member removed', message: `${target.name} was removed from the shop team.` });
  };

  const toggleStaffActive = (id) => {
    const next = staff.map((person) => person.id === id ? { ...person, active: !person.active } : person);
    staffService.saveStaff(next);
    setStaff(next);
    const changed = next.find((person) => person.id === id);
    addNotification({ type: 'staff', title: 'Staff status changed', message: `${changed?.name || 'Staff member'} is now ${changed?.active ? 'active' : 'inactive'}.` });
  };

  const submitJob = () => {
    const snapshot = orderService.createOrder({ order, pricing });
    setOrders(orderService.getOrders());
    // The submitted order is now a snapshot in the order history. Clear the active
    // cart immediately so a new print request never contains previously submitted files.
    setOrder((current) => ({
      ...current,
      files: [],
      job: { id: snapshot.id, status: snapshot.status },
      checkoutPayment: { method: 'shop', status: 'pending' },
    }));
    addNotification({ type: 'order', title: 'Order submitted', message: `${snapshot.id} is now in the shop queue.`, orderId: snapshot.id });
    return snapshot.id;
  };

  const updateOrderStatus = (id, status) => {
    const nextOrders = orderService.updateOrderStatus(id, status);
    setOrders(nextOrders);
    setOrder((current) => current.job.id === id ? { ...current, job: { ...current.job, status } } : current);
    const labels = { submitted: 'Submitted', processing: 'Processing', printing: 'Printing', ready: 'Ready for pickup', completed: 'Completed', cancelled: 'Cancelled', action_required: 'Action required' };
    addNotification({ type: 'status', title: `Order ${id}`, message: labels[status] || status, orderId: id });
  };

  const updatePaymentStatus = (id, paymentStatus, paymentMethod = null) => {
    setOrders(orderService.updatePaymentStatus(id, paymentStatus, paymentMethod));
    const labels = { paid: 'Payment marked as paid', pending: 'Payment marked as pending', refunded: 'Payment refunded', failed: 'Payment failed' };
    addNotification({ type: 'payment', title: `Payment · ${id}`, message: labels[paymentStatus] || `Payment status: ${paymentStatus}`, orderId: id });
  };

  const cancelOrder = (id) => {
    const target = orders.find((item) => item.id === id);
    updateOrderStatus(id, 'cancelled');
    if (target?.paymentStatus === 'paid') updatePaymentStatus(id, 'refunded', 'refund');
  };

  const setOrderActionRequired = (id, message = 'Shop action is required for this order.') => {
    setOrders(orderService.markActionRequired(id, message));
    addNotification({ type: 'action', title: `Action required · ${id}`, message, orderId: id });
  };

  const reorder = (id) => {
    const previous = orderService.getOrder(id);
    if (!previous) return false;
    const files = orderService.createReorder(previous);
    setOrder((current) => ({ ...current, files }));
    return true;
  };

  const value = useMemo(() => ({
    order,
    orders,
    pricing,
    shop,
    customer,
    auth,
    notifications,
    staff,
    setPricing,
    addFiles,
    removeFile,
    updateFile,
    updateFileOptions,
    updateCustomer,
    submitJob,
    updateShopSettings,
    updateOrderStatus,
    updatePaymentStatus,
    cancelOrder,
    setOrderActionRequired,
    reorder,
    signIn,
    signOut,
    setCheckoutPayment,
    addNotification,
    markNotificationsRead,
    addStaff,
    updateStaff,
    removeStaff,
    toggleStaffActive,
    isFileConfigured,
  }), [order, orders, pricing, shop, customer, auth, notifications, staff]);

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

export function useOrder() {
  const context = useContext(OrderContext);
  if (!context) throw new Error('useOrder must be used inside OrderProvider');
  return context;
}
