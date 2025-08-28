const mongoose = require('mongoose');

const complianceQueueSchema = new mongoose.Schema({
  serverID:   { type: String, required: true },
  userID:     { type: String, required: true },
  joinedAt:   { type: Date,   required: true, default: Date.now },
  remindAt:   { type: Date,   required: true },
  deadlineAt: { type: Date,   required: true },
  reminded:   { type: Boolean, default: false },
}, { versionKey: false, strict: true });

complianceQueueSchema.index({ serverID: 1, userID: 1 }, { unique: true });

module.exports = mongoose.model('ComplianceQueue', complianceQueueSchema, 'Compliance Queue');
