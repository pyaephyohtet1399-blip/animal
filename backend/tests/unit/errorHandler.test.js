const request = require('supertest');
const express = require('express');
const ApiError = require('../../src/utils/apiError');
const errorHandler = require('../../src/middleware/errorHandler');
const notFound = require('../../src/middleware/notFound');
const requestId = require('../../src/middleware/requestId');

const buildApp = () => {
  const app = express();
  app.use(requestId);
  app.use(express.json());
  app.get('/api-error', (req, res, next) => {
    next(new ApiError(409, 'conflict', 'version_conflict'));
  });
  app.get('/api-error-details', (req, res, next) => {
    next(new ApiError(400, 'bad', 'validation_error', [{ field: 'hName', message: 'Required' }]));
  });
  app.get('/zod-error', (req, res, next) => {
    const err = new Error('validation failed');
    err.name = 'ZodError';
    err.issues = [{ path: ['hName'], message: 'Required' }];
    next(err);
  });
  app.get('/mongoose-validation', (req, res, next) => {
    const err = new Error('validation failed');
    err.name = 'ValidationError';
    err.errors = { hName: { path: 'hName', message: 'Required' } };
    next(err);
  });
  app.get('/cast-error', (req, res, next) => {
    const err = new Error('cast failed');
    err.name = 'CastError';
    err.path = '_id';
    next(err);
  });
  app.get('/duplicate', (req, res, next) => {
    const err = new Error('dup');
    err.code = 11000;
    next(err);
  });
  app.get('/malformed-json', (req, res, next) => {
    const err = new Error('parse');
    err.type = 'entity.parse.failed';
    next(err);
  });
  app.get('/unknown', (req, res, next) => {
    next(new Error('boom'));
  });
  app.use(notFound);
  app.use(errorHandler);
  return app;
};

const app = buildApp();

describe('errorHandler', () => {
  test('ApiError maps to status + code', async () => {
    const res = await request(app).get('/api-error');
    expect(res.status).toBe(409);
    expect(res.body.error).toEqual({ code: 'version_conflict', message: 'conflict' });
  });

  test('ApiError includes details when present', async () => {
    const res = await request(app).get('/api-error-details');
    expect(res.status).toBe(400);
    expect(res.body.error.details).toEqual([{ field: 'hName', message: 'Required' }]);
  });

  test('ZodError maps to 422 with details', async () => {
    const res = await request(app).get('/zod-error');
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('validation_error');
    expect(res.body.error.details).toEqual([{ field: 'hName', message: 'Required' }]);
  });

  test('Mongoose ValidationError maps to 400', async () => {
    const res = await request(app).get('/mongoose-validation');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('validation_error');
  });

  test('CastError maps to 400', async () => {
    const res = await request(app).get('/cast-error');
    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('_id');
  });

  test('E11000 maps to 409 duplicate_entry', async () => {
    const res = await request(app).get('/duplicate');
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('duplicate_entry');
  });

  test('malformed JSON maps to 400', async () => {
    const res = await request(app).get('/malformed-json');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('validation_error');
  });

  test('unknown error maps to 500 without stack leak', async () => {
    const res = await request(app).get('/unknown');
    expect(res.status).toBe(500);
    expect(res.body.error).toEqual({ code: 'internal_error', message: 'Internal server error' });
  });

  test('notFound returns 404 envelope', async () => {
    const res = await request(app).get('/missing');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('not_found');
  });

  test('requestId echoes X-Request-Id header', async () => {
    const res = await request(app).get('/missing').set('X-Request-Id', 'req-123');
    expect(res.headers['x-request-id']).toBe('req-123');
  });
});
