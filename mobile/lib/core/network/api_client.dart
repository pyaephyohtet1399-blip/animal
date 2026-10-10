import 'dart:async';
import 'dart:io' show gzip;

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import 'package:animalcensus/core/config/app_config.dart';
import 'package:animalcensus/core/errors/app_exception.dart';
import 'package:animalcensus/core/session/session_profile.dart';
import 'package:animalcensus/core/session/session_store.dart';

class ApiClient {
  ApiClient({
    required this.session,
    String? baseUrl,
    this.onSessionExpired,
  }) {
    dio = Dio(
      BaseOptions(
        baseUrl: baseUrl ?? AppConfig.baseUrl,
        connectTimeout: AppConfig.connectTimeout,
        receiveTimeout: AppConfig.receiveTimeout,
        headers: {'Content-Type': 'application/json'},
        responseType: ResponseType.json,
      ),
    );
    dio.interceptors.add(AuthInterceptor(this));
  }

  final SessionStore session;
  final void Function()? onSessionExpired;
  late final Dio dio;
  Completer<bool>? _refreshing;

  static const authPaths = {'/auth/login', '/auth/refresh'};

  Future<Map<String, dynamic>> login({
    required String loginCode,
    required String password,
  }) async {
    final body = await post(
      '/auth/login',
      data: {'loginCode': loginCode, 'password': password},
      skipAuth: true,
    );
    final data = dataMap(body);
    final accessToken = data['accessToken'] as String?;
    final refreshToken = data['refreshToken'] as String?;
    if (accessToken == null || refreshToken == null) {
      throw AppException(
        code: 'invalid_credentials',
        message: 'အသုံးပြုခွင့် မရရှိပါ',
        statusCode: 401,
      );
    }
    final profile = JwtPayload.profileFrom(accessToken);
    if (profile == null) {
      throw AppException(
        code: 'invalid_token',
        message: 'အသုံးပြုခွင့် token မမှန်ပါ',
        statusCode: 401,
      );
    }
    await session.save(
      accessToken: accessToken,
      refreshToken: refreshToken,
      profile: profile,
    );
    return data;
  }

  Future<void> revokeSession({
    required String accessToken,
    required String refreshToken,
  }) async {
    try {
      await dio.post(
        '/auth/logout',
        data: {'refreshToken': refreshToken},
        options: Options(
          extra: {'skipAuth': true},
          headers: {'Authorization': 'Bearer $accessToken'},
        ),
      );
    } catch (_) {}
  }

  Future<void> changePassword({
    required String oldPassword,
    required String newPassword,
  }) =>
      post('/auth/change-password', data: {
        'oldPassword': oldPassword,
        'newPassword': newPassword,
      });

  Future<dynamic> get(
    String path, {
    Map<String, dynamic>? query,
    bool skipAuth = false,
  }) =>
      _wrap(
        () => dio.get(
          path,
          queryParameters: query,
          options: Options(extra: {'skipAuth': skipAuth}),
        ),
      );

  Future<dynamic> post(
    String path, {
    Object? data,
    Map<String, dynamic>? query,
    bool skipAuth = false,
    Duration? receiveTimeout,
  }) =>
      _wrap(
        () => dio.post(
          path,
          data: data,
          queryParameters: query,
          options: Options(
            extra: {'skipAuth': skipAuth},
            receiveTimeout: receiveTimeout,
          ),
        ),
      );

  /// Sends a raw JSON document (optionally gzipped) to the village upload
  /// endpoint. The caller owns retry policy - uploads are idempotent because
  /// the server recognises the `X-Content-Hash`.
  Future<dynamic> postRawUpload({
    required Uint8List body,
    required String contentHash,
    bool compress = true,
  }) {
    final payload = compress ? Uint8List.fromList(gzip.encode(body)) : body;
    return _wrap(
      () => dio.post(
        '/upload/village',
        data: payload,
        options: Options(
          headers: {
            Headers.contentTypeHeader: 'application/json',
            'X-Content-Hash': contentHash,
            if (compress) 'Content-Encoding': 'gzip',
          },
          receiveTimeout: const Duration(seconds: 120),
        ),
      ),
    );
  }

  Future<dynamic> uploadStatus(String contentHash) =>
      get('/upload/village/$contentHash');

