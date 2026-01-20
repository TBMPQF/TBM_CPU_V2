const mongoose = require('mongoose');

const serverRoleMenuSchema = new mongoose.Schema(
  {
    serverID: {
      type: String,
      required: true,
      index: true
    },

    serverName: {
      type: String,
      required: true
    },

    menus: {
      type: [
        {
          menuName: {
            type: String,
            required: true
          },

          emoji: {
            type: String,
            default: null
          },

          roles: {
            type: [
              {
                roleName: {
                  type: String,
                  required: true
                },

                roleId: {
                  type: String,
                  required: true
                },

                displayName: {
                  type: String,
                  required: true
                }
              }
            ],
            default: []
          }
        }
      ],
      default: []
    }
  },
  {
    versionKey: false,
    strict: true
  }
);

module.exports = mongoose.model(
  'ServerRoleMenu',
  serverRoleMenuSchema,
  'Serveur Rôles Menu'
);
