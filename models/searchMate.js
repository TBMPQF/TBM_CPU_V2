const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  userId:   { type: String, index: true, required: true },
  guildId:  { type: String, index: true, required: true },
  channelId:{ type: String, required: true },
  messageId:{ type: String, required: true },
  createdAt:{ type: Date, default: Date.now, index: true },
}, { versionKey: false });

schema.index({ createdAt: 1 }, { expireAfterSeconds: 35 * 60 });

module.exports = mongoose.model('SearchMateMessage', schema, 'Recherche Mate');