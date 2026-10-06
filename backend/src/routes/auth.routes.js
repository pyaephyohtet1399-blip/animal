const express = require('express');
const authController = require('../controllers/authController');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { anonLimiter } = require('../middleware/rateLimit');
const {
  loginSchema,
  refreshSchema,
  changePasswordSchema,
  resetPasswordSchema
} = require('../validators/auth.validator');

const router = express.Router();

router.post('/login', anonLimiter, validate(loginSchema), authController.login);
router.post('/refresh', anonLimiter, validate(refreshSchema), authController.refresh);
router.post('/logout', authenticate, validate(refreshSchema), authController.logout);
router.post(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  authController.changePassword
);
router.post(
  '/reset-password',
  authenticate,
  requireRole('admin:reset_password'),
  anonLimiter,
  validate(resetPasswordSchema),
  authController.resetPassword
);

module.exports = router;
