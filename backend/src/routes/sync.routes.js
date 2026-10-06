const express = require('express');
const syncController = require('../controllers/syncController');
const validate = require('../middleware/validate');
const { pushSchema, pullSchema } = require('../validators/sync.validator');

const router = express.Router();

router.post('/push', validate(pushSchema), syncController.push);
router.get('/pull', validate(pullSchema), syncController.pull);

module.exports = router;
