const mongoose = require('mongoose');

const bingoSchema = new mongoose.Schema({
  serverID: { type: String, required: true },
  lastBingoTime: { type: Date, default: null },
  nextBingoTime: { type: Date, default: null },
  isActive: Boolean
}, { versionKey: false});

const Bingo = mongoose.model('Bingo', bingoSchema);

module.exports = Bingo;