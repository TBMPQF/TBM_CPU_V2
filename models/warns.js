const mongoose = require('mongoose');

const warnSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    userName: { type: String, required: true },
    guildName: { type: String, required: true },
    warnings: { type: Number, default: 0 },
    muteEnd: { type: Date },
});

module.exports = mongoose.model('Warning', warnSchema, 'Warns');