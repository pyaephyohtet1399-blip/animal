const { z } = require('zod');
const validate = require('../../../src/middleware/validate');

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const schema = z.object({ body: z.object({ name: z.string().min(1) }) });

describe('validate middleware', () => {
  test('calls next on valid payload', () => {
    const next = jest.fn();
    validate(schema)({ body: { name: 'a' }, query: {}, params: {} }, makeRes(), next);
    expect(next).toHaveBeenCalledWith();
  });

  test('responds 422 with field details on invalid payload', () => {
    const next = jest.fn();
    const res = makeRes();
    validate(schema)({ body: {}, query: {}, params: {} }, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: 'validation_error',
        message: 'Request validation failed',
        details: [{ field: 'body.name', message: 'Required' }]
      }
    });
  });

  test('leaves request untouched', () => {
    const next = jest.fn();
    const req = { body: { name: 'keep' }, query: {}, params: {} };
    validate(schema)(req, makeRes(), next);
    expect(req.body.name).toBe('keep');
  });
});
