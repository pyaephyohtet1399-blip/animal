import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:drift_flutter/drift_flutter.dart';
import 'package:rxdart/rxdart.dart';

import 'package:animalcensus/core/models/household.dart';

part 'app_database.g.dart';

class Household extends Table {
  TextColumn get localRowId => text()();
  IntColumn get serverSurveyId => integer().nullable()();
  IntColumn get serverSyncVersion => integer().nullable()();
  TextColumn get wvCode => text().withDefault(const Constant(''))();
  TextColumn get houseNo => text().nullable()();
  TextColumn get headName => text()();
  TextColumn get gender => text()();
  TextColumn get education => text()();
  TextColumn get phone => text()();
  IntColumn get age => integer()();
  DateTimeColumn get answerDate => dateTime()();
  BoolColumn get deleted => boolean().withDefault(const Constant(false))();
  BoolColumn get dirty => boolean().withDefault(const Constant(false))();
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get updatedAt => dateTime()();

  @override
  Set<Column> get primaryKey => {localRowId};
}

class AnimalAnswer extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get localRowId =>
      text().references(Household, #localRowId, onDelete: KeyAction.cascade)();
  TextColumn get groupCode => text()();
  IntColumn get categoryId => integer()();
  TextColumn get ageLimit => text()();
  TextColumn get sex => text()();
  IntColumn get count => integer()();
  IntColumn get sortOrder => integer().withDefault(const Constant(0))();
}

class UploadLedger extends Table {
  TextColumn get contentHash => text()();
  TextColumn get status => text()();
  IntColumn get attempts => integer().withDefault(const Constant(0))();
  IntColumn get bytes => integer().withDefault(const Constant(0))();
  IntColumn get rowCount => integer().withDefault(const Constant(0))();
  TextColumn get responseJson => text().nullable()();
  TextColumn get errorJson => text().nullable()();
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get updatedAt => dateTime()();

  @override
  Set<Column> get primaryKey => {contentHash};
}

class ReferenceCache extends Table {
  TextColumn get cacheKey => text()();
  TextColumn get payload => text()();
  DateTimeColumn get fetchedAt => dateTime()();

  @override
  Set<Column> get primaryKey => {cacheKey};
}

@DriftDatabase(tables: [Household, AnimalAnswer, UploadLedger, ReferenceCache])
class AppDatabase extends _$AppDatabase {
  AppDatabase(super.executor);

  AppDatabase.file() : super(driftDatabase(name: 'animalcensus'));

  AppDatabase.memory() : super(NativeDatabase.memory());

  @override
  int get schemaVersion => 2;

  @override
  MigrationStrategy get migration => MigrationStrategy(
        onCreate: (m) async {
          await m.createAll();
        },
        onUpgrade: (m, from, to) async {
          if (from < 2) {
            await m.addColumn(household, household.wvCode);
          }
        },
        beforeOpen: (details) async {
          await customStatement('PRAGMA foreign_keys = ON');
        },
      );

  // ---------------------------------------------------------------- reads

  Stream<List<HouseholdData>> watchHouseholds() =>
      (select(household)..where((t) => t.deleted.equals(false))..orderBy([(t) => OrderingTerm.desc(t.updatedAt)]))
          .watch();

  Stream<List<AnimalAnswerData>> watchAnimals() => select(animalAnswer).watch();

  /// Household rows that take part in the next upload.
  Future<List<HouseholdData>> rowsForUpload() => (select(household)
        ..where((t) => t.deleted.equals(false) | t.serverSurveyId.isNotNull()))
      .get();

  Expression<bool> _pendingUploadPredicate() =>
      household.deleted.equals(false) & household.serverSurveyId.isNull() |
      household.deleted.equals(false) &
          household.dirty.equals(true) &
          household.serverSurveyId.isNotNull() |
      household.deleted.equals(true) & household.serverSurveyId.isNotNull();

  Future<int> pendingUploadCount({String? wvCode}) async {
    final query = selectOnly(household)..addColumns([household.localRowId.count()]);
    var where = _pendingUploadPredicate();
    if (wvCode != null && wvCode.isNotEmpty) {
      where = where &
          (household.wvCode.equals(wvCode) | household.wvCode.equals(''));
    }
    query.where(where);
    final row = await query.getSingle();
    return row.read(household.localRowId.count()) ?? 0;
  }

