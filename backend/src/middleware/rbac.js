const ApiError = require('../utils/apiError');

const ROLE_PERMISSIONS = {
  village: ['survey:create', 'survey:update', 'survey:delete', 'survey:submit'],
  township: ['survey:update', 'report:view_township'],
  district: [
    'survey:update',
    'survey:delete',
    'report:view_district',
    'report:view_district_export',
    'report:view_township',
    'admin:reset_password'
  ]
};

const requireRole = (permission) => (req, res, next) => {
  const permissions = req.user ? ROLE_PERMISSIONS[req.user.role] : undefined;
  if (!permissions || !permissions.includes(permission)) {
    return next(new ApiError(403, 'Insufficient permissions', 'forbidden'));
  }
  return next();
};

module.exports = { requireRole, ROLE_PERMISSIONS };
