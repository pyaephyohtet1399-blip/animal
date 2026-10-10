# Animal Census — Flutter App (Android)

Offline-first village census collector. One phone can serve several villages:
every household is tagged with the signed-in village (`household.wvCode`,
schema v2), and lists/stats/breakdowns stay scoped to that village. The manual
upload button sends **only the current village's rows** in one idempotent
request (contract: `docs/village-upload-contract.md`, decisions D-59/D-61) —
other villages' queued rows wait on the upload screen until you logout and
login with their village account. Households are created on the phone (no
master list) and edited freely.

## Run

```bash
flutter pub get
dart run build_runner build --delete-conflicting-outputs   # drift codegen (already committed)

# emulator → host backend (port 3100)
flutter run

# real device on LAN
flutter run --dart-define=API_BASE_URL=http://192.168.1.10:3100/api/v1

flutter build apk --debug     # build/app/outputs/flutter-apk/app-debug.apk
```

Backend must be running (`cd backend && npm run dev`, port **3100**) and a
`village` role user seeded (login code e.g. `MMR1234`).

## Checks

```bash
flutter analyze    # 0 issues
flutter test       # payload determinism, validation mirror, drift schema/ledger,
                   # village scoping/backfill, upload screen breakdown
```

## Layout

```
lib/
  main.dart, app.dart            # ProviderScope, theme, routes, session-expiry listener
  app_providers.dart             # Riverpod wiring (db, api, references, stats, categories)
  core/
    config/app_config.dart       # baseUrl (--dart-define), upload format constants
    db/app_database.dart         # drift: household / animal_answer / upload_ledger / reference_cache
    models/household.dart        # HouseholdRecord → interviewJson/surveyJson
    network/api_client.dart      # Dio + single-flight token refresh + gzip raw upload
    reference/…                  # categories ×4 + village/tract/township, 6h cache, offline fallback
    backup/village_excel.dart    # offline .xlsx export/import (households + animals sheets)
    session/…                    # secure-storage tokens, JWT profile, expiry events
    sync/
      validation_rules.dart      # local mirror of server zod rules
      upload_payload.dart        # envelope builder + sha256 content hash
      upload_engine.dart         # validate → send(retry) → apply rows → ledger
  features/
    auth/    login + AuthController (Notifier)
    home/    stats (households / animals / pending), per-category breakdown, last upload, quick actions
    households/ list (search) + form (MC1–MC4 sections, live validation, delete)
    upload/  UploadController + progress/outcome screen (blocked rows tappable)
    settings/ village/tract/township card, interviewer name+phone (local), reference refresh,
             JSON + Excel backup export, Excel import, password change, logout
```

## Offline behaviour

- Everything works offline: create/edit/delete households, validation, review.
  Rows are local (`dirty`) until uploaded; locally deleting an uploaded row
  becomes a pending `delete` action.
- Reference data (animal categories, village/tract/township names) comes from a
  6h SQLite cache; first-ever run needs connectivity once to fill it.
- Upload requires connectivity; failures never lose data (ledger records the
  attempt, retry is a button press). Same bytes = same hash = server replay,
  so retries after a crash are safe.
- After upload, households stay editable; the server is the source of truth for
  concurrent web edits (`syncVersion` optimistic lock, 409 on conflict).
- Multi-village: rows are tagged at collection time with the signed-in `wvCode`
  (legacy untagged rows are backfilled on restore/login). Logout keeps all local
  data; the upload screen lists pending rows of other villages with their names
  (`villagenames` reference cache) so nothing is forgotten after a switch.
- Excel backup/restore: Settings → "Excel ထုတ်ရန်" writes the signed-in
  village's rows to a `.xlsx` (sheets `households` + `animals`, addressed by
  header names) and opens the share sheet; "Excel Import လုပ်ရန်" picks a file,
  validates it fully (structure + upload rules) and restores it in one
  transaction — same `localRowId` is replaced, so re-importing is idempotent,
  and server ids/dirty state survive (uploaded rows stay clean on a new phone).
  Files without a `wvCode` fall back to the signed-in village; a mismatched
  village is confirmed but queued under the file's village.

## Notes

- `hNo` (house number) is optional; `localRowId` is client-generated (`c` + base36).
- No draft/approval states — uploads land as `submitted` (D-60: village can still
  edit/delete its own rows afterwards).
- Known gap: no server-edit pull; conflicts surface at upload time only.
