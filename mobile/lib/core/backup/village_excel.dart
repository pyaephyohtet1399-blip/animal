import 'package:excel/excel.dart';

import 'package:animalcensus/core/models/household.dart';
import 'package:animalcensus/core/sync/validation_rules.dart';

/// Thrown when an Excel file cannot be read as a village backup.
/// [errors] holds one human-readable line per problem.
class ExcelFormatException implements Exception {
  ExcelFormatException(this.errors);

  final List<String> errors;

  @override
  String toString() => errors.join('\n');
}

/// Result of [VillageExcel.parse] — always structurally valid and already
/// passed [ValidationRules.validateRecord].
class ExcelImportResult {
  const ExcelImportResult({
    required this.records,
    required this.wvCode,
    required this.wvName,
  });

  /// Parsed household rows (animal entries attached). Rows whose `wvCode`
  /// was blank in the file are normalised to [wvCode] when it is known.
  final List<HouseholdRecord> records;

  /// Village code found in the file (`''` when the file carries none —
  /// the caller falls back to the signed-in village).
  final String wvCode;

  /// Village name for the confirmation dialog (may be empty).
  final String wvName;
}

/// Offline Excel (`.xlsx`) backup for a single village: two sheets named
/// `households` + `animals`, addressed by header names so column order can
/// be rearranged freely. Export produces exactly this format, so a backup
/// file doubles as an import template.
class VillageExcel {
  VillageExcel._();

  static const String householdsSheet = 'households';
  static const String animalsSheet = 'animals';
  static const String defaultSheet = 'Sheet1';

  static const List<String> householdColumns = [
    'localRowId',
    'wvCode',
    'wvName',
    'houseNo',
    'headName',
    'gender',
    'education',
    'phone',
    'age',
    'answerDate',
    'deleted',
    'serverSurveyId',
    'serverSyncVersion',
    'dirty',
  ];

  static const List<String> animalColumns = [
    'localRowId',
    'group',
    'categoryId',
    'ageLimit',
    'sex',
    'count',
  ];

  static const List<String> _requiredHouseholdColumns = [
    'localRowId',
    'headName',
    'gender',
    'education',
    'phone',
    'age',
    'answerDate',
  ];

  static const List<String> _requiredAnimalColumns = [
    'localRowId',
    'group',
    'categoryId',
    'sex',
    'count',
  ];

  // ------------------------------------------------------------- export

  static List<int> buildBytes(
    List<HouseholdRecord> records, {
    String wvName = '',
  }) {
    final excel = Excel.createExcel();
    final households = excel[householdsSheet];
    final animals = excel[animalsSheet];
    excel.delete(defaultSheet);

    households.appendRow([
      for (final column in householdColumns) TextCellValue(column),
    ]);
    for (final record in records) {
      households.appendRow([
        TextCellValue(record.localRowId),
        TextCellValue(record.wvCode),
        TextCellValue(wvName),
        TextCellValue(record.houseNo ?? ''),
        TextCellValue(record.headName),
        TextCellValue(record.gender),
        TextCellValue(record.education),
        TextCellValue(record.phone),
        IntCellValue(record.age),
        TextCellValue(_dateOnly(record.answerDate)),
        TextCellValue(record.deleted.toString()),
        record.serverSurveyId == null
            ? TextCellValue('')
            : IntCellValue(record.serverSurveyId!),
        record.serverSyncVersion == null
            ? TextCellValue('')
            : IntCellValue(record.serverSyncVersion!),
        TextCellValue(record.dirty.toString()),
      ]);
    }

    animals.appendRow([
      for (final column in animalColumns) TextCellValue(column),
    ]);
    for (final record in records) {
      for (final entry in record.animals) {
        animals.appendRow([
          TextCellValue(record.localRowId),
          TextCellValue(entry.group),
          IntCellValue(entry.categoryId),
          TextCellValue(entry.ageLimit),
          TextCellValue(entry.sex),
          IntCellValue(entry.count),
        ]);
      }
    }

    final bytes = excel.save();
    if (bytes == null) {
      throw StateError('Excel ဖိုင် မထုတ်နိုင်ပါ');
    }
    return bytes;
  }

  // ------------------------------------------------------------- import

