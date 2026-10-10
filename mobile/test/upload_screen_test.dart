import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:animalcensus/app_providers.dart';
import 'package:animalcensus/core/db/app_database.dart';
import 'package:animalcensus/core/models/household.dart';
import 'package:animalcensus/core/reference/reference_repository.dart';
import 'package:animalcensus/core/session/session_profile.dart';
import 'package:animalcensus/core/session/session_store.dart';
import 'package:animalcensus/features/auth/auth_controller.dart';
import 'package:animalcensus/features/upload/upload_screen.dart';

const _currentProfile = SessionProfile(
  userId: 'user-1',
  role: 'village',
  districtCode: null,
  tspCode: null,
  tvgCode: null,
  wvCode: 'WV001',
);

class _FakeAuth extends AuthController {
  @override
  AuthState build() => const AuthState(restoring: false, profile: _currentProfile);
}

class _FakeSession extends SessionStore {
  @override
  Future<SessionProfile?> profile() async => _currentProfile;
}

HouseholdRecord _row(String id, {String wvCode = ''}) => HouseholdRecord(
      localRowId: id,
      wvCode: wvCode,
      headName: 'အိမ်ထောင်ရှင် $id',
      gender: 'အမ',
      education: 'မူလတန်း',
      phone: '0912345678',
      age: 30,
      answerDate: DateTime(2026, 1, 15),
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

Future<void> _seedReferences(AppDatabase db) async {
  await db.writeReference(
    ReferenceRepository.villageKey,
    jsonEncode(const VillageInfo(wvCode: 'WV001', wvName: 'ကျေးရွာ က').toJson()),
  );
  await db.writeReference(
    ReferenceRepository.villageNamesKey,
    jsonEncode({'WV001': 'ကျေးရွာ က', 'WV002': 'ကျေးရွာ ခ'}),
  );
}

Future<AppDatabase> _seedDb() async {
  final db = AppDatabase.memory();
  await db.saveRecord(_row('a1', wvCode: 'WV001'));
  await db.saveRecord(_row('a2', wvCode: 'WV001'));
  await db.saveRecord(_row('legacy'));
  await db.saveRecord(_row('b1', wvCode: 'WV002'));
  await db.saveRecord(_row('b2', wvCode: 'WV002'));
  await db.applyUploadResult(
    localRowId: 'b2',
    action: 'create',
    surveyId: 7,
    syncVersion: 1,
  );
  await _seedReferences(db);
  return db;
}

Future<void> _pumpUploadScreen(WidgetTester tester, AppDatabase db) async {
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        appDatabaseProvider.overrideWithValue(db),
        authControllerProvider.overrideWith(() => _FakeAuth()),
        sessionStoreProvider.overrideWithValue(_FakeSession()),
      ],
      child: const MaterialApp(home: UploadScreen()),
    ),
  );
  await tester.pumpAndSettle();
}

Future<void> _tearDownTree(WidgetTester tester) async {
  await tester.pumpWidget(const SizedBox());
  await tester.pump(Duration.zero);
}

void main() {
  testWidgets('shows current-village count and other villages separately',
      (tester) async {
    final db = await _seedDb();
    addTearDown(db.close);

    await _pumpUploadScreen(tester, db);

    expect(find.text('တင်ပို့ရန် အိမ်ထောင်စု - 3'), findsOneWidget);
    expect(find.text('ရွာ - ကျေးရွာ က'), findsOneWidget);
    expect(
      find.text('အခြားရွာများတွင် စောင့်ဆိုင်းနေသည့် အချက်အလက် - 1'),
      findsOneWidget,
    );
    expect(find.text('ကျေးရွာ ခ'), findsOneWidget);
    expect(find.text('1 ခု'), findsOneWidget);

    final button = tester.widget<FilledButton>(
      find.widgetWithText(FilledButton, 'တင်ပို့ရန်'),
    );
    expect(button.onPressed, isNotNull);
    expect(tester.takeException(), isNull);

    await _tearDownTree(tester);
  });

  testWidgets('upload button disabled when own village has nothing pending',
      (tester) async {
    final db = AppDatabase.memory();
    await db.saveRecord(_row('b1', wvCode: 'WV002'));
    await _seedReferences(db);
    addTearDown(db.close);

    await _pumpUploadScreen(tester, db);

    expect(find.text('တင်ပို့ရန် အိမ်ထောင်စု - 0'), findsOneWidget);
    expect(find.text('ကျေးရွာ ခ'), findsOneWidget);
    expect(find.text('1 ခု'), findsOneWidget);

    final button = tester.widget<FilledButton>(
      find.widgetWithText(FilledButton, 'တင်ပို့ရန်'),
    );
    expect(button.onPressed, isNull);
    expect(tester.takeException(), isNull);

    await _tearDownTree(tester);
  });
}
