import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:animalcensus/app_providers.dart';
import 'package:animalcensus/core/models/household.dart';
import 'package:animalcensus/core/sync/upload_engine.dart';
import 'package:animalcensus/features/upload/upload_controller.dart';

class UploadScreen extends ConsumerWidget {
  const UploadScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final stats = ref.watch(villageStatsProvider);
    final ui = ref.watch(uploadControllerProvider);
    final records = ref.watch(householdsStreamProvider);
    final pendingByVillage = ref.watch(pendingByVillageProvider).value ??
        const <String, int>{};
    final villageNames = ref.watch(villageNamesProvider).value ?? const {};
    final profile = ref.watch(authControllerProvider).profile;
    final village = ref.watch(villageInfoProvider);
    final currentWvCode = profile?.wvCode ?? '';
    final pending = stats.value?.pendingUpload ?? 0;

    final otherVillages = <String, int>{
      for (final entry in pendingByVillage.entries)
        if (entry.key != currentWvCode && entry.key.isNotEmpty)
          entry.key: entry.value,
    };
    final otherTotal =
        otherVillages.values.fold<int>(0, (sum, count) => sum + count);

    final recordById = <String, HouseholdRecord>{
      for (final record in records.value ?? const <HouseholdRecord>[])
        record.localRowId: record,
    };

    return Scaffold(
      appBar: AppBar(title: const Text('ဆာဗာသို့ တင်ပို့ရန်')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'တင်ပို့ရန် အိမ်ထောင်စု - $pending',
                    style: Theme.of(context)
                        .textTheme
                        .titleLarge
                        ?.copyWith(fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'ရွာ - ${village.value?.wvName ?? currentWvCode}',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'အင်တာနက် ရှိပါက တစ်ခါတည်း တင်ပို့နိုင်ပါသည်။ '
                    'ဤအကောင့်ဖြင့် ဝင်ထားသောရွာ၏ အချက်အလက်ကိုသာ တင်ပို့နိုင်ပါသည်။ '
                    'တင်ပြီးသည့် အချက်အလက်ကို ဆာဗာတွင် ဆက်လက်ပြင်နိုင်ပါသည်။',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                ],
              ),
            ),
          ),
          if (otherVillages.isNotEmpty) ...[
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'အခြားရွာများတွင် စောင့်ဆိုင်းနေသည့် အချက်အလက် - $otherTotal',
                      style: Theme.of(context)
                          .textTheme
                          .titleMedium
                          ?.copyWith(fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 10),
                    for (final entry in otherVillages.entries) ...[
                      Padding(
                        padding: const EdgeInsets.only(bottom: 6),
                        child: Row(
                          children: [
                            Expanded(
                              child: Text(
                                villageNames[entry.key] ?? entry.key,
                                style: Theme.of(context).textTheme.bodyMedium,
                              ),
                            ),
                            Text(
                              '${entry.value} ခု',
                              style: Theme.of(context)
                                  .textTheme
                                  .bodyMedium
                                  ?.copyWith(fontWeight: FontWeight.w700),
                            ),
                          ],
                        ),
                      ),
                    ],
                    const SizedBox(height: 4),
                    Text(
                      'ထိုရွာအကောင့်ဖြင့် ဝင်ပြီးမှသာ တင်ပို့နိုင်ပါသည်။',
                      style: Theme.of(context)
                          .textTheme
                          .bodySmall
                          ?.copyWith(color: Theme.of(context).colorScheme.outline),
                    ),
                  ],
                ),
              ),
            ),
          ],
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: (ui.isRunning || pending == 0) ? null : () => ref.read(uploadControllerProvider.notifier).upload(),
            icon: ui.isRunning
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2.4),
                  )
                : const Icon(Icons.cloud_upload_outlined),
            label: Text(ui.isRunning ? 'တင်ပို့နေသည်...' : 'တင်ပို့ရန်'),
          ),
          if (ui.isRunning) ...[
            const SizedBox(height: 14),
            LinearProgressIndicator(
              value: switch (ui.stage) {
                UploadStage.validating => 0.25,
                UploadStage.sending => 0.7,
                UploadStage.applying => 0.95,
                null => null,
              },
            ),
            const SizedBox(height: 8),
            Center(child: Text(_stageLabel(ui.stage))),
          ],
          if (ui.outcome != null) ...[
            const SizedBox(height: 16),
            _OutcomeCard(
              ui: ui,
              recordById: recordById,
              otherPending: otherTotal,
              onOpenRecord: (id) => Navigator.of(context)
                  .pushNamed('/households/edit', arguments: id),
            ),
          ],
        ],
      ),
    );
  }

  String _stageLabel(UploadStage? stage) => switch (stage) {
        UploadStage.validating => 'စစ်ဆေးနေသည်...',
        UploadStage.sending => 'တင်ပို့နေသည်...',
        UploadStage.applying => 'သိမ်းဆည်းနေသည်...',
        null => '',
      };
}

