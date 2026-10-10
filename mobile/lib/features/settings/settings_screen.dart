import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:file_picker/file_picker.dart';
import 'package:intl/intl.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

import 'package:animalcensus/app_providers.dart';
import 'package:animalcensus/core/backup/village_excel.dart';
import 'package:animalcensus/core/session/session_store.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  bool _excelWorking = false;
  bool _interviewerSaved = true;
  Timer? _autoSaveTimer;
  SessionStore? _sessionStore;
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _sessionStore = ref.read(sessionStoreProvider);
    _loadInterviewer();
  }

  @override
  void dispose() {
    _autoSaveTimer?.cancel();
    final store = _sessionStore;
    if (store != null && !_interviewerSaved) {
      unawaited(store.saveInterviewer(
        name: _nameController.text.trim(),
        phone: _phoneController.text.trim(),
      ));
    }
    _nameController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _loadInterviewer() async {
    final info = await ref.read(sessionStoreProvider).interviewer();
    if (!mounted) return;
    _nameController.text = info.name;
    _phoneController.text = info.phone;
  }

  void _onInterviewerChanged() {
    if (_interviewerSaved) setState(() => _interviewerSaved = false);
    _autoSaveTimer?.cancel();
    _autoSaveTimer = Timer(const Duration(milliseconds: 800), () {
      if (mounted) _saveInterviewer(silent: true);
    });
  }

  Future<void> _saveInterviewer({bool silent = false}) async {
    final name = _nameController.text.trim();
    final phone = _phoneController.text.trim();
    if (phone.isNotEmpty && RegExp(r'[a-zA-Z]').hasMatch(phone)) {
      if (!silent && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('ဖုန်းနံပါတ်တွင် အက္ခရာ မပါရပါ')),
        );
      }
      return;
    }
    final SessionStore store = _sessionStore ?? ref.read(sessionStoreProvider);
    await store.saveInterviewer(name: name, phone: phone);
    if (!mounted) return;
    setState(() => _interviewerSaved = true);
    if (!silent) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('မေးမြန်းသူ အချက်အလက် သိမ်းပြီးပါပြီ')),
      );
    }
  }

  /// Excel backup of the signed-in village (empty profile → every row).
  Future<void> _exportExcel() async {
    if (_excelWorking) return;
    setState(() => _excelWorking = true);
    try {
      final db = ref.read(appDatabaseProvider);
      final wvCode = ref.read(authControllerProvider).profile?.wvCode ?? '';
      final records = (await db.allRecords())
          .where((record) => record.ownedBy(wvCode))
          .map(
            (record) => wvCode.isNotEmpty && record.wvCode.isEmpty
                ? record.copyWith(wvCode: wvCode)
                : record,
          )
          .toList();
      final wvName = ref.read(villageInfoProvider).value?.wvName ?? '';
      final bytes = VillageExcel.buildBytes(records, wvName: wvName);
      final dir = await getTemporaryDirectory();
      final stamp = DateFormat('yyyyMMdd_HHmm').format(DateTime.now());
      final file =
          '${dir.path}/animal_census_${wvCode.isEmpty ? 'backup' : wvCode}_$stamp.xlsx';
      await File(file).writeAsBytes(bytes, flush: true);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Excel ထုတ်ပြီးပါပြီ: အိမ်ထောင်စု ${records.length} ခု')),
        );
        await SharePlus.instance.share(ShareParams(
          files: [XFile(file)],
          text: 'Animal Census Excel backup',
        ));
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Excel အမှား: $error')));
      }
    } finally {
      if (mounted) setState(() => _excelWorking = false);
    }
  }

  Future<void> _importExcel() async {
    if (_excelWorking) return;
    final picked = await FilePicker.pickFiles();
    if (picked.isEmpty || !mounted) return;
    setState(() => _excelWorking = true);
    try {
      final bytes = await picked.first.readAsBytes();
      final parsed = VillageExcel.parse(bytes);
      final sessionWv = ref.read(authControllerProvider).profile?.wvCode ?? '';
      final targetWv = parsed.wvCode.isNotEmpty ? parsed.wvCode : sessionWv;
      if (targetWv.isEmpty) {
        _showExcelErrors(const [
          'ရွာကုဒ် မတွေ့ပါ — Excel ဖိုင်တွင် wvCode မပါဘဲ ကျေးရွာအကောင့်ဖြင့် '
          'ဝင်ပြီးမှ ထပ်စမ်းပါ',
        ]);
        return;
      }
      final records = parsed.wvCode.isEmpty
          ? [
              for (final record in parsed.records)
                record.copyWith(wvCode: targetWv),
            ]
          : parsed.records;
      final animals = records.fold<int>(
        0,
        (sum, record) => sum + record.totalAnimals,
      );
      final mismatch = sessionWv.isNotEmpty && targetWv != sessionWv;
      if (!mounted) return;
      final confirmed = await showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Excel Import ပြုလုပ်မည်'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                parsed.wvName.isEmpty
                    ? 'ကျေးရွာ: $targetWv'
                    : 'ကျေးရွာ: ${parsed.wvName} ($targetWv)',
              ),
              const SizedBox(height: 8),
              Text('အိမ်ထောင်စု ${records.length} ခု · တိရစ္ဆာန် $animals ကောင်'),
              const SizedBox(height: 8),
              const Text(
                'တူညီသော ID ရှိ အချက်အလက်များ အစားထိုးပါမည်။',
                style: TextStyle(fontSize: 13),
              ),
              if (mismatch) ...[
                const SizedBox(height: 8),
                Text(
                  'သတိ: လက်ရှိအကောင့် ($sessionWv) နှင့် မတူပါ။ '
                  'သိမ်းပြီးပါက ထိုရွာ ($targetWv) အတွက်သာ '
                  'တင်ရန် စောင့်မည်။',
                  style: TextStyle(
                    fontSize: 13,
                    color: Theme.of(context).colorScheme.error,
                  ),
                ),
              ],
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('မလုပ်ပါနှင့်'),
            ),
            FilledButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Import လုပ်ရန်'),
            ),
          ],
        ),
      );
      if (confirmed != true || !mounted) return;
      await ref.read(appDatabaseProvider).restoreRecords(records);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Import ပြီးပါပြီ: အိမ်ထောင်စု ${records.length} ခု')),
        );
      }
    } on ExcelFormatException catch (error) {
      _showExcelErrors(error.errors);
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Import အမှား: $error')));
      }
    } finally {
      if (mounted) setState(() => _excelWorking = false);
    }
  }

  void _showExcelErrors(List<String> errors) {
    if (!mounted) return;
    showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Excel ဖတ်၍မရပါ'),
        content: SizedBox(
          width: double.maxFinite,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                for (final error in errors)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: Text('• $error', style: const TextStyle(fontSize: 13)),
                  ),
              ],
            ),
          ),
        ),
        actions: [
          FilledButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  Future<void> _changePassword() async {
    final oldController = TextEditingController();
    final newController = TextEditingController();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('စကားဝှက် ပြောင်းရန်'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: oldController,
              obscureText: true,
              decoration: const InputDecoration(labelText: 'ဟောင်းသော စကားဝှက်'),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: newController,
              obscureText: true,
              decoration: const InputDecoration(labelText: 'အသစ် စကားဝှက်'),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('မလုပ်ပါနှင့်'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('ပြောင်းရန်'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      await ref.read(apiClientProvider).changePassword(
            oldPassword: oldController.text,
            newPassword: newController.text,
          );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('စကားဝှက် ပြောင်းပြီးပါပြီ')),
        );
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('မအောင်မြင်ပါ: $error')));
      }
    } finally {
      oldController.dispose();
      newController.dispose();
    }
  }

  Future<void> _logout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('ထွက်မည်လား?'),
        content: const Text('မတင်ရသေးသော အချက်အလက် မပျောက်ပါ။'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('မထွက်ပါနှင့်'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('ထွက်ရန်'),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      await ref.read(authControllerProvider.notifier).signOut();
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authControllerProvider);
    final village = ref.watch(villageInfoProvider);
    final tract = ref.watch(townVillageInfoProvider);
    final township = ref.watch(townshipInfoProvider);
    final stats = ref.watch(villageStatsProvider);
    final profile = auth.profile;
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('ဆက်တင်များ')),
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
                    village.value?.wvName ?? '—',
                    style: theme.textTheme.titleLarge
                        ?.copyWith(fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 8),
                  _InfoRow(label: 'အုပ်စု', value: tract.value?.tvgName),
                  _InfoRow(label: 'မြို့နယ်', value: township.value?.tspName),
                  _InfoRow(label: 'ရွာကုဒ်', value: profile?.wvCode),
                  _InfoRow(label: 'အခန်းကဏ္ဍ', value: _roleLabel(profile?.role)),
                  const SizedBox(height: 8),
                  Text(
                    'အိမ်ထောင်စု ${stats.value?.activeHouseholds ?? 0} · '
                    'တင်ရန် ${stats.value?.pendingUpload ?? 0}',
                    style: theme.textTheme.bodySmall,
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'မေးမြန်းသူ (ရွာလူကြီး)',
                    style: theme.textTheme.titleMedium
                        ?.copyWith(fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _nameController,
                    textCapitalization: TextCapitalization.words,
                    onChanged: (_) => _onInterviewerChanged(),
                    decoration: const InputDecoration(
                      labelText: 'မေးမြန်းသူ အမည်',
                      prefixIcon: Icon(Icons.person_outline),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _phoneController,
                    keyboardType: TextInputType.phone,
                    onChanged: (_) => _onInterviewerChanged(),
                    decoration: const InputDecoration(
                      labelText: 'ဖုန်းနံပါတ်',
                      prefixIcon: Icon(Icons.phone_outlined),
                    ),
                  ),
                  const SizedBox(height: 14),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton.icon(
                      onPressed: () => _saveInterviewer(),
                      icon: const Icon(Icons.save_outlined),
                      label: const Text('သိမ်းမည်'),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Icon(
                        _interviewerSaved
                            ? Icons.check_circle_outline
                            : Icons.sync_outlined,
                        size: 15,
                        color: _interviewerSaved
                            ? theme.colorScheme.primary
                            : theme.colorScheme.onSurfaceVariant,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        _interviewerSaved ? 'သိမ်းပြီးပါပြီ' : 'ပြောင်းလဲမှု သိမ်းနေသည်…',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: _interviewerSaved
                              ? theme.colorScheme.primary
                              : theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          ListTile(
            leading: _excelWorking
                ? const SizedBox(
                    width: 24,
                    height: 24,
                    child: CircularProgressIndicator(strokeWidth: 2.4),
                  )
                : const Icon(Icons.table_view_outlined),
            title: const Text('Excel ထုတ်ရန်'),
            subtitle: const Text('ရွာအလိုက် Excel backup (.xlsx)'),
            onTap: _excelWorking ? null : _exportExcel,
          ),
          ListTile(
            leading: _excelWorking
                ? const SizedBox(
                    width: 24,
                    height: 24,
                    child: CircularProgressIndicator(strokeWidth: 2.4),
                  )
                : const Icon(Icons.file_open_outlined),
            title: const Text('Excel Import လုပ်ရန်'),
            subtitle: const Text('Excel backup ဖိုင်မှ အချက်အလက် ပြန်သွင်းမည်'),
            onTap: _excelWorking ? null : _importExcel,
          ),
          ListTile(
            leading: const Icon(Icons.key_outlined),
            title: const Text('စကားဝှက် ပြောင်းရန်'),
            onTap: _changePassword,
          ),
          ListTile(
            leading: Icon(Icons.logout, color: Theme.of(context).colorScheme.error),
            title: Text(
              'ထွက်ရန်',
              style: TextStyle(color: Theme.of(context).colorScheme.error),
            ),
            onTap: _logout,
          ),
          const SizedBox(height: 24),
          Center(
            child: Text(
              'Animal Census v1.0.0',
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ),
        ],
      ),
    );
  }

  String _roleLabel(String? role) => switch (role) {
        'village' => 'ကျေးရွာ',
        'tsp' => 'တာဝန်ရှိသူ',
        'admin' => 'စီမံခန့်ခွဲသူ',
        _ => role ?? '—',
      };
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.label, required this.value});

  final String label;
  final String? value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final text = (value == null || value!.trim().isEmpty) ? '—' : value!;
    return Padding(
      padding: const EdgeInsets.only(top: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 92,
            child: Text(
              label,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ),
          Expanded(
            child: Text(text, style: theme.textTheme.bodyMedium),
          ),
        ],
      ),
    );
  }
}
