class UploadIssue {
  const UploadIssue({
    this.localRowId,
    this.field,
    required this.message,
    this.serverVersion,
    this.surveyId,
  });

  final String? localRowId;
  final String? field;
  final String message;
  final int? serverVersion;
  final int? surveyId;

  factory UploadIssue.fromJson(Map<String, dynamic> json) => UploadIssue(
        localRowId: json['localRowId']?.toString(),
        field: json['field'] as String?,
        message: (json['message'] as String?) ?? 'Unknown issue',
        serverVersion: (json['serverVersion'] as num?)?.toInt(),
        surveyId: (json['surveyId'] as num?)?.toInt(),
      );

  Map<String, dynamic> toJson() => {
        if (localRowId != null) 'localRowId': localRowId,
        if (field != null) 'field': field,
        'message': message,
        if (serverVersion != null) 'serverVersion': serverVersion,
        if (surveyId != null) 'surveyId': surveyId,
      };
}

class AppException implements Exception {
  AppException({
    required this.code,
    required this.message,
    this.statusCode,
    this.issues = const [],
  });

  final String code;
  final String message;
  final int? statusCode;
  final List<UploadIssue> issues;

  bool get isAuthProblem =>
      statusCode == 401 || code == 'unauthorized' || code == 'invalid_credentials';

  factory AppException.network([String? detail]) => AppException(
        code: 'network_error',
        message: detail ?? 'ကွန်ရက် မချိတ်နိုင်ပါ — ထပ်စမ်းပါ',
      );

  factory AppException.fromResponse(int statusCode, Map<String, dynamic>? body) {
    final error = body?['error'] as Map<String, dynamic>?;
    final code = (error?['code'] as String?) ?? 'unknown_error';
    final message = (error?['message'] as String?) ?? 'ဆာဗာ အမှားဖြစ်ပွားပါသည်';
    final rawDetails = error?['details'];
    final issues = <UploadIssue>[];
    if (rawDetails is List) {
      for (final item in rawDetails) {
        if (item is Map<String, dynamic>) {
          issues.add(UploadIssue.fromJson(item));
        } else if (item is Map) {
          issues.add(UploadIssue.fromJson(Map<String, dynamic>.from(item)));
        }
      }
    }
    return AppException(
      code: code,
      message: message,
      statusCode: statusCode,
      issues: issues,
    );
  }

  @override
  String toString() => 'AppException($code, $statusCode): $message';
}
