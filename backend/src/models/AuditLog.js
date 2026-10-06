const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    timestamp: { type: Date, default: Date.now },
    action: { type: String },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String },
    method: { type: String },
    path: { type: String },
    status: { type: Number },
    ip: { type: String },
    userAgent: { type: String },
    requestId: { type: String }
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });
auditLogSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
