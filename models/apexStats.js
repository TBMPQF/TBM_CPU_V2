const mongoose = require('mongoose');

const apexStatsSchema = new mongoose.Schema({
  discordId: { type: String, required: true },
  username: { type: String, required: true },
  server: { type: String, required: true },
  platform: { type: String, required: true },
  gameUsername: { type: String, required: true },
}, { versionKey: false, strict: true, collection: 'Apex Stats' });

module.exports = mongoose.model('ApexStats', apexStatsSchema);