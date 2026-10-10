import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';

import 'package:animalcensus/core/db/app_database.dart';
import 'package:animalcensus/core/errors/app_exception.dart';
import 'package:animalcensus/core/models/household.dart';
import 'package:animalcensus/core/network/api_client.dart';
import 'package:animalcensus/core/session/session_profile.dart';
import 'package:animalcensus/core/session/session_store.dart';
import 'package:animalcensus/core/sync/upload_engine.dart';
import 'package:animalcensus/core/utils/hash.dart';

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
  Future<InterviewerInfo> interviewer() async =>
      const InterviewerInfo(name: 'ဦးမောင်မောင်', phone: '0912345678');
}

class _FakeApi extends ApiClient {
  _FakeApi(SessionStore session) : super(session: session);

  int postCalls = 0;
  int statusCalls = 0;
  final List<Uint8List> postedBodies = [];

  /// Returning a map = success response; throwing simulates a failed POST.
  Future<dynamic> Function(int attempt, Uint8List body)? onPost;

  /// Returning = the receipt exists; throwing = it does not (yet).
  Future<dynamic> Function(int call)? onStatus;

  @override
  Future<dynamic> postRawUpload({
    required Uint8List body,
    required String contentHash,
    bool compress = true,
  }) async {
    postCalls += 1;
    postedBodies.add(body);
    final handler = onPost;
    if (handler != null) return handler(postCalls, body);
    throw AppException.network();
  }

  @override
  Future<dynamic> uploadStatus(String contentHash) async {
    statusCalls += 1;
    final handler = onStatus;
    if (handler != null) return handler(statusCalls);
    throw AppException(
      code: 'not_found',
      message: 'Upload receipt not found',
      statusCode: 404,
    );
  }
}

HouseholdRecord _record() => HouseholdRecord(
      localRowId: 'row-1',
      houseNo: '12/A',
      headName: 'ဒေါ်အေးအေး',
      gender: 'အမ',
      education: 'တက္ကသိုလ်ဝင်',
      phone: '0912345678',
      age: 35,
      answerDate: DateTime(2026, 2, 1),
      wvCode: 'WV001',
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

Map<String, dynamic> _okBody({bool replayed = false}) => {
      'data': {
        'contentHash': 'hash',
        'accepted': 1,
        'created': 1,
        'updated': 0,
        'deleted': 0,
        'counts': {'households': 1, 'animals': 5},
        'serverTime': '2026-10-09T00:00:00.000Z',
        'rows': [
          {
            'localRowId': 'row-1',
            'action': 'create',
            'surveyId': 42,
            'syncVersion': 1,
          },
        ],
      },
      'meta': {'replayed': replayed},
    };

void main() {
  late AppDatabase db;
  late _FakeSession session;
  late _FakeApi api;

  UploadEngine engine() => UploadEngine(
        api: api,
        db: db,
        session: session,
        receiptPollInterval: const Duration(milliseconds: 5),
        receiptWaitBudget: const Duration(milliseconds: 80),
        retryBackoffBase: Duration.zero,
      );

  setUp(() {
    db = AppDatabase.memory();
    session = _FakeSession();
    api = _FakeApi(session);
  });

  tearDown(() => db.close());

  test('uploads a record, stamps interviewer and applies the row mapping', () async {
    await db.saveRecord(_record());
    api.onPost = (attempt, body) async => _okBody();

    final outcome = await engine().uploadAll();

    expect(outcome.status, 'sent');
    expect(outcome.success, isTrue);
    expect(api.postCalls, 1);

    final envelope =
        jsonDecode(utf8.decode(api.postedBodies.first)) as Map<String, dynamic>;
    expect(envelope['wvCode'], 'WV001');
    expect(envelope['interviewer'], {'name': 'ဦးမောင်မောင်', 'phone': '0912345678'});

    final record = await db.recordWithAnimals('row-1');
    expect(record!.serverSurveyId, 42);
    expect(record.serverSyncVersion, 1);

    final hash = sha256Hex(api.postedBodies.first);
    final ledger = await db.ledgerEntry(hash);
    expect(ledger!.status, 'sent');
  });

  test('waits for the server receipt after a timeout instead of failing', () async {
    await db.saveRecord(_record());
    api.onPost = (attempt, body) async {
      if (attempt == 1) throw AppException.network();
      return _okBody();
    };
    api.onStatus = (call) async => {'data': {'status': 'accepted'}};

    final outcome = await engine().uploadAll();

    expect(outcome.status, 'sent');
    expect(api.postCalls, 2);
    expect(api.statusCalls, greaterThanOrEqualTo(1));
    final record = await db.recordWithAnimals('row-1');
    expect(record!.serverSurveyId, 42);
  });

  test('recovers through the final reconcile when every POST fails first', () async {
    await db.saveRecord(_record());
    api.onPost = (attempt, body) async {
      if (attempt <= 3) throw AppException.network();
      return _okBody();
    };
    // The server commits only after the three failed attempts, so the receipt
    // shows up exactly when the final reconcile checks for it.
    api.onStatus = (call) async {
      if (api.postCalls >= 3) return {'data': {'status': 'accepted'}};
      throw AppException(code: 'not_found', message: 'gone', statusCode: 404);
    };

    final outcome = await engine().uploadAll();

    expect(outcome.status, 'sent');
    expect(api.postCalls, 4);
    final record = await db.recordWithAnimals('row-1');
    expect(record!.serverSurveyId, 42);
  });

  test('fails with network_error when the server never accepted the upload', () async {
    await db.saveRecord(_record());
    api.onPost = (attempt, body) async => throw AppException.network();
    api.onStatus = (call) async =>
        throw AppException(code: 'not_found', message: 'gone', statusCode: 404);

    final outcome = await engine().uploadAll();

    expect(outcome.status, 'failed');
    expect(outcome.success, isFalse);
    expect(outcome.error!.code, 'network_error');
    expect(api.postCalls, 3);

    final record = await db.recordWithAnimals('row-1');
    expect(record!.serverSurveyId, isNull);

    final hash = sha256Hex(api.postedBodies.first);
    final ledger = await db.ledgerEntry(hash);
    expect(ledger!.status, 'failed');
  });

  test('does not send when the local batch is already blocked by validation', () async {
    final invalid = HouseholdRecord(
      localRowId: 'row-1',
      headName: '',
      gender: 'အမ',
      education: 'မူလတန်း',
      phone: 'abc',
      age: 35,
      answerDate: DateTime(2026, 2, 1),
      wvCode: 'WV001',
    );
    await db.saveRecord(invalid);

    final outcome = await engine().uploadAll();

    expect(outcome.status, 'blocked');
    expect(api.postCalls, 0);
  });
}
