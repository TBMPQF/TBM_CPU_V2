const mongoose = require('mongoose');

const bingoSchema = new mongoose.Schema({
  serverID: { type: String, required: true },
  serverName: { type: String, required: true },
  lastBingoTime: { type: Date, default: null },
  nextBingoTime: { type: Date, default: null },
  etat: {
    type: String,
    enum: ['ACTIF', 'INACTIF'],
    default: 'INACTIF'
  },
  bingoChannelName: { type: String, default: null }
}, { versionKey: false });

const Bingo = mongoose.model('Bingo', bingoSchema, 'Bingos');

module.exports = Bingo;