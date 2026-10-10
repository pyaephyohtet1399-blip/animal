const { z } = require('zod');
const { interviewShape, animalListsShape } = require('./survey.validator');

const UPLOAD_FORMAT = 'animal-census/village-upload';
const UPLOAD_VERSION = 1;

const localRowIdSchema = z.union([
  z.number().int().min(1),
  z.string().trim().min(1).max(64)
]);

const contentHashSchema = z
  .string()
  .trim()
  .regex(/^[a-f0-9]{64}$/, 'contentHash must be a sha256 hex digest');

const surveyIdSchema = z.number().int().positive();
const syncVersionSchema = z.number().int().min(0);

const interviewSchema = z.object(interviewShape);
const surveySchema = z.object(animalListsShape);

const createRowSchema = z.object({
  localRowId: localRowIdSchema,
  action: z.literal('create'),
  interview: interviewSchema,
  survey: surveySchema
});

const updateRowSchema = z.object({
  localRowId: localRowIdSchema,
  action: z.literal('update'),
  surveyId: surveyIdSchema,
  syncVersion: syncVersionSchema,
  interview: interviewSchema,
  survey: surveySchema
});

const deleteRowSchema = z.object({
  localRowId: localRowIdSchema,
  action: z.literal('delete'),
  surveyId: surveyIdSchema,
  syncVersion: syncVersionSchema
});

const householdSchema = z.discriminatedUnion('action', [
  createRowSchema,
  updateRowSchema,
  deleteRowSchema
]);

const uploadEnvelopeSchema = z.object({
  format: z.literal(UPLOAD_FORMAT),
  version: z.literal(UPLOAD_VERSION),
  wvCode: z.string().trim().min(1).max(20),
  generatedAt: z.coerce.date(),
  device: z
    .object({
      id: z.string().trim().max(64).optional(),
      appVersion: z.string().trim().max(32).optional(),
      platform: z.string().trim().max(32).optional()
    })
    .optional(),
  interviewer: z
    .object({
      name: z.string().trim().max(70).optional(),
      phone: z
        .string()
        .trim()
        .max(20)
        .regex(/^[0-9+\-() ]*$/, 'Invalid phone format')
        .optional()
    })
    .optional(),
  counts: z.object({
    households: z.number().int().min(0),
    animals: z.number().int().min(0).max(9999999)
  }),
  households: z.array(householdSchema).min(1)
});

const uploadSchema = z.object({
  headers: z.object({
    'x-content-hash': z.preprocess(
      (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
      contentHashSchema.optional()
    ),
    'content-encoding': z.string().optional()
  }),
  body: uploadEnvelopeSchema
});

const uploadStatusParamsSchema = z.object({
  params: z.object({ contentHash: contentHashSchema })
});

module.exports = {
  UPLOAD_FORMAT,
  UPLOAD_VERSION,
  uploadEnvelopeSchema,
  uploadSchema,
  uploadStatusParamsSchema
};
