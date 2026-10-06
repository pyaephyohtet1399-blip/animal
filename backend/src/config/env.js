const { z } = require('zod');
require('dotenv').config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3100),
  MONGODB_URI: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('7d'),
  ALLOWED_ORIGINS: z.string().default('http://localhost:3100'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
  BODY_LIMIT: z.string().default('1mb'),
  ID_COUNTER_RECONCILE_MINUTES: z.coerce.number().int().positive().default(30)
});

const loadEnv = () => {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid environment variables:\n${details}`);
  }
  Object.entries(parsed.data).forEach(([key, value]) => {
    process.env[key] = String(value);
  });
  return parsed.data;
};

module.exports = { envSchema, loadEnv };
