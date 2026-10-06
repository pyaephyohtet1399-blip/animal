process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-access-secret-0123456789abcdef0123456789abcdef';
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-0123456789abcdef0123456789abcdef';
process.env.JWT_ACCESS_TTL = process.env.JWT_ACCESS_TTL || '15m';
process.env.JWT_REFRESH_TTL = process.env.JWT_REFRESH_TTL || '7d';
process.env.RATE_LIMIT_WINDOW_MS = process.env.RATE_LIMIT_WINDOW_MS || '60000';
process.env.RATE_LIMIT_ANON_MAX = process.env.RATE_LIMIT_ANON_MAX || '10000';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/livestock-test';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
