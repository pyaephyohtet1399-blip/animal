const express = require('express');
const reportController = require('../controllers/reportController');
const validate = require('../middleware/validate');
const { requireRole } = require('../middleware/rbac');
const {
  drilldownSchema,
  townshipReportSchema,
  exportSchema
} = require('../validators/report.validator');

const router = express.Router();

router.get(
  '/district',
  requireRole('report:view_district'),
  reportController.districtReport
);
router.get(
  '/township/:tspCode',
  requireRole('report:view_township'),
  validate(townshipReportSchema),
  reportController.townshipReport
);
router.get(
  '/drilldown',
  requireRole('report:view_district'),
  validate(drilldownSchema),
  reportController.drilldown
);
router.get(
  '/district/:tspCode/export',
  requireRole('report:view_district_export'),
  validate(exportSchema),
  reportController.exportExcel
);

module.exports = router;
