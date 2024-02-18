const mongoose = require('mongoose');

const serverConfigSchema = new mongoose.Schema({
  serverID: { type: String, required: true },
  serverName: { type: String, required: true },
  roleChannelID :{ type: String, default: null },
  roleChannelName: { type: String, default: null },
  logChannelID: { type: String, default: null },
  logChannelName: { type: String, default: null },
  reglementChannelID: { type: String, default: null },
  reglementChannelName: { type: String, default: null },
  dailyChannelID: { type: String, default: null },
  dailyChannelName: { type: String, default: null },
  welcomeChannelID: { type: String, default: null },
  welcomeChannelName: { type: String, default: null },
  roleWelcomeID: { type: String, default: null },
  roleWelcomeName: { type: String, default: null },
  implicationsChannelID: { type: String, default: null },
  implicationsChannelName: { type: String, default: null },
  suggestionsChannelID: { type: String, default: null },
  suggestionsChannelName: { type: String, default: null },
  ticketChannelID: { type: String, default: null },
  ticketChannelName: { type: String, default: null },
  ticketAdminRoleID : { type: String, default: null },
  ticketAdminRoleName : { type: String, default: null },
  roleReglementID : { type: String, default: null },
  roleReglementName : { type: String, default: null },
  bingoChannelName : { type: String, default: null },
  bingoChannelID : { type: String, default: null },
}, { versionKey: false, strict: true });

module.exports = mongoose.model('ServerConfig', serverConfigSchema, 'Serveur Channels');