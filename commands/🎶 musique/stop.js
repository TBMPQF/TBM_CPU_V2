const { EmbedBuilder } = require("discord.js");
const Discord = require("discord.js");

module.exports = {
  name: "stop",
  description: "丨Arrête la musique et déconnecte le bot du channel vocal.",
  permission: "Aucune",
  dm: false,

  async execute(interaction) {
    const queue = player.getQueue(interaction.guild.id);

    const NULL = new EmbedBuilder()
      .setColor("Purple")
      .setDescription(`Aucune musique en cours de lecture... ❌`);

    if (!queue || !queue.playing) return interaction.reply({ embeds: [NULL] });

    queue.destroy();

    const Good = new EmbedBuilder()
      .setColor("Purple")
      .setDescription(
        `La musique s'est arrêtée sur ce serveur, à la prochaine ✅`
      );

    interaction.reply({ embeds: [Good] });
  },
};
