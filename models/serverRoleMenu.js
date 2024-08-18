const mongoose = require('mongoose');

const serverRoleMenuSchema = new mongoose.Schema({
  serverID: { type: String, required: true },
  serverName: { type: String, required: true },
  menus: [{
    menuName: { type: String, required: true },
    emoji: { type: String },
    roles: [{
      roleName: { type: String, required: true },
      roleId: { type: String, required: true }
    }]
  }]
}, { versionKey: false, strict: true });

module.exports = mongoose.model('ServerRoleMenu', serverRoleMenuSchema, 'Serveur Rôles Menu');
