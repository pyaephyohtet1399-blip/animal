# Backend Implementation Guide - Livestock Survey System

> Architecture: `docs/backend-architecture.md` | Decisions: `docs/decisions.md`
> Stack (locked): **Node.js 20 + Express.js + MongoDB Atlas (Mongoose) + Redis** | OpenAPI: မလို
> ဤ doc သည် code ရေးရန် concrete task list + contract များ ဖြစ်သည်။ Schema/query detail များကို architecture doc တွင် ကြည့်ပါ။

---

## 1. Scope & Assumptions

- Single district scope: 1 ခရိုင် (`MMR0100`), 4 မြို့နယ်, ~840 ကျေးရွာ, user ~845 (1:1 phone)
- Offline-first mobile client (SQLite) အတွက် sync API သည် critical path
- Pending decisions (D-xx) များကို recommendation အတိုင်း implement — user confirm ပြီးမှ doc ပြင်
- Out of scope: Admin panel UI, web/mobile client code, OpenAPI, E2E (Phase 2)

## 2. Directory Structure

```
backend/
├── package.json
├── .env / .env.example
├── .eslintrc.cjs / .prettierrc
├── ecosystem.config.js          # PM2
├── Dockerfile / docker-compose.yml
├── scripts/
│   ├── seed-locations.js        # townships/townvgs/wardvillages CSV import
│   ├── seed-categories.js       # big/small/poultry categories
│   ├── seed-users.js            # users + default passwords CSV output
│   ├── init-id-counters.js      # Redis counter sync (startup မှာလည်း auto)
│   └── rebuild-summaries.js     # surveysummaries backfill/repair
├── src/
│   ├── app.js                   # express app (middleware composition)
│   ├── server.js                # startup: env → mongo → redis → counters → listen
│   ├── config/
│   │   ├── env.js               # Zod validation (D-46)
│   │   ├── database.js          # mongoose connect + pool options
│   │   ├── redis.js             # ioredis client + reconnect
│   │   └── cors.js
│   ├── models/                  # 12 files (section 5)
│   ├── repositories/
│   │   ├── surveyRepository.js
│   │   ├── interviewRepository.js
│   │   ├── userRepository.js
│   │   ├── locationRepository.js
│   │   ├── categoryRepository.js
│   │   └── summaryRepository.js
│   ├── services/
│   │   ├── authService.js       # login/refresh/logout/lockout
│   │   ├── surveyService.js     # CRUD + workflow transitions
│   │   ├── syncService.js       # push/pull + idempotency + versioning
│   │   ├── reportService.js     # drilldown/summary/search
│   │   ├── exportService.js     # Excel
│   │   ├── idService.js         # Redis INCR + reconcile
│   │   └── summaryService.js    # surveysummaries delta
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── surveyController.js
│   │   ├── syncController.js
│   │   ├── reportController.js
│   │   ├── locationController.js
│   │   ├── categoryController.js
│   │   └── healthController.js
│   ├── middleware/
│   │   ├── requestId.js
│   │   ├── auth.js              # JWT verify → req.user
│   │   ├── rbac.js              # requireRole(permission)
│   │   ├── scope.js             # buildSurveyScope(user) → query filter
│   │   ├── validate.js          # Zod parse (body/query/params)
│   │   ├── rateLimit.js         # custom Redis (D-30)
│   │   ├── auditLog.js          # fire-and-forget insert
│   │   └── errorHandler.js      # ApiError + mongoose errors
│   ├── validators/
│   │   ├── auth.validator.js
│   │   ├── survey.validator.js
│   │   ├── sync.validator.js    # batch size ≤50, op enum, type whitelist
│   │   └── report.validator.js  # type/ageFrom/ageTo/sex/from/to
│   ├── routes/
│   │   ├── index.js             # /api/v1 router mount
│   │   ├── auth.routes.js
│   │   ├── survey.routes.js
│   │   ├── sync.routes.js
│   │   ├── report.routes.js
│   │   ├── location.routes.js
│   │   ├── category.routes.js
│   │   └── health.routes.js     # /health, /health/ready (no /api prefix)
│   └── utils/
│       ├── logger.js            # Winston
│       ├── jwt.js               # generateTokens (full claims, D-26)
│       ├── password.js          # bcrypt 12
│       ├── apiError.js
│       ├── escapeRegex.js
│       └── sumArray.js
└── tests/
    ├── unit/                    # services, utils, validators
    ├── integration/             # supertest + memory mongo + memory redis
    └── fixtures/                # seed subsets
```

### 2.1 Layered Architecture & Design Patterns (architecture line 448, 505)

```
Client (Web/Flutter/Admin) → API Gateway (rate limit, SSL, CORS)
→ Node.js: Middleware (auth/RBAC/logging/rate) → Controller → Service → Repository (Mongoose)
→ Data: MongoDB Atlas (primary) | Redis (cache/idempotency/lock) | SQLite (client offline)
```

| Pattern | Usage | Module |
|---------|-------|--------|
| Repository | Mongo data access abstraction | `repositories/*` |
| Service Layer | business logic | `services/*` |
| Middleware | auth, logging, rate limiting | `middleware/*` |
| RBAC | role-based access | `middleware/rbac.js` + `scope.js` |
| Cache-Aside | location/category Redis cache | `services/locationService` (§9.4) |
| Queue | sync / report generation (Phase 2) | §9.10 |
| Retry | network failure (client) | §8.9 |

- Every request: controller က service call, service က repository call — controller ထဲ query ရေးမည် **မဟုတ်**
- `canEdit`/scope logic အားလုံး `middleware/scope.js` တစ်နေရာတည်း (architecture line 754)

## 3. Dependencies & Scripts

```jsonc
// package.json ( essentials)
{
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js",
    "lint": "eslint src tests",
    "test:unit": "jest --selectProjects unit",
    "test:integration": "jest --selectProjects integration",
    "test": "jest --coverage",
    "seed": "npm run seed:locations && npm run seed:categories && npm run seed:users",
    "seed:locations": "node scripts/seed-locations.js",
    "seed:categories": "node scripts/seed-categories.js",
    "seed:users": "node scripts/seed-users.js",
    "rebuild:summaries": "node scripts/rebuild-summaries.js",
    "smoke:breeding": "node scripts/smoke-breeding.js",
    "probe:queries": "node scripts/probe-queries.js",
    "test:e2e": "node scripts/e2e-journey.js"
  }
}
```

| Group | Packages |
|-------|----------|
| Core | `express`, `mongoose`, `ioredis`, `zod` |
| Auth | `jsonwebtoken`, `bcrypt` |
| Middleware | `helmet`, `cors`, `compression` |
| Logging | `winston` |
| Excel | `exceljs` |
| Dev | `nodemon`, `eslint`, `prettier`, `jest`, `supertest`, `mongodb-memory-server`, `ioredis-mock` |
| Phase 2 | `bullmq` (D-39), `playwright` (D-42) |

`csurf`, `express-rate-limit`, `bull` — **မထည့်** (D-29, D-30, D-39 အတိုင်း)။

## 4. Environment (`.env.example`)

```
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb+srv://user:pass@cluster/livestock_survey
REDIS_URL=redis://localhost:6379
JWT_SECRET=<min 32 chars>
JWT_REFRESH_SECRET=<min 32 chars>
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d
ALLOWED_ORIGINS=http://localhost:3000,https://app.example.com
RATE_LIMIT_WINDOW_MS=60000
BODY_LIMIT=1mb
ID_COUNTER_RECONCILE_MINUTES=30
```

`config/env.js` — Zod parse, fail-fast (architecture line 2105 အတိုင်း)။ `JWT_EXPIRATION` မသုံး (D-27)။

**`config/database.js` — connection options (architecture line 1180 + 2093):**

```javascript
const options = {
  maxPoolSize: 50,
  minPoolSize: 10,
  maxIdleTimeMS: 30000,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000
};
```

## 5. Models (13 collections)

| # | Collection | File | Key notes |
|---|-----------|------|-----------|
| 1 | `townships` | Township.js | `tspCode` unique = မြို့နယ် (D-04) |
| 2 | `townvgs` | Townvg.js | `tvgCode` unique, `tspCode` index |
| 3 | `wardvillages` | Wardvillage.js | `wvCode` unique, `tvgCode` index |
| 4 | `users` | User.js | `loginCode` unique, role enum, `districtCode` + location codes (D-05), `mustChangePassword` (vestigial, D-56) |
| 5 | `interviewinfos` | InterviewInfo.js | `interviewId` unique (Redis), hName (escape regex for search) |
| 6 | `surveys` | Survey.js | architecture line 395 schema + **`districtCode`**, **`deletedAt`** (D-14), status enum D-10, **`breedingAnimals` + `hasBreeding`** (D-54) |
| 7 | `biganimalcategories` | BigAnimalCategory.js | `categoryId` unique |
| 8 | `smallanimalcategories` | SmallAnimalCategory.js | `categoryId` unique |
| 9 | `poultrycategories` | PoultryCategory.js | `categoryId` unique |
| 10 | `breedingcategories` | BreedingCategory.js | `categoryId` unique — **breeding space သီးသန့်** (D-54); seed = `categories.json` key `breeding` (6 rows) |
| 11 | `surveysummaries` | SurveySummary.js | key `{tspCode, wvCode}`, breakdown maps (architecture line 1578) + `totalBreedingAnimals`/`breedingBreakdown` (D-54) |
| 12 | `refreshtokens` | RefreshToken.js | `tokenHash` index, `expiresAt` TTL index (D-28) |
| 13 | `auditlogs` | AuditLog.js | `createdAt` TTL (90d) (D-40) |

Indexes = architecture doc line 327-345 + `surveys.deletedAt`, `surveys.districtCode`, `refreshtokens.tokenHash`, `auditlogs.createdAt` — **migration script မရှိ**: startup တွင် `syncIndexes()` ခေါ်ပါ (id counters sync နဲ့အတူ)။

Status enum (D-10): `draft | submitted | township_verified | district_approved | rejected` + fields `verifiedBy/verifiedAt/approvedBy/approvedAt/rejectedReason/rejectedBy`။

### 5.1 Field Validation Rules (architecture line 349, 2507)

**Animal array enums (Mongoose + Zod နှစ်ခုလုံး):**

| Array | `ageLimit` | `sex` |
|-------|-----------|-------|
| `bigAnimals` | `LessThanOne`, `Between1and3`, `Over3` | `male`, `ca_male`, `female` |
| `smallAnimals` | `Under2months`, `Between2and6months`, `Over6months` (D-55) | `male`, `ca_male`, `female` |
| `poultry` | `Young`, `Middle`, `Old` (D-55) | `male`, `female` |
| `breedingAnimals` | **(မပါ — D-54)** | `male`, `female` (ca_male မပါ) |

> **D-55 (2026-10-05)**: ageLimit = form spec အတိုင်း **type တစ်ခုစီ သီးသန့် enum** — small = month-based (၂လ/၆လ), poultry = ငယ်/လတ်/ကြီး (English enum, single source `src/constants/ageLimits.js` = `AGE_LIMITS` + `AGE_RANKS`)။ small/poultry schema သီးသန့် — `bigAnimalSchema` ပြန်သုံး၍မရ။ `count`: int ≥ 0, default 0။

**Interview/survey body fields (Zod, architecture line 2507):**

