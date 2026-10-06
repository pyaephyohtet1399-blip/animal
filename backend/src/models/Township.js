const mongoose = require('mongoose');

const townshipSchema = new mongoose.Schema(
  {
    tspCode: { type: String, required: true, unique: true, trim: true },
    tspName: { type: String, required: true, trim: true },
    districtCode: { type: String, required: true, index: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Township', townshipSchema);
