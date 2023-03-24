const { ActivityType, EmbedBuilder } = require("discord.js");

module.exports = {
  name: "ready",
  execute(bot, member) {
    console.log(
      "\x1b[33m" + `${bot.user.username} connecté !\n` + "\x1b[33m" + ``
    );

    //Message de connexion du bot
    const channel = bot.channels.cache.get("838440585341566996");

    channel.messages.fetch({ limit: 100 }).then((messages) => {
      const connectMessages = messages.filter(
        (msg) =>
          msg.author.id === bot.user.id &&
          msg.embeds.length > 0 &&
          msg.embeds[0].description ===
            "**Je viens tout juste de me connecter.**"
      );

      if (connectMessages.size > 0) {
        channel.bulkDelete(connectMessages).then(() => {
          const ConnectOK = new EmbedBuilder()
            .setDescription(`**Je viens tout juste de me connecter.**`)
            .setColor("White")
            .setTimestamp();
          channel.send({ embeds: [ConnectOK] });
        });
      } else {
        const ConnectOK = new EmbedBuilder()
          .setDescription(`**Je viens tout juste de me connecter.**`)
          .setColor("White")
          .setTimestamp();
        channel.send({ embeds: [ConnectOK] });
      }
    });

    // Interval de messages pour le Daily.
    const channelDaily = bot.channels.cache.get("818640158693392405");
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
      channelDaily.send({ embeds: [DailyInterval] });
    }, 43201000);

    const channelId = "818640158693392405";
    const messageIdToKeep = "1087445497742114896";
    setInterval(async () => {
      const channel = await bot.channels.fetch(channelId);
      const messages = await channel.messages.fetch({ limit: 1 });
      messages.forEach(async (msg) => {
        if (msg.id !== messageIdToKeep) {
          await msg.delete();
        }
      });
    }, 43200000);

    //Activité du bot
    bot.user.setPresence({
      activities: [{ name: bot.config.activity, type: ActivityType.Playing }],
      status: "dnd",
    });
  },
};
