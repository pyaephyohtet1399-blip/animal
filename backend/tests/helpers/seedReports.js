const Township = require('../../src/models/Township');
const Townvg = require('../../src/models/Townvg');
const Wardvillage = require('../../src/models/Wardvillage');
const InterviewInfo = require('../../src/models/InterviewInfo');
const Survey = require('../../src/models/Survey');
const summaryService = require('../../src/services/summaryService');

const REPORT_TSP_A = 'MMR010031';
const REPORT_TSP_B = 'MMR010028';
const REPORT_DISTRICT = 'MMR0100';
const OTHER_TSP = 'MMR020031';
const OTHER_DISTRICT = 'MMR0200';
const WV_A = '194657';
const WV_B = '194660';
const WV_C = '194700';
const WV_X = '888888';

const seedReportData = async () => {
  await Township.insertMany([
    { tspCode: REPORT_TSP_A, tspName: 'ဝမ်းတွင်း', districtCode: REPORT_DISTRICT },
    { tspCode: REPORT_TSP_B, tspName: 'မိတ္ထီလာ', districtCode: REPORT_DISTRICT },
    { tspCode: OTHER_TSP, tspName: 'အခြားမြို့နယ်', districtCode: OTHER_DISTRICT }
  ]);
  await Townvg.insertMany([
    { tvgCode: 'MMR010031047', tvgName: 'ကျောင်းကုန်း', tspCode: REPORT_TSP_A },
    { tvgCode: 'MMR010028047', tvgName: 'မြို့သစ်', tspCode: REPORT_TSP_B },
    { tvgCode: 'MMR020031047', tvgName: 'အခြားကျေးရွာ', tspCode: OTHER_TSP }
  ]);
  await Wardvillage.insertMany([
    { wvCode: WV_A, wvName: 'ကျောင်းကုန်း', tvgCode: 'MMR010031047' },
    { wvCode: WV_B, wvName: 'ရွာသစ်', tvgCode: 'MMR010031047' },
    { wvCode: WV_C, wvName: 'မြောက်ရွာ', tvgCode: 'MMR010028047' },
    { wvCode: WV_X, wvName: 'အခြားရွာ', tvgCode: 'MMR020031047' }
  ]);

  const interviews = await InterviewInfo.insertMany([
    {
      interviewId: 1,
      hName: 'အိမ်တစ်',
      hEdu: 'ဘွဲ့',
      hGender: 'အထီး',
      hPhone: '09111111111',
      hAge: 40,
      ansDate: new Date('2026-01-10'),
      tspCode: REPORT_TSP_A,
      tvgCode: 'MMR010031047',
      wvCode: WV_A
    },
    {
      interviewId: 2,
      hName: 'အိမ်နှစ်',
      hEdu: 'တက္ကသိုလ်',
      hGender: 'အမျိုးသမီး',
      hPhone: '09222222222',
      hAge: 50,
      ansDate: new Date('2026-02-10'),
      tspCode: REPORT_TSP_A,
      tvgCode: 'MMR010031047',
      wvCode: WV_A
    },
    {
      interviewId: 3,
      hName: 'အိမ်သုံး',
      hEdu: 'အခြေခံ',
      hGender: 'အထီး',
      hPhone: '09333333333',
      hAge: 60,
      ansDate: new Date('2026-03-10'),
      tspCode: REPORT_TSP_A,
      tvgCode: 'MMR010031047',
      wvCode: WV_B
    },
    {
      interviewId: 4,
      hName: 'မပါဝင်သောအိမ်',
      hEdu: 'ဘွဲ့',
      hGender: 'အထီး',
      hPhone: '09444444444',
      hAge: 99,
      ansDate: new Date('2026-01-15'),
      tspCode: REPORT_TSP_A,
      tvgCode: 'MMR010031047',
      wvCode: WV_A
    },
    {
      interviewId: 5,
      hName: 'ဖျက်ပြီးအိမ်',
      hEdu: 'ဘွဲ့',
      hGender: 'အထီး',
      hPhone: '09555555555',
      hAge: 99,
      ansDate: new Date('2026-01-16'),
      tspCode: REPORT_TSP_A,
      tvgCode: 'MMR010031047',
      wvCode: WV_A
    },
    {
      interviewId: 6,
      hName: 'အခြားခရိုင်အိမ်',
      hEdu: 'ဘွဲ့',
      hGender: 'အမျိုးသမီး',
      hPhone: '09666666666',
      hAge: 30,
      ansDate: new Date('2026-01-20'),
      tspCode: OTHER_TSP,
      tvgCode: 'MMR020031047',
      wvCode: WV_X
    },
    {
      interviewId: 7,
      hName: 'မိတ္ထီလာအိမ်',
      hEdu: 'ဘွဲ့',
      hGender: 'အထီး',
      hPhone: '09777777777',
      hAge: 30,
      ansDate: new Date('2026-01-20'),
      tspCode: REPORT_TSP_B,
      tvgCode: 'MMR010028047',
      wvCode: WV_C
    }
  ]);

  const common = { villageHeadmanId: '64f1a2b3c4d5e6f7a8b9c0d1', syncVersion: 1 };
  await Survey.insertMany([
    {
      surveyId: 1,
      interviewId: interviews[0]._id,
      status: 'submitted',
      districtCode: REPORT_DISTRICT,
      tspCode: REPORT_TSP_A,
      tvgCode: 'MMR010031047',
      wvCode: WV_A,
      ...common,
      bigAnimals: [
        { categoryId: 1, ageLimit: 'LessThanOne', sex: 'male', count: 2 },
        { categoryId: 2, ageLimit: 'Over3', sex: 'female', count: 7 }
      ],
      smallAnimals: [{ categoryId: 3, ageLimit: 'Between2and6months', sex: 'male', count: 4 }],
      poultry: [{ categoryId: 1, ageLimit: 'Old', sex: 'female', count: 10 }],
      breedingAnimals: [
        { categoryId: 1, sex: 'male', count: 3 },
        { categoryId: 4, sex: 'female', count: 2 }
      ],
      hasBreeding: true
    },
    {
      surveyId: 2,
      interviewId: interviews[1]._id,
      status: 'submitted',
      districtCode: REPORT_DISTRICT,
      tspCode: REPORT_TSP_A,
      tvgCode: 'MMR010031047',
      wvCode: WV_A,
      ...common,
      bigAnimals: [{ categoryId: 1, ageLimit: 'LessThanOne', sex: 'female', count: 5 }],
      smallAnimals: [{ categoryId: 3, ageLimit: 'Under2months', sex: 'female', count: 2 }],
      poultry: [{ categoryId: 1, ageLimit: 'Young', sex: 'male', count: 6 }]
    },
    {
      surveyId: 3,
      interviewId: interviews[2]._id,
      status: 'submitted',
      districtCode: REPORT_DISTRICT,
      tspCode: REPORT_TSP_A,
      tvgCode: 'MMR010031047',
      wvCode: WV_B,
      ...common,
      bigAnimals: [{ categoryId: 2, ageLimit: 'Between1and3', sex: 'ca_male', count: 3 }],
      smallAnimals: [{ categoryId: 3, ageLimit: 'Under2months', sex: 'male', count: 1 }],
      poultry: [{ categoryId: 1, ageLimit: 'Young', sex: 'female', count: 8 }],
      breedingAnimals: [{ categoryId: 1, sex: 'female', count: 1 }],
      hasBreeding: true
    },
    {
      surveyId: 4,
      interviewId: interviews[3]._id,
      status: 'draft',
      districtCode: REPORT_DISTRICT,
      tspCode: REPORT_TSP_A,
      tvgCode: 'MMR010031047',
      wvCode: WV_A,
      ...common,
      bigAnimals: [{ categoryId: 1, ageLimit: 'Over3', sex: 'male', count: 100 }],
      smallAnimals: [{ categoryId: 3, ageLimit: 'Over6months', sex: 'male', count: 100 }],
      poultry: [{ categoryId: 1, ageLimit: 'Old', sex: 'male', count: 100 }]
    },
    {
      surveyId: 5,
      interviewId: interviews[4]._id,
      status: 'submitted',
      districtCode: REPORT_DISTRICT,
      tspCode: REPORT_TSP_A,
      tvgCode: 'MMR010031047',
      wvCode: WV_A,
      ...common,
      deletedAt: new Date('2026-04-01'),
      bigAnimals: [{ categoryId: 1, ageLimit: 'Over3', sex: 'male', count: 100 }],
      smallAnimals: [{ categoryId: 3, ageLimit: 'Over6months', sex: 'male', count: 100 }],
      poultry: [{ categoryId: 1, ageLimit: 'Old', sex: 'male', count: 100 }]
    },
    {
      surveyId: 6,
      interviewId: interviews[5]._id,
      status: 'submitted',
      districtCode: OTHER_DISTRICT,
      tspCode: OTHER_TSP,
      tvgCode: 'MMR020031047',
      wvCode: WV_X,
      ...common,
      bigAnimals: [{ categoryId: 1, ageLimit: 'LessThanOne', sex: 'male', count: 999 }],
      smallAnimals: [{ categoryId: 3, ageLimit: 'Under2months', sex: 'male', count: 999 }],
      poultry: [{ categoryId: 1, ageLimit: 'Young', sex: 'male', count: 999 }]
    },
    {
      surveyId: 7,
      interviewId: interviews[6]._id,
      status: 'submitted',
      districtCode: REPORT_DISTRICT,
      tspCode: REPORT_TSP_B,
      tvgCode: 'MMR010028047',
      wvCode: WV_C,
      ...common,
      bigAnimals: [{ categoryId: 1, ageLimit: 'Over3', sex: 'female', count: 4 }],
      smallAnimals: [{ categoryId: 3, ageLimit: 'Over6months', sex: 'male', count: 1 }],
      poultry: [{ categoryId: 1, ageLimit: 'Old', sex: 'male', count: 2 }]
    }
  ]);

  await summaryService.recomputeAll();
};

module.exports = { seedReportData, REPORT_TSP_A, REPORT_TSP_B, REPORT_DISTRICT, OTHER_TSP, OTHER_DISTRICT, WV_A, WV_B, WV_C, WV_X };