| Field | Rule |
|-------|------|
| `hName` | string, 1–70 |
| `hEdu` | string, 1–30 |
| `hGender` | string, 1–6 |
| `hPhone` | string, 1–15 |
| `hAge` | int, 0–150 |
| `ansDate` | ISO datetime |
| `tspCode`, `tvgCode`, `wvCode` | string, 1–15 (create မှာ server ထံမှ token claims ကနေ ပြန်သတ်မှတ် — §8.2) |
| `surveyId`/`page`/`per_page` | number; `per_page` max 100 (D-17) |

- Violation → **422** `validation_error` + `details[]` (architecture line 2526)
- `type`, `ageFrom`, `ageTo`, `sex` (report query) = enum whitelist (D-24, §9.1)

```javascript
// middleware/validate.js (architecture line 2521 — Zod parse → next သို့မဟုတ် 422)
const validate = (schema) => (req, res, next) => {
  try { schema.parse({ body: req.body, query: req.query, params: req.params }); next(); }
  catch (error) {
    return res.status(422).json({ error: { code: 'validation_error', message: 'Request validation failed',
      details: error.issues.map(i => ({ field: i.path.join('.'), message: i.message })) } });
  }
};
```

### 5.2 Mongoose Schema Definitions (architecture line 360 → full code)

**`models/Survey.js`** (architecture line 362 + D-05/10/14):

```javascript
const bigAnimalSchema = new mongoose.Schema({
  categoryId: { type: Number, required: true, ref: 'BigAnimalCategory' },
  ageLimit: { type: String, enum: ['LessThanOne', 'Between1and3', 'Over3'], required: true },
  sex: { type: String, enum: ['male', 'ca_male', 'female'], required: true },
  count: { type: Number, min: 0, default: 0 }
});
// Small has its OWN age enum (month-based, D-55)
const smallAnimalSchema = new mongoose.Schema({
  categoryId: { type: Number, required: true, ref: 'SmallAnimalCategory' },
  ageLimit: { type: String, enum: ['Under2months', 'Between2and6months', 'Over6months'], required: true },
  sex: { type: String, enum: ['male', 'ca_male', 'female'], required: true },
  count: { type: Number, min: 0, default: 0 }
});
// Poultry has DIFFERENT enums (ငယ်/လတ်/ကြီး, D-55) — must NOT reuse bigAnimalSchema (line 379)
const poultrySchema = new mongoose.Schema({
  categoryId: { type: Number, required: true, ref: 'PoultryCategory' },
  ageLimit: { type: String, enum: ['Young', 'Middle', 'Old'], required: true },
  sex: { type: String, enum: ['male', 'female'], required: true },
  count: { type: Number, min: 0, default: 0 }
});
// Breeding (D-54): sex-only — ageLimit မပါ, ca_male မပါ
const breedingAnimalSchema = new mongoose.Schema({
  categoryId: { type: Number, required: true, ref: 'BreedingCategory' },
  sex: { type: String, enum: ['male', 'female'], required: true },
  count: { type: Number, min: 0, default: 0 }
});

const surveySchema = new mongoose.Schema({
  surveyId: { type: Number, required: true, unique: true },
  interviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewInfo', required: true },
  villageHeadmanId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['draft','submitted','township_verified','district_approved','rejected'], default: 'draft' }, // D-10 (architecture line 398 enum 2 ခု → 5 ခု)
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, verifiedAt: Date,
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, approvedAt: Date,
  rejectedReason: String, rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  districtCode: { type: String, required: true, index: true },   // D-05
  tspCode: { type: String, required: true, index: true },
  tvgCode: { type: String, required: true },
  wvCode: { type: String, required: true, index: true },
  syncVersion: { type: Number, default: 0 },
  deletedAt: { type: Date, default: null, index: true },         // D-14 soft delete
  bigAnimals: [bigAnimalSchema],
  smallAnimals: [smallAnimalSchema],                               // D-55: own enum (month-based)
  poultry: [poultrySchema],
  breedingAnimals: { type: [breedingAnimalSchema], default: [] },
  hasBreeding: { type: Boolean, default: false, index: true }     // D-54 server-derived
}, { timestamps: true });

surveySchema.index({ surveyId: 1 }, { unique: true });
surveySchema.index({ status: 1 });
surveySchema.index({ tspCode: 1, status: 1 });
surveySchema.index({ wvCode: 1, status: 1 });
surveySchema.index({ 'bigAnimals.categoryId': 1 });
surveySchema.index({ 'smallAnimals.categoryId': 1 });
surveySchema.index({ 'poultry.categoryId': 1 });
surveySchema.index({ 'breedingAnimals.categoryId': 1 });
surveySchema.index({ deletedAt: 1, createdAt: -1 });
// query တိုင်း deletedAt: null ထည့် (D-14)
module.exports = mongoose.model('Survey', surveySchema);
```

**`models/User.js`** (architecture line 421 + D-09/52/53):

```javascript
const userSchema = new mongoose.Schema({
  loginCode: { type: String, required: true, unique: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['district', 'township', 'village'], required: true },
  districtCode: { type: String },                 // D-52 (seed time ထဲမှ)
  tspCode: { type: String }, tvgCode: { type: String }, wvCode: { type: String },
  isActive: { type: Boolean, default: true },
  mustChangePassword: { type: Boolean, default: false },   // D-56: vestigial (no gate)
  lastLoginAt: Date
}, { timestamps: true });
userSchema.index({ tspCode: 1, tvgCode: 1, wvCode: 1 });
module.exports = mongoose.model('User', userSchema);
```

**Remaining 10 models** (architecture collection list line 53–231, 1578):

| Model | Schema (fields) |
|-------|-----------------|
| `Township` | `tspCode` (unique), `tspName`, timestamps |
| `Townvg` | `tvgCode` (unique), `tvgName`, `tspCode` (index), timestamps |
| `Wardvillage` | `wvCode` (unique), `wvName`, `tvgCode` (index), timestamps |
| `InterviewInfo` | `interviewId` (Number, unique), `hName`, `hEdu`, `hGender`, `hPhone`, `hAge` (Number), `ansDate` (Date), `tspCode`, `tvgCode`, `wvCode`, timestamps |
| `BigAnimalCategory` | `categoryId` (unique, Number), `name`, timestamps |
| `SmallAnimalCategory` | `categoryId` (unique, Number), `name`, timestamps |
| `PoultryCategory` | `categoryId` (unique, Number), `name`, timestamps |
| `SurveySummary` | `tspCode`, `wvCode` (compound unique key), `totalSurveys`, `totalBigAnimals`, `totalSmallAnimals`, `totalPoultry`, `bigBreakdown`/`smallBreakdown`/`poultryBreakdown` (Map/Object, key=`categoryId:ageLimit:sex`), `lastUpdated` — အပြည့်အစုံ §9.8 |
| `RefreshToken` | `userId` (ref), `tokenHash` (index), `expiresAt` (TTL index, 7d), `isActive` (Boolean), `createdAt` |
| `AuditLog` | `timestamp`, `userId`, `role`, `method`, `path`, `status`, `ip`, `userAgent`, `requestId` (§11), `createdAt` (TTL 90d, D-40) |

## 6. Middleware Order (`app.js`)

```
requestId → helmet → cors (D-31) → compression → express.json({limit}) (D-34)
→ trust proxy (set in app.js) → routes:
    /health*        (no auth)
    /api/v1/auth/*  (anonymous rate limit 30/min + lockout)
    /api/v1/*       → auth (JWT) → rateLimit(role) → auditLog
                 → validate (Zod) → controller
→ notFound → errorHandler
```

- Rate limit: custom Redis (D-30, D-63), key `rl:r:<userId|ip>` (read) / `rl:w:<userId|ip>` (write) — **role limits (architecture §4)**: anonymous 30/min; write = village 100/min, township 200/min, district 500/min; read (GET/HEAD) = village 1000/min, township 2000/min, district 5000/min; reports 500/min (route table)

  ```javascript
  // middleware/rateLimit.js — SET NX (window anchor) + INCR + PTTL pipeline (D-63)
  const rateLimit = (windowMs, max, bucket = '') => async (req, res, next) => {
    const key = `rl:${bucket}${req.user?.userId || req.ip}`;
    const pipeline = redis.pipeline();
    pipeline.set(key, '0', 'PX', windowMs, 'NX'); // anchor — TTL per-request refresh မလုပ်
    pipeline.incr(key);
    pipeline.pttl(key);
    const results = await pipeline.exec();
    const current = Number(results[1][1]);
    res.set('X-RateLimit-Limit', max);
    res.set('X-RateLimit-Remaining', Math.max(0, max - current));
    if (current > max) return res.status(429).json({ error: { code: 'rate_limit_exceeded', message: 'Too many requests, please try again later.' } });
    next();
  };
  ```
- **Helmet** (architecture line 1061): `helmet()` + `helmet.contentSecurityPolicy()` + `helmet.hsts({ maxAge: 31536000 })`
- **XSS** (architecture line 961): API က JSON သာပို့သဖြင့် အဓိက = output encoding (JSON) + CSP header; input sanitize helper `utils/sanitize.js` (recursive string sanitize, line 965) လိုအပ်ရင် သုံး
- **Rate limit headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` ပြန် (architecture line 1009); 429 တွင် `Retry-After` ပါ
- **RBAC permission map** (architecture line 901 — `rbac.js`):

  | Permission | Roles |
  |-----------|-------|
  | `survey:create` | village |
  | `survey:update` | village (own draft), township (own tsp), district (any) |
  | `report:view_district/export` | district |
  | `report:view_township` | township, district |
  | `admin:reset_password` | district |

  ```javascript
  // middleware/rbac.js (architecture line 907 — requireRole(permission))
  const requireRole = (permission) => (req, res, next) => {
    if (!ROLE_PERMISSIONS[req.user.role]?.includes(permission)) {
      return res.status(403).json({ error: { code: 'forbidden', message: 'Insufficient permissions' } });
    }
    next();
  };
  // resource-level: scope.js — single-query check (§9.3) — ownership ပိုင်ရှင် မမှန်ရင် 404 (existence leak မလုပ်)
  ```

- **Cache-Control**: **all endpoints = `no-store`** — locations/categories အဖြေများ role-scoped ဖြစ်၍ browser/proxy cache လုပ်၍မရ (URL တူပြီး body ကွဲတာမို့ `public, max-age` က တစ်ယောက်အဖြေ တစ်ယောက်ပြန်ပေး; caching က server-side Redis မှာ scope key ဖြင့်သာ — 2026-10-07 fix)
- **Compression**: `compression({ threshold: 1024, level: 6 })` (architecture line 2151)
- `app.set('trust proxy', 1)` — Nginx နောက်တွင် IP မှန်စေ (D-30)
- CORS: `methods: [GET,POST,PUT,PATCH,DELETE]`, `allowedHeaders: [Content-Type, Authorization, Idempotency-Key, X-Request-Id]` (D-31)
- CSRF: မထည့် (D-29)

## 7. Route Map

| Method | Path | Role | Rate | Notes |
|--------|------|------|------|-------|
| POST | `/auth/login` | anon | 30/min + lockout 5 (D-32) | `{loginCode, password}` → tokens |
| POST | `/auth/refresh` | anon (refresh token) | 30/min | rotation (D-28) |
| POST | `/auth/logout` | auth | — | revoke refresh token |
| POST | `/auth/change-password` | auth | — | `{oldPassword, newPassword}` (D-09) |
| POST | `/auth/reset-password` | district | 30/min | `{loginCode}` → new random default (D-53) |
| GET | `/locations/townships` | auth | role | scope by role (D-57): village/township = own `tspCode`, district = အားလုံး; cache 1h |
| GET | `/locations/townvgs?tspCode=` | auth | role | scope (D-57): village = own `tvgCode`, township = own `tspCode` (param ignore), district = param filter; cache 1h |
| GET | `/locations/wardvillages?tvgCode=` | auth | role | scope (D-57): village = own `wvCode`, township = own tsp (Townvg subquery), district = param filter; cache 1h |
| GET | `/categories/:type` | auth | role | type ∈ `big\|small\|poultry\|breeding` (D-54), cache 1h |
| GET | `/categories/:type/:categoryId` | auth | role | single category; 404 `not_found` မရှိရင်, 422 type/categoryId မမှန်; list cache share |
| GET | `/surveys` | auth | role | scope filter + `page,per_page,status,search,sort,hasBreeding` (D-17/D-54) |
| GET | `/surveys/details?ids=` | auth | role | bulk detail, ≤500 ids/request, scope miss → 404 + `details.missing` (D-63) |
| GET | `/surveys/:surveyId` | auth | role | scope check (business ID) |
| POST | `/surveys` | village | 100/min | create (draft) |
| PUT | `/surveys/:surveyId` | auth | role | village = own draft; township = own tsp (any status); district = any (D-58) |
| DELETE | `/surveys/:surveyId` | village (own draft) / district | 100/min | soft delete D-14; counted status ဆို −summary (§8.3) |
| POST | `/surveys/:surveyId/submit` | village (own) | — | draft → submitted (🔒 village, **summary `$inc` +1**, D-58) |
| POST | `/sync/push` | auth | role | **Idempotency-Key header required**, batch ≤50 |
| GET | `/sync/pull` | auth | role | `since, types, cursor` |
| GET | `/reports/district` | district | 500/min | summaries aggregated |
| GET | `/reports/township/:tspCode` | township, district | — | village breakdown |
| GET | `/reports/drilldown` | district | — | `level,type,categoryId,ageFrom,ageTo,sex,tspCode,wvCode,from,to,page,per_page` (D-22/24) |
| GET | `/reports/district/:tspCode/export` | district | — | Excel, row limit 50k (D-23) |
| GET | `/health`, `/health/ready` | anon | — | 503 on fail (D-41) |

Permission scoping: `scope.js#buildSurveyScope(user)` → `{}` (district) / `{districtCode}` / `{tspCode}` / `{wvCode}` — **query တိုင်းတွင် scope filter ထည့်ပါ** (architecture line 754 logic)။

