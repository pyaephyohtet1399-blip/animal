import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:animalcensus/app_providers.dart';
import 'package:animalcensus/core/errors/app_exception.dart';
import 'package:animalcensus/core/session/session_profile.dart';

class AuthState {
  const AuthState({
    this.restoring = true,
    this.loading = false,
    this.profile,
    this.error,
  });

  final bool restoring;
  final bool loading;
  final SessionProfile? profile;
  final String? error;

  bool get signedIn => profile != null;

  AuthState copyWith({
    bool? restoring,
    bool? loading,
    SessionProfile? profile,
    String? error,
    bool clearProfile = false,
    bool clearError = false,
  }) =>
      AuthState(
        restoring: restoring ?? this.restoring,
        loading: loading ?? this.loading,
        profile: clearProfile ? null : (profile ?? this.profile),
        error: clearError ? null : (error ?? this.error),
      );
}

class AuthController extends Notifier<AuthState> {
  @override
  AuthState build() => const AuthState();

  /// Called once at startup: restores the stored session (tokens + profile).
  Future<void> restore() async {
    final store = ref.read(sessionStoreProvider);
    final hasSession = await store.hasSession();
    final profile = hasSession ? await store.profile() : null;
    await _backfillLegacyRows(profile);
    state = AuthState(restoring: false, profile: profile);
  }

  Future<bool> login({
    required String loginCode,
    required String password,
  }) async {
    state = state.copyWith(loading: true, clearError: true);
    try {
      await ref
          .read(apiClientProvider)
          .login(loginCode: loginCode.trim(), password: password);
      final profile = await ref.read(sessionStoreProvider).profile();
      await _backfillLegacyRows(profile);
      state = AuthState(restoring: false, profile: profile);
      return true;
    } on AppException catch (error) {
      state = state.copyWith(loading: false, error: error.message);
      return false;
    } catch (_) {
      state = state.copyWith(
        loading: false,
        error: 'အင်တာနက် မရရှိပါ — ချိတ်ဆက်မှု စစ်ဆေးပါ',
      );
      return false;
    }
  }

  Future<void> _backfillLegacyRows(SessionProfile? profile) async {
    final wvCode = profile?.wvCode;
    if (wvCode == null || wvCode.isEmpty) return;
    await ref.read(appDatabaseProvider).backfillVillage(wvCode);
  }

  Future<void> signOut() async {
    final store = ref.read(sessionStoreProvider);
    final accessToken = await store.accessToken();
    final refreshToken = await store.refreshToken();
    await store.clear();
    state = const AuthState(restoring: false);
    if (accessToken == null || refreshToken == null) return;
    unawaited(
      ref.read(apiClientProvider).revokeSession(
            accessToken: accessToken,
            refreshToken: refreshToken,
          ),
    );
  }
}
