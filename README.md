# Print Now

A mobile-first printing application frontend that allows customers to scan a shop QR code, upload documents or photos, configure print options, preview files, place orders, make or select payment options, and track printing status.

The application also includes an owner dashboard for managing print orders, pricing, shop settings, staff, inventory, reports, QR codes, and owner-only notifications.

> **Current status:** Frontend-only implementation. The application is structured to be backend/API ready, but no production backend is included.

---

## Features

### Customer

* QR-based shop entry
* Shop-specific landing page
* Real-time shop open/closed status based on configured business hours
* Upload documents and images
* Drag-and-drop file upload on desktop
* File validation and size limits
* PDF page detection
* Document print configuration
* Photo preview and positioning
* Crop / fit / fill controls
* Image rotation
* A3, A4, A5 and A6 paper sizes
* Portrait and landscape orientation
* Color and black & white printing
* Single-sided and double-sided printing
* Copy selection
* Page-range selection
* Dynamic pricing
* Order summary
* Guest checkout
* Customer details
* UPI payment UI
* Card payment UI
* Pay-at-shop option
* Payment status simulation
* Order confirmation
* Order tracking
* Action-required states
* Cancelled order states
* Customer order history
* Reorder functionality
* Responsive mobile-first interface

### Owner

* Owner dashboard
* Order management
* Order details
* Order status management
* Payment management
* Action-required workflow
* Print job sheet / receipt
* Shop settings
* Business-hours management
* Shop timezone configuration
* Pricing configuration
* QR management
* Staff management
* Inventory management
* Reports
* Owner-only notifications
* Customer/order operational visibility

### Printing

* Print preview
* PDF preview
* PDF page selection
* Photo preview
* Manual crop/framing
* Fit/fill behavior
* Rotation
* Paper-size-aware preview
* Print-quality warnings
* Page-count-aware pricing

---

## Tech Stack

* **React**
* **Vite**
* **JavaScript**
* **Tailwind CSS**
* **React Router**
* **Lucide React**
* **Context API**
* **PDF.js**

The application intentionally avoids unnecessary libraries and keeps the architecture lightweight.

---

## Application Flow

### Customer Flow

```text
QR Scan
   ↓
Shop Landing
   ↓
Upload Files
   ↓
Uploaded Files
   ↓
Configure Printing
   ↓
Preview
   ↓
Order Summary
   ↓
Customer Details
   ↓
Payment
   ↓
Order Confirmation
   ↓
Job Tracking
```

### Owner Flow

```text
Owner Login
   ↓
Dashboard
   ├── Orders
   ├── Order Details
   ├── Shop Settings
   ├── Pricing
   ├── QR Management
   ├── Staff
   ├── Inventory
   └── Reports
```

---

## Project Structure

```text
src/
├── assets/
│
├── components/
│   ├── layout/
│   ├── shop/
│   ├── files/
│   ├── printing/
│   ├── preview/
│   ├── order/
│   └── ui/
│
├── pages/
│   ├── ShopPage.jsx
│   ├── UploadPage.jsx
│   ├── FilesPage.jsx
│   ├── ConfigurePage.jsx
│   ├── SummaryPage.jsx
│   ├── CustomerDetailsPage.jsx
│   ├── ConfirmationPage.jsx
│   ├── TrackingPage.jsx
│   └── OrdersPage.jsx
│
├── context/
│   └── OrderContext.jsx
│
├── data/
│   └── mockData.js
│
├── hooks/
│   └── useOrder.js
│
├── services/
│   ├── apiService.js
│   ├── mockApiService.js
│   ├── storageService.js
│   ├── shopService.js
│   ├── pricingService.js
│   ├── customerService.js
│   ├── authService.js
│   ├── orderService.js
│   ├── notificationService.js
│   ├── staffService.js
│   └── inventoryService.js
│
├── utils/
│   ├── priceCalculator.js
│   └── fileUtils.js
│
├── App.jsx
├── main.jsx
└── index.css
```

