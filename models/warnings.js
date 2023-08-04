const mongoose = require('mongoose');

const warningSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    userName: { type: String, required: true },
    guildName: { type: String, required: true },
    warnings: { type: Number, default: 0 },
});

module.exports = mongoose.model('Warning', warningSchema);