import 'package:flutter_test/flutter_test.dart';

import 'package:animalcensus/core/models/household.dart';
import 'package:animalcensus/core/sync/upload_payload.dart';

void main() {
  group('upload payload', () {
    test('actionFor maps row state to upload actions', () {
      final base = HouseholdRecord(
        localRowId: 'row-1',
        headName: 'A',
        gender: 'အထီး',
        education: 'အထက်တန်း',
        phone: '0942000000',
        age: 40,
        answerDate: DateTime(2026, 1, 15),
      );

      expect(actionFor(base), UploadAction.create);
      expect(actionFor(base.copyWith(deleted: true)), UploadAction.skip);

      final uploaded = base.copyWith(serverSurveyId: 7, serverSyncVersion: 1);
      expect(actionFor(uploaded), UploadAction.skip);
      expect(actionFor(uploaded.copyWith(dirty: true)), UploadAction.update);
      expect(actionFor(uploaded.copyWith(deleted: true)), UploadAction.delete);
    });

    test('payload is deterministic for identical input', () {
      final record = HouseholdRecord(
        localRowId: 'row-1',
        houseNo: '12/A',
        headName: 'ဒေါ်အေးအေး',
        gender: 'အမ',
        education: 'တက္ကသိုလ်ဝင်',
        phone: '0912345678',
        age: 35,
        answerDate: DateTime(2026, 2, 1),
        animals: const [
          AnimalEntry(
            group: 'big',
            categoryId: 101,
            ageLimit: 'Over3',
            sex: 'female',
            count: 3,
          ),
        ],
      );
      final generatedAt = DateTime.utc(2026, 3, 1, 10, 30);

      final first = buildUploadPayload(
        wvCode: 'WV001',
        records: [record],
        generatedAt: generatedAt,
      );
      final second = buildUploadPayload(
        wvCode: 'WV001',
        records: [record],
        generatedAt: generatedAt,
      );

      expect(first.contentHash, second.contentHash);
      expect(first.rowCount, 1);
      expect(first.envelope['format'], 'animal-census/village-upload');
      expect(first.envelope['wvCode'], 'WV001');
      expect(first.envelope['counts'], {'households': 1, 'animals': 3});
      expect(first.envelope['households'], [
        {
          'localRowId': 'row-1',
          'action': 'create',
          'interview': {
            'hName': 'ဒေါ်အေးအေး',
            'hNo': '12/A',
            'hEdu': 'တက္ကသိုလ်ဝင်',
            'hGender': 'အမ',
            'hPhone': '0912345678',
            'hAge': 35,
            'ansDate': '2026-02-01',
          },
          'survey': {
            'bigAnimals': [
              {'categoryId': 101, 'ageLimit': 'Over3', 'sex': 'female', 'count': 3},
            ],
            'smallAnimals': <dynamic>[],
            'poultry': <dynamic>[],
            'breedingAnimals': <dynamic>[],
          },
        },
      ]);
    });
  });

  group('village ownership', () {
    HouseholdRecord row({String wvCode = ''}) => HouseholdRecord(
          localRowId: 'row-1',
          wvCode: wvCode,
          headName: 'A',
          gender: 'အထီး',
          education: 'အထက်တန်း',
          phone: '0942000000',
          age: 40,
          answerDate: DateTime(2026, 1, 15),
        );

    test('ownedBy matches the signed-in village, legacy rows match any', () {
      expect(row(wvCode: 'WV001').ownedBy('WV001'), isTrue);
      expect(row(wvCode: 'WV001').ownedBy('WV002'), isFalse);
      expect(row().ownedBy('WV001'), isTrue);
      expect(row(wvCode: 'WV001').ownedBy(null), isTrue);
      expect(row(wvCode: 'WV001').ownedBy(''), isTrue);
    });

    test('isPendingUpload mirrors create/update/delete upload actions', () {
      expect(row().isPendingUpload, isTrue);
      expect(row().copyWith(deleted: true).isPendingUpload, isFalse);

      final uploaded = row().copyWith(serverSurveyId: 7, serverSyncVersion: 1);
      expect(uploaded.isPendingUpload, isFalse);
      expect(uploaded.copyWith(dirty: true).isPendingUpload, isTrue);
      expect(uploaded.copyWith(deleted: true).isPendingUpload, isTrue);
    });
  });
}
