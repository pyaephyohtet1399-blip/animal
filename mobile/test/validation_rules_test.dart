import 'package:flutter_test/flutter_test.dart';

import 'package:animalcensus/core/errors/app_exception.dart';
import 'package:animalcensus/core/models/household.dart';
import 'package:animalcensus/core/sync/validation_rules.dart';

HouseholdRecord validRecord({List<AnimalEntry> animals = const []}) =>
    HouseholdRecord(
      localRowId: 'row-1',
      houseNo: '12/A',
      headName: 'ဦးအောင်အောင်',
      gender: 'အထီး',
      education: 'အထက်တန်း',
      phone: '0942000000',
      age: 45,
      answerDate: DateTime(2026, 1, 15),
      animals: animals,
    );

List<UploadIssue> messagesFor(List<UploadIssue> issues, String field) =>
    issues.where((issue) => issue.field == field).toList();

void main() {
  group('ValidationRules.validateRecord', () {
    test('accepts a complete record', () {
      final issues = ValidationRules.validateRecord(validRecord(animals: const [
        AnimalEntry(
          group: 'big',
          categoryId: 101,
          ageLimit: 'Over3',
          sex: 'female',
          count: 2,
        ),
        AnimalEntry(
          group: 'breeding',
          categoryId: 301,
          ageLimit: '',
          sex: 'male',
          count: 1,
        ),
      ]));
      expect(issues, isEmpty);
    });

    test('flags missing home fields', () {
      final issues = ValidationRules.validateRecord(
        HouseholdRecord(
          localRowId: 'row-1',
          headName: '  ',
          gender: '',
          education: '',
          phone: '12',
          age: 200,
          answerDate: DateTime(2026, 1, 15),
        ),
      );
      expect(messagesFor(issues, 'hName'), hasLength(1));
      expect(messagesFor(issues, 'hGender'), hasLength(1));
      expect(messagesFor(issues, 'hEdu'), hasLength(1));
      expect(messagesFor(issues, 'hPhone'), hasLength(1));
      expect(messagesFor(issues, 'hAge'), hasLength(1));
    });

    test('house number stays optional', () {
      final issues = ValidationRules.validateRecord(validRecord());
      expect(messagesFor(issues, 'hNo'), isEmpty);
    });

    test('flags bad animal rows', () {
      final issues = ValidationRules.validateRecord(validRecord(animals: const [
        AnimalEntry(
          group: 'big',
          categoryId: 0,
          ageLimit: 'Under2months',
          sex: 'unknown',
          count: -1,
        ),
      ]));
      final fields = issues.map((issue) => issue.field).toSet();
      expect(fields, contains('big[0].categoryId'));
      expect(fields, contains('big[0].ageLimit'));
      expect(fields, contains('big[0].sex'));
      expect(fields, contains('big[0].count'));
    });

    test('breeding group has no age limit', () {
      final issues = ValidationRules.validateRecord(validRecord(animals: const [
        AnimalEntry(
          group: 'breeding',
          categoryId: 301,
          ageLimit: '',
          sex: 'male',
          count: 1,
        ),
      ]));
      expect(issues, isEmpty);
    });
  });

  group('ValidationRules.validateBatch', () {
    test('rejects duplicate localRowId', () {
      final issues = ValidationRules.validateBatch([
        validRecord(),
        validRecord(),
      ]);
      expect(
        issues.where((issue) => issue.field == 'localRowId'),
        hasLength(1),
      );
    });

    test('collects issues from every row', () {
      final issues = ValidationRules.validateBatch([
        validRecord(),
        validRecord().copyWith(headName: ''),
      ]);
      expect(messagesFor(issues, 'hName'), hasLength(1));
    });
  });
}
