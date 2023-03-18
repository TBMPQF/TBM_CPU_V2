const { ActivityType, EmbedBuilder } = require("discord.js");

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
      const DailyInterval = new EmbedBuilder()
        .setDescription(`@here. N'oubliez pas de récupérer votre \`Daily\` ! `)
        .setColor("Red")
        .setFooter({
          text: `丨`,
          iconURL: `${member.user.displayAvatarURL({
            dynamic: true,
            size: 512,
          })}`,
        })
        .setTimestamp();

      bot.channels.cache
        .get("811631297218347091")
        .send({ embeds: [DailyInterval] });
    }, 43200000);

    bot.user.setPresence({
      activities: [{ name: bot.config.activity, type: ActivityType.Playing }],
      status: "dnd",
    });
  },
};
