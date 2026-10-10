import 'package:excel/excel.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:animalcensus/core/backup/village_excel.dart';
import 'package:animalcensus/core/models/household.dart';

HouseholdRecord sampleRecord(
  String id, {
  String wvCode = 'WV001',
  int? serverId,
  int syncVersion = 0,
  bool dirty = false,
  bool deleted = false,
  String? houseNo,
  List<AnimalEntry> animals = const [
    AnimalEntry(
      group: 'big',
      categoryId: 101,
      ageLimit: 'Over3',
      sex: 'ca_male',
      count: 2,
    ),
    AnimalEntry(
      group: 'poultry',
      categoryId: 201,
      ageLimit: 'Young',
      sex: 'female',
      count: 12,
    ),
    AnimalEntry(
      group: 'breeding',
      categoryId: 401,
      ageLimit: '',
      sex: 'female',
      count: 1,
    ),
  ],
}) =>
    HouseholdRecord(
      localRowId: id,
      serverSurveyId: serverId,
      serverSyncVersion: serverId == null ? null : syncVersion,
      wvCode: wvCode,
      houseNo: houseNo,
      headName: 'အိမ်ထောင်ရှင် $id',
      gender: 'အမ',
      education: 'အထက်တန်း',
      phone: '0912345678',
      age: 41,
      answerDate: DateTime(2026, 10, 8),
      deleted: deleted,
      dirty: dirty,
      animals: animals,
    );

String animalKey(AnimalEntry entry) =>
    '${entry.group}|${entry.categoryId}|${entry.ageLimit}|${entry.sex}|${entry.count}';

/// Raw workbook used to exercise malformed files.
List<int> rawWorkbook({
  required String sheetName,
  required List<List<CellValue?>> rows,
}) {
  final excel = Excel.createExcel();
  final sheet = excel[sheetName];
  excel.delete('Sheet1');
  for (final row in rows) {
    sheet.appendRow(row);
  }
  return excel.save()!;
}

