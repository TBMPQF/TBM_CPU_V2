const mongoose = require('mongoose');

const musicSchema = new mongoose.Schema({
  serverId: String,
  messageId: String,
  channelId: String,
}, { versionKey: false});

module.exports = mongoose.model('Music', musicSchema);