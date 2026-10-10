import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:animalcensus/core/db/app_database.dart';
import 'package:animalcensus/core/models/household.dart';
import 'package:animalcensus/core/network/api_client.dart';
import 'package:animalcensus/core/reference/reference_repository.dart';
import 'package:animalcensus/core/session/session_events.dart';
import 'package:animalcensus/core/session/session_store.dart';
import 'package:animalcensus/core/sync/upload_engine.dart';
import 'package:animalcensus/features/auth/auth_controller.dart';
import 'package:animalcensus/features/home/category_totals.dart';
import 'package:animalcensus/features/home/village_stats.dart';

final sessionStoreProvider = Provider<SessionStore>((ref) => SessionStore());

final sessionEventsProvider = Provider<SessionEvents>((ref) {
  final events = SessionEvents();
  ref.onDispose(events.dispose);
  return events;
});

final appDatabaseProvider = Provider<AppDatabase>((ref) => AppDatabase.file());

final apiClientProvider = Provider<ApiClient>((ref) {
  final events = ref.watch(sessionEventsProvider);
  return ApiClient(
    session: ref.watch(sessionStoreProvider),
    onSessionExpired: events.fireExpired,
  );
});

final referenceRepositoryProvider = Provider<ReferenceRepository>(
  (ref) => ReferenceRepository(
    api: ref.watch(apiClientProvider),
    db: ref.watch(appDatabaseProvider),
  ),
);

final uploadEngineProvider = Provider<UploadEngine>(
  (ref) => UploadEngine(
    api: ref.watch(apiClientProvider),
    db: ref.watch(appDatabaseProvider),
    session: ref.watch(sessionStoreProvider),
  ),
);

final authControllerProvider =
    NotifierProvider<AuthController, AuthState>(AuthController.new);

final householdsStreamProvider = StreamProvider<List<HouseholdRecord>>((ref) {
  final wvCode = ref.watch(authControllerProvider).profile?.wvCode;
  return ref.watch(appDatabaseProvider).watchRecordsWithAnimals().map(
        (rows) => wvCode == null
            ? rows
            : rows.where((row) => row.ownedBy(wvCode)).toList(),
      );
});

final villageStatsProvider = StreamProvider.autoDispose<VillageStats>((ref) {
  final db = ref.watch(appDatabaseProvider);
  final wvCode = ref.watch(authControllerProvider).profile?.wvCode;
  return db.watchRecordsWithAnimals().asyncMap((records) async {
    final scoped = wvCode == null
        ? records
        : records.where((row) => row.ownedBy(wvCode)).toList();
    final pending = await db.pendingUploadCount(wvCode: wvCode);
    final ledger = await db.recentLedger(limit: 5);
    UploadLedgerData? lastSent;
    for (final entry in ledger) {
      if (entry.status == 'sent') {
        lastSent = entry;
        break;
      }
    }
    return VillageStats(
      activeHouseholds: scoped.length,
      pendingUpload: pending,
      totalAnimals: scoped.fold(0, (sum, r) => sum + r.totalAnimals),
      lastUploadAt: lastSent?.updatedAt,
      lastUploadCount: lastSent?.rowCount ?? 0,
    );
  });
});

final pendingByVillageProvider = StreamProvider.autoDispose<Map<String, int>>(
  (ref) {
    ref.watch(authControllerProvider);
    final db = ref.watch(appDatabaseProvider);
    return db
        .watchRecordsWithAnimals()
        .asyncMap((_) => db.pendingByVillage());
  },
);

final villageNamesProvider = FutureProvider.autoDispose<Map<String, String>>(
  (ref) => ref.read(referenceRepositoryProvider).villageNames(),
);

final villageInfoProvider = FutureProvider.autoDispose<VillageInfo?>((ref) async {
  final profile = await ref.watch(sessionStoreProvider).profile();
  return ref.read(referenceRepositoryProvider).village(wvCode: profile?.wvCode);
});

final townVillageInfoProvider = FutureProvider.autoDispose<TownVillageInfo?>(
  (ref) async {
    final profile = await ref.watch(sessionStoreProvider).profile();
    return ref.read(referenceRepositoryProvider).townVillage(
          tvgCode: profile?.tvgCode,
        );
  },
);

final townshipInfoProvider = FutureProvider.autoDispose<TownshipInfo?>(
  (ref) async {
    final profile = await ref.watch(sessionStoreProvider).profile();
    return ref.read(referenceRepositoryProvider).township(
          tspCode: profile?.tspCode,
        );
  },
);

final categoryTotalsProvider = StreamProvider.autoDispose<CategoryTotals>(
  (ref) {
    final wvCode = ref.watch(authControllerProvider).profile?.wvCode;
    return ref.watch(appDatabaseProvider).watchRecordsWithAnimals().map(
          (rows) => CategoryTotals.fromRecords(
            wvCode == null
                ? rows
                : rows.where((row) => row.ownedBy(wvCode)).toList(),
          ),
        );
  },
);

final categoriesProvider = FutureProvider.autoDispose
    .family<List<CategoryOption>, String>((ref, group) {
  return ref.read(referenceRepositoryProvider).categories(group);
});
