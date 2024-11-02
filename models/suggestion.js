const mongoose = require('mongoose');

const suggestionSchema = new mongoose.Schema({
  messageID: {
    type: String,
    required: true,
  },
  userID: {
    type: String,
    required: true,
  },
  suggestionText: {
    type: String,
    required: true,
  },
  channelID: {
    type: String,
    required: true,
  },
  serverID: {
    type: String,
    required: true,
  },
  serverName: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  upvotes: {
    type: [String],
    default: []
  },
  downvotes: {
    type: [String],
    default: []
  }

}, { versionKey: false });

module.exports = mongoose.model('Suggestion', suggestionSchema, 'Suggestions');