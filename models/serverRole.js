const mongoose = require('mongoose');

const serverRoleSchema = new mongoose.Schema({
  serverID: { type: String, required: true },
  serverName: { type: String, required: true },
  prestige0Roles: [{ type: String, required: true }],
  prestige1Roles: [{ type: String, required: true }],
  levels: [{
    level: String,
    roles: [String]
  }]
}, { versionKey: false });

module.exports = mongoose.model('ServerRole', serverRoleSchema, 'Serveur Rôles');