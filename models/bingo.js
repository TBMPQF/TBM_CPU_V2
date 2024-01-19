const mongoose = require('mongoose');

const bingoSchema = new mongoose.Schema({
  serverID: { type: String, required: true }, // Assurez-vous d'ajouter le champ serverID
  lastBingoTime: { type: Date, default: null }, // Renommez startTime en lastBingoTime
  isActive: Boolean
}, { versionKey: false});

const Bingo = mongoose.model('Bingo', bingoSchema);

module.exports = Bingo;