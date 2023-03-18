const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "progression",
  description: "丨Voir la progression de la musique.",
  category: "Music",
  permission: "Aucune",
  dm: false,

  async execute(bot, interaction) {
    const queue = player.getQueue(interaction.guild.id);

    const NULL = new EmbedBuilder()
      .setColor("Purple")
      .setDescription(`Aucune musique en cours de lecture... ❌`);

    if (!queue || !queue.playing) return interaction.reply({ embeds: [NULL] });

    const progress = queue.createProgressBar();
    const timestamp = queue.getPlayerTimestamp();

    const NULL_LIVRE = new EmbedBuilder()
      .setColor("Purple")
      .setDescription(`Jouer un live, pas de données à afficher 🎧`);

    if (timestamp.progress == "Infini")
      return interaction.reply({ embeds: [NULL_LIVRE] });

    const Good = new EmbedBuilder()
      .setColor("Purple")
      .setDescription(`${progress} (**${timestamp.progress}**%)`);

    interaction.reply({ embeds: [Good] });
  },
};
