const express = require('express');
const statisticsController = require('../controllers/statisticsController');

const router = express.Router();

router.get('/overview', statisticsController.overview);

module.exports = router;
