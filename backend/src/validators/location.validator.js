const { z } = require('zod');

const locationCodeQuery = z.string().trim().min(1).max(15);

const listTownvgsSchema = z.object({
  query: z.object({ tspCode: locationCodeQuery.optional() })
});

const listWardvillagesSchema = z.object({
  query: z.object({ tvgCode: locationCodeQuery.optional() })
});

module.exports = { listTownvgsSchema, listWardvillagesSchema };