  Future<Map<String, int>> pendingByVillage() async {
    final query = selectOnly(household)
      ..addColumns([household.wvCode, household.localRowId.count()]);
    query.where(_pendingUploadPredicate());
    query.groupBy([household.wvCode]);
    final rows = await query.get();
    return {
      for (final row in rows)
        row.read(household.wvCode) ?? '': row.read(household.localRowId.count()) ?? 0,
    };
  }

  Future<void> backfillVillage(String wvCode) async {
    if (wvCode.isEmpty) return;
    await (update(household)..where((t) => t.wvCode.equals('')))
        .write(HouseholdCompanion(wvCode: Value(wvCode)));
  }

  Future<int> activeCount() async {
    final query = selectOnly(household)
      ..addColumns([household.localRowId.count()]);
    query.where(household.deleted.equals(false));
    final row = await query.getSingle();
    return row.read(household.localRowId.count()) ?? 0;
  }

  Future<HouseholdData?> householdRow(String localRowId) =>
      (select(household)..where((t) => t.localRowId.equals(localRowId))).getSingleOrNull();

  Future<List<AnimalAnswerData>> animalsFor(String localRowId) =>
      (select(animalAnswer)..where((t) => t.localRowId.equals(localRowId))).get();

  // --------------------------------------------------------------- writes

  Future<void> saveRecord(HouseholdRecord record) => transaction(() async {
        final now = DateTime.now();
        final existing = await householdRow(record.localRowId);
        if (existing == null) {
          await into(household).insert(
            HouseholdCompanion(
              localRowId: Value(record.localRowId),
              serverSurveyId: Value(record.serverSurveyId),
              serverSyncVersion: Value(record.serverSyncVersion),
              wvCode: Value(record.wvCode),
              houseNo: Value(record.houseNo),
              headName: Value(record.headName),
              gender: Value(record.gender),
              education: Value(record.education),
              phone: Value(record.phone),
              age: Value(record.age),
              answerDate: Value(record.answerDate),
              dirty: const Value(true),
              createdAt: Value(now),
              updatedAt: Value(now),
            ),
          );
        } else {
          await (update(household)..where((t) => t.localRowId.equals(record.localRowId)))
              .write(HouseholdCompanion(
            houseNo: Value(record.houseNo),
            headName: Value(record.headName),
            gender: Value(record.gender),
            education: Value(record.education),
            phone: Value(record.phone),
            age: Value(record.age),
            answerDate: Value(record.answerDate),
            dirty: const Value(true),
            updatedAt: Value(now),
          ));
        }
        await (delete(animalAnswer)..where((t) => t.localRowId.equals(record.localRowId)))
            .go();
        await batch((batch) {
          var order = 0;
          batch.insertAll(animalAnswer, [
            for (final entry in record.animals)
              AnimalAnswerCompanion.insert(
                localRowId: record.localRowId,
                groupCode: entry.group,
                categoryId: entry.categoryId,
                ageLimit: entry.ageLimit,
                sex: entry.sex,
                count: entry.count,
                sortOrder: Value(order++),
              ),
          ]);
        });
      });

