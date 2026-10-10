import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:animalcensus/app_providers.dart';
import 'package:animalcensus/core/sync/upload_engine.dart';

enum UploadUiStatus { idle, running, done, blocked, failed, empty }

class UploadUiState {
  const UploadUiState({
    this.status = UploadUiStatus.idle,
    this.stage,
    this.outcome,
  });

  final UploadUiStatus status;
  final UploadStage? stage;
  final UploadOutcome? outcome;

  bool get isRunning => status == UploadUiStatus.running;
}

final uploadControllerProvider =
    NotifierProvider<UploadController, UploadUiState>(UploadController.new);

class UploadController extends Notifier<UploadUiState> {
  @override
  UploadUiState build() => const UploadUiState();

  Future<void> upload() async {
    if (state.isRunning) return;
    state = const UploadUiState(
      status: UploadUiStatus.running,
      stage: UploadStage.validating,
    );
    final outcome = await ref.read(uploadEngineProvider).uploadAll(
          onStage: (stage) async =>
              state = UploadUiState(status: UploadUiStatus.running, stage: stage),
        );
    final status = switch (outcome.status) {
      'sent' || 'replayed' => UploadUiStatus.done,
      'blocked' => UploadUiStatus.blocked,
      'failed' => UploadUiStatus.failed,
      _ => UploadUiStatus.empty,
    };
    state = UploadUiState(status: status, outcome: outcome);
  }

  void reset() => state = const UploadUiState();
}
