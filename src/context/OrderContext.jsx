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
import { api, deleteBackendFile, isApiConfigured } from '../services/apiService';
import { getSelectedPageNumbers } from '../utils';

const OrderContext = createContext(null);

export function isFileConfigured(file) {
  if (!file?.options) return false;
  if (!file.backendFileId || file.backendValidation?.status === 'INVALID' || file.backendFileStatus === 'FAILED') return false;
  if (!file.options.paperSize || !file.options.orientation || !file.options.color) return false;
  if (!Number.isInteger(Number(file.options.copies)) || Number(file.options.copies) < 1) return false;
  if (file.type === 'document') {
    if (!file.options.sides || !file.options.pageSelection) return false;
    if (file.options.pageSelection === 'custom' && !file.options.pageRange?.trim()) return false;
  }
  return true;
}

export function mapBackendJobStatus(status) {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'COMPLETED') return 'completed';
  if (normalized === 'PRINTING') return 'printing';
  if (normalized === 'PROCESSING' || normalized === 'QUEUED' || normalized === 'DISPATCHED') return 'processing';
  if (normalized === 'CANCELLED') return 'cancelled';
  if (normalized === 'PROCESSING_FAILED' || normalized === 'PRINT_FAILED') return 'action_required';
  return 'submitted';
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

  const addFiles = (files) => setOrder((current) => ({ ...current, files: [...current.files, ...files], job: { id: null, status: null }, checkoutPayment: { method: 'shop', status: 'pending' } }));
  const removeFile = (id) => {
    const target = order.files.find((file) => file.id === id);
    const backendIdsToRemove = [...new Set([target?.backendFileId, target?.previousBackendFileId].filter(Boolean))];
    if (isApiConfigured()) {
      for (const backendFileId of backendIdsToRemove) {
        void deleteBackendFile(backendFileId).catch((error) => console.warn('Could not remove uploaded backend file:', error));
      }
    }
    if (target?.preview?.startsWith('blob:')) URL.revokeObjectURL(target.preview);
    if (target?.croppedPreview?.startsWith('blob:')) URL.revokeObjectURL(target.croppedPreview);
    setOrder((current) => ({ ...current, files: current.files.filter((file) => file.id !== id), job: { id: null, status: null } }));
  };
  const updateFile = (id, updates) => setOrder((current) => ({ ...current, files: current.files.map((file) => file.id === id ? { ...file, ...updates } : file), job: { id: null, status: null } }));
  const updateFileOptions = (id, options) => setOrder((current) => ({
    ...current,
    job: { id: null, status: null },
    files: current.files.map((file) => {
      if (file.id !== id) return file;
      const next = { ...file, options: { ...file.options, ...options } };
      const photoSheetWasEdited = file.type === 'photo' && [
        'crop', 'rotation', 'photoQuantity', 'imageWidthMm', 'imageHeightMm', 'sheetMarginMm', 'sheetGapMm',
      ].some((key) => Object.prototype.hasOwnProperty.call(options, key));
      if (photoSheetWasEdited) {
        return {
          ...next,
          previousBackendFileId: file.backendFileId || file.previousBackendFileId || null,
          backendFileId: null,
          backendFileStatus: null,
          backendValidation: null,
          backendAnalysis: null,
          configured: false,
        };
      }
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

  const createPrintJob = async () => {
    if (!isApiConfigured()) throw new Error('Backend URL is not configured. Add VITE_API_BASE_URL to your frontend .env file.');
    if (!order.files.length) throw new Error('Add at least one file before creating a print job.');
    if (order.job?.id && order.job?.backendStatus === 'PAYMENT_REQUIRED') {
      return { jobId: order.job.id, backendJob: order.job.backendJob || null };
    }

    const items = order.files.map((file) => {
      if (!file.backendFileId) throw new Error(`${file.name} has not been uploaded to the backend. Please upload it again.`);
      if (file.type === 'photo' && !file.photoSheetPdf) {
        const quantity = Number(file.options?.photoQuantity || 6);
        const size = file.options?.photoSize || 'PASSPORT';
        if (!['PASSPORT', 'STAMP'].includes(size) || ![6, 12].includes(quantity)) {
          throw new Error(`Choose a supported photo type and quantity for ${file.name}.`);
        }
        return { type: 'PHOTO', fileId: file.backendFileId, photoConfiguration: { size, quantity } };
      }

      const copies = file.photoSheetPdf ? 1 : (Number(file.options?.copies) || 1);
      if (!Number.isInteger(copies) || copies < 1 || copies > 100) {
        throw new Error(`Copies for ${file.name} must be between 1 and 100.`);
      }
      const selectedPages = getSelectedPageNumbers(file);
      const pageSelection = file.options?.pageSelection === 'custom'
        ? { type: 'PAGES', pages: selectedPages }
        : { type: 'ALL' };
      if (pageSelection.type === 'PAGES' && !pageSelection.pages.length) {
        throw new Error(`Choose at least one valid page for ${file.name}.`);
      }
      return {
        type: 'DOCUMENT',
        fileId: file.backendFileId,
        pageCount: file.photoSheetPdf ? 1 : Math.max(1, Number(file.pages) || 1),
        printConfiguration: {
          colorMode: file.options?.color === 'color' || file.type === 'photo' ? 'COLOR' : 'BW',
          paperSize: file.photoSheetPdf ? 'A4' : (['A3', 'A4'].includes(file.options?.paperSize) ? file.options.paperSize : 'A4'),
          orientation: file.photoSheetPdf ? 'PORTRAIT' : (file.options?.orientation === 'landscape' ? 'LANDSCAPE' : 'PORTRAIT'),
          duplex: file.photoSheetPdf ? 'SINGLE' : (file.options?.sides === 'double' ? 'DOUBLE' : 'SINGLE'),
          copies,
          pageSelection: file.photoSheetPdf ? { type: 'ALL' } : pageSelection,
        },
      };
    });

    const createResponse = await api.printJobs.create(items);
    const printJobId = createResponse?.data?.printJobId;
    if (!printJobId) throw new Error('The backend did not return a print job ID.');

    let backendJob = null;
    try { backendJob = await api.printJobs.get(printJobId); } catch (error) {
      console.warn('Print job was created, but its details could not be fetched yet:', error);
    }
    setOrder((current) => ({
      ...current,
      job: { id: printJobId, status: mapBackendJobStatus(backendJob?.status || 'PAYMENT_REQUIRED'), backendStatus: backendJob?.status || 'PAYMENT_REQUIRED', backendJob },
    }));
    return { jobId: printJobId, backendJob };
  };

  const finalizeCheckout = ({ jobId, paymentId = null, paymentMethod = 'shop', paymentStatus = 'pending', totalOverride = undefined } = {}) => {
    const snapshot = orderService.createOrder({
      order: { ...order, checkoutPayment: { method: paymentMethod, status: paymentStatus } },
      pricing,
      id: jobId,
      totalOverride,
      status: mapBackendJobStatus(order.job?.backendStatus || 'PAYMENT_REQUIRED'),
      paymentId,
      paymentStatus,
    });
    setOrders(orderService.getOrders());
    setOrder((current) => ({
      ...current,
      files: [],
      job: { id: jobId, status: snapshot.status, backendStatus: current.job?.backendStatus || 'PAYMENT_REQUIRED' },
      checkoutPayment: { method: paymentMethod, status: paymentStatus, paymentId },
    }));
    addNotification({
      type: 'order',
      title: paymentMethod === 'online' ? 'Payment confirmed' : 'Print job created',
      message: paymentMethod === 'online' ? `Backend-confirmed payment for print job ${jobId}.` : `Print job ${jobId} is awaiting payment at the shop.`,
      orderId: jobId,
    });
    return snapshot;
  };

  // Retained for the older confirmation route; the active checkout uses the explicit payment flow.
  const submitJob = async () => {
    const { jobId, backendJob } = await createPrintJob();
    finalizeCheckout({ jobId, paymentMethod: 'shop', paymentStatus: 'pending', totalOverride: Number.isFinite(Number(backendJob?.pricing?.totalAmount)) ? Number(backendJob.pricing.totalAmount) : undefined });
    return jobId;
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

  const approveCashPayment = async (id) => {
    const target = orders.find((item) => item.id === id);
    if (!target?.paymentId || target.paymentMethod !== 'shop') {
      throw new Error('This order does not have a backend cash-payment record.');
    }
    const result = await api.payments.approveCash(target.paymentId);
    const payment = result?.data ?? result;
    if (String(payment?.status || '').toUpperCase() !== 'SUCCESSFUL') {
      throw new Error('The backend has not confirmed the cash payment yet.');
    }
    updatePaymentStatus(id, 'paid', 'shop');
    return payment;
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
    createPrintJob,
    finalizeCheckout,
    updateShopSettings,
    updateOrderStatus,
    updatePaymentStatus,
    approveCashPayment,
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
