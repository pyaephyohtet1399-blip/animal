import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import 'package:animalcensus/app_providers.dart';
import 'package:animalcensus/core/errors/app_exception.dart';
import 'package:animalcensus/core/models/household.dart';
import 'package:animalcensus/core/reference/reference_repository.dart';
import 'package:animalcensus/core/sync/validation_rules.dart';
import 'package:animalcensus/core/utils/local_id.dart';

class HouseholdFormScreen extends ConsumerStatefulWidget {
  const HouseholdFormScreen({super.key, this.localRowId});

  final String? localRowId;

  @override
  ConsumerState<HouseholdFormScreen> createState() =>
      _HouseholdFormScreenState();
}

class _AnimalDraft {
  _AnimalDraft({
    required this.group,
    required this.ageLimit,
    required this.sex,
    this.categoryId,
    String count = '1',
  }) : countController = TextEditingController(text: count);

  final String group;
  final TextEditingController countController;
  int? categoryId;
  String ageLimit;
  String sex;

  void dispose() => countController.dispose();
}

class _HouseholdFormScreenState extends ConsumerState<HouseholdFormScreen> {
  final _houseNo = TextEditingController();
  final _headName = TextEditingController();
  final _education = TextEditingController();
  final _phone = TextEditingController();
  final _age = TextEditingController();
  final _dateDisplay = TextEditingController();

  late String _localId;
  String _wvCode = '';
  String _gender = '';
  DateTime _answerDate = DateTime.now();
  bool _loading = true;
  bool _saving = false;
  bool _showIssues = false;
  String? _saveError;
  List<_AnimalDraft> _drafts = [];

  bool get _isEdit => widget.localRowId != null;

  @override
  void initState() {
    super.initState();
    _localId = widget.localRowId ?? newLocalId();
    _dateDisplay.text = DateFormat('dd-MM-yyyy').format(_answerDate);
    _load();
  }

  Future<void> _load() async {
    HouseholdRecord? record;
    if (widget.localRowId != null) {
      record = await ref
          .read(appDatabaseProvider)
          .recordWithAnimals(widget.localRowId!);
      if (record != null) {
        _houseNo.text = record.houseNo ?? '';
        _headName.text = record.headName;
        _education.text = record.education;
        _phone.text = record.phone;
        _age.text = '${record.age}';
        _gender = record.gender;
        _answerDate = record.answerDate;
        _dateDisplay.text = DateFormat('dd-MM-yyyy').format(_answerDate);
        for (final draft in _drafts) {
          draft.dispose();
        }
        _drafts = [
          for (final entry in record.animals)
            _AnimalDraft(
              group: entry.group,
              categoryId: entry.categoryId,
              ageLimit: entry.ageLimit,
              sex: entry.sex,
              count: '${entry.count}',
            ),
        ];
      }
    }
    _wvCode = record?.wvCode ?? '';
    if (_wvCode.isEmpty) {
      _wvCode = ref.read(authControllerProvider).profile?.wvCode ?? '';
    }
    if (mounted) setState(() => _loading = false);
  }

  @override
  void dispose() {
    _houseNo.dispose();
    _headName.dispose();
    _education.dispose();
    _phone.dispose();
    _age.dispose();
    _dateDisplay.dispose();
    for (final draft in _drafts) {
      draft.dispose();
    }
    super.dispose();
  }

  HouseholdRecord _buildRecord() {
    final age = int.tryParse(_age.text.trim());
    return HouseholdRecord(
      localRowId: _localId,
      serverSurveyId: null,
      serverSyncVersion: null,
      wvCode: _wvCode,
      houseNo: _houseNo.text.trim().isEmpty ? null : _houseNo.text.trim(),
      headName: _headName.text,
      gender: _gender,
      education: _education.text,
      phone: _phone.text.trim(),
      age: age ?? -1,
      answerDate: _answerDate,
      animals: [
        for (final draft in _drafts)
          AnimalEntry(
            group: draft.group,
            categoryId: draft.categoryId ?? 0,
            ageLimit: draft.ageLimit,
            sex: draft.sex,
            count: int.tryParse(draft.countController.text.trim()) ?? -1,
          ),
      ],
    );
  }

