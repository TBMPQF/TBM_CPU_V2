const Discord = require("discord.js");

module.exports = {
  name: "ping",
  description: "丨Affiche la latence du serveur",
  permission: Discord.PermissionFlagsBits.ManageChannels,
  category: "⚙️ Outils",
  dm: false,

  async execute(bot, message) {
    try {
      let EmbedPing = new Discord.EmbedBuilder()
        .setDescription(`Ping actuel : \`${bot.ws.ping}\` ms 🛰️`)
        .setColor("#b3c7ff");

      message.reply({ embeds: [EmbedPing] });
    } catch (err) {
      console.log(err);
    }
  },
};
