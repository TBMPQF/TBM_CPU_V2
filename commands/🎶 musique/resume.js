const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "resume",
  description: "丨Relancer la musique.",
  permission: "Aucune",
  dm: false,

  async execute(bot, interaction) {
    const queue = player.getQueue(interaction.guild.id);

    const NULL = new EmbedBuilder()
      .setColor("Purple")
      .setDescription(`Aucune musique en cours de lecture... ❌`);

    if (!queue) return interaction.reply({ embeds: [NULL] });

    const success = queue.setPaused(false);

    const Good = new EmbedBuilder()
      .setColor("Purple")
      .setDescription(
        success
          ? `Musique actuelle ${queue.current.title} a repris ✅`
          : `Quelque chose s'est mal passé... ❌`
      );

    return interaction.reply({ embeds: [Good] });
  },
};
