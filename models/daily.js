const mongoose = require("mongoose");

const dailySchema = new mongoose.Schema({
  userId: String,
  username: String,
  lastClaimed: { type: Date, default: Date.now() },
});

const Daily = mongoose.model("Daily", dailySchema);

module.exports = Daily;