  static ExcelImportResult parse(List<int> bytes) {
    final errors = <String>[];
    var overflow = 0;
    void addError(String message) {
      if (errors.length < 30) {
        errors.add(message);
      } else {
        overflow++;
      }
    }

    final Excel excel;
    try {
      excel = Excel.decodeBytes(bytes);
    } catch (error) {
      throw ExcelFormatException(['Excel ဖိုင် မဖတ်နိုင်ပါ ($error)']);
    }

    final householdsTable = excel.tables[householdsSheet];
    if (householdsTable == null) {
      throw ExcelFormatException([
        "'$householdsSheet' sheet မတွေ့ပါ — Animal Census Excel ဖိုင် "
        'ဟုတ်/မဟုတ် စစ်ပါ',
      ]);
    }
    final householdsHeader = _headerMap(
      householdsTable.rows,
      required: _requiredHouseholdColumns,
      sheet: householdsSheet,
      addError: addError,
    );

    final records = <HouseholdRecord>[];
    final seenIds = <String>{};
    final skippedIds = <String>{};
    final villageCodes = <String>{};
    var wvName = '';

    final householdRows = householdsTable.rows;
    for (var r = 1; r < householdRows.length; r += 1) {
      final row = householdRows[r];
      if (_isEmptyRow(row)) continue;
      final context = 'households ကြောင်း ${r + 1}';

      final localRowId =
          _text(_cell(row, householdsHeader['localRowId'])).trim();
      if (localRowId.isEmpty) {
        addError('$context: localRowId မရှိပါ');
        continue;
      }
      if (localRowId.length > 64) {
        addError('$context: localRowId 64 လုံးထက် မကျော်ရ');
        continue;
      }
      if (!seenIds.add(localRowId)) {
        addError('$context: localRowId "$localRowId" ထပ်နေသည်');
        continue;
      }

      final wvCode = _text(_cell(row, householdsHeader['wvCode'])).trim();
      if (wvCode.isNotEmpty) villageCodes.add(wvCode);
      if (wvName.isEmpty) {
        wvName = _text(_cell(row, householdsHeader['wvName'])).trim();
      }

      final age = _int(_cell(row, householdsHeader['age']));
      if (age == null) {
        addError('$context: age ဂဏန်း မဟုတ်ပါ');
        skippedIds.add(localRowId);
        continue;
      }
      final answerDate = _date(_cell(row, householdsHeader['answerDate']));
      if (answerDate == null) {
        addError('$context: answerDate (yyyy-MM-dd) မမှန်ကန်ပါ');
        skippedIds.add(localRowId);
        continue;
      }
      final serverSurveyId =
          _int(_cell(row, householdsHeader['serverSurveyId']));
      if (serverSurveyId != null && serverSurveyId < 1) {
        addError('$context: serverSurveyId မမှန်ကန်ပါ');
      }
      final serverSyncVersion =
          _int(_cell(row, householdsHeader['serverSyncVersion']));
      if (serverSyncVersion != null && serverSyncVersion < 0) {
        addError('$context: serverSyncVersion မမှန်ကန်ပါ');
      }

      final deleted = _bool(_cell(row, householdsHeader['deleted']));
      if (deleted == null) {
        addError('$context: deleted မမှန်ကန်ပါ (true/false)');
      }
      final dirty = _bool(_cell(row, householdsHeader['dirty']));
      if (dirty == null) {
        addError('$context: dirty မမှန်ကန်ပါ (true/false)');
      }

      final houseNo =
          _text(_cell(row, householdsHeader['houseNo'])).trim();
      records.add(
        HouseholdRecord(
          localRowId: localRowId,
          serverSurveyId: serverSurveyId,
          serverSyncVersion: serverSyncVersion,
          wvCode: wvCode,
          houseNo: houseNo.isEmpty ? null : houseNo,
          headName: _text(_cell(row, householdsHeader['headName'])).trim(),
          gender: _text(_cell(row, householdsHeader['gender'])).trim(),
          education: _text(_cell(row, householdsHeader['education'])).trim(),
          phone: _text(_cell(row, householdsHeader['phone'])).trim(),
          age: age,
          answerDate: answerDate,
          deleted: deleted ?? false,
          dirty: dirty ?? false,
        ),
      );
    }

    if (villageCodes.length > 1) {
      addError('ရွာကုဒ် အမျိုးမျိုး ပါနေသည်: ${villageCodes.join(', ')}');
    }

    final animalsByRow = <String, List<AnimalEntry>>{};
    final animalsTable = excel.tables[animalsSheet];
    if (animalsTable != null) {
      final animalsHeader = _headerMap(
        animalsTable.rows,
        required: _requiredAnimalColumns,
        sheet: animalsSheet,
        addError: addError,
      );
      final animalRows = animalsTable.rows;
      for (var r = 1; r < animalRows.length; r += 1) {
        final row = animalRows[r];
        if (_isEmptyRow(row)) continue;
        final context = 'animals ကြောင်း ${r + 1}';

        final localRowId =
            _text(_cell(row, animalsHeader['localRowId'])).trim();
        if (localRowId.isEmpty) {
          addError('$context: localRowId မရှိပါ');
          continue;
        }
        if (skippedIds.contains(localRowId)) continue;
        if (!seenIds.contains(localRowId)) {
          addError('$context: households တွင် မတွေ့သော localRowId '
              '"$localRowId"');
          continue;
        }

        final groupCode =
            _text(_cell(row, animalsHeader['group'])).trim();
        final group = AnimalGroup.values.cast<AnimalGroup?>().firstWhere(
              (g) => g!.code == groupCode,
              orElse: () => null,
            );
        if (group == null) {
          addError('$context: group "$groupCode" မမှန်ပါ '
              '(big/small/poultry/breeding)');
          continue;
        }

        final categoryId = _int(_cell(row, animalsHeader['categoryId']));
        final count = _int(_cell(row, animalsHeader['count']));
        if (categoryId == null) {
          addError('$context: categoryId ဂဏန်း မဟုတ်ပါ');
          continue;
        }
        if (count == null) {
          addError('$context: count ဂဏန်း မဟုတ်ပါ');
          continue;
        }

        animalsByRow.putIfAbsent(localRowId, () => []).add(
              AnimalEntry(
                group: groupCode,
                categoryId: categoryId,
                ageLimit:
                    _text(_cell(row, animalsHeader['ageLimit'])).trim(),
                sex: _text(_cell(row, animalsHeader['sex'])).trim(),
                count: count,
              ),
            );
      }
    }

    final validated = <HouseholdRecord>[];
    if (errors.isEmpty) {
      for (final record in records) {
        final complete =
            record.copyWith(animals: animalsByRow[record.localRowId] ?? const []);
        for (final issue in ValidationRules.validateRecord(complete)) {
          addError(
            '${complete.headName} (${complete.localRowId}): ${issue.message}',
          );
        }
        validated.add(complete);
      }
    }

    if (errors.isNotEmpty) {
      if (overflow > 0) {
        errors.add('…အမှား နောက်ထပ် $overflow ခု (စုစုပေါင်း '
            '${errors.length + overflow} ခု)');
      }
      throw ExcelFormatException(errors);
    }

    final effectiveCode = villageCodes.isEmpty ? '' : villageCodes.first;
    final normalised = effectiveCode.isEmpty
        ? validated
        : [
            for (final record in validated)
              record.wvCode.isEmpty
                  ? record.copyWith(wvCode: effectiveCode)
                  : record,
          ];

    return ExcelImportResult(
      records: normalised,
      wvCode: effectiveCode,
      wvName: wvName,
    );
  }

