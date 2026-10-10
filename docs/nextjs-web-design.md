# Next.js Web App — Design Document

**Target users:** 4 township officers + 1 district admin
**Platform:** Next.js (React, SSR/SSG)
**Backend:** Livestock Survey API (`/api/v1`)
**Key requirement:** Role-based views (township vs district)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│  Next.js App                                        │
│                                                     │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │ Pages       │  │ Components   │  │ API Layer  │ │
│  │ (App Router)│  │ (UI)         │  │ (Server)   │ │
│  └──────┬──────┘  └──────┬───────┘  └─────┬──────┘ │
│         │                │                │        │
│  ┌──────┴────────────────┴────────────────┴──────┐ │
│  │              Server Actions / API Routes      │ │
│  └──────────────────────┬────────────────────────┘ │
│                         │                          │
│                  ┌──────┴──────┐                   │
│                  │  API Client │                   │
│                  │  (fetch)    │                   │
│                  └─────────────┘                   │
└─────────────────────────────────────────────────────┘
```

---

## 2. Pages & Routes

### 2.1 Public

| Page | Route | Description |
|------|-------|-------------|
| Login | `/login` | loginCode + password |

### 2.2 Township Dashboard

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/township` | Township overview |
| Survey List | `/township/surveys` | Surveys in own tsp |
| Survey Detail | `/township/surveys/[id]` | View/edit survey |
| Township Report | `/township/report` | Township report |

### 2.3 District Dashboard

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/district` | District overview |
| Survey List | `/district/surveys` | All surveys in district |
| Survey Detail | `/district/surveys/[id]` | View/edit survey |
| District Report | `/district/report` | District report |
| Drilldown | `/district/drilldown` | Detailed breakdown |
| Export | `/district/export/[tspCode]` | Excel export |

---

## 3. API Integration

### 3.1 Auth Flow

```
1. User enters loginCode + password
2. POST /api/v1/auth/login → { accessToken, refreshToken }
3. Store tokens in httpOnly cookies
4. Middleware validates JWT on each request
5. If 401 → POST /api/v1/auth/refresh → new tokens
6. If refresh fails → redirect to /login
```

### 3.2 API Client (Server-side)

```typescript
// lib/api.ts
const API_BASE = process.env.API_BASE_URL || 'http://localhost:3100/api/v1';

async function apiFetch(path: string, options: RequestInit = {}) {
  const accessToken = getAccessToken();
  
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
  });
  
  if (response.status === 401) {
    // Try refresh
    const refreshed = await refreshTokens();
    if (refreshed) {
      return apiFetch(path, options); // Retry
    }
    redirect('/login');
  }
  
  return response;
}

export const api = {
  get: (path: string) => apiFetch(path),
  post: (path: string, body: unknown) => apiFetch(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path: string, body: unknown) => apiFetch(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path: string) => apiFetch(path, { method: 'DELETE' }),
};
```

---

## 4. API Routes (Next.js — Township + District)

### 4.1 Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | Login → tokens |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/logout` | Revoke refresh token |

### 4.2 Surveys

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/surveys` | township, district | List surveys (scoped) |
| GET | `/api/v1/surveys/details?ids=` | township, district | Bulk survey details (≤500 ids, chunked 200 — dataset load; D-63) |
| GET | `/api/v1/surveys/:surveyId` | township, district | Survey detail |
| PUT | `/api/v1/surveys/:surveyId` | township (own tsp), district | Edit survey |
| DELETE | `/api/v1/surveys/:surveyId` | district | Delete any survey |

### 4.3 Reports

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/reports/district` | district | District report |
| GET | `/api/v1/reports/township/:tspCode` | township, district | Township report |
| GET | `/api/v1/reports/drilldown` | district | Detailed breakdown |
| GET | `/api/v1/reports/district/:tspCode/export` | district | Excel export |

### 4.4 Reference Data

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/categories/:type` | Categories |
| GET | `/api/v1/locations/townships` | Townships |
| GET | `/api/v1/locations/townvgs` | Townvgs |
| GET | `/api/v1/locations/wardvillages` | Wardvillages |

---

## 5. Role-Based Views

### 5.1 Township Officer

```
Scope: own tspCode only

