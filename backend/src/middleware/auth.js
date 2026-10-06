const ApiError = require('../utils/apiError');
const { verifyAccessToken } = require('../utils/jwt');

const authenticate = (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return next(new ApiError(401, 'Authentication credentials are required', 'unauthorized'));
  }
  try {
    req.user = verifyAccessToken(token);
    return next();
  } catch (error) {
    const message = error.name === 'TokenExpiredError' ? 'Access token expired' : 'Invalid access token';
    return next(new ApiError(401, message, 'unauthorized'));
  }
};

module.exports = { authenticate };
