import 'package:flutter_test/flutter_test.dart';

import 'package:animalcensus/core/models/household.dart';
import 'package:animalcensus/features/home/category_totals.dart';

HouseholdRecord _record({
  String id = 'row-1',
  bool deleted = false,
  List<AnimalEntry> animals = const [],
}) =>
    HouseholdRecord(
      localRowId: id,
      headName: 'အိမ်ထောင်ရှင်',
      gender: 'male',
      education: 'none',
      phone: '',
      age: 40,
      answerDate: DateTime(2026, 1, 1),
      deleted: deleted,
      animals: animals,
    );

AnimalEntry _animal({
  required String group,
  required int categoryId,
  required int count,
}) =>
    AnimalEntry(
      group: group,
      categoryId: categoryId,
      ageLimit: 'Over3',
      sex: 'female',
      count: count,
    );

void main() {
  group('CategoryTotals.fromRecords', () {
    test('sums counts per group and category across records', () {
      final totals = CategoryTotals.fromRecords([
        _record(animals: [
          _animal(group: 'big', categoryId: 1, count: 3),
          _animal(group: 'big', categoryId: 2, count: 1),
        ]),
        _record(id: 'row-2', animals: [
          _animal(group: 'big', categoryId: 1, count: 2),
          _animal(group: 'poultry', categoryId: 24, count: 12),
        ]),
      ]);

      expect(totals.byGroup['big'], {1: 5, 2: 1});
      expect(totals.byGroup['poultry'], {24: 12});
      expect(totals.groupTotal('big'), 6);
      expect(totals.groupTotal('poultry'), 12);
      expect(totals.groupTotal('small'), 0);
      expect(totals.grandTotal, 18);
    });

    test('ignores deleted records', () {
      final totals = CategoryTotals.fromRecords([
        _record(animals: [_animal(group: 'small', categoryId: 10, count: 4)]),
        _record(
          id: 'row-2',
          deleted: true,
          animals: [_animal(group: 'small', categoryId: 10, count: 99)],
        ),
      ]);

      expect(totals.byGroup['small'], {10: 4});
      expect(totals.grandTotal, 4);
    });

    test('no records give empty totals', () {
      final totals = CategoryTotals.fromRecords(const []);

      expect(totals.byGroup, isEmpty);
      expect(totals.grandTotal, 0);
      expect(totals.groupTotal('breeding'), 0);
      expect(totals.categoriesOf('big'), isEmpty);
    });
  });
}
