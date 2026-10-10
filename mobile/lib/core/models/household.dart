import 'package:animalcensus/core/config/app_config.dart';

enum AnimalGroup {
  big('big', 'MC1 တိရစ္ဆာန်ကြီး', 'bigAnimals'),
  small('small', 'MC2 တိရစ္ဆာန်ငယ်', 'smallAnimals'),
  poultry('poultry', 'MC3 ကြက်/ဘဲ/ငုံး', 'poultry'),
  breeding('breeding', 'MC4 မျိုးတိရစ္ဆာန်', 'breedingAnimals');

  const AnimalGroup(this.code, this.label, this.serverField);

  final String code;
  final String label;
  final String serverField;

  static AnimalGroup fromCode(String code) =>
      AnimalGroup.values.firstWhere((group) => group.code == code);

  /// Label without the `MC1 ` code prefix, for compact card headers.
  String get displayName => label.replaceFirst(RegExp(r'^MC\d\s+'), '');

  /// Mirrors backend `src/constants/ageLimits.js`.
  List<String> get ageLimits => switch (this) {
        AnimalGroup.big => const ['LessThanOne', 'Between1and3', 'Over3'],
        AnimalGroup.small => const ['Under2months', 'Between2and6months', 'Over6months'],
        AnimalGroup.poultry => const ['Young', 'Middle', 'Old'],
        AnimalGroup.breeding => const [],
      };

  List<String> get sexes => switch (this) {
        AnimalGroup.big || AnimalGroup.small => const ['male', 'ca_male', 'female'],
        AnimalGroup.poultry || AnimalGroup.breeding => const ['male', 'female'],
      };

  String ageLabel(String value) => switch (this) {
        AnimalGroup.big => switch (value) {
            'LessThanOne' => '၁နှစ်အောက်',
            'Between1and3' => '၁မှ၃နှစ်',
            'Over3' => '၃နှစ်အထက်',
            _ => value,
          },
        AnimalGroup.small => switch (value) {
            'Under2months' => '၂လအောက်',
            'Between2and6months' => '၂မှ၆လ',
            'Over6months' => '၆လအထက်',
            _ => value,
          },
        AnimalGroup.poultry => switch (value) {
            'Young' => 'ငယ်',
            'Middle' => 'လတ်',
            'Old' => 'ကြီး',
            _ => value,
          },
        AnimalGroup.breeding => '—',
      };

  String sexLabel(String value) => switch (value) {
        'male' => 'အထီး',
        'ca_male' => 'သင်းကွပ်အထီး',
        'female' => 'အမ',
        _ => value,
      };
}

class AnimalEntry {
  const AnimalEntry({
    required this.group,
    required this.categoryId,
    required this.ageLimit,
    required this.sex,
    required this.count,
  });

  final String group;
  final int categoryId;
  final String ageLimit;
  final String sex;
  final int count;

  AnimalEntry copyWith({int? categoryId, String? ageLimit, String? sex, int? count}) =>
      AnimalEntry(
        group: group,
        categoryId: categoryId ?? this.categoryId,
        ageLimit: ageLimit ?? this.ageLimit,
        sex: sex ?? this.sex,
        count: count ?? this.count,
      );

  Map<String, dynamic> toJson() => {
        'categoryId': categoryId,
        if (group != AnimalGroup.breeding.code) 'ageLimit': ageLimit,
        'sex': sex,
        'count': count,
      };

  factory AnimalEntry.fromJson(Map<String, dynamic> json, {required String group}) =>
      AnimalEntry(
        group: group,
        categoryId: (json['categoryId'] as num).toInt(),
        ageLimit: (json['ageLimit'] as String?) ?? '',
        sex: (json['sex'] as String?) ?? 'male',
        count: (json['count'] as num?)?.toInt() ?? 0,
      );
}

