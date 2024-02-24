const mongoose = require('mongoose');

const searchMateMessageSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    channelId: { type: String, required: true },
    messageId: { type: String, required: true },
    expireAt: {
        type: Date,
        default: () => Date.now() + 30*60*1000,
        index: { expires: '30m' }, 
    },
}, { versionKey: false, strict: true, collection: 'Recherche Mate' });

module.exports = mongoose.model('SearchMateMessage', searchMateMessageSchema);