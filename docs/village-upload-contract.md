# Village Upload Contract (App → Server)

Basis: D-59. Single HTTP request per village upload; replaces the 50-row
`/sync/push` batching for census collection. Implemented by
`backend/src/services/uploadService.js` and consumed by
`mobile/lib/core/sync/upload_engine.dart`.

## Endpoint

```
POST /api/v1/upload/village
Authorization: Bearer <access token>   (role: village)
Content-Type: application/json
X-Content-Hash: <sha256 hex of the raw JSON bytes>
Content-Encoding: gzip | deflate | (identity/omitted)
```

- Body = the envelope JSON below, optionally compressed. The server inflates
  before validation (`middleware/uploadBody.js`), raw body ≤ 50 MB.
- `X-Content-Hash` **must** equal `sha256(raw JSON bytes)` (uncompressed).
  It is the idempotency key: `uploadreceipts` is unique on `{wvCode, contentHash}`.
- Village rate limit: 100 req/min. `request_in_progress` (409) while the Redis
  NX lock for that hash is held.

## Envelope

```jsonc
{
  "format": "animal-census/village-upload",
  "version": 1,
  "wvCode": "WV001",                 // ≤20 chars, must match the token's wvCode
  "generatedAt": "2026-03-01T10:30:00.000Z",
  "device": { "id": "...", "appVersion": "1.0.0", "platform": "android" },  // optional
  "interviewer": { "name": "ဦးမောင်မောင်", "phone": "0912345678" },  // optional (D-64)
  "counts": { "households": 12, "animals": 34 },   // declared; checked vs row sums
  "households": [ /* 1..1000 rows */ ]
}
```

`interviewer` = မေးမြန်သူ (the collector, from the app's Settings). `name` ≤70,
`phone` ≤20 (`[0-9+\-() ]`); either may be omitted. Stored on every affected
survey as `interviewerName`/`interviewerPhone` (trimmed; empty → not stored).

Row = discriminated union on `action`:

| action | extra fields |
|---|---|
| `create` | `interview`, `survey` |
| `update` | `surveyId`, `syncVersion`, `interview`, `survey` |
| `delete` | `surveyId`, `syncVersion` |

Common: `localRowId` (string ≤64, client-generated, unique inside the envelope).

- `interview`: `hName` (1–70), `hNo` (optional, omitted/empty → unset, ≤20),
  `hEdu` (1–50), `hGender` (1–20), `hPhone` (5–20, `[0-9+\-() ]`),
  `hAge` (int 0–150), `ansDate` (`YYYY-MM-DD`).
- `survey`: `bigAnimals`, `smallAnimals`, `poultry` (each `{categoryId>0,
  ageLimit enum, sex enum, count 0–99999}`, max 100 entries) and
  `breedingAnimals` (`{categoryId, sex, count}` — **no ageLimit**).

## Processing (all-or-nothing)

1. zod validate envelope → row-level failures return
   `422 validation_error` with `error.details[] = {localRowId, field, message}`.
2. Declared `counts` vs. sums computed from rows → `422 count_mismatch`.
3. Ownership + `syncVersion` checks → stale rows return
   `409 version_conflict` with `{localRowId, surveyId, declaredVersion, serverVersion}`.
4. One Mongo transaction, batched for Atlas latency (D-64): create ids via
   2 × `INCRBY`, then `insertMany` interviews + surveys; update/delete rows =
   1 in-transaction re-read (version re-check → `409`) + `bulkWrite`;
   summary deltas accumulated in memory → one `bulkWrite` per village;
   receipt insert. Commit → disk archive `uploads/<contentHash>.json[.gz]`.
   Cost ≈ a fixed handful of round trips regardless of row count.

Anything failing = nothing written. Re-sending the same bytes returns the
stored result with `meta.replayed: true` (HTTP 200).

## Success response

```jsonc
{
  "data": {
    "contentHash": "<sha256>",
    "accepted": 12, "created": 10, "updated": 1, "deleted": 1,
    "counts": { "households": 12, "animals": 34 },
    "serverTime": "…",
    "rows": [
      { "localRowId": "c…", "action": "create", "surveyId": 1001, "syncVersion": 1 },
      { "localRowId": "c…", "action": "update", "surveyId": 1002, "syncVersion": 4 }
    ]
  },
  "meta": { "replayed": false }
}
```

The client **must** persist `surveyId`/`syncVersion` per `localRowId` — every
later edit/delete sends them back.

## Status probe (crash resume)

```
GET /api/v1/upload/village/:contentHash
→ 200 {data:{contentHash, status, accepted, counts, serverTime}} | 404
```

## Client behaviour (`UploadEngine`)

1. `recordsForUpload()` → rows where `actionFor(row) != skip`
   (create = no `serverSurveyId`; update = dirty + server id; delete = soft-deleted + server id).
2. Local validation (`ValidationRules`, mirrors the server) → `blocked` outcome
   with issues shown in the UI (tap → open the household).
3. Build deterministic JSON, `sha256` → ledger fast-path replay if this hash was
   already `sent`.
4. Send gzip + hash; retry ≤3 with backoff on network/5xx/`request_in_progress`.
   4xx (except those) = final failure; local rows stay untouched → safe to retry.
   After any retriable failure the engine polls `GET /upload/village/:hash`
   (≤100 s, every 4 s) for the server's receipt — if it appears, the next POST
   replays instantly and succeeds, so a timeout or lost response no longer shows
   "တင်ပို့မှုမအောင်မြင်ပါ" while the data actually landed (D-64). One final
   reconcile after the last attempt covers a commit that happened as the
   connection dropped; failure is reported only when the receipt is truly absent.
5. Apply `rows[]` in a SQLite transaction, mark ledger `sent`, clear `dirty`.

### Known limitation (documented gap)

Server-side (web) edits are **not** pulled into the app. If the server holds a
newer `syncVersion`, the upload fails with `409 version_conflict` and the app
shows the conflict rows. Resolution today = fix on the web side or re-enter the
household locally; a survey-pull endpoint is planned.
