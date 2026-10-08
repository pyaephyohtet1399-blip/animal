const mongoose = require('mongoose');

const countsSchema = new mongoose.Schema(
  {
    households: { type: Number, default: 0 },
    animals: { type: Number, default: 0 }
  },
  { _id: false }
);

const uploadReceiptSchema = new mongoose.Schema(
  {
    contentHash: { type: String, required: true },
    wvCode: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    format: { type: String, default: 'animal-census/village-upload' },
    version: { type: Number, default: 1 },
    fileSize: { type: Number, required: true },
    compressed: { type: Boolean, default: false },
    archivePath: { type: String },
    generatedAt: { type: Date },
    declaredCounts: { type: countsSchema, default: () => ({}) },
    storedCounts: { type: countsSchema, default: () => ({}) },
    accepted: { type: Number, default: 0 },
    created: { type: Number, default: 0 },
    updated: { type: Number, default: 0 },
    deleted: { type: Number, default: 0 },
    response: { type: Object, required: true },
    serverTime: { type: String }
  },
  { timestamps: true }
);

uploadReceiptSchema.index({ wvCode: 1, contentHash: 1 }, { unique: true });

module.exports = mongoose.model('UploadReceipt', uploadReceiptSchema);
