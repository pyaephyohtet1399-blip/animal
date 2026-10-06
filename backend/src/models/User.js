const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    loginCode: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['district', 'township', 'village'], required: true },
    districtCode: { type: String },
    tspCode: { type: String },
    tvgCode: { type: String },
    wvCode: { type: String },
    isActive: { type: Boolean, default: true },
    mustChangePassword: { type: Boolean, default: false },
    lastLoginAt: Date
  },
  { timestamps: true }
);

userSchema.index({ tspCode: 1, tvgCode: 1, wvCode: 1 });

module.exports = mongoose.model('User', userSchema);
