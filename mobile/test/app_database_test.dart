import 'package:flutter_test/flutter_test.dart';

import 'package:animalcensus/core/db/app_database.dart';
import 'package:animalcensus/core/models/household.dart';
import 'package:animalcensus/core/sync/upload_payload.dart';

HouseholdRecord record(
  String id, {
  bool withServer = false,
  bool dirty = false,
  String wvCode = '',
}) =>
    HouseholdRecord(
      localRowId: id,
      serverSurveyId: withServer ? 11 : null,
      serverSyncVersion: withServer ? 2 : null,
      wvCode: wvCode,
      headName: 'အိမ်ထောင်ရှင် $id',
      gender: 'အမ',
      education: 'မူလတန်း',
      phone: '0912345678',
      age: 30,
      answerDate: DateTime(2026, 1, 15),
      dirty: dirty,
      animals: const [
        AnimalEntry(
          group: 'poultry',
          categoryId: 201,
          ageLimit: 'Young',
          sex: 'female',
          count: 5,
        ),
      ],
    );

void main() {
  late AppDatabase db;

  setUp(() => db = AppDatabase.memory());
  tearDown(() => db.close());

  test('save + read round trip keeps animals', () async {
    await db.saveRecord(record('a'));
    final loaded = await db.recordWithAnimals('a');
    expect(loaded, isNotNull);
    expect(loaded!.headName, 'အိမ်ထောင်ရှင် a');
    expect(loaded.animals, hasLength(1));
    expect(loaded.totalAnimals, 5);
    expect(loaded.dirty, isTrue);
  });

  test('saving again replaces animal rows', () async {
    await db.saveRecord(record('a'));
    await db.saveRecord(
      record('a').copyWith(animals: const [
        AnimalEntry(
          group: 'big',
          categoryId: 101,
          ageLimit: 'Over3',
          sex: 'male',
          count: 2,
        ),
      ]),
    );
    final loaded = await db.recordWithAnimals('a');
    expect(loaded!.animals, hasLength(1));
    expect(loaded.animals.single.group, 'big');
  });

  test('pendingUploadCount covers new, edited and deleted rows', () async {
    expect(await db.pendingUploadCount(), 0);

    await db.saveRecord(record('a'));
    await db.saveRecord(record('b'));
    expect(await db.pendingUploadCount(), 2);

    await db.applyUploadResult(
      localRowId: 'a',
      action: 'create',
      surveyId: 11,
      syncVersion: 1,
    );
    expect(await db.pendingUploadCount(), 1);

    // uploaded row is edited again
    final edited = record('a', withServer: true, dirty: true);
    await db.saveRecord(edited);
    expect(await db.pendingUploadCount(), 2);

    // pending delete of an uploaded row
    await db.deleteRecord('a');
    expect(await db.pendingUploadCount(), 2);
    final deleted = await db.recordWithAnimals('a');
    expect(deleted, isNotNull);
    expect(deleted!.deleted, isTrue);
    expect(deleted.syncLabel, 'ဖျက်ရန်');
  });

  test('deleting a never-uploaded row removes it immediately', () async {
    await db.saveRecord(record('a'));
    expect(await db.pendingUploadCount(), 1);
    await db.deleteRecord('a');
    expect(await db.pendingUploadCount(), 0);
    expect(await db.recordWithAnimals('a'), isNull);
  });

  test('applyUploadResult clears dirty and stores sync version', () async {
    await db.saveRecord(record('a'));
    await db.applyUploadResult(
      localRowId: 'a',
      action: 'create',
      surveyId: 42,
      syncVersion: 3,
    );
    final loaded = await db.recordWithAnimals('a');
    expect(loaded!.serverSurveyId, 42);
    expect(loaded.serverSyncVersion, 3);
    expect(loaded.dirty, isFalse);
    expect(loaded.isSynced, isTrue);
  });

  test('rowsForUpload keeps live rows, action filter drops clean ones', () async {
    await db.saveRecord(record('a'));
    await db.saveRecord(record('b'));
    await db.applyUploadResult(
      localRowId: 'b',
      action: 'create',
      surveyId: 12,
      syncVersion: 1,
    );
    final rows = await db.recordsForUpload();
    expect(rows, hasLength(2));
    expect(
      rows
          .where((row) => actionFor(row) != UploadAction.skip)
          .map((row) => row.localRowId),
      ['a'],
    );
  });

  test('allRecords includes locally deleted rows for backup', () async {
    await db.saveRecord(record('a', withServer: true));
    await db.deleteRecord('a');
    expect(await db.allRecords(), hasLength(1));
  });

  test('wvCode is stored on insert and survives edits', () async {
    await db.saveRecord(record('a', wvCode: 'WV001'));
    expect((await db.recordWithAnimals('a'))!.wvCode, 'WV001');

    await db.saveRecord(
      record('a', wvCode: 'WV002').copyWith(headName: 'ပြင်ဆင်ပြီး'),
    );
    final loaded = await db.recordWithAnimals('a');
    expect(loaded!.wvCode, 'WV001');
    expect(loaded.headName, 'ပြင်ဆင်ပြီး');
  });

  test('backfillVillage assigns only legacy untagged rows', () async {
    await db.saveRecord(record('legacy'));
    await db.saveRecord(record('a', wvCode: 'WV001'));
    await db.saveRecord(record('b', wvCode: 'WV002'));

    await db.backfillVillage('WV001');

    expect((await db.recordWithAnimals('legacy'))!.wvCode, 'WV001');
    expect((await db.recordWithAnimals('a'))!.wvCode, 'WV001');
    expect((await db.recordWithAnimals('b'))!.wvCode, 'WV002');
  });

  test('backfillVillage ignores an empty village code', () async {
    await db.saveRecord(record('legacy'));
    await db.backfillVillage('');
    expect((await db.recordWithAnimals('legacy'))!.wvCode, '');
  });

  test('pendingUploadCount can be scoped to one village', () async {
    await db.saveRecord(record('a1', wvCode: 'WV001'));
    await db.saveRecord(record('a2', wvCode: 'WV001'));
    await db.saveRecord(record('b1', wvCode: 'WV002'));

    expect(await db.pendingUploadCount(), 3);
    expect(await db.pendingUploadCount(wvCode: 'WV001'), 2);
    expect(await db.pendingUploadCount(wvCode: 'WV002'), 1);
    expect(await db.pendingUploadCount(wvCode: 'WV003'), 0);

    await db.saveRecord(record('legacy'));
    expect(await db.pendingUploadCount(wvCode: 'WV003'), 1);
  });

  test('pendingByVillage groups pending rows per village', () async {
    await db.saveRecord(record('a1', wvCode: 'WV001'));
    await db.saveRecord(record('a2', wvCode: 'WV001'));
    await db.saveRecord(record('b1', wvCode: 'WV002'));
    await db.saveRecord(record('legacy'));

    expect(await db.pendingByVillage(), {'WV001': 2, 'WV002': 1, '': 1});

    await db.applyUploadResult(
      localRowId: 'a1',
      action: 'create',
      surveyId: 1,
      syncVersion: 1,
    );
    expect(await db.pendingByVillage(), {'WV001': 1, 'WV002': 1, '': 1});
  });

  test('restoreRecords keeps dirty/deleted/server state from the backup',
      () async {
    final clean = record('clean', withServer: true, dirty: false, wvCode: 'WV001');
    final pending = record('pending', dirty: true, wvCode: 'WV001');
    await db.restoreRecords([clean, pending]);

    final loadedClean = await db.recordWithAnimals('clean');
    expect(loadedClean!.serverSurveyId, 11);
    expect(loadedClean.serverSyncVersion, 2);
    expect(loadedClean.dirty, isFalse);
    expect(loadedClean.isSynced, isTrue);
    expect(loadedClean.wvCode, 'WV001');

    final loadedPending = await db.recordWithAnimals('pending');
    expect(loadedPending!.serverSurveyId, isNull);
    expect(loadedPending.dirty, isTrue);

    // clean backup row must not show up as pending upload
    expect(await db.pendingUploadCount(wvCode: 'WV001'), 1);
  });

  test('restoreRecords replaces an existing row and its animals', () async {
    await db.saveRecord(record('a'));
    final before = await db.recordWithAnimals('a');
    expect(before!.headName, 'အိမ်ထောင်ရှင် a');
    expect(before.dirty, isTrue);

    await db.restoreRecords([
      record('a', withServer: true, dirty: false, wvCode: 'WV007').copyWith(
        headName: 'ပြန်လည်ရောက်ရှိသူ',
        animals: const [
          AnimalEntry(
            group: 'big',
            categoryId: 101,
            ageLimit: 'Over3',
            sex: 'male',
            count: 3,
          ),
        ],
      ),
    ]);

    final after = await db.recordWithAnimals('a');
    expect(after!.headName, 'ပြန်လည်ရောက်ရှိသူ');
    expect(after.wvCode, 'WV007');
    expect(after.dirty, isFalse);
    expect(after.serverSurveyId, 11);
    expect(after.animals, hasLength(1));
    expect(after.animals.single.group, 'big');
    expect(await db.activeCount(), 1);
  });

  test('restoreRecords is idempotent for the same file', () async {
    final records = [record('a', wvCode: 'WV001'), record('b', wvCode: 'WV001')];
    await db.restoreRecords(records);
    await db.restoreRecords(records);

    expect(await db.allRecords(), hasLength(2));
    expect((await db.recordWithAnimals('a'))!.animals, hasLength(1));
    expect((await db.recordWithAnimals('b'))!.animals, hasLength(1));
  });

  test('ledger tracks attempts across failure and success', () async {
    await db.recordLedgerStart(contentHash: 'h1', bytes: 10, rowCount: 1);
    expect((await db.ledgerEntry('h1'))!.status, 'sending');

    await db.recordLedgerFailure(
      contentHash: 'h1',
      errorJson: '{"code":"network_error"}',
      bytes: 10,
      rowCount: 1,
    );
    var entry = await db.ledgerEntry('h1');
    expect(entry!.status, 'failed');
    expect(entry.attempts, 2);

    await db.recordLedgerSuccess(
      contentHash: 'h1',
      responseJson: '{"data":{}}',
      bytes: 10,
      rowCount: 1,
    );
    entry = await db.ledgerEntry('h1');
    expect(entry!.status, 'sent');
    expect(entry.attempts, 3);
    expect(entry.errorJson, isNull);
  });
}
