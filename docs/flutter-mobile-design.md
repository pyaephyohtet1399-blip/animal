# Flutter Mobile App — Design Document

**Target users:** 840 village headmen (ကျေးရွာအတွင်း)
**Platform:** Flutter (Android/iOS)
**Backend:** Livestock Survey API (`/api/v1`)
**Key requirement:** Offline-first (SQLite + sync)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│  Flutter App                                        │
│                                                     │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │ UI Layer    │  │ State Mgmt   │  │ Sync Engine│ │
│  │ (Widgets)   │  │ (Riverpod)   │  │ (Queue)    │ │
│  └──────┬──────┘  └──────┬───────┘  └─────┬──────┘ │
│         │                │                │        │
│  ┌──────┴────────────────┴────────────────┴──────┐ │
│  │              Repository Layer                  │ │
│  │  (API client + Local DB)                      │ │
│  └──────┬────────────────────────┬───────────────┘ │
│         │                        │                 │
│  ┌──────┴──────┐          ┌──────┴───────┐         │
│  │ SQLite DB   │          │ API Client   │         │
│  │ (local)     │          │ (Dio/HTTP)   │         │
│  └─────────────┘          └──────────────┘         │
└─────────────────────────────────────────────────────┘
```

---

## 2. SQLite Schema

```sql
-- Surveys (local copy)
CREATE TABLE surveys (
  local_id TEXT PRIMARY KEY,        -- UUID v4 (client-generated)
  survey_id INTEGER,                -- server ID (null until synced)
  h_name TEXT NOT NULL,
  h_edu TEXT,
  h_gender TEXT,
  h_phone TEXT,
  h_age INTEGER,
  ans_date TEXT,                    -- ISO date
  big_animals TEXT,                 -- JSON array
  small_animals TEXT,               -- JSON array
  poultry TEXT,                     -- JSON array
  breeding_animals TEXT,            -- JSON array
  has_breeding INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft',      -- draft | submitted
  sync_status TEXT DEFAULT 'pending', -- pending | synced | failed
  sync_version INTEGER DEFAULT 0,
  created_at INTEGER,
  updated_at INTEGER
);

-- Sync queue (pending operations)
CREATE TABLE sync_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  local_id TEXT NOT NULL,
  op TEXT NOT NULL,                 -- create | update | submit | delete
  survey_id INTEGER,                -- server ID (for update/submit/delete)
  payload TEXT,                     -- JSON (for create/update)
  idempotency_key TEXT NOT NULL,    -- UUID v4
  status TEXT DEFAULT 'pending',    -- pending | synced | failed
  error_message TEXT,
  created_at INTEGER
);

-- Reference data (cached from server)
CREATE TABLE categories (
  type TEXT NOT NULL,               -- big | small | poultry | breeding
  category_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  PRIMARY KEY (type, category_id)
);

CREATE TABLE townships (
  tsp_code TEXT PRIMARY KEY,
  tsp_name TEXT,
  district_code TEXT
);

CREATE TABLE townvgs (
  tvg_code TEXT PRIMARY KEY,
  tvg_name TEXT,
  tsp_code TEXT
);

CREATE TABLE wardvillages (
  wv_code TEXT PRIMARY KEY,
  wv_name TEXT,
  tvg_code TEXT
);

