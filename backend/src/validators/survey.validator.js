const { z } = require('zod');
const { STATUSES } = require('../constants/surveyStatus');
const { AGE_LIMITS } = require('../constants/ageLimits');

const BIG_AGE = z.enum(AGE_LIMITS.bigAnimals);
const SMALL_AGE = z.enum(AGE_LIMITS.smallAnimals);
const POULTRY_AGE = z.enum(AGE_LIMITS.poultry);
const BIG_SEX = z.enum(['male', 'ca_male', 'female']);
const POULTRY_SEX = z.enum(['male', 'female']);

const bigAnimalSchema = z.object({
  categoryId: z.number().int().positive(),
  ageLimit: BIG_AGE,
  sex: BIG_SEX,
  count: z.number().int().min(0).max(99999)
});

const smallAnimalSchema = z.object({
  categoryId: z.number().int().positive(),
  ageLimit: SMALL_AGE,
  sex: BIG_SEX,
  count: z.number().int().min(0).max(99999)
});

const poultryAnimalSchema = z.object({
  categoryId: z.number().int().positive(),
  ageLimit: POULTRY_AGE,
  sex: POULTRY_SEX,
  count: z.number().int().min(0).max(99999)
});

const BREEDING_SEX = z.enum(['male', 'female']);

const breedingAnimalSchema = z.object({
  categoryId: z.number().int().positive(),
  sex: BREEDING_SEX,
  count: z.number().int().min(0).max(99999)
});

const interviewShape = {
  hName: z.string().trim().min(1).max(70),
  hEdu: z.string().trim().min(1).max(50),
  hGender: z.string().trim().min(1).max(20),
  hPhone: z
    .string()
    .trim()
    .min(5)
    .max(20)
    .regex(/^[0-9+\-() ]+$/, 'Invalid phone format'),
  hAge: z.number().int().min(0).max(150),
  ansDate: z.coerce.date()
};

const animalListsShape = {
  bigAnimals: z.array(bigAnimalSchema).max(100).default([]),
  smallAnimals: z.array(smallAnimalSchema).max(100).default([]),
  poultry: z.array(poultryAnimalSchema).max(100).default([]),
  breedingAnimals: z.array(breedingAnimalSchema).max(100).default([])
};

const surveyBodySchema = z.object({
  ...interviewShape,
  ...animalListsShape
});

const createSurveySchema = z.object({ body: surveyBodySchema });
const updateSurveySchema = createSurveySchema;

const surveyIdParamSchema = z.object({
  params: z.object({ surveyId: z.coerce.number().int().positive() })
});

const toUndefined = (value) => (value === '' ? undefined : value);

const listQuerySchema = z.object({
  query: z
    .object({
      page: z.coerce.number().int().min(1).default(1),
      per_page: z.coerce.number().int().min(1).max(100).default(20),
      sort: z
        .string()
        .refine(
          (v) =>
            [
              'createdAt',
              '-createdAt',
              'updatedAt',
              '-updatedAt',
              'surveyId',
              '-surveyId'
            ].includes(v),
          'Invalid sort field'
        )
        .default('-createdAt'),
      status: z.enum(STATUSES).optional(),
      hasBreeding: z.preprocess(
        toUndefined,
        z
          .enum(['true', 'false'])
          .transform((value) => value === 'true')
          .optional()
      ),
      search: z.preprocess(
        toUndefined,
        z.string().trim().max(100).optional()
      )
    })
    .default({})
});

module.exports = {
  createSurveySchema,
  updateSurveySchema,
  surveyIdParamSchema,
  listQuerySchema,
  surveyBodySchema,
  interviewShape,
  animalListsShape,
  bigAnimalSchema,
  smallAnimalSchema,
  breedingAnimalSchema
};
