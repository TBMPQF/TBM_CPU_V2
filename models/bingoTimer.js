const mongoose = require('mongoose');

const bingoTimerSchema = new mongoose.Schema({
  serverID: { type: String, required: true },
  lastBingoTime: { type: Date, default: Date.now },
});

module.exports = mongoose.model('BingoTimer', bingoTimerSchema);