const { EmbedBuilder, Discord } = require("discord.js");

module.exports = {
  name: "ping",
  description: "丨Affiche la latence du serveur",
  dm: false,

  async execute(bot, message) {
    const channel = message.guild.channels.cache.get("818640158693392405");
    const TicketEmbed = new EmbedBuilder()
      .setColor("Orange")
      .setTitle(`――――――∈ Nouveau Système de Daily ! ∋――――――`)
      .setDescription(
        `\nLe <#${channel.id}>`
      );

    message.reply({ embeds: [TicketEmbed] });
  },
};
