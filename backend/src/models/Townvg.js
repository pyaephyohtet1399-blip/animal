const mongoose = require('mongoose');

const townvgSchema = new mongoose.Schema(
  {
    tvgCode: { type: String, required: true, unique: true, trim: true },
    tvgName: { type: String, required: true, trim: true },
    tspCode: { type: String, required: true, index: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Townvg', townvgSchema);
