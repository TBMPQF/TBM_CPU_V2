const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "clearplaylist",
  description: "丨Supprime la liste d'attente.",
  permission: "Aucune",
  dm: false,

  async execute(interaction) {
    const queue = player.getQueue(interaction.guild.id);

    const NULL = new EmbedBuilder()
      .setColor("Purple")
      .setDescription(`Il n'y a aucune musique en cours de lecture... ❌`);

    const NULL_QUEUE = new EmbedBuilder()
      .setColor("Purple")
      .setDescription(
        `Pas de musique dans la file d'attente après celle en cours... ❌`
      );

    if (!queue || !queue.playing) return interaction.reply({ embeds: [NULL] });

    if (!queue.tracks[0]) return interaction.reply({ embeds: [NULL_QUEUE] });

    await queue.clear();

    const Good = new EmbedBuilder()
      .setColor("Purple")
      .setDescription(`La file d'attente vient d'être vidée 🗑️`);

    interaction.reply({ embeds: [Good] });
  },
};
