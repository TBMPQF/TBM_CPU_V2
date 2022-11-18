const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "nowplaying",
  description: "丨Infos sur la musique en cours de lecture.",
  category: "🔊 Music",
  permission: "Aucune",
  dm: false,

  async execute(bot, interaction) {
    const queue = player.getQueue(interaction.guild.id);

    const NULL = new EmbedBuilder()
      .setColor("Purple")
      .setDescription(`Aucune musique en cours de lecture... ❌`);

    if (!queue || !queue.playing) return interaction.reply({ embeds: [NULL] });

    const track = queue.current;

    const embed = new EmbedBuilder();

    embed.setColor("Purple");
    embed.setThumbnail(track.thumbnail);
    embed.setAuthor({
      name: track.title,
      iconURL: interaction.user.displayAvatarURL({ size: 1024, dynamic: true }),
    });

    const methods = ["désactivé", "track", "queue"];

    const timestamp = queue.getPlayerTimestamp();
    const trackDuration =
      timestamp.progress == "Infinity" ? "infinity (live)" : track.duration;

    embed.setDescription(
      `Volume **${
        queue.volume
      }**%\nDurée **${trackDuration}**\nMode répétition **${
        methods[queue.repeatMode]
      }**\nDemander par ${track.requestedBy}`
    );

    interaction.reply({ embeds: [embed] });
  },
};
