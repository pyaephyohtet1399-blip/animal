const { envSchema } = require('../../src/config/env');

const validEnv = {
  MONGODB_URI: 'mongodb+srv://user:pass@cluster0.x.mongodb.net/db',
  REDIS_URL: 'redis://localhost:6379',
  JWT_SECRET: 'a'.repeat(32),
  JWT_REFRESH_SECRET: 'b'.repeat(32)
};

describe('envSchema', () => {
  test('accepts valid env with defaults', () => {
    const result = envSchema.safeParse(validEnv);
    expect(result.success).toBe(true);
    expect(result.data.PORT).toBe(3100);
    expect(result.data.JWT_ACCESS_TTL).toBe('15m');
    expect(result.data.JWT_REFRESH_TTL).toBe('7d');
    expect(result.data.RATE_LIMIT_WINDOW_MS).toBe(60000);
    expect(result.data.BODY_LIMIT).toBe('1mb');
    expect(result.data.ID_COUNTER_RECONCILE_MINUTES).toBe(30);
  });

  test('rejects missing JWT_SECRET', () => {
    const { JWT_SECRET, ...rest } = validEnv;
    expect(envSchema.safeParse(rest).success).toBe(false);
  });

  test('rejects short JWT_SECRET', () => {
    const result = envSchema.safeParse({ ...validEnv, JWT_SECRET: 'short' });
    expect(result.success).toBe(false);
  });

  test('rejects invalid MONGODB_URI', () => {
    const result = envSchema.safeParse({ ...validEnv, MONGODB_URI: 'not-a-url' });
    expect(result.success).toBe(false);
  });

  test('rejects invalid NODE_ENV', () => {
    const result = envSchema.safeParse({ ...validEnv, NODE_ENV: 'staging' });
    expect(result.success).toBe(false);
  });
});
