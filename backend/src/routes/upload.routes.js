const express = require('express');
const uploadController = require('../controllers/uploadController');
const validate = require('../middleware/validate');
const { uploadSchema, uploadStatusParamsSchema } = require('../validators/upload.validator');

const router = express.Router();

const withLocalRowId = (issue, detail, req) => {
  const path = issue.path[0] === 'body' ? issue.path.slice(1) : issue.path;
  if (path[0] === 'households' && Number.isInteger(path[1])) {
    const rows = req.body && Array.isArray(req.body.households) ? req.body.households : [];
    const row = rows[path[1]];
    if (row && row.localRowId !== undefined) detail.localRowId = row.localRowId;
  }
  return detail;
};

router.post('/village', validate(uploadSchema, withLocalRowId), uploadController.upload);
router.get('/village/:contentHash', validate(uploadStatusParamsSchema), uploadController.status);

module.exports = router;