-- Auth
CREATE TABLE auth_tokens (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
```

---

## 3. Sync Engine Design

### 3.1 Sync Flow

```
[Offline]                    [Online]
    │                           │
    ▼                           ▼
┌─────────┐              ┌──────────────┐
│ SQLite  │              │ Sync Engine  │
│ (local) │              │ (queue proc)  │
└────┬────┘              └──────┬───────┘
     │                          │
     │  ┌───────────────────────┘
     │  │
     ▼  ▼
┌─────────────────┐
│ POST /sync/push │
│ (batch + idem)  │
└─────────────────┘
```

### 3.2 Sync Triggers

| Event | Action |
|---|---|
| App start (online) | Process sync queue |
| Network restored | Process sync queue |
| User creates survey | Save to SQLite + queue `create` |
| User edits survey | Save to SQLite + queue `update` |
| User submits survey | Save to SQLite + queue `submit` |
| User deletes survey | Save to SQLite + queue `delete` |
| Pull reference data | `GET /sync/pull?types=categories,locations` |

### 3.3 Sync Queue Processing

```dart
// Pseudocode
Future<void> processSyncQueue() async {
  if (!await isOnline()) return;
  
  final pending = await db.getPendingQueueItems();
  if (pending.isEmpty) return;
  
  final items = pending.map((item) => {
    'localRowId': item.localId,
    'op': item.op,
    'surveyId': item.surveyId,
    'syncVersion': item.syncVersion,
    'payload': item.payload,
  }).toList();
  
  final response = await api.post('/sync/push', body: {
    'items': items,
  }, headers: {
    'Idempotency-Key': generateUuid(),
  });
  
  for (final result in response.data.results) {
    if (result.status == 'created' || result.status == 'updated') {
      await db.updateSurveyId(result.localRowId, result.surveyId);
      await db.markQueueSynced(result.localRowId);
    } else if (result.status == 'submitted') {
      await db.markSurveySubmitted(result.surveyId);
      await db.markQueueSynced(result.localRowId);
    } else if (result.status == 'deleted') {
      await db.deleteLocalSurvey(result.surveyId);
      await db.markQueueSynced(result.localRowId);
    } else {
      await db.markQueueFailed(result.localRowId, result.error.message);
    }
  }
}
```

### 3.4 Conflict Resolution

- **Optimistic locking:** `syncVersion` field
- If server returns `version_conflict`:
  - Fetch server data via `GET /sync/pull`
  - Show diff to user
  - User chooses: keep local / use server / merge

---

## 4. API Routes (Flutter — Village)

### 4.1 Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | Login → tokens |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/logout` | Revoke refresh token |

### 4.2 Reference Data (cached in SQLite)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/categories/big` | Big animal categories |
| GET | `/api/v1/categories/small` | Small animal categories |
| GET | `/api/v1/categories/poultry` | Poultry categories |
| GET | `/api/v1/categories/breeding` | Breeding categories |
| GET | `/api/v1/locations/townships` | Townships (own tsp) |
| GET | `/api/v1/locations/townvgs` | Townvgs (own tvg) |
| GET | `/api/v1/locations/wardvillages` | Wardvillages (own wv) |

### 4.3 Surveys

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/surveys` | List own surveys |
| GET | `/api/v1/surveys/:surveyId` | Survey detail |
| POST | `/api/v1/surveys` | Create (draft) |
| PUT | `/api/v1/surveys/:surveyId` | Edit (own draft only) |
| DELETE | `/api/v1/surveys/:surveyId` | Delete (own draft only) |
| POST | `/api/v1/surveys/:surveyId/submit` | Submit (final) |

### 4.4 Sync

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/sync/push` | Batch push (create/update/submit/delete) |
| GET | `/api/v1/sync/pull` | Pull reference data + own surveys |

---

## 5. Screens

| Screen | Description |
|--------|-------------|
| Login | loginCode + password |
| Survey List | Own surveys (draft/submitted) |
| Survey Detail | View survey data |
| Survey Form | Create/edit survey (draft) |
| Submit | Submit survey (final) |
| Sync Status | Pending sync items |

---

## 6. Offline Flow

### 6.1 Create Survey (Offline)

```
1. User fills form
2. Save to SQLite (local_id = UUID, sync_status = 'pending')
3. Add to sync_queue (op = 'create')
4. Show "Saved offline" message
5. When online → sync engine processes queue
```

### 6.2 Submit Survey (Offline)

```
1. User taps "Submit"
2. Update SQLite (status = 'submitted', sync_status = 'pending')
3. Add to sync_queue (op = 'submit')
4. Show "Submit pending sync" message
5. When online → sync engine processes queue
```

### 6.3 Pull Reference Data (Online)

```
1. App starts (online)
2. GET /sync/pull?types=categories,locations
3. Store in SQLite (categories, townships, townvgs, wardvillages tables)
4. Use cached data for offline form
```

---

## 7. State Management (Riverpod)

```dart
// Providers
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref);
});

final surveyListProvider = StateNotifierProvider<SurveyListNotifier, List<Survey>>((ref) {
  return SurveyListNotifier(ref);
});

final syncQueueProvider = StateNotifierProvider<SyncQueueNotifier, List<SyncItem>>((ref) {
  return SyncQueueNotifier(ref);
});

final networkProvider = StreamProvider<bool>((ref) {
  return NetworkMonitor().onStatusChange;
});
```

---

## 8. Error Handling

| Error | Client Action |
|-------|---------------|
| 401 Unauthorized | Redirect to login |
| 403 Forbidden | Show "No permission" |
| 404 Not Found | Show "Survey not found" |
| 409 Invalid state | Show "Survey is locked" |
| 409 Version conflict | Show diff, ask user |
| 422 Validation | Show validation errors |
| 429 Rate limit | Retry with backoff |
| 500 Server error | Show "Server error, retry later" |
| Network offline | Queue for sync |
