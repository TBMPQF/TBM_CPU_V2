const mongoose = require('mongoose');

const searchMateMessageSchema = new mongoose.Schema({
    userId: String,
    guildId: String,
    messageId: String,
    expireAt: {
        type: Date,
        default: Date.now,
        index: { expires: '1h' },
    },
}, { versionKey: false, strict: true });

module.exports = mongoose.model('SearchMateMessage', searchMateMessageSchema);