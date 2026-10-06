const express = require('express');
const locationController = require('../controllers/locationController');
const validate = require('../middleware/validate');
const { listTownvgsSchema, listWardvillagesSchema } = require('../validators/location.validator');

const router = express.Router();

router.get('/townships', locationController.getTownships);
router.get('/townvgs', validate(listTownvgsSchema), locationController.getTownvgs);
router.get('/wardvillages', validate(listWardvillagesSchema), locationController.getWardvillages);

module.exports = router;
