const { ActivityType } = require("discord.js");

module.exports = {
  name: "ready",
  execute(bot) {
    console.log(
      "\x1b[33m" + `${bot.user.username} connecté !\n` + "\x1b[33m" + ``
    );

    bot.user.setPresence({
      activities: [{ name: bot.config.activity, type: ActivityType.Watching }],
      status: "dnd",
    });
  },
};
