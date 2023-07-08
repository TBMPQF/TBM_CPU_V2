const mongoose = require('mongoose');

const serverConfigSchema = new mongoose.Schema({
  serverID: { type: String, required: true },
  serverName: { type: String, required: true },
  logChannelID: { type: String, default: null },
  logChannelName: { type: String, default: null },
  reglementChannelID: { type: String, default: null },
  reglementChannelName: { type: String, default: null },
  dailyChannelID: { type: String, default: null },
  dailyChannelName: { type: String, default: null },
  welcomeChannelID: { type: String, default: null },
  welcomeChannelName: { type: String, default: null },
  implicationsChannelID: { type: String, default: null },
  implicationsChannelName: { type: String, default: null },
  suggestionsChannelID: { type: String, default: null },
  suggestionsChannelName: { type: String, default: null },
  rolesChannelID: { type: String, default: null },
  rolesChannelName: { type: String, default: null },
  ticketChannelID: { type: String, default: null },
  ticketChannelName: { type: String, default: null },
}, { versionKey: false });

module.exports = mongoose.model('ServerConfig', serverConfigSchema, 'Serveur Channels');