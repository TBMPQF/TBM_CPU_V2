const mongoose = require('mongoose');

const musicSchema = new mongoose.Schema({
  serverId: String,
  messageId: String,
});

module.exports = mongoose.model('Music', musicSchema);