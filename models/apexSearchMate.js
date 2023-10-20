const mongoose = require('mongoose');

const searchMateMessageSchema = new mongoose.Schema({
    userId: String,
    guildId: String,
    channelId: String,
    messageId: String,
    expireAt: {
        type: Date,
        default: () => Date.now() + 30*60*1000,
        index: { expires: '30m' }, 
    },
}, { versionKey: false, strict: true, collection: 'Recherche Mate Apex' });

module.exports = mongoose.model('SearchMateMessage', searchMateMessageSchema);