Can:
  ✓ View surveys in own township
  ✓ Edit surveys in own township (any status)
  ✓ View township report

Cannot:
  ✗ Create surveys
  ✗ Submit surveys
  ✗ Delete surveys
  ✗ View district report
  ✗ View drilldown
  ✗ Export Excel
```

### 5.2 District Admin

```
Scope: entire district

Can:
  ✓ View all surveys in district
  ✓ Edit any survey
  ✓ Delete any survey
  ✓ View district report
  ✓ View township reports
  ✓ View drilldown
  ✓ Export Excel

Cannot:
  ✗ Create surveys
  ✗ Submit surveys
```

---

## 6. Key Screens

### 6.1 Survey List

```
┌─────────────────────────────────────────┐
│ Survey List                             │
├─────────────────────────────────────────┤
│ Filter: [Status ▼] [Search...]         │
├─────────────────────────────────────────┤
│ Survey ID | Household | Status | Date   │
│ 1         | ဦးအောင်    | draft  | 10/05  │
│ 2         | ဒုတိယ      | submitted | 10/04 │
│ ...                                    │
└─────────────────────────────────────────┘
```

### 6.2 Survey Detail / Edit

```
┌─────────────────────────────────────────┐
│ Survey #1                        [Edit]  │
├─────────────────────────────────────────┤
│ Household: ဦးအောင်မြင့်               │
│ Phone: 09123456789                      │
│ Date: 2026-10-05                        │
├─────────────────────────────────────────┤
│ Big Animals                             │
│ ┌─────────────────────────────────────┐ │
│ │ Category | Age | Sex | Count        │ │
│ │ ဒေသနွား  | <1  | အထီး | 2            │ │
│ │ အသားစား | >3  | အမ   | 7            │ │
│ └─────────────────────────────────────┘ │
│ [+ Add Row]                             │
├─────────────────────────────────────────┤
│ Small Animals / Poultry / Breeding     │
├─────────────────────────────────────────┤
│ Status: draft                           │
│ [Save Draft] [Submit]                   │
└─────────────────────────────────────────┘
```

### 6.3 District Report

```
┌─────────────────────────────────────────┐
│ District Report                         │
├─────────────────────────────────────────┤
│ Total Surveys: 4                        │
│ Total Big Animals: 21                   │
│ Total Small Animals: 8                  │
│ Total Poultry: 26                       │
├─────────────────────────────────────────┤
│ By Township                             │
│ ┌─────────────────────────────────────┐ │
│ │ Township | Surveys | Big | Small   │ │
│ │ ဝမ်းတွင်း  | 3       | 17  | 7       │ │
│ │ မိတ္ထီလာ  | 1       | 4   | 1       │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### 6.4 Drilldown

```
┌─────────────────────────────────────────┐
│ Drilldown                               │
├─────────────────────────────────────────┤
│ Level: [Township ▼]                     │
│ Type: [Big Animals ▼]                   │
│ Category: [All ▼]                       │
│ Age: [All ▼]                            │
│ Sex: [All ▼]                            │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ Township | Households | Total | Male │ │
│ │ ဝမ်းတွင်း  | 2          | 14    | 8    │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## 7. Middleware (Auth Guard)

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Validate token (optional: call /api/v1/auth/refresh)
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/township/:path*', '/district/:path*'],
};
```

---

## 8. Environment Variables

```env
# .env.local
API_BASE_URL=http://localhost:3100/api/v1
JWT_SECRET=your-secret
```

---

## 9. Error Handling

| Error | UI Action |
|-------|-----------|
| 401 Unauthorized | Redirect to /login |
| 403 Forbidden | Show "No permission for this area" |
| 404 Not Found | Show "Survey not found" |
| 409 Invalid state | Show "Survey is locked after submit" |
| 422 Validation | Show validation errors inline |
| 429 Rate limit | Show "Too many requests, retry later" |
| 500 Server error | Show "Server error, retry later" |
