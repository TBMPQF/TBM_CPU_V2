const mongoose = require('mongoose');

const dynamicPrestigeFields = Array.from({ length: 11 }).reduce((acc, _, i) => {
  acc[`prestige${i}Roles`] = {
    type: Map,
    of: [String],
    default: () => new Map(),
  };
  return acc;
}, {});

const serverRoleSchema = new mongoose.Schema({
  serverID: { type: String, required: true },
  serverName: { type: String, required: true },
  ...dynamicPrestigeFields
}, { versionKey: false, strict: true });

module.exports = mongoose.model('ServerRole', serverRoleSchema, 'Serveur Rôles');