---

## Architecture

Print Now follows a frontend architecture designed to keep the UI independent from the eventual backend implementation.

```text
                    React UI
                       │
                       ▼
              Context / Hooks
                       │
                       ▼
                 Service Layer
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
     Mock Services              API Services
          │                         │
          ▼                         ▼
    localStorage              Future Backend API
```

The current application uses mock/frontend services so that backend integration can be introduced later without rewriting the UI.

---

## Service Layer

The application separates business operations from React components.

Examples include:

```text
shopService
pricingService
customerService
authService
orderService
notificationService
staffService
inventoryService
storageService
```

The future API integration is represented through:

```text
apiService.js
```

This allows the frontend to move from mock data to real REST APIs with minimal changes to the UI layer.

---

## Shop Availability

Shop availability is calculated using the configured:

* Weekly business hours
* Shop timezone
* Closed days
* Daily opening/closing times
* Overnight hours

Example:

```text
Monday     09:00 - 18:00
Tuesday    09:00 - 18:00
Wednesday  09:00 - 18:00
Thursday   09:00 - 18:00
Friday     09:00 - 18:00
Saturday   10:00 - 16:00
Sunday     Closed
```

Overnight schedules are also supported, for example:

```text
18:00 - 02:00
```

The customer-facing shop status refreshes periodically so the UI can reflect changes in the current open/closed state.

> In the production version, the backend should become the authoritative source for shop availability.

---

## File Handling

The frontend supports:

* PDF documents
* Word documents
* Images/photos
* Multiple files
* File validation
* File size validation
* PDF page counting
* Page selection
* Image preview

The current frontend uses mock/local processing where appropriate.

---

## Print Configuration

Each file can have its own print configuration.

Example:

```js
{
  paperSize: "A4",
  orientation: "portrait",
  color: "color",
  copies: 1,
  sides: "single",
  pageSelection: "all"
}
```

Photo-specific configuration also supports:

```js
{
  fit: "fit",
  physicalWidthMm: 210,
  physicalHeightMm: 297,
  transform: {
    scale: 1,
    x: 0,
    y: 0,
    rotation: 0
  }
}
```

---

## Pricing

Pricing is handled through the frontend pricing service.

Pricing can account for factors such as:

* Paper size
* Color / black & white
* Number of pages
* Number of copies
* Single / double-sided printing
* File-specific configuration

The final order stores a snapshot of the calculated pricing so that the submitted order remains consistent even if shop pricing changes later.

---

## Payments

The frontend currently provides payment UI for:

* UPI
* UPI ID
* Google Pay
* PhonePe
* Paytm
* BHIM
* Card
* Pay at shop

Payment flows are currently frontend/mock flows.

The production application should connect these screens to a secure backend/payment provider.

> Payment credentials, payment verification, transaction validation, and payment status must never be trusted solely from the frontend.

---

## Order Status

Orders support operational states such as:

```text
Submitted
Processing
Printing
Ready
Completed
Failed
Action Required
Cancelled
```

The tracking UI presents the current state to the customer.

---

## Notifications

General notifications are intentionally **not shown on the customer landing page**.

Customer-facing order information is displayed through:

* Order tracking
* Order details
* Action-required messages
* Payment information
* Order confirmation

Notifications are primarily intended for the **owner dashboard**, where they can highlight operational events such as:

* New orders
* Payment events
* Action-required jobs
* Low inventory
* Staff changes
* Pricing/settings changes
* Failed jobs
* Cancelled jobs

---

## Local Storage

The current frontend uses browser storage for frontend persistence.

Examples include:

* Customer session/mock account
* Orders
* Shop settings
* Pricing
* Staff
* Inventory
* Other frontend state

This is intended for development/demo purposes.