### 7.1 Query Params & API Versioning (architecture line 705, 1240)

**Standard list params** (`/surveys`, `/reports/drilldown`, export):

| Param | Rule |
|-------|------|
| `page` | int ≥ 1, default 1 |
| `per_page` | int 1–100, default 20 |
| `sort` | `-createdAt` (default), whitelist field များသာ — `$ne`/`$where` မလုံး |
| `status` | D-10 enum ထဲက 1 ခု |
| `hasBreeding` | `true\|false` only (D-54) — "သီးသန့်စာရင်း" breeding-farm list; invalid → 422 |
| `search` | → `escapeRegex()` (D-25) |
| `fields` | projection whitelist (list endpoint) |

> **Cursor pagination (architecture line 1258) = deliberately dropped** — page-based only (D-17); 50k dataset အတွက် page လုံလောက်

**Versioning:**
- Base path `/api/v1`; breaking change (field remove/rename, status change) = `/api/v2` သီးသန့်
- Deprecation: `Deprecation` + `Sunset` headers ဖြင့် ≥6 လ notice
- `/health*` = version prefix မပါ (line 85)

### 7.2 Request/Response Examples (architecture line 623 — copy-ready contract)

**Create Survey:**
```http
POST /api/v1/surveys
Authorization: Bearer <token>
Content-Type: application/json

{
  "hName": "ဦးအောင်", "hEdu": "ဘွဲ့", "hGender": "အထီး",
  "hPhone": "0912345", "hAge": 45, "ansDate": "2024-01-15",
  "bigAnimals": [{ "categoryId": 1, "ageLimit": "LessThanOne", "sex": "male", "count": 2 }],
  "smallAnimals": [], "poultry": [{ "categoryId": 1, "ageLimit": "Young", "sex": "female", "count": 10 }],
  "breedingAnimals": [{ "categoryId": 1, "sex": "male", "count": 3 }]   // optional, D-54 (age မပါ)
}
// location codes (tspCode/tvgCode/wvCode) = server token claims ကနေ (§8.2) — client payload ထဲ မပါ
```
Response **201**: `{ "data": { "surveyId": 1, "status": "draft", "createdAt": "2024-01-15T10:30:00Z" } }`

**List Surveys:**
```http
GET /api/v1/surveys?status=submitted&page=1&per_page=20
```
```json
{
  "data": [{ "surveyId": 1, "status": "submitted", "hName": "ဦးအောင်", "wvCode": "194657" }],
  "meta": { "total": 100, "page": 1, "per_page": 20, "total_pages": 5 }
}
// hName က populate ကနေ (§9.2) — survey doc ပေါ် field မရှိ
```

**HTTP status codes** (architecture line 596): `200` GET/PUT/PATCH ✓, `201` create, `204` DELETE, `400` validation, `401` unauthorized, `403` forbidden, `404` not found, `409` conflict, `422` Zod, `429` rate limit, `503` dependency down (§10)

## 8. Core Flows

### 8.0 Credential Spec (loginCode & password) — D-09/50/51/52/53

**loginCode (username = location code):**

| Role | Format | Pattern | Example | Accounts |
|------|--------|---------|---------|----------|
| village | numeric `wvCode` | `^\d{4,8}$` | `194657` | 809 |
| village (ward) | ward `wvCode` | `^MMR\d{12}$` | `MMR010031701504` | 31 |
| township | `tspCode` | `^MMR\d{6}$` | `MMR010028` | 4 |
| district | `districtCode` (tspCode prefix) | `^MMR\d{4}$` | `MMR0100` | 1 |

- **Normalization**: input ကို `trim + toUpperCase` ပြီးမှ lookup — numeric codes ကို မထိခိုက် (D-50)
- `loginCode` unique index; **DB `role` field = authoritative** — `determineRole()` pattern check ကို seed/create time assert မှာပဲ, login မှာ မသုံး (D-51)

  ```javascript
  // architecture line 126 — seed/create time assert အတွက်သာ (login မှာ မခေါ်)
  const determineRole = (loginCode) => {
    if (loginCode === 'MMR0100') return 'district';            // ခရိုင်
    if (/^MMR01\d{4}$/.test(loginCode)) return 'township';     // MMR010028-31
    return 'village';                                          // numeric pcode
  };
  ```
- `districtCode` = seed time မှာ `townships` doc ထဲ သိမ်း → users/surveys copy; runtime slicing မလုံး (D-52)
- Zod: `z.string().trim().transform(v => v.toUpperCase()).regex(rolePattern)`

**password:**

| Aspect | Rule |
|--------|------|
| Seed default | Random **10 chars**, charset `[a-zA-Z0-9]` မှ ambiguous `O,0,l,1,I` ဖယ်; per-user → `data/generated-passwords.csv` |
| New password | **8–64** chars (bcrypt 72-byte cap), ≥1 letter + ≥1 digit, ≠ old password, ≠ loginCode |
| Storage | **bcrypt cost 12**; log/response ထဲ မပါ |
| Reset | **District only** `POST /auth/reset-password {loginCode}` → new random (D-53); self-service (email/SMS) မရှိ |
| Lockout | 5 fail → 15min Redis counter (D-32) |

```javascript
// scripts/seed-users.js — default password generator
const crypto = require('crypto');
const CHARS = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789'; // ambiguous removed
const genDefaultPassword = (len = 10) =>
  Array.from({ length: len }, () => CHARS[crypto.randomInt(CHARS.length)]).join('');
// → data/generated-passwords.csv: loginCode,password,village,township,district
```

### 8.1 Login
1. Zod validate (normalize D-50) → `User.findOne({ loginCode, isActive: true })`
2. Lockout check (Redis `lock:<loginCode>`, D-32) → fail ဆို counter INCR, 5 ကြိမ်ရင် TTL 15min
3. bcrypt compare → issue access (15m, full claims D-26) + refresh (7d, random 40v, hash DB store)
4. Response ပါ `mustChangePassword` (always false — D-56)
5. Audit log insert (async)

**JWT payload (D-26 full claims — architecture line 723 ထက် ပြည့်စုံ):**
```json
{
  "userId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "loginCode": "194657", "role": "village",
  "districtCode": "MMR0100",
  "tspCode": "MMR010031", "tvgCode": "MMR010031047", "wvCode": "194657",
  "mustChangePassword": false,
  "exp": 1699999999
}
// district user: tspCode/tvgCode/wvCode = null; အားလုံး token ထဲ → middleware က DB ထပ်မမေး (D-26)
```

```javascript
// utils/jwt.js (architecture line 869 — claims D-26 အတိုင်း)
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { userId: user._id, loginCode: user.loginCode, role: user.role,
      districtCode: user.districtCode, tspCode: user.tspCode || null,
      tvgCode: user.tvgCode || null, wvCode: user.wvCode || null,
      mustChangePassword: user.mustChangePassword },
    process.env.JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId: user._id },
    process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};
```

**Role loginCode examples (architecture line 735):** village `194657` / township `MMR010028` / district `MMR0100` (§8.0 table)

### 8.2 Create Survey (transaction, D-37)
```
session = startTransaction
  interviewId = idService.generateInterviewId()   // Redis INCR
  interview  = InterviewInfo.create({...}, {session})
  surveyId   = idService.generateSurveyId()
  survey     = Survey.create({ surveyId, interviewId: interview._id,
                 villageHeadmanId: user._id (D-15 — creator),
                 districtCode, tspCode, tvgCode, wvCode (user scope ကနေ),
                 status: 'draft', syncVersion: 0 }, {session})
commit / abort
```
- Location codes = **client မပို့, server က token claims ကနေ** သတ်မှတ် (trust မရ)
- Response 201: `{ data: { surveyId, status, createdAt } }`

### 8.3 Submit (final)
- Transition guard: `surveyService.assertTransition(current, next, user)` — invalid → 409
- **Counted set** (summary + report ဝင်သည့် status) = `submitted` (D-58)
- submit: village + own wvCode + status=draft → submitted — **`summaryService.updateSummary(survey, +1)`** (counted set ဝင်)
- Edit: village = own draft ပဲ (submitted ဆို 🔒); township = own tsp အကုန်; district = အကုန် (D-58)
- delete: soft delete; −delta = status counted ဖြစ်နေမှသာ (D-14)
- Report filter (fast summary + slow direct နှစ်ခုလုံး) = `status = submitted` — **တူမည်** (§9.1 rule)

