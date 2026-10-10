import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'session_profile.dart';

class SessionStore {
  SessionStore({FlutterSecureStorage? storage})
      : _storage = storage ?? const FlutterSecureStorage();

  final FlutterSecureStorage _storage;

  static const _accessTokenKey = 'access_token';
  static const _refreshTokenKey = 'refresh_token';
  static const _profileKey = 'profile';
  static const _interviewerNameKey = 'interviewer_name';
  static const _interviewerPhoneKey = 'interviewer_phone';

  Future<void> save({
    required String accessToken,
    required String refreshToken,
    required SessionProfile profile,
  }) async {
    await _storage.write(key: _accessTokenKey, value: accessToken);
    await _storage.write(key: _refreshTokenKey, value: refreshToken);
    await _storage.write(key: _profileKey, value: SessionProfileCodec.encode(profile));
  }

  Future<void> updateTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    await _storage.write(key: _accessTokenKey, value: accessToken);
    await _storage.write(key: _refreshTokenKey, value: refreshToken);
  }

  Future<String?> accessToken() => _storage.read(key: _accessTokenKey);
  Future<String?> refreshToken() => _storage.read(key: _refreshTokenKey);

  Future<SessionProfile?> profile() async {
    final raw = await _storage.read(key: _profileKey);
    if (raw == null || raw.isEmpty) return null;
    try {
      return SessionProfileCodec.decode(raw);
    } catch (_) {
      return null;
    }
  }

  Future<bool> hasSession() async {
    final token = await accessToken();
    return token != null && token.isNotEmpty;
  }

  Future<void> saveInterviewer({
    required String name,
    required String phone,
  }) async {
    await _storage.write(key: _interviewerNameKey, value: name.trim());
    await _storage.write(key: _interviewerPhoneKey, value: phone.trim());
  }

  Future<InterviewerInfo> interviewer() async {
    final name = await _storage.read(key: _interviewerNameKey) ?? '';
    final phone = await _storage.read(key: _interviewerPhoneKey) ?? '';
    return InterviewerInfo(name: name, phone: phone);
  }

  Future<void> clear() => _storage.deleteAll();
}