Production data should eventually be stored and validated by the backend.

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/print-now.git
```

### 2. Open the project

```bash
cd print-now
```

### 3. Install dependencies

```bash
npm install
```

### 4. Start the development server

```bash
npm run dev
```

The application will normally be available at:

```text
http://localhost:5173
```

---

## Production Build

Create a production build with:

```bash
npm run build
```

Preview the production build locally with:

```bash
npm run preview
```

---

## Environment Variables

The current frontend does not require a production backend environment.

When backend services are introduced, environment variables can be added through:

```text
.env
.env.local
```

These files should **not** be committed to GitHub.

Example:

```env
VITE_API_BASE_URL=
```

---

## Backend Integration

The frontend is intentionally prepared for future backend integration.

A future backend can provide APIs for:

```text
Authentication
Shop management
Shop availability
Business hours
Pricing
File uploads
Orders
Payments
Order tracking
Notifications
Staff
Inventory
Reports
QR management
Customer accounts
```

The frontend service layer should remain the primary integration boundary.

Example:

```text
React Component
      ↓
Service
      ↓
API Service
      ↓
Backend API
```

---

## Security Considerations

The current project is frontend-only and therefore should not be treated as production-secure.

When the backend is implemented:

* Authentication must be server-side validated.
* Authorization must be enforced on the server.
* Owner/staff permissions must not rely on frontend checks.
* Payment status must be verified server-side.
* Order ownership must be verified server-side.
* Uploaded files must be validated server-side.
* File storage should use secure object storage.
* Sensitive customer information should not be stored unnecessarily in the browser.
* API endpoints should validate all incoming data.
* QR/shop identifiers should be validated by the backend.
* Pricing should be recalculated or verified server-side before order fulfillment.

---

## Responsive Design

Print Now is designed mobile-first.

The interface prioritizes:

* Large touch targets
* Simple navigation
* Clear CTAs
* Responsive cards
* Mobile-friendly forms
* Desktop drag-and-drop
* Responsive tables and dashboards
* Accessible spacing and typography

The application should work across:

```text
Mobile
Tablet
Desktop
```

---

## Documentation

Additional project documentation includes:

```text
docs/
├── API_CONTRACT.md
└── FRONTEND_SERVICE_MAP.md
```

The Low-Level Design document describes the broader application architecture, data models, flows, services, printing behavior, shop availability, and future backend integration.

---

## Current Scope

### Included

* Complete frontend experience
* Customer flow
* Owner flow
* Print configuration
* Preview
* Pricing
* Checkout UI
* Order tracking
* Shop management
* Staff management
* Inventory management
* Reports
* QR management
* Frontend persistence
* Mock services
* API-ready service architecture

### Not Included

* Production backend
* Production database
* Real authentication server
* Real payment processing
* Production file storage
* Server-side order processing
* Real-time backend notifications
* Server-side authorization

---

## Future Backend Architecture

A possible production architecture:

```text
                   Customer / Owner
                          │
                          ▼
                     React App
                          │
                          ▼
                      REST API
                          │
              ┌───────────┴───────────┐
              ▼                       ▼
        Authentication           Application API
                                      │
                   ┌──────────────────┼──────────────────┐
                   ▼                  ▼                  ▼
                Orders             Shops             Payments
                   │                  │                  │
                   ▼                  ▼                  ▼
                Database         Shop Settings       Payment Provider
                   │
                   ▼
              File Storage
```

The exact backend technology and infrastructure can be selected independently of the current React frontend.

---

## Development Principles

The project follows these principles:

* Mobile-first design
* Component-based UI
* Reusable components
* Service-layer separation
* Backend-ready architecture
* Minimal dependencies
* Clear customer journey
* Clear owner workflows
* Frontend state isolation
* Responsive layouts
* Accessible interactions
* No unnecessary backend coupling

---

## License

This project is currently a private/proprietary project unless a separate license is added.

---

## Author

**Print Now**

Frontend application built with React, Vite, Tailwind CSS, and modern web technologies.
