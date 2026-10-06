const mongoose = require('mongoose');

const smallAnimalCategorySchema = new mongoose.Schema(
  {
    categoryId: { type: Number, required: true, unique: true },
    name: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('SmallAnimalCategory', smallAnimalCategorySchema);
