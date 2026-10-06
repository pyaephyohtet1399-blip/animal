const express = require('express');
const categoryController = require('../controllers/categoryController');
const validate = require('../middleware/validate');
const { categoryTypeSchema, categorySingleSchema } = require('../validators/category.validator');

const router = express.Router();

router.get('/:type/:categoryId', validate(categorySingleSchema), categoryController.getCategory);
router.get('/:type', validate(categoryTypeSchema), categoryController.getCategories);

module.exports = router;
