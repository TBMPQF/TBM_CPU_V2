const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userID: { type: String, required: true },
  username: { type: String, required: true },
  serverID: { type: String, required: true },
  serverName: { type: String, required: true },
  lastMessageDate: { type: Date, default: new Date() },
  xp: { type: Number, default : 0},
  level: { type: Number, default: 0 },
  messageCount: { type: Number, default: 0 },
  lastDaily: { type: Date, default: null },
  consecutiveDaily: { type: Number, default: 0 },
  maxDaily: {type: Number, default: 0},
});

userSchema.index({ userID: 1, serverID: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema, 'Levels');