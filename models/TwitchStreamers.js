const mongoose = require('mongoose');

const twitchStreamerSchema = new mongoose.Schema({
  twitchUsername: { type: String, required: true },
  discordUserID: { type: String, required: true },
  serverID: { type: String, required: true }, 
  serverName: { type: String, required: true },
  isLive: { type: Boolean, default: false },
  lastMessageId: { type: String, default: null },
  startedAt: { type: Date, default: null },
}, { versionKey: false, strict: true });

module.exports = mongoose.model('TwitchStreamers', twitchStreamerSchema, 'Twitch Streamers');