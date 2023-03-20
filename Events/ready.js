const { ActivityType, EmbedBuilder } = require("discord.js");

module.exports = {
  name: "ready",
  execute(bot, member, message) {
    console.log(
      "\x1b[33m" + `${bot.user.username} connecté !\n` + "\x1b[33m" + ``
    );

    const ConnectOK = new EmbedBuilder()
      .setDescription(`**Je viens tout juste de me connecter.**`)
      .setColor("White")
      .setTimestamp();

    bot.channels.cache.get("838440585341566996").send({ embeds: [ConnectOK] });

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
        .get("818640158693392405")
        .send({ embeds: [DailyInterval] });

      bot.channels.cache.get("818640158693392405").bulkDelete(1);
    }, 14200000);

    bot.user.setPresence({
      activities: [{ name: bot.config.activity, type: ActivityType.Playing }],
      status: "dnd",
    });
  },
};
