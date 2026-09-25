# Print Now — Milestone 19

Frontend-only React/Vite printing application for a QR-driven shop printing flow.

## Stack

- React
- Vite
- JavaScript
- React Router
- Context API
- Lucide React
- Tailwind CSS available for expansion; current UI uses focused component CSS

## Run

```bash
npm install
npm run dev
```

For a production build:

```bash
npm run build
```

## Milestone 19 focus

- Final customer and owner UX polish
- Customer landing/header has **no general notification center**
- Owner-only notification center for shop operations
- Dynamic customer order tracking, including action-required/cancelled/completed states
- Checkout-style payment UI with UPI, card, Pay at shop, and frontend-only payment state simulation
- Owner print-job sheet / receipt actions
- Owner action-required queue metric
- Shop QR management: view, copy link, print, and SVG download prototype
- Shop landing service presentation
- Existing PDF/photo preview and print-quality safeguards retained
- Existing service/API abstraction retained for future backend integration

## Important

This milestone is still frontend-only. No backend, database, Supabase, or live payment integration is included.