### 8.4 Sync Push (critical path)
```
POST /api/v1/sync/push   Header: Idempotency-Key (UUID v4)
1. validate header + items[] ≤ 50, op ∈ create|update|submit|delete
2. LOCK:   SETNX idem:lock:<key> EX 30   → fail = 409 {code:'request_in_progress'}
3. RESULT: GET idem:<key>   → hit = return stored response (200, same body)
4. per item (sequential):
   op=create → interview+survey create (D-37)  → status 'created', surveyId, syncVersion:1
   op=update → surveyId ရှာ, permission scope check,
               data.syncVersion <= existing.syncVersion ?
                 → 'rejected' { code:'version_conflict', serverVersion, serverData }
                 → update + syncVersion++       → 'updated', syncVersion
   op=delete → scope check + soft delete       → 'deleted'
   scope မကိုက် → 'rejected' { code:'forbidden' }
5. store whole response: SETEX idem:<key> 86400 <json> → DEL idem:lock:<key>
6. Response 200: { data: { results: [{ localRowId, status, surveyId?, syncVersion?, error? }] } }
   - partial success = 200 (per-item status); 409 conflict သီးသန့် response မလို (item level)
   - server 5xx = client retry same key → step 2-3 dedupe
```
- `districtCode`/location codes ကို token claims ကနေ override (client payload မယုံ)
- Create failure တစ်ခုက တခြား item ကို မထိခိုက်အောင် per-item try/catch
- `Idempotency-Key` = **request header တစ်ခုပဲ** — document ပေါ် မသိမ်း, local UUID မထား (1:1 account, line 244)

**Conflict resolution reference code (architecture line 793 — per-item logic):**
```javascript
const processed = await redis.get(`idem:${idempotencyKey}`);
if (processed) return JSON.parse(processed);              // retry → stored result (no duplicate)
const existing = await Survey.findOne({ surveyId: data.surveyId });
if (!existing) { result = await Survey.create({ ...data, syncVersion: 1 }); }
else if (data.syncVersion <= existing.syncVersion) { throw new ApiError(409, 'Stale data', 'version_conflict'); }
else { result = await Survey.findOneAndUpdate({ surveyId: data.surveyId },
         { ...data, syncVersion: data.syncVersion }, { new: true }); }
await redis.setex(`idem:${idempotencyKey}`, 86400, JSON.stringify(result));
// §8.4 batch version က lock + whole-response cache + per-item results ပါ — ဒီ code = item core
```

### 8.5 Sync Pull
```
GET /api/v1/sync/pull?since=<ISO>&types=surveys,locations,categories&cursor=<_id>
→ data.surveys:  scope filter + updatedAt > since, deleted tombstone ပါ, sort updatedAt, limit 200
→ data.locations / data.categories: versioned full list (rarely changes); locations = role scope (D-57, village = ကိုယ့်အဆင့် ၃ ခုပဲ)
→ meta: { serverTime, nextCursor, hasMore }
```

### 8.6 Summary delta (`summaryService`)
- Key: `{ tspCode, wvCode }`; breakdown key `"<categoryId>:<ageLimit>:<sex>"` (architecture line 1600)
- **Delta timing (D-38 v2)**: `+1` = **verify မှာ** (counted set ဝင်ချိန်); `−1` = reject/delete မှာ (မတိုင်မီ status counted ဖြစ်မှသာ); submit/approve = မပါ
- Edit မရနိုင်သောကြောင့် drift နည်း — ဒါပေမဲ့ `rebuild-summaries.js` က full recompute (repair + backfill) — recompute = counted statuses ပဲ aggregate
- Report query (fast summary + slow direct + rebuild သုံးခု တူ): `status: { $in: ['township_verified','district_approved'] }` (D-11/38 — finalize ပြီး)

### 8.7 ID Service (D-35)
- `initIdCounters()` — server startup (mongo connect ပြီးနောက်): DB max ဖြင့် `SETNX survey:id` / `interview:id`
- Reconcile interval (30min): DB max > counter → `SET counter = max` (Redis data loss recovery)
- Redis AOF enable note = ops runbook (decisions D-35)

```javascript
// services/idService.js (architecture line 264 — copy-ready)
const initializeIdCounters = async () => {
  const maxSurveyId = await Survey.findOne().sort({ surveyId: -1 }).select('surveyId').lean();
  const maxInterviewId = await InterviewInfo.findOne().sort({ interviewId: -1 }).select('interviewId').lean();
  if (maxSurveyId) await redis.setnx('survey:id', maxSurveyId.surveyId);
  if (maxInterviewId) await redis.setnx('interview:id', maxInterviewId.interviewId);
};
const generateSurveyId = async () => redis.incr('survey:id');
const generateInterviewId = async () => redis.incr('interview:id');
// create: interview အရင် (ObjectId) → survey.interviewId = interview._id (Number ID မဟုတ်, line 306)
```

### 8.8 Refresh / Logout / Change-password / Admin Reset

**Refresh (rotation, D-28):**
```
POST /auth/refresh  { refreshToken }
1. hash(refreshToken) → refreshtokens.findOne({ tokenHash, isActive: true, expiresAt > now })
2. မတွေ့ → 401 unauthorized; တွေ့မှ ပြန်သုံး (reuse) ဆိုပြီး ပိုင်ရှင် tokens အကုန် revoke → 401 stale_credentials
3. rotate: old isActive:false + new refresh (7d) + new access (15m) ပြန်ထုတ်
```
**Logout:** `POST /auth/logout` { refreshToken } → hash match ရှာ → `isActive: false` (auth access token ဖြင့်သာ)
**Change-password:** `{ oldPassword, newPassword }` → bcrypt old မကိုက် → 401; new ≠ old/loginCode + pattern (§8.0) → update + revoke all refresh tokens
**Admin reset (§7):** district → `{ loginCode }` → normalize (D-50) → random 10-char (§8.0 gen) + revoke all → response ပါသည်: `{ loginCode, newPassword }` (HTTPS မှတပါ; log ထဲ မရေး)

### 8.9 Mobile Client Sync Contract (architecture §Offline)

Client ဘက် implementation အတွက် server နဲ့ ကိုက်ရမည့် contract — server ထဲ မပါပေမဲ့ client team ကို ပေးရန်:

**SQLite tables (architecture line 2474):**
- `surveys` — local copy; `_id`/`surveyId`/`syncVersion`/`localStatus`
- `sync_queue` — `{ localRowId, op(create|update|delete), payload, idempotency_key, status, retryCount, lastError, createdAt }`

**Local status → server op:**

| Local status | Meaning |
|--------------|---------|
| `draft` | offline ရေးဆဲ — push မလုပ်ရသေး |
| `pending` | queue ထဲ, push စောင့် |
| `synced` | server `created/updated` အောင်မြင် |
| `failed` | server `rejected` (version_conflict/forbidden) — user ကို ပြ |

**Push rules:**
1. **`Idempotency-Key` = per HTTP request** (batch 1 ခုလျှင် 1 ခု) — `sync_queue` ထဲ သိမ်းပြီး server 5xx/retry မှာ **key အတူပဲ ပြန်သုံး** (dedupe §8.4)
2. Retry = exponential backoff `1s → 2s → 4s` (max 5, jitter 30%) (architecture line 2293)
3. Batch ≤50 items; queue အသစ် flush ချိန် queue အဟောင်း status မကြည့်မီ တစ်ခုချင်း poll
4. `version_conflict` ရရင် — `serverData` ဖြင့် local update + user ကို conflict banner ပြ
5. Offline ကျန်စဉ် server timestamp မသုံး — online ပြန်ရင် `since` (last `serverTime` မှ) pull (§8.5)
6. Payload gzip base64 မသုံးမီ default JSON — nginx gzip + `compression` (§6) က ဖုံးပြီးသား (architecture line 2352 optional)

**SQLite schema (architecture line 2474 — copy-ready):**
```sql
CREATE TABLE surveys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,  -- local row ID (SQLite only)
  server_id TEXT,                        -- surveyId (business ID) after sync
  status TEXT DEFAULT 'draft',           -- draft | pending | synced | failed
  data TEXT,                             -- JSON data
  created_at INTEGER, updated_at INTEGER, synced_at INTEGER
);
CREATE TABLE sync_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  survey_row_id INTEGER,                 -- references surveys.id (local)
  idempotency_key TEXT UNIQUE,           -- UUID, one per sync request
  operation TEXT,                        -- create | update | delete
  priority INTEGER DEFAULT 0, retries INTEGER DEFAULT 0, created_at INTEGER
);
```

**Client-side reference code (architecture §Offline — mobile/web team အတွက်, server ထဲ မဟုတ်):**

```javascript
// utils/retry.js (line 2296)
const fetchWithRetry = async (fn, maxRetries = 3, baseDelay = 1000) => {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try { return await fn(); } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) await new Promise(r => setTimeout(r, baseDelay * Math.pow(2, i)));
    }
  }
  throw lastError;
};

// config/axios.js (line 2322) — token interceptor + network error → queue
const api = axios.create({ timeout: 30000, retry: 3, retryDelay: 1000 });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use((response) => response, async (error) => {
  if (!error.response) { await queueForSync(error.config.data); return Promise.resolve({ data: { queued: true } }); }
  return Promise.reject(error);
});

// services/syncService.js SyncQueue (line 2372) — priority + requeue:
// add(data, priority): high → unshift else push; process(): shift → api.push,
//   fail → retries++ (< maxRetries ? re-push : saveFailed)

// hooks/useNetworkStatus.js (line 2426): navigator.onLine + online/offline events
//   + navigator.connection.effectiveType → offline banner ပြ

// Data compression (line 2354): zlib.gzipSync(JSON.stringify(data)).toString('base64')
//   server decompress: Buffer.from(x,'base64') → gunzipSync → JSON.parse (optional, nginx gzip က ဖုံး)
```

**Sync strategy table (line 2462):** Online = real-time push | Offline = SQLite queue | Slow network = compress + backoff | Intermittent = auto-reconnect, batch | Conflict = version check (server) / user merge (client)

## 9. Database Query Catalog (architecture §4 → services)

### 9.1 Report / aggregation queries

| # | Function (service) | Purpose | Index used | Architecture ref | Target |
|---|---------------------|---------|------------|------------------|--------|
| 1 | `reportService.getDistrictReport` | ခရိုင် dashboard totals — **surveysummaries fast path** | key `{tspCode, wvCode}` | line 1632 | <10ms |
| 2 | `reportService.getTownshipReport(tspCode)` | မြို့နယ် → ကျေးရွာ breakdown | `{tspCode, status}` | line 1311 | <1s |
| 3 | `reportService.getVillageAnimalCount(wvCode, filters)` | ကျေးရွာ animal count (categoryId/ageLimit/sex optional) | `{wvCode, status}` | line 1336 | <100ms |
| 4 | `reportService.getVillageBreakdown(wvCode, categoryId)` | ageLimit/sex group-by | `{wvCode, status}` | line 1366 | <100ms |
| 5 | `reportService.drillToTownship(query)` | drilldown L1: ခရိုင် → မြို့နယ် | `{status}` | line 1442 | <2s |
| 6 | `reportService.drillToVillage(tspCode, query)` | drilldown L2: မြို့နယ် → ကျေးရွာ | `{tspCode, status}` | line 1466 | <1s |
| 7 | `reportService.drillToHousehold(wvCode, query, page)` | drilldown L3: ကျေးရွာ → အိမ် + `$lookup` interview + **count `Promise.all` parallel** | `{wvCode, status}` | line 1488 | <100ms |
| 8 | `reportService.getDetailedReport(tspCode, page)` | paginated survey list + count | `{tspCode, status}` | line 1669 | <2s |
| 9 | `exportService.exportTownship(tspCode)` | Excel: find + populate interview + `sumArray` | `{tspCode, status}` | line 1702 | 50k row cap (D-23) |

