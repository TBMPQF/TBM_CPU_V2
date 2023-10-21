const mongoose = require('mongoose');

const apexStreamerSchema = new mongoose.Schema({
  discordId: {
    type: String,
    required: false,
    unique: true
  },
  discordUsername: {
    type: String,
    required: false,
    unique: true
  },
  discordServer: {
    type: String,
    required: false
  },
  twitchUsername: {
    type: String,
    required: true,
    unique: true
  },
  isLive: {
    type: Boolean,
    default: false
  },
  lastMessageId: {
    type: String,
    default: null
  },
  startedAt: {
    type: Date,
    default: null
  }
}, { versionKey: false, strict: true });

module.exports = mongoose.model('ApexStreamer', apexStreamerSchema, 'Apex Streamers');