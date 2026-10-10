import 'dart:async';

/// Small in-process bus used to tell the UI that the session is no longer
/// valid (refresh failed / server rejected the token).
class SessionEvents {
  final StreamController<void> _expired = StreamController<void>.broadcast();

  Stream<void> get expired => _expired.stream;

  void fireExpired() {
    if (!_expired.isClosed) _expired.add(null);
  }

  void dispose() {
    _expired.close();
  }
}
