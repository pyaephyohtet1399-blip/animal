const { z } = require('zod');

const categoryTypeSchema = z.object({
  params: z.object({ type: z.enum(['big', 'small', 'poultry', 'breeding']) })
});

const categorySingleSchema = z.object({
  params: z.object({
    type: z.enum(['big', 'small', 'poultry', 'breeding']),
    categoryId: z.coerce.number().int().positive()
  })
});

module.exports = { categoryTypeSchema, categorySingleSchema };
