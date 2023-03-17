const { ActivityType } = require("discord.js");

module.exports = {
  name: "ready",
  execute(bot, member) {
    console.log(
      "\x1b[33m" + `${bot.user.username} connecté !\n` + "\x1b[33m" + ``
    );

    bot.channels.cache
      .get(`838440585341566996`)
      .send(`**Je viens tout juste de redémarrer.**`);

    setInterval(() => {
      bot.channels.cache
        .get(`717144491525406791`)
        .send(
          `@everyone. Bonjour à tous, n'oubliez pas de prendre votre \`Daily\``
        );
    }, 14400000);

    bot.user.setPresence({
      activities: [{ name: bot.config.activity, type: ActivityType.Playing }],
      status: "dnd",
    });
  },
};