  /// Excel/backup restore: writes every field of [record] exactly as given
  /// (unlike [saveRecord], dirty/deleted/server state are honoured so a
  /// backup of uploaded rows stays clean on the new device). Same
  /// `localRowId` → replaced in place, so re-importing is idempotent.
  Future<void> restoreRecords(List<HouseholdRecord> records) =>
      transaction(() async {
        final now = DateTime.now();
        for (final record in records) {
          final existing = await householdRow(record.localRowId);
          if (existing == null) {
            await into(household).insert(
              HouseholdCompanion(
                localRowId: Value(record.localRowId),
                serverSurveyId: Value(record.serverSurveyId),
                serverSyncVersion: Value(record.serverSyncVersion),
                wvCode: Value(record.wvCode),
                houseNo: Value(record.houseNo),
                headName: Value(record.headName),
                gender: Value(record.gender),
                education: Value(record.education),
                phone: Value(record.phone),
                age: Value(record.age),
                answerDate: Value(record.answerDate),
                deleted: Value(record.deleted),
                dirty: Value(record.dirty),
                createdAt: Value(now),
                updatedAt: Value(now),
              ),
            );
          } else {
            await (update(household)
                  ..where((t) => t.localRowId.equals(record.localRowId)))
                .write(HouseholdCompanion(
              serverSurveyId: Value(record.serverSurveyId),
              serverSyncVersion: Value(record.serverSyncVersion),
              wvCode: Value(record.wvCode),
              houseNo: Value(record.houseNo),
              headName: Value(record.headName),
              gender: Value(record.gender),
              education: Value(record.education),
              phone: Value(record.phone),
              age: Value(record.age),
              answerDate: Value(record.answerDate),
              deleted: Value(record.deleted),
              dirty: Value(record.dirty),
              updatedAt: Value(now),
            ));
          }
          await (delete(animalAnswer)
                ..where((t) => t.localRowId.equals(record.localRowId)))
              .go();
          await batch((batch) {
            var order = 0;
            batch.insertAll(animalAnswer, [
              for (final entry in record.animals)
                AnimalAnswerCompanion.insert(
                  localRowId: record.localRowId,
                  groupCode: entry.group,
                  categoryId: entry.categoryId,
                  ageLimit: entry.ageLimit,
                  sex: entry.sex,
                  count: entry.count,
                  sortOrder: Value(order++),
                ),
            ]);
          });
        }
      });

  /// Local delete. Rows that never reached the server disappear immediately,
  /// uploaded rows become a pending `delete` action for the next upload.
  Future<void> deleteRecord(String localRowId) => transaction(() async {
        final existing = await householdRow(localRowId);
        if (existing == null) return;
        if (existing.serverSurveyId == null) {
          await (delete(household)..where((t) => t.localRowId.equals(localRowId))).go();
          return;
        }
        await (update(household)..where((t) => t.localRowId.equals(localRowId))).write(
          const HouseholdCompanion(deleted: Value(true), dirty: Value(true)),
        );
      });

  Future<void> markDeletedOnServer(String localRowId) =>
      (delete(household)..where((t) => t.localRowId.equals(localRowId))).go();

  Future<void> applyUploadResult({
    required String localRowId,
    required String action,
    int? surveyId,
    int? syncVersion,
  }) async {
    if (action == 'delete') {
      await markDeletedOnServer(localRowId);
      return;
    }
    await (update(household)..where((t) => t.localRowId.equals(localRowId))).write(
      HouseholdCompanion(
        serverSurveyId: Value(surveyId),
        serverSyncVersion: Value(syncVersion),
        dirty: const Value(false),
        deleted: const Value(false),
        updatedAt: Value(DateTime.now()),
      ),
    );
  }

  // -------------------------------------------------------------- ledger

  Future<UploadLedgerData?> ledgerEntry(String contentHash) =>
      (select(uploadLedger)..where((t) => t.contentHash.equals(contentHash)))
          .getSingleOrNull();

  Future<void> recordLedgerStart({
    required String contentHash,
    required int bytes,
    required int rowCount,
  }) =>
      into(uploadLedger).insertOnConflictUpdate(
        UploadLedgerCompanion(
          contentHash: Value(contentHash),
          status: const Value('sending'),
          attempts: const Value(1),
          bytes: Value(bytes),
          rowCount: Value(rowCount),
          createdAt: Value(DateTime.now()),
          updatedAt: Value(DateTime.now()),
        ),
      );

  Future<void> recordLedgerFailure({
    required String contentHash,
    required String errorJson,
    required int bytes,
    required int rowCount,
  }) async {
    final existing = await ledgerEntry(contentHash);
    await into(uploadLedger).insertOnConflictUpdate(
      UploadLedgerCompanion(
        contentHash: Value(contentHash),
        status: const Value('failed'),
        attempts: Value((existing?.attempts ?? 0) + 1),
        bytes: Value(bytes),
        rowCount: Value(rowCount),
        errorJson: Value(errorJson),
        createdAt: Value(existing?.createdAt ?? DateTime.now()),
        updatedAt: Value(DateTime.now()),
      ),
    );
  }

