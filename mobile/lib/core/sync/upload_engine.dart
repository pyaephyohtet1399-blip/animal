import 'dart:async';
import 'dart:convert';

import 'package:animalcensus/core/db/app_database.dart';
import 'package:animalcensus/core/errors/app_exception.dart';
import 'package:animalcensus/core/network/api_client.dart';
import 'package:animalcensus/core/session/session_store.dart';
import 'package:animalcensus/core/sync/upload_payload.dart';
import 'package:animalcensus/core/sync/validation_rules.dart';

enum UploadStage { validating, sending, applying }

class UploadOutcome {
  const UploadOutcome({
    required this.status,
    this.rowCount = 0,
    this.response,
    this.error,
    this.issues = const [],
  });

  final String status;
  final int rowCount;
  final UploadResponse? response;
  final AppException? error;
  final List<UploadIssue> issues;

  bool get success => status == 'sent' || status == 'replayed' || status == 'empty';

  factory UploadOutcome.empty() => const UploadOutcome(status: 'empty');

  factory UploadOutcome.blocked(List<UploadIssue> issues, int rowCount) =>
      UploadOutcome(status: 'blocked', rowCount: rowCount, issues: issues);

  factory UploadOutcome.failed(AppException error, {int rowCount = 0}) =>
      UploadOutcome(status: 'failed', rowCount: rowCount, error: error, issues: error.issues);

  factory UploadOutcome.done(UploadResponse response, {required int rowCount}) =>
      UploadOutcome(
        status: response.replayed ? 'replayed' : 'sent',
        rowCount: rowCount,
        response: response,
      );
}

/// Whole-village upload: validate locally → build a deterministic JSON
/// document → send it once (gzip + content hash) → apply the server's row
/// mapping back to SQLite. Failures keep the local rows untouched so the user
/// can simply press upload again.
class UploadEngine {
  UploadEngine({
    required this.api,
    required this.db,
    required this.session,
    this.receiptPollInterval = const Duration(seconds: 4),
    this.receiptWaitBudget = const Duration(seconds: 100),
    this.retryBackoffBase = const Duration(milliseconds: 400),
  });

  final ApiClient api;
  final AppDatabase db;
  final SessionStore session;

  /// How often the receipt status is polled while the server finishes
  /// processing an upload whose response never reached the device.
  final Duration receiptPollInterval;

  /// Maximum time spent waiting for such a receipt before declaring failure.
  final Duration receiptWaitBudget;

  /// Base for the quadratic retry backoff (400ms, 1600ms, ...).
  final Duration retryBackoffBase;

  static const int maxAttempts = 3;

  static bool _isRetriable(AppException error) =>
      error.code == 'network_error' ||
      error.code == 'request_in_progress' ||
      (error.statusCode != null && error.statusCode! >= 500);

  Future<UploadOutcome> uploadAll({
    bool compress = true,
    Future<void> Function(UploadStage stage)? onStage,
  }) async {
    final profile = await session.profile();
    final wvCode = profile?.wvCode;
    if (wvCode == null || wvCode.isEmpty) {
      return UploadOutcome.failed(
        AppException(code: 'forbidden', message: 'ရွာ အချက်အလက် မတွေ့ပါ', statusCode: 403),
      );
    }

    await onStage?.call(UploadStage.validating);
    final records = await db.recordsForUpload();
    final rows = records
        .where((record) =>
            record.ownedBy(wvCode) && actionFor(record) != UploadAction.skip)
        .toList();
    if (rows.isEmpty) return UploadOutcome.empty();

    final issues = ValidationRules.validateBatch(rows);
    if (issues.isNotEmpty) return UploadOutcome.blocked(issues, rows.length);

    final interviewer = await session.interviewer();
    final payload = buildUploadPayload(
      wvCode: wvCode,
      records: rows,
      generatedAt: DateTime.now(),
      interviewerName: interviewer.name,
      interviewerPhone: interviewer.phone,
    );

    final ledger = await db.ledgerEntry(payload.contentHash);
    if (ledger != null && ledger.status == 'sent' && ledger.responseJson != null) {
      final response = UploadResponse.fromJson(
        jsonDecode(ledger.responseJson!) as Map<String, dynamic>,
      );
      await _apply(response, payload);
      return UploadOutcome.done(response, rowCount: payload.rowCount);
    }

    await onStage?.call(UploadStage.sending);
    await db.recordLedgerStart(
      contentHash: payload.contentHash,
      bytes: payload.bytes.length,
      rowCount: payload.rowCount,
    );

    AppException? lastError;
    for (var attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        return await _sendAndApply(payload, compress, onStage);
      } on AppException catch (error) {
        lastError = error;
        if (!_isRetriable(error)) break;
        // The server is most likely still committing this upload (the POST
        // timed out mid-flight or its per-hash lock is held). Wait for the
        // receipt - the next POST then replays instantly with the row mapping
        // instead of failing again.
        if (await _awaitReceipt(payload.contentHash)) continue;
        if (attempt == maxAttempts) break;
        await Future<void>.delayed(retryBackoffBase * attempt * attempt);
      }
    }

