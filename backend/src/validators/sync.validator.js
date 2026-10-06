const { z } = require('zod');
const mongoose = require('mongoose');
const { interviewShape, animalListsShape } = require('./survey.validator');

const MAX_BATCH = 50;
const PULL_TYPES = ['surveys', 'locations', 'categories'];
const PULL_LIMIT = 200;

const toUndefined = (value) => (value === '' ? undefined : value);

const localRowIdSchema = z.union([
  z.number().int().min(1),
  z.string().trim().min(1).max(64)
]);

const interviewSchema = z.object(interviewShape);
const surveyDataSchema = z.object(animalListsShape);

const createItemSchema = z.object({
  localRowId: localRowIdSchema,
  op: z.literal('create'),
  survey: surveyDataSchema,
  interview: interviewSchema
});

const updateItemSchema = z.object({
  localRowId: localRowIdSchema,
  op: z.literal('update'),
  surveyId: z.number().int().positive(),
  syncVersion: z.number().int().min(0),
  survey: surveyDataSchema.optional(),
  interview: interviewSchema.optional()
});

const submitItemSchema = z.object({
  localRowId: localRowIdSchema,
  op: z.literal('submit'),
  surveyId: z.number().int().positive()
});

const deleteItemSchema = z.object({
  localRowId: localRowIdSchema,
  op: z.literal('delete'),
  surveyId: z.number().int().positive()
});

const itemSchema = z
  .discriminatedUnion('op', [createItemSchema, updateItemSchema, submitItemSchema, deleteItemSchema])
  .refine((item) => item.op !== 'update' || item.survey !== undefined || item.interview !== undefined, {
    message: 'update requires survey or interview payload',
    path: ['survey']
  });

const pushSchema = z.object({
  headers: z.object({
    'idempotency-key': z.string().trim().uuid('Idempotency-Key must be a UUID')
  }),
  body: z.object({
    items: z
      .array(itemSchema)
      .min(1, 'items must not be empty')
      .max(MAX_BATCH, `Batch limited to ${MAX_BATCH} items`)
  })
});

const pullSchema = z.object({
  query: z
    .object({
      since: z.preprocess(toUndefined, z.coerce.date().optional()),
      types: z.preprocess(
        toUndefined,
        z.string()
          .optional()
          .transform((value) =>
            value === undefined ? undefined : [...new Set(value.split(',').map((t) => t.trim()))]
          )
          .refine(
            (list) => list === undefined || (list.length > 0 && list.every((t) => PULL_TYPES.includes(t))),
            'types must be a comma-separated list of surveys,locations,categories'
          )
      ),
      cursor: z.preprocess(
        toUndefined,
        z
          .string()
          .trim()
          .refine((value) => mongoose.isValidObjectId(value), 'Invalid cursor')
          .optional()
      )
    })
    .default({})
});

module.exports = {
  pushSchema,
  pullSchema,
  itemSchema,
  MAX_BATCH,
  PULL_TYPES,
  PULL_LIMIT
};
