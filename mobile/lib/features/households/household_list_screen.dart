import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart';

import 'package:animalcensus/app_providers.dart';
import 'package:animalcensus/core/models/household.dart';

final householdSearchProvider = StateProvider.autoDispose<String>((_) => '');

class HouseholdListScreen extends ConsumerStatefulWidget {
  const HouseholdListScreen({super.key});

  @override
  ConsumerState<HouseholdListScreen> createState() =>
      _HouseholdListScreenState();
}

class _HouseholdListScreenState extends ConsumerState<HouseholdListScreen> {
  final _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final records = ref.watch(householdsStreamProvider);
    final query = ref.watch(householdSearchProvider).trim().toLowerCase();

    return Scaffold(
      appBar: AppBar(title: const Text('အိမ်ထောင်စု စာရင်း')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => Navigator.of(context).pushNamed('/households/new'),
        icon: const Icon(Icons.add),
        label: const Text('အသစ်'),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'အမည် / အိမ်နံပါတ် ရှာရန်',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: query.isEmpty
                    ? null
                    : IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _searchController.clear();
                          ref.read(householdSearchProvider.notifier).state = '';
                        },
                      ),
              ),
              onChanged: (value) =>
                  ref.read(householdSearchProvider.notifier).state = value,
            ),
          ),
          Expanded(
            child: records.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (error, _) => Center(child: Text('အမှား: $error')),
              data: (rows) {
                final filtered = query.isEmpty
                    ? rows
                    : rows
                        .where((row) =>
                            (row.headName).toLowerCase().contains(query) ||
                            (row.houseNo ?? '')
                                .toLowerCase()
                                .contains(query))
                        .toList();
                if (filtered.isEmpty) {
                  return const _EmptyState();
                }
                return ListView.separated(
                  padding: const EdgeInsets.fromLTRB(12, 0, 12, 88),
                  itemCount: filtered.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 8),
                  itemBuilder: (context, index) =>
                      _HouseholdTile(record: filtered[index]),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _HouseholdTile extends StatelessWidget {
  const _HouseholdTile({required this.record});

  final HouseholdRecord record;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Card(
      child: ListTile(
        title: Text(
          [
            if ((record.houseNo ?? '').trim().isNotEmpty) 'အိမ် ${record.houseNo}',
            record.headName,
          ].join(' · '),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        subtitle: Text(
          'တိရစ္ဆာန် ${record.totalAnimals} ကောင် · ${record.syncLabel}',
          style: Theme.of(context).textTheme.bodySmall,
        ),
        trailing: Icon(
          record.isSynced ? Icons.cloud_done_outlined : Icons.cloud_off_outlined,
          color: record.isSynced ? scheme.primary : scheme.outline,
        ),
        onTap: () => Navigator.of(context)
            .pushNamed('/households/edit', arguments: record.localRowId),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.groups_2_outlined, size: 64, color: Colors.grey[400]),
          const SizedBox(height: 12),
          const Text('အိမ်ထောင်စု မရှိသေးပါ'),
          const SizedBox(height: 4),
          Text(
            'အောက်ဘက် "+" ခလုတ်ဖြင့် စတင်ထည့်ပါ',
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ],
      ),
    );
  }
}