Query rules (§9.1 အားလုံး အတွက်):
- **Status filter**: architecture pipeline တွေ `status:'submitted'` သုံးထား — D-10/D-11 အရ reportService တွင် `status: { $in: ['township_verified','district_approved'] }` ပြောင်းသုံး + **`deletedAt: null` အားလုံးတွင် ထည့်ရမည်** (soft delete D-14)
- **Whitelist** `type` ∈ `bigAnimals|smallAnimals|poultry|breedingAnimals` (D-24 v2) — `` `$${type}` `` မထည့်မီ Zod မှာ ဖမ်း; breeding + age params = 422 (D-54)
- **Age range** = per-type rank map (D-55: big `LessThanOne:1…`, small `Under2months:1…`, poultry `Young:1…` — `AGE_RANKS` in `src/constants/ageLimits.js`) + `$in` — `$gte/$lte` မသုံး (architecture line 1419)
- **Search**: `escapeRegex()` ပြီးမှ `$regex` (D-25)
- **Fast path**: dashboard (filter မပါ) → `surveysummaries`; **slow path**: filtered drilldown → direct aggregation
- **Summary fast count**: breakdown key full match (`"1:LessThanOne:male"`) သို့ prefix scan (tens keys, in-memory) — architecture line 1640 `getVillageAnimalCountFast`; row 3 ရဲ့ summary အဆင့်
- Response envelope: `{ data, meta: { total, page, per_page, total_pages } }`
- **v2 amendment (2026-10-04, Phase 4)**:
  - L1/L2 `households` — ref code `$sum:1` (unwind ပြီး) က animal row တွေကို count လုပ် (survey တစ်ခု = element အများဆုံး) — **`$addToSet: '$surveyId'` + `$size` ဖြင့် distinct household count** ပြင်သုံး
  - L3 `count` — ref `countDocuments({...animalFilter})` က element တွေကြား conjunction မမှန် (categoryId element A, age element B) — **unwind+filter+`$group _id`+`$count` aggregation** ဖြင့် ပြင် (rows နဲ့ count တူစေ)
  - `from/to` (D-22) = `interviewinfos.ansDate` range → `distinct('_id')` → `interviewId: {$in}` (index `ansDate`)
  - drilldown တွင် district scope (`districtCode` + `Township.distinct`) ထည့် — multi-district IDOR ကာ
- **v2 amendment (2026-10-05, D-54 breeding)**:
  - Whitelist = `bigAnimals|smallAnimals|poultry|breedingAnimals`; `type=breedingAnimals` + `ageFrom/ageTo` → **422** (age dimension မရှိ), sex = `male|female` only (`ca_male` 422)
  - Summary key arity: 3 type = `categoryId:ageLimit:sex`, breeding = **`categoryId:sex`** (2-part) — fast-path prefix scan key index ပြောင်း (`getVillageAnimalCountFast` type-aware)
  - L1/L2/L3 `$unwind $breedingAnimals` + male/female `$cond` = sex field အတိုင်းအလုပ်လုပ်; L3 `byAge[].ageLimit = null` (mapping မှာ normalize)
  - `sumBreakdownBySex` = key **last segment** (2-part/3-part နှစ်ခုလုံး work)

### 9.2 Role-based list + search queries (architecture §4.8)

```
GET /surveys →
1. search ရှိရင်:  interview hName (escapeRegex) → distinct('_id') →
   $or: [{ interviewId: { $in } }, { surveyId: Number(search) || null }]     // line 1799
2. query = { ...buildSurveyScope(user), ...searchOr }                        // §9.3
3. Promise.all([
     Survey.find(query)
       .populate('interviewId', <role fields>)                               // no N+1
       .select(<list projection>).sort(<sort>).skip().limit().lean(),
     Survey.countDocuments(query)
   ])
```

| Role | populate fields (architecture line 1817/1834/1846) |
|------|-----------------------------------------------------|
| village | `hName hPhone` |
| township | `hName hPhone wvCode` |
| district | `hName hPhone tspCode wvCode` |

- `hName` က `interviewinfos` မှာပဲ — survey doc ပေါ် `hName` နဲ့ search **မလုပ်ရ** (field မရှိ)
- `interviewinfos.hName` index မထည့် (<100k docs regex scan လုံလောက်; ကြီးရင် `$text`)

### 9.3 Permission single-query (architecture line 919)

```javascript
// scope filter = findOne ထဲ တိုက်ရိုက်ထည့် — 2 query မလို, IDOR ကာကွယ်
const filter = { surveyId };                       // သို့ {_id}
Object.assign(filter, buildSurveyScope(user));     // district:{} / tsp:{tspCode} / village:{wvCode}
const survey = await Survey.findOne(filter).lean();
if (!survey) throw new ApiError(404, 'not_found'); // scope miss = 404 (existence leak မလုပ်)
```

### 9.4 Cache-aside queries (architecture line 1192, 1868)

| Key | Data | TTL | Invalidate |
|-----|------|-----|------------|
| `locations:townships:<scope>`, `locations:townvgs:<scope>`, `locations:wardvillages:<scope>` (scope = `district:<code>` / `tsp:<code>` / `tvg:<code>` / `wv:<code>` / `all` — D-57) | location lists | 1h | seed ပြီးရင် `DEL locations:*` |
| `categories:<type>` | category list | 1h | seed ပြီး `DEL` |
| `location:<type>:<code>` | single location | 1h | — |
| `count:<hash(query)>` | survey countDocuments | 5min | survey write ပြီး `DEL` prefix |

- Pattern: `GET → miss → Mongo find → SETEX → return` (architecture line 1196 အတိုင်း)
- Location/category data rarely changes — 1h default; write path ရှိရင် (admin update) explicit DEL

### 9.5 Query hygiene (architecture §4.1, 4.4–4.6)

| Rule | Detail |
|------|--------|
| `.lean()` | read-only list/report queries အားလုံး |
| Projection | `.select('surveyId status interviewId ...')` — list/report မှာ field အကုန် မဆွဲ |
| N+1 | loop ထဲ query မထည့် — `populate()` နဲ့ join (architecture line 1253) |
| `explain('executionStats')` | dev/test မှာ `winningPlan` တွင် COLLSCAN မပါကြောင်း verify |
| Bulk | seed/import: `insertMany(,{ ordered:false })`, update များ → `bulkWrite` |

### 9.6 Performance targets (acceptance criteria)

| Operation | Target |
|-----------|--------|
| Login | < 200ms |
| List surveys (role scope) | < 500ms (village <1s, township/district <2s) |
| Get survey | < 300ms |
| Create survey (transaction) | < 1s |
| Search | < 1s |
| Report generation | < 5s (drilldown L1/L2/L3 = §9.1 table) |
| Sync push (≤50 items) | < 3s |

**Performance checklist (architecture line 2012):**

| Area | Optimization | Ref |
|------|-------------|-----|
| Database | proper indexing, pool, projection, `.lean()` | §4, §9.5 |
| Caching | Redis location/category + count | §9.4 |
| API | pagination, compression, response filtering | §6, §7.1 |
| Async | queue (Phase 2) | §9.10 |
| Scaling | nginx upstream + PM2 cluster | §14.6 |
| Monitoring | APM (New Relic/Datadog) + thresholds | §14.4 |

### 9.7 Aggregation Pipeline Implementations (architecture §4.3–4.6 — copy-ready)

> **STATUS**: architecture code တွေ `status:'submitted'` သုံးထား — **ဒီမှာ REPORT_STATUS ဖြင့် အစားထိုးပြီး** (D-10/11)။ code ရေးသားသော agent သည် အောက်ပါ const ကို အသုံးပြုရမည်။

```javascript
const REPORT_STATUS = { $in: ['township_verified', 'district_approved'] }; // D-11
const AGE_RANKS = {                                                          // D-55 (single source: constants/ageLimits.js)
  bigAnimals: { LessThanOne: 1, Between1and3: 2, Over3: 3 },
  smallAnimals: { Under2months: 1, Between2and6months: 2, Over6months: 3 },
  poultry: { Young: 1, Middle: 2, Old: 3 }
};
```

**Filter builder (architecture line 1415):**
```javascript
const buildAnimalFilter = (query) => {
  const { type = 'bigAnimals', categoryId, ageFrom, ageTo, sex } = query;
  const rank = AGE_RANKS[type];
  const match = {};
  if (categoryId) match[`${type}.categoryId`] = Number(categoryId);
  if (ageFrom || ageTo) {
    const allowed = Object.keys(rank).filter((a) => {
      if (ageFrom && rank[a] < rank[ageFrom]) return false;
      if (ageTo && rank[a] > rank[ageTo]) return false;
      return true;
    });
    match[`${type}.ageLimit`] = { $in: allowed };  // enum string → $gte/$lte မသုံး
  }
  if (sex) match[`${type}.sex`] = sex;
  return match;
};
```

**District / Township reports (line 1283, 1311):**
```javascript
const getDistrictReport = async (tspCode) => Survey.aggregate([
  { $match: { tspCode, status: REPORT_STATUS } },
  { $lookup: { from: 'interviewinfos', localField: 'interviewId', foreignField: '_id', as: 'interview' } },
  { $unwind: '$interview' },
  { $group: { _id: '$tspCode', totalSurveys: { $sum: 1 }, totalHouseholds: { $sum: 1 },
      avgAge: { $avg: '$interview.hAge' },
      totalBigAnimals: { $sum: { $sum: '$bigAnimals.count' } },
      totalSmallAnimals: { $sum: { $sum: '$smallAnimals.count' } },
      totalPoultry: { $sum: { $sum: '$poultry.count' } } } }
]);

const getTownshipReport = async (tspCode) => Survey.aggregate([   // line 1311: village breakdown
  { $match: { tspCode, status: REPORT_STATUS } },
  { $group: { _id: '$wvCode', totalSurveys: { $sum: 1 },
      totalBigAnimals: { $sum: { $sum: '$bigAnimals.count' } },
      totalSmallAnimals: { $sum: { $sum: '$smallAnimals.count' } },
      totalPoultry: { $sum: { $sum: '$poultry.count' } } } },
  { $sort: { totalSurveys: -1 } }
]);
```

**Filtered village count + breakdown (line 1336, 1366):**
```javascript
const getVillageAnimalCount = async (wvCode, filters = {}) => {   // any combination optional
  const { categoryId, ageLimit, sex } = filters;
  const animalMatch = {};
  if (categoryId !== undefined) animalMatch['bigAnimals.categoryId'] = categoryId;
  if (ageLimit) animalMatch['bigAnimals.ageLimit'] = ageLimit;
  if (sex) animalMatch['bigAnimals.sex'] = sex;
  const result = await Survey.aggregate([
    { $match: { wvCode, status: REPORT_STATUS } },   // index {wvCode, status} → no COLLSCAN
    { $unwind: '$bigAnimals' },                      // embedded → no $lookup
    { $match: animalMatch },
    { $group: { _id: null, total: { $sum: '$bigAnimals.count' } } }
  ]);
  return result[0]?.total ?? 0;
};

const getVillageBreakdown = async (wvCode, categoryId) => Survey.aggregate([
  { $match: { wvCode, status: REPORT_STATUS } },
  { $unwind: '$bigAnimals' },
  { $match: { 'bigAnimals.categoryId': categoryId } },
  { $group: { _id: { ageLimit: '$bigAnimals.ageLimit', sex: '$bigAnimals.sex' },
              total: { $sum: '$bigAnimals.count' } } },
  { $sort: { '_id.ageLimit': 1, '_id.sex': 1 } }
]);
```

