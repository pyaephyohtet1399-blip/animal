const mongoose = require('mongoose');

const surveySummarySchema = new mongoose.Schema(
  {
    tspCode: { type: String, required: true },
    wvCode: { type: String, required: true },
    totalSurveys: { type: Number, default: 0 },
    totalBigAnimals: { type: Number, default: 0 },
    totalSmallAnimals: { type: Number, default: 0 },
    totalPoultry: { type: Number, default: 0 },
    totalBreedingAnimals: { type: Number, default: 0 },
    bigBreakdown: { type: Object, default: {} },
    smallBreakdown: { type: Object, default: {} },
    poultryBreakdown: { type: Object, default: {} },
    breedingBreakdown: { type: Object, default: {} },
    lastUpdated: { type: Date }
  },
  { timestamps: true }
);

surveySummarySchema.index({ tspCode: 1, wvCode: 1 }, { unique: true });

module.exports = mongoose.model('SurveySummary', surveySummarySchema);