  // ------------------------------------------------------------- helpers

  static Map<String, int> _headerMap(
    List<List<Data?>> rows, {
    required List<String> required,
    required String sheet,
    required void Function(String) addError,
  }) {
    if (rows.isEmpty) {
      addError('$sheet sheet အလွတ်ဖြစ်နေသည်');
      return const {};
    }
    final header = <String, int>{};
    for (var i = 0; i < rows[0].length; i += 1) {
      final name = _text(rows[0][i]?.value).trim();
      if (name.isNotEmpty) header.putIfAbsent(name, () => i);
    }
    for (final column in required) {
      if (!header.containsKey(column)) {
        addError("$sheet sheet တွင် '$column' ကောင်း မရှိပါ");
      }
    }
    return header;
  }

  static CellValue? _cell(List<Data?> row, int? index) =>
      index == null || index >= row.length ? null : row[index]?.value;

  static bool _isEmptyRow(List<Data?> row) => row.every(
        (cell) => cell == null || _text(cell.value).trim().isEmpty,
      );

  static String _text(CellValue? value) {
    if (value == null) return '';
    return switch (value) {
      // excel's TextSpan.toString() concatenates text + children.
      TextCellValue() => value.value.toString(),
      IntCellValue() => value.value.toString(),
      DoubleCellValue() => value.value.toString(),
      BoolCellValue() => value.value.toString(),
      DateCellValue() => _iso(value.year, value.month, value.day),
      DateTimeCellValue() => _iso(value.year, value.month, value.day),
      _ => value.toString(),
    };
  }

  static int? _int(CellValue? value) {
    if (value == null) return null;
    return switch (value) {
      IntCellValue() => value.value,
      DoubleCellValue() =>
        value.value == value.value.roundToDouble() ? value.value.round() : null,
      _ => int.tryParse(_text(value).trim()),
    };
  }

  static DateTime? _date(CellValue? value) {
    if (value == null) return null;
    if (value is DateCellValue) {
      return DateTime(value.year, value.month, value.day);
    }
    if (value is DateTimeCellValue) {
      return DateTime(value.year, value.month, value.day);
    }
    if (value is IntCellValue || value is DoubleCellValue) {
      final serial = value is IntCellValue
          ? value.value.toDouble()
          : (value as DoubleCellValue).value;
      if (serial < 1 || serial > 400000) return null;
      final date =
          DateTime(1899, 12, 30).add(Duration(milliseconds: (serial * 86400000).round()));
      return DateTime(date.year, date.month, date.day);
    }
    final text = _text(value).trim();
    if (text.isEmpty) return null;
    final parsed = DateTime.tryParse(text);
    if (parsed == null) return null;
    return DateTime(parsed.year, parsed.month, parsed.day);
  }

  /// `null` = invalid content; an empty/absent cell reads as `false`.
  static bool? _bool(CellValue? value) {
    if (value == null) return false;
    if (value is BoolCellValue) return value.value;
    if (value is IntCellValue) {
      if (value.value == 1) return true;
      if (value.value == 0) return false;
      return null;
    }
    final text = _text(value).trim().toLowerCase();
    if (text.isEmpty) return false;
    if (text == 'true' || text == 'yes' || text == '1') return true;
    if (text == 'false' || text == 'no' || text == '0') return false;
    return null;
  }

  static String _iso(int year, int month, int day) {
    final m = month.toString().padLeft(2, '0');
    final d = day.toString().padLeft(2, '0');
    return '$year-$m-$d';
  }

  static String _dateOnly(DateTime value) =>
      _iso(value.year, value.month, value.day);
}
