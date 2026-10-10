import 'dart:convert';

class SessionProfile {
  const SessionProfile({
    required this.userId,
    required this.role,
    required this.districtCode,
    required this.tspCode,
    required this.tvgCode,
    required this.wvCode,
  });

  final String userId;
  final String role;
  final String? districtCode;
  final String? tspCode;
  final String? tvgCode;
  final String? wvCode;

  bool get isVillage => role == 'village';

  Map<String, dynamic> toJson() => {
        'userId': userId,
        'role': role,
        'districtCode': districtCode,
        'tspCode': tspCode,
        'tvgCode': tvgCode,
        'wvCode': wvCode,
      };

  factory SessionProfile.fromJson(Map<String, dynamic> json) => SessionProfile(
        userId: (json['userId'] ?? '').toString(),
        role: (json['role'] ?? '').toString(),
        districtCode: json['districtCode'] as String?,
        tspCode: json['tspCode'] as String?,
        tvgCode: json['tvgCode'] as String?,
        wvCode: json['wvCode'] as String?,
      );
}

/// Local-only interviewer identity (village headman) kept on the device so a
/// handed-over phone keeps its contact context. Never sent to the server.
class InterviewerInfo {
  const InterviewerInfo({required this.name, required this.phone});

  final String name;
  final String phone;

  static const empty = InterviewerInfo(name: '', phone: '');
}

class SessionProfileCodec {
  SessionProfileCodec._();

  static String encode(SessionProfile profile) => jsonEncode(profile.toJson());

  static SessionProfile decode(String raw) =>
      SessionProfile.fromJson(jsonDecode(raw) as Map<String, dynamic>);
}

/// Decodes an access token payload without verifying the signature -
/// the server remains the only source of truth, this is just for local UX.
class JwtPayload {
  JwtPayload._();

  static Map<String, dynamic>? decode(String token) {
    final parts = token.split('.');
    if (parts.length != 3) return null;
    final normalized = base64Url.normalize(parts[1]);
    final decoded = utf8.decode(base64Url.decode(normalized));
    return jsonDecode(decoded) as Map<String, dynamic>;
  }

  static SessionProfile? profileFrom(String token) {
    final payload = decode(token);
    if (payload == null) return null;
    return SessionProfile(
      userId: (payload['userId'] ?? '').toString(),
      role: (payload['role'] ?? '') as String,
      districtCode: payload['districtCode'] as String?,
      tspCode: payload['tspCode'] as String?,
      tvgCode: payload['tvgCode'] as String?,
      wvCode: payload['wvCode'] as String?,
    );
  }
}
