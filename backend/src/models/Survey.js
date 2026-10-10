const mongoose = require('mongoose');
const { AGE_LIMITS } = require('../constants/ageLimits');

const bigAnimalSchema = new mongoose.Schema({
  categoryId: { type: Number, required: true, ref: 'BigAnimalCategory' },
  ageLimit: { type: String, enum: AGE_LIMITS.bigAnimals, required: true },
  sex: { type: String, enum: ['male', 'ca_male', 'female'], required: true },
  count: { type: Number, min: 0, default: 0 }
});

const smallAnimalSchema = new mongoose.Schema({
  categoryId: { type: Number, required: true, ref: 'SmallAnimalCategory' },
  ageLimit: { type: String, enum: AGE_LIMITS.smallAnimals, required: true },
  sex: { type: String, enum: ['male', 'ca_male', 'female'], required: true },
  count: { type: Number, min: 0, default: 0 }
});

const poultrySchema = new mongoose.Schema({
  categoryId: { type: Number, required: true, ref: 'PoultryCategory' },
  ageLimit: { type: String, enum: AGE_LIMITS.poultry, required: true },
  sex: { type: String, enum: ['male', 'female'], required: true },
  count: { type: Number, min: 0, default: 0 }
});

const breedingAnimalSchema = new mongoose.Schema({
  categoryId: { type: Number, required: true, ref: 'BreedingCategory' },
  sex: { type: String, enum: ['male', 'female'], required: true },
  count: { type: Number, min: 0, default: 0 }
});

const surveySchema = new mongoose.Schema(
  {
    surveyId: { type: Number, required: true, unique: true },
    interviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewInfo', required: true },
    villageHeadmanId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: ['draft', 'submitted'],
      default: 'draft'
    },
    districtCode: { type: String, required: true, index: true },
    tspCode: { type: String, required: true, index: true },
    tvgCode: { type: String, required: true },
    wvCode: { type: String, required: true, index: true },
    syncVersion: { type: Number, default: 0 },
    deletedAt: { type: Date, default: null, index: true },
    interviewerName: { type: String, trim: true },
    interviewerPhone: { type: String, trim: true },
    bigAnimals: [bigAnimalSchema],
    smallAnimals: [smallAnimalSchema],
    poultry: [poultrySchema],
    breedingAnimals: { type: [breedingAnimalSchema], default: [] },
    hasBreeding: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

surveySchema.index({ status: 1 });
surveySchema.index({ tspCode: 1, status: 1 });
surveySchema.index({ wvCode: 1, status: 1 });
surveySchema.index({ 'bigAnimals.categoryId': 1 });
surveySchema.index({ 'smallAnimals.categoryId': 1 });
surveySchema.index({ 'poultry.categoryId': 1 });
surveySchema.index({ 'breedingAnimals.categoryId': 1 });
surveySchema.index({ deletedAt: 1, createdAt: -1 });

module.exports = mongoose.model('Survey', surveySchema);
