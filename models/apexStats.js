const mongoose = require('mongoose');

const ApexStatsSchema = new mongoose.Schema({
  discordId:     { type: String, required: true, index: true },
  username:      { type: String, required: true },
  server:        { type: String, required: true },
  platform:      { type: String, required: true },
  gameUsername:  { type: String, required: true },

  lastRankScore: { type: Number, default: null },

  dailyRpGained:  { type: Number, default: 0 },
  dailyResetAt:   { type: Date, default: null },

  weeklyRpGained: { type: Number, default: 0 },
  weeklyResetAt:  { type: Date, default: null },
  lastActivityAt: { type: Date, default: null },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.ApexStats
  || mongoose.model('ApexStats', ApexStatsSchema, 'Apex Stats');