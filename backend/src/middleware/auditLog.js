const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const deriveAction = (req) => {
  const segments = req.path.split('/').filter(Boolean);
  const last = segments[segments.length - 1];
  if (['submit'].includes(last)) return last;
  if (req.method === 'DELETE') return 'delete';
  if (last === 'export') return 'export';
  return req.method.toLowerCase();
};

const auditLog = (req, res, next) => {
  res.on('finish', () => {
    if (!MUTATING_METHODS.has(req.method) && !req.path.endsWith('/export')) return;
    const entry = {
      action: req.auditAction || deriveAction(req),
      userId: req.user ? req.user.userId : undefined,
      role: req.user ? req.user.role : undefined,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      requestId: req.id
    };
    AuditLog.create(entry).catch((error) => {
      logger.error('Audit log write failed', { message: error.message, requestId: req.id });
    });
  });
  return next();
};

module.exports = auditLog;
