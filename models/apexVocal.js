const mongoose = require('mongoose');

const vocalChannelSchema = new mongoose.Schema({
    userId: String,
    guildId: String,
    channelId: String,
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, { versionKey: false, strict: true, collection: 'Apex Vocals' });

module.exports = mongoose.model('VocalChannel', vocalChannelSchema);