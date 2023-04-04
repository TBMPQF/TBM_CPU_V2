const mongoose = require("mongoose");

const experienceSchema = new mongoose.Schema({
  userId: String,
  username: String,
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  messages: { type: Number, default: 0},
});

const Experience = mongoose.model("Experience", experienceSchema);

module.exports = Experience;