void main() {
  group('VillageExcel export → import round trip', () {
    test('preserves every field of a mixed-state village', () {
      final records = [
        sampleRecord(
          'c1',
          serverId: 77,
          syncVersion: 3,
          dirty: false,
          houseNo: 'အိမ်-၁၂',
        ),
        sampleRecord('c2', dirty: true),
        sampleRecord('c3', serverId: 88, syncVersion: 1, deleted: true),
      ];

      final bytes = VillageExcel.buildBytes(records, wvName: 'နမူနာရွာ');
      final parsed = VillageExcel.parse(bytes);

      expect(parsed.wvCode, 'WV001');
      expect(parsed.wvName, 'နမူနာရွာ');
      expect(parsed.records, hasLength(3));

      for (var i = 0; i < records.length; i += 1) {
        final original = records[i];
        final restored = parsed.records[i];
        expect(restored.localRowId, original.localRowId);
        expect(restored.serverSurveyId, original.serverSurveyId);
        expect(restored.serverSyncVersion, original.serverSyncVersion);
        expect(restored.wvCode, original.wvCode);
        expect(restored.houseNo, original.houseNo);
        expect(restored.headName, original.headName);
        expect(restored.gender, original.gender);
        expect(restored.education, original.education);
        expect(restored.phone, original.phone);
        expect(restored.age, original.age);
        expect(restored.answerDate, original.answerDate);
        expect(restored.deleted, original.deleted);
        expect(restored.dirty, original.dirty);
        expect(
          restored.animals.map(animalKey),
          original.animals.map(animalKey),
        );
      }
    });

    test('blank wvCode rows inherit the village found in the file', () {
      final records = [
        sampleRecord('a', wvCode: 'WV002'),
        sampleRecord('b', wvCode: ''),
      ];
      final parsed =
          VillageExcel.parse(VillageExcel.buildBytes(records, wvName: 'X'));
      expect(parsed.wvCode, 'WV002');
      expect(parsed.records.map((r) => r.wvCode), ['WV002', 'WV002']);
    });

    test('a backup without any village code keeps codes blank', () {
      final records = [sampleRecord('a', wvCode: '')];
      final parsed = VillageExcel.parse(VillageExcel.buildBytes(records));
      expect(parsed.wvCode, '');
      expect(parsed.records.single.wvCode, '');
    });

    test('an empty village file still exports headers and re-imports', () {
      final bytes = VillageExcel.buildBytes(const [], wvName: 'X');
      final parsed = VillageExcel.parse(bytes);
      expect(parsed.records, isEmpty);
      expect(parsed.wvCode, '');
    });
  });

  group('VillageExcel import errors', () {
    test('rejects bytes that are not a spreadsheet', () {
      expect(
        () => VillageExcel.parse([1, 2, 3, 4, 5]),
        throwsA(
          isA<ExcelFormatException>().having(
            (e) => e.errors.first,
            'first message',
            contains('မဖတ်နိုင်'),
          ),
        ),
      );
    });

    test('rejects a workbook without the households sheet', () {
      final bytes = rawWorkbook(
        sheetName: 'Sheet1',
        rows: [
          [TextCellValue('localRowId')],
        ],
      );
      expect(
        () => VillageExcel.parse(bytes),
        throwsA(
          isA<ExcelFormatException>().having(
            (e) => e.errors.first,
            'first message',
            contains('households'),
          ),
        ),
      );
    });

    test('rejects missing required headers', () {
      final bytes = rawWorkbook(
        sheetName: 'households',
        rows: [
          [
            TextCellValue('localRowId'),
            TextCellValue('headName'),
          ],
          [
            TextCellValue('a'),
            TextCellValue('အိမ်ထောင်ရှင်'),
          ],
        ],
      );
      expect(
        () => VillageExcel.parse(bytes),
        throwsA(
          isA<ExcelFormatException>().having(
            (e) => e.errors.join('\n'),
            'messages',
            allOf(contains('phone'), contains('answerDate')),
          ),
        ),
      );
    });

    test('rejects duplicate localRowId', () {
      final bytes =
          VillageExcel.buildBytes([sampleRecord('a'), sampleRecord('a')]);
      expect(
        () => VillageExcel.parse(bytes),
        throwsA(
          isA<ExcelFormatException>().having(
            (e) => e.errors.join('\n'),
            'messages',
            contains('ထပ်နေသည်'),
          ),
        ),
      );
    });

    test('rejects files mixing several village codes', () {
      final bytes = VillageExcel.buildBytes([
        sampleRecord('a', wvCode: 'WV001'),
        sampleRecord('b', wvCode: 'WV002'),
      ]);
      expect(
        () => VillageExcel.parse(bytes),
        throwsA(
          isA<ExcelFormatException>().having(
            (e) => e.errors.join('\n'),
            'messages',
            contains('ရွာကုဒ်'),
          ),
        ),
      );
    });

    test('rejects rows failing upload validation', () {
      final badPhone = HouseholdRecord(
        localRowId: 'a',
        wvCode: 'WV001',
        headName: 'အိမ်ထောင်ရှင်',
        gender: 'အမ',
        education: 'မူလတန်း',
        phone: 'abc',
        age: 30,
        answerDate: DateTime(2026, 1, 1),
      );
      final bytes = VillageExcel.buildBytes([badPhone]);
      expect(
        () => VillageExcel.parse(bytes),
        throwsA(
          isA<ExcelFormatException>().having(
            (e) => e.errors.join('\n'),
            'messages',
            contains('ဖုန်းနံပါတ်'),
          ),
        ),
      );
    });

    test('rejects unknown animal group codes', () {
      final bytes = VillageExcel.buildBytes([
        sampleRecord('a', animals: const [
          AnimalEntry(
            group: 'dragons',
            categoryId: 999,
            ageLimit: '',
            sex: 'male',
            count: 1,
          ),
        ]),
      ]);
      expect(
        () => VillageExcel.parse(bytes),
        throwsA(
          isA<ExcelFormatException>().having(
            (e) => e.errors.join('\n'),
            'messages',
            contains('group'),
          ),
        ),
      );
    });

    test('rejects animal rows that reference a missing household', () {
      final valid = VillageExcel.buildBytes([sampleRecord('a')]);
      final excel = Excel.decodeBytes(valid);
      excel['animals'].appendRow([
        TextCellValue('ghost'),
        TextCellValue('big'),
        IntCellValue(101),
        TextCellValue('Over3'),
        TextCellValue('male'),
        IntCellValue(1),
      ]);
      final bytes = excel.save()!;
      expect(
        () => VillageExcel.parse(bytes),
        throwsA(
          isA<ExcelFormatException>().having(
            (e) => e.errors.join('\n'),
            'messages',
            contains('ghost'),
          ),
        ),
      );
    });

    test('rejects malformed age and answerDate cells', () {
      final bytes = rawWorkbook(
        sheetName: 'households',
        rows: [
          [
            TextCellValue('localRowId'),
            TextCellValue('headName'),
            TextCellValue('gender'),
            TextCellValue('education'),
            TextCellValue('phone'),
            TextCellValue('age'),
            TextCellValue('answerDate'),
          ],
          [
            TextCellValue('a'),
            TextCellValue('အိမ်ထောင်ရှင်'),
            TextCellValue('အမ'),
            TextCellValue('မူလတန်း'),
            TextCellValue('0912345678'),
            TextCellValue('ငါး'),
            TextCellValue('2026-10-08'),
          ],
          [
            TextCellValue('b'),
            TextCellValue('အိမ်ထောင်ရှင်'),
            TextCellValue('အမ'),
            TextCellValue('မူလတန်း'),
            TextCellValue('0912345678'),
            IntCellValue(30),
            TextCellValue('08/10/2026'),
          ],
        ],
      );
      expect(
        () => VillageExcel.parse(bytes),
        throwsA(
          isA<ExcelFormatException>().having(
            (e) => e.errors.join('\n'),
            'messages',
            allOf(contains('age ဂဏန်း'), contains('answerDate')),
          ),
        ),
      );
    });
  });
}
