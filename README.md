# Print Now

A mobile-first printing application frontend that lets customers scan a shop QR code, upload documents or photos, configure printing options, preview their files, place print orders, make payments, and track their print jobs.

The application also provides a shop-owner dashboard for managing orders, pricing, shop settings, staff, inventory, QR codes, payments, and print operations.

> **Current status:** Frontend-only application. Backend/API integration is intentionally separated behind service abstractions and can be connected later.

---

## ✨ Features

### Customer Features

* QR-based shop entry
* Shop-specific landing page
* Guest checkout
* Customer sign-in/sign-out mock flow
* Upload documents and images
* Drag-and-drop file upload on desktop
* Camera/gallery support on supported devices
* File validation and size limits
* PDF page detection
* Custom PDF page selection
* PDF page preview
* Password-protected PDF handling
* DOCX preview
* Image preview and editing
* Photo cropping with draggable crop corners
* Photo zoom and rotation
* A3, A4, A5 and A6 paper sizes
* Portrait and landscape orientation
* Color and black-and-white printing
* Single-sided and double-sided printing
* Multiple copies
* Page selection
* Photo physical dimensions
* Full-sheet photo printing
* Multiple-photo-per-sheet printing
* Automatic photo sheet capacity calculation
* Photo imposition/layout preview
* Lamination
* Binding
* Stapling
* Dynamic pricing
* Order summary
* Customer details
* Payment selection
* UPI payment UI
* Card payment UI
* Pay-at-shop option
* Payment status
* Order confirmation
* Order tracking
* Action-required states
* Cancelled/failed order states
* Order history
* Reorder functionality
* Shop contact information
* Live shop open/closed status

---

## 🖼️ Photo Printing

Print Now supports both normal document printing and physical photo-sheet layouts.

### Full-Sheet Mode

The user can choose to print a photo so that it occupies the selected paper sheet.

Supported paper sizes:

* A3
* A4
* A5
* A6

### Multiple Photos Per Sheet

The user can specify the physical photo size.

For example:

**Photo:** 45 × 45 mm

**A4:** 210 × 297 mm

The application calculates the maximum number of photos that physically fit on the sheet.

Example:

| Paper | 45 × 45 mm photos |
| ----- | ----------------: |
| A3    |                54 |
| A4    |                24 |
| A5    |                12 |
| A6    |                 6 |

The calculation considers both normal and rotated layouts where applicable.

If a customer requests 30 photos at 45 × 45 mm:

```text
A4 Sheet 1 → 24 photos
A4 Sheet 2 → 6 photos

Total → 30 photos / 2 sheets
```

The application keeps the number of requested photo copies separate from the number of physical sheets required.

---

## ✂️ Photo Crop Editor

The photo editor provides a mobile-friendly crop workflow similar to common photo/scanning applications.

Users can:

* Drag the crop area
* Resize the crop from the corners
* Select a specific section of the image
* Zoom the image
* Rotate the image
* Reset the crop
* Save the selected crop
* Use the edited result in the final print preview

The crop editor is independent from the photo-sheet layout system, allowing users to first select the desired image region and then decide how that image should be printed.

---

## 📄 Document Preview

### PDF

PDF files are handled using PDF.js.

Supported functionality includes:

* PDF page count detection
* Multi-page preview
* Custom page selection
* Selected-page preview
* Previous/next page navigation
* Mobile-friendly page navigation
* Desktop page navigation
* Password-protected PDF handling
* Incorrect-password handling
* PDF rendering through a dedicated PDF.js worker

Example custom selections:

```text
1,3,5
```

```text
1-3
```

```text
1,3-5,8
```

The selected page count is used throughout the order flow.

### DOCX

DOCX files can be previewed using the document extraction/rendering layer.

The implementation reads the Office Open XML package structure rather than relying on a fragile local ZIP header assumption.

---

## 🖨️ Printing Configuration

Each uploaded file can have its own configuration.

Supported options include:

* Paper size
* Orientation
* Color mode
* Copies
* Single/double-sided printing
* Page selection
* Photo dimensions
* Photo layout mode
* Crop
* Rotation
* Finishing services

### Supported Paper Sizes

```text
A3 — 297 × 420 mm
A4 — 210 × 297 mm
A5 — 148 × 210 mm
A6 — 105 × 148 mm
```

Paper dimensions are used by the preview and photo-sheet layout calculations.

---

## 💰 Pricing

The frontend contains a centralized pricing model.

Pricing can account for:

* Paper size
* Color / black-and-white
* Number of pages
* Number of copies
* Single/double-sided printing
* Photo printing
* Lamination
* Binding
* Stapling
* Other shop-configured services

