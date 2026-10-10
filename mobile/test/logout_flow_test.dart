import 'package:drift/drift.dart' show driftRuntimeOptions;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:animalcensus/app.dart';
import 'package:animalcensus/app_providers.dart';
import 'package:animalcensus/core/db/app_database.dart';
import 'package:animalcensus/core/network/api_client.dart';
import 'package:animalcensus/core/reference/reference_repository.dart';
import 'package:animalcensus/core/session/session_profile.dart';
import 'package:animalcensus/core/session/session_store.dart';
import 'package:animalcensus/features/auth/login_screen.dart';
import 'package:animalcensus/features/home/home_screen.dart';
import 'package:animalcensus/features/settings/settings_screen.dart';

const _profile = SessionProfile(
  userId: 'user-1',
  role: 'village',
  districtCode: null,
  tspCode: null,
  tvgCode: null,
  wvCode: 'WV001',
);

class _FakeSession extends SessionStore {
  @override
  Future<bool> hasSession() async => true;

  @override
  Future<SessionProfile?> profile() async => _profile;

  @override
  Future<String?> accessToken() async => 'access-token';

  @override
  Future<String?> refreshToken() async => 'refresh-token';

  @override
  Future<void> clear() async {}

  @override
  Future<InterviewerInfo> interviewer() async => InterviewerInfo.empty;
}

class _FakeApi extends ApiClient {
  _FakeApi(SessionStore session) : super(session: session);

  @override
  Future<void> revokeSession({
    required String accessToken,
    required String refreshToken,
  }) async {}
}

class _FakeRefs extends ReferenceRepository {
  _FakeRefs({required super.api, required super.db});

  @override
  Future<void> refreshAll({
    String? wvCode,
    String? tvgCode,
    String? tspCode,
  }) async {}

  @override
  Future<VillageInfo?> village({String? wvCode, bool forceRefresh = false}) async =>
      VillageInfo(wvCode: wvCode ?? 'WV001', wvName: 'ကျေးရွာ က');

  @override
  Future<TownVillageInfo?> townVillage({
    String? tvgCode,
    bool forceRefresh = false,
  }) async =>
      null;

  @override
  Future<TownshipInfo?> township({
    String? tspCode,
    bool forceRefresh = false,
  }) async =>
      null;

  @override
  Future<List<CategoryOption>> categories(
    String group, {
    bool forceRefresh = false,
  }) async =>
      const [];
}

void main() {
  driftRuntimeOptions.dontWarnAboutMultipleDatabases = true;

  testWidgets('logout from settings lands on the login screen directly',
      (tester) async {
    await tester.binding.setSurfaceSize(const Size(360, 1200));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    final db = AppDatabase.memory();
    addTearDown(db.close);
    final fakeSession = _FakeSession();
    final fakeApi = _FakeApi(fakeSession);

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          appDatabaseProvider.overrideWithValue(db),
          sessionStoreProvider.overrideWithValue(fakeSession),
          apiClientProvider.overrideWithValue(fakeApi),
          referenceRepositoryProvider
              .overrideWithValue(_FakeRefs(api: fakeApi, db: db)),
        ],
        child: const AnimalCensusApp(),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.byType(HomeScreen), findsOneWidget);

    await tester.tap(find.byIcon(Icons.settings_outlined));
    await tester.pumpAndSettle();
    expect(find.byType(SettingsScreen), findsOneWidget);

    await tester.tap(find.text('ထွက်ရန်'));
    await tester.pumpAndSettle();
    await tester.tap(find.widgetWithText(FilledButton, 'ထွက်ရန်'));
    await tester.pumpAndSettle();

    expect(find.byType(SettingsScreen), findsNothing);
    expect(find.byType(LoginScreen), findsOneWidget);
    expect(find.text('ဝင်ရောက်ရန်'), findsOneWidget);
    expect(tester.takeException(), isNull);

    await tester.pumpWidget(const SizedBox());
    await tester.pump(Duration.zero);
  });
}