  Future<bool> refreshTokens() {
    final inFlight = _refreshing;
    if (inFlight != null) return inFlight.future;
    final completer = Completer<bool>();
    _refreshing = completer;
    () async {
      try {
        final refreshToken = await session.refreshToken();
        if (refreshToken == null) {
          completer.complete(false);
          return;
        }
        final response = await dio.post(
          '/auth/refresh',
          data: {'refreshToken': refreshToken},
          options: Options(
            extra: {'skipAuth': true},
            receiveTimeout: AppConfig.refreshTimeout,
          ),
        );
        final data = dataMap(response.data);
        final accessToken = data['accessToken'] as String?;
        final newRefreshToken = data['refreshToken'] as String?;
        if (accessToken == null || newRefreshToken == null) {
          completer.complete(false);
          return;
        }
        await session.updateTokens(
          accessToken: accessToken,
          refreshToken: newRefreshToken,
        );
        completer.complete(true);
      } catch (error, stack) {
        debugPrint('token refresh failed: $error\n$stack');
        completer.complete(false);
      } finally {
        _refreshing = null;
      }
    }();
    return completer.future;
  }

  void notifySessionExpired() => onSessionExpired?.call();

  Future<SessionProfile?> sessionProfile() => session.profile();

  Future<dynamic> _wrap(Future<Response<dynamic>> Function() run) async {
    try {
      final response = await run();
      return response.data;
    } on DioException catch (error) {
      throw mapDioException(error);
    }
  }

  /// Unwraps `{data: [...]}` list payloads used by reference endpoints.
  static List<dynamic> listData(dynamic body) {
    if (body is Map && body['data'] is List) return body['data'] as List<dynamic>;
    if (body is List) return body;
    return const [];
  }

  static Map<String, dynamic> dataMap(dynamic body) {
    if (body is Map<String, dynamic>) {
      final data = body['data'];
      if (data is Map<String, dynamic>) return data;
      return body;
    }
    if (body is Map) return Map<String, dynamic>.from(body);
    return <String, dynamic>{};
  }

  static AppException mapDioException(DioException error) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
      case DioExceptionType.connectionError:
        return AppException.network();
      case DioExceptionType.badResponse:
        final status = error.response?.statusCode ?? 0;
        final data = error.response?.data;
        return AppException.fromResponse(
          status,
          data is Map<String, dynamic> ? data : null,
        );
      case DioExceptionType.cancel:
        return AppException(
          code: 'cancelled',
          message: 'လုပ်ဆောင်မှု ရပ်တန့်ခဲ့ပါသည်',
        );
      case DioExceptionType.transformTimeout:
        return AppException.network();
      case DioExceptionType.unknown:
        final cause = error.error;
        if (cause is FormatException) {
          return AppException(
            code: 'invalid_json',
            message: 'ဆာဗာ အဖြေ မမှန်ပါ',
            statusCode: 502,
          );
        }
        return AppException.network();
      case DioExceptionType.badCertificate:
        return AppException(
          code: 'bad_certificate',
          message: 'ချိတ်ဆက်မှု လုံခြုံရေး အမှားဖြစ်ပွားပါသည်',
        );
    }
  }
}

class AuthInterceptor extends Interceptor {
  AuthInterceptor(this.client);

  final ApiClient client;

  static String pathOnly(String path) {
    final index = path.indexOf('?');
    return index == -1 ? path : path.substring(0, index);
  }

  bool skipAuth(RequestOptions options) =>
      options.extra['skipAuth'] == true ||
      ApiClient.authPaths.contains(pathOnly(options.path));

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    if (!skipAuth(options)) {
      final token = await client.session.accessToken();
      if (token != null && token.isNotEmpty) {
        options.headers['Authorization'] = 'Bearer $token';
      }
    }
    handler.next(options);
  }

  @override
  Future<void> onError(DioException err, ErrorInterceptorHandler handler) async {
    final status = err.response?.statusCode;
    final alreadyRetried = err.requestOptions.extra['authRetried'] == true;
    if (status == 401 && !skipAuth(err.requestOptions) && !alreadyRetried) {
      final refreshed = await client.refreshTokens();
      if (refreshed) {
        final options = err.requestOptions;
        options.extra['authRetried'] = true;
        final token = await client.session.accessToken();
        if (token != null) options.headers['Authorization'] = 'Bearer $token';
        try {
          final response = await client.dio.fetch<dynamic>(options);
          return handler.resolve(response);
        } on DioException catch (nextError) {
          return handler.next(nextError);
        }
      }
      client.notifySessionExpired();
    }
    handler.next(err);
  }
}
