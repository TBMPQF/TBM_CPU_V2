const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "back",
  description: "丨Revenir à l'ancienne musique.",
  category: "🔊 Music",
  permission: "Aucune",
  dm: false,

  async execute(bot, interaction) {
    const queue = player.getQueue(interaction.guild.id);

    const NULL = new EmbedBuilder()
      .setColor("Purple")
      .setDescription(`Aucune musique en cours de lecture... ❌`);

    const NULL_QUEUE = new EmbedBuilder()
      .setColor("Purple")
      .setDescription(`Il n'y avait pas de musique jouée avant... ❌`);

    if (!queue || !queue.playing) return interaction.reply({ embeds: [NULL] });

    if (!queue.previousTracks[1])
      return interaction.reply({ embeds: [NULL_QUEUE] });

    await queue.back();

    const Good = new EmbedBuilder()
      .setColor("Purple")
      .setDescription(`Je joue l'ancien son ✅`);

    interaction.reply({ embeds: [Good] });
  },
};
