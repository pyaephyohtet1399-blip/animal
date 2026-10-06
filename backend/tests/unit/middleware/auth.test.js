const jwt = require('jsonwebtoken');
const { authenticate } = require('../../../src/middleware/auth');

const sign = (payload, options = {}) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m', ...options });

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('authenticate', () => {
  test('sets req.user from valid Bearer token', () => {
    const token = sign({ userId: 'u1', role: 'village', mustChangePassword: false });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const next = jest.fn();
    authenticate(req, mockRes(), next);
    expect(next).toHaveBeenCalledWith();
    expect(req.user.userId).toBe('u1');
    expect(req.user.role).toBe('village');
  });

  test('rejects missing Authorization header', () => {
    const next = jest.fn();
    authenticate({ headers: {} }, mockRes(), next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401, code: 'unauthorized' }));
  });

  test('rejects wrong scheme', () => {
    const next = jest.fn();
    authenticate({ headers: { authorization: 'Basic abc' } }, mockRes(), next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  test('rejects invalid token', () => {
    const next = jest.fn();
    authenticate({ headers: { authorization: 'Bearer not-a-token' } }, mockRes(), next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401, code: 'unauthorized' }));
  });

  test('rejects expired token with expired message', () => {
    const token = sign({ userId: 'u1' }, { expiresIn: -10 });
    const next = jest.fn();
    authenticate({ headers: { authorization: `Bearer ${token}` } }, mockRes(), next);
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe('Access token expired');
  });
});
