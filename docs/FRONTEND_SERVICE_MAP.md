# Print Now — Frontend Service Map

## Why this layer exists

The UI must not know whether data comes from localStorage, mock data, or a real backend. Pages/components consume Context/hooks; Context consumes domain services.

```text
Page / Component
      |
      v
Context / Hook
      |
      v
Domain Service
      |
      +---- current: localStorage adapter
      |
      +---- future: HTTP API adapter
```

## Current services

- `storageService.js` — only module allowed to touch localStorage.
- `shopService.js` — shop configuration/capabilities.
- `pricingService.js` — shop pricing.
- `customerService.js` — customer profile/session data.
- `authService.js` — mock session state.
- `orderService.js` — order creation, status, payment, reorder.
- `notificationService.js` — notifications.
- `staffService.js` — staff records.
- `inventoryService.js` — paper stock.
- `mockApiService.js` — async backend-shaped mock operations.
- `apiService.js` — future REST adapter, activated by `VITE_API_BASE_URL`.

## Page-to-service map

| UI area | Context/service | Future API |
|---|---|---|
| Shop landing | ShopContext / shopService | GET `/api/shops/:shopId` |
| Pricing | PricingContext / pricingService | GET/PUT `/api/shops/:shopId/pricing` |
| Upload | file utilities | POST `/api/files/upload` |
| Summary | pricing engine | Order pricing/create endpoint |
| Submit | OrderContext / orderService | POST `/api/orders` |
| Tracking | OrderContext / orderService | GET `/api/orders/:orderId` |
| Customer history | customer/order services | GET `/api/customers/me/orders` |
| Owner orders | orderService | GET `/api/orders` |
| Owner order detail | orderService | GET/PUT `/api/orders/:orderId/...` |
| Owner settings | shopService | GET/PUT `/api/shops/:shopId/settings` |
| Owner pricing | pricingService | GET/PUT `/api/shops/:shopId/pricing` |
| Staff | staffService | `/api/shops/:shopId/staff` |
| Inventory | inventoryService | future inventory endpoints |
| Notifications | notificationService | `/api/notifications` |

## Migration rule

Do not modify page-level business logic to add the backend. Replace the persistence/service adapter beneath the Context layer and preserve the domain model.