**Drill-down L1 / L2 / L3 (line 1442, 1466, 1488):**
```javascript
const drillToTownship = async (query) => {          // L1: ခရိုင် → မြို့နယ်
  const type = query.type || 'bigAnimals';
  const animalFilter = buildAnimalFilter(query);
  return Survey.aggregate([
    { $match: { status: REPORT_STATUS } },
    { $unwind: `$${type}` },
    { $match: animalFilter },
    { $group: { _id: '$tspCode', households: { $sum: 1 },
        total: { $sum: `$${type}.count` },
        male:   { $sum: { $cond: [{ $eq: [`$${type}.sex`, 'male'] },   `$${type}.count`, 0] } },
        female: { $sum: { $cond: [{ $eq: [`$${type}.sex`, 'female'] }, `$${type}.count`, 0] } } } },
    { $sort: { total: -1 } }
  ]);
};

const drillToVillage = async (tspCode, query) => {  // L2: same pipeline, _id '$wvCode' + $match {tspCode}
  const type = query.type || 'bigAnimals';
  const animalFilter = buildAnimalFilter(query);
  return Survey.aggregate([
    { $match: { tspCode, status: REPORT_STATUS } }, // index {tspCode, status}
    { $unwind: `$${type}` },
    { $match: animalFilter },
    { $group: { _id: '$wvCode', households: { $sum: 1 }, total: { $sum: `$${type}.count` } } },
    { $sort: { total: -1 } }
  ]);
};

const drillToHousehold = async (wvCode, query, page = 1, perPage = 20) => {  // L3
  const type = query.type || 'bigAnimals';
  const animalFilter = buildAnimalFilter(query);
  const pipeline = [
    { $match: { wvCode, status: REPORT_STATUS } },
    { $unwind: `$${type}` },
    { $match: animalFilter },
    { $lookup: { from: 'interviewinfos', localField: 'interviewId', foreignField: '_id', as: 'iv' } },
    { $unwind: '$iv' },
    { $group: { _id: '$surveyId', hName: { $first: '$iv.hName' }, hPhone: { $first: '$iv.hPhone' },
        total: { $sum: `$${type}.count` },
        male:   { $sum: { $cond: [{ $eq: [`$${type}.sex`, 'male'] },   `$${type}.count`, 0] } },
        female: { $sum: { $cond: [{ $eq: [`$${type}.sex`, 'female'] }, `$${type}.count`, 0] } },
        byAge: { $push: { ageLimit: `$${type}.ageLimit`, sex: `$${type}.sex`, count: `$${type}.count` } } } },
    { $sort: { total: -1 } },
    { $skip: (page - 1) * perPage },
    { $limit: perPage }
  ];
  const [rows, total] = await Promise.all([
    Survey.aggregate(pipeline),
    Survey.countDocuments({ wvCode, status: REPORT_STATUS, deletedAt: null, ...animalFilter }) // count: unwind မလုပ် — cheaper
  ]);
  return { data: rows, meta: { total, page, per_page: perPage } };
};
```

**Drill-down perf + path selection (line 1536, 1544):**

| Level | Index | Docs scanned | Target |
|-------|-------|--------------|--------|
| L1 ခရိုင်→မြို့နယ် | `{status}` | ~50k–100k submitted | <2s |
| L2 မြို့နယ်→ကျေးရွာ | `{tspCode, status}` | ~10k–25k | <1s |
| L3 ကျေးရွာ→အိမ် (paginated) | `{wvCode, status}` | tens–hundreds | <100ms |

| အခြေအနေ | Path |
|---|---|
| L1/L2 dashboard အကြိမ်ကြိမ် | `surveysummaries` breakdown (<10ms) |
| L1/L2 filter အသစ် (age range/sex ပြောင်း) | direct aggregation (index-backed) |
| L3 အိမ်စာရင်း | အမြဲတမ်း direct + pagination |

- `$unwind` ပြီးမှ in-memory filter ဖြစ်တဲ့အတွက် array field index ထပ်မထည့် — `wvCode`/`tspCode` index တစ်ခုတည်း လုံလောက် (line 1395)

**Detailed report (line 1669):**
```javascript
const getDetailedReport = async (tspCode, page = 1, perPage = 20) => {
  const skip = (page - 1) * perPage;
  const query = { tspCode, status: REPORT_STATUS, deletedAt: null };
  const [surveys, total] = await Promise.all([
    Survey.find(query).select('surveyId interviewId bigAnimals smallAnimals poultry')
      .skip(skip).limit(perPage).lean(),
    Survey.countDocuments(query)
  ]);
  return { data: surveys, meta: { total, page, per_page: perPage, total_pages: Math.ceil(total / perPage) } };
};
```

### 9.8 Summary Implementation (architecture line 1574 — full)

