# Livestock Survey System - Backend Architecture & Design Documentation

## Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Database Design (MongoDB)](#database-design-mongodb)
4. [System Architecture](#system-architecture)
5. [API Design](#api-design)
6. [Authentication & Authorization](#authentication--authorization)
7. [Offline Sync Design](#offline-sync-design)
8. [Security](#security)
9. [Concurrency & Performance](#concurrency--performance)
10. [Low Network / Offline Resilience](#low-network--offline-resilience)
11. [Deployment](#deployment)

---

## System Overview

Livestock Survey System သည် ကျေးရွာအဆင့်မှ စာရင်းကောက်ယူခြင်း၊ မြို့နယ်အဆင့်မှ စစ်ဆေးခြင်း၊ ခရိုင်အဆင့်မှ အတည်ပြုခြင်းတို့ကို ပံ့ပိုးပေးသော စနစ်ဖြစ်သည်။

### Key Features

- တိရစ္ဆာန်အမျိုးများ (Big Animal, Small Animal, Poultry) ခွဲခြားကောက်ယူခြင်း
- 3 ဆင့် role-based access control (District, Township, Village)
- Online/Offline နှစ်မျိုးလုပ်ဆောင်နိုင်ခြင်း
- ကျေးရွာအလိုက် စာရင်းကောက်ယူခြင်း

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 20+ |
| Framework | Express.js / NestJS |
| Database | MongoDB Atlas (NoSQL) |
| ODM | Mongoose |
| Cache | Redis |
| Auth | JWT (jsonwebtoken) |
| Validation | Zod / Joi |
| Offline Storage | SQLite (mobile) |

---

## Database Design (MongoDB)

### Database: `livestock_survey`

### Collections & Schemas

#### 1. `townships` (ခရိုင်များ)

```javascript
{
  _id: ObjectId,
  tspCode: String,        // Primary identifier
  tspName: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### 2. `townvgs` (မြို့နယ်များ)

```javascript
{
  _id: ObjectId,
  tvgCode: String,
  tvgName: String,
  tspCode: String,        // Reference to township
  createdAt: Date,
  updatedAt: Date
}
```

#### 3. `wardvillages` (ကျေးရွာများ)

```javascript
{
  _id: ObjectId,
  wvCode: String,
  wvName: String,
  tvgCode: String,        // Reference to town_vg
  createdAt: Date,
  updatedAt: Date
}
```

#### 4. `users` (အသုံးပြုသူများ)

```javascript
{
  _id: ObjectId,
  loginCode: String,      // Login code = location code (see Login Rules)
  passwordHash: String,
  role: String,           // 'district' | 'township' | 'village'
  tspCode: String,        // မြို့နယ် code (township အတွက်; district: null)
  tvgCode: String,        // မြို့/ကျေးရွာအုပ်စု code
  wvCode: String,         // ကျေးရွာ code (village အတွက်)
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

**Login Rules (`loginCode` = location code):**

| Role | `loginCode` | Example | Account အရေအတွက် |
|------|------------|---------|--------------------|
| Village (`village`) | ကျေးရွာ `wvCode` (Ward/Village Pcode) | `194657` | 840 |
| Township (`township`) | မြို့နယ် `tspCode` | `MMR010028` | 4 |
| District (`district`) | ခရိုင် code (township codes ရဲ့ common prefix) | `MMR0100` | 1 |

```
POST /auth/login { loginCode, password }
  → User.findOne({ loginCode })   // location code နဲ့ တိုက်ရိုက်ရှာ
  → bcrypt.compare(password, user.passwordHash)
  → JWT ထုတ် (role, location codes ပါ)
```

**Role Assignment:** အကောင့်တစ်ခု = ဖုန်းတစ်လုံး design ဖြစ်တဲ့အတွက် role ကို DB တွင်
သိမ်းထားပြီး `loginCode` နဲ့ location code ကိုက်/မကိုက် ပြန်စစ်နိုင်သည်။
```javascript
const determineRole = (loginCode) => {
  if (loginCode === 'MMR0100') return 'district';   // ခရိုင်
  if (/^MMR01\d{4}$/.test(loginCode)) return 'township'; // မြို့နယ် (MMR010028-31)
  return 'village';                                  // ကျေးရွာ (numeric pcode)
};
```

#### 5. `interviewinfos` (အင်တာဗျူးအချက်အလက်)

```javascript
{
  _id: ObjectId,          // Internal DB ID
  interviewId: Number,    // Business ID (user-facing)
  hName: String,
  hEdu: String,
  hGender: String,
  hPhone: String,
  hAge: Number,
  ansDate: Date,
  tspCode: String,
  tvgCode: String,
  wvCode: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### 6. `surveys` (စစ်တမ်းခေါင်းစဉ်) - Embedded Design

```javascript
{
  _id: ObjectId,              // Internal DB ID
  surveyId: Number,           // Business ID (user-facing)
  interviewId: ObjectId,      // Reference to interviewinfos._id
  status: String,
  villageHeadmanId: ObjectId,

  // Location codes (denormalized for permission check & reporting)
  tspCode: String,            // ခရိုင်
  tvgCode: String,            // မြို့နယ်
  wvCode: String,             // ကျေးရွာ
  syncVersion: Number,        // Optimistic locking version (offline sync)

  // Embedded animal data (single query, no populate needed)
  bigAnimals: [{
    categoryId: Number,
    ageLimit: String,
    sex: String,
    count: Number
  }],

  smallAnimals: [{
    categoryId: Number,
    ageLimit: String,
    sex: String,
    count: Number
  }],

  poultry: [{
    categoryId: Number,
    ageLimit: String,
    sex: String,
    count: Number
  }],

  // Breeding stock (D-54): conditional section — ageLimit မပါ, sex = male|female သာ
  breedingAnimals: [{
    categoryId: Number,
    sex: String,            // 'male' | 'female' (ca_male မပါ)
    count: Number
  }],
  hasBreeding: Boolean,     // server-derived (breedingAnimals.length > 0) — list filter "သီးသန့်စာရင်း"

  createdAt: Date,
  updatedAt: Date,
  syncedAt: Date              // Last sync timestamp
}
```

#### 7. `biganimalcategories` (တိရစ္ဆာန်ကြီးအမျိုးအစား)

```javascript
{
  _id: ObjectId,
  categoryId: Number,
  name: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### 8. `smallanimalcategories` (တိရစ္ဆာန်အငယ်အမျိုးအစား)

```javascript
{
  _id: ObjectId,
  categoryId: Number,
  name: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### 9. `poultrycategories` (ကြက်/ဘဲ/ငုံအမျိုးအစား)

```javascript
{
  _id: ObjectId,
  categoryId: Number,
  name: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### 10. `breedingcategories` (မျိုးတိရစ္ဆာန်မွေးမြူထားရှိမှု အမျိုးအစား — D-54)

> big/small/poultry master နဲ့ **သီးသန့်** (species နာမည်တူ/မတူ categoryId space ခွဲ — breakdown key မရှုပ်အောင်)။
> Seed: `data/categories.json` key `breeding` (6 rows — spec table အတိုင်း)။

```javascript
{
  _id: ObjectId,
  categoryId: Number,       // unique — breeding space တစ်ခုတည်း
  name: String,
  createdAt: Date,
  updatedAt: Date
}
```

### ID Strategy

| ID Type | Purpose | Example | Collection |
|---------|---------|---------|------------|
| `_id` | Internal DB ID | `ObjectId("...")` | All |
| `surveyId` | Business ID (Redis INCR) | `1, 2, 3...` | surveys |
| `interviewId` | Business ID (Redis INCR) | `1, 2, 3...` | interviewinfos |
| `Idempotency-Key` | Sync retry dedup (header, UUID) | `uuid-v4` | Request header only |

**ID Responsibilities:**

```
┌─────────────────────────────────────────────────────────────┐
│                        ID Strategy                           │
├─────────────────────────────────────────────────────────────┤
│  _id (ObjectId)     → MongoDB internal use only              │
│  surveyId (Number)  → User-facing, Redis INCR generated     │
│  interviewId (Number) → User-facing, Redis INCR generated   │
│  Idempotency-Key    → Per-request UUID header, sync retry   │
│                       dedup (NOT stored on documents)       │
└─────────────────────────────────────────────────────────────┘
```

> **Note:** အကောင့် ၁ : ဖုန်း ၁ design ဖြစ်တဲ့အတွက် per-record `localId` UUID မထားတော့ဘူး။
> Sync push request header မှာ `Idempotency-Key` (UUID) တစ်ခုပဲ ပို့ပြီး server က
> Redis မှာ TTL နဲ့ dedupe လုပ်တယ် — network timeout retry ကြောင့် record
> ထပ်မသွားအောင်။

### Distributed ID Generation (Redis INCR)

```javascript
// services/idService.js
const redis = require('./redis');

// Initialize Redis keys on startup (prevent duplicate IDs after reboot)
const initializeIdCounters = async () => {
  const maxSurveyId = await Survey.findOne()
    .sort({ surveyId: -1 })
    .select('surveyId')
    .lean();

  const maxInterviewId = await InterviewInfo.findOne()
    .sort({ interviewId: -1 })
    .select('interviewId')
    .lean();

  // Set Redis key only if it doesn't exist
  if (maxSurveyId) {
    await redis.setnx('survey:id', maxSurveyId.surveyId);
  }
  if (maxInterviewId) {
    await redis.setnx('interview:id', maxInterviewId.interviewId);
  }
};

const generateSurveyId = async () => {
  return await redis.incr('survey:id');
};

const generateInterviewId = async () => {
  return await redis.incr('interview:id');
};

// Usage in survey service
const createSurvey = async (data) => {
  const surveyId = await generateSurveyId();

  // 1. Create interview first → get ObjectId ref
  const interview = await InterviewInfo.create({
    interviewId: await generateInterviewId(),
    ...data.interview
  });

  // 2. Create survey referencing interview._id (NOT the Number business ID)
  const survey = await Survey.create({
    ...data,
    surveyId,
    interviewId: interview._id
  });

  return survey;
};
```

**Startup Sequence:**
```
1. Connect to MongoDB
2. Connect to Redis
3. initializeIdCounters() ← Prevent duplicate IDs
4. Start Express server
```

### Indexes

```javascript
// users
db.users.createIndex({ loginCode: 1 }, { unique: true })
db.users.createIndex({ tspCode: 1, tvgCode: 1, wvCode: 1 })

// surveys
db.surveys.createIndex({ surveyId: 1 }, { unique: true })
db.surveys.createIndex({ status: 1 })
db.surveys.createIndex({ villageHeadmanId: 1 })
db.surveys.createIndex({ tspCode: 1, status: 1 })
db.surveys.createIndex({ wvCode: 1, status: 1 })   // village-level queries
db.surveys.createIndex({ deletedAt: 1, createdAt: -1 })   // list default sort -createdAt (G1 fix)

// interviewinfos
db.interviewinfos.createIndex({ interviewId: 1 }, { unique: true })

// location
db.townvgs.createIndex({ tspCode: 1 })
db.wardvillages.createIndex({ tvgCode: 1 })
```

### Validation Rules

| Collection | Field | Rule |
|------------|-------|------|
| `surveys.bigAnimals` | `ageLimit` | Enum: `LessThanOne`, `Between1and3`, `Over3` |
| `surveys.bigAnimals` | `sex` | Enum: `male`, `ca_male`, `female` |
| `surveys.smallAnimals` | `ageLimit` | Enum: `Under2months`, `Between2and6months`, `Over6months` (D-55 — ၂လ/၆လ month-based, big နဲ့ မတူ) |
| `surveys.smallAnimals` | `sex` | Enum: `male`, `ca_male`, `female` |
| `surveys.poultry` | `ageLimit` | Enum: `Young`, `Middle`, `Old` (D-55 — ငယ်/လတ်/ကြီး) |
| `surveys.poultry` | `sex` | Enum: `male`, `female` |
| `surveys.breedingAnimals` | `sex` | Enum: `male`, `female` (**ageLimit field မရှိ** — D-54) |
| `users` | `role` | Enum: `district`, `township`, `village` |
| `surveys` | `status` | Enum: `draft`, `submitted` |

### Mongoose Schema Validation

```javascript
// models/Survey.js
const bigAnimalSchema = new mongoose.Schema({
  categoryId: { type: Number, required: true, ref: 'BigAnimalCategory' },
  ageLimit: {
    type: String,
    enum: ['LessThanOne', 'Between1and3', 'Over3'],
    required: true
  },
  sex: {
    type: String,
    enum: ['male', 'ca_male', 'female'],
    required: true
  },
  count: { type: Number, min: 0, default: 0 }
});

// Small has its OWN age enum (month-based, D-55) — must NOT reuse bigAnimalSchema
const smallAnimalSchema = new mongoose.Schema({
  categoryId: { type: Number, required: true, ref: 'SmallAnimalCategory' },
  ageLimit: {
    type: String,
    enum: ['Under2months', 'Between2and6months', 'Over6months'],
    required: true
  },
  sex: {
    type: String,
    enum: ['male', 'ca_male', 'female'],
    required: true
  },
  count: { type: Number, min: 0, default: 0 }
});

// Poultry has DIFFERENT enums — must NOT reuse bigAnimalSchema
const poultrySchema = new mongoose.Schema({
  categoryId: { type: Number, required: true, ref: 'PoultryCategory' },
  ageLimit: {
    type: String,
    enum: ['Young', 'Middle', 'Old'],
    required: true
  },
  sex: {
    type: String,
    enum: ['male', 'female'],
    required: true
  },
  count: { type: Number, min: 0, default: 0 }
});

// Breeding (D-54): sex-only — no ageLimit, no ca_male
const breedingAnimalSchema = new mongoose.Schema({
  categoryId: { type: Number, required: true, ref: 'BreedingCategory' },
  sex: { type: String, enum: ['male', 'female'], required: true },
  count: { type: Number, min: 0, default: 0 }
});

const surveySchema = new mongoose.Schema({
  surveyId: { type: Number, required: true, unique: true },
  interviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewInfo', required: true },
  status: { type: String, enum: ['draft', 'submitted'], default: 'draft' },
  villageHeadmanId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  tspCode: { type: String, required: true, index: true },
  tvgCode: { type: String, required: true },
  wvCode: { type: String, required: true, index: true },
  syncVersion: { type: Number, default: 0 },
  bigAnimals: [bigAnimalSchema],
  smallAnimals: [smallAnimalSchema],
  poultry: [poultrySchema],
  breedingAnimals: { type: [breedingAnimalSchema], default: [] },
  hasBreeding: { type: Boolean, default: false, index: true }
}, { timestamps: true });

// Compound indexes for embedded arrays
surveySchema.index({ surveyId: 1 }, { unique: true });
surveySchema.index({ status: 1 });
surveySchema.index({ tspCode: 1, status: 1 });
surveySchema.index({ wvCode: 1, status: 1 });
surveySchema.index({ 'bigAnimals.categoryId': 1 });
surveySchema.index({ 'smallAnimals.categoryId': 1 });
surveySchema.index({ 'poultry.categoryId': 1 });
surveySchema.index({ 'breedingAnimals.categoryId': 1 });
surveySchema.index({ deletedAt: 1, createdAt: -1 });

module.exports = mongoose.model('Survey', surveySchema);
```

```javascript
// models/User.js
const userSchema = new mongoose.Schema({
  loginCode: { type: String, required: true, unique: true, trim: true },
  passwordHash: { type: String, required: true },
  role: {
    type: String,
    enum: ['district', 'township', 'village'],
    required: true
  },
  tspCode: { type: String },
  tvgCode: { type: String },
  wvCode: { type: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

userSchema.index({ tspCode: 1, tvgCode: 1, wvCode: 1 });

module.exports = mongoose.model('User', userSchema);
```

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  Web App     │  │  Mobile App  │  │  Admin Panel │       │
│  │  (React)     │  │  (Flutter)   │  │  (React)     │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway                             │
│              (Rate Limiting, SSL, CORS)                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend Server (Node.js)                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Middleware Layer                                    │    │
│  │  - Auth Middleware (JWT)                             │    │
│  │  - Role Middleware (RBAC)                            │    │
│  │  - Logging Middleware                                │    │
│  │  - Rate Limiting Middleware                          │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Controller Layer                                    │    │
│  │  - AuthController                                    │    │
│  │  - SurveyController                                  │    │
│  │  - SyncController                                    │    │
│  │  - ReportController                                  │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Service Layer                                       │    │
│  │  - AuthService                                       │    │
│  │  - SurveyService                                     │    │
│  │  - SyncService                                       │    │
│  │  - ReportService                                     │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Repository Layer (Mongoose)                         │    │
│  │  - SurveyRepository                                  │    │
│  │  - UserRepository                                    │    │
│  │  - LocationRepository                                │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ MongoDB Atlas│  │    Redis     │  │  Local SQLite│       │
│  │  (Primary)   │  │   (Cache)    │  │  (Offline)   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### Design Patterns

| Pattern | Usage |
|---------|-------|
| **Repository Pattern** | MongoDB data access abstraction |
| **Service Layer Pattern** | Business logic separation |
| **Middleware Pattern** | Auth, logging, rate limiting |
| **RBAC Pattern** | Role-based access control |
| **Cache-Aside Pattern** | Redis caching for location data |
| **Queue Pattern** | Offline sync, report generation |
| **Retry Pattern** | Network failure handling |

---

## API Design

### Base URL

```
/api/v1
```

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | User login |
| POST | `/auth/refresh` | Refresh JWT token |
| POST | `/auth/logout` | User logout |

### Survey Endpoints

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/surveys` | List surveys (with filters) | All |
| GET | `/surveys/:id` | Get single survey | All |
| POST | `/surveys` | Create new survey | Village |
| PUT | `/surveys/:id` | Update survey | All (own scope) |
| DELETE | `/surveys/:id` | Delete survey | All (own scope) |
| POST | `/surveys/:id/submit` | Submit survey | Village |

### Sync Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/sync/push` | Push offline data to server |
| GET | `/sync/pull` | Pull latest data from server |

**`POST /sync/push` Requirements:**

| Header | Required | Description |
|--------|----------|-------------|
| `Idempotency-Key` | Yes | UUID v4, one per sync queue item. Server dedupes via Redis `idem:<key>` (24h TTL) — retry with the same key returns the stored response instead of creating a duplicate. |

### Report Endpoints

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/reports/district` | District-level report | District |
| GET | `/reports/township/:tspCode` | Township-level report | Township, District |

### Response Format

**Success Response:**
```json
{
  "data": { ... },
  "meta": {
    "total": 100,
    "page": 1,
    "per_page": 20
  }
}
```

**Error Response:**
```json
{
  "error": {
    "code": "validation_error",
    "message": "Request validation failed",
    "details": [
      {
        "field": "hName",
        "message": "Required"
      }
    ]
  }
}
```

### Status Codes

| Code | Usage |
|------|-------|
| 200 | GET, PUT, PATCH success |
| 201 | POST created |
| 204 | DELETE success |
| 400 | Validation error |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not found |
| 409 | Conflict |
| 422 | Unprocessable entity |
| 429 | Rate limit exceeded |

### Query Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `page` | number | Page number | `?page=1` |
| `per_page` | number | Items per page (max 100) | `?per_page=20` |
| `status` | string | Filter by status | `?status=submitted` |
| `tspCode` | string | Filter by township | `?tspCode=001` |
| `wvCode` | string | Filter by village | `?wvCode=001001001` |
| `sort` | string | Sort field (prefix `-` for desc) | `?sort=-createdAt` |
| `fields` | string | Select specific fields | `?fields=surveyId,status` |

### Request/Response Examples

#### Create Survey

**Request:**
```http
POST /api/v1/surveys
Authorization: Bearer <token>
Content-Type: application/json

{
  "hName": "ဦးအောင်",
  "hEdu": "ဘွဲ့",
  "hGender": "အထီး",
  "hPhone": "0912345",
  "hAge": 45,
  "ansDate": "2024-01-15",
  "tspCode": "001",
  "tvgCode": "001001",
  "wvCode": "001001001"
}
```

**Response (201):**
```json
{
  "data": {
    "surveyId": 1,
    "status": "draft",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

#### List Surveys

**Request:**
```http
GET /api/v1/surveys?status=submitted&page=1&per_page=20
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "data": [
    {
      "surveyId": 1,
      "status": "submitted",
      "hName": "ဦးအောင်",
      "wvCode": "001001001"
    }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "per_page": 20,
    "total_pages": 5
  }
}
```

### Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `validation_error` | 400/422 | Input validation failed |
| `unauthorized` | 401 | Missing/invalid token |
| `forbidden` | 403 | Insufficient permissions |
| `not_found` | 404 | Resource not found |
| `duplicate_entry` | 409 | Duplicate key |
| `rate_limit_exceeded` | 429 | Too many requests |
| `internal_error` | 500 | Server error |

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

### API Versioning

| Version | Status | Notes |
|---------|--------|-------|
| `/api/v1/` | Current | Stable |
| `/api/v2/` | Planned | Future features |

**Versioning Rules:**
- Non-breaking changes → same version
- Breaking changes → new version
- Deprecation notice: 6 months before removal

---

## Authentication & Authorization

### JWT Token Structure

```json
{
  "userId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "loginCode": "194657",
  "role": "village",
  "tspCode": "MMR010031",
  "tvgCode": "MMR010031047",
  "wvCode": "194657",
  "exp": 1699999999
}
```

**Login Code Examples (role အလိုက်):**

| Role | `loginCode` ဝင်ရမည့် code |
|------|---------------------------|
| Village | `194657` (ကျေးရွာ wvCode) |
| Township | `MMR010028` (မြို့နယ် tspCode) |
| District | `MMR0100` (ခရိုင် code) |

### Role Permissions

| Role | Create | Edit | Delete | View Scope |
|------|--------|------|--------|------------|
| Village | ✅ | ✅ | ✅ | Own village |
| Township | ✅ | ✅ | ✅ | Own township |
| District | ✅ | ✅ | ✅ | All |

### Permission Check Logic

```javascript
function canEdit(user, survey) {
  if (user.role === 'district') return true;
  if (user.role === 'township') return survey.tspCode === user.tspCode;
  if (user.role === 'village') return survey.wvCode === user.wvCode;
  return false;
}
```

---

## Offline Sync Design

### Sync Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                     Mobile App (Offline)                     │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │  Local DB   │───>│  Sync Queue │───>│  Sync Engine│     │
│  │  (SQLite)   │    │  (Pending)  │    │  (Background)│    │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Network Available
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       Server (Online)                        │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │ MongoDB     │<───│  Sync API   │<───│  Conflict   │     │
│  │  Atlas      │    │  (/sync)    │    │  Resolver   │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Conflict Resolution

- **Strategy:** Optimistic Locking with version number
- **Alternative:** Manual merge for critical data

```javascript
// Sync with version check + Idempotency-Key dedup
const syncSurvey = async (idempotencyKey, serverVersion, data) => {
  // 1. Idempotency check - retry of an already-processed request?
  const processed = await redis.get(`idem:${idempotencyKey}`);
  if (processed) {
    // Same request already applied - return stored result, no duplicate
    return JSON.parse(processed);
  }

  // 2. Find existing survey by business ID
  const existing = await Survey.findOne({ surveyId: data.surveyId });

  let result;
  if (!existing) {
    // New survey - create
    result = await Survey.create({ ...data, syncVersion: 1 });
  } else if (data.syncVersion <= existing.syncVersion) {
    // Stale data - reject
    throw new Error('Stale data - please refresh');
  } else {
    // Update with new version
    result = await Survey.findOneAndUpdate(
      { surveyId: data.surveyId },
      { ...data, syncVersion: data.syncVersion },
      { new: true }
    );
  }

  // 3. Store result for 24h so retries return the same response
  await redis.setex(`idem:${idempotencyKey}`, 86400, JSON.stringify(result));
  return result;
};
```

### Sync Flow

1. Village headman creates survey offline → saved to SQLite (`id` AUTOINCREMENT)
2. Network becomes available → sync engine picks queue item
3. Client generates one `Idempotency-Key` (UUID) per queue item,
   sends `POST /sync/push` with header `Idempotency-Key: <uuid>`
4. Server checks Redis `idem:<uuid>`:
   - **Hit** → already processed, return stored response (no duplicate)
   - **Miss** → validate, merge (optimistic locking), store result in Redis (24h TTL)
5. Client marks SQLite row `synced`, stores `server_id` from response
6. Network fail mid-push → retry with the **same** `Idempotency-Key`
   (stored in `sync_queue.idempotency_key`) → server dedupes automatically

---

## Security

### 1. Authentication

#### 1.1 Password Hashing (bcrypt)

```javascript
// services/authService.js
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 12;

const hashPassword = async (password) => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

const verifyPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};
```

#### 1.2 JWT Token Management

```javascript
// utils/jwt.js
const jwt = require('jsonwebtoken');

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};
```

#### 1.3 Token Refresh Flow

```
Client → POST /auth/refresh (refreshToken)
Server → verify refreshToken
Server → generate new accessToken
Client → use new accessToken
```

### 2. Authorization

#### 2.1 Role-Based Access Control (RBAC)

```javascript
// middleware/rbac.js
const roles = {
  district: ['read:all', 'write:all', 'delete:all', 'approve'],
  township: ['read:township', 'write:township', 'delete:township'],
  village: ['read:village', 'write:village', 'delete:village']
};

const requireRole = (permission) => {
  return (req, res, next) => {
    if (!roles[req.user.role]?.includes(permission)) {
      return res.status(403).json({
        error: { code: 'forbidden', message: 'Insufficient permissions' }
      });
    }
    next();
  };
};
```

#### 2.2 Resource-Level Permissions

```javascript
// middleware/ownership.js
// GOOD: Single query with permission check
const canAccessSurvey = async (req, res, next) => {
  const { role, tspCode, wvCode } = req.user;

  // Build query based on role
  const query = { _id: req.params.id };
  if (role === 'township') query.tspCode = tspCode;
  if (role === 'village') query.wvCode = wvCode;

  const survey = await Survey.findOne(query).lean();

  if (!survey) {
    return res.status(404).json({ error: { code: 'not_found' } });
  }

  req.survey = survey;
  next();
};
```

### 3. Data Protection

#### 3.1 NoSQL Injection Prevention

```javascript
// BAD: Vulnerable to NoSQL injection
const surveys = await Survey.find({ loginCode: req.body.loginCode });

// GOOD: Use Mongoose (built-in sanitization)
const surveys = await Survey.find({ loginCode: String(req.body.loginCode) });

// GOOD: Use Zod validation
const schema = z.object({ loginCode: z.string() });
const { loginCode } = schema.parse(req.body);
```

#### 3.2 XSS Prevention

```javascript
// utils/sanitize.js
const DOMPurify = require('isomorphic-dompurify');

const sanitizeInput = (data) => {
  if (typeof data === 'string') {
    return DOMPurify.sanitize(data);
  }
  if (Array.isArray(data)) {
    return data.map(sanitizeInput);
  }
  if (typeof data === 'object') {
    return Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, sanitizeInput(v)])
    );
  }
  return data;
};
```

#### 3.3 CSRF Protection

```javascript
// middleware/csrf.js
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });

app.use(csrfProtection);
```

### 4. Rate Limiting

```javascript
// middleware/rateLimit.js
// GOOD: Redis-based rate limiter (shared across all instances)
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);

const rateLimiter = (windowMs, max) => {
  return async (req, res, next) => {
    const key = `ratelimit:${req.user?.userId || req.ip}`;

    // Atomic increment + expire
    const pipeline = redis.pipeline();
    pipeline.incr(key);
    pipeline.pexpire(key, windowMs);
    const [current] = await pipeline.exec();

    const remaining = Math.max(0, max - current);
    res.set('X-RateLimit-Limit', max);
    res.set('X-RateLimit-Remaining', remaining);

    if (current > max) {
      return res.status(429).json({
        error: {
          code: 'rate_limit_exceeded',
          message: 'Too many requests, please try again later.'
        }
      });
    }

    next();
  };
};

const rateLimiters = {
  anonymous: rateLimiter(60 * 1000, 30),
  village: rateLimiter(60 * 1000, 100),
  township: rateLimiter(60 * 1000, 200),
  district: rateLimiter(60 * 1000, 500),
};
```

| Role | Limit |
|------|-------|
| Anonymous | 30/min |
| Village | 100/min |
| Township | 200/min |
| District | 500/min |

**Why Redis:** In-memory rate limiter က multi-instance deployment မှာ မှားယွင်းနိုင်ပါတယ်။ Redis က shared store အဖြစ် အလုပ်လုပ်ပြီး အကောင်းဆုံး accuracy ပေးပါတယ်။

### 5. HTTPS & CORS

```javascript
// config/cors.js
const cors = require('cors');

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### 6. Security Headers

```javascript
// middleware/securityHeaders.js
const helmet = require('helmet');

app.use(helmet());
app.use(helmet.contentSecurityPolicy());
app.use(helmet.hsts({ maxAge: 31536000 }));
```

### 7. Input Validation

```javascript
// All inputs validated with Zod (see Input Validation section)
const schema = z.object({
  loginCode: z.string().min(3).max(50),
  password: z.string().min(8)
});
```

### 8. Audit Logging

```javascript
// middleware/auditLog.js
// GOOD: Async logging with queue (non-blocking)
const auditLog = (req, res, next) => {
  const log = {
    timestamp: new Date(),
    userId: req.user?._id,
    role: req.user?.role,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent')
  };

  // Non-blocking: add to queue, don't await
  auditQueue.add(log).catch(console.error);

  next();
};
```

### 9. Security Checklist

| Area | Status |
|------|--------|
| Password hashing (bcrypt) | ✅ |
| JWT with expiration | ✅ |
| RBAC permissions | ✅ |
| Resource-level access | ✅ |
| NoSQL injection prevention | ✅ |
| XSS prevention | ✅ |
| CSRF protection | ✅ |
| Rate limiting | ✅ |
| HTTPS | ✅ |
| CORS | ✅ |
| Security headers | ✅ |
| Input validation | ✅ |
| Audit logging | ✅ |

---

## Deployment

### Development

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env

# Run development server
npm run dev
```

### Production

```bash
# Build
npm run build

# Start with PM2
pm2 start dist/index.js --name livestock-survey

# Or with Docker
docker build -t livestock-survey .
docker run -p 3000:3000 livestock-survey
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB Atlas connection string | - |
| `REDIS_URL` | Redis connection URL | - |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRATION` | Token expiration | 24h |
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment | development |

### MongoDB Atlas Setup

1. Create cluster at https://cloud.mongodb.com
2. Create database user
3. Whitelist IP addresses
4. Get connection string
5. Set `MONGODB_URI` environment variable

---

## Concurrency & Performance

### 1. MongoDB Connection Pooling

```javascript
// config/database.js
const mongoose = require('mongoose');

const connectDB = async () => {
  const options = {
    maxPoolSize: 50,        // Max connections in pool
    minPoolSize: 10,        // Min connections in pool
    maxIdleTimeMS: 30000,   // Close idle connections after 30s
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  };

  await mongoose.connect(process.env.MONGODB_URI, options);
};
```

### 2. Redis Caching Strategy

```javascript
// Cache-Aside Pattern for location data (role-scoped, D-57)
const getTownships = async (redis, user) => {
  // village/township = own tspCode, district = districtCode, no user = all
  const scope = user
    ? (user.role === 'district' ? `district:${user.districtCode}` : `tsp:${user.tspCode}`)
    : 'all';
  const cacheKey = `locations:townships:${scope}`;

  // Check cache first
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // Cache miss - fetch from MongoDB (scoped query)
  const query = user
    ? (user.role === 'district' ? { districtCode: user.districtCode } : { tspCode: user.tspCode })
    : {};
  const townships = await Township.find(query).sort({ tspCode: 1 }).lean();

  // Cache for 1 hour (location data rarely changes)
  await redis.setex(cacheKey, 3600, JSON.stringify(townships));

  return townships;
};
```

### 3. Rate Limiting

```javascript
// middleware/rateLimit.js
const rateLimit = require('express-rate-limit');

const createRateLimiter = (windowMs, max) => rateLimit({
  windowMs,
  max,
  message: {
    error: {
      code: 'rate_limit_exceeded',
      message: 'Too many requests, please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Role-based rate limits
const rateLimiters = {
  anonymous: createRateLimiter(60 * 1000, 30),    // 30/min
  village: createRateLimiter(60 * 1000, 100),     // 100/min
  township: createRateLimiter(60 * 1000, 200),    // 200/min
  district: createRateLimiter(60 * 1000, 500),    // 500/min
};
```

### 4. Database Query Optimization

#### 4.1 N+1 Query Prevention

```javascript
// BAD: N+1 query problem
const surveys = await Survey.find({ status: 'submitted' });
for (const survey of surveys) {
  survey.interview = await InterviewInfo.findById(survey.interviewId);
}

// GOOD: Use populate (join)
const surveys = await Survey.find({ status: 'submitted' })
  .populate('interviewId')
  .lean();
```

#### 4.2 Cursor-Based Pagination

```javascript
// GOOD: Pagination with cursor (scalable for large datasets)
const getSurveys = async (cursor, limit = 20) => {
  const query = cursor ? { _id: { $gt: cursor } } : {};
  const surveys = await Survey.find(query)
    .sort({ _id: 1 })
    .limit(limit + 1)
    .lean();

  const hasNext = surveys.length > limit;
  const nextCursor = hasNext ? surveys[limit]._id : null;

  return {
    data: surveys.slice(0, limit),
    meta: { hasNext, nextCursor }
  };
};
```

#### 4.3 Aggregation Pipeline (Reports)

```javascript
// District-level report with aggregation (embedded design)
const getDistrictReport = async (tspCode) => {
  return await Survey.aggregate([
    { $match: { tspCode, status: 'submitted' } },
    {
      $lookup: {
        from: 'interviewinfos',
        localField: 'interviewId',
        foreignField: '_id',
        as: 'interview'
      }
    },
    { $unwind: '$interview' },
    {
      $group: {
        _id: '$tspCode',
        totalSurveys: { $sum: 1 },
        totalHouseholds: { $sum: 1 },
        avgAge: { $avg: '$interview.hAge' },
        // Sum embedded animal arrays
        totalBigAnimals: { $sum: { $sum: '$bigAnimals.count' } },
        totalSmallAnimals: { $sum: { $sum: '$smallAnimals.count' } },
        totalPoultry: { $sum: { $sum: '$poultry.count' } }
      }
    }
  ]);
};

// Township-level report
const getTownshipReport = async (tspCode) => {
  return await Survey.aggregate([
    { $match: { tspCode, status: 'submitted' } },
    {
      $group: {
        _id: '$wvCode',
        totalSurveys: { $sum: 1 },
        totalBigAnimals: { $sum: { $sum: '$bigAnimals.count' } },
        totalSmallAnimals: { $sum: { $sum: '$smallAnimals.count' } },
        totalPoultry: { $sum: { $sum: '$poultry.count' } }
      }
    },
    { $sort: { totalSurveys: -1 } }
  ]);
};
```

#### 4.3.1 Filtered Village Query (categoryId + ageLimit + sex)

**ဥပမာ:** မိတ္ထီလာမြို့နယ်၊ တောမကျေးရွာ (`wvCode: '193887'`) ရဲ့
တစ်နှစ်အောက် ဒေသနွား (သား/မ/ကြားဖြတ်) ဘယ်လောက်ရှိလဲ။

```javascript
// Direct query path (real-time, index-backed)
// filters: { categoryId?, ageLimit?, sex? } — ဘယ်ဟာမဆို optional
const getVillageAnimalCount = async (wvCode, filters = {}) => {
  const { categoryId, ageLimit, sex } = filters;

  const animalMatch = {};
  if (categoryId !== undefined) animalMatch['bigAnimals.categoryId'] = categoryId;
  if (ageLimit) animalMatch['bigAnimals.ageLimit'] = ageLimit;
  if (sex) animalMatch['bigAnimals.sex'] = sex;

  const result = await Survey.aggregate([
    // 1. Index: { wvCode: 1, status: 1 } → no COLLSCAN
    { $match: { wvCode, status: 'submitted' } },
    // 2. Embedded array → no join needed
    { $unwind: '$bigAnimals' },
    // 3. Filter by category + age + sex (any combination)
    { $match: animalMatch },
    { $group: { _id: null, total: { $sum: '$bigAnimals.count' } } }
  ]);
  return result[0]?.total ?? 0;
};

// Usage examples:
// getVillageAnimalCount('193887', { categoryId: 1, ageLimit: 'LessThanOne' })
// getVillageAnimalCount('193887', { categoryId: 1, ageLimit: 'LessThanOne', sex: 'male' })
// getVillageAnimalCount('193887', { sex: 'female' })               // အမတွေ အားလုံး
// getVillageAnimalCount('193887', { categoryId: 1 })                // ဒေသနွား အားလုံး
```

**Group-by ပုံစံ (ဥပမာ: ကျေးရွာအတွင်း အသက်အရွယ်/ကားယား အလိုက် ခွဲကြည့်):**

```javascript
const getVillageBreakdown = async (wvCode, categoryId) => {
  return await Survey.aggregate([
    { $match: { wvCode, status: 'submitted' } },
    { $unwind: '$bigAnimals' },
    { $match: { 'bigAnimals.categoryId': categoryId } },
    {
      $group: {
        _id: {
          ageLimit: '$bigAnimals.ageLimit',
          sex: '$bigAnimals.sex'
        },
        total: { $sum: '$bigAnimals.count' }
      }
    },
    { $sort: { '_id.ageLimit': 1, '_id.sex': 1 } }
  ]);
};
// Result: [{ _id: { ageLimit: 'LessThanOne', sex: 'male' }, total: 45 }, ...]
```

**Performance:**

| Path | Operation | Target |
|------|-----------|--------|
| Index scan on `wvCode` | ~1 village's surveys (tens of docs) | < 50ms |
| `$unwind` embedded array | In-memory, no `$lookup` | < 10ms |
| **Total (direct query, any filter combo)** | | **< 100ms** |
| **Total (pre-aggregated)** | 1 doc read from `surveysummaries` | **< 10ms** |

> `sex`/`ageLimit`/`categoryId` filter တွေအားလုံး `$unwind` ပြီးမှ in-memory filter ဖြစ်တဲ့အတွက်
> index ထပ်မထည့်ရဘူး — `wvCode` index တစ်ခုတည်းနဲ့ လုံလောက်တယ် (embedded array filter
> က multikey index ထက် unwind + filter က ပိုမြန်)။
> ကျေးရွာ ၈၄၀ အနက် တစ်ရွာချင်းစီရဲ့ survey က tens–hundreds docs သာ ရှိတဲ့အတွက်
> direct aggregation ကတောင် မြန်တယ် — dashboard အကြိမ်ကြိမ်ပြရင် pre-aggregated path သုံး။

#### 4.3.2 District Drill-Down (ခရိုင် → မြို့နယ် → ကျေးရွာ → အိမ်)

**အသုံးပြုသူ:** ခရိုင် level user — "ဘယ်မြို့နယ်၊ ဘယ်ကျေးရွာ၊ ဘယ်အိမ်မှာ
အကောင်အမျိုးအစား X, အသက်အရွယ် a–b, အထီး/အမ ဘယ်လောက်ရှိလဲ"

**Filter object (အဆင့်တိုင်း အတူတူသုံး):**

```javascript
// GET /api/v1/reports/drilldown
// ?level=township|village|household
// &tspCode=MMR010028&wvCode=193887
// &type=bigAnimals&categoryId=1
// &ageFrom=LessThanOne&ageTo=Between1and3   (age range — enum order)
// &sex=male|female                          (optional)
const buildAnimalFilter = (query) => {
  const { type = 'bigAnimals', categoryId, ageFrom, ageTo, sex } = query;

  // ageLimit enum logical order (alphabetical မကိုက် — B < L < O ဖြစ်နေလို့ rank map သုံး)
  // per-type ranks (D-55): single source src/constants/ageLimits.js
  const AGE_RANKS = {
    bigAnimals: { LessThanOne: 1, Between1and3: 2, Over3: 3 },
    smallAnimals: { Under2months: 1, Between2and6months: 2, Over6months: 3 },
    poultry: { Young: 1, Middle: 2, Old: 3 }
  };
  const rank = AGE_RANKS[type];

  const match = {};
  if (categoryId) match[`${type}.categoryId`] = Number(categoryId);
  if (ageFrom || ageTo) {
    // Allowed values in logical range → $in (safe, no reliance on string order)
    const allowed = Object.keys(rank).filter((a) => {
      if (ageFrom && rank[a] < rank[ageFrom]) return false;
      if (ageTo && rank[a] > rank[ageTo]) return false;
      return true;
    });
    match[`${type}.ageLimit`] = { $in: allowed };
  }
  if (sex) match[`${type}.sex`] = sex;
  return match;
};
```

**Level 1 — ခရိုင် → မြို့နယ် အလိုက်:**

```javascript
const drillToTownship = async (query) => {
  const type = query.type || 'bigAnimals';
  const animalFilter = buildAnimalFilter(query);
  return await Survey.aggregate([
    { $match: { status: 'submitted' } },          // district-wide
    { $unwind: `$${type}` },
    { $match: animalFilter },
    {
      $group: {
        _id: '$tspCode',
        households: { $sum: 1 },
        total: { $sum: `$${type}.count` },
        male: { $sum: { $cond: [{ $eq: [`$${type}.sex`, 'male'] }, `$${type}.count`, 0] } },
        female: { $sum: { $cond: [{ $eq: [`$${type}.sex`, 'female'] }, `$${type}.count`, 0] } }
      }
    },
    { $sort: { total: -1 } }
  ]);
};
```

**Level 2 — မြို့နယ် → ကျေးရွာ အလိုက်** (same pipeline, `_id: '$wvCode'` + `$match: { tspCode }`):

```javascript
const drillToVillage = async (tspCode, query) => {
  const animalFilter = buildAnimalFilter(query);
  const type = query.type || 'bigAnimals';
  return await Survey.aggregate([
    { $match: { tspCode, status: 'submitted' } },  // index: {tspCode, status}
    { $unwind: `$${type}` },
    { $match: animalFilter },
    {
      $group: {
        _id: '$wvCode',
        households: { $sum: 1 },
        total: { $sum: `$${type}.count` }
      }
    },
    { $sort: { total: -1 } }
  ]);
};
```

**Level 3 — ကျေးရွာ → အိမ် (household) အလိုက်** (survey တစ်ခု = အိမ်တစ်ခု):

```javascript
const drillToHousehold = async (wvCode, query, page = 1, perPage = 20) => {
  const animalFilter = buildAnimalFilter(query);
  const type = query.type || 'bigAnimals';

  const pipeline = [
    { $match: { wvCode, status: 'submitted' } },   // index: {wvCode, status}
    { $unwind: `$${type}` },
    { $match: animalFilter },
    {
      $lookup: {
        from: 'interviewinfos',
        localField: 'interviewId',
        foreignField: '_id',
        as: 'iv'
      }
    },
    { $unwind: '$iv' },
    {
      $group: {
        _id: '$surveyId',
        hName: { $first: '$iv.hName' },
        hPhone: { $first: '$iv.hPhone' },
        total: { $sum: `$${type}.count` },
        male: { $sum: { $cond: [{ $eq: [`$${type}.sex`, 'male'] }, `$${type}.count`, 0] } },
        female: { $sum: { $cond: [{ $eq: [`$${type}.sex`, 'female'] }, `$${type}.count`, 0] } },
        byAge: {
          $push: {
            ageLimit: `$${type}.ageLimit`,
            sex: `$${type}.sex`,
            count: `$${type}.count`
          }
        }
      }
    },
    { $sort: { total: -1 } },
    { $skip: (page - 1) * perPage },
    { $limit: perPage }
  ];

  const [rows, total] = await Promise.all([
    Survey.aggregate(pipeline),
    // count: same match, stop before unwind (cheaper)
    Survey.countDocuments({ wvCode, status: 'submitted', ...animalFilter })
  ]);
  return { data: rows, meta: { total, page, per_page: perPage } };
};
```

**Drill-Down Performance:**

| Level | Scope | Index | Docs scanned | Target |
|-------|-------|-------|--------------|--------|
| 1: ခရိုင် → မြို့နယ် | 4 townships | `{status}` | all submitted (~50k–100k) | < 2s |
| 2: မြို့နယ် → ကျေးရွာ | 1 township | `{tspCode, status}` | ~10k–25k | < 1s |
| 3: ကျေးရွာ → အိမ် | 1 village (paginated) | `{wvCode, status}` | tens–hundreds | < 100ms |

**Path ရွေးချယ်မှု:**

| အခြေအနေ | Path |
|---|---|
| Level 1/2 ကို dashboard အကြိမ်ကြိမ်ပြ | `surveysummaries` breakdown (tspCode/wvCode အလိုက် key) — < 10ms |
| Level 1/2 filter အသစ် (age range, sex ပြောင်း) | Direct aggregation — index-backed |
| Level 3 (အိမ်စာရင်း) | Direct + pagination — အမြဲတမ်း direct (pre-agg မလို) |

> **Age range note:** `ageLimit` က enum string ဖြစ်တဲ့အတွက် `$gte`/`$lte` မသုံးဘူး —
> alphabetical order (`Between1and3` < `LessThanOne` < `Over3`) က logical order နဲ့
> မကိုက်ဘူး။ Per-type rank map (D-55: big `LessThanOne:1…`, small `Under2months:1…`,
> poultry `Young:1…`) နဲ့ allowed values ထုတ်ပြီး `$in` သုံးတယ် — ချောချောမွေ့မွေ့ range filter
> ရတယ်။ type နဲ့ မကိုက်တဲ့ age value → validator မှာ 422။

#### 4.4 Report Response Format

```json
{
  "data": {
    "tspCode": "001",
    "totalSurveys": 1000,
    "totalHouseholds": 1000,
    "avgAge": 42.5,
    "totalBigAnimals": 5000,
    "totalSmallAnimals": 3000,
    "totalPoultry": 8000,
    "totalBreedingAnimals": 420
  }
}
```

#### 4.5 Pre-Aggregated Summary Collection

```javascript
// surveysummaries collection - pre-aggregated data (with breakdown)
{
  _id: ObjectId,
  tspCode: String,
  wvCode: String,

  // Totals (dashboard)
  totalSurveys: Number,
  totalBigAnimals: Number,
  totalSmallAnimals: Number,
  totalPoultry: Number,
  totalBreedingAnimals: Number,   // D-54

  // Breakdown: key = "categoryId:ageLimit:sex" → count
  // e.g. bigBreakdown = { "1:LessThanOne:male": 45, "1:LessThanOne:female": 38,
  //                       "1:Over3:ca_male": 120, ... }
  bigBreakdown: Object,
  smallBreakdown: Object,
  poultryBreakdown: Object,
  // Breeding (D-54): key = "categoryId:sex" (2-part — age မရှိ)
  // e.g. breedingBreakdown = { "1:male": 30, "1:female": 25, "4:female": 12, ... }
  breedingBreakdown: Object,

  lastUpdated: Date
}

// Update summary on survey submit (totals + breakdown နှစ်ခုလုံး)
const updateSummary = async (survey) => {
  const inc = {
    totalSurveys: 1,
    totalBigAnimals: sumArray(survey.bigAnimals),
    totalSmallAnimals: sumArray(survey.smallAnimals),
    totalPoultry: sumArray(survey.poultry),
    totalBreedingAnimals: sumArray(survey.breedingAnimals)
  };

  // Build breakdown increments: dotted path "bigBreakdown.1:LessThanOne:male"
  const addToBreakdown = (acc, arr, field) => {
    for (const a of arr) {
      const key = `${field}.${a.categoryId}:${a.ageLimit}:${a.sex}`;
      acc[key] = (acc[key] || 0) + a.count;
    }
    return acc;
  };
  // Breeding uses 2-part key: "breedingBreakdown.1:male"

  const bigDiff = addToBreakdown({}, survey.bigAnimals, 'bigBreakdown');
  const smallDiff = addToBreakdown({}, survey.smallAnimals, 'smallBreakdown');
  const poultryDiff = addToBreakdown({}, survey.poultry, 'poultryBreakdown');

  await SurveySummary.findOneAndUpdate(
    { tspCode: survey.tspCode, wvCode: survey.wvCode },
    {
      $inc: { ...inc, ...bigDiff, ...smallDiff, ...poultryDiff },
      $set: { lastUpdated: new Date() }
    },
    { upsert: true }
  );
};

// Fast report query (no aggregation needed)
const getDistrictReport = async (tspCode) => {
  return await SurveySummary.find({ tspCode })
    .select('totalSurveys totalBigAnimals totalSmallAnimals totalPoultry totalBreedingAnimals')
    .lean();
};

// Fast filtered query: တောမကျေးရွာ - တစ်နှစ်အောက် ဒေသနွား (sex ပါ/မပါ ရ)
// key အပြည့်မသိရင် prefix scan (breakdown က small map သာ — tens keys)
const getVillageAnimalCountFast = async (wvCode, { categoryId, ageLimit, sex } = {}) => {
  const doc = await SurveySummary.findOne({ wvCode })
    .select('bigBreakdown')
    .lean();
  if (!doc?.bigBreakdown) return 0;

  // Full key: "categoryId:ageLimit:sex"
  if (categoryId !== undefined && ageLimit && sex) {
    return doc.bigBreakdown[`${categoryId}:${ageLimit}:${sex}`] ?? 0;
  }

  // Partial filter → sum matching keys (tens of keys, in-memory)
  const prefix = categoryId !== undefined ? `${categoryId}:` : '';
  let total = 0;
  for (const [key, val] of Object.entries(doc.bigBreakdown)) {
    if (!key.startsWith(prefix)) continue;
    const [, kAge, kSex] = key.split(':');
    if (ageLimit && kAge !== ageLimit) continue;
    if (sex && kSex !== sex) continue;
    total += val;
  }
  return total;
};
```

#### 4.6 Detailed Report with Pagination

```javascript
// Get detailed survey list with pagination
const getDetailedReport = async (tspCode, page = 1, perPage = 20) => {
  const skip = (page - 1) * perPage;

  const [surveys, total] = await Promise.all([
    Survey.find({ tspCode, status: 'submitted' })
      .select('surveyId interviewId bigAnimals smallAnimals poultry')
      .skip(skip)
      .limit(perPage)
      .lean(),
    Survey.countDocuments({ tspCode, status: 'submitted' })
  ]);

  return {
    data: surveys,
    meta: {
      total,
      page,
      per_page: perPage,
      total_pages: Math.ceil(total / perPage)
    }
  };
};
```

#### 4.7 Excel Export

```javascript
// controllers/exportController.js
const ExcelJS = require('exceljs');

const exportToExcel = async (req, res) => {
  const { tspCode } = req.params;

  const surveys = await Survey.find({ tspCode, status: 'submitted' })
    .populate('interviewId')
    .lean();

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Surveys');

  worksheet.columns = [
    { header: 'Survey ID', key: 'surveyId' },
    { header: 'အမည်', key: 'hName' },
    { header: 'ဖုန်း', key: 'hPhone' },
    { header: 'ကျေးရွာ', key: 'wvCode' },
    { header: 'တိရစ္ဆာန်ကြီး', key: 'bigAnimals' },
    { header: 'တိရစ္ဆာန်အငယ်', key: 'smallAnimals' },
    { header: 'ကြက်/ဘဲ/ငုံ', key: 'poultry' }
  ];

  surveys.forEach(s => {
    worksheet.addRow({
      surveyId: s.surveyId,
      hName: s.interviewId?.hName,
      hPhone: s.interviewId?.hPhone,
      wvCode: s.wvCode,
      bigAnimals: sumArray(s.bigAnimals),
      smallAnimals: sumArray(s.smallAnimals),
      poultry: sumArray(s.poultry)
    });
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="surveys_${tspCode}.xlsx"`);

  await workbook.xlsx.write(res);
  res.end();
};
```

**API Endpoint:**
```
GET /api/v1/reports/district/:tspCode/export
```

**Usage:**
- District admin က မြို့နယ်တစ်ခုလုံးက data ကို Excel အဖြစ် download လုပ်နိုင်တယ်
- Pagination နဲ့ ကြည့်ရှုချင်ရင် API ကို သုံးပါ
- ကြီးမားတဲ့ data အတွက် Excel export ပိုသင့်တယ်

#### 4.4 Index Utilization

```javascript
// Use explain() to verify index usage
const explain = await Survey.find({ status: 'submitted', tspCode: '001' })
  .explain('executionStats');

// Check: winningPlan should use INDEX, not COLLSCAN
```

#### 4.5 Projection (Select Only Needed Fields)

```javascript
// BAD: Fetch all fields
const surveys = await Survey.find({ status: 'submitted' });

// GOOD: Select only needed fields
const surveys = await Survey.find({ status: 'submitted' })
  .select('surveyId status interviewId')
  .lean();
```

#### 4.6 Bulk Operations

```javascript
// BAD: Individual inserts
for (const animal of animals) {
  await BigAnimal.create(animal);
}

// GOOD: Bulk insert
await BigAnimal.insertMany(animals, { ordered: false });
```

#### 4.7 Query Patterns Summary

| Pattern | Use Case | Example |
|---------|----------|---------|
| `populate()` | Join related data | Survey + InterviewInfo |
| `aggregate()` | Reports, statistics | District summary |
| `cursor` | Large pagination | Village list |
| `projection` | Reduce payload | Select specific fields |
| `bulkWrite` | Batch operations | Import data |
| `explain()` | Performance check | Verify index usage |

#### 4.8 Role-Based Query Design

```javascript
// Search helper: hName lives in interviewinfos (separate collection),
// so search interviews first → query surveys by interviewId $in
const searchSurveyIds = async (search) => {
  const interviewIds = await InterviewInfo.find({
    hName: { $regex: search, $options: 'i' }
  }).distinct('_id');

  const or = [{ interviewId: { $in: interviewIds } }];
  if (!isNaN(Number(search))) or.push({ surveyId: Number(search) });
  return or;
};

// Village headman - own village only
const getVillageSurveys = async (userId, page, perPage, search) => {
  const user = await User.findById(userId);
  const query = { wvCode: user.wvCode };
  if (search) query.$or = await searchSurveyIds(search);

  const [surveys, total] = await Promise.all([
    Survey.find(query)
      .populate('interviewId', 'hName hPhone')
      .skip((page - 1) * perPage)
      .limit(perPage)
      .lean(),
    Survey.countDocuments(query)
  ]);

  return { data: surveys, meta: { total, page, per_page: perPage } };
};

// Township admin - own township
const getTownshipSurveys = async (userId, page, perPage, search) => {
  const user = await User.findById(userId);
  const query = { tspCode: user.tspCode };
  if (search) query.$or = await searchSurveyIds(search);

  return await Survey.find(query)
    .populate('interviewId', 'hName hPhone wvCode')
    .skip((page - 1) * perPage)
    .limit(perPage)
    .lean();
};

// District admin - all townships
const getDistrictSurveys = async (page, perPage, search) => {
  const query = {};
  if (search) query.$or = await searchSurveyIds(search);

  return await Survey.find(query)
    .populate('interviewId', 'hName hPhone tspCode wvCode')
    .skip((page - 1) * perPage)
    .limit(perPage)
    .lean();
};
```

> **Note:** `hName` က `interviewinfos` မှာသာ ရှိတဲ့အတွက် survey doc ပေါ်မှာ
> `'interview.hName'` နဲ့ search မလုပ်ရဘူး (field မရှိ) — အပေါ်က `$in` pattern ကိုသုံး။
> `interviewinfos.hName` အတွက် index မထည့်ရသေးဘူး — survey အရေအတွက်
> 100k အောက်ဆို regex scan လုံလောက်; ကြီးလာရင် `$text` index ထည့်။

#### 4.9 Performance Targets

| Role | Query Type | Target |
|------|------------|--------|
| Village | List own village | < 1s |
| Township | List own township | < 2s |
| District | List all | < 2s |
| District | Report | < 5s |
| All | Search | < 1s |

#### 4.10 Caching Strategy

```javascript
// Cache location data (rarely changes)
const getCachedLocation = async (type, code) => {
  const cacheKey = `location:${type}:${code}`;
  const cached = await redis.get(cacheKey);

  if (cached) return JSON.parse(cached);

  const data = await Location.findOne({ [`${type}Code`]: code }).lean();
  await redis.setex(cacheKey, 3600, JSON.stringify(data)); // 1 hour

  return data;
};

// Cache survey counts
const getCachedCount = async (query) => {
  const cacheKey = `count:${JSON.stringify(query)}`;
  const cached = await redis.get(cacheKey);

  if (cached) return JSON.parse(cached);

  const count = await Survey.countDocuments(query);
  await redis.setex(cacheKey, 300, JSON.stringify(count)); // 5 min

  return count;
};
```

### 5. Async Job Processing

```javascript
// Queue for offline sync and report generation
const Queue = require('bull');

const syncQueue = new Queue('sync', {
  redis: { host: 'localhost', port: 6379 }
});

// Process sync jobs
syncQueue.process(async (job) => {
  const { surveyData, userId } = job.data;
  // Validate and save to MongoDB
  await Survey.create(surveyData);
});

// Add job to queue
const addSyncJob = async (surveyData, userId) => {
  await syncQueue.add({ surveyData, userId }, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 }
  });
};
```

### 6. Horizontal Scaling

```
                    ┌─────────────┐
                    │   Nginx     │
                    │Load Balancer│
                    │  (Reverse   │
                    │   Proxy)    │
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
    ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
    │  Node.js    │ │  Node.js    │ │  Node.js    │
    │  Instance 1 │ │  Instance 2 │ │  Instance 3 │
    │  (PM2)      │ │  (PM2)      │ │  (PM2)      │
    └──────┬──────┘ └──────┬──────┘ └──────┬──────┘
           │               │               │
           └───────────────┼───────────────┘
                           │
                    ┌──────▼──────┐
                    │   MongoDB   │
                    │   Atlas     │
                    │  (M10)      │
                    └─────────────┘
```

#### 6.1 PM2 Cluster Configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'livestock-survey',
    script: './dist/index.js',
    instances: 4,
    exec_mode: 'cluster',
    max_memory_restart: '512M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

#### 6.2 Nginx Load Balancer Configuration

```nginx
# /etc/nginx/conf.d/livestock-survey.conf
upstream node_cluster {
    least_conn;
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
    server 127.0.0.1:3003;
}

server {
    listen 80;
    server_name api.livestock-survey.com;

    location / {
        proxy_pass http://node_cluster;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 6.3 Deployment Commands

```bash
# Start PM2 cluster
pm2 start ecosystem.config.js

# Reload Nginx
sudo nginx -s reload

# Monitor
pm2 monit
```

### 7. Performance Checklist

| Area | Optimization |
|------|-------------|
| **Database** | Proper indexing, connection pooling, query optimization |
| **Caching** | Redis for location data, session storage |
| **API** | Pagination, compression, response filtering |
| **Async** | Queue for sync, report generation |
| **Scaling** | Horizontal scaling with load balancer |
| **Monitoring** | APM tools (New Relic, Datadog) |

### 9. Additional Improvements

#### 9.1 Health Check Endpoint

```javascript
// controllers/healthController.js
const healthCheck = async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: 'unknown'
  };

  try {
    await mongoose.connection.db.admin().ping();
    health.database = 'connected';
  } catch (error) {
    health.database = 'disconnected';
    health.status = 'error';
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
};
```

#### 9.2 Graceful Shutdown

```javascript
// app.js
const gracefulShutdown = (server) => {
  return async (signal) => {
    console.log(`${signal} received. Starting graceful shutdown...`);

    server.close(async () => {
      console.log('HTTP server closed');
      await mongoose.connection.close(false);
      console.log('MongoDB connection closed');
      process.exit(0);
    });

    // Force shutdown after 30s
    setTimeout(() => {
      console.error('Forced shutdown');
      process.exit(1);
    }, 30000);
  };
};

process.on('SIGTERM', gracefulShutdown(server));
process.on('SIGINT', gracefulShutdown(server));
```

#### 9.3 Request ID Middleware

```javascript
// middleware/requestId.js
const { v4: uuidv4 } = require('uuid');

const requestId = (req, res, next) => {
  req.id = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-Id', req.id);
  next();
};
```

#### 9.4 Query Timeout

```javascript
// config/database.js
const options = {
  maxPoolSize: 50,
  minPoolSize: 10,
  maxIdleTimeMS: 30000,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
};
```

#### 9.5 Environment Validation

```javascript
// config/env.js
const { z } = require('zod');

const envSchema = z.object({
  MONGODB_URI: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRATION: z.string().default('24h'),
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development')
});

const validateEnv = () => {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('Invalid environment variables:', parsed.error.format());
    process.exit(1);
  }
  return parsed.data;
};
```

#### 9.6 Structured Logging (Winston)

```javascript
// utils/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'livestock-survey' },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### 8. Faster Response Optimizations

#### 8.1 Response Compression

```javascript
// middleware/compression.js
const compression = require('compression');

app.use(compression({
  level: 6,           // Balance between speed and compression
  threshold: 1024,    // Only compress responses > 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));
```

**Compression အကျိုးကျေးဇူး:**
- Response size 80% လျှော့နိုင်တယ်
- Network bandwidth သက်သာတယ်
- နှေးကွေးတဲ့ network မှာ ပိုမြန်တယ်

**ဥပမာ:**
```
Original:  100 KB
Compressed: 20 KB (80% သက်သာ)
```

#### 8.2 Caching Headers

```javascript
// middleware/cacheHeaders.js
const setCacheHeaders = (maxAge) => {
  return (req, res, next) => {
    res.set('Cache-Control', `public, max-age=${maxAge}`);
    next();
  };
};

// Location data - cache for 1 hour (role-scoped cache key, D-57)
app.get('/api/v1/locations/townships', setCacheHeaders(3600), getTownships);

// Survey data - no cache
app.get('/api/v1/surveys', (req, res) => {
  res.set('Cache-Control', 'no-store');
  // ...
});
```

#### 8.3 Database Query Optimization

```javascript
// Use .lean() for read-only queries (faster)
const surveys = await Survey.find({ status: 'submitted' }).lean();

// Use projection to reduce data transfer
const surveys = await Survey.find({}, 'surveyId status').lean();

// Use cursor for large datasets
const cursor = Survey.find({}).cursor();
for await (const doc of cursor) {
  // Process one at a time
}
```

#### 8.4 Connection Pooling

```javascript
// config/database.js
const mongoose = require('mongoose');

const connectDB = async () => {
  const options = {
    maxPoolSize: 50,
    minPoolSize: 10,
    maxIdleTimeMS: 30000,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  };

  await mongoose.connect(process.env.MONGODB_URI, options);
};
```

#### 8.5 Response Time Targets

| Endpoint | Target |
|----------|--------|
| Login | < 200ms |
| List surveys | < 500ms |
| Get survey | < 300ms |
| Create survey | < 1s |
| Report generation | < 5s |
| Sync push | < 3s |

### 8. Monitoring & Logging

```javascript
// Structured logging
const logger = {
  info: (message, meta) => {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      ...meta
    }));
  },
  error: (message, error, meta) => {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      error: error.message,
      stack: error.stack,
      ...meta
    }));
  }
};
```

---

## Low Network / Offline Resilience

### 1. Offline-First Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Mobile App (Offline-First)               │
│                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │  Local DB   │    │  Sync Queue │    │  Conflict   │     │
│  │  (SQLite)   │───>│  (Pending)  │───>│  Resolver   │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│                    Network Monitor                           │
│                    (Online/Offline)                          │
└─────────────────────────────────────────────────────────────┘
```

### 2. Retry with Exponential Backoff

```javascript
// utils/retry.js
const fetchWithRetry = async (fn, maxRetries = 3, baseDelay = 1000) => {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i); // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
};

// Usage
const syncData = await fetchWithRetry(() => api.push(surveyData));
```

### 3. Request Timeout Handling

```javascript
// config/axios.js
const axios = require('axios');

const api = axios.create({
  timeout: 30000,           // 30s timeout
  retry: 3,
  retryDelay: 1000,
});

// Request interceptor - add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor - handle network errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!error.response) {
      // Network error - queue for later
      await queueForSync(error.config.data);
      return Promise.resolve({ data: { queued: true } });
    }
    return Promise.reject(error);
  }
);
```

### 4. Data Compression

```javascript
// Compress large payloads before sending
const compressData = (data) => {
  const json = JSON.stringify(data);
  return zlib.gzipSync(json).toString('base64');
};

// Decompress on server
const decompressData = (compressed) => {
  const buffer = Buffer.from(compressed, 'base64');
  return JSON.parse(zlib.gunzipSync(buffer).toString());
};
```

### 5. Sync Queue with Priority

```javascript
// services/syncService.js
class SyncQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
  }

  async add(data, priority = 'normal') {
    const item = {
      id: Date.now(),
      data,
      priority,
      retries: 0,
      maxRetries: 3,
      createdAt: new Date()
    };

    // High priority items go to front
    if (priority === 'high') {
      this.queue.unshift(item);
    } else {
      this.queue.push(item);
    }

    if (!this.processing) {
      this.process();
    }
  }

  async process() {
    this.processing = true;

    while (this.queue.length > 0) {
      const item = this.queue.shift();

      try {
        await api.push(item.data);
      } catch (error) {
        item.retries++;
        if (item.retries < item.maxRetries) {
          this.queue.push(item); // Re-queue
        } else {
          // Max retries reached - save to failed queue
          await this.saveFailed(item);
        }
      }
    }

    this.processing = false;
  }
}
```

### 6. Network Status Detection

```javascript
// hooks/useNetworkStatus.js
import { useState, useEffect } from 'react';

const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState('unknown');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check connection quality
    if (navigator.connection) {
      setConnectionType(navigator.connection.effectiveType);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, connectionType };
};

// Usage - show offline indicator
const { isOnline } = useNetworkStatus();
if (!isOnline) {
  showToast('Offline mode - data will sync when online');
}
```

### 7. Data Sync Strategy

| Scenario | Strategy |
|----------|----------|
| **Online** | Real-time sync to server |
| **Offline** | Save to SQLite, queue for sync |
| **Slow Network** | Compress data, retry with backoff |
| **Intermittent** | Auto-reconnect, batch sync |
| **Conflict** | Last-write-wins or manual merge |

### 8. Offline Storage Schema (SQLite)

```sql
-- Local SQLite schema for offline storage
CREATE TABLE surveys (
  id INTEGER PRIMARY KEY AUTOINCREMENT, -- local row ID (SQLite only)
  server_id TEXT,              -- surveyId (business ID) after sync
  status TEXT DEFAULT 'draft', -- draft | pending | synced | failed
  data TEXT,                   -- JSON data
  created_at INTEGER,
  updated_at INTEGER,
  synced_at INTEGER
);

CREATE TABLE sync_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  survey_row_id INTEGER,       -- references surveys.id (local)
  idempotency_key TEXT UNIQUE, -- UUID, one per sync request
  operation TEXT,              -- create | update | delete
  priority INTEGER DEFAULT 0,
  retries INTEGER DEFAULT 0,
  created_at INTEGER
);
```

---

## Input Validation

### Zod Schema Validation

```javascript
// validators/surveyValidator.js
const { z } = require('zod');

const surveySchema = z.object({
  interviewId: z.string().min(1),
  hName: z.string().min(1).max(70),
  hEdu: z.string().min(1).max(30),
  hGender: z.string().min(1).max(6),
  hPhone: z.string().min(1).max(15),
  hAge: z.number().int().min(0).max(150),
  ansDate: z.string().datetime(),
  tspCode: z.string().min(1).max(15),
  tvgCode: z.string().min(1).max(15),
  wvCode: z.string().min(1).max(15)
});

// Middleware
const validateSurvey = (req, res, next) => {
  try {
    surveySchema.parse(req.body);
    next();
  } catch (error) {
    return res.status(422).json({
      error: {
        code: 'validation_error',
        message: 'Request validation failed',
        details: error.issues.map(i => ({
          field: i.path.join('.'),
          message: i.message
        }))
      }
    });
  }
};
```

---

## Error Handling

### Global Error Handler

```javascript
// middleware/errorHandler.js
class ApiError extends Error {
  constructor(statusCode, message, code = 'internal_error') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

const errorHandler = (err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message
      }
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: {
        code: 'validation_error',
        message: 'Validation failed',
        details: Object.values(err.errors).map(e => ({
          field: e.path,
          message: e.message
        }))
      }
    });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    return res.status(409).json({
      error: {
        code: 'duplicate_entry',
        message: 'Duplicate entry found'
      }
    });
  }

  // Log unexpected errors
  console.error('Unexpected error:', err);

  return res.status(500).json({
    error: {
      code: 'internal_error',
      message: 'Internal server error'
    }
  });
};
```

### Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `validation_error` | 400/422 | Input validation failed |
| `unauthorized` | 401 | Missing/invalid token |
| `forbidden` | 403 | Insufficient permissions |
| `not_found` | 404 | Resource not found |
| `duplicate_entry` | 409 | Duplicate key |
| `rate_limit_exceeded` | 429 | Too many requests |
| `internal_error` | 500 | Server error |

---

## Testing Strategy

### Test Types

| Type | Tool | Coverage |
|------|------|----------|
| **Unit Tests** | Jest | Services, utils, validators |
| **Integration Tests** | Supertest | API endpoints, database |
| **E2E Tests** | Playwright | Critical user flows |

### Test Structure

```
tests/
├── unit/
│   ├── services/
│   │   └── surveyService.test.js
│   └── utils/
│       └── retry.test.js
├── integration/
│   ├── api/
│   │   └── surveys.test.js
│   └── db/
│       └── surveyRepository.test.js
└── e2e/
    └── survey-flow.spec.js
```

### CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      - run: npm run test:unit
      - run: npm run test:integration
```

---

## Backup & Recovery

### MongoDB Atlas Backup

| Strategy | Details |
|----------|---------|
| **Automated Backups** | Atlas provides daily snapshots |
| **Point-in-Time Recovery** | 35-day recovery window |
| **Cross-Region Backup** | Enable for disaster recovery |

### Backup Schedule

| Data | Frequency | Retention |
|------|-----------|-----------|
| Survey data | Daily | 35 days |
| User accounts | Daily | 35 days |
| Location data | Weekly | 90 days |

### Recovery Plan

1. **Identify** backup point
2. **Restore** to staging cluster
3. **Verify** data integrity
4. **Switch** production to restored cluster

---

## QA & Testing Strategy

### Test Types

| Type | Tool | Coverage Target |
|------|------|-----------------|
| **Unit Tests** | Jest | 80%+ |
| **Integration Tests** | Supertest | 70%+ |
| **E2E Tests** | Playwright | Critical flows |
| **Load Tests** | k6 | 1000 concurrent |

### Test Structure

```
tests/
├── unit/
│   ├── services/
│   │   └── surveyService.test.js
│   └── utils/
│       └── retry.test.js
├── integration/
│   ├── api/
│   │   └── surveys.test.js
│   └── db/
│       └── surveyRepository.test.js
└── e2e/
    └── survey-flow.spec.js
```

### Load Testing

```javascript
// tests/load/survey-load.test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 1000 },
    { duration: '2m', target: 0 },
  ],
};

export default function () {
  const res = http.get('http://localhost:3000/api/v1/surveys');
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}
```

---

## Monitoring & Alerting

### Health Checks

```javascript
// Health check endpoint
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: 'unknown'
  };

  try {
    await mongoose.connection.db.admin().ping();
    health.database = 'connected';
  } catch (error) {
    health.database = 'disconnected';
    health.status = 'error';
  }

  res.status(health.status === 'ok' ? 200 : 500).json(health);
});
```

### Metrics to Monitor

| Metric | Threshold | Alert |
|--------|-----------|-------|
| Response time | > 2s | Warning |
| Error rate | > 5% | Critical |
| CPU usage | > 80% | Warning |
| Memory usage | > 85% | Critical |
| DB connections | > 80% | Warning |

### Logging

```javascript
// Structured logging with Winston
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'livestock-survey' },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' })
  ]
});
```

---

## Backup & Recovery

### MongoDB Atlas Backup

| Strategy | Details |
|----------|---------|
| **Automated Backups** | Daily snapshots |
| **Point-in-Time Recovery** | 35-day window |
| **Cross-Region** | Enable for DR |

### Recovery Plan

1. Identify backup point
2. Restore to staging
3. Verify data integrity
4. Switch production

---

## Appendix

### Project Structure

```
src/
├── config/           # Database, Redis, env config
├── middleware/       # auth, logging, rateLimit
├── controllers/      # API endpoints
├── services/         # business logic
├── repositories/     # MongoDB data access (Mongoose)
├── models/           # Mongoose schemas
├── routes/           # API routes
├── utils/            # helpers, logger
└── app.js            # Express app entry
```

### API Documentation

See `docs/api-spec.yaml` for OpenAPI specification.
