const { ActivityType, EmbedBuilder } = require("discord.js");

module.exports = {
  name: "ready",
  execute(bot, member) {
    console.log(
      "\x1b[33m" + `${bot.user.username} connecté !\n` + "\x1b[33m" + ``
    );

    //Log Connexion du bot
    const ConnectOK = new EmbedBuilder()
      .setDescription(`**Je viens tout juste de me connecter.**`)
      .setColor("White")
      .setTimestamp();
    bot.channels.cache.get("838440585341566996").send({ embeds: [ConnectOK] });

    //Interval d'un message pour rappeler le daily
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
      //Suppression de l'ancien message pour pas flood
      bot.channels.cache.get("818640158693392405").bulkDelete(1);
    }, 43200000);

    bot.user.setPresence({
      activities: [{ name: bot.config.activity, type: ActivityType.Playing }],
      status: "dnd",
    });
  },
};