```javascript
// surveysummaries doc:
// { tspCode, wvCode, totalSurveys, totalBigAnimals, totalSmallAnimals, totalPoultry,
//   bigBreakdown: { "1:LessThanOne:male": 45, "1:Over3:ca_male": 120, ... },
//   smallBreakdown: {...}, poultryBreakdown: {...}, lastUpdated }

const updateSummary = async (survey, sign = 1) => {   // sign: +1 verify (D-38), -1 reject/delete-if-counted
  const inc = {
    totalSurveys: sign * 1,
    totalBigAnimals: sign * sumArray(survey.bigAnimals),
    totalSmallAnimals: sign * sumArray(survey.smallAnimals),
    totalPoultry: sign * sumArray(survey.poultry)
  };
  const addToBreakdown = (acc, arr, field) => {
    for (const a of arr) {
      const key = `${field}.${a.categoryId}:${a.ageLimit}:${a.sex}`;  // dotted $inc path
      acc[key] = (acc[key] || 0) + a.count;
    }
    return acc;
  };
  const bigDiff = addToBreakdown({}, survey.bigAnimals, 'bigBreakdown');
  const smallDiff = addToBreakdown({}, survey.smallAnimals, 'smallBreakdown');
  const poultryDiff = addToBreakdown({}, survey.poultry, 'poultryBreakdown');
  const scaled = (obj) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, sign * v]));
  await SurveySummary.findOneAndUpdate(
    { tspCode: survey.tspCode, wvCode: survey.wvCode },
    { $inc: { ...inc, ...scaled(bigDiff), ...scaled(smallDiff), ...scaled(poultryDiff) },
      $set: { lastUpdated: new Date() } },
    { upsert: true }
  );
};

const getDistrictReportFast = async (tspCode) => SurveySummary.find({ tspCode })   // line 1632
  .select('totalSurveys totalBigAnimals totalSmallAnimals totalPoultry').lean();

// Fast filtered: full key hit သို့ prefix scan (breakdown = tens keys, in-memory) — line 1640
const getVillageAnimalCountFast = async (wvCode, { categoryId, ageLimit, sex } = {}) => {
  const doc = await SurveySummary.findOne({ wvCode }).select('bigBreakdown').lean();
  if (!doc?.bigBreakdown) return 0;
  if (categoryId !== undefined && ageLimit && sex) {
    return doc.bigBreakdown[`${categoryId}:${ageLimit}:${sex}`] ?? 0;   // full key
  }
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

Report response format (line 1560): `{ data: { tspCode, totalSurveys, totalHouseholds, avgAge, totalBigAnimals, totalSmallAnimals, totalPoultry } }`

### 9.9 Excel Export (architecture line 1695 — full)

```javascript
// GET /api/v1/reports/district/:tspCode/export  (district only, 50k cap D-23)
const ExcelJS = require('exceljs');
const exportToExcel = async (req, res) => {
  const { tspCode } = req.params;
  const surveys = await Survey.find({ tspCode, status: REPORT_STATUS, deletedAt: null })
    .populate('interviewId').lean();     // 50k ကျော်ရင် 400 error (D-23)

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Surveys');
  worksheet.columns = [
    { header: 'Survey ID', key: 'surveyId' },
    { header: 'အမည်', key: 'hName' },
    { header: 'ဖုန်း', key: 'hPhone' },
    { header: 'ကျေးရွာ', key: 'wvCode' },
    { header: 'တိရစ္ဆာန်ကြီး', key: 'bigAnimals' },
    { header: 'တိရစ္ဆာန်အငယ်', key: 'smallAnimals' },
    { header: 'ကြက်/ဘဲ/ငုံ', key: 'poultry' },
    { header: 'မျိုးပွားစုစုပေါင်း', key: 'breedingAnimals' },   // D-54
    { header: 'မျိုးပွား-အထီး', key: 'breedingMale' },
    { header: 'မျိုးပွား-အမ', key: 'breedingFemale' }
  ];
  surveys.forEach(s => worksheet.addRow({
    surveyId: s.surveyId, hName: s.interviewId?.hName, hPhone: s.interviewId?.hPhone,
    wvCode: s.wvCode, bigAnimals: sumArray(s.bigAnimals),
    smallAnimals: sumArray(s.smallAnimals), poultry: sumArray(s.poultry),
    breedingAnimals: sumArray(s.breedingAnimals),
    breedingMale: sumBySex(s.breedingAnimals, 'male'),
    breedingFemale: sumBySex(s.breedingAnimals, 'female')
  }));
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="surveys_${tspCode}.xlsx"`);
  await workbook.xlsx.write(res);
  res.end();
};
```

### 9.10 Async Queue (Phase 2 — architecture line 1900, D-39 bullmq)

- Architecture က `bull` သုံးထား — **deprecated မို့ `bullmq` သုံး** (D-39); Phase 6 မှသာ
- Use: Excel export ကြီးများ (respond 202 + job id), summary rebuild, audit batch write
- Config: `attempts: 3, backoff: { type: 'exponential', delay: 1000 }` (line 1919), Redis connection = `REDIS_URL`
- လက်ရှိ Phase 0–5: sync/report က synchronous (target time အတွင်း) — queue မလို

### 9.11 Query Patterns Summary (architecture line 1783)

| Pattern | Use case | Where |
|---------|----------|-------|
| `populate()` | join Survey + InterviewInfo | §9.2 list, export |
| `aggregate()` | reports, statistics | §9.7 |
| `$in` search | hName → interviewIds → surveys | §9.2 |
| projection `.select()` | reduce payload | §9.5 |
| `insertMany({ordered:false})` / `bulkWrite` | seed/import | §12 |
| `explain('executionStats')` | verify no COLLSCAN | §9.5 |
| cursor (`.cursor()`) | large export streaming | §9.9 ကြီးရင် |

## 10. Error Envelope & Codes

```json
{ "error": { "code": "validation_error", "message": "...", "details": [{ "field": "hName", "message": "Required" }] } }
```

Codes: `validation_error(400/422), unauthorized(401), forbidden(403), not_found(404), duplicate_entry(409), version_conflict(409), request_in_progress(409), stale_credentials(401), account_locked(423→429), rate_limit_exceeded(429), service_unavailable(503), internal_error(500)`
- Global handler = architecture line 2546 + Redis/Mongo down → 503 `service_unavailable`
- `Retry-After` header: 429/503 တွင် ပါ

**Error handler mapping (`errorHandler.js`):**

| Error source | → Response |
|--------------|-----------|
| `ApiError(status, code, message, details?)` | ထို status + code တိုက်ရိုက် |
| `ZodError` | 422 `validation_error` + `details: issues.map(path, message)` |
| Mongoose `ValidationError` | 400 `validation_error` + field details |
| Mongoose `CastError` | 400 `validation_error` (bad id/number) |
| Mongo `E11000` duplicate | 409 `duplicate_entry` |
| JWT errors (`TokenExpiredError` 등) | 401 `unauthorized` (refresh က refresh ကိုင် — architecture line 2573) |
| Mongo/Redis down (network) | 503 `service_unavailable` |
| unknown | 500 `internal_error` — stack ကို log ထဲပဲ, response မထည့် |

- Handler တွင် `requestId` ထည့် (client support အတွက် correlation)
- body parse မကိုက် (SyntaxError) → 400 `validation_error`

**Copy-ready (`utils/apiError.js` + `middleware/errorHandler.js`, architecture line 2546):**

```javascript
class ApiError extends Error {
  constructor(statusCode, message, code = 'internal_error', details = undefined) {
    super(message); this.statusCode = statusCode; this.code = code; this.details = details;
  }
}

const errorHandler = (err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ error: { code: err.code, message: err.message, ...(err.details && { details: err.details }) } });
  }
  if (err.name === 'ZodError') {            // §5.1 middleware → 422
    return res.status(422).json({ error: { code: 'validation_error', message: 'Request validation failed',
      details: err.issues.map(i => ({ field: i.path.join('.'), message: i.message })) } });
  }
  if (err.name === 'ValidationError') {     // Mongoose
    return res.status(400).json({ error: { code: 'validation_error', message: 'Validation failed',
      details: Object.values(err.errors).map(e => ({ field: e.path, message: e.message })) } });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ error: { code: 'validation_error', message: `Invalid value for ${err.path}` } });
  }
  if (err.code === 11000) {                 // duplicate key
    return res.status(409).json({ error: { code: 'duplicate_entry', message: 'Duplicate entry found' } });
  }
  logger.error('Unexpected error', { requestId: req.id, error: err });   // stack = log only
  return res.status(500).json({ error: { code: 'internal_error', message: 'Internal server error' } });
};
```

## 11. Security Implementation Checklist

| # | Item | Ref |
|---|------|-----|
| 1 | bcrypt 12 rounds, min password 8 | D-09 |
| 2 | JWT full claims + 15m/7d rotation + logout revoke | D-26/27/28 |
| 3 | Zod ဖြင့် body/query/params အားလုံး validate | — |
| 4 | `escapeRegex` search input | D-25 |
| 5 | `type` param whitelist | D-24 |
| 6 | scope filter middleware — IDOR ကာကွယ် | — |
| 7 | Lockout 5 fail/15min | D-32 |
| 8 | Custom Redis rate limit + trust proxy | D-30 |
| 9 | CORS methods/headers ပြည့်စုံ | D-31 |
| 10 | helmet + HSTS + nginx TLS443 | D-44 |
| 11 | `express.json({limit:'1mb'})` | D-34 |
| 12 | Env Zod fail-fast, secrets ထဲပဲ (repo မထား) | D-46 |
| 13 | Audit log (login, submit, approve, delete, export) | D-40 |
| 14 | NoSQL injection: input အားလုံး type cast (Zod) | — |
| 15 | Force-change gate + district-only password reset; default password CSV = secrets (repo မထား) | D-09/53 |

**Status (2026-10-04, Phase 5)**: အချက် ၁၅ ခု အားလုံး implemented + tested ✓
- 429 (anon `RATE_LIMIT_ANON_MAX` + role table 100/200/500 exhaustion + `X-RateLimit-*`/`Retry-After`), 403 (RBAC + CORS origin), 413 `payload_too_large`, malformed JSON 400, NoSQL operator 422 → `tests/integration/api/security.test.js`
- helmet: `strictTransportSecurity { maxAge: 31536000 }` + CSP + no `x-powered-by` (app.js); gzip compression verified via raw http (test တွင် DB seed လို — response > 1KB threshold)
- audit actions: login_success/login_fail/password_change/password_reset (auth.test), submit/verify/approve/delete (surveys.test), export (reports.test)
- graceful shutdown: server.js SIGTERM/SIGINT → close HTTP → mongo/redis → exit, 30s force timer
- secrets repo မပါ: `.gitignore` = `.env`, `data/generated-passwords.csv`
- `errorHandler`: entity.too.large → 413 (v2 add, Phase 5)

**Audit log record fields** (`auditLog.js`, architecture line 1083 — fire-and-forget, မပျက်အောင် try/catch + logger fallback):

```javascript
{ timestamp, userId, role, method, path, status, ip, userAgent, requestId }
// actions: login_success/login_fail, submit, verify, approve, reject, delete, export, password_change/reset
// TTL index: 90d (D-40) — model §5 row 12
```

## 12. Seed & Migration

| Script | Input | Output |
|--------|-------|--------|
| `seed-locations.js` | `data/locations.csv` (tsp, tvg, wv pcode) | 3 collections upsert by code |
| `seed-categories.js` | `data/categories.json` (categoryId, name ×3) | 3 category collections |
| `seed-users.js` | `data/users.csv` (loginCode, role, district/tsp/tvg/wv codes) | users (bcrypt 12) + `data/generated-passwords.csv` — random 10-char generator §8.0 (D-09) |
| `init-id-counters.js` | DB max | Redis SETNX |
| `rebuild-summaries.js` | counted statuses (`$in` township_verified+district_approved) + `deletedAt: null` | surveysummaries full recompute (D-38 v2) |

- CSV source/owner = **decision D-08 (user provide)**
- Idempotent: upsert by unique code — repeat လုပ်နိုင်
- Startup: connect → `syncIndexes()` → `initIdCounters()` → listen (architecture line 317)

## 13. Testing

| Type | Tool | Scope |
|------|------|-------|
| Unit | Jest | services (transition, sync merge, scope, idempotency), validators, utils |
| Integration | Jest + Supertest + mongodb-memory-server + ioredis-mock | routes: auth flow, survey CRUD+workflow, sync push (dup key/version conflict), reports, rate limit |
| E2E (Phase 2, D-42) | Playwright | critical flows (login → survey → submit → verify → approve) |
| Coverage target | — | Unit 80%+, integration 70%+ (architecture line 2698) |

**Test structure (architecture line 2626):**
```
tests/
├── unit/
│   ├── services/   # surveyService.test.js, syncService.test.js, reportService.test.js
│   └── utils/      # retry.test.js, escapeRegex.test.js, password.test.js
├── integration/
│   ├── api/        # surveys.test.js, auth.test.js, sync.test.js, reports.test.js
│   └── db/         # surveyRepository.test.js
├── load/           # k6 scripts (architecture line 2725)
└── e2e/            # survey-flow.spec.js (Phase 2)
```

Priority test cases:
1. Login: valid/invalid/lockout; **normalization** (space/lowercase input), **admin reset** flow; refresh rotation (reuse → revoke all)
2. Scope: village user က တခြားရွာ survey 404/403
3. Workflow: invalid transition → 409
4. Sync: same Idempotency-Key ×2 → single create; stale syncVersion → version_conflict; batch partial success
5. Summary: **verify +1 / reject-from-verified −1 / delete-when-counted −1** delta + rebuild ရလဒ် တူ (D-38 v2); submit/approve မှာ summary မပြောင်း
6. Search: regex special char input မပျက်

**Load test (k6, architecture line 2725):**

```javascript
export const options = {
  stages: [{ duration: '2m', target: 100 }, { duration: '5m', target: 1000 }, { duration: '2m', target: 0 }],
  thresholds: { http_req_duration: ['p(95)<2000'], http_req_failed: ['rate<0.01'] }
};
// scenarios: login 10% / list 60% / sync push 20% / report 10%
// gate: 1000 concurrent မှာ p95 <2s, error <1% → Atlas tier (D-47) အတည်ပြု
```

## 14. Deployment

**Dev:** `npm run dev` + local Mongo/Redis (docker-compose ထဲတွင် optional)
**Prod:**
1. `Dockerfile` (node:20-alpine, multi-stage, `npm ci --omit=dev`)
2. nginx: TLS 443 + redirect 80→443, proxy → PM2 cluster (4 instances) သို့မဟုတ် docker replica
3. `pm2 start ecosystem.config.js` (cluster mode, architecture line 1953)
4. Atlas: M10+, IP allowlist, DB user least-privilege, automated backup + PITR (§14.4)
5. CI (GitHub Actions) — §14.5
6. Runbook: health check monitor, Redis AOF, backup restore test (quarterly)

### 14.1 Health & Graceful Shutdown (`server.js`)

```javascript
// GET /health/ready → { status, timestamp, uptime, memory, database, redis }
// database/redis ping ကျရင် 503 + status:'unhealthy' (D-41)
// /health (liveness) = process up ပဲ စစ်, 200

const shutdown = async (signal) => {
  logger.info(`Received ${signal}, shutting down...`);
  server.close(async () => {            // new connection မယူ
    await mongoose.disconnect();
    await redis.quit();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 30_000).unref(); // 30s force
};
process.on('SIGTERM', shutdown); process.on('SIGINT', shutdown);
```

### 14.2 PM2 & nginx snippets

```javascript
// ecosystem.config.js
module.exports = { apps: [{
  name: 'livestock-api', script: './src/server.js', instances: 4,
  exec_mode: 'cluster', max_memory_restart: '512M',
  env_production: { NODE_ENV: 'production', NODE_APP_INSTANCE: '$PM2_INSTANCE_ID' }
}]};
```

```nginx
# /etc/nginx/sites-available/livestock
server {
  listen 80; server_name api.example.com; return 301 https://$host$request_uri;
}
server {
  listen 443 ssl http2;
  ssl_certificate     /etc/letsencrypt/live/api.example.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/api.example.com/privkey.pem;
  gzip on; gzip_types application/json;
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

### 14.3 Backup schedule (Atlas + ops)

| Data | Schedule | Retention |
|------|----------|-----------|
| Survey/user collections | daily 02:00 | 35 days (PITR on) |
| Location/category (seed data) | weekly | 90 days |
| `data/generated-passwords.csv` | 1:1 ကို server မှာ မသိမ်း — offline vault (D-09) |

- **Recovery plan**: restore → `seed-*` idempotent re-run → `rebuild:summaries` → ID counters `initIdCounters()` (§8.7)
- **Recovery steps (architecture line 2685):** 1) Identify backup point → 2) Restore to **staging** cluster → 3) Verify data integrity → 4) Switch production
- **Cross-region backup**: enable for disaster recovery (line 2674)
- Restore drill: quarterly (runbook)

### 14.4 Observability

- **Winston** (`logger.js`): JSON format; transports = console + `error.log` + `combined.log`; request logging via `requestId` per request
- **Monitoring thresholds** (architecture line 2774):

  | Metric | Warning | Critical |
  |--------|---------|----------|
  | Response time p95 | >2s | >5s |
  | Error rate | >1% | >5% |
  | CPU | >80% 5min | >90% 10min |
  | Memory | >85% | >95% |
  | Mongo connections | >80% pool | pool exhausted |
  | Redis memory | >80% | eviction စ |

- **APM** (line 2019): New Relic / Datadog — prod တွင် agent ထည့်ပါ (optional, infra cost)

### 14.5 CI workflow (GitHub Actions)

```yaml
name: ci
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run lint
      - run: npm run test:unit
      - run: npm run test:integration   # memory mongo/redis — Atlas မလို
      - run: docker build -t livestock-api .   # Phase 2+: push + deploy
```

### 14.6 Supporting Middleware & Ops Steps

**requestId (`middleware/requestId.js`, architecture line 2078):**
```javascript
const { v4: uuidv4 } = require('uuid');
const requestId = (req, res, next) => {
  req.id = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-Id', req.id);
  next();
};
```

**Env validation (`config/env.js`, architecture line 2106 — D-46/27: `JWT_EXPIRATION` မပါ):**
```javascript
const envSchema = z.object({
  MONGODB_URI: z.string().url(), REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(32), JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z.string().default('15m'), JWT_REFRESH_TTL: z.string().default('7d'),
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development')
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) { logger.error(parsed.error.format()); process.exit(1); }  // fail-fast
```

**MongoDB Atlas setup (architecture line 1161):**
1. Create cluster → https://cloud.mongodb.com (M10+, D-47)
2. Create DB user (least privilege: readWrite on `livestock_survey`)
3. Whitelist IPs (server IPs + workstation for seed)
4. Copy connection string → `MONGODB_URI`
5. Enable automated backup + PITR (§14.3), note `retryWrites=true`

**Horizontal scaling (architecture line 1926):** nginx upstream `least_conn` → PM2 instances (3000–3003) → Atlas M10:

```nginx
# /etc/nginx/conf.d/livestock-survey.conf
upstream node_cluster {
    least_conn;
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
    server 127.0.0.1:3003;
}
# + TLS server block = §14.2 — proxy_pass http://node_cluster သုံး
```

**Deployment commands (architecture line 1997):**
```bash
pm2 start ecosystem.config.js     # cluster start
pm2 reload ecosystem.config.js    # zero-downtime deploy
sudo nginx -s reload
pm2 monit                         # monitor
```

**Dev quickstart (architecture line 1123):** `npm install` → `cp .env.example .env` → `npm run dev`

## 15. Implementation Phases

### Phase 0 — Scaffold (0.5 day)
- [x] package.json + deps + scripts, .env.example, ESLint/Prettier, folder tree
- [x] `config/env.js` (Zod), `database.js`, `redis.js`, `logger.js`
- [x] `app.js` middleware chain + requestId/helmet/cors/compression/errorHandler
- [x] `server.js` startup sequence, `/health` + `/health/ready`
- ✅ Acceptance (verified 2026-10-04): `npm run dev` boots, health 200, lint passes

### Phase 1 — Auth + Reference Data (1.5 days)
- [x] Models: users, 3 locations, 3 categories, refreshtokens, auditlogs
- [x] Seed scripts ×3 (D-08 data needed) + `syncIndexes`
- [x] `authService` (login/refresh/logout/lockout/change-password) + JWT utils
- [x] RBAC + scope middleware
- [x] Locations/categories endpoints (cache 1h)
- ✅ Acceptance (verified 2026-10-04): 3 role login ✓, scope query tests ✓, seed repeat idempotent ✓ (143 tests green, coverage 94.8%)

### Phase 2 — Survey CRUD + Workflow (2 days)
- [x] Models: interviewinfos, surveys (+D-05/10/14 fields), surveysummaries
- [x] `initIdCounters` + `idService` + reconcile, transaction create (D-37)
- [x] CRUD + submit/verify/approve/reject + transition guard
- [x] `summaryService` delta + `rebuild-summaries.js`
- [x] Validators (survey + enums)
- ✅ Acceptance (verified 2026-10-04): full workflow test pass ✓, summary recompute တူ ✓ (delta == rebuild), ID ထပ်မရ ✓ — 213 tests green, coverage 96.5%

### Phase 3 — Offline Sync (2 days)
- [x] `POST /sync/push`: batch, SETNX lock, result cache, per-item results, version conflict
- [x] `GET /sync/pull`: since/cursor/types + tombstone
- [x] Sync validators (batch ≤50, Idempotency-Key UUID)
- [x] Integration tests: dup key, stale version, partial fail, permission scope
- ✅ Acceptance (verified 2026-10-04): dup Idempotency-Key → single create, identical body ✓, conflict response serverVersion/serverData client spec နဲ့ ကိုက် ✓ — 257 tests green, coverage 97.0%

### Phase 4 — Reports + Export (1.5 days)
- [x] drilldown (whitelist D-24), district/township reports, search (D-25)
- [x] summaries fast path + direct aggregation slow path
- [x] Excel export (limit 50k) + `from/to` date filter (D-22)
- ✅ Acceptance (verified 2026-10-04): district fast path == rebuild output ✓, drilldown L1/L2 fast == direct ✓, export scope/row-limit/from-to ✓ — 320 tests green, coverage 97.5% (test env data small → perf targets n/a; indexes §9.1 in place)

### Phase 5 — Hardening (1 day)
- [x] Rate limiters (role table), lockout, CORS finalize, trust proxy, body limit
- [x] Audit log wiring, structured logging, graceful shutdown, compression headers
- [x] Security checklist §11 အားလုံး tick
- ✅ Acceptance (verified 2026-10-04): 429 (anon + role exhaustion + headers/Retry-After) / 403 (RBAC + CORS origin) / 413 / 422 paths tested, audit actions submit/verify/approve/delete/login/export asserted — 331 tests green, coverage 97.6%

### Phase 6 — Tests, CI, Deploy (1.5 days)
- [x] Coverage 80%+, GitHub Actions, Dockerfile, nginx + TLS, PM2
- [x] Prod seed + rebuild summaries + backup config verify
- [x] Load smoke: k6 login/list/sync (Atlas tier confirm D-47)
- ✅ Acceptance (verified 2026-10-05): `docker build` ✓, `docker compose up` → `/health/ready` 200 (db+redis) ✓, container seed 845 users ✓, login 200 ✓, `docker stop` graceful exit 0 ✓; k6 smoke thresholds green (checks 110/110, p95 374ms < 2s, error <1%) ✓; rebuild:summaries + mongodump in-container ✓; 331 tests, coverage 97.6%. CI file ready (runs on first GitHub push); prod server + mobile sync E2E + full-scale D-47 gate = manual/deploy-time steps

**Phase 6 artifacts (2026-10-05):** `Dockerfile` (node:20-alpine multi-stage, non-root, /health/ready healthcheck), `.dockerignore`, `docker-compose.yml` (api+mongo+redis, `${API_PORT:-3000}` override, healthchecks, AOF), `ecosystem.config.js` (PM2 cluster 4, wait_ready + kill_timeout 35s + server.js `process.send('ready')`), `.github/workflows/ci.yml` (lint → test+coverage gate → docker build), `deploy/nginx/livestock.conf` (80→443, upstream least_conn, gzip, X-Request-Id), `tests/load/smoke.js` (k6), `README.md` quickstart.
- **k6 notes**: rate int (timeUnit '10s' ဖြင့် express); `pexpire` refresh (§9 D-30 code) = rate budget **whole-test cumulative** while traffic continuous → smoke rates ကို anon ≤30 / village ≤100 total အတွင်း ချိန်

### Phase 7 — Breeding 4th Category (2026-10-05, D-54)
- [x] `breedingcategories` model + `categories.json` key `breeding` (6 rows) + `GET /categories/breeding` + sync pull categories 4th key
- [x] `surveys.breedingAnimals` (`[{categoryId, sex, count}]` age မပါ) + `hasBreeding` server-derived (create/update/sync)
- [x] Validators: breeding shape, `GET /surveys?hasBreeding=true|false` filter, drilldown age/sex 422 rules
- [x] Summary: `totalBreedingAnimals` + `breedingBreakdown` (2-part key `categoryId:sex`) + rebuild backfill `hasBreeding:false`
- [x] Reports: TYPE_META/TOTAL_FIELDS/`emptyTotals` + township report + drilldown type=breedingAnimals (fast/direct/L3 `ageLimit:null`) + export 3 columns (total/အထီး/အမ)
- [x] Docs: decisions D-54 + D-24 v2 amendment, architecture §3/§4.4/§4.5, implementation §5/§7/§9.1/§9.9
- [x] Real-DB smoke (`npm run smoke:breeding`, Atlas dev + cleanup): seed 6 rows, schema guard, summary delta, district/township/drilldown fast+direct+L3, village counts, Excel 3 cols, rebuild backfill, delta −1 — 20/20 PASS. Fixed 2 real-DB bugs found: `getDistrictReport` legacy summary `+=undefined` → NaN (now `|| 0`), `getVillageBreakdown` missing-path `ageLimit` undefined → `?? null`; both locked by regression tests
- ✅ Acceptance (verified 2026-10-05): 355 tests green, coverage 97.52% lines / 88.75% branches, lint clean, Atlas smoke 21/21
- [x] Query probe (`npm run probe:queries`, Atlas explain executionStats): all read paths **IXSCAN** — list `deletedAt_1_createdAt_-1` (G1 index, sort served by index → no in-memory SORT), `hasBreeding_1`, district sums `tspCode+wvCode[U]`, township report `tspCode+status`, L1 direct `districtCode`, L3/village `wvCode+status`, export `tspCode+status`, categories `categoryId[U]`. Perf notes (non-blocking, small collections): `getVillageAnimalCountFast` summary `{wvCode}` = COLLSCAN (summaries ≈ village count, 1-doc scans)
- [x] **G1 scale fix (audit 2026-10-05)**: `{deletedAt:1, createdAt:-1}` compound index → district list default `sort(-createdAt)` = index-ordered scan (docsExamined = skip+limit ပဲ, millions ဖြစ်လည်း constant); probe verify: `LIMIT ← FETCH ← IXSCAN(deletedAt_1_createdAt_-1)` — in-memory SORT ပျောက် ✓
- [x] **Full verification sweep (2026-10-05)**: lint ✓; unit 168 + integration 187 = **355 tests** (coverage 97.52% lines / 88.75% branches); **E2E journey** `npm run test:e2e` (live server + Atlas + Redis): health, 401/403/422/CORS/helmet, 3-role login, survey lifecycle create→submit→verify→report→drilldown L1/L3 (breeding 3, byAge null)→list filters→Excel export→sync push/replay/pull→approve→delete+cleanup = **33/33 PASS**; security-reviewer agent: 0 CRITICAL / 1 HIGH (district scope consistency, single-district by design) / 8 MEDIUM / 12 LOW — confirmed controls: bcrypt12, JWT rotation+reuse-detect, RBAC+scope, Zod everywhere, rate limit+lockout, CORS allowlist, helmet, no secrets in src ✓

## 16. Definition of Done

- [x] Route map §7 အားလုံး implemented + tested
- [ ] Decisions.md ⏳ items အားလုံး ✅ + architecture doc ထဲ ပြင်ပြီး (D-49 cleanup အပါ)
- [x] Test coverage ≥80%, lint clean (97.6% lines, 2026-10-05)
- [x] Security checklist §11 all tick (Phase 5)
- [x] Seed + rebuild scripts idempotent (Phase 1 same-DB rerun ✓ + Phase 6 container runs ✓)
- [ ] Prod deploy + health monitor + backup verified — dockerized stack + mongodump ✓; real prod server (nginx/TLS/Atlas M10) = user deploy-time step