Finishing charges are included in the final order total.

The application separates:

```text
Selected Pages
Total Copies
Photo Sheets Required
Finishing Charges
Final Total
```

This prevents pages and copies from being incorrectly treated as the same quantity.

---

## 💳 Payments

The customer checkout supports:

### UPI

The UI supports:

* Google Pay
* PhonePe
* Paytm
* BHIM
* UPI ID entry

Where supported by the device/browser, the operating system or installed payment application can handle the actual UPI intent.

### Card

Card payment UI is available for the frontend flow.

### Pay at Shop

Customers can also select:

```text
Pay at shop
```

The payment state is stored with the order.

> Actual payment processing is not implemented because the current application is frontend-only.

---

## 📦 Order Flow

The main customer workflow is:

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
Submit Order
   ↓
Confirmation
   ↓
Job Tracking
```

---

## 📍 Order Status

Orders can move through states such as:

```text
Submitted
   ↓
Processing
   ↓
Printing
   ↓
Ready
   ↓
Completed
```

Other states include:

```text
Action Required
Failed
Cancelled
```

The tracking interface communicates the current state to the customer.

---

## 🏪 Shop Owner Dashboard

The owner side of the application provides management interfaces for:

* Dashboard
* Orders
* Order details
* Print queue
* Print job sheets
* Payments
* Pricing
* Shop settings
* Business hours
* QR management
* Reports
* Inventory
* Staff
* Notifications

### Shop Hours

Owners can configure:

* Different hours for each day
* Closed days
* Opening and closing times
* Overnight schedules
* Shop timezone

The customer landing page uses those settings to display whether the shop is currently open or closed.

The frontend refreshes the shop availability state periodically.

> In a future backend implementation, the server should become the authoritative source for shop availability.

---

## 👥 Staff Management

Owner functionality includes:

* Add staff
* Edit staff
* Change role
* Activate/deactivate staff
* Remove staff
* Configure permissions

Supported roles include:

```text
Staff
Manager
Owner
```

The owner account is protected from accidental removal.

---

## 📦 Inventory

The owner interface includes inventory management concepts for printing supplies and shop resources.

Inventory can be used for monitoring:

* Paper
* Printing materials
* Other shop supplies

Low-stock conditions can be surfaced in the owner dashboard.

---

## 🔔 Notifications

### Customer

Customers receive order-specific status information through order tracking.

There is intentionally **no general notification center on the customer landing page**.

### Owner

The owner dashboard can surface notifications for:

* New orders
* Payment events
* Action-required jobs
* Low inventory
* Staff changes
* Pricing/settings changes
* Failed jobs
* Cancelled jobs

---

## 🧱 Technology Stack

### Frontend

* React
* Vite
* JavaScript
* Tailwind CSS
* React Router
* Lucide React
* Context API

### Document Processing

* PDF.js / `pdfjs-dist`
* DOCX/Open XML processing

### Storage

Frontend persistence uses browser storage abstractions.

No production database is currently connected.

---

## 🎨 Styling Architecture

The project follows a **Tailwind-first** approach.

### Tailwind is used for

* Layout
* Spacing
* Typography
* Colors
* Buttons
* Cards
* Forms
* Responsive layouts
* Navigation
* Grids
* Flexbox
* Standard UI states

### CSS remains where it is genuinely useful

Specialized CSS is retained for functionality such as:

* PDF rendering
* Print previews
* Physical paper dimensions
* Photo crop/framing mechanics
* Complex preview positioning
* Print-specific media rules
* Browser-specific rendering behavior

The goal is not to eliminate every CSS line at any cost. The goal is to avoid unnecessary custom CSS while keeping specialized rendering reliable.

---

## 🧩 Project Structure

```text
src/
├── assets/
│
├── components/
│   ├── layout/
│   │   ├── Header.jsx
│   │   ├── PageShell.jsx
│   │   └── BottomAction.jsx
│   │
│   ├── files/
│   │   ├── FileUpload.jsx
│   │   ├── FileCard.jsx
│   │   └── FileList.jsx
│   │
│   ├── printing/
│   │   ├── ChoiceGrid.jsx
│   │   ├── OptionGroup.jsx
│   │   ├── DocumentPreview.jsx
│   │   ├── PhotoPrintPreview.jsx
│   │   └── ...
│   │
│   ├── preview/
│   │   └── ...
│   │
│   ├── order/
│   │   └── ...
│   │
│   └── ui/
│       ├── Button.jsx
│       ├── Card.jsx
│       ├── Input.jsx
│       ├── SectionTitle.jsx
│       └── StepIndicator.jsx
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
│   ├── OrdersPage.jsx
│   └── owner/
│       ├── OwnerDashboardPage.jsx
│       ├── OwnerOrdersPage.jsx
│       ├── OwnerShopPage.jsx
│       ├── OwnerPricingPage.jsx
│       ├── OwnerInventoryPage.jsx
│       ├── OwnerStaffPage.jsx
│       └── ...
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
│   ├── pdf.js
│   ├── pricing.js
│   ├── printPreview.js
│   └── ...
│
├── App.jsx
├── main.jsx
└── index.css
```

---

## 🔌 Service Architecture

The application is intentionally structured so the UI does not need to know whether data comes from mock/local storage or a future backend.

Examples:

```text
Component
    ↓