  Future<void> recordLedgerSuccess({
    required String contentHash,
    required String responseJson,
    required int bytes,
    required int rowCount,
  }) async {
    final existing = await ledgerEntry(contentHash);
    await into(uploadLedger).insertOnConflictUpdate(
      UploadLedgerCompanion(
        contentHash: Value(contentHash),
        status: const Value('sent'),
        attempts: Value((existing?.attempts ?? 0) + 1),
        bytes: Value(bytes),
        rowCount: Value(rowCount),
        responseJson: Value(responseJson),
        errorJson: const Value(null),
        createdAt: Value(existing?.createdAt ?? DateTime.now()),
        updatedAt: Value(DateTime.now()),
      ),
    );
  }

  Future<List<UploadLedgerData>> recentLedger({int limit = 20}) =>
      (select(uploadLedger)..orderBy([(t) => OrderingTerm.desc(t.updatedAt)])
        ..limit(limit))
          .get();

  // ----------------------------------------------------------- references

  Future<ReferenceCacheData?> reference(String key) =>
      (select(referenceCache)..where((t) => t.cacheKey.equals(key))).getSingleOrNull();

  Future<void> writeReference(String key, String payload) =>
      into(referenceCache).insertOnConflictUpdate(
        ReferenceCacheCompanion(
          cacheKey: Value(key),
          payload: Value(payload),
          fetchedAt: Value(DateTime.now()),
        ),
      );

  Future<void> clearAll() => transaction(() async {
        await delete(animalAnswer).go();
        await delete(household).go();
        await delete(uploadLedger).go();
        await delete(referenceCache).go();
      });

  // ------------------------------------------------------------ assembly

  List<HouseholdRecord> assemble(
    List<HouseholdData> rows,
    List<AnimalAnswerData> animalRows,
  ) {
    final byHousehold = <String, List<AnimalEntry>>{};
    for (final row in animalRows) {
      byHousehold.putIfAbsent(row.localRowId, () => []).add(
            AnimalEntry(
              group: row.groupCode,
              categoryId: row.categoryId,
              ageLimit: row.ageLimit,
              sex: row.sex,
              count: row.count,
            ),
          );
    }
    return rows
        .map(
          (row) => HouseholdRecord(
            localRowId: row.localRowId,
            serverSurveyId: row.serverSurveyId,
            serverSyncVersion: row.serverSyncVersion,
            wvCode: row.wvCode,
            houseNo: row.houseNo,
            headName: row.headName,
            gender: row.gender,
            education: row.education,
            phone: row.phone,
            age: row.age,
            answerDate: row.answerDate,
            deleted: row.deleted,
            dirty: row.dirty,
            animals: byHousehold[row.localRowId] ?? const [],
            updatedAt: row.updatedAt,
          ),
        )
        .toList();
  }

  Stream<List<HouseholdRecord>> watchRecordsWithAnimals() => Rx.combineLatest2(
        watchHouseholds(),
        watchAnimals(),
        (List<HouseholdData> rows, List<AnimalAnswerData> animals) =>
            assemble(rows, animals),
      );

  Future<List<HouseholdRecord>> recordsForUpload() async {
    final rows = await rowsForUpload();
    if (rows.isEmpty) return const [];
    final ids = rows.map((row) => row.localRowId).toList();
    final animals =
        await (select(animalAnswer)..where((t) => t.localRowId.isIn(ids))).get();
    return assemble(rows, animals);
  }

  /// Every row on this device, including locally deleted ones (backup export).
  Future<List<HouseholdRecord>> allRecords() async {
    final rows = await select(household).get();
    final animals = await select(animalAnswer).get();
    return assemble(rows, animals);
  }

  Future<HouseholdRecord?> recordWithAnimals(String localRowId) async {
    final row = await householdRow(localRowId);
    if (row == null) return null;
    final animals = await animalsFor(localRowId);
    return assemble([row], animals).first;
  }
}
