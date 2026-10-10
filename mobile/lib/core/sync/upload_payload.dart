import 'dart:convert';
import 'dart:typed_data';

import 'package:animalcensus/core/config/app_config.dart';
import 'package:animalcensus/core/models/household.dart';
import 'package:animalcensus/core/utils/hash.dart';

enum UploadAction { create, update, delete, skip }

UploadAction actionFor(HouseholdRecord record) {
  if (record.deleted) {
    return record.serverSurveyId == null ? UploadAction.skip : UploadAction.delete;
  }
  if (record.serverSurveyId == null) return UploadAction.create;
  return record.dirty ? UploadAction.update : UploadAction.skip;
}

class UploadPayload {
  UploadPayload({
    required this.envelope,
    required this.bytes,
    required this.contentHash,
    required this.rows,
  });

  final Map<String, dynamic> envelope;
  final Uint8List bytes;
  final String contentHash;
  final List<HouseholdRecord> rows;

  int get rowCount => rows.length;
  bool get isEmpty => rows.isEmpty;
}

UploadPayload buildUploadPayload({
  required String wvCode,
  required List<HouseholdRecord> records,
  required DateTime generatedAt,
  String? deviceId,
  String appVersion = AppConfig.appVersion,
  String? interviewerName,
  String? interviewerPhone,
}) {
  final rows = records.where((record) => actionFor(record) != UploadAction.skip).toList();

  var animals = 0;
  final households = <Map<String, dynamic>>[];
  for (final row in rows) {
    final action = actionFor(row);
    households.add({
      'localRowId': row.localRowId,
      'action': action.name,
      if (action == UploadAction.create) ...{
        'interview': row.interviewJson(),
        'survey': row.surveyJson(),
      },
      if (action == UploadAction.update) ...{
        'surveyId': row.serverSurveyId,
        'syncVersion': row.serverSyncVersion,
        'interview': row.interviewJson(),
        'survey': row.surveyJson(),
      },
      if (action == UploadAction.delete) ...{
        'surveyId': row.serverSurveyId,
        'syncVersion': row.serverSyncVersion,
      },
    });
    if (action != UploadAction.delete) animals += row.totalAnimals;
  }

  final name = interviewerName?.trim() ?? '';
  final phone = interviewerPhone?.trim() ?? '';
  final envelope = <String, dynamic>{
    'format': AppConfig.uploadFormat,
    'version': AppConfig.uploadFormatVersion,
    'wvCode': wvCode,
    'generatedAt': generatedAt.toUtc().toIso8601String(),
    if (deviceId != null)
      'device': {'id': deviceId, 'appVersion': appVersion, 'platform': 'android'},
    if (name.isNotEmpty || phone.isNotEmpty)
      'interviewer': {
        if (name.isNotEmpty) 'name': name,
        if (phone.isNotEmpty) 'phone': phone,
      },
    'counts': {'households': households.length, 'animals': animals},
    'households': households,
  };

  final bytes = Uint8List.fromList(utf8.encode(jsonEncode(envelope)));
  return UploadPayload(
    envelope: envelope,
    bytes: bytes,
    contentHash: sha256Hex(bytes),
    rows: rows,
  );
}

class AppliedRow {
  const AppliedRow({
    required this.localRowId,
    required this.action,
    this.surveyId,
    this.syncVersion,
  });

  final String localRowId;
  final String action;
  final int? surveyId;
  final int? syncVersion;

  factory AppliedRow.fromJson(Map<String, dynamic> json) => AppliedRow(
        localRowId: json['localRowId'].toString(),
        action: (json['action'] as String?) ?? '',
        surveyId: (json['surveyId'] as num?)?.toInt(),
        syncVersion: (json['syncVersion'] as num?)?.toInt(),
      );
}

class UploadResponse {
  const UploadResponse({
    required this.contentHash,
    required this.accepted,
    required this.created,
    required this.updated,
    required this.deleted,
    required this.countHouseholds,
    required this.countAnimals,
    required this.rows,
    required this.replayed,
    required this.serverTime,
  });

  final String contentHash;
  final int accepted;
  final int created;
  final int updated;
  final int deleted;
  final int countHouseholds;
  final int countAnimals;
  final List<AppliedRow> rows;
  final bool replayed;
  final String serverTime;

  factory UploadResponse.fromJson(Map<String, dynamic> body) {
    final data = (body['data'] as Map<String, dynamic>?) ?? const {};
    final meta = (body['meta'] as Map<String, dynamic>?) ?? const {};
    final counts = (data['counts'] as Map<String, dynamic>?) ?? const {};
    return UploadResponse(
      contentHash: (data['contentHash'] as String?) ?? '',
      accepted: (data['accepted'] as num?)?.toInt() ?? 0,
      created: (data['created'] as num?)?.toInt() ?? 0,
      updated: (data['updated'] as num?)?.toInt() ?? 0,
      deleted: (data['deleted'] as num?)?.toInt() ?? 0,
      countHouseholds: (counts['households'] as num?)?.toInt() ?? 0,
      countAnimals: (counts['animals'] as num?)?.toInt() ?? 0,
      rows: [
        for (final row in (data['rows'] as List?) ?? const [])
          AppliedRow.fromJson(Map<String, dynamic>.from(row as Map)),
      ],
      replayed: meta['replayed'] == true,
      serverTime: (data['serverTime'] as String?) ?? '',
    );
  }
}
