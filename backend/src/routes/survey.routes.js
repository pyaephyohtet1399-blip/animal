const express = require('express');
const surveyController = require('../controllers/surveyController');
const validate = require('../middleware/validate');
const { requireRole } = require('../middleware/rbac');
const {
  createSurveySchema,
  updateSurveySchema,
  surveyIdParamSchema,
  listQuerySchema,
  detailsQuerySchema
} = require('../validators/survey.validator');

const router = express.Router();

router.get('/', validate(listQuerySchema), surveyController.list);
router.get('/details', validate(detailsQuerySchema), surveyController.getDetails);
router.get('/:surveyId', validate(surveyIdParamSchema), surveyController.getDetail);

router.post('/', requireRole('survey:create'), validate(createSurveySchema), surveyController.create);
router.put(
  '/:surveyId',
  requireRole('survey:update'),
  validate(updateSurveySchema),
  surveyController.update
);
router.delete(
  '/:surveyId',
  requireRole('survey:delete'),
  validate(surveyIdParamSchema),
  surveyController.remove
);

router.post(
  '/:surveyId/submit',
  requireRole('survey:submit'),
  validate(surveyIdParamSchema),
  surveyController.submit
);

module.exports = router;
