const Discord = require("discord.js");

module.exports = {
  name: "infoxp",
  description: "丨𝐄nvoi l'embed d'information d'XP.",
  permission: Discord.PermissionFlagsBits.ManageGuild,
  category: "🔨 Création",
  dm: false,

  async execute(bot, message, args) {
    const infoXPEmbed = new Discord.EmbedBuilder()
      .setTitle(`――――――――∈ \`𝐒ystème d'𝐄xpérience \*V2\*\` ∋――――――――`)
      .setDescription(`Ping actuel : \`${bot.ws.ping}\` ms 🛰️`)
      .setColor("Orange")
      .setFooter({
        text: `Cordialement l'équipe ${message.guild.name}`,
        iconURL: message.guild.iconURL(),
      });
    message.reply({ embeds: [infoXPEmbed] });
  },
};
