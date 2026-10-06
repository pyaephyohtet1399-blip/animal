jest.mock('mongoose');
jest.mock('ioredis');

const mongoose = require('mongoose');
const Redis = require('ioredis');
const { loadEnv } = require('../../src/config/env');
const { connectDB, MONGO_OPTIONS } = require('../../src/config/database');
const { createRedis } = require('../../src/config/redis');
const corsOptions = require('../../src/config/cors');

const setValidEnv = () => {
  process.env.NODE_ENV = 'test';
  process.env.MONGODB_URI = 'mongodb+srv://user:pass@cluster0.x.mongodb.net/db';
  process.env.REDIS_URL = 'redis://localhost:6379';
  process.env.JWT_SECRET = 'a'.repeat(32);
  process.env.JWT_REFRESH_SECRET = 'b'.repeat(32);
  process.env.ALLOWED_ORIGINS = 'http://localhost:3000,https://app.example.com';
};

describe('loadEnv', () => {
  beforeEach(() => setValidEnv());

  test('validates and writes normalized values to process.env', () => {
    delete process.env.PORT;
    const env = loadEnv();
    expect(env.PORT).toBe(3000);
    expect(process.env.PORT).toBe('3000');
    expect(env.MONGODB_URI).toContain('mongodb+srv');
  });

  test('throws with details on invalid env', () => {
    delete process.env.JWT_SECRET;
    expect(() => loadEnv()).toThrow('Invalid environment variables');
  });
});

describe('connectDB', () => {
  test('connects with pool options', async () => {
    mongoose.connect = jest.fn().mockResolvedValue(undefined);
    await connectDB('mongodb://localhost/test');
    expect(mongoose.connect).toHaveBeenCalledWith('mongodb://localhost/test', MONGO_OPTIONS);
    expect(MONGO_OPTIONS.maxPoolSize).toBe(50);
    expect(MONGO_OPTIONS.socketTimeoutMS).toBe(45000);
  });
});

describe('createRedis', () => {
  test('creates client with retry strategy and handlers', () => {
    const on = jest.fn();
    Redis.mockImplementation(() => ({ on }));
    const client = createRedis('redis://localhost:6379');
    expect(client).toBeDefined();
    expect(Redis).toHaveBeenCalledWith('redis://localhost:6379', expect.objectContaining({ maxRetriesPerRequest: 3 }));
    expect(on).toHaveBeenCalledWith('error', expect.any(Function));
    expect(on).toHaveBeenCalledWith('connect', expect.any(Function));
  });
});

describe('corsOptions', () => {
  test('allows listed origin', (done) => {
    corsOptions.origin('http://localhost:3000', (err, allowed) => {
      expect(err).toBeNull();
      expect(allowed).toBe(true);
      done();
    });
  });

  test('allows request without origin (mobile/native)', (done) => {
    corsOptions.origin(undefined, (err, allowed) => {
      expect(err).toBeNull();
      expect(allowed).toBe(true);
      done();
    });
  });

  test('blocks unknown origin', (done) => {
    corsOptions.origin('https://evil.example.com', (err) => {
      expect(err).toBeInstanceOf(Error);
      done();
    });
  });

  test('exposes sync headers and methods', () => {
    expect(corsOptions.methods).toEqual(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
    expect(corsOptions.allowedHeaders).toEqual([
      'Content-Type',
      'Authorization',
      'Idempotency-Key',
      'X-Request-Id'
    ]);
  });
});
