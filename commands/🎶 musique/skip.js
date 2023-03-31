const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "skip",
  description: "丨Passer la musique actuelle.",
  permission: "Aucune",
  dm: false,

  async execute(interaction) {
    const queue = player.getQueue(interaction.guild.id);

    const NULL = new EmbedBuilder()
      .setColor("Purple")
      .setDescription(`Aucune musique en cours de lecture... ❌`);

    if (!queue || !queue.playing) return interaction.reply({ embeds: [NULL] });

    const success = queue.skip();

    const Good = new EmbedBuilder()
      .setColor("Purple")
      .setDescription(
        success
          ? `Musique actuelle ${queue.current.title} passée ✅`
          : `Quelque chose s'est mal passé... ❌`
      );

    return interaction.reply({ embeds: [Good] });
  },
};
