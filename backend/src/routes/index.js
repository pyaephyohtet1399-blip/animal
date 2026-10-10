const express = require('express');

const { authenticate } = require('../middleware/auth');
const { rateLimitByRole } = require('../middleware/rateLimit');
const auditLog = require('../middleware/auditLog');
const authRoutes = require('./auth.routes');
const locationRoutes = require('./location.routes');
const categoryRoutes = require('./category.routes');
const surveyRoutes = require('./survey.routes');
const syncRoutes = require('./sync.routes');
const uploadRoutes = require('./upload.routes');
const reportRoutes = require('./report.routes');
const statisticsRoutes = require('./statistics.routes');

const router = express.Router();

router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

router.get('/', (req, res) => {
  res.json({ data: { service: 'livestock-survey-api', version: 'v1' } });
});

router.use('/auth', authRoutes);

const protectedChain = [authenticate, rateLimitByRole, auditLog];

router.use('/locations', ...protectedChain, locationRoutes);
router.use('/categories', ...protectedChain, categoryRoutes);
router.use('/surveys', ...protectedChain, surveyRoutes);
router.use('/sync', ...protectedChain, syncRoutes);
router.use('/upload', ...protectedChain, uploadRoutes);
router.use('/reports', ...protectedChain, reportRoutes);
router.use('/statistics', ...protectedChain, statisticsRoutes);

module.exports = router;
