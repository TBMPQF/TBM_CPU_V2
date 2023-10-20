const mongoose = require('mongoose');

const apexStreamerSchema = new mongoose.Schema({
  discordId: {
    type: String,
    required: true,
    unique: true
  },
  discordUsername: {
    type: String,
    required: true,
    unique: true
  },
  discordServer: {
    type: String,
    required: true
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
  }
}, { versionKey: false, strict: true });

module.exports = mongoose.model('ApexStreamer', apexStreamerSchema, 'Apex Streamers');