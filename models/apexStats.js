const mongoose = require('mongoose');

const ApexStatsSchema = new mongoose.Schema(
  {
    discordId:   { type: String, required: true, index: true },
    username:    { type: String, required: true },
    server:      { type: String, required: true },
    platform:    { type: String, required: true },
    gameUsername:{ type: String, required: true },
    createdAt:   { type: Date,   default: Date.now }
  },
  { versionKey: false, strict: true }
);

module.exports = mongoose.models.ApexStats
  || mongoose.model('ApexStats', ApexStatsSchema, 'Apex Stats');