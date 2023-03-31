const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  userID: { type: String, required: true },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 0 },
  messages: { type: String, default: 0 },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
