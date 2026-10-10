import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import 'package:animalcensus/app_providers.dart';
import 'package:animalcensus/core/config/app_config.dart';
import 'package:animalcensus/core/models/household.dart';
import 'package:animalcensus/features/home/category_totals.dart';
import 'package:animalcensus/features/home/village_stats.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _refreshReferences());
  }

  Future<void> _refreshReferences() async {
    final profile = await ref.read(sessionStoreProvider).profile();
    await ref.read(referenceRepositoryProvider).refreshAll(
          wvCode: profile?.wvCode,
          tvgCode: profile?.tvgCode,
          tspCode: profile?.tspCode,
        );
    ref.invalidate(villageInfoProvider);
    ref.invalidate(townVillageInfoProvider);
    ref.invalidate(townshipInfoProvider);
    for (final group in AppConfig.animalGroups) {
      ref.invalidate(categoriesProvider(group));
    }
  }

  @override
  Widget build(BuildContext context) {
    final stats = ref.watch(villageStatsProvider);
    final village = ref.watch(villageInfoProvider);
    final profile = ref.watch(authControllerProvider).profile;
    final pending = stats.value?.pendingUpload ?? 0;

    return Scaffold(
      appBar: AppBar(
        title: Text(village.value?.wvName ?? 'Animal Census'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'အချက်အလက် ပြန်ဆွဲရန်',
            onPressed: _refreshReferences,
          ),
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            onPressed: () => Navigator.of(context).pushNamed('/settings'),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _refreshReferences,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            if (village.value?.wvName != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Text(
                  '${village.value!.wvName} · ${profile?.wvCode ?? ''}',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ),
            _StatsGrid(stats: stats),
            const SizedBox(height: 16),
            _LastUpload(stats: stats),
            const SizedBox(height: 20),
            FilledButton.icon(
              onPressed: () => Navigator.of(context).pushNamed('/households'),
              icon: const Icon(Icons.groups_2_outlined),
              label: const Text('အိမ်ထောင်စု စာရင်း ကြည့်ရန်'),
            ),
            const SizedBox(height: 12),
            FilledButton.tonalIcon(
              onPressed: () => Navigator.of(context).pushNamed('/households/new'),
              icon: const Icon(Icons.person_add_alt_1_outlined),
              label: const Text('အိမ်ထောင်စု အသစ် ထည့်ရန်'),
            ),
            const SizedBox(height: 12),
            Badge(
              isLabelVisible: pending > 0,
              label: Text('$pending'),
              child: SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () => Navigator.of(context).pushNamed('/upload'),
                  icon: const Icon(Icons.cloud_upload_outlined),
                  label: const Text('ဆာဗာသို့ တင်ပို့ရန်'),
                ),
              ),
            ),
            const SizedBox(height: 16),
            const _CategoryBreakdown(),
          ],
        ),
      ),
    );
  }
}

class _StatsGrid extends StatelessWidget {
  const _StatsGrid({required this.stats});

  final AsyncValue<VillageStats> stats;

  @override
  Widget build(BuildContext context) {
    final value = stats.value;
    final items = [
      (Icons.home_work_outlined, 'အိမ်ထောင်စု', '${value?.activeHouseholds ?? 0}'),
      (Icons.pets_outlined, 'တိရစ္ဆာန်', '${value?.totalAnimals ?? 0}'),
      (Icons.upload_file_outlined, 'တင်ရန်', '${value?.pendingUpload ?? 0}'),
    ];
    return Row(
      children: [
        for (final item in items) ...[
          Expanded(
            child: _StatCard(icon: item.$1, label: item.$2, value: item.$3),
          ),
          if (item != items.last) const SizedBox(width: 10),
        ],
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({required this.icon, required this.label, required this.value});

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Card(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: scheme.primary),
            const SizedBox(height: 8),
            Text(
              value,
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
            ),
            Text(label, style: Theme.of(context).textTheme.bodySmall),
          ],
        ),
      ),
    );
  }
}

class _LastUpload extends StatelessWidget {
  const _LastUpload({required this.stats});

  final AsyncValue<VillageStats> stats;

  @override
  Widget build(BuildContext context) {
    final value = stats.value;
    final at = value?.lastUploadAt;
    final text = at == null || value == null
        ? 'တင်ပို့မှု မရှိသေးပါ'
        : 'နောက်ဆုံးတင်ပို့သည် - ${DateFormat('dd/MM/yyyy HH:mm').format(at)} (${value.lastUploadCount} စု)';
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            const Icon(Icons.sync_outlined),
            const SizedBox(width: 10),
            Expanded(child: Text(text)),
          ],
        ),
      ),
    );
  }
}

/// Village-wide animal counts per group and category, live from the local
/// database stream.
class _CategoryBreakdown extends ConsumerWidget {
  const _CategoryBreakdown();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final totals = ref.watch(categoryTotalsProvider);
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final data = totals.value;

    if (data == null) {
      return const Card(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Center(child: CircularProgressIndicator()),
        ),
      );
    }

    final namesByGroup = <String, Map<int, String>>{};
    for (final group in AppConfig.animalGroups) {
      final options = ref.watch(categoriesProvider(group)).value ?? const [];
      namesByGroup[group] = {for (final option in options) option.categoryId: option.name};
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    'တိရစ္ဆာန်အမျိုးအစားအလိုက်',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                Text(
                  '${data.grandTotal}',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                    color: scheme.primary,
                  ),
                ),
              ],
            ),
            if (data.grandTotal == 0) ...[
              const SizedBox(height: 8),
              Text(
                'တိရစ္ဆာန် မှတ်တမ်း မရှိသေးပါ',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: scheme.onSurfaceVariant,
                ),
              ),
            ] else ...[
              for (final group in AnimalGroup.values) ...[
                const SizedBox(height: 12),
                if (group != AnimalGroup.values.first) const Divider(height: 1),
                const SizedBox(height: 10),
                _groupSection(context, group, data, namesByGroup[group.code] ?? const {}),
              ],
            ],
          ],
        ),
      ),
    );
  }

  Widget _groupSection(
    BuildContext context,
    AnimalGroup group,
    CategoryTotals data,
    Map<int, String> names,
  ) {
    final theme = Theme.of(context);
    final categories = data.categoriesOf(group.code);
    final sortedIds = categories.keys.toList()..sort();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                group.displayName,
                style: theme.textTheme.bodyLarge?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
            Text(
              '${data.groupTotal(group.code)}',
              style: theme.textTheme.bodyLarge?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
        if (categories.isEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 2),
            child: Text(
              'မှတ်တမ်း မရှိပါ',
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          )
        else
          for (final categoryId in sortedIds)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      names[categoryId] ?? 'အမျိုးအစား $categoryId',
                      style: theme.textTheme.bodyMedium,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  Text(
                    '${categories[categoryId]}',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
      ],
    );
  }
}