class _OutcomeCard extends StatelessWidget {
  const _OutcomeCard({
    required this.ui,
    required this.recordById,
    required this.otherPending,
    required this.onOpenRecord,
  });

  final UploadUiState ui;
  final Map<String, HouseholdRecord> recordById;
  final int otherPending;
  final void Function(String localRowId) onOpenRecord;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final outcome = ui.outcome!;

    return switch (ui.status) {
      UploadUiStatus.done => Card(
          color: scheme.primaryContainer,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.check_circle, color: scheme.onPrimaryContainer),
                    const SizedBox(width: 8),
                    Text(
                      outcome.status == 'replayed'
                          ? 'တင်ပို့ပြီး (အရင်က တင်ပြီးဖြစ်သည်)'
                          : 'တင်ပို့ပြီးပါပြီ',
                      style: TextStyle(
                        fontWeight: FontWeight.w700,
                        color: scheme.onPrimaryContainer,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Text(
                  'အသစ် ${outcome.response?.created ?? 0} · '
                  'ပြင်ဆင် ${outcome.response?.updated ?? 0} · '
                  'ဖျက် ${outcome.response?.deleted ?? 0}',
                  style: TextStyle(color: scheme.onPrimaryContainer),
                ),
                if (outcome.response?.countAnimals != null)
                  Text(
                    'တိရစ္ဆာန် စုစုပေါင်း ${outcome.response!.countAnimals} ကောင်',
                    style: TextStyle(color: scheme.onPrimaryContainer),
                  ),
              ],
            ),
          ),
        ),
      UploadUiStatus.blocked => Card(
          color: scheme.errorContainer,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'တင်ပို့၍ မရသေးပါ — ပြင်ဆင်ရန် လိုအပ်ပါသည်',
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    color: scheme.onErrorContainer,
                  ),
                ),
                const SizedBox(height: 10),
                for (final issue in outcome.issues)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: InkWell(
                      onTap: issue.localRowId == null ||
                              issue.localRowId!.isEmpty ||
                              !recordById.containsKey(issue.localRowId)
                          ? null
                          : () => onOpenRecord(issue.localRowId!),
                      child: Row(
                        children: [
                          Icon(Icons.error_outline,
                              size: 18, color: scheme.onErrorContainer),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              '${_rowLabel(issue.localRowId)}: ${issue.message}',
                              style:
                                  TextStyle(color: scheme.onErrorContainer),
                            ),
                          ),
                          if (issue.localRowId != null &&
                              recordById.containsKey(issue.localRowId))
                            Icon(Icons.chevron_right,
                                size: 18, color: scheme.onErrorContainer),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
      UploadUiStatus.failed => Card(
          color: scheme.errorContainer,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'တင်ပို့မအောင်မြင်ပါ',
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    color: scheme.onErrorContainer,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  outcome.error?.message ?? 'အမှားဖြစ်ပွားပါသည်',
                  style: TextStyle(color: scheme.onErrorContainer),
                ),
                const SizedBox(height: 6),
                Text(
                  'အချက်အလက် မပျောက်ပါ — ထပ်စမ်းနိုင်ပါသည်။',
                  style: TextStyle(color: scheme.onErrorContainer),
                ),
              ],
            ),
          ),
        ),
      UploadUiStatus.empty => Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Text(
              otherPending > 0
                  ? 'ဤရွာအတွက် တင်ပို့ရန် အချက်အလက် မရှိပါ။ '
                      'အခြားရွာအတွက် $otherPending ခုမှာ ထိုရွာအကောင့်ဖြင့်သာ တင်ပို့နိုင်ပါသည်။'
                  : 'တင်ပို့ရန် အချက်အလက် မရှိပါ',
            ),
          ),
        ),
      _ => const SizedBox.shrink(),
    };
  }

  String _rowLabel(String? localRowId) {
    if (localRowId == null || localRowId.isEmpty) return 'အထွေ';
    final record = recordById[localRowId];
    if (record == null) return localRowId;
    final houseNo = record.houseNo;
    final name = record.headName;
    return (houseNo == null || houseNo.isEmpty)
        ? name
        : 'အိမ် $houseNo · $name';
  }
}