    // Last-chance reconcile: every POST can fail even though the server
    // already committed the upload (e.g. the connection dropped afterwards).
    final recovered = await _reconcile(payload, compress, onStage);
    if (recovered != null) return recovered;

    final failure = lastError ??
        AppException(code: 'unknown_error', message: 'တင်ရာတွင် အမှားဖြစ်ပွားပါသည်');
    await db.recordLedgerFailure(
      contentHash: payload.contentHash,
      errorJson: jsonEncode({
        'code': failure.code,
        'message': failure.message,
        'statusCode': failure.statusCode,
        'issues': failure.issues.map((issue) => issue.toJson()).toList(),
      }),
      bytes: payload.bytes.length,
      rowCount: payload.rowCount,
    );
    return UploadOutcome.failed(failure, rowCount: payload.rowCount);
  }

  Future<UploadOutcome> _sendAndApply(
    UploadPayload payload,
    bool compress,
    Future<void> Function(UploadStage stage)? onStage,
  ) async {
    final body = await api.postRawUpload(
      body: payload.bytes,
      contentHash: payload.contentHash,
      compress: compress,
    );
    final response =
        UploadResponse.fromJson(Map<String, dynamic>.from(body as Map));
    await onStage?.call(UploadStage.applying);
    await _apply(response, payload);
    await db.recordLedgerSuccess(
      contentHash: payload.contentHash,
      responseJson: jsonEncode(body),
      bytes: payload.bytes.length,
      rowCount: payload.rowCount,
    );
    return UploadOutcome.done(response, rowCount: payload.rowCount);
  }

  /// Polls the receipt status until the server accepted this content hash,
  /// its budget runs out, or the device keeps failing to reach it.
  Future<bool> _awaitReceipt(String contentHash) async {
    final deadline = DateTime.now().add(receiptWaitBudget);
    var consecutiveErrors = 0;
    while (DateTime.now().isBefore(deadline)) {
      try {
        await api.uploadStatus(contentHash);
        return true;
      } on AppException catch (error) {
        final notFound = error.statusCode == 404 || error.code == 'not_found';
        if (notFound) {
          consecutiveErrors = 0;
        } else {
          consecutiveErrors += 1;
          if (consecutiveErrors >= 3) return false;
        }
      } catch (_) {
        consecutiveErrors += 1;
        if (consecutiveErrors >= 3) return false;
      }
      await Future<void>.delayed(receiptPollInterval);
    }
    return false;
  }

  Future<UploadOutcome?> _reconcile(
    UploadPayload payload,
    bool compress,
    Future<void> Function(UploadStage stage)? onStage,
  ) async {
    try {
      await api.uploadStatus(payload.contentHash);
    } catch (_) {
      return null;
    }
    try {
      return await _sendAndApply(payload, compress, onStage);
    } catch (_) {
      return null;
    }
  }

  Future<void> _apply(UploadResponse response, UploadPayload payload) {
    return db.transaction(() async {
      for (final row in response.rows) {
        if (row.action.isEmpty) continue;
        await db.applyUploadResult(
          localRowId: row.localRowId,
          action: row.action,
          surveyId: row.surveyId,
          syncVersion: row.syncVersion,
        );
      }
    });
  }

  /// Crash-recovery probe: asks the server whether a given content hash was
  /// already accepted (used by the diagnostics screen).
  Future<UploadResponse?> probeStatus(String contentHash) async {
    try {
      final body = await api.uploadStatus(contentHash);
      return UploadResponse.fromJson(Map<String, dynamic>.from(body as Map));
    } catch (_) {
      return null;
    }
  }
}
