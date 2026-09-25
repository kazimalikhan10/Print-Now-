export const defaultPricing = {
  paper: {
    A4: { bwSingle: 2, bwDouble: 3, colorSingle: 8, colorDouble: 12 },
    A5: { bwSingle: 1.5, bwDouble: 2, colorSingle: 5, colorDouble: 7 },
    A6: { bwSingle: 1, bwDouble: 1.5, colorSingle: 3, colorDouble: 4 },
    A3: { bwSingle: 5, bwDouble: 7, colorSingle: 15, colorDouble: 20 },
  },
  photos: { '4 × 6': 10, '5 × 7': 15, A6: 12, A5: 18, A4: 25, A3: 50 },
  finishing: { lamination: 20, binding: 40, stapling: 5 },
};

export const mockShop = {
  id: 'abc-digital-prints',
  name: 'ABC Digital Prints',
  location: 'Park Street, Kolkata',
  phone: '+91 98765 43210',
  upiId: 'abcprints@upi',
  logo: 'ABC',
  timeZone: 'Asia/Kolkata',
  businessHours: {
    monday: { open: '09:00', close: '21:00', closed: false },
    tuesday: { open: '09:00', close: '21:00', closed: false },
    wednesday: { open: '09:00', close: '21:00', closed: false },
    thursday: { open: '09:00', close: '21:00', closed: false },
    friday: { open: '09:00', close: '21:00', closed: false },
    saturday: { open: '09:00', close: '21:00', closed: false },
    sunday: { open: '09:00', close: '21:00', closed: false },
  },
  paperSizes: ['A4', 'A5', 'A6', 'A3'],
  photoSizes: ['A4', 'A5', 'A6', '4 × 6', '5 × 7'],
  pricing: defaultPricing,
  settings: {
    acceptsColor: true,
    acceptsBw: true,
    acceptsSingle: true,
    acceptsDouble: true,
    photoPrinting: true,
    lamination: true,
    binding: true,
    stapling: true,
  },
};

export const mockCustomers = [
  { id: 'c1', name: 'Rahul Sharma', phone: '9876543210', orders: 8 },
  { id: 'c2', name: 'Priya Das', phone: '9123456780', orders: 5 },
  { id: 'c3', name: 'Arjun Sen', phone: '9988776655', orders: 3 },
];

export const mockOrders = [
  {
    id: 'PN-10482', customer: mockCustomers[0], status: 'printing', paymentStatus: 'pending',
    createdAt: 'Today, 10:42 AM', total: 44, pages: 22, files: [{ name: 'CivicFix_Report.pdf', pages: 11, selectedPages: 11, copies: 2, paperSize: 'A4', color: 'bw' }],
  },
  {
    id: 'PN-10481', customer: mockCustomers[1], status: 'ready', paymentStatus: 'paid',
    createdAt: 'Today, 10:17 AM', total: 180, pages: 12, files: [{ name: 'Family_Photos.zip', pages: 12, selectedPages: 12, copies: 1, paperSize: 'A4', color: 'color' }],
  },
  {
    id: 'PN-10480', customer: mockCustomers[2], status: 'submitted', paymentStatus: 'pending',
    createdAt: 'Today, 9:58 AM', total: 26, pages: 13, files: [{ name: 'Application.pdf', pages: 13, selectedPages: 13, copies: 1, paperSize: 'A5', color: 'bw' }],
  },
  {
    id: 'PN-10479', customer: mockCustomers[0], status: 'completed', paymentStatus: 'paid',
    createdAt: 'Yesterday, 5:22 PM', total: 96, pages: 12, files: [{ name: 'Project_Print.pdf', pages: 12, selectedPages: 12, copies: 1, paperSize: 'A4', color: 'color' }],
  },
];

export const createFile = ({ name, type, size = 0, pages = 1, preview = null, sourceFile = null }) => ({
  id: crypto.randomUUID(),
  name,
  type,
  size,
  pages,
  preview,
  sourceFile,
  configured: true,
  options: type === 'photo'
    ? {
        paperSize: 'A4', orientation: 'portrait', color: 'color', copies: 1, fit: 'fill', rotation: 0,
        crop: { x: 0, y: 0, zoom: 1 }, imageWidthMm: 210, imageHeightMm: 297, finishing: { lamination: false, binding: false, stapling: false },
      }
    : {
        paperSize: 'A4', orientation: 'portrait', color: 'bw', copies: 1, sides: 'single', pageSelection: 'all', finishing: { lamination: false, binding: false, stapling: false },
      },
});
