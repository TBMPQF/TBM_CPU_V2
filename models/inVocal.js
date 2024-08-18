const mongoose = require('mongoose');

const inVocalSchema = new mongoose.Schema({
  discordId: { type: String, required: true },
  serverId: { type: String, required: true },
  username: { type: String, required: true },
  vocalName: { type: String, required: true },
  joinTimestamp: { type: Date, default: Date.now }
}, { versionKey: false, strict: true });

module.exports = mongoose.model('InVocal', inVocalSchema, 'In Vocals');
