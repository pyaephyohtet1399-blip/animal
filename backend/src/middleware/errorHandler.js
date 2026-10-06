const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof ApiError) {
    if (err.statusCode === 429 || err.statusCode === 503) {
      res.set('Retry-After', String(err.retryAfter || 30));
    }
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {})
      }
    });
  }

  if (err.name === 'ZodError') {
    return res.status(422).json({
      error: {
        code: 'validation_error',
        message: 'Request validation failed',
        details: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
      }
    });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: {
        code: 'validation_error',
        message: 'Validation failed',
        details: Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }))
      }
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      error: { code: 'validation_error', message: `Invalid value for ${err.path}` }
    });
  }

  if (err.code === 11000) {
    return res.status(409).json({
      error: { code: 'duplicate_entry', message: 'Duplicate entry found' }
    });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: { code: 'validation_error', message: 'Malformed JSON body' }
    });
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      error: { code: 'payload_too_large', message: 'Request body exceeds size limit' }
    });
  }

  if (err.message && err.message.includes('not allowed by CORS')) {
    return res.status(403).json({
      error: { code: 'forbidden', message: 'Origin not allowed' }
    });
  }

  const dependencyDown =
    err.name === 'MongooseServerSelectionError' ||
    err.name === 'MongoNetworkError' ||
    err.name === 'MongoServerSelectionError' ||
    /Connection is closed|stream isn't writeable|enableOfflineQueue/i.test(err.message || '');
  if (dependencyDown) {
    res.set('Retry-After', '30');
    return res.status(503).json({
      error: { code: 'service_unavailable', message: 'Service temporarily unavailable' }
    });
  }

  logger.error('Unexpected error', {
    requestId: req.id,
    message: err.message,
    stack: err.stack
  });
  return res.status(500).json({
    error: { code: 'internal_error', message: 'Internal server error' }
  });
};

module.exports = errorHandler;
