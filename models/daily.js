const mongoose = require("mongoose");

const dailySchema = new mongoose.Schema({
  userId: String,
  username: String,
  lastClaimed: { type: Date, default: Date.now() },
  dailyStreak: { type: Number, default: 1 },
});

const Daily = mongoose.model("Daily", dailySchema);

module.exports = Daily;
