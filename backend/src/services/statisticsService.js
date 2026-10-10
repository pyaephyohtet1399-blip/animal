const Survey = require('../models/Survey');
const { buildSurveyScope } = require('../middleware/scope');

const overviewPipeline = (match) => [
  { $match: match },
  {
    $project: {
      rows: {
        $concatArrays: [
          {
            $map: {
              input: '$bigAnimals',
              as: 'a',
              in: {
                type: 'big',
                categoryId: '$$a.categoryId',
                ageLimit: '$$a.ageLimit',
                sex: '$$a.sex',
                count: '$$a.count'
              }
            }
          },
          {
            $map: {
              input: '$smallAnimals',
              as: 'a',
              in: {
                type: 'small',
                categoryId: '$$a.categoryId',
                ageLimit: '$$a.ageLimit',
                sex: '$$a.sex',
                count: '$$a.count'
              }
            }
          },
          {
            $map: {
              input: '$poultry',
              as: 'a',
              in: {
                type: 'poultry',
                categoryId: '$$a.categoryId',
                ageLimit: '$$a.ageLimit',
                sex: '$$a.sex',
                count: '$$a.count'
              }
            }
          },
          {
            $map: {
              input: '$breedingAnimals',
              as: 'a',
              in: {
                type: 'breeding',
                categoryId: '$$a.categoryId',
                ageLimit: null,
                sex: '$$a.sex',
                count: '$$a.count'
              }
            }
          }
        ]
      }
    }
  },
  { $unwind: '$rows' },
  {
    $group: {
      _id: {
        type: '$rows.type',
        categoryId: '$rows.categoryId',
        ageLimit: '$rows.ageLimit',
        sex: '$rows.sex'
      },
      count: { $sum: '$rows.count' }
    }
  },
  {
    $project: {
      _id: 0,
      type: '$_id.type',
      categoryId: '$_id.categoryId',
      ageLimit: '$_id.ageLimit',
      sex: '$_id.sex',
      count: 1
    }
  }
];

const overview = async (user) => {
  const match = { deletedAt: null, ...buildSurveyScope(user) };
  const [rows, interviewCount] = await Promise.all([
    Survey.aggregate(overviewPipeline(match)).allowDiskUse(true).exec(),
    Survey.countDocuments(match)
  ]);
  const livestockCount = rows.reduce((sum, row) => sum + row.count, 0);
  return { interviewCount, livestockCount, rows };
};

module.exports = { overview };
