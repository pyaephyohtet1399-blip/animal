import 'package:animalcensus/core/config/app_config.dart';
import 'package:animalcensus/core/errors/app_exception.dart';
import 'package:animalcensus/core/models/household.dart';

/// Local mirror of the server validation (`src/validators/survey.validator.js`
/// + `upload.validator.js`). Keeping both sides identical means a payload that
/// passes here is guaranteed to pass the atomic server check.
class ValidationRules {
  ValidationRules._();

  static final RegExp phonePattern = RegExp(r'^[0-9+\-() ]+$');

  static const Map<String, int> textLimits = {
    'hName': 70,
    'hNo': 20,
    'hEdu': 50,
    'hGender': 20,
    'hPhone': 20,
  };

  static List<UploadIssue> validateRecord(HouseholdRecord record) {
    final issues = <UploadIssue>[];
    void add(String field, String message) => issues.add(
          UploadIssue(localRowId: record.localRowId, field: field, message: message),
        );

    if (record.headName.trim().isEmpty) {
      add('hName', 'အိမ်ထောင်ရှင်အမည် မထည့်ရသေးပါ');
    } else if (record.headName.trim().length > textLimits['hName']!) {
      add('hName', 'အမည် စာလုံးရေ 70 ထက် မကျော်ရ');
    }
    final houseNo = record.houseNo?.trim() ?? '';
    if (houseNo.isNotEmpty && houseNo.length > textLimits['hNo']!) {
      add('hNo', 'အိမ်နံပါတ် 20 စာလုံးထက် မကျော်ရ');
    }
    if (record.education.trim().isEmpty) {
      add('hEdu', 'ပညာအရည်အချင်း မထည့်ရသေးပါ');
    } else if (record.education.trim().length > textLimits['hEdu']!) {
      add('hEdu', 'ပညာအရည်အချင်း 50 စာလုံးထက် မကျော်ရ');
    }
    if (record.gender.trim().isEmpty) {
      add('hGender', 'ကျား/မ မရွေးရသေးပါ');
    } else if (record.gender.trim().length > textLimits['hGender']!) {
      add('hGender', 'ကျား/မ 20 စာလုံးထက် မကျော်ရ');
    }
    final phone = record.phone.trim();
    if (phone.length < 5 || phone.length > 20 || !phonePattern.hasMatch(phone)) {
      add('hPhone', 'ဖုန်းနံပါတ် မမှန်ကန်ပါ (5-20 လုံး, ဂဏန်းနှင့် + - ( ) သာ)');
    }
    if (record.age < 0 || record.age > 150) {
      add('hAge', 'အသက် 0 မှ 150 အတွင်း ရှိရမည်');
    }

    for (final group in AnimalGroup.values) {
      final entries = record.animals.where((entry) => entry.group == group.code).toList();
      if (entries.length > 100) {
        add(group.code, '${group.label} အတန်း 100 ထက် မကျော်ရ');
        continue;
      }
      for (var i = 0; i < entries.length; i += 1) {
        final entry = entries[i];
        final prefix = '${group.code}[$i]';
        if (entry.categoryId <= 0) {
          add('$prefix.categoryId', '${group.label} အမျိုးအစား မမှန်ပါ');
        }
        if (group != AnimalGroup.breeding && !group.ageLimits.contains(entry.ageLimit)) {
          add('$prefix.ageLimit', '${group.label} အသက်အရွယ် မမှန်ပါ');
        }
        if (!group.sexes.contains(entry.sex)) {
          add('$prefix.sex', '${group.label} ကျား/မ မမှန်ပါ');
        }
        if (entry.count < 0 || entry.count > AppConfig.maxAnimalCount) {
          add('$prefix.count', 'အရေအတွက် 0 မှ ${AppConfig.maxAnimalCount} အတွင်း ရှိရမည်');
        }
      }
    }
    return issues;
  }

  static List<UploadIssue> validateBatch(List<HouseholdRecord> rows) {
    final issues = <UploadIssue>[];
    final seen = <String>{};
    for (final row in rows) {
      if (!seen.add(row.localRowId)) {
        issues.add(UploadIssue(
          localRowId: row.localRowId,
          field: 'localRowId',
          message: 'အချက်အလက် ထပ်နေပါသည်',
        ));
      }
      issues.addAll(validateRecord(row));
    }
    return issues;
  }
}
