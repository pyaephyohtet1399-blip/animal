const mongoose = require('mongoose');

const wardvillageSchema = new mongoose.Schema(
  {
    wvCode: { type: String, required: true, unique: true, trim: true },
    wvName: { type: String, required: true, trim: true },
    tvgCode: { type: String, required: true, index: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Wardvillage', wardvillageSchema);