Service
    ↓
Mock / Local Storage
```

Future architecture:

```text
Component
    ↓
Service
    ↓
REST API
    ↓
Backend
    ↓
Database
```

This makes it possible to introduce a real backend without rewriting the entire frontend.

---

## 🧪 Current Development Scope

This repository is currently a **frontend application**.

It does not yet provide:

* Production authentication
* Production database
* Production file storage
* Production payment processing
* Real shop hardware integration
* Real printer communication
* Production notification delivery
* Server-side order processing

These are intended future integrations.

---

## 🚀 Getting Started

### Requirements

Install:

* Node.js
* npm

### Installation

Clone the repository:

```bash
git clone https://github.com/kazimalikhan10/Print-Now-.git
```

Enter the project:

```bash
cd Print-Now-
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The Vite development server will provide the local URL in the terminal.

---

## 🏗️ Production Build

Create a production build with:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

---

## 🔐 Environment Variables

Production secrets should never be committed to Git.

Use environment files such as:

```text
.env
.env.local
```

These files should remain in `.gitignore`.

Example:

```env
VITE_API_BASE_URL=
VITE_PAYMENT_PUBLIC_KEY=
```

Actual production values should be provided when the backend and payment systems are integrated.

---

## 🔄 Future Backend Architecture

The planned production architecture can follow:

```text
Customer Web App
        │
        ▼
Frontend Service Layer
        │
        ▼
REST API
        │
 ┌──────┼─────────┐
 ▼      ▼         ▼
Auth   Orders    Shops
 │      │         │
 ▼      ▼         ▼
Database / Storage
        │
        ▼
Printer / Shop Operations
```

Potential backend responsibilities include:

* Authentication
* Shop management
* File storage
* Order creation
* Pricing
* Payment verification
* Print job management
* Notifications
* Inventory
* Staff permissions
* Reporting
* Shop availability

The frontend already separates these responsibilities through service abstractions.

---

## 🛡️ Security Considerations

The current application is frontend-only, so production security must be implemented when the backend is introduced.

Important future requirements include:

* Server-side authentication
* Authorization
* Owner/staff role enforcement
* Server-side price calculation
* Server-side order validation
* Secure file uploads
* File type validation
* Malware scanning
* File size limits
* Secure file storage
* Signed/private file URLs
* Payment verification
* Rate limiting
* Audit logging
* Input validation

Frontend values such as prices, permissions, and order status must **not** be trusted as authoritative once a backend exists.

---

## 📱 Responsive Design

Print Now is designed mobile-first because customers generally access the printing flow from their phones after scanning a QR code.

The interface supports:

* Mobile phones
* Tablets
* Desktop browsers

Touch targets are designed for mobile interaction, while desktop layouts provide additional space for previews and management dashboards.

---

## 🧭 Design Principles

The application follows these principles:

### Mobile First

Customers should be able to complete an order comfortably from a phone.

### Minimal Navigation

The customer workflow should remain focused and sequential.

### Visual Feedback

File previews, print previews, statuses, and pricing should be visible before submission.

### Guest Friendly

Customers should not be forced to create an account just to print.

### Shop Specific

Each QR entry point represents a specific printing shop.

### Backend Ready

The frontend should be usable today while remaining easy to connect to a production backend later.

---

## 📚 Project Documentation

Additional project documentation includes:

* Low-Level Design
* API Contract
* Frontend Service Map
* Architecture documentation
* Milestone implementation notes
* Backend handoff documentation

These documents describe the current frontend architecture and future backend integration points.

---

## 📌 Project Status

**Current:** Frontend development / backend-ready architecture

The application currently provides the core customer printing workflow and shop-owner management experience using frontend services, mock data, and browser persistence.

Production backend integration can be added without redesigning the complete frontend architecture.

---