class HouseholdRecord {
  const HouseholdRecord({
    required this.localRowId,
    this.serverSurveyId,
    this.serverSyncVersion,
    this.wvCode = '',
    this.houseNo,
    required this.headName,
    required this.gender,
    required this.education,
    required this.phone,
    required this.age,
    required this.answerDate,
    this.deleted = false,
    this.dirty = false,
    this.animals = const [],
    this.updatedAt,
  });

  final String localRowId;
  final int? serverSurveyId;
  final int? serverSyncVersion;
  final String wvCode;
  final String? houseNo;
  final String headName;
  final String gender;
  final String education;
  final String phone;
  final int age;
  final DateTime answerDate;
  final bool deleted;
  final bool dirty;
  final List<AnimalEntry> animals;
  final DateTime? updatedAt;

  bool get isSynced => serverSurveyId != null && !dirty && !deleted;

  bool get isPendingUpload {
    if (deleted) return serverSurveyId != null;
    if (serverSurveyId == null) return true;
    return dirty;
  }

  bool ownedBy(String? villageCode) =>
      villageCode == null ||
      villageCode.isEmpty ||
      wvCode.isEmpty ||
      wvCode == villageCode;

  String get syncLabel {
    if (deleted) return serverSurveyId == null ? 'ဖျက်ပြီး' : 'ဖျက်ရန်';
    if (serverSurveyId == null) return 'မတင်ရသေး';
    if (dirty) return 'ပြင်ထားသည်';
    return 'တင်ပြီး';
  }

  int animalCount(String group) =>
      animals.where((entry) => entry.group == group).fold(0, (sum, entry) => sum + entry.count);

  int get totalAnimals => animals.fold(0, (sum, entry) => sum + entry.count);

  HouseholdRecord copyWith({
    int? serverSurveyId,
    int? serverSyncVersion,
    String? wvCode,
    String? houseNo,
    bool clearHouseNo = false,
    String? headName,
    String? gender,
    String? education,
    String? phone,
    int? age,
    DateTime? answerDate,
    bool? deleted,
    bool? dirty,
    List<AnimalEntry>? animals,
    DateTime? updatedAt,
    bool clearServer = false,
  }) =>
      HouseholdRecord(
        localRowId: localRowId,
        serverSurveyId: clearServer ? null : (serverSurveyId ?? this.serverSurveyId),
        serverSyncVersion:
            clearServer ? null : (serverSyncVersion ?? this.serverSyncVersion),
        wvCode: wvCode ?? this.wvCode,
        houseNo: clearHouseNo ? null : (houseNo ?? this.houseNo),
        headName: headName ?? this.headName,
        gender: gender ?? this.gender,
        education: education ?? this.education,
        phone: phone ?? this.phone,
        age: age ?? this.age,
        answerDate: answerDate ?? this.answerDate,
        deleted: deleted ?? this.deleted,
        dirty: dirty ?? this.dirty,
        animals: animals ?? this.animals,
        updatedAt: updatedAt ?? this.updatedAt,
      );

  Map<String, dynamic> interviewJson() => {
        'hName': headName.trim(),
        if (houseNo != null && houseNo!.trim().isNotEmpty) 'hNo': houseNo!.trim(),
        'hEdu': education.trim(),
        'hGender': gender.trim(),
        'hPhone': phone.trim(),
        'hAge': age,
        'ansDate': _dateOnly(answerDate),
      };

  Map<String, dynamic> surveyJson() {
    final byGroup = <String, List<Map<String, dynamic>>>{};
    for (final group in AppConfig.animalGroups) {
      byGroup[group] = animals
          .where((entry) => entry.group == group)
          .map((entry) => entry.toJson())
          .toList();
    }
    return {
      'bigAnimals': byGroup['big'],
      'smallAnimals': byGroup['small'],
      'poultry': byGroup['poultry'],
      'breedingAnimals': byGroup['breeding'],
    };
  }

  static String _dateOnly(DateTime value) {
    final month = value.month.toString().padLeft(2, '0');
    final day = value.day.toString().padLeft(2, '0');
    return '${value.year}-$month-$day';
  }
}
