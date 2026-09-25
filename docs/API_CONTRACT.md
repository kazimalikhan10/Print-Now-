# Print Now — Frontend/API Contract

The current app is frontend-only. `src/services/mockApiService.js` emulates the same operations that a backend can expose later. `src/services/apiService.js` contains the future HTTP adapter.

## Contract principle

Pages/components should call domain services, not `fetch()` or `localStorage` directly.

## Endpoints

| Method | Endpoint | Frontend purpose |
|---|---|---|
| POST | `/api/auth/login` | Customer/owner sign-in |
| POST | `/api/auth/logout` | Sign out |
| GET | `/api/auth/me` | Restore session |
| GET | `/api/shops/:shopId` | Shop landing/config |
| GET/PUT | `/api/shops/:shopId/settings` | Shop capabilities/settings |
| GET/PUT | `/api/shops/:shopId/pricing` | Pricing configuration |
| POST | `/api/files/upload` | File metadata/storage registration |
| GET | `/api/files/:fileId` | File metadata |
| DELETE | `/api/files/:fileId` | Remove file |
| POST | `/api/orders` | Create submitted order |
| GET | `/api/orders` | Owner order queue |
| GET | `/api/orders/:orderId` | Order detail/tracking |
| PUT | `/api/orders/:orderId/status` | Print-job status |
| PUT | `/api/orders/:orderId/payment` | Payment status |
| POST | `/api/orders/:orderId/reorder` | Customer reorder |
| GET | `/api/customers/me` | Customer profile |
| GET | `/api/customers/me/orders` | Customer history |
| GET/POST/PUT/DELETE | `/api/shops/:shopId/staff...` | Staff management |
| GET/PUT | `/api/notifications...` | Notifications |

## Create Order request

```json
{
  "shopId": "shop_001",
  "customerId": "customer_001",
  "items": [
    {
      "fileId": "file_001",
      "fileName": "report.pdf",
      "totalPages": 11,
      "selectedPages": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      "copies": 1,
      "paperSize": "A4",
      "orientation": "portrait",
      "colorMode": "bw",
      "sides": "single",
      "finishing": []
    }
  ],
  "payment": { "method": "cash" }
}
```

## Create Order response

```json
{
  "id": "PN10482",
  "status": "submitted",
  "paymentStatus": "pending",
  "subtotal": 22,
  "total": 22,
  "createdAt": "2026-09-25T10:42:00Z"
}
```

## Update status

Request:
```json
{ "status": "printing" }
```

Response:
```json
{
  "orderId": "PN10482",
  "status": "printing",
  "updatedAt": "2026-09-25T10:55:00Z"
}
```

## Pricing response

```json
{
  "documents": {
    "A4": {
      "bw": { "single": 2, "double": 3 },
      "color": { "single": 8, "double": 12 }
    },
    "A5": {},
    "A6": {},
    "A3": {}
  },
  "photos": {},
  "finishing": {}
}
```

## File response

```json
{
  "id": "file_001",
  "fileName": "report.pdf",
  "mimeType": "application/pdf",
  "size": 2450000,
  "pages": 11,
  "previewUrl": "...",
  "thumbnailUrl": "..."
}
```
