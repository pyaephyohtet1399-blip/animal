import 'dart:math';

/// Client-generated row identifiers (≤64 chars, accepted by the server as
/// `localRowId`). Deterministic per row so retries never duplicate work.
String newLocalId() {
  final time = DateTime.now().microsecondsSinceEpoch.toRadixString(36);
  final rand = Random.secure().nextInt(0xFFFFFF).toRadixString(36);
  return 'c$time$rand';
}
