const mongoose = require('mongoose');

const vocalChannelSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    channelId: { type: String, required: true },
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, { versionKey: false, strict: true, collection: 'Apex Vocals' });

module.exports = mongoose.model('VocalChannel', vocalChannelSchema, 'Vocal Games');