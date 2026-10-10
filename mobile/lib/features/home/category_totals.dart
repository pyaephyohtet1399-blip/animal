import 'package:animalcensus/core/models/household.dart';

/// Village-wide animal counts grouped by animal group and category.
///
/// Built in memory from the household stream so the home screen stays live as
/// records are edited, without extra database queries.
class CategoryTotals {
  const CategoryTotals(this.byGroup);

  /// `groupCode` -> `categoryId` -> summed count.
  final Map<String, Map<int, int>> byGroup;

  factory CategoryTotals.fromRecords(List<HouseholdRecord> records) {
    final byGroup = <String, Map<int, int>>{};
    for (final record in records) {
      if (record.deleted) continue;
      for (final animal in record.animals) {
        final perCategory = byGroup.putIfAbsent(animal.group, () => <int, int>{});
        perCategory[animal.categoryId] =
            (perCategory[animal.categoryId] ?? 0) + animal.count;
      }
    }
    return CategoryTotals(byGroup);
  }

  Map<int, int> categoriesOf(String groupCode) =>
      byGroup[groupCode] ?? const <int, int>{};

  int groupTotal(String groupCode) =>
      categoriesOf(groupCode).values.fold(0, (sum, count) => sum + count);

  int get grandTotal => byGroup.values.fold(
        0,
        (sum, perCategory) =>
            sum + perCategory.values.fold(0, (inner, count) => inner + count),
      );
}