  Future<void> _save() async {
    final record = _buildRecord();
    final issues = ValidationRules.validateRecord(record);
    if (issues.isNotEmpty) {
      setState(() => _showIssues = true);
      return;
    }
    setState(() {
      _saving = true;
      _showIssues = false;
      _saveError = null;
    });
    try {
      await ref.read(appDatabaseProvider).saveRecord(record);
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('သိမ်းပြီးပါပြီ')));
      Navigator.of(context).pop();
    } catch (error) {
      if (mounted) {
        setState(() {
          _saving = false;
          _saveError = error is AppException ? error.message : '$error';
        });
      }
    }
  }

  Future<void> _delete() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('ဖျက်မည်လား?'),
        content: const Text(
          'ဤအိမ်ထောင်စု အချက်အလက်ကို ဖျက်မည်ဖြစ်ပြီး နောက်တင်ပို့ချိန်တွင် ဆာဗာမှလည်း ဖျက်ပါမည်။',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('မဖျက်ပါနှင့်'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('ဖျက်ရန်'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    await ref.read(appDatabaseProvider).deleteRecord(_localId);
    if (mounted) Navigator.of(context).pop();
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _answerDate,
      firstDate: DateTime(2024, 1, 1),
      lastDate: DateTime.now(),
    );
    if (picked != null) {
      setState(() => _answerDate = picked);
      _dateDisplay.text = DateFormat('dd-MM-yyyy').format(picked);
    }
  }

  @override
  Widget build(BuildContext context) {
    final issues = _showIssues
        ? ValidationRules.validateRecord(_buildRecord())
        : const <UploadIssue>[];

    return Scaffold(
      appBar: AppBar(
        title: Text(_isEdit ? 'အိမ်ထောင်စု ပြင်ရန်' : 'အိမ်ထောင်စု အသစ်'),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(12),
              children: [
                _homeSection(),
                const SizedBox(height: 12),
                for (final group in AnimalGroup.values) ...[
                  _animalGroupSection(group),
                  const SizedBox(height: 12),
                ],
                if (_saveError != null) ...[
                  Card(
                    color: Theme.of(context).colorScheme.errorContainer,
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Text(_saveError!),
                    ),
                  ),
                  const SizedBox(height: 12),
                ],
                if (issues.isNotEmpty) ...[
                  _IssuesCard(issues: issues),
                  const SizedBox(height: 12),
                ],
                const SizedBox(height: 72),
              ],
            ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
          child: Row(
            children: [
              if (_isEdit)
                OutlinedButton(
                  onPressed: _saving ? null : _delete,
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Theme.of(context).colorScheme.error,
                    minimumSize: const Size(110, 52),
                  ),
                  child: const Text('ဖျက်ရန်'),
                ),
              const SizedBox(width: 12),
              Expanded(
                child: FilledButton(
                  onPressed: _saving ? null : _save,
                  child: _saving
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(strokeWidth: 2.4),
                        )
                      : const Text('သိမ်းရန်'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _homeSection() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'အိမ်ထောင်ရှင် အချက်အလက်',
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _houseNo,
              maxLength: 20,
              decoration: const InputDecoration(
                labelText: 'အိမ်နံပါတ် (မထည့်လည်းရသည်)',
                counterText: '',
              ),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _headName,
              maxLength: 70,
              decoration: const InputDecoration(
                labelText: 'အိမ်ထောင်ရှင်အမည် *',
                counterText: '',
              ),
            ),
            const SizedBox(height: 14),
            Text('ကျား/မ *', style: Theme.of(context).textTheme.bodyMedium),
            const SizedBox(height: 6),
            Wrap(
              spacing: 8,
              children: [
                for (final option in const ['ကျား', 'မ'])
                  ChoiceChip(
                    label: Text(option),
                    selected: _gender == option,
                    onSelected: (_) => setState(() => _gender = option),
                  ),
              ],
            ),
            const SizedBox(height: 14),
            TextField(
              controller: _age,
              keyboardType: TextInputType.number,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              decoration: const InputDecoration(labelText: 'အသက် *'),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _phone,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(
                labelText: 'ဖုန်းနံပါတ် *',
                hintText: 'ဥပမာ - 0942xxxxxxx',
              ),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _education,
              maxLength: 50,
              decoration: const InputDecoration(
                labelText: 'ပညာအရည်အချင်း *',
                hintText: 'ဥပမာ - အထက်တန်း',
                counterText: '',
              ),
            ),
            const SizedBox(height: 10),
            TextFormField(
              readOnly: true,
              controller: _dateDisplay,
              decoration: InputDecoration(
                labelText: 'မေးမြန်းသည့်ရက် *',
                suffixIcon: IconButton(
                  icon: const Icon(Icons.calendar_today_outlined),
                  onPressed: _pickDate,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _animalGroupSection(AnimalGroup group) {
    final indexes = [
      for (var i = 0; i < _drafts.length; i++)
        if (_drafts[i].group == group.code) i,
    ];
    final categories = ref.watch(categoriesProvider(group.code));

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    group.label,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                TextButton.icon(
                  onPressed: () {
                    setState(() {
                      _drafts.add(
                        _AnimalDraft(
                          group: group.code,
                          ageLimit: group.ageLimits.isEmpty
                              ? ''
                              : group.ageLimits.first,
                          sex: group.sexes.first,
                        ),
                      );
                      _showIssues = false;
                    });
                  },
                  icon: const Icon(Icons.add),
                  label: const Text('ထည့်ရန်'),
                ),
              ],
            ),
            if (indexes.isEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 6),
                child: Text(
                  'မထည့်ရသေးပါ',
                  style: Theme.of(
                    context,
                  ).textTheme.bodySmall?.copyWith(color: Colors.grey[600]),
                ),
              ),
            for (final index in indexes)
              _animalRow(group, index, categories.value ?? const []),
            categories.hasError
                ? Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Row(
                      children: [
                        Icon(Icons.wifi_off, size: 16, color: Colors.grey[600]),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            'အမျိုးအစား စာရင်း မရနိုင်ပါ — အင်တာနက်ဖြင့် ပြန်ဆွဲပါ',
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                        ),
                      ],
                    ),
                  )
                : const SizedBox.shrink(),
          ],
        ),
      ),
    );
  }

  Widget _animalRow(
    AnimalGroup group,
    int index,
    List<CategoryOption> categories,
  ) {
    final draft = _drafts[index];
    final showAge = group != AnimalGroup.breeding;

    return Container(
      margin: const EdgeInsets.only(top: 10),
      padding: const EdgeInsets.fromLTRB(12, 10, 4, 10),
      decoration: BoxDecoration(
        color: const Color(0xFFF7F9F6),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE1E8DF)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Row 1: အမျိုးအစား (wide) + အရေအတွက် + ဖျက်ရန်
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Expanded(
                child: _dropdown<int>(
                  label: 'အမျိုးအစား',
                  value: draft.categoryId,
                  hint: categories.isEmpty ? 'စာရင်း မရှိပါ' : 'ရွေးပါ',
                  items: [
                    for (final option in categories)
                      DropdownMenuItem(
                        value: option.categoryId,
                        child: Text(
                          option.name,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                  ],
                  onChanged: (value) =>
                      setState(() => draft.categoryId = value),
                ),
              ),
              const SizedBox(width: 8),
              SizedBox(
                width: 92,
                child: TextField(
                  controller: draft.countController,
                  keyboardType: TextInputType.number,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  style: const TextStyle(fontSize: 15),
                  decoration: const InputDecoration(
                    labelText: 'အရေအတွက်',
                    isDense: true,
                  ),
                  onChanged: (_) => setState(() => _showIssues = false),
                ),
              ),
              IconButton(
                tooltip: 'ဤအတန်း ဖျက်ရန်',
                icon: Icon(Icons.delete_outline, color: Colors.grey[700]),
                onPressed: () => setState(() {
                  draft.dispose();
                  _drafts.removeAt(index);
                }),
              ),
            ],
          ),
          const SizedBox(height: 8),
          // Row 2: အသက် + ကျား/မ (breeding တွင် ကျား/မ ပဲ)
          Row(
            children: [
              if (showAge) ...[
                Expanded(
                  flex: 4,
                  child: _dropdown<String>(
                    label: 'အသက်အရွယ်',
                    value: group.ageLimits.contains(draft.ageLimit)
                        ? draft.ageLimit
                        : group.ageLimits.first,
                    items: [
                      for (final limit in group.ageLimits)
                        DropdownMenuItem(
                          value: limit,
                          child: Text(group.ageLabel(limit)),
                        ),
                    ],
                    onChanged: (value) =>
                        setState(() => draft.ageLimit = value ?? ''),
                  ),
                ),
                const SizedBox(width: 8),
              ],
              Expanded(
                flex: showAge ? 5 : 1,
                child: _dropdown<String>(
                  label: 'ကျား/မ',
                  value: group.sexes.contains(draft.sex)
                      ? draft.sex
                      : group.sexes.first,
                  items: [
                    for (final sex in group.sexes)
                      DropdownMenuItem(
                        value: sex,
                        child: Text(
                          group.sexLabel(sex),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                  ],
                  onChanged: (value) => setState(() => draft.sex = value ?? ''),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _dropdown<T>({
    required String label,
    required T? value,
    required List<DropdownMenuItem<T>> items,
    required ValueChanged<T?> onChanged,
    String? hint,
  }) {
    return InputDecorator(
      decoration: InputDecoration(
        labelText: label,
        isDense: true,
        floatingLabelBehavior: FloatingLabelBehavior.always,
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<T>(
          value: value,
          isExpanded: true,
          items: items,
          hint: hint == null
              ? null
              : Text(hint, style: const TextStyle(fontSize: 13)),
          style: TextStyle(
            fontSize: 14,
            color: Theme.of(context).colorScheme.onSurface,
          ),
          onChanged: onChanged,
        ),
      ),
    );
  }
}

class _IssuesCard extends StatelessWidget {
  const _IssuesCard({required this.issues});

  final List<UploadIssue> issues;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Card(
      color: scheme.errorContainer,
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'ပြင်ဆင်ရန် လိုအပ်ချက် ${issues.length} ခု',
              style: TextStyle(
                fontWeight: FontWeight.w700,
                color: scheme.onErrorContainer,
              ),
            ),
            const SizedBox(height: 8),
            for (final issue in issues)
              Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: Text(
                  '• ${issue.message}',
                  style: TextStyle(color: scheme.onErrorContainer),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
