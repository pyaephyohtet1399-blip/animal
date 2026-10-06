const { z } = require('zod');
const { AGE_LIMITS, AGE_RANKS } = require('../constants/ageLimits');

const ANIMAL_TYPES = ['bigAnimals', 'smallAnimals', 'poultry', 'breedingAnimals'];
const DRILLDOWN_LEVELS = ['township', 'village', 'household'];
const SEX_VALUES = ['male', 'ca_male', 'female'];
const POULTRY_SEX_VALUES = ['male', 'female'];
const ALL_AGES = [...AGE_LIMITS.bigAnimals, ...AGE_LIMITS.smallAnimals, ...AGE_LIMITS.poultry];

const CODE_RE = /^[A-Za-z0-9]+$/;

const toUndefined = (value) => (value === '' ? undefined : value);

const optionalCode = z.preprocess(toUndefined, z.string().trim().regex(CODE_RE, 'Invalid code').optional());

const dateRangeShape = {
  from: z.preprocess(toUndefined, z.coerce.date().optional()),
  to: z.preprocess(toUndefined, z.coerce.date().optional())
};

const addDateRangeIssue = (val, ctx) => {
  if (val.from && val.to && val.from > val.to) {
    ctx.addIssue({ code: 'custom', path: ['from'], message: 'from must not be after to' });
  }
};

const drilldownSchema = z.object({
  query: z
    .object({
      level: z.enum(DRILLDOWN_LEVELS),
      type: z.enum(ANIMAL_TYPES).default('bigAnimals'),
      categoryId: z.coerce.number().int().positive().optional(),
      ageFrom: z.preprocess(toUndefined, z.enum(ALL_AGES).optional()),
      ageTo: z.preprocess(toUndefined, z.enum(ALL_AGES).optional()),
      sex: z.preprocess(toUndefined, z.enum(SEX_VALUES).optional()),
      tspCode: optionalCode,
      wvCode: optionalCode,
      ...dateRangeShape,
      page: z.coerce.number().int().min(1).default(1),
      per_page: z.coerce.number().int().min(1).max(100).default(20)
    })
    .superRefine((val, ctx) => {
      if (val.type === 'breedingAnimals') {
        for (const key of ['ageFrom', 'ageTo']) {
          if (val[key]) {
            ctx.addIssue({ code: 'custom', path: [key], message: `${key} not supported for ${val.type}` });
          }
        }
      } else {
        const rank = AGE_RANKS[val.type];
        for (const key of ['ageFrom', 'ageTo']) {
          if (val[key] && !rank[val[key]]) {
            ctx.addIssue({ code: 'custom', path: [key], message: `${key} invalid for ${val.type}` });
          }
        }
        if (rank[val.ageFrom] && rank[val.ageTo] && rank[val.ageFrom] > rank[val.ageTo]) {
          ctx.addIssue({ code: 'custom', path: ['ageFrom'], message: 'ageFrom must not be after ageTo' });
        }
      }
      const allowedSex =
        val.type === 'poultry' || val.type === 'breedingAnimals' ? POULTRY_SEX_VALUES : SEX_VALUES;
      if (val.sex && !allowedSex.includes(val.sex)) {
        ctx.addIssue({ code: 'custom', path: ['sex'], message: `sex invalid for ${val.type}` });
      }
      if (val.level === 'village' && !val.tspCode) {
        ctx.addIssue({ code: 'custom', path: ['tspCode'], message: 'tspCode is required for level=village' });
      }
      if (val.level === 'household' && !val.wvCode) {
        ctx.addIssue({ code: 'custom', path: ['wvCode'], message: 'wvCode is required for level=household' });
      }
      addDateRangeIssue(val, ctx);
    })
});

const townshipReportSchema = z.object({
  params: z.object({ tspCode: z.string().trim().regex(CODE_RE, 'Invalid code') }),
  query: z.object(dateRangeShape).superRefine(addDateRangeIssue)
});

const exportSchema = z.object({
  params: z.object({ tspCode: z.string().trim().regex(CODE_RE, 'Invalid code') }),
  query: z.object(dateRangeShape).superRefine(addDateRangeIssue)
});

module.exports = {
  drilldownSchema,
  townshipReportSchema,
  exportSchema,
  ANIMAL_TYPES,
  DRILLDOWN_LEVELS